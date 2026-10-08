// Instrument (ssr environment): wrap every maximal css.* call in __site(__at(file, n, offset), ...), so the
// evaluation records what each call site produced, and a failure names the call.
import type {
  ImportDeclaration,
  ImportDeclarationSpecifier,
  ModuleExportName,
  Node,
  Program,
} from "oxc-parser";
import { parseSync } from "oxc-parser";
import MagicString from "magic-string";
import { Effect, Formatter, Predicate } from "effect";

import { ImportError } from "./errors.ts";

export const RUNTIME = "cssints";
// A cv() site becomes a call of the runtime; the plugin imports it as `__cv` into the modules that have one.
export const CV_CALL = "__cv(";

const rootIdent = (n: Node): string | null =>
  n.type === "Identifier"
    ? n.name
    : n.type === "MemberExpression"
      ? rootIdent(n.object)
      : n.type === "CallExpression"
        ? rootIdent(n.callee)
        : null;

const RUNTIME_ONLY = new Set(["cx"]);
// Real exports of the eval-time library: a module that only runs at build time (a plugin's) may import them plainly.
// The client's "cssints" has none of them, so there they need the attribute, and a constructor becomes its CSS text.
const TYPED_OM = new Set([
  "CSS",
  "CSSStyleValue",
  "CSSUnitValue",
  "CSSColorValue",
  "CSSImageValue",
]);
const nameOf = (m: ModuleExportName) => (m.type === "Identifier" ? m.name : m.value);
const isSiteImport = (s: ImportDeclaration) =>
  s.attributes.some(
    (a) =>
      (a.key.type === "Identifier" ? a.key.name : a.key.value) === "type" &&
      a.value.value === "cssints",
  );
const importedName = (x: ImportDeclarationSpecifier) =>
  x.type === "ImportSpecifier" ? nameOf(x.imported) : null;

// A bundler (tsdown) merges `import { cx } from "cssints"` into the attributed import of the same module: cx stays
// runtime wherever it is written.
const isRuntime = (d: ImportDeclaration, x: ImportDeclarationSpecifier) =>
  d.source.value === RUNTIME &&
  x.type === "ImportSpecifier" &&
  RUNTIME_ONLY.has(nameOf(x.imported));

// The runtime part of an attributed import, as an import of its own (`import { cx } from "cssints";`), or "".
export const keptImport = (d: ImportDeclaration, code: string) => {
  const names = d.specifiers.filter((x) => isRuntime(d, x)).map((x) => code.slice(x.start, x.end));
  return names.length
    ? `import { ${names.join(", ")} } from ${Formatter.formatJson(RUNTIME)};`
    : "";
};

interface CssImports {
  locals: Set<string>;
  decls: ImportDeclaration[];
}

// Every import `with { type: "cssints" }` (cssints, other packages, local helper modules) makes its bindings
// site roots. "cssints" without the attribute may only give runtime members, and in the ssr environment (`client`
// false) the Typed OM values too. Returns null without site imports.
const findCssImport = Effect.fnUntraced(function* (
  program: Program,
  code: string,
  id: string,
  client: boolean,
): Effect.fn.Return<CssImports | null, ImportError> {
  const plain = (name: string) => RUNTIME_ONLY.has(name) || (!client && TYPED_OM.has(name));
  const locals = new Set<string>();
  const decls: ImportDeclaration[] = [];
  for (const s of program.body) {
    if (s.type !== "ImportDeclaration") continue;
    const old = s.source.value === RUNTIME && s.specifiers.find((x) => importedName(x) === "_cv");
    if (old)
      return yield* new ImportError({
        message: `cssints: ${id} imports _cv from "cssints", which is gone: cv({ ... }) is the function now. Write const button = cv({ base, variants }) (cv from "cssints" with { type: "cssints" }), drop _cv, and call button({ size: "lg" })`,
        file: id,
        offset: old.start,
      });
    if (isSiteImport(s)) {
      decls.push(s);
      s.specifiers.forEach((x) => isRuntime(s, x) || locals.add(x.local.name));
    } else if (s.source.value === RUNTIME && s.importKind !== "type") {
      // a type import is erased: `import type { CvProps } from "cssints"`
      const bad = s.specifiers.filter(
        (x) =>
          x.type !== "ImportSpecifier" ||
          (x.importKind !== "type" && !plain(importedName(x) ?? "")),
      );
      if (!bad.length) continue;
      const names = bad.map((x) => code.slice(x.start, x.end));
      const fix =
        bad[0]!.type === "ImportNamespaceSpecifier" ? names[0] : `{ ${names.join(", ")} }`;
      return yield* new ImportError({
        message: `cssints: ${id} imports build-time ${names.join(", ")} from "cssints" without the attribute. Import it as: import ${fix} from "cssints" with { type: "cssints" }; (only cx is runtime)`,
        file: id,
        offset: s.start,
      });
    }
  }
  return locals.size ? { locals, decls } : null;
});

