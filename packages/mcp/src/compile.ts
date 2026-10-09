// compile: a module through the real cssints plugin, as test/run.mjs does: a Vite dev server in middleware mode (no
// watcher, no HMR socket) per project root, made on the first call and kept for the session. The project's own
// vite.config is loaded when there is one (its aliases, its cssints() options), else the plugin alone. The project's
// copies of `vite` and `cssints/vite` are used when installed, ours otherwise.
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { Context, Effect, Layer, Option, Predicate, Result, Semaphore } from "effect";
import type { Plugin, Rollup, ViteDevServer } from "vite";

import { ToolError } from "./check.ts";

type Vite = typeof import("vite");
type Cssints = { default: () => Plugin[] };
type Hook = (this: unknown, ...args: unknown[]) => unknown;
interface Session {
  readonly server: ViteDevServer;
  readonly plugin: Plugin;
  readonly sheet: (ids: string[]) => string;
  readonly sources: Map<string, string>;
  readonly warnings: { file: string; message: string }[];
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

const handlerOf = (hook: unknown): Hook | undefined =>
  Predicate.isFunction(hook)
    ? (hook as Hook)
    : Predicate.hasProperty(hook, "handler") && Predicate.isFunction(hook.handler)
      ? (hook.handler as Hook)
      : undefined;

const open = Effect.fn("mcp.compile.open")(function* (root: string) {
  const vite = yield* importFrom<Vite>(root, "vite");
  const config = CONFIGS.some((c) => existsSync(join(root, c)));
  const own = config ? [] : (yield* importFrom<Cssints>(root, "cssints/vite")).default();
  const sources = new Map<string, string>();
  const warnings: Session["warnings"] = [];
  let plugin: Plugin | undefined;
  // Source text for a file that need not exist; the plugin's warnings, kept with the file they belong to.
  const mcp: Plugin = {
    name: "cssints-mcp",
    enforce: "pre",
    configResolved(c) {
      plugin = c.plugins.find((p) => p.name === "cssints");
      const t = plugin?.transform;
      const handler = handlerOf(t);
      if (!plugin || !handler) return;
      const wrapped = function (
        this: Rollup.TransformPluginContext,
        code: string,
        id: string,
        ...rest: unknown[]
      ) {
        const file = id.replace(/\?.*$/, "");
        const ctx = Object.create(this, {
          warn: {
            value: (w: string | { message: string }) =>
              warnings.push({ file, message: Predicate.isString(w) ? w : w.message }),
          },
        }) as Rollup.TransformPluginContext;
        return handler.call(ctx, code, id, ...rest);
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

const located = (e: unknown, file: string) => {
  const loc = Predicate.hasProperty(e, "loc") ? e.loc : undefined;
  const at = {
    file: Predicate.hasProperty(loc, "file") ? String(loc.file) : file,
    line: Predicate.hasProperty(loc, "line") ? Number(loc.line) : undefined,
    column: Predicate.hasProperty(loc, "column") ? Number(loc.column) + 1 : undefined,
  };
  const message = Predicate.hasProperty(e, "message") ? String(e.message) : String(e);
  return {
    message,
    ...at,
    location: at.line === undefined ? at.file : `${at.file}:${at.line}:${at.column}`,
  };
};

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
            const hot = handlerOf(plugin.hotUpdate);
            hot?.call({ environment: client }, { file, modules: [] });
            warnings.length = 0;
            if (input.source !== undefined) sources.set(file, input.source);
          });
          const out = yield* Effect.tryPromise(() => client.transformRequest(url)).pipe(
            Effect.map((r) => ({ code: r?.code ?? "", error: undefined })),
            Effect.catch((e) => Effect.succeed({ code: "", error: located(e.cause, file) })),
          );
          const css = out.error ? "" : yield* Effect.sync(() => sheet([file]));
          return {
            ok: !out.error,
            file,
            classes: [...new Set([...out.code.matchAll(CLASSES)].map((m) => m[1]!))],
            css,
            code: out.code,
            errors: out.error ? [out.error] : [],
            warnings: warnings.splice(0),
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
