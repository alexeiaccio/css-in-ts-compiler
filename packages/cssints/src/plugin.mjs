import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { browsers } from "@cssints/css-grammar/browsers";
import { Data, Effect, Semaphore } from "effect";
import { Window } from "happy-dom";
import { browserslistToTargets } from "lightningcss";
import MagicString from "magic-string";
import { parseSync } from "oxc-parser";
import { createServer, createServerModuleRunner } from "vite";
import { ESModulesEvaluator, ssrModuleExportsKey } from "vite/module-runner";

const RUNTIME = "cssints";
const FILE_RE = /\.(ts|tsx|js|jsx|mts|mjs)$/;
const SHEET_IMPORT = "virtual:cssints.css";
const SHEET = `\0${SHEET_IMPORT}`;
const LAYERS = "@layer _.a, _.b, _.c, _.d, _.e;";
const hash = (s) => createHash("sha1").update(s).digest("hex").slice(0, 8);

/** LightningCSS targets (css.lightningcss.targets) from the browserslist query of the support warnings. */
export const targets = browserslistToTargets(browsers());

// ---------- the sheet: every rule once, sorted by layer, condition, shorthand before longhand, class

// A is a shorthand of B when every leaf longhand of B is among A's leaves (mdn-data `computed`; the direct lists
// miss border > border-top). More leaves first is a total order that keeps that relation.
const MDN = createRequire(import.meta.url)("mdn-data/css/properties.json");
const leaves = (p) => (p !== "all" && Array.isArray(MDN[p]?.computed) ? MDN[p].computed.flatMap(leaves) : [p]);
const WIDTH = new Map();
const width = (p) => WIDTH.get(p) ?? WIDTH.set(p, new Set(leaves(p)).size).get(p);

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const cmpCond = (a, b) => a.reduce((d, x, i) => d || (i < b.length ? x - b[i] : 0), 0) || a.length - b.length;
const byOrder = (a, b) => cmp(a.layer, b.layer) || cmpCond(a.cond, b.cond) || width(b.prop) - width(a.prop) || cmp(a.cls, b.cls);

export function renderSheet(classes) {
  const rules = globalThis.__cssints?.rules ?? new Map();
  const sorted = [...new Set(classes)].filter((c) => rules.has(c)).map((c) => ({ cls: c, ...rules.get(c) })).sort(byOrder);
  let out = `${LAYERS}\n`;
  sorted.forEach((r, i) => {
    if (r.layer !== sorted[i - 1]?.layer) out += `${i ? "}\n" : ""}@layer ${r.layer} {\n`;
    out += `  ${r.css}\n`;
  });
  return sorted.length ? `${out}}\n` : out;
}

// ---------- 1. instrument (ssr env): wrap every maximal css.* call in __site(file, n, ...)

const rootIdent = (n) =>
  n.type === "Identifier" ? n.name : n.type === "MemberExpression" ? rootIdent(n.object) : n.type === "CallExpression" ? rootIdent(n.callee) : null;

const RUNTIME_ONLY = new Set(["cx", "_cv"]);
const isSiteImport = (s) => s.attributes?.some((a) => (a.key.name ?? a.key.value) === "type" && a.value.value === "cssints");

// Every import `with { type: "cssints" }` (cssints, other packages, local helper modules) makes its bindings
// site roots. "cssints" without the attribute may only give runtime members. Returns null without site imports.
function findCssImport(program, code, id) {
  const locals = new Set();
  const decls = [];
  for (const s of program.body) {
    if (s.type !== "ImportDeclaration") continue;
    if (isSiteImport(s)) {
      decls.push(s);
      s.specifiers.forEach((x) => locals.add(x.local.name));
    } else if (s.source.value === RUNTIME) {
      const bad = s.specifiers.filter((x) => x.type !== "ImportSpecifier" || !RUNTIME_ONLY.has(x.imported.name ?? x.imported.value));
      if (!bad.length) continue;
      const names = bad.map((x) => code.slice(x.start, x.end));
      const fix = bad[0].type === "ImportNamespaceSpecifier" ? names[0] : `{ ${names.join(", ")} }`;
      throw new Error(`cssints: ${id} imports build-time ${names.join(", ")} from "cssints" without the attribute. Import it as: import ${fix} from "cssints" with { type: "cssints" }; (only cx and _cv are runtime)`);
    }
  }
  return locals.size ? { locals, decls } : null;
}

