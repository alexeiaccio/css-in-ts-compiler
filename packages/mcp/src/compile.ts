// compile: a module through the real cssints plugin, as test/run.mjs does: a Vite dev server in middleware mode (no
// watcher, no HMR socket) per project root, made on the first call and kept for the session. The project's own
// vite.config is loaded when there is one (its aliases, its cssints() options), else the plugin alone. The project's
// copies of `vite` and `cssints/vite` are used when installed, ours otherwise.
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { Context, Effect, Layer, Option, Predicate, Result, Schema, Semaphore } from "effect";
import type { Plugin, Rollup, ViteDevServer } from "vite";

import { ToolError } from "./check.ts";

type Vite = typeof import("vite");
type Cssints = { default: () => Plugin[] };
interface Session {
  readonly server: ViteDevServer;
  readonly plugin: Plugin;
  readonly sheet: (ids: string[]) => string;
  readonly sources: Map<string, string>;
  readonly warnings: { file: string; message: string }[];
}

interface Found {
  plugin?: Plugin;
}

const CONFIGS = ["ts", "mts", "js", "mjs"].map((e) => `vite.config.${e}`);

// The project's install of a package, else ours.
const importFrom = <A>(root: string, spec: string) => {
  const there = Option.getOrUndefined(
    Result.getSuccess(Result.try(() => createRequire(join(root, "package.json")).resolve(spec))),
  );
  return Effect.tryPromise({
    try: () => (there ? import(pathToFileURL(there).href) : import(spec)) as Promise<A>,
    catch: (e) => new ToolError({ message: `cannot load ${spec}: ${String(e)}` }),
  });
};

// What a dev server does after an edit of `file`: the plugin's hotUpdate (it says contrast warnings again, forgets what
// the modules that depend on the file registered), outside an HMR update, so with a context of its environment only.
const edited = (plugin: Plugin, client: ViteDevServer["environments"]["client"], file: string) => {
  const hook = plugin.hotUpdate;
  const handler = Predicate.isFunction(hook) ? hook : hook?.handler;
  const ctx = { environment: client } as ThisParameterType<NonNullable<typeof handler>>;
  const update = { file, modules: [] } as unknown as Parameters<NonNullable<typeof handler>>[0];
  void handler?.call(ctx, update);
};

const open = Effect.fn("mcp.compile.open")(function* (root: string) {
  const vite = yield* importFrom<Vite>(root, "vite");
  const config = CONFIGS.some((c) => existsSync(join(root, c)));
  const own = config ? [] : (yield* importFrom<Cssints>(root, "cssints/vite")).default();
  const sources = new Map<string, string>();
  const warnings: Session["warnings"] = [];
  const found: Found = {};
  // Source text for a file that need not exist; the plugin's warnings, kept with the file they belong to.
  const mcp: Plugin = {
    name: "cssints-mcp",
    enforce: "pre",
    configResolved(c) {
      const plugin = c.plugins.find((p) => p.name === "cssints");
      const t = plugin?.transform;
      const handler = Predicate.isFunction(t) ? t : t?.handler;
      if (!plugin || !handler) return;
      found.plugin = plugin;
      const wrapped = function (
        this: Rollup.TransformPluginContext,
        code: string,
        id: string,
        options?: Parameters<typeof handler>[2],
      ) {
        const file = id.replace(/\?.*$/, "");
        const ctx = Object.create(this, {
          warn: {
            value: (w: string | { message: string }) =>
              warnings.push({ file, message: Predicate.isString(w) ? w : w.message }),
          },
        }) as Rollup.TransformPluginContext;
        return handler.call(ctx, code, id, options);
      };
      Object.assign(plugin, {
        transform: Predicate.isFunction(t) ? wrapped : { ...t, handler: wrapped },
      });
    },
    resolveId(id) {
      const abs = id.startsWith("/@fs/") ? id.slice(4) : id;
      for (const f of [abs, join(root, abs)]) if (sources.has(f)) return f;
    },
    load(id) {
      return sources.get(id);
    },
  };
  const server = yield* Effect.tryPromise({
    try: () =>
      vite.createServer({
        root,
        ...(config ? {} : { configFile: false }),
        customLogger: Object.assign(vite.createLogger("warn"), {
          info: (m: string) => process.stderr.write(`${m}\n`),
          warn: (m: string) => process.stderr.write(`${m}\n`),
          warnOnce: (m: string) => process.stderr.write(`${m}\n`),
        }),
        server: { middlewareMode: true, watch: null, ws: false, hmr: false },
        optimizeDeps: { noDiscovery: true },
        plugins: [mcp, ...own],
      }),
    catch: (e) => new ToolError({ message: `cannot start Vite in ${root}: ${String(e)}` }),
  });
  const { plugin } = found;
  if (!plugin) {
    yield* Effect.promise(() => server.close());
    return yield* new ToolError({
      message: `${root}: its Vite config has no cssints() plugin (cssints/vite)`,
    });
  }
  const api = plugin.api as { sheet: Session["sheet"] };
  return { server, plugin, sheet: api.sheet, sources, warnings } satisfies Session;
});

const CLASSES = /"(_[\w-]+(?: _[\w-]+)*)"/g;

