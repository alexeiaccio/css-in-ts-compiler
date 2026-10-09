// Dev only: the server side of @cssints/devtools (docs/research/devtools.md "Our devtools"). The overlay asks for the table
// over Vite's HMR channel; the table is built from the plugin's own records at that moment: the entries of every client
// module (`usedBy`, the sheet is rendered from them as `load()` does), the sites of each module (`callsOf`, recorded beside
// `siteOf`) and the registry. After a client transform the overlay is told the table is stale, and asks again when it needs it.
import { Effect, Formatter } from "effect";
import type { Plugin, ViteDevServer } from "vite";

import { Registry } from "./registry.ts";
import { LAYERS, layerStatements, renderSheet } from "./sheet.ts";

/** A `css.*` call of a client module: where it is (1-based line, 0-based column) and the class names it produced. */
export interface DevSite {
  line: number;
  column: number;
  classes: string[];
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
      const n = sites.push({ file, line: call.line, column: call.column, classes: known }) - 1;
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
