// Dev only: the server side of @cssints/devtools (docs/research/devtools.md "Our devtools"). The overlay asks for the table
// over Vite's HMR channel; the table is built from the plugin's own records at that moment: the entries of every client
// module (`usedBy`, the sheet is rendered from them as `load()` does), the sites of each module (`callsOf`, recorded beside
// `siteOf`) and the registry. After a client transform the overlay is told the table is stale, and asks again when it needs it.
import { existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { gzipSync } from "node:zlib";

import { Data, Effect, Formatter, Option, Predicate, Schema } from "effect";
import type { Plugin, ViteDevServer } from "vite";

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

/** `cssints({ devtools: true, opencode })`: the OpenCode session the overlay's prompt box starts. */
export interface OpenCodeOptions {
  /** the agent of the session (OpenCode's default for a new session otherwise) */
  agent?: string;
  /** the ids of OpenCode skills the prompt loads */
  skills?: string[];
}

const ASK = "cssints:devtools:ask";
const ASKED = "cssints:devtools:asked";
const LINK = "cssints:devtools:link";
const LINKED = "cssints:devtools:linked";
// the browser builds a bounded prompt (@cssints/devtools core/prompt.ts); the server bounds it once more
const MAX_PROMPT = 16_000;
const Asking = Schema.Struct({ ref: Schema.Finite, prompt: Schema.String });

/** What the server tells the overlay (`cssints:devtools:asked`). */
interface Asked {
  ref: number;
  status: string;
  id?: string;
  message?: string;
}

class OpenCodeError extends Data.TaggedError("OpenCodeError")<{
  readonly status: "unavailable" | "failed";
  readonly message: string;
  /** OpenCode is simply not running (the overlay says how to start it), as against a client that is missing */
  readonly idle?: boolean;
}> {}

/** What the server tells the overlay to a probe (`cssints:devtools:linked`). */
interface Linked {
  connected: boolean;
  url?: string;
  directory: string;
  message?: string;
}

// The repository of the app is the workspace of the session: the nearest folder up from the Vite root with a `.git`.
const workspace = (root: string) =>
  root
    .split(sep)
    .map((_, i, parts) => parts.slice(0, parts.length - i).join(sep) || sep)
    .find((dir) => existsSync(join(dir, ".git"))) ?? root;

// The client of the running OpenCode V2 service (`opencode serve --service` registers one), found as OpenCode's own clients
// find it. @cssints/devtools talks to it from here and never from the page: the page holds no address and no credentials.
const connect = Effect.fn("cssints.opencodeConnect")(function* () {
  const unavailable = (message: string) => () =>
    new OpenCodeError({ status: "unavailable", message });
  const { OpenCode } = yield* Effect.tryPromise({
    try: () => import("@opencode/client"),
    catch: unavailable(
      "opencode is on, but @opencode/client is not installed: add it to the devDependencies of the app",
    ),
  });
  const { Service } = yield* Effect.tryPromise({
    try: () => import("@opencode/client/service"),
    catch: unavailable(
      "opencode is on, but @opencode/client is not installed: add it to the devDependencies of the app",
    ),
  });
  const service = yield* Effect.tryPromise({
    try: () => Service.discover(),
    catch: (e) => unavailable(Predicate.isError(e) ? e.message : String(e))(),
  });
  if (!service)
    return yield* new OpenCodeError({
      status: "unavailable",
      idle: true,
      message:
        "No OpenCode service is running. Start OpenCode (or `opencode serve --service`) and send again.",
    });
  return {
    url: service.url,
    client: OpenCode.make({ baseUrl: service.url, headers: Service.headers(service) }),
  };
});

// The probe: is a service found? No session is created.
const link = Effect.fn("cssints.opencodeLink")(function* (root: string) {
  const directory = workspace(root);
  return yield* connect().pipe(
    Effect.map(({ url }) => ({ connected: true, url, directory }) satisfies Linked),
    Effect.catchTag("OpenCodeError", (e) =>
      Effect.succeed({
        connected: false,
        directory,
        ...(e.idle ? {} : { message: e.message }),
      } satisfies Linked),
    ),
  );
});

// One prompt: a session in the workspace, the prompt, then the outcome. `say` tells the overlay each step.
const ask = Effect.fn("cssints.opencodeAsk")(function* (
  root: string,
  options: OpenCodeOptions,
  ref: number,
  prompt: string,
  say: (asked: Asked) => void,
) {
  const { client } = yield* connect();
  const call = <A>(f: () => Promise<A>) =>
    Effect.tryPromise({
      try: f,
      catch: (e) =>
        new OpenCodeError({
          status: "failed",
          message: Predicate.isError(e) ? e.message : String(e),
        }),
    });
  const { id } = yield* call(() =>
    client.session.create({
      title: "cssints devtools: UI change",
      ...(options.agent ? { agent: options.agent } : {}),
      location: { directory: workspace(root) },
    }),
  );
  say({ ref, status: "running", id });
  yield* call(() =>
    client.session.prompt({
      sessionID: id,
      text: prompt.slice(0, MAX_PROMPT),
      ...(options.skills?.length ? { skills: options.skills.map((s) => ({ id: s })) } : {}),
    }),
  );
  yield* call(() => client.session.wait({ sessionID: id }));
  const { outcome } = yield* call(() => client.session.get({ sessionID: id }));
  say({ ref, status: outcome === "succeeded" ? "completed" : (outcome ?? "failed"), id });
});

// The module the page loads: the overlay of @cssints/devtools, connected to this server.
const entryModule = (overlay: string | undefined, root: string, opencode: boolean) =>
  overlay
    ? `import { mount } from ${Formatter.formatJson(overlay)};
const hot = import.meta.hot;
mount({
  root: ${Formatter.formatJson(root)},
  request: () => hot.send("cssints:devtools:get"),
  on: (event, listener) => hot.on(event, listener),${opencode ? `\n  ask: (ref, prompt) => hot.send("${ASK}", { ref, prompt }),\n  link: () => hot.send("${LINK}"),` : ""}
});
`
    : `console.warn("cssints: devtools is on, but @cssints/devtools/overlay is not installed (or not built): add @cssints/devtools to the devDependencies of the app");\n`;

/**
 * The dev-only plugin of `cssints({ devtools: true })`: the overlay's entry in every HTML page, and the table on request.
 * `apply: "serve"`, so a build has none of it.
 * @param {Map<string, string>} usedBy the entries of each client module (plugin.ts)
 * @param {Map<string, DevSite[]>} callsOf the sites of each client module
 * @param {OpenCodeOptions | undefined} opencode set: the overlay's prompt box starts OpenCode sessions through this server
 * @returns {Plugin} the plugin
 */
export const devtoolsPlugin = (
  usedBy: Map<string, string>,
  callsOf: Map<string, DevSite[]>,
  opencode?: OpenCodeOptions,
): Plugin => {
  let server: ViteDevServer | undefined;
  // the overlay debounces these: a cold page load transforms every module once
  const stale = () =>
    Effect.sync(() => server?.environments.client.hot.send("cssints:devtools:stale"));
  const entry = Effect.fn("cssints.devtoolsEntry")(function* (
    resolve: () => Promise<{ id: string } | null>,
  ) {
    const overlay = yield* Effect.tryPromise(resolve).pipe(Effect.orElseSucceed(() => null));
    return entryModule(overlay?.id, server?.config.root ?? "", !!opencode);
  });
  return {
    name: "cssints:devtools",
    apply: "serve",
    configureServer(s) {
      server = s;
      s.environments.client.hot.on("cssints:devtools:get", (_, client) =>
        client.send("cssints:devtools", Effect.runSync(table(s.config.root, usedBy, callsOf))),
      );
      // the HMR channel, not a route: it carries Vite's own token, so a page of another origin cannot start a session
      if (opencode) {
        s.environments.client.hot.on(LINK, () =>
          Effect.runFork(
            link(s.config.root).pipe(
              Effect.map((linked) => s.environments.client.hot.send(LINKED, linked)),
            ),
          ),
        );
        s.environments.client.hot.on(ASK, (data) => {
          const asking = Schema.decodeUnknownOption(Asking)(data);
          if (Option.isNone(asking)) return;
          const { ref, prompt } = asking.value;
          const say = (asked: Asked) => s.environments.client.hot.send(ASKED, asked);
          Effect.runFork(
            ask(s.config.root, opencode, ref, prompt, say).pipe(
              Effect.catchTag("OpenCodeError", (e) =>
                Effect.sync(() => say({ ref, status: e.status, message: e.message })),
              ),
            ),
          );
        });
      }
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
export const devtoolsBuildPlugin = (usedBy: Map<string, string>, callsOf: Map<string, DevSite[]>) =>
  ({
    name: "cssints:devtools-build",
    apply: "build",
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
              ? loaderModule(overlay.id, this.environment.config.base)
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
      const { root } = this.environment.config;
      const t = Effect.runSync(table(root, usedBy, callsOf));
      const json = Formatter.formatJson({
        ...t,
        root: "",
        sites: t.sites.map((s) => ({ ...s, file: relative(root, s.file) })),
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
  }) satisfies Plugin;
