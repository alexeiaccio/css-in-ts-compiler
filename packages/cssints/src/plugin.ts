// The Vite plugin. Every hook is an Effect program run at the hook boundary (`run`); Vite calls the hooks, so that
// edge stays plain. A failure surfaces as the tagged error itself, with `loc` set to the user's call (line and
// column of the css.* call, or of the bad import), which is what Vite's overlay and build errors show.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";

import { browsers } from "@cssints/css-grammar/browsers";
import { type Target, targets as targetsOf } from "@cssints/css-grammar/support";
import { Cause, Effect, Exit, Formatter, Option, Predicate, Result, Schema } from "effect";
import { browserslistToTargets } from "lightningcss";
import MagicString from "magic-string";
import {
  createFilter,
  createServer,
  createServerModuleRunner,
  type EnvironmentModuleNode,
  type InlineConfig,
  normalizePath,
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
import { instrument, runtimeImport, RUNTIME, type Instrumented, writeSite } from "./instrument.ts";
import {
  type DevSite,
  devtoolsBuildPlugin,
  devtoolsPlugin,
  type OpenCodeOptions,
} from "./devtools-server.ts";
import { RUNTIME_ID, runtimeModule } from "./delivery.ts";
import { moduleEntries } from "./entries.ts";
import { forget, forgetWarnings, Registry } from "./registry.ts";
import { LAYERS, renderSheet } from "./sheet.ts";
import { closeTrace, hook, runPromiseExit, runSync, warned } from "./trace.ts";

export type { DevTable, OpenCodeOptions } from "./devtools-server.ts";
export { instrument } from "./instrument.ts";
export { addGlobal, addLayers, globalEntries, layerEntries, renderSheet } from "./sheet.ts";

const FILE_RE = /\.(ts|tsx|js|jsx|mts|mjs)$/;
const VERSION = /[?&]v=\w+$/;
const SHEET_IMPORT = "virtual:cssints.css";
const SHEET = `\0${SHEET_IMPORT}`;
// A dependency's file is a site module only when it carries the attribute (cssints' own dist and most of node_modules
// mention "cssints" without it): a package written on cssints, published with its attributes kept.
const ATTRIBUTE = /type\s*:\s*["']cssints["']/;
const marked = (code: string, id: string) =>
  code.includes(RUNTIME) && (!id.includes("node_modules") || ATTRIBUTE.test(code));

const Deps = Schema.optional(Schema.Record(Schema.String, Schema.String));
const Manifest = Schema.fromJsonString(
  Schema.Struct({ dependencies: Deps, devDependencies: Deps, peerDependencies: Deps }),
);
const decodeManifest = Schema.decodeUnknownOption(Manifest);

// The direct dependencies of the app that depend on cssints (a package whose files carry the attribute imports
// "cssints", so it lists it). The optimizer and the ssr externalization would strip or never run the attributes of
// these, so they are excluded from both. A transitive one is not found: list it in the app's dependencies.
const packagesOnCssints = (root: string) =>
  Effect.sync(() => {
    const read = (file: string) =>
      Option.getOrUndefined(
        Option.flatMap(
          Result.getSuccess(Result.try(() => readFileSync(file, "utf8"))),
          decodeManifest,
        ),
      );
    const app = read(join(root, "package.json"));
    const lookup = createRequire(join(root, "package.json")).resolve.paths(RUNTIME) ?? [];
    return Object.keys({ ...app?.dependencies, ...app?.devDependencies }).filter((name) => {
      const m = lookup.map((dir) => read(join(dir, name, "package.json"))).find(Boolean);
      return !!m && Object.hasOwn({ ...m.dependencies, ...m.peerDependencies }, RUNTIME);
    });
  });

const hash = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 8);

/**
 * LightningCSS targets (css.lightningcss.targets) from the browserslist config of process.cwd(), read when vite.config.ts
 * imports this module: the support warnings read the one of the Vite root, the same unless the root is elsewhere.
 */
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
/** `build: { cssTarget }`, the browserslist query of `targets`, so a minified build keeps `firstThatWorks` fallbacks. */
export const cssTarget = Effect.runSync(browsers()).flatMap((t) => {
  const [agent, version] = t.split(" ") as [string, string];
  return ESBUILD[agent] && /^\d/.test(version) ? [`${ESBUILD[agent]}${version.split("-")[0]}`] : [];
});

// ---------- the hook boundary

// Runs a hook's program; a failure is thrown as the error itself.
const run = <A>(program: Effect.Effect<A, PluginError>) =>
  runPromiseExit(program).then((exit) => {
    if (Exit.isSuccess(exit)) return exit.value;
    throw Cause.squash(exit.cause);
  });

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

type Loc = ReturnType<typeof lineCol>;
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
// One field of a source map segment, base64 VLQ.
const vlq = (n: number) => {
  let v = n < 0 ? (-n << 1) | 1 : n << 1;
  let s = "";
  do {
    const d = v & 31;
    v >>>= 5;
    s += B64[v ? d | 32 : d];
  } while (v);
  return s;
};

// A source map of the sheet: each selector that holds a class points at the first css.* call that made it (`siteOf`:
// client module -> class -> place), any other selector or at-rule prelude maps nowhere. Dev: the sheet as cssints prints
// it, so with `css.devSourcemap` Chrome's Styles pane names that file and line beside the rule. Build: the CSS asset as
// Vite wrote it (Vite writes no CSS map in build), so bundle analysers attribute its bytes to the modules.
const sheetMap = (
  text: string,
  siteOf: Map<string, Map<string, Loc>>,
  source = (file: string) => file,
) => {
  const first = new Map<string, [string, Loc]>();
  // by path, not by the order of the transforms, so two builds write the same map
  for (const [file, at] of [...siteOf].sort(([a], [b]) => (a < b ? -1 : 1)))
    for (const [cls, loc] of at) if (!first.has(cls)) first.set(cls, [file, loc]);
  const sources: string[] = [];
  let prev = [0, 0, 0];
  const mappings = text.split("\n").map((l) => {
    const segs: string[] = [];
    let col = 0;
    let mapped = false;
    for (const m of l.matchAll(/(?<=^|[{};])\s*([^{};\s][^{};]*)(?=\{)/g)) {
      const at = m.index + m[0].length - m[1]!.length;
      const hit = [...m[1]!.matchAll(/\.(_[\w-]+)/g)].map((c) => first.get(c[1]!)).find(Boolean);
      if (!hit && !mapped) continue; // a line starts unmapped
      let out = vlq(at - col);
      if (hit) {
        const [file, { line, column }] = hit;
        const name = source(file);
        const src = sources.includes(name) ? sources.indexOf(name) : sources.push(name) - 1;
        const seg = [src, line - 1, column];
        out += seg.map((x, i) => vlq(x - prev[i]!)).join("");
        prev = seg;
      }
      segs.push(out);
      col = at;
      mapped = !!hit;
    }
    return segs.join(",");
  });
  return { version: 3, sources, names: [], mappings: mappings.join(";") };
};

// Gives a failure the `id` and `loc` of its call site. The site may be in another file than the one being
// transformed (a helper module the evaluation loaded): that one is read from disk. Vite builds the code frame.
const locate = Effect.fn("cssints.locate")(function* (
  e: PluginError,
  code: string,
  id: string,
): Effect.fn.Return<never, PluginError> {
  const file = Predicate.hasProperty(e, "file") && e.file ? e.file : id;
  if (Predicate.hasProperty(e, "offset") && e.offset !== undefined) {
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

export default function cssints({
  inner = false,
  exclude,
  devtools = false,
  opencode = false,
}: {
  inner?: boolean;
  /**
   * Files the plugin leaves alone, in Vite's filter style (`createFilter`: a picomatch glob, a RegExp or an array of them;
   * a relative glob is read from the working directory). Today's rule stays: a file outside node_modules that mentions "cssints" is
   * a site module, so a package of plugins or the engine's own sources that a project bundles as code is excluded here.
   */
  exclude?: string | RegExp | ReadonlyArray<string | RegExp>;
  /**
   * The inspector of @cssints/devtools in every page (Alt+Shift+C), which must be installed. `true`: dev only; `"build"`:
   * a build too, with the table as a static asset and the overlay in a chunk that loads on the first open.
   */
  devtools?: boolean | "build";
  /**
   * Dev only, with `devtools`: the overlay gets a prompt box for the picked element. The dev server (never the page) starts a
   * session on the running OpenCode service, in the app's repository, with a prompt made of the element's call sites, cascade
   * and tokens plus the instruction. Needs `@opencode/client` installed. Off by default; a build has none of it.
   */
  opencode?: boolean | OpenCodeOptions;
} = {}): Plugin[] {
  // an empty list would match everything as `include`
  const excluded = [exclude ?? []].flat().length ? createFilter(exclude) : () => false;
  let server: ViteDevServer | undefined; // dev server (dev) or a private one (build)
  let ownServer = false;
  let runner: ModuleRunner | undefined; // private runner with DOM bindings; server.environments.ssr.runner stays untouched
  let build = false;
  let root = process.cwd();
  let rootTargets: Target[] | undefined; // the browserslist config of `root`: the support checks of every evaluation
  let cssPlugins: (Plugin | undefined)[] = []; // vite:css, vite:css-post: in build they take the sheet in renderChunk
  let resolveOf: Pick<InlineConfig, "resolve" | "environments"> = {}; // the app's, for the evaluation server of a build
  const usedBy = new Map<string, string>(); // client module id -> its classes and @property rules, sorted, one a line
  const depsOf = new Map<string, Set<string>>(); // dependency file -> Set<client module id>
  const inflight = new Set<string>(); // client module ids inside transform: their deps are not in depsOf yet
  const siteOf = new Map<string, Map<string, Loc>>(); // dev, or build.sourcemap: client module id -> class -> its first site (sheetMap)
  let buildMap: ResolvedConfig["build"]["sourcemap"] = false; // build.sourcemap of a build: the CSS assets get a map
  const callsOf = new Map<string, DevSite[]>(); // dev with devtools: client module id -> its sites, in order

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

  // A module that no longer imports cssints: what its last run left is forgotten as a re-run forgets it, and its rules
  // leave the sheet (a module without the import is not transformed here, so nothing else would).
  const drop = Effect.fnUntraced(function* (id: string) {
    if (!usedBy.delete(id)) return;
    forget(id);
    siteOf.delete(id);
    callsOf.delete(id);
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

  // Each warning goes to Vite at the site that made it (`loc`: Vite prints the file, line and column and a code frame);
  // `code` is the text of `id`, a site in another file is read from disk.
  const flushWarnings = Effect.fnUntraced(function* (
    warn: (w: Rollup.RollupLog) => void,
    id?: string,
    code?: string,
  ) {
    const { warnings } = yield* Registry;
    const ws = warnings.splice(0);
    for (const { message, at } of ws) {
      const file = at?.file ?? id;
      const text =
        at === undefined
          ? undefined
          : at.file === id
            ? code
            : yield* Effect.tryPromise(() => readFile(at.file, "utf8")).pipe(
                Effect.orElseSucceed(() => undefined),
              );
      const loc =
        at && text !== undefined ? { file: at.file, ...lineCol(text, at.offset) } : undefined;
      yield* Effect.sync(() => warn({ message, ...(file && { id: file }), ...(loc && { loc }) }));
    }
    yield* warned(
      ws.map((w) => w.message),
      id,
    );
  });

  const clientTransform = Effect.fn("cssints.clientTransform")(function* (
    code: string,
    id: string,
    parsed: Instrumented,
    env: ViteDevServer["environments"]["ssr"],
    warn: (w: Rollup.RollupLog) => void,
    watch: (file: string) => void,
  ) {
    const recorded = Effect.fnUntraced(function* (sites: Map<number, string>) {
      let runtimes: string[] = [];
      // what the evaluation read through dependsOn(), taken inside the lock as the sites are
      const files = parsed.sites.length ? [...(yield* Registry).files] : [];
      if (parsed.sites.every((_, n) => sites.has(n))) {
        const made = yield* moduleEntries(id, sites);
        yield* record(id, made.entries);
        runtimes = made.runtimes;
      }
      return { sites, runtimes, files };
    });
    const { sites, runtimes, files } = parsed.sites.length
      ? yield* evaluate(runner!, id, recorded, rootTargets).pipe(
          Effect.ensuring(flushWarnings(warn, id, code)),
        )
      : yield* Effect.sync(() => forget(id)).pipe(Effect.andThen(recorded(new Map())));
    if (!build || buildMap || devtools === "build") {
      const at = new Map<string, Loc>();
      for (const [n, s] of parsed.sites.entries()) {
        const loc = lineCol(code, s.start);
        for (const m of sites.get(n)?.matchAll(/_[\w-]+/g) ?? [])
          if (!at.has(m[0])) at.set(m[0], loc);
      }
      siteOf.set(id, at);
      if (devtools)
        callsOf.set(
          id,
          parsed.sites.map((s, n) => ({
            ...lineCol(code, s.start),
            classes: sites.get(n)?.match(/_[\w-]+/g) ?? [],
            text: code.slice(s.start, s.end),
          })),
        );
    }

    const ms = new MagicString(code);
    // The runtime of every plugin member a site holds: a module that decides at load what it contains.
    if (runtimes.length)
      ms.prepend(runtimes.map((n) => `import ${Formatter.formatJson(RUNTIME_ID + n)};\n`).join(""));
    // A cv() site and a cn() with runtime arguments are calls of the runtime: its import is the plugin's, not the user's.
    ms.prepend(runtimeImport(sites.values()));
    for (const [n, s] of parsed.sites.entries()) {
      const replacement = sites.get(n);
      if (replacement === undefined)
        return yield* new SiteMissingError({
          message: `cssints: site ${n} in ${id} was not evaluated`,
          file: id,
          site: n,
          offset: s.start,
        });
      writeSite(ms, s, replacement);
    }
    // Build-time imports are gone from the client.
    for (const decl of parsed.imp.decls) ms.remove(decl.start, decl.end);

    // Before the result is returned, so before Vite caches it (runner.qnt `depsOfKnown`); in flight, `inflight` stands in.
    for (const dep of runnerDeps(env, id))
      (depsOf.get(dep) ?? depsOf.set(dep, new Set()).get(dep)!).add(id);
    for (const file of files) {
      const dep = normalizePath(resolve(file));
      (depsOf.get(dep) ?? depsOf.set(dep, new Set()).get(dep)!).add(id);
      yield* Effect.sync(() => watch(dep));
    }
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
      try: () => transformWithOxc(code, id, { jsx }).then((r) => r.code),
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
    if (!FILE_RE.test(id) || excluded(id)) return undefined;
    if (!marked(code, id)) {
      if (ctx.environment.name === "client") yield* drop(id);
      // The runner follows the imports of a module with sites, into components that have none: their JSX is inert as well.
      return ctx.environment.name === "ssr" &&
        (inner || !build) &&
        /[jt]sx$/.test(id) &&
        !id.includes("node_modules")
        ? yield* inertJsx(code, id)
        : undefined;
    }
    // The ssr environment is where sites are evaluated: the dev server's, and the private server of a build (`inner`). The
    // ssr environment of a build (`vite build --ssr`, a terminal app for Bun) is an output, transformed as a client.
    if (ctx.environment.name === "ssr" && (inner || !build)) {
      const out = yield* instrument(code, id, false);
      return out && /x$/.test(id) ? yield* inertJsx(out.code, id) : out?.code;
    }
    if (inner) return undefined;

    const parsed = yield* instrument(code, id);
    if (!parsed) return undefined;
    const env = server!.environments.ssr;
    // No runner HMR: its full-reload re-imports would run outside the evaluation lock.
    // Stack traces are mapped when an error makes one: Vite's default turns on Node's source map cache, which reads the map
    // of every module body at load (~3 ms each).
    runner ??= createServerModuleRunner(env, {
      hmr: false,
      sourcemapInterceptor: "prepareStackTrace",
      evaluator: new DomEvaluator(),
    });
    inflight.add(id);
    // dependsOn() files: watched by rollup in `vite build --watch`, by the dev server's watcher in dev (ctx.addWatchFile
    // there would make the file an import of the client module).
    const watch = (file: string) =>
      build ? ctx.addWatchFile(file) : void server!.watcher.add(file);
    return yield* clientTransform(code, id, parsed, env, (w) => ctx.warn(w), watch).pipe(
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
          ...resolveOf,
          plugins: [cssints({ inner: true, exclude })],
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
    // `vite build --watch` builds again: its buildStart starts a new server, with a new runner
    server = runner = undefined;
    ownServer = false;
  });

  // Before vite:css-post's renderChunk joins the chunk's CSS: run the sheet through vite:css (LightningCSS) and
  // hand it to vite:css-post in place of the placeholder, as UnoCSS does. Its minify runs on the joined CSS.
  const renderChunk = Effect.fn("cssints.renderChunk")(function* (
    ctx: Rollup.PluginContext,
    chunk: Rollup.RenderedChunk,
  ): Effect.fn.Return<null, HookError> {
    if (inner || !Object.hasOwn(chunk.modules, SHEET)) return null;
    const [css, cssPost] = cssPlugins;
    const text = yield* sheet();
    const via = (plugin: Plugin | undefined, code: string) =>
      Effect.tryPromise({
        try: () => callTransform(plugin, ctx, code),
        catch: (cause) =>
          new HookError({
            hook: "renderChunk",
            message: `cssints: the sheet failed in Vite's CSS pipeline: ${String(cause)}`,
            cause,
          }),
      });
    const r = (yield* via(css, text).pipe(Effect.withSpan("cssints.lightningcss"))) as
      | { code?: string }
      | null
      | undefined;
    yield* via(cssPost, r?.code ?? text).pipe(Effect.withSpan("cssints.cssPost"));
    return null;
  });

  // build.sourcemap: Vite emits CSS assets without a map, so each one that holds classes of the sheet gets one here, on its
  // final text, as Vite does for JS (true: a `.map` file and a comment, "hidden": the file only, "inline": a data URL).
  const emitMaps = Effect.fn("cssints.generateBundle")(function* (
    ctx: Rollup.PluginContext,
    bundle: Rollup.OutputBundle,
    dir: string,
  ) {
    for (const asset of Object.values(bundle)) {
      if (asset.type !== "asset" || !asset.fileName.endsWith(".css")) continue;
      const text = Predicate.isString(asset.source)
        ? asset.source
        : new TextDecoder().decode(asset.source);
      const at = resolve(dir, asset.fileName, "..");
      const map = {
        ...sheetMap(text, siteOf, (file) => relative(at, file.replace(/\?.*/, ""))),
        file: basename(asset.fileName),
      };
      if (!map.sources.length) continue;
      const json = Formatter.formatJson(map);
      const url =
        buildMap === "inline"
          ? `data:application/json;base64,${Buffer.from(json).toString("base64")}`
          : `${map.file}.map`;
      if (buildMap !== "inline")
        yield* Effect.sync(() =>
          ctx.emitFile({ type: "asset", fileName: `${asset.fileName}.map`, source: json }),
        );
      if (buildMap !== "hidden") asset.source = `${text}\n/*# sourceMappingURL=${url} */`;
    }
  });

  // The end of a build: every contrast check again, over the themes of every module (a module that came after the check).
  const buildEnd = Effect.fn("cssints.buildEnd")(function* (warn: (w: Rollup.RollupLog) => void) {
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
    // A build says a warning once per file of its site; a dev server, which has no end, again once that file is edited
    // (and the modules that run it are transformed again): not on every update of an unrelated module.
    yield* Effect.sync(() => forgetWarnings([file]));
    const graph = env.moduleGraph;
    const affected = [...new Set([...(depsOf.get(file) ?? []), ...inflight])].flatMap(
      (id) => graph.getModuleById(id) ?? [],
    );
    // HMR invalidation alone would still let Vite cache (and reuse) a result that is being computed now. What these modules
    // registered is stale and they run again: a scope that this edit changed has no user of its old content left (scope.ts).
    yield* Effect.sync(() =>
      affected.forEach((m) => {
        graph.invalidateModule(m);
        if (m.id) forget(m.id);
      }),
    );
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
    // `forgetWarnings`: the warnings of the sites in `files` (every file, without it) are said again by the next
    // transform that runs them, as after an edit of those files (@cssints/mcp `compile`).
    api: {
      sheet: (ids?: string[]) => Effect.runSync(sheet(ids)),
      forgetWarnings: (files?: string[]) => forgetWarnings(files),
    },
    configResolved(config: ResolvedConfig) {
      build = config.command === "build";
      buildMap = build && !inner && config.build.sourcemap;
      root = config.root;
      if (!inner) rootTargets = Effect.runSync(targetsOf(undefined, root));
      // A dev server evaluates in its ssr environment, so with the app's aliases and conditions; a build's private server
      // gets them too (cssints-qnif).
      const ssr = config.environments.ssr?.resolve;
      resolveOf = {
        resolve: { alias: config.resolve.alias },
        ...(ssr && {
          environments: {
            ssr: {
              resolve: { conditions: ssr.conditions, externalConditions: ssr.externalConditions },
            },
          },
        }),
      };
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
      if (inner) return;
      if (build) forgetWarnings(); // `vite build --watch`: each build says its warnings
      if (server) return;
      return run(hook("vite.buildStart", root, startServer()));
    },
    buildEnd() {
      if (build && !inner)
        return run(
          hook(
            "vite.buildEnd",
            root,
            buildEnd((w) => this.warn(w)),
          ),
        );
    },
    closeBundle() {
      return run(hook("vite.closeBundle", root, stopServer())).then(() =>
        inner ? undefined : closeTrace(),
      );
    },
    resolveId(id) {
      if (id === SHEET_IMPORT) return SHEET;
      if (id.startsWith(RUNTIME_ID)) return `\0${id}`;
    },
    // Build: the rules are known only once every module is transformed, so a placeholder until renderChunk.
    load(id) {
      if (id === SHEET) {
        if (build) return LAYERS;
        const code = runSync(hook("vite.load", id, sheet()));
        return { code, map: sheetMap(code, siteOf) };
      }
      if (id.startsWith(`\0${RUNTIME_ID}`))
        return runSync(runtimeModule(id.slice(RUNTIME_ID.length + 1)));
    },
    renderChunk(_, chunk) {
      return run(hook("vite.renderChunk", chunk.fileName, renderChunk(this, chunk)));
    },
    // After vite:css-post, which emits the CSS asset of a build without code splitting here.
    generateBundle: {
      order: "post",
      handler(out, bundle) {
        if (buildMap)
          runSync(
            hook(
              "vite.generateBundle",
              root,
              emitMaps(this, bundle, resolve(root, out.dir ?? "dist")),
            ),
          );
      },
    },
    // Before every plugin that compiles JSX (Solid's, a Babel one), wherever the user lists them.
    transform: {
      order: "pre",
      handler(code, id) {
        return run(
          hook(
            "vite.transform",
            id,
            transform(this, code, id).pipe(Effect.catch((e: PluginError) => locate(e, code, id))),
            this.environment.name,
          ),
        );
      },
    },
    hotUpdate({ file, modules }) {
      return runSync(hook("vite.hotUpdate", file, hotUpdate(this.environment, file, modules)));
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
          return `${code}\nimport.meta.hot.send("cssints:sheet", ${Formatter.formatJson(hash(code))});`;
      },
    },
  };
  if (!devtools || inner) return [main, version];
  const dev = devtoolsPlugin(
    usedBy,
    callsOf,
    opencode ? (opencode === true ? {} : opencode) : undefined,
  );
  return devtools === "build"
    ? [main, version, dev, devtoolsBuildPlugin(usedBy, callsOf)]
    : [main, version, dev];
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
