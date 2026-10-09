// Dev only: the server side of @cssints/devtools (docs/research/devtools.md "Our devtools"). The overlay asks for the table
// over Vite's HMR channel; the table is built from the plugin's own records at that moment: the entries of every client
// module (`usedBy`, the sheet is rendered from them as `load()` does), the sites of each module (`callsOf`, recorded beside
// `siteOf`) and the registry. After a client transform the overlay is told the table is stale, and asks again when it needs it.
import { relative } from "node:path";
import { gzipSync } from "node:zlib";

import { Effect, Formatter } from "effect";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";

import { Registry } from "./registry.ts";
import { LAYERS, layerStatements, renderSheet } from "./sheet.ts";

/** A `css.*` call of a client module: where it is (1-based line, 0-based column) and the class names it produced. */
export interface DevSite {
  line: number;
  column: number;
  classes: string[];
  /** the source of the call, as written */
  text: string;
}

/** What the dev server knows of a class: its rule as the sheet prints it, the tokens it reads, the plugin it belongs to. */
export interface ClassRecord {
  kind: "class" | "marker" | "group";
  layer: string;
  /** the at-rule preludes around the rule, outermost first */
  wrap: string[];
  prop: string;
  /** the style rule, `._x:hover{color:red}`; a marker's is its kernel's css */
  css: string;
  tokens: string[];
  /** the scope of a member's class (`frame`), the kernel of a marker (`frame.core`) */
  plugin?: string;
  /** indexes into `DevTable.sites` */
  sites: number[];
}

/** The payload of `cssints:devtools`. */
export interface DevTable {
  root: string;
  /** the sheet as `load()` of virtual:cssints.css renders it, before LightningCSS */
  sheet: string;
  /** top-level layers in rank order; the engine's are `_.k` to `_.e` */
  layers: string[];
  classes: Record<string, ClassRecord>;
  sites: (DevSite & { file: string })[];
  tokens: Record<string, { path: string; value: string }>;
}

export const DEVTOOLS_ID = "virtual:cssints/devtools";
const RESOLVED = `\0${DEVTOOLS_ID}`;
const SHEET = "\0virtual:cssints.css";
const GROUP = /^_g(-[\w-]+)?$/;

const table = Effect.fn("cssints.devtoolsTable")(function* (
  root: string,
  usedBy: Map<string, string>,
  callsOf: Map<string, DevSite[]>,
) {
  const { rules, kernels, defs, scopes, layers } = yield* Registry;
  const entries = [...new Set([...usedBy.values()].flatMap((s) => s.split("\n")))];
  const sheet = yield* renderSheet(entries);
  const classes: Record<string, ClassRecord> = {};
  for (const cls of entries) {
    const r = rules.get(cls);
    if (!r) continue;
    const scope = r.prop.startsWith("--")
      ? [...scopes.keys()].find((s) => r.prop.startsWith(`--${s}-`))
      : undefined;
    classes[cls] = {
      kind: "class",
      layer: r.layer,
      wrap: r.wrap,
      prop: r.prop,
      css: r.css,
      tokens: r.tokens ?? [],
      ...(scope ? { plugin: scope } : {}),
      sites: [],
    };
  }
  for (const [key, k] of kernels)
    for (const m of k.markers)
      classes[m] = {
        kind: "marker",
        layer: "_.k",
        wrap: [],
        prop: "",
        css: k.kernel.css,
        tokens: [],
        plugin: key,
        sites: [],
      };
  const sites: DevTable["sites"] = [];
  for (const [file, calls] of callsOf) {
    if (!usedBy.has(file)) continue;
    for (const call of calls) {
      const known = call.classes.filter((c) => {
        if (!classes[c] && GROUP.test(c))
          classes[c] = {
            kind: "group",
            layer: "",
            wrap: [],
            prop: "",
            css: "",
            tokens: [],
            sites: [],
          };
        return !!classes[c];
      });
      if (!known.length) continue;
      const n = sites.push({ ...call, file, classes: known }) - 1;
      for (const c of known) classes[c]!.sites.push(n);
    }
  }
  const tokens: DevTable["tokens"] = {};
  for (const [name, d] of defs) tokens[name] = { path: d.path, value: d.value };
  const statements = (before: boolean) =>
    layerStatements([...layers.values()].flatMap((l) => (l.before === before ? [l.names] : [])));
  const engine = LAYERS.slice("@layer ".length, -1).split(", ");
  const order = [...statements(true).flat(), ...engine, ...statements(false).flat()];
  return {
    root,
    sheet,
    layers: [...new Set(order)],
    classes,
    sites,
    tokens,
  } satisfies DevTable;
});