export const Thrown = Schema.Struct({
  message: Schema.String,
  loc: Schema.optional(
    Schema.Struct({
      file: Schema.optional(Schema.String),
      line: Schema.Finite,
      column: Schema.Finite,
    }),
  ),
});
const decodeThrown = Schema.decodeUnknownOption(Thrown);

// A build error as Vite hands it over: `loc` is the call site, its column 0-based (given here 1-based).
export const located = (t: typeof Thrown.Type, file: string) => {
  const at = t.loc
    ? { file: t.loc.file ?? file, line: t.loc.line, column: t.loc.column + 1 }
    : { file, line: undefined, column: undefined };
  return {
    message: t.message,
    ...at,
    location: at.line === undefined ? at.file : `${at.file}:${at.line}:${at.column}`,
  };
};

// A support warning is said when its class is first registered (macro.ts: once per class per process, as a dev server
// says it once), so a second compile of the same declaration would be silent. Kept per class: the classes whose rules in
// the module's CSS hold the warning's `property:value`.
// ponytail: matched by text in the sheet; a value the sheet prints otherwise than the warning loses its memo.
const SUPPORT = /^([\w-]+): .* in "(.*)" is not supported by /;
const rulesOf = (css: string, cls: string) =>
  [...css.matchAll(new RegExp(`\\.${cls}(?![\\w-])[^{]*\\{([^}]*)\\}`, "g"))].map((m) => m[1]!);

/** The Vite servers of the session, one per project root, closed when the session ends. */
export class Compiler extends Context.Service<
  Compiler,
  {
    readonly compile: (input: {
      readonly file: string;
      readonly source?: string | undefined;
      readonly root?: string | undefined;
    }) => Effect.Effect<CompileResult, ToolError>;
  }
>()("@cssints/mcp/compile/Compiler") {
  static readonly layer = Layer.effect(
    Compiler,
    Effect.gen(function* () {
      const sessions = new Map<string, Session>();
      const lock = Semaphore.makeUnsafe(1);
      const said = new Map<string, Set<string>>();
      yield* Effect.addFinalizer(() =>
        Effect.promise(() => Promise.all([...sessions.values()].map((s) => s.server.close()))),
      );
      const session = Effect.fnUntraced(function* (root: string) {
        const known = sessions.get(root);
        if (known) return known;
        const s = yield* open(root);
        sessions.set(root, s);
        return s;
      });
      const compile = Effect.fn("mcp.compile")(function* (input: {
        readonly file: string;
        readonly source?: string | undefined;
        readonly root?: string | undefined;
      }) {
        const root = resolve(input.root ?? process.cwd());
        const file = resolve(root, input.file);
        if (input.source === undefined && !existsSync(file))
          return yield* new ToolError({ message: `${file} does not exist` });
        const { server, plugin, sheet, sources, warnings } = yield* session(root);
        const inside = !relative(root, file).startsWith("..") && !isAbsolute(relative(root, file));
        const url = inside ? `/${relative(root, file)}` : `/@fs${file}`;
        const client = server.environments.client;
        const run = Effect.gen(function* () {
          // As after an edit on a dev server: every module read again, warnings said again.
          yield* Effect.sync(() => {
            for (const env of Object.values(server.environments)) env.moduleGraph.invalidateAll();
            edited(plugin, client, file);
            warnings.length = 0;
            if (input.source !== undefined) sources.set(file, input.source);
          });
          const out = yield* Effect.tryPromise(() => client.transformRequest(url)).pipe(
            Effect.map((r) => ({ code: r?.code ?? "", error: undefined })),
            Effect.catch((e) =>
              Effect.succeed({
                code: "",
                error: located(
                  Option.getOrElse(decodeThrown(e.cause), () => ({ message: String(e.cause) })),
                  file,
                ),
              }),
            ),
          );
          const css = out.error ? "" : yield* Effect.sync(() => sheet([file]));
          const classes = [...new Set([...out.code.matchAll(CLASSES)].map((m) => m[1]!))];
          const fresh = warnings.splice(0);
          const each = [...new Set(classes.flatMap((c) => c.split(" ")))];
          for (const w of fresh) {
            const m = SUPPORT.exec(w.message);
            if (!m) continue;
            for (const c of each)
              if (rulesOf(css, c).some((r) => r.includes(`${m[1]}:${m[2]}`)))
                (said.get(c) ?? said.set(c, new Set()).get(c)!).add(w.message);
          }
          const again = each.flatMap((c) => [...(said.get(c) ?? [])]);
          const messages = new Set(fresh.map((w) => w.message));
          return {
            ok: !out.error,
            file,
            classes,
            css,
            code: out.code,
            errors: out.error ? [out.error] : [],
            warnings: [
              ...fresh,
              ...[...new Set(again)].flatMap((message) =>
                messages.has(message) ? [] : [{ file, message }],
              ),
            ],
          };
        });
        return yield* lock
          .withPermit(run)
          .pipe(Effect.ensuring(Effect.sync(() => sources.delete(file))));
      });
      return Compiler.of({ compile });
    }),
  );
}

export interface CompileResult {
  readonly ok: boolean;
  readonly file: string;
  readonly classes: string[];
  readonly css: string;
  readonly code: string;
  readonly errors: {
    message: string;
    file: string;
    line?: number | undefined;
    column?: number | undefined;
    location: string;
  }[];
  readonly warnings: { file: string; message: string }[];
}