// Maximal css-rooted call expressions, with whether they sit inside a function body.
function findSites(program, locals) {
  const sites = [];
  const walk = (node, inFn) => {
    if (!node || typeof node.type !== "string") return;
    // `new CSSColorValue(...)` too: value constructors are sites, replaced by their CSS text.
    if ((node.type === "CallExpression" || node.type === "NewExpression") && locals.has(rootIdent(node.callee))) {
      sites.push({ start: node.start, end: node.end, inFn });
      return; // nested css calls are evaluated as part of this one
    }
    const fn = inFn || /Function/.test(node.type);
    for (const k in node) {
      const v = node[k];
      if (Array.isArray(v)) v.forEach((c) => walk(c, fn));
      else if (v && typeof v === "object" && "type" in v) walk(v, fn);
    }
  };
  walk(program, false);
  return sites;
}

export function instrument(code, id) {
  const { program } = parseSync(id, code);
  const imp = findCssImport(program, code, id);
  if (!imp) return null;
  const sites = findSites(program, imp.locals);
  const ms = new MagicString(code);
  const hoisted = [];
  sites.forEach((s, n) => {
    const site = `__site(${JSON.stringify(id)}, ${n}, `;
    // Sites inside functions never run at module load, and may use locals of a helper that is called with
    // arguments. The runner calls __cssints_hoisted only on the module it evaluates, after it has loaded.
    if (s.inFn) hoisted.push(`${site}${code.slice(s.start, s.end)});`);
    else ms.prependLeft(s.start, site).appendRight(s.end, ")");
  });
  // cssints members are properties of `css` (macro.mjs): named imports destructure it.
  imp.decls.forEach((d, i) => {
    if (d.source.value !== RUNTIME) return;
    const ns = d.specifiers.find((x) => x.type === "ImportNamespaceSpecifier");
    const bind = ns ? ns.local.name : `{ ${d.specifiers.map((x) => `${JSON.stringify(x.imported.name ?? x.imported.value)}: ${x.local.name}`).join(", ")} }`;
    ms.overwrite(d.start, d.end, `import { css as __css${i} } from ${JSON.stringify(RUNTIME)}; const ${bind} = __css${i};`);
  });
  ms.prepend(`import { __site } from ${JSON.stringify(RUNTIME)};\n`);
  if (hoisted.length) ms.append(`\nexport function __cssints_hoisted() {\n${hoisted.join("\n")}\n}\n`);
  return { code: ms.toString(), sites, imp };
}

// ---------- 2. evaluate (Effect: timeout + typed error)

// Same as Vite's ESModulesEvaluator, but every happy-dom global that Node lacks (document, window,
// HTMLElement, ...) is a closure binding around the module body. The real globalThis stays DOM-free,
// so Vite, externalized deps and the app's own SSR never see a browser. The wrapper keeps the same
// line padding as upstream, so the inherited startOffset (stack trace mapping) stays valid.
class DomEvaluator extends ESModulesEvaluator {
  win = new Window();
  names = Object.getOwnPropertyNames(this.win).filter((k) => !(k in globalThis));
  async runInlinedModule(context, code) {
    const keys = Object.keys(context);
    const fn = new Function(...this.names, `return async function (${keys}) {"use strict";\n${code}\n}`);
    await fn(...this.names.map((k) => this.win[k]))(...keys.map((k) => context[k]));
    Object.seal(context[ssrModuleExportsKey]);
  }
}

class MacroEvalError extends Data.TaggedError("MacroEvalError") {}

// One evaluation at a time, each from a runner cleared of app modules: no transform joins another's fetch of
// an older source or reuses exports computed from one, and no other evaluation touches the registry meanwhile.
// Process-global, like the registry. Invariants and interleavings: spec/runner.qnt.
const evalLock = Semaphore.makeUnsafe(1);