// The module the page loads: the overlay of @cssints/devtools, connected to this server.
const entryModule = (overlay: string | undefined, root: string) =>
  overlay
    ? `import { mount } from ${Formatter.formatJson(overlay)};
const hot = import.meta.hot;
mount({
  root: ${Formatter.formatJson(root)},
  request: () => hot.send("cssints:devtools:get"),
  on: (event, listener) => hot.on(event, listener),
});
`
    : `console.warn("cssints: devtools is on, but @cssints/devtools/overlay is not installed (or not built): add @cssints/devtools to the devDependencies of the app");\n`;

/**
 * The dev-only plugin of `cssints({ devtools: true })`: the overlay's entry in every HTML page, and the table on request.
 * `apply: "serve"`, so a build has none of it.
 * @param {Map<string, string>} usedBy the entries of each client module (plugin.ts)
 * @param {Map<string, DevSite[]>} callsOf the sites of each client module
 * @returns {Plugin} the plugin
 */
export const devtoolsPlugin = (
  usedBy: Map<string, string>,
  callsOf: Map<string, DevSite[]>,
): Plugin => {
  let server: ViteDevServer | undefined;
  // the overlay debounces these: a cold page load transforms every module once
  const stale = () =>
    Effect.sync(() => server?.environments.client.hot.send("cssints:devtools:stale"));
  const entry = Effect.fn("cssints.devtoolsEntry")(function* (
    resolve: () => Promise<{ id: string } | null>,
  ) {
    const overlay = yield* Effect.tryPromise(resolve).pipe(Effect.orElseSucceed(() => null));
    return entryModule(overlay?.id, server?.config.root ?? "");
  });
  return {
    name: "cssints:devtools",
    apply: "serve",
    configureServer(s) {
      server = s;
      s.environments.client.hot.on("cssints:devtools:get", (_, client) =>
        client.send("cssints:devtools", Effect.runSync(table(s.config.root, usedBy, callsOf))),
      );
    },
    transformIndexHtml: () => [
      { tag: "script", attrs: { type: "module", src: `/@id/${DEVTOOLS_ID}` }, injectTo: "body" },
    ],
    resolveId(id) {
      if (id === DEVTOOLS_ID) return RESOLVED;
    },
    load(id) {
      if (id !== RESOLVED) return;
      return Effect.runPromise(
        entry(() => this.resolve("@cssints/devtools/overlay", undefined, { skipSelf: true })),
      );
    },
    transform: {
      order: "post",
      handler(_, id) {
        if (this.environment.name === "client" && (id === SHEET || callsOf.has(id)))
          Effect.runSync(stale());
      },
    },
  };
};

// The table in the placeholder's place: the file name of the asset, known once every module is transformed.
const TABLE_FILE = "__CSSINTS_DEVTOOLS_TABLE__";

