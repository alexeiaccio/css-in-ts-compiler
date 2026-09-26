import { createHash } from "node:crypto";

import { Data, Effect } from "effect";
import { Window } from "happy-dom";
import MagicString from "magic-string";
import { parseSync } from "oxc-parser";
import { createServer, createServerModuleRunner } from "vite";
import { ESModulesEvaluator, ssrModuleExportsKey } from "vite/module-runner";

const RUNTIME = "cssints";
const FILE_RE = /\.(ts|tsx|js|jsx|mts|mjs)$/;
const CSS_ID = "\0cssints.css";

// ---------- 1. instrument (ssr env): wrap every maximal css.* call in __site(file, n, ...)

const rootIdent = (n) =>
  n.type === "Identifier" ? n.name : n.type === "MemberExpression" ? rootIdent(n.object) : n.type === "CallExpression" ? rootIdent(n.callee) : null;

const RUNTIME_ONLY = new Set(["cx", "_cv"]);

// Locals bound to compile-time members of "cssints": `css` / `* as css` (any member) and named
// imports like `display`, `p`, `cv`. Returns null when the file does not import cssints.
function findCssImport(program) {
  const locals = new Map(); // local name -> { decl, spec }
  const decls = [];
  for (const s of program.body) {
    if (s.type !== "ImportDeclaration" || s.source.value !== RUNTIME) continue;
    decls.push(s);
    for (const x of s.specifiers) {
      const imported = x.type === "ImportNamespaceSpecifier" ? "css" : (x.imported.name ?? x.imported.value);
      if (!RUNTIME_ONLY.has(imported)) locals.set(x.local.name, { decl: s, spec: x });
    }
  }
  return locals.size ? { locals, decls } : null;
}

// Maximal css-rooted call expressions, with whether they sit inside a function body.
function findSites(program, locals) {
  const sites = [];
  const walk = (node, inFn) => {
    if (!node || typeof node.type !== "string") return;
    if (node.type === "CallExpression" && locals.has(rootIdent(node.callee))) {
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
  const imp = findCssImport(program);
  if (!imp) return null;
  const sites = findSites(program, imp.locals);
  if (!sites.length) return null;
  const ms = new MagicString(code);
  const hoisted = [];
  sites.forEach((s, n) => {
    const site = `__site(${JSON.stringify(id)}, ${n}, `;
    if (s.inFn) {
      // Sites inside functions never run at module load; hoist them after all top-level statements.
      hoisted.push(`const __s${n} = ${site}${code.slice(s.start, s.end)});`);
      ms.overwrite(s.start, s.end, `__s${n}`);
    } else {
      ms.prependLeft(s.start, site).appendRight(s.end, ")");
    }
  });
  ms.prepend(`import { __site } from ${JSON.stringify(RUNTIME)};\n`);
  if (hoisted.length) ms.append(`\n${hoisted.join("\n")}\n`);
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

const evaluate = Effect.fn("cssints.evaluate")(function* (runner, id) {
  const registry = globalThis.__cssints;
  registry?.sites.delete(id);
  for (const m of runner.evaluatedModules.getModulesByFile(id) ?? []) runner.evaluatedModules.invalidateModule(m);
  yield* Effect.tryPromise({
    try: () => runner.import(id),
    catch: (e) => new MacroEvalError({ file: id, message: e instanceof Error ? e.message : String(e) }),
  }).pipe(Effect.timeout("30 seconds"));
  return globalThis.__cssints?.sites.get(id) ?? new Map();
});

// ---------- 3. plugin

export default function cssints({ inner = false } = {}) {
  let server; // dev server (dev) or a private one (build)
  let ownServer = false;
  let runner; // private runner with DOM bindings; server.environments.ssr.runner stays untouched
  const cssById = new Map(); // virtual css id -> text
  const depsOf = new Map(); // dependency file -> Set<client module id>

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

  return {
    name: "cssints",
    enforce: "pre",
    configureServer(s) {
      server = s;
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
      if (id.startsWith(CSS_ID)) return id;
    },
    load(id) {
      if (id.startsWith(CSS_ID)) return cssById.get(id) ?? "";
    },
    async transform(code, id) {
      if (!FILE_RE.test(id) || id.includes("node_modules") || !code.includes(RUNTIME)) return;
      if (this.environment.name === "ssr") return instrument(code, id)?.code;
      if (inner) return;

      const parsed = instrument(code, id);
      if (!parsed) return;
      const env = server.environments.ssr;
      runner ??= createServerModuleRunner(env, { evaluator: new DomEvaluator() });
      const sites = await Effect.runPromise(evaluate(runner, id)).finally(() => globalThis.__cssints?.warnings.splice(0).forEach((w) => this.warn(w)));

      const ms = new MagicString(code);
      parsed.sites.forEach((s, n) => {
        const replacement = sites.get(n);
        if (replacement === undefined) throw new Error(`cssints: site ${n} in ${id} was not evaluated`);
        ms.overwrite(s.start, s.end, replacement);
      });
      // Drop compiled specifiers; keep cx/_cv. Remove the whole import when nothing is left.
      for (const decl of parsed.imp.decls) {
        const keep = decl.specifiers.filter((x) => !parsed.imp.locals.has(x.local.name));
        if (!keep.length) ms.remove(decl.start, decl.end);
        else ms.overwrite(decl.start, decl.end, `import { ${keep.map((x) => x.local.name).join(", ")} } from ${JSON.stringify(RUNTIME)};`);
      }

      const rules = globalThis.__cssints.rules;
      const used = new Set([...sites.values()].flatMap((r) => [...r.matchAll(/"(_[a-z0-9]+(?: _[a-z0-9]+)*)"/g)].flatMap((m) => m[1].split(" "))));
      const css = [...used].map((c) => rules.get(c)).filter(Boolean).join("\n");
      const cssId = `${CSS_ID}?file=${id}&v=${createHash("sha1").update(css).digest("hex").slice(0, 8)}`;
      cssById.set(cssId, css);
      ms.prepend(`import ${JSON.stringify(cssId)};\n`);

      for (const dep of runnerDeps(env, id)) (depsOf.get(dep) ?? depsOf.set(dep, new Set()).get(dep)).add(id);
      return { code: ms.toString(), map: ms.generateMap({ hires: true, source: id, includeContent: true }) };
    },
    hotUpdate({ file, modules }) {
      if (this.environment.name !== "client") return;
      const affected = [...(depsOf.get(file) ?? [])].map((id) => this.environment.moduleGraph.getModuleById(id)).filter(Boolean);
      return [...modules, ...affected];
    },
  };
}