// Drops every app module from the runner; keeps the library (index.mjs and all it imports: css-grammar). The
// library imports no app module, so its exports never depend on app sources, and the model (runner.qnt) has
// no library. Re-evaluating it cost ~60% of every evaluation (docs/research/engine-cost.md). A library file
// the ssr graph invalidates still comes back fresh: the runner's cached fetch returns new code.
const LIB = fileURLToPath(new URL("./index.mjs", import.meta.url));
function clearApp({ idToModuleMap, urlToIdModuleMap, fileToModulesMap }) {
  const lib = new Set();
  const walk = (m) => m && !lib.has(m) && (lib.add(m), m.imports.forEach((id) => walk(idToModuleMap.get(id))));
  walk(idToModuleMap.get(LIB));
  for (const map of [idToModuleMap, urlToIdModuleMap]) for (const [k, m] of map) if (!lib.has(m)) map.delete(k);
  for (const [k, ms] of fileToModulesMap) for (const m of ms) if (!lib.has(m) && ms.delete(m) && !ms.size) fileToModulesMap.delete(k);
}

const evaluate = Effect.fn("cssints.evaluate")(function* (runner, id) {
  globalThis.__cssints?.sites.delete(id);
  clearApp(runner.evaluatedModules);
  yield* Effect.tryPromise({
    try: () => runner.import(id).then((m) => m.__cssints_hoisted?.()),
    catch: (e) => new MacroEvalError({ file: id, message: e instanceof Error ? e.message : String(e) }),
  }).pipe(Effect.timeout("30 seconds"));
  return globalThis.__cssints?.sites.get(id) ?? new Map();
});

// ---------- 3. plugin

