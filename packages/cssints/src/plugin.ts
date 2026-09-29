// The Vite plugin. Every hook is an Effect program run at the hook boundary (`run`); Vite calls the hooks, so that
// edge stays plain. A failure surfaces as the tagged error itself, with `loc` set to the user's call (line and
// column of the css.* call, or of the bad import), which is what Vite's overlay and build errors show.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { browsers } from "@cssints/css-grammar/browsers";
import { Cause, Effect, Exit } from "effect";
import { browserslistToTargets } from "lightningcss";
import MagicString from "magic-string";
import {
  createServer,
  createServerModuleRunner,
  type EnvironmentModuleNode,
  type Plugin,
  type ResolvedConfig,
  type Rollup,
  type ViteDevServer,
} from "vite";
import type { ModuleRunner } from "vite/module-runner";

import { verifyChecks } from "./contrast.ts";
import { evaluate, DomEvaluator } from "./evaluate.ts";
import { HookError, type PluginError, SiteMissingError } from "./errors.ts";
import { instrument, RUNTIME, type Instrumented } from "./instrument.ts";
import { forget, Registry } from "./registry.ts";
import { LAYERS, renderSheet, themedEntries } from "./sheet.ts";

export { instrument } from "./instrument.ts";
export { addGlobal, renderSheet } from "./sheet.ts";

const FILE_RE = /\.(ts|tsx|js|jsx|mts|mjs)$/;
const SHEET_IMPORT = "virtual:cssints.css";
const SHEET = `\0${SHEET_IMPORT}`;
const hash = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 8);

/** LightningCSS targets (css.lightningcss.targets) from the browserslist query of the support warnings. */
export const targets = browserslistToTargets(Effect.runSync(browsers()));

// ---------- the hook boundary

// Runs a hook's program; a failure is thrown as the error itself.
const run = async <A>(program: Effect.Effect<A, PluginError>): Promise<A> => {
  const exit = await Effect.runPromiseExit(program);
  if (Exit.isSuccess(exit)) return exit.value;
  throw Cause.squash(exit.cause);
};

// 1-based line, 0-based column of an offset, as Vite's `loc`.
const lineCol = (text: string, offset: number) => {
  let line = 1;
  let lineStart = 0;
  for (let i = text.indexOf("\n"); i !== -1 && i < offset; i = text.indexOf("\n", i + 1)) {
    line++;
    lineStart = i + 1;
  }
  return { line, column: offset - lineStart };
};

// Gives a failure the `id` and `loc` of its call site. The site may be in another file than the one being
// transformed (a helper module the evaluation loaded): that one is read from disk. Vite builds the code frame.
const locate = Effect.fn("cssints.locate")(function* (
  e: PluginError,
  code: string,
  id: string,
): Effect.fn.Return<never, PluginError> {
  const file = "file" in e && e.file ? e.file : id;
  if ("offset" in e && e.offset !== undefined) {
    const text =
      file === id
        ? code
        : yield* Effect.tryPromise(() => readFile(file, "utf8")).pipe(
            Effect.orElseSucceed(() => undefined),
          );
    if (text !== undefined)
      Object.assign(e, { id: file, loc: { file, ...lineCol(text, e.offset) } });
  }
  return yield* e;
});

// ---------- the plugin