// The module a build puts in every page: a button and Alt+Shift+C, and nothing else. The first open loads the overlay (a chunk of
// its own) and the table (a JSON asset), and hands them to `mount` as a transport that never says "stale".
const loaderModule = (overlay: string, base: string) => `const key = (e) => {
  if (e.altKey && e.shiftKey && e.code === "KeyC") {
    e.preventDefault();
    open();
  }
};
const button = document.createElement("button");
button.textContent = "cssints";
button.title = "cssints devtools (Alt+Shift+C)";
button.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:2147483647;padding:4px 8px;border:1px solid #374151;border-radius:999px;background:#111827;color:#e5e7eb;font:11px ui-monospace,monospace;cursor:pointer;opacity:.75";
button.onclick = () => open();
const open = () => {
  button.remove();
  removeEventListener("keydown", key, true);
  import(${Formatter.formatJson(overlay)}).then(({ mount }) => {
    const listeners = {};
    mount({
      root: "",
      build: true,
      request: () => fetch(new URL(${Formatter.formatJson(base)} + "${TABLE_FILE}", document.baseURI))
        .then((r) => r.json())
        .then((table) => listeners["cssints:devtools"]?.(table)),
      on: (event, listener) => { listeners[event] = listener; },
    });
  });
};
addEventListener("keydown", key, true);
document.body.append(button);
`;

const kb = (n: number) => `${(n / 1024).toFixed(1)} kB`;

/**
 * The build side of `cssints({ devtools: "build" })`: the overlay in every page behind a button, the table as a JSON asset.
 * Nothing loads until the first open. The files of the sites are relative to the root, so the asset holds no path of this machine.
 * @param {Map<string, string>} usedBy the entries of each client module (plugin.ts)
 * @param {Map<string, DevSite[]>} callsOf the sites of each client module
 * @returns {Plugin} the plugin
 */
export const devtoolsBuildPlugin = (
  usedBy: Map<string, string>,
  callsOf: Map<string, DevSite[]>,
): Plugin => {
  let config: ResolvedConfig;
  return {
    name: "cssints:devtools-build",
    apply: "build",
    configResolved(c) {
      config = c;
    },
    transformIndexHtml: {
      order: "pre",
      handler: () => [
        { tag: "script", attrs: { type: "module", src: DEVTOOLS_ID }, injectTo: "body" },
      ],
    },
    resolveId(id) {
      if (id === DEVTOOLS_ID) return RESOLVED;
    },
    load(id) {
      if (id !== RESOLVED) return;
      return Effect.runPromise(
        Effect.tryPromise(() =>
          this.resolve("@cssints/devtools/overlay", undefined, { skipSelf: true }),
        ).pipe(
          Effect.orElseSucceed(() => null),
          Effect.map((overlay) =>
            overlay
              ? loaderModule(overlay.id, config.base)
              : `console.warn("cssints: devtools is on, but @cssints/devtools/overlay is not installed: add @cssints/devtools to the devDependencies of the app");\n`,
          ),
        ),
      );
    },
    generateBundle(_, bundle) {
      if (this.environment.name !== "client") return;
      const chunks = Object.values(bundle).flatMap((f) => (f.type === "chunk" ? [f] : []));
      const loader = chunks.find((c) => c.code.includes(TABLE_FILE));
      if (!loader) return;
      const t = Effect.runSync(table(config.root, usedBy, callsOf));
      const json = Formatter.formatJson({
        ...t,
        root: "",
        sites: t.sites.map((s) => ({ ...s, file: relative(config.root, s.file) })),
      });
      const ref = this.emitFile({ type: "asset", name: "cssints-devtools.json", source: json });
      const file = this.getFileName(ref);
      loader.code = loader.code.replace(TABLE_FILE, () => file);
      const overlay = chunks.find((c) => c.isDynamicEntry && c.code.includes("cssints-devtools"));
      this.info(
        `devtools: ${file} ${kb(Buffer.byteLength(json))} (${kb(gzipSync(json).length)} gzip)` +
          (overlay
            ? `, ${overlay.fileName} ${kb(Buffer.byteLength(overlay.code))} (${kb(gzipSync(overlay.code).length)} gzip), loaded on the first open`
            : ""),
      );
    },
  };
};