export default function cssints({ inner = false } = {}) {
  let server; // dev server (dev) or a private one (build)
  let ownServer = false;
  let runner; // private runner with DOM bindings; server.environments.ssr.runner stays untouched
  let build = false;
  let cssPlugins = []; // vite:css, vite:css-post: in build they take the sheet in renderChunk
  const usedBy = new Map(); // client module id -> its classes, sorted, space-separated
  const depsOf = new Map(); // dependency file -> Set<client module id>
  const inflight = new Set(); // client module ids inside transform: their deps are not in depsOf yet

  const sheet = (ids = [...usedBy.keys()]) => renderSheet(ids.flatMap((id) => usedBy.get(id)?.split(" ") ?? []));

  // Dev: the next request of the sheet loads it again, and the browser gets an HMR update.
  const reloadSheet = () => {
    const env = server?.environments.client;
    const mod = env?.moduleGraph.getModuleById(SHEET);
    if (!mod) return;
    env.moduleGraph.invalidateModule(mod); // as in hotUpdate: a sheet transform in flight is not cached
    env.reloadModule(mod);
  };

  // Called inside evalLock, so the last write for a module comes from its latest evaluation (runner.qnt `rules`).
  const record = (id, classes) => {
    const s = [...new Set(classes)].sort().join(" ");
    if (usedBy.get(id) === s) return;
    usedBy.set(id, s);
    reloadSheet();
  };

  const runnerDeps = (env, id, out = new Set(), seen = new Set()) => {
    const mod = env.moduleGraph.getModuleById(id);
    if (!mod || seen.has(id)) return out;
    seen.add(id);
    for (const dep of mod.importedModules) {
      if (!dep.file || dep.file.includes("node_modules")) continue;
      out.add(dep.file);
      runnerDeps(env, dep.id, out, seen);
    }
    return out;
  };

  const main = {
    name: "cssints",
    enforce: "pre",
    api: { sheet }, // the sheet of all (or the given) client modules transformed so far: test/run.mjs
    configResolved(config) {
      build = config.command === "build";
      cssPlugins = ["vite:css", "vite:css-post"].map((n) => config.plugins.find((p) => p.name === n));
    },
    configureServer(s) {
      server = s;
      if (inner) return;
      // The browser drops an HMR update of a module that has not run yet: on a cold page load the sheet can be
      // fetched, and updated, while other modules are still in transform. The sheet reports what it got.
      s.environments.client.hot.on("cssints:sheet", (v) => {
        if (!s.environments.client.moduleGraph.getModuleById(SHEET)?.transformResult?.code.includes(v)) reloadSheet();
      });
    },
    async buildStart() {
      if (inner || server) return;
      server = await createServer({
        configFile: false,
        root: process.cwd(),
        logLevel: "warn",
        server: { middlewareMode: true, watch: null, hmr: false },
        plugins: [cssints({ inner: true })],
      });
      ownServer = true;
    },
    async closeBundle() {
      if (ownServer) await server.close();
    },
    resolveId(id) {
      if (id === SHEET_IMPORT) return SHEET;
    },
    // Build: the rules are known only once every module is transformed, so a placeholder until renderChunk.
    load(id) {
      if (id === SHEET) return build ? LAYERS : sheet();
    },
    // Before vite:css-post's renderChunk joins the chunk's CSS: run the sheet through vite:css (LightningCSS) and
    // hand it to vite:css-post in place of the placeholder, as UnoCSS does. Its minify runs on the joined CSS.
    async renderChunk(_, chunk) {
      if (inner || !(SHEET in chunk.modules)) return null;
      const [css, cssPost] = cssPlugins;
      const r = await css.transform.handler.call(this, sheet(), SHEET);
      await cssPost.transform.handler.call(this, r?.code ?? sheet(), SHEET);
      return null;
    },
    async transform(code, id) {
      if (!FILE_RE.test(id) || id.includes("node_modules") || !code.includes(RUNTIME)) return;
      if (this.environment.name === "ssr") return instrument(code, id)?.code;
      if (inner) return;

      const parsed = instrument(code, id);
      if (!parsed) return;
      const env = server.environments.ssr;
      // No runner HMR: its full-reload re-imports would run outside evalLock.
      runner ??= createServerModuleRunner(env, { hmr: false, evaluator: new DomEvaluator() });
      inflight.add(id);
      try {
        return await clientTransform(code, id, parsed, env, (w) => this.warn(w));
      } finally {
        inflight.delete(id);
      }
    },
    hotUpdate({ file, modules }) {
      if (this.environment.name !== "client") return;
      const graph = this.environment.moduleGraph;
      const affected = [...new Set([...(depsOf.get(file) ?? []), ...inflight])].map((id) => graph.getModuleById(id)).filter(Boolean);
      // HMR invalidation alone would still let Vite cache (and reuse) a result that is being computed now.
      for (const m of affected) graph.invalidateModule(m);
      return [...modules, ...affected];
    },
  };
  // After import analysis: the sheet module tells the server which version it runs (see configureServer).
  const version = {
    name: "cssints:sheet-version",
    apply: "serve",
    transform: {
      order: "post",
      handler(code, id) {
        if (id === SHEET && this.environment.name === "client") return `${code}\nimport.meta.hot.send("cssints:sheet", ${JSON.stringify(hash(code))});`;
      },
    },
  };
  return [main, version];

  async function clientTransform(code, id, parsed, env, warn) {
    const recorded = (sites) => {
      if (parsed.sites.every((_, n) => sites.has(n))) record(id, [...sites.values()].flatMap((r) => [...r.matchAll(/"(_[a-z0-9]+(?: _[a-z0-9]+)*)"/g)].flatMap((m) => m[1].split(" "))));
      return sites;
    };
    const sites = parsed.sites.length
      ? await Effect.runPromise(evalLock.withPermit(Effect.map(evaluate(runner, id), recorded))).finally(() => globalThis.__cssints?.warnings?.splice(0).forEach(warn))
      : recorded(new Map());

    const ms = new MagicString(code);
    parsed.sites.forEach((s, n) => {
      const replacement = sites.get(n);
      if (replacement === undefined) throw new Error(`cssints: site ${n} in ${id} was not evaluated`);
      ms.overwrite(s.start, s.end, replacement);
    });
    // Build-time imports are gone from the client; runtime ones (cx, _cv) stay.
    for (const decl of parsed.imp.decls) ms.remove(decl.start, decl.end);

    for (const dep of runnerDeps(env, id)) (depsOf.get(dep) ?? depsOf.set(dep, new Set()).get(dep)).add(id);
    return { code: ms.toString(), map: ms.generateMap({ hires: true, source: id, includeContent: true }) };
  }
}
