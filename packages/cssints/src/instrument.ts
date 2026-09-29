// Instrument (ssr environment): wrap every maximal css.* call in __site(__at(file, n, offset), ...), so the
// evaluation records what each call site produced, and a failure names the call.
import type { ImportDeclaration, ImportDeclarationSpecifier, ModuleExportName, Node, Program } from "oxc-parser";
import { parseSync } from "oxc-parser";
import MagicString from "magic-string";
import { Effect, Predicate } from "effect";

import { ImportError } from "./errors.ts";

export const RUNTIME = "cssints";

const rootIdent = (n: Node): string | null =>
  n.type === "Identifier"
    ? n.name
    : n.type === "MemberExpression"
      ? rootIdent(n.object)
      : n.type === "CallExpression"
        ? rootIdent(n.callee)
        : null;

const RUNTIME_ONLY = new Set(["cx", "_cv"]);
const nameOf = (m: ModuleExportName) => (m.type === "Identifier" ? m.name : m.value);
const isSiteImport = (s: ImportDeclaration) =>
  s.attributes.some((a) => (a.key.type === "Identifier" ? a.key.name : a.key.value) === "type" && a.value.value === "cssints");
const importedName = (x: ImportDeclarationSpecifier) => (x.type === "ImportSpecifier" ? nameOf(x.imported) : null);

interface CssImports {
  locals: Set<string>;
  decls: ImportDeclaration[];
}

// Every import `with { type: "cssints" }` (cssints, other packages, local helper modules) makes its bindings
// site roots. "cssints" without the attribute may only give runtime members. Returns null without site imports.
const findCssImport = Effect.fnUntraced(function* (
  program: Program,
  code: string,
  id: string,
): Effect.fn.Return<CssImports | null, ImportError> {
  const locals = new Set<string>();
  const decls: ImportDeclaration[] = [];
  for (const s of program.body) {
    if (s.type !== "ImportDeclaration") continue;
    if (isSiteImport(s)) {
      decls.push(s);
      s.specifiers.forEach((x) => locals.add(x.local.name));
    } else if (s.source.value === RUNTIME) {
      const bad = s.specifiers.filter((x) => x.type !== "ImportSpecifier" || !RUNTIME_ONLY.has(importedName(x) ?? ""));
      if (!bad.length) continue;
      const names = bad.map((x) => code.slice(x.start, x.end));
      const fix = bad[0]!.type === "ImportNamespaceSpecifier" ? names[0] : `{ ${names.join(", ")} }`;
      return yield* new ImportError({
        message: `cssints: ${id} imports build-time ${names.join(", ")} from "cssints" without the attribute. Import it as: import ${fix} from "cssints" with { type: "cssints" }; (only cx and _cv are runtime)`,
        file: id,
        offset: s.start,
      });
    }
  }
  return locals.size ? { locals, decls } : null;
});

export interface Site {
  start: number;
  end: number;
  inFn: boolean;
}

// Maximal css-rooted call expressions, with whether they sit inside a function body. A plain walk over the AST:
// it runs for every module twice (ssr, client), inside the `instrument` boundary.
function findSites(program: Program, locals: Set<string>): Site[] {
  const sites: Site[] = [];
  const walk = (node: unknown, inFn: boolean) => {
    if (!Predicate.isObject(node) || typeof node.type !== "string") return;
    const n = node as unknown as Node;
    // `new CSSColorValue(...)` too: value constructors are sites, replaced by their CSS text.
    if ((n.type === "CallExpression" || n.type === "NewExpression") && locals.has(rootIdent(n.callee) ?? "")) {
      sites.push({ start: n.start, end: n.end, inFn });
      return; // nested css calls are evaluated as part of this one
    }
    const fn = inFn || /Function/.test(n.type);
    for (const k in node) {
      const v = node[k];
      if (Array.isArray(v)) v.forEach((c) => walk(c, fn));
      else if (Predicate.isObject(v) && "type" in v) walk(v, fn);
    }
  };
  walk(program, false);
  return sites;
}

export interface Instrumented {
  code: string;
  sites: Site[];
  imp: CssImports;
}

export const instrument = Effect.fn("cssints.instrument")(function* (
  code: string,
  id: string,
): Effect.fn.Return<Instrumented | null, ImportError> {
  const { program } = parseSync(id, code);
  const imp = yield* findCssImport(program, code, id);
  if (!imp) return null;
  const sites = findSites(program, imp.locals);
  const ms = new MagicString(code);
  const hoisted: string[] = [];
  sites.forEach((s, n) => {
    const site = `__site(__at(${JSON.stringify(id)}, ${n}, ${s.start}), `;
    // Sites inside functions never run at module load, and may use locals of a helper that is called with
    // arguments. The runner calls __cssints_hoisted only on the module it evaluates, after it has loaded.
    if (s.inFn) hoisted.push(`${site}${code.slice(s.start, s.end)});`);
    else ms.prependLeft(s.start, site).appendRight(s.end, ")");
  });
  // cssints members are properties of `css` (macro.ts): named imports destructure it.
  imp.decls.forEach((d, i) => {
    if (d.source.value !== RUNTIME) return;
    const ns = d.specifiers.find((x) => x.type === "ImportNamespaceSpecifier");
    const bind = ns
      ? ns.local.name
      : `{ ${d.specifiers.map((x) => `${JSON.stringify(importedName(x))}: ${x.local.name}`).join(", ")} }`;
    ms.overwrite(d.start, d.end, `import { css as __css${i} } from ${JSON.stringify(RUNTIME)}; const ${bind} = __css${i};`);
  });
  ms.prepend(`import { __at, __site } from ${JSON.stringify(RUNTIME)};\n`);
  if (hoisted.length) ms.append(`\nexport function __cssints_hoisted() {\n${hoisted.join("\n")}\n}\n`);
  return { code: ms.toString(), sites, imp };
});