export default function cssints({ inner = false }: { inner?: boolean } = {}): Plugin[] {
  let server: ViteDevServer | undefined; // dev server (dev) or a private one (build)
  let ownServer = false;
  let runner: ModuleRunner | undefined; // private runner with DOM bindings; server.environments.ssr.runner stays untouched
  let build = false;
  let cssPlugins: (Plugin | undefined)[] = []; // vite:css, vite:css-post: in build they take the sheet in renderChunk
  const usedBy = new Map<string, string>(); // client module id -> its classes and @property rules, sorted, one a line
  const depsOf = new Map<string, Set<string>>(); // dependency file -> Set<client module id>
  const inflight = new Set<string>(); // client module ids inside transform: their deps are not in depsOf yet

  // The helpers below run at most a few times per module: untraced. The hook-level programs (transform,
  // clientTransform, evaluate, renderChunk, ...) are the traced boundaries.
  const sheet = Effect.fnUntraced(function* (
    ids: string[] = [...usedBy.keys()],
  ): Effect.fn.Return<string> {
    return yield* renderSheet(ids.flatMap((id) => usedBy.get(id)?.split("\n") ?? []));
  });

  // Dev: the next request of the sheet loads it again, and the browser gets an HMR update.
  const reloadSheet = Effect.fnUntraced(function* () {
    yield* Effect.sync(() => {
      const env = server?.environments.client;
      const mod = env?.moduleGraph.getModuleById(SHEET);
      if (!env || !mod) return;
      env.moduleGraph.invalidateModule(mod); // as in hotUpdate: a sheet transform in flight is not cached
      void env.reloadModule(mod);
    });
  });

  // Called inside the evaluation lock, so the last write for a module comes from its latest evaluation (runner.qnt `rules`).
  const record = Effect.fnUntraced(function* (id: string, classes: string[]) {
    const s = [...new Set(classes)].sort().join("\n");
    if (usedBy.get(id) === s) return;
    usedBy.set(id, s);
    yield* reloadSheet();
  });

  const runnerDeps = (
    env: ViteDevServer["environments"]["ssr"],
    id: string,
    out = new Set<string>(),
    seen = new Set<string>(),
  ) => {
    const mod = env.moduleGraph.getModuleById(id);
    if (!mod || seen.has(id)) return out;
    seen.add(id);
    for (const dep of mod.importedModules) {
      if (!dep.file || dep.file.includes("node_modules")) continue;
      out.add(dep.file);
      runnerDeps(env, dep.id ?? "", out, seen);
    }
    return out;
  };

  const flushWarnings = Effect.fnUntraced(function* (warn: (w: string) => void) {
    const { warnings } = yield* Registry;
    yield* Effect.sync(() => warnings.splice(0).forEach(warn));
  });

  const clientTransform = Effect.fn("cssints.clientTransform")(function* (
    code: string,
    id: string,
    parsed: Instrumented,
    env: ViteDevServer["environments"]["ssr"],
    warn: (w: string) => void,
  ) {
    const recorded = Effect.fnUntraced(function* (sites: Map<number, string>) {
      if (parsed.sites.every((_, n) => sites.has(n))) {
        const { rules, properties, themed } = yield* Registry;
        const texts = [...sites.values()];
        const classes = texts.flatMap((r) =>
          [...r.matchAll(/"(_[a-z0-9]+(?: _[a-z0-9]+)*)"/g)].flatMap((m) => m[1]!.split(" ")),
        );
        // The tokens of the module: those its classes read, and those a site names (a token, a style). Their
        // @property rules are recorded as text, so an edit of an initial value changes what the module recorded.
        const names = new Set(texts.flatMap((r) => r.match(/--[\w-]+/g) ?? []));
        for (const c of classes) rules.get(c)?.tokens?.forEach((n) => names.add(n));
        yield* record(id, [
          ...classes,
          ...[...names].flatMap((n) => properties.get(n)?.css ?? []),
          ...themedEntries(themed, id),
        ]);
      }
      return sites;
    });
    const sites = parsed.sites.length
      ? yield* evaluate(runner!, id, recorded).pipe(Effect.ensuring(flushWarnings(warn)))
      : yield* Effect.sync(() => forget(id)).pipe(Effect.andThen(recorded(new Map())));

    const ms = new MagicString(code);
    for (const [n, s] of parsed.sites.entries()) {
      const replacement = sites.get(n);
      if (replacement === undefined)
        return yield* new SiteMissingError({
          message: `cssints: site ${n} in ${id} was not evaluated`,
          file: id,
          site: n,
          offset: s.start,
        });
      ms.overwrite(s.start, s.end, replacement);
    }
    // Build-time imports are gone from the client; runtime ones (cx, _cv) stay.
    for (const decl of parsed.imp.decls) ms.remove(decl.start, decl.end);

    for (const dep of runnerDeps(env, id))
      (depsOf.get(dep) ?? depsOf.set(dep, new Set()).get(dep)!).add(id);
    return {
      code: ms.toString(),
      map: ms.generateMap({ hires: true, source: id, includeContent: true }),
    };
  });

  const transform = Effect.fn("cssints.transform")(function* (
    ctx: Rollup.TransformPluginContext,
    code: string,
    id: string,
  ) {
    if (!FILE_RE.test(id) || id.includes("node_modules") || !code.includes(RUNTIME))
      return undefined;
    if (ctx.environment.name === "ssr") return (yield* instrument(code, id))?.code;
    if (inner) return undefined;

    const parsed = yield* instrument(code, id);
    if (!parsed) return undefined;
    const env = server!.environments.ssr;
    // No runner HMR: its full-reload re-imports would run outside the evaluation lock.
    runner ??= createServerModuleRunner(env, { hmr: false, evaluator: new DomEvaluator() });
    inflight.add(id);
    return yield* clientTransform(code, id, parsed, env, (w) => ctx.warn(w)).pipe(
      Effect.ensuring(Effect.sync(() => inflight.delete(id))),
    );
  });

  const startServer = Effect.fn("cssints.buildStart")(function* (): Effect.fn.Return<
    void,
    HookError
  > {
    server = yield* Effect.tryPromise({
      try: () =>
        createServer({
          configFile: false,
          root: process.cwd(),
          logLevel: "warn",
          server: { middlewareMode: true, watch: null, hmr: false },
          plugins: [cssints({ inner: true })],
        }),
      catch: (cause) =>
        new HookError({
          hook: "buildStart",
          message: `cssints: could not start the evaluation server: ${String(cause)}`,
          cause,
        }),
    });
    ownServer = true;
  });

  const stopServer = Effect.fn("cssints.closeBundle")(function* (): Effect.fn.Return<
    void,
    HookError
  > {
    if (!ownServer || !server) return;
    const s = server;
    yield* Effect.tryPromise({
      try: () => s.close(),
      catch: (cause) =>
        new HookError({
          hook: "closeBundle",
          message: `cssints: could not stop the evaluation server: ${String(cause)}`,
          cause,
        }),
    });
  });

  // Before vite:css-post's renderChunk joins the chunk's CSS: run the sheet through vite:css (LightningCSS) and
  // hand it to vite:css-post in place of the placeholder, as UnoCSS does. Its minify runs on the joined CSS.
  const renderChunk = Effect.fn("cssints.renderChunk")(function* (
    ctx: Rollup.PluginContext,
    chunk: Rollup.RenderedChunk,
  ): Effect.fn.Return<null, HookError> {
    if (inner || !(SHEET in chunk.modules)) return null;
    const [css, cssPost] = cssPlugins;
    const text = yield* sheet();
    yield* Effect.tryPromise({
      try: async () => {
        const r = (await callTransform(css, ctx, text)) as { code?: string } | null | undefined;
        await callTransform(cssPost, ctx, r?.code ?? text);
      },
      catch: (cause) =>
        new HookError({
          hook: "renderChunk",
          message: `cssints: the sheet failed in Vite's CSS pipeline: ${String(cause)}`,
          cause,
        }),
    });
    return null;
  });

  // The end of a build: every contrast check again, over the themes of every module (a module that came after the check).
  const buildEnd = Effect.fn("cssints.buildEnd")(function* (warn: (w: string) => void) {
    yield* verifyChecks(() => true).pipe(
      Effect.catch((e: PluginError) => locate(e, "", "")),
      Effect.ensuring(flushWarnings(warn)),
    );
  });

  const hotUpdate = Effect.fn("cssints.hotUpdate")(function* (
    env: { name: string; moduleGraph: ViteDevServer["environments"]["client"]["moduleGraph"] },
    file: string,
    modules: EnvironmentModuleNode[],
  ) {
    if (env.name !== "client") return undefined;
    const graph = env.moduleGraph;
    const affected = [...new Set([...(depsOf.get(file) ?? []), ...inflight])]
      .map((id) => graph.getModuleById(id))
      .filter((m): m is EnvironmentModuleNode => !!m);
    // HMR invalidation alone would still let Vite cache (and reuse) a result that is being computed now.
    yield* Effect.sync(() => affected.forEach((m) => graph.invalidateModule(m)));
    return [...modules, ...affected];
  });

  const main: Plugin = {
    name: "cssints",
    enforce: "pre",
    // The sheet of all (or the given) client modules transformed so far: test/run.mjs. A plain value for callers
    // that are not Effect programs (other plugins, tests).
    api: { sheet: (ids?: string[]) => Effect.runSync(sheet(ids)) },
    configResolved(config: ResolvedConfig) {
      build = config.command === "build";
      cssPlugins = ["vite:css", "vite:css-post"].map((n) =>
        config.plugins.find((p) => p.name === n),
      );
    },
    configureServer(s) {
      server = s;
      if (inner) return;
      // The browser drops an HMR update of a module that has not run yet: on a cold page load the sheet can be
      // fetched, and updated, while other modules are still in transform. The sheet reports what it got.
      s.environments.client.hot.on("cssints:sheet", (v: string) => {
        if (
          !s.environments.client.moduleGraph.getModuleById(SHEET)?.transformResult?.code.includes(v)
        )
          Effect.runSync(reloadSheet());
      });
    },
    buildStart() {
      if (inner || server) return;
      return run(startServer());
    },
    buildEnd() {
      if (build && !inner) return run(buildEnd((w) => this.warn(w)));
    },
    closeBundle() {
      return run(stopServer());
    },
    resolveId(id) {
      if (id === SHEET_IMPORT) return SHEET;
    },
    // Build: the rules are known only once every module is transformed, so a placeholder until renderChunk.
    load(id) {
      if (id === SHEET) return build ? LAYERS : Effect.runSync(sheet());
    },
    renderChunk(_, chunk) {
      return run(renderChunk(this, chunk));
    },
    transform(code, id) {
      return run(
        transform(this, code, id).pipe(Effect.catch((e: PluginError) => locate(e, code, id))),
      );
    },
    hotUpdate({ file, modules }) {
      return Effect.runSync(hotUpdate(this.environment, file, modules));
    },
  };
  // After import analysis: the sheet module tells the server which version it runs (see configureServer).
  const version: Plugin = {
    name: "cssints:sheet-version",
    apply: "serve",
    transform: {
      order: "post",
      handler(code, id) {
        if (id === SHEET && this.environment.name === "client")
          return `${code}\nimport.meta.hot.send("cssints:sheet", ${JSON.stringify(hash(code))});`;
      },
    },
  };
  return [main, version];
}

// vite:css and vite:css-post declare `transform` as { handler }; the plugin context of renderChunk stands in.
const callTransform = (
  plugin: Plugin | undefined,
  ctx: Rollup.PluginContext,
  code: string,
): Promise<unknown> => {
  const t = plugin?.transform;
  const handler = typeof t === "function" ? t : t?.handler;
  return Promise.resolve(handler?.call(ctx as Rollup.TransformPluginContext, code, SHEET));
};