// Conditions in a variable are site roots too: `const md = css.media(q)`, `const [md, lg] = css.media(a, b)`,
// `const { md } = css.media({ md: q })`, so `md(css.p(4))` is a site of its own (a call of a wrapper the client does
// not have). Returns the names those declarations bind.
const CONDITIONS = new Set(["media", "container", "supports", "attr", "within"]);
const boundNames = (id: Node | null, out: Set<string>) => {
  if (!id) return;
  if (id.type === "Identifier") out.add(id.name);
  else if (id.type === "ArrayPattern") id.elements.forEach((e) => boundNames(e, out));
  else if (id.type === "ObjectPattern")
    id.properties.forEach((p) => boundNames(p.type === "Property" ? p.value : p.argument, out));
  else if (id.type === "AssignmentPattern") boundNames(id.left, out);
};
function withConditions(
  program: Program,
  code: string,
  { locals, decls }: CssImports,
): Set<string> {
  if (!/\b(?:media|container|supports|attr|within)\b/.test(code)) return locals; // most modules: no walk
  const ctors = new Set<string>(); // local names of media, container, supports, attr, within imported by name
  for (const d of decls)
    for (const x of d.specifiers)
      if (x.type === "ImportSpecifier" && CONDITIONS.has(nameOf(x.imported)))
        ctors.add(x.local.name);
  const all = new Set(locals);
  const walk = (node: unknown) => {
    if (!Predicate.isObject(node) || typeof node.type !== "string") return;
    const n = node as unknown as Node;
    if (n.type === "VariableDeclarator" && n.init?.type === "CallExpression") {
      const c = n.init.callee;
      if (
        (c.type === "Identifier" && ctors.has(c.name)) ||
        (c.type === "MemberExpression" &&
          !c.computed &&
          c.property.type === "Identifier" &&
          CONDITIONS.has(c.property.name) &&
          locals.has(rootIdent(c.object) ?? ""))
      )
        boundNames(n.id, all);
    }
    for (const k in node) {
      const v = node[k];
      if (Array.isArray(v)) v.forEach(walk);
      else if (Predicate.isObject(v) && "type" in v) walk(v);
    }
  };
  walk(program);
  return all;
}

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
    if (
      (n.type === "CallExpression" || n.type === "NewExpression") &&
      locals.has(rootIdent(n.callee) ?? "")
    ) {
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
  client = true,
): Effect.fn.Return<Instrumented | null, ImportError> {
  const { program } = parseSync(id, code);
  const imp = yield* findCssImport(program, code, id, client);
  if (!imp) return null;
  const sites = findSites(program, withConditions(program, code, imp));
  const ms = new MagicString(code);
  const hoisted: string[] = [];
  const file = Formatter.formatJson(id);
  sites.forEach((s, n) => {
    const site = `__site(__at(${file}, ${n}, ${s.start}), `;
    // Sites inside functions never run at module load, and may use locals of a helper that is called with
    // arguments. The runner calls __cssints_hoisted only on the module it evaluates, after it has loaded.
    // A top-level site the load did not reach (`false && p(4)`, a branch not taken) goes there too, for the
    // module bindings; `__unseen` skips the ones that ran.
    const expr = code.slice(s.start, s.end);
    if (s.inFn) hoisted.push(`${site}${expr});`);
    else {
      ms.prependLeft(s.start, site).appendRight(s.end, ")");
      hoisted.push(`__unseen(${file}, ${n}) && ${site}${expr});`);
    }
  });
  // cssints members are properties of `css` (macro.ts): named imports destructure it.
  imp.decls.forEach((d, i) => {
    if (d.source.value !== RUNTIME) return;
    const ns = d.specifiers.find((x) => x.type === "ImportNamespaceSpecifier");
    const named = d.specifiers.filter((x) => !isRuntime(d, x));
    const bind = ns
      ? ns.local.name
      : `{ ${named.map((x) => `${Formatter.formatJson(importedName(x))}: ${x.local.name}`).join(", ")} }`;
    ms.overwrite(
      d.start,
      d.end,
      `import { css as __css${i} } from ${Formatter.formatJson(RUNTIME)}; const ${bind} = __css${i};${keptImport(d, code)}`,
    );
  });
  ms.prepend(`import { __at, __site, __unseen } from ${Formatter.formatJson(RUNTIME)};\n`);
  if (hoisted.length)
    ms.append(`\nexport function __cssints_hoisted() {\n${hoisted.join("\n")}\n}\n`);
  return { code: ms.toString(), sites, imp };
});
