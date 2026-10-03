// The Vite plugin. Every hook is an Effect program run at the hook boundary (`run`); Vite calls the hooks, so that
// edge stays plain. A failure surfaces as the tagged error itself, with `loc` set to the user's call (line and
// column of the css.* call, or of the bad import), which is what Vite's overlay and build errors show.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

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
  transformWithOxc,
  type ViteDevServer,
} from "vite";
import type { ModuleRunner } from "vite/module-runner";

import { verifyChecks } from "./contrast.ts";
import { evaluate, DomEvaluator } from "./evaluate.ts";
import { HookError, type PluginError, SiteMissingError } from "./errors.ts";
import { instrument, keptImport, RUNTIME, type Instrumented } from "./instrument.ts";
import { fallbackEntries, RUNTIME_ID, runtimeModule, runtimeNames } from "./delivery.ts";
import { kernelEntries } from "./kernel.ts";
import { forget, Registry } from "./registry.ts";
import { closeNames, globalNames, LAYERS, renderSheet, themedEntries } from "./sheet.ts";

export { instrument } from "./instrument.ts";
export { addGlobal, renderSheet } from "./sheet.ts";

const FILE_RE = /\.(ts|tsx|js|jsx|mts|mjs)$/;
const VERSION = /[?&]v=\w+$/;
const SHEET_IMPORT = "virtual:cssints.css";
const SHEET = `\0${SHEET_IMPORT}`;
// A dependency's file is a site module only when it carries the attribute (cssints' own dist and most of node_modules
// mention "cssints" without it): a package written on cssints, published with its attributes kept.
const ATTRIBUTE = /type\s*:\s*["']cssints["']/;
const marked = (code: string, id: string) =>
  code.includes(RUNTIME) && (!id.includes("node_modules") || ATTRIBUTE.test(code));

interface Manifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

// The direct dependencies of the app that depend on cssints (a package whose files carry the attribute imports
// "cssints", so it lists it). The optimizer and the ssr externalization would strip or never run the attributes of
// these, so they are excluded from both. A transitive one is not found: list it in the app's dependencies.
const packagesOnCssints = (root: string) =>
  Effect.sync(() => {
    const read = (file: string) => {
      try {
        return JSON.parse(readFileSync(file, "utf8")) as Manifest;
      } catch {
        return undefined;
      }
    };
    const app = read(join(root, "package.json"));
    const lookup = createRequire(join(root, "package.json")).resolve.paths(RUNTIME) ?? [];
    return Object.keys({ ...app?.dependencies, ...app?.devDependencies }).filter((name) => {
      const m = lookup.map((dir) => read(join(dir, name, "package.json"))).find(Boolean);
      return !!m && RUNTIME in { ...m.dependencies, ...m.peerDependencies };
    });
  });

const hash = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 8);

/** LightningCSS targets (css.lightningcss.targets) from the browserslist query of the support warnings. */
export const targets = browserslistToTargets(Effect.runSync(browsers()));

// The same query as esbuild-style names for Vite's `build.cssTarget`: Vite's CSS minify takes its targets from there, not
// from `css.lightningcss.targets`, and without them LightningCSS merges `min-height: 100vh; min-height: 100dvh` into one.
const ESBUILD: Record<string, string> = {
  ios_saf: "ios",
  ie: "ie",
  opera: "opera",
  edge: "edge",
  chrome: "chrome",
  firefox: "firefox",
  safari: "safari",
};
/** `build: { cssTarget }`, the browserslist query of the support warnings, so a minified build keeps `firstThatWorks` fallbacks. */
export const cssTarget = Effect.runSync(browsers()).flatMap((t) => {
  const [agent, version] = t.split(" ") as [string, string];
  return ESBUILD[agent] && /^\d/.test(version) ? [`${ESBUILD[agent]}${version.split("-")[0]}`] : [];
});

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
  let root = process.cwd();
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
      let runtimes: string[] = [];
      if (parsed.sites.every((_, n) => sites.has(n))) {
        const registry = yield* Registry;
        const { rules, properties, themed } = registry;
        const texts = [...sites.values()];
        const classes = texts.flatMap((r) =>
          [...r.matchAll(/"(_[\w-]+(?: _[\w-]+)*)"/g)].flatMap((m) => m[1]!.split(" ")),
        );
        // The tokens of the module: those its classes read, and those a site names (a token, a style). Their
        // @property rules are recorded as text, so an edit of an initial value changes what the module recorded.
        const kernels = kernelEntries(registry, id);
        const names = new Set([...texts, ...kernels].flatMap((r) => r.match(/--[\w-]+/g) ?? []));
        globalNames(themed, id).forEach((n) => names.add(n));
        for (const c of classes) rules.get(c)?.tokens?.forEach((n) => names.add(n));
        closeNames(names, registry.defs, themed);
        yield* record(id, [
          ...classes,
          ...[...names].flatMap((n) => properties.get(n)?.css ?? []),
          ...themedEntries(themed, id, names),
          ...kernels,
          ...(yield* fallbackEntries(registry, id)),
        ]);
        runtimes = runtimeNames(registry, id);
      }
      return { sites, runtimes };
    });
    const { sites, runtimes } = parsed.sites.length
      ? yield* evaluate(runner!, id, recorded).pipe(Effect.ensuring(flushWarnings(warn)))
      : yield* Effect.sync(() => forget(id)).pipe(Effect.andThen(recorded(new Map())));

    const ms = new MagicString(code);
    // The runtime of every plugin member a site holds: a module that decides at load what it contains.
    if (runtimes.length)
      ms.prepend(runtimes.map((n) => `import ${JSON.stringify(RUNTIME_ID + n)};\n`).join(""));
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
    for (const decl of parsed.imp.decls) {
      const kept = keptImport(decl, code);
      if (kept) ms.overwrite(decl.start, decl.end, kept);
      else ms.remove(decl.start, decl.end);
    }

    for (const dep of runnerDeps(env, id))
      (depsOf.get(dep) ?? depsOf.set(dep, new Set()).get(dep)!).add(id);
    return {
      code: ms.toString(),
      map: ms.generateMap({ hires: true, source: id, includeContent: true }),
    };
  });

  // The runner needs the module's top level to run, not its elements: JSX becomes calls of a no-op (`__jsx`, a binding of
  // DomEvaluator), whatever the framework plugin or `jsx` in tsconfig would make of it. Solid's DOM output would call
  // `template()` of its server runtime here, and `jsx: "preserve"` leaves syntax that Vite cannot analyse.
  const inertJsx = Effect.fn("cssints.inertJsx")(function* (
    code: string,
    id: string,
  ): Effect.fn.Return<string, HookError> {
    const jsx = { runtime: "classic", pragma: "__jsx", pragmaFrag: "__jsx" } as const;
    return yield* Effect.tryPromise({
      try: async () => (await transformWithOxc(code, id, { jsx })).code,
      catch: (cause) =>
        new HookError({ hook: "transform", message: `cssints: ${String(cause)}`, cause }),
    });
  });

  const transform = Effect.fn("cssints.transform")(function* (
    ctx: Rollup.TransformPluginContext,
    code: string,
    url: string,
  ) {
    // Vite serves a dependency's file as `…/index.mjs?v=<hash>`; the engine knows it by its file.
    const id = url.replace(VERSION, "");
    if (!FILE_RE.test(id)) return undefined;
    if (!marked(code, id)) {
      // The runner follows the imports of a module with sites, into components that have none: their JSX is inert as well.
      return ctx.environment.name === "ssr" && /[jt]sx$/.test(id) && !id.includes("node_modules")
        ? yield* inertJsx(code, id)
        : undefined;
    }
    if (ctx.environment.name === "ssr") {
      const out = yield* instrument(code, id);
      return out && /x$/.test(id) ? yield* inertJsx(out.code, id) : out?.code;
    }
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
          root,
          logLevel: "warn",
          // The scan would follow every import, attributed ones too, into build-time code (node:fs, plugin helpers).
          server: { middlewareMode: true, watch: null, hmr: false },
          optimizeDeps: { noDiscovery: true },
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
    // `warned` dedupes a build, which has an end; a dev server has none, so an edit starts the next round of warnings.
    const { warned } = yield* Registry;
    yield* Effect.sync(() => warned.clear());
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
    config(user) {
      const names = Effect.runSync(packagesOnCssints(resolve(user.root ?? process.cwd())));
      return { optimizeDeps: { exclude: names }, ssr: { noExternal: names } };
    },
    // The sheet of all (or the given) client modules transformed so far: test/run.mjs. A plain value for callers
    // that are not Effect programs (other plugins, tests).
    api: { sheet: (ids?: string[]) => Effect.runSync(sheet(ids)) },
    configResolved(config: ResolvedConfig) {
      build = config.command === "build";
      root = config.root;
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
      if (id.startsWith(RUNTIME_ID)) return `\0${id}`;
    },
    // Build: the rules are known only once every module is transformed, so a placeholder until renderChunk.
    load(id) {
      if (id === SHEET) return build ? LAYERS : Effect.runSync(sheet());
      if (id.startsWith(`\0${RUNTIME_ID}`))
        return Effect.runSync(runtimeModule(id.slice(RUNTIME_ID.length + 1)));
    },
    renderChunk(_, chunk) {
      return run(renderChunk(this, chunk));
    },
    // Before every plugin that compiles JSX (Solid's, a Babel one), wherever the user lists them.
    transform: {
      order: "pre",
      handler(code, id) {
        return run(
          transform(this, code, id).pipe(Effect.catch((e: PluginError) => locate(e, code, id))),
        );
      },
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
