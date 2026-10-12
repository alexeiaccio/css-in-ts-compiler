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
import { groups } from "./groups-data.ts";

export const RUNTIME = "cssints";
// A cv() site and a cn() with runtime arguments become calls of the runtime; the plugin imports them as `__cv` and
// `__cx` into the modules that have one.
export const CV_CALL = "__cv(";
export const CX_CALL = "__cx(";

const rootIdent = (n: Node): string | null =>
  n.type === "Identifier"
    ? n.name
    : n.type === "MemberExpression"
      ? rootIdent(n.object)
      : n.type === "CallExpression"
        ? rootIdent(n.callee)
        : null;

// "cssints", or one of its export groups (docs/research/groups.md): `cssints/widely-available`, `cssints/css-grid-2`, ...
// and `cssints/limited-availability`, which is "cssints" itself.
const isCssints = (source: string) =>
  source === RUNTIME ||
  (source.startsWith(`${RUNTIME}/`) &&
    (Object.hasOwn(groups, source.slice(RUNTIME.length + 1)) ||
      source === `${RUNTIME}/limited-availability`));
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
  const plain = (name: string) => !client && TYPED_OM.has(name);
  const locals = new Set<string>();
  const decls: ImportDeclaration[] = [];
  for (const s of program.body) {
    if (s.type !== "ImportDeclaration") continue;
    const old = isCssints(s.source.value) && s.specifiers.find((x) => importedName(x) === "_cv");
    const gone = isCssints(s.source.value) && s.specifiers.find((x) => importedName(x) === "cx");
    if (gone)
      return yield* new ImportError({
        message: `cssints: ${id} imports cx from "${s.source.value}", which is gone: cn(...) takes runtime values now. Write cn(base, on && p(4)) with cn from "cssints" with { type: "cssints" }; for the SVG property, css.cx(...)`,
        file: id,
        offset: gone.start,
      });
    if (old)
      return yield* new ImportError({
        message: `cssints: ${id} imports _cv from "cssints", which is gone: cv({ ... }) is the function now. Write const button = cv({ base, variants }) (cv from "cssints" with { type: "cssints" }), drop _cv, and call button({ size: "lg" })`,
        file: id,
        offset: old.start,
      });
    if (isSiteImport(s)) {
      decls.push(s);
      s.specifiers.forEach((x) => locals.add(x.local.name));
    } else if (isCssints(s.source.value) && s.importKind !== "type") {
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
        message: `cssints: ${id} imports build-time ${names.join(", ")} from "${s.source.value}" without the attribute. Import it as: import ${fix} from "${s.source.value}" with { type: "cssints" }`,
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
  else if (id.type === "RestElement") boundNames(id.argument, out);
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

/** A `cn(...)` with runtime arguments: the call is the runtime's `__cx`, which gets the runtime arguments. */
export interface SiteGroup {
  callee: { start: number; end: number };
  args: { start: number; end: number; runtime: boolean }[];
  /** `[offset, site]` of the sites inside the runtime arguments, in source order: the parts that may or may not be active */
  parts: [number, number][];
}

export interface Site {
  start: number;
  end: number;
  inFn: boolean;
  /** dev with devtools: the readable class of a cn() or cv() site (`cs-Landing-logo`), see `tagged` */
  name: string | undefined;
  // Names declared by the functions and blocks around the site: a runtime value, whatever a global or a module says
  locals: Set<string>;
  group?: SiteGroup;
}

const declsOf = (stmts: Node[], out: Set<string>) =>
  stmts.forEach((s) => {
    if (s.type === "VariableDeclaration") s.declarations.forEach((d) => boundNames(d.id, out));
    else if ((s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") && s.id)
      out.add(s.id.name);
  });
// What a node declares for the code inside it: parameters, the let/const/class/function of a block, a loop head, a catch.
const declares = (n: Node, out: Set<string>) => {
  if (
    n.type === "ArrowFunctionExpression" ||
    n.type === "FunctionExpression" ||
    n.type === "FunctionDeclaration"
  ) {
    n.params.forEach((p) => boundNames(p, out));
    if (n.type === "FunctionExpression" && n.id) out.add(n.id.name);
  } else if (n.type === "BlockStatement" || n.type === "StaticBlock") declsOf(n.body, out);
  else if (n.type === "SwitchCase") declsOf(n.consequent, out);
  else if (n.type === "ForStatement" && n.init) declsOf([n.init], out);
  else if (n.type === "ForInStatement" || n.type === "ForOfStatement") declsOf([n.left], out);
  else if (n.type === "CatchClause") boundNames(n.param, out);
};

// A `cn(...)` argument is a runtime value when it names a local of the functions and blocks around the call (the
// hoisted site would find it in the dead zone: a parameter, a prop, state), is a string (opaque classes), or is a call of
// something that is not a css.* member (`button({ size })`, a cv() result: a class string at build time too).
const isRuntimeArg = (arg: Node, code: string, scope: Set<string>, roots: Set<string>) => {
  const a = arg.type === "SpreadElement" ? arg.argument : arg;
  const todo: Node[] = [a];
  for (const n of todo) {
    if (n.type === "CallExpression") {
      if (!roots.has(rootIdent(n.callee) ?? "")) return true;
    } else if (n.type === "LogicalExpression") todo.push(n.left, n.right);
    else if (n.type === "ConditionalExpression") todo.push(n.consequent, n.alternate);
    else if (n.type === "ArrayExpression") n.elements.forEach((e) => e && todo.push(e));
    else if (n.type === "ParenthesizedExpression") todo.push(n.expression);
  }
  return (
    a.type === "TemplateLiteral" ||
    (a.type === "Literal" && typeof a.value === "string") ||
    !!code
      .slice(a.start, a.end)
      .match(/[\p{L}\p{N}_$]+/gu)
      ?.some((w) => scope.has(w))
  );
};

// ---------- dev names (cssints-12tp): a readable class `cs-<owner>[-<label>]` for a cn() or cv() site, from the ancestors
// the walk already has (`chain`, kept only when asked). The owner is the nearest function or class with a PascalCase
// name (else the file's name); the label is what the call is assigned to: a variable, a property or member, a class
// field, a JSX attribute other than class/className, or the name of the helper that returns it. No name, no class.
const GLUE = new Set([
  "ConditionalExpression",
  "LogicalExpression",
  "ParenthesizedExpression",
  "TSAsExpression",
  "TSSatisfiesExpression",
  "TSNonNullExpression",
  "TSTypeAssertion",
  "ChainExpression",
  "AwaitExpression",
  "JSXExpressionContainer",
  "ReturnStatement",
  "CallExpression",
  "ArrayExpression",
]);
const PASCAL = /^[A-Z](?![A-Z0-9_]*$)/;
const idName = (k: Node, computed = false) =>
  computed
    ? ""
    : k.type === "Identifier" || k.type === "PrivateIdentifier"
      ? k.name
      : k.type === "Literal"
        ? String(k.value)
        : "";

const down = (from: number) => Array.from({ length: from + 1 }, (_, k) => from - k);
// The name the expression `chain[from + 1]` (`site` past the end) is bound to, going up through the nodes that pass a value
// on. `fns`: a function that returns it passes it on too (`const row = () => cn(...)`, a method, `useMemo(() => cn(...))`).
const bound = (chain: Node[], from: number, site: Node, fns: boolean) => {
  for (const i of down(from)) {
    const p = chain[i]!;
    const child = chain[i + 1] ?? site;
    switch (p.type) {
      case "VariableDeclarator":
        return p.init === child && p.id.type === "Identifier" ? p.id.name : "";
      case "AssignmentExpression":
        return p.right !== child
          ? ""
          : p.left.type === "MemberExpression"
            ? idName(p.left.property, p.left.computed)
            : idName(p.left);
      case "Property":
      case "PropertyDefinition":
      case "MethodDefinition":
        return p.value === child ? idName(p.key, p.computed) : "";
      case "JSXAttribute":
        return p.name.type === "JSXIdentifier" && !/^class(Name)?$/.test(p.name.name)
          ? p.name.name
          : "";
      case "BlockStatement":
        if (child.type !== "ReturnStatement") return "";
        break;
      case "FunctionDeclaration":
      case "FunctionExpression":
      case "ArrowFunctionExpression":
        if (!fns) return "";
        if (p.type !== "ArrowFunctionExpression" && p.id) return p.id.name;
        break;
      default:
        if (!GLUE.has(p.type)) return "";
    }
  }
  return "";
};

const ownerOf = (chain: Node[], site: Node) => {
  for (const i of down(chain.length - 1)) {
    const f = chain[i]!;
    if (
      f.type === "FunctionDeclaration" ||
      f.type === "FunctionExpression" ||
      f.type === "ArrowFunctionExpression" ||
      f.type === "ClassDeclaration" ||
      f.type === "ClassExpression"
    ) {
      const name =
        (f.type !== "ArrowFunctionExpression" && f.id?.name) || bound(chain, i - 1, site, false);
      if (PASCAL.test(name)) return name;
    }
  }
  return "";
};

// Only [A-Za-z0-9_-], cut short.
const clean = (s: string, max: number) =>
  s
    .replace(/[^\w-]+/g, "-")
    .slice(0, max)
    .replace(/^-+|-+$/g, "");
// `src/landing/page.ts` is `page`; `src/Button/index.tsx` is `Button`.
const baseOf = (id: string) => {
  const parts = id.replace(/[?#].*$/, "").split("/");
  const file = parts.pop()!.split(".")[0]!;
  return clean(file === "index" ? (parts.pop() ?? file) : file, 24) || "module";
};
const tokenOf = (chain: Node[], site: Node, base: string) => {
  const owner = clean(ownerOf(chain, site), 24) || base;
  const label = clean(bound(chain, chain.length - 1, site, true), 20);
  return `cs-${owner}${label && label !== owner ? `-${label}` : ""}`;
};

// The replacement of a cn() or cv() site with its readable class among the static classes (never a hashed class).
export const tagged = (r: string, name: string) =>
  r.startsWith('"')
    ? `${r.slice(0, -1)}${r.length > 2 ? " " : ""}${name}"`
    : r.startsWith(CV_CALL)
      ? r.replace(
          /^(__cv\(\{"base":")([^"]*)/,
          (_, a: string, b: string) => `${a}${b && `${b} `}${name}`,
        )
      : r.startsWith(CX_CALL)
        ? r.endsWith('", ')
          ? `${r.slice(0, -3)} ${name}", `
          : `${r}"${name}", `
        : r;

const calls = (c: Node | undefined, ids: Set<string>, spaces: Set<string>, member: string) =>
  c?.type === "Identifier"
    ? ids.has(c.name)
    : c?.type === "MemberExpression" &&
      !c.computed &&
      c.property.type === "Identifier" &&
      c.property.name === member &&
      c.object.type === "Identifier" &&
      spaces.has(c.object.name);

// Maximal css-rooted call expressions, with whether they sit inside a function body. A plain walk over the AST:
// it runs for every module twice (ssr, client), inside the `instrument` boundary. `cn` and `spaces` are the local
// names of cn and of the namespace import of "cssints": a call of either with a runtime argument is a site that
// keeps its static arguments and finds the sites inside the runtime ones.
function findSites(
  program: Program,
  code: string,
  locals: Set<string>,
  cn: Set<string>,
  spaces: Set<string>,
  names?: { cv: Set<string>; base: string },
) {
  const sites: Site[] = [];
  const scopes = [new Set<string>()]; // innermost last
  const chain: Node[] | undefined = names && []; // dev names: the ancestors of the node
  const open: Node[] = []; // the cn() calls whose runtime arguments are being walked: the outer call carries the name
  const nameOf = (n: Node, isCn: boolean, c: Node | undefined) =>
    names && !open.length && (isCn || calls(c, names.cv, spaces, "cv"))
      ? tokenOf(chain!, n, names.base)
      : undefined;
  const walk = (node: unknown, inFn: boolean) => {
    if (!Predicate.isObject(node) || typeof node.type !== "string") return;
    const n = node as unknown as Node;
    // `new CSSColorValue(...)` too: value constructors are sites, replaced by their CSS text.
    if (
      (n.type === "CallExpression" || n.type === "NewExpression") &&
      locals.has(rootIdent(n.callee) ?? "")
    ) {
      const scope = scopes[scopes.length - 1]!;
      const c = n.type === "CallExpression" ? n.callee : undefined;
      const isCn = calls(c, cn, spaces, "cn");
      const args = n.type === "CallExpression" && isCn ? n.arguments : [];
      const runtime = args.map((a) => isRuntimeArg(a, code, scope, locals));
      if (!runtime.includes(true)) {
        sites.push({ start: n.start, end: n.end, inFn, locals: scope, name: nameOf(n, isCn, c) });
        return; // nested css calls are evaluated as part of this one
      }
      const from = sites.length;
      chain?.push(n);
      open.push(n);
      args.forEach((a, i) => runtime[i] && walk(a, inFn));
      open.pop();
      chain?.pop();
      sites.push({
        start: n.start,
        end: n.end,
        inFn,
        locals: scope,
        name: nameOf(n, isCn, c),
        group: {
          callee: { start: n.callee.start, end: n.callee.end },
          args: args.map((a, i) => ({ start: a.start, end: a.end, runtime: runtime[i]! })),
          parts: sites.slice(from).map((x, k) => [x.start, from + k] as [number, number]),
        },
      });
      return;
    }
    const fn = inFn || /Function/.test(n.type);
    const own = new Set<string>();
    declares(n, own);
    scopes.push(
      own.size ? new Set([...scopes[scopes.length - 1]!, ...own]) : scopes[scopes.length - 1]!,
    );
    chain?.push(n);
    for (const k in node) {
      const v = node[k];
      if (Array.isArray(v)) v.forEach((c) => walk(c, fn));
      else if (Predicate.isObject(v) && "type" in v) walk(v, fn);
    }
    chain?.pop();
    scopes.pop();
  };
  walk(program, false);
  return sites;
}

export interface Instrumented {
  code: string;
  sites: Site[];
  imp: CssImports;
}

// A site in the client's code: its replacement, or for a cn() with runtime arguments the head the replacement is
// (`__cx(drops, "static classes", `), the commas between the runtime arguments, and the closing parenthesis.
export const writeSite = (ms: MagicString, s: Site, replacement: string) => {
  const kept = s.group?.args.filter((a) => a.runtime);
  if (!kept) return ms.overwrite(s.start, s.end, replacement);
  ms.overwrite(s.start, kept[0]!.start, replacement);
  kept.slice(1).forEach((a, i) => ms.overwrite(kept[i]!.end, a.start, ", "));
  ms.overwrite(kept.at(-1)!.end, s.end, ")");
};

// The import of the runtime calls the sites in `replacements` hold, or "".
export const runtimeImport = (replacements: Iterable<string>) => {
  const all = [...replacements];
  const names = [
    ...(all.some((r) => r.startsWith(CV_CALL)) ? ["_cv as __cv"] : []),
    ...(all.some((r) => r.startsWith(CX_CALL)) ? ["_cx as __cx"] : []),
  ];
  return names.length
    ? `import { ${names.join(", ")} } from ${Formatter.formatJson(RUNTIME)};\n`
    : "";
};

export const instrument = Effect.fn("cssints.instrument")(function* (
  code: string,
  id: string,
  client: boolean = true,
  named: boolean = false,
): Effect.fn.Return<Instrumented | null, ImportError> {
  const { program } = parseSync(id, code);
  const imp = yield* findCssImport(program, code, id, client);
  if (!imp) return null;
  const sources = imp.decls.filter((d) => isCssints(d.source.value));
  const cn = new Set<string>();
  const cv = new Set<string>();
  const spaces = new Set<string>();
  for (const d of sources)
    for (const x of d.specifiers) {
      if (x.type === "ImportNamespaceSpecifier" || importedName(x) === "css")
        spaces.add(x.local.name);
      else if (importedName(x) === "cn") cn.add(x.local.name);
      else if (importedName(x) === "cv") cv.add(x.local.name);
    }
  const sites = findSites(
    program,
    code,
    withConditions(program, code, imp),
    cn,
    spaces,
    named ? { cv, base: baseOf(id) } : undefined,
  );
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
    if (s.group) {
      // the static arguments, with where they stand, and the sites of the runtime ones: after those sites, in `hoisted`
      const statics = s.group.args.flatMap((a) => {
        if (a.runtime) return [];
        const text = code.slice(a.start, a.end);
        return [
          text.startsWith("...")
            ? `...[${text}].map((s) => [${a.start}, s])`
            : `[${a.start}, ${text}]`,
        ];
      });
      if (!s.inFn) ms.overwrite(s.group.callee.start, s.group.callee.end, "__nocn");
      hoisted.push(
        `${site}__cnGroup([${statics.join(", ")}], ${Formatter.formatJson(s.group.parts)}));`,
      );
    } else if (s.inFn) {
      // A local the site names stays in the temporal dead zone there: reading it is a located error, never the
      // global (`open`, `name`: the evaluator's window) or the module binding of the same name.
      const names = new Set(expr.match(/[\p{L}\p{N}_$]+/gu));
      const dead = [...s.locals].filter((x) => names.has(x));
      hoisted.push(
        dead.length ? `{ ${site}${expr}); let ${dead.join(", ")}; }` : `${site}${expr});`,
      );
    } else {
      ms.prependLeft(s.start, site).appendRight(s.end, ")");
      hoisted.push(`__unseen(${file}, ${n}) && ${site}${expr});`);
    }
  });
  // cssints members are properties of `css` (macro.ts): named imports destructure it.
  imp.decls.forEach((d, i) => {
    const from = String(d.source.value);
    if (!isCssints(from)) return;
    const ns = d.specifiers.find((x) => x.type === "ImportNamespaceSpecifier");
    const bind = ns
      ? ns.local.name
      : `{ ${d.specifiers.map((x) => `${Formatter.formatJson(importedName(x))}: ${x.local.name}`).join(", ")} }`;
    // a group has its own members: the ones of `css` that it has, and the checks of its tokens (group.ts)
    const id = from.slice(RUNTIME.length + 1);
    const source =
      id && id !== "limited-availability"
        ? `__group${i}(${Formatter.formatJson(id)})`
        : `__css${i}`;
    ms.overwrite(
      d.start,
      d.end,
      `import { css as __css${i}, __group as __group${i} } from ${Formatter.formatJson(RUNTIME)}; const ${bind} = ${source};`,
    );
  });
  ms.prepend(
    `import { __at, __cnGroup, __nocn, __site, __unseen } from ${Formatter.formatJson(RUNTIME)};\n`,
  );
  if (hoisted.length)
    ms.append(`\nexport function __cssints_hoisted() {\n${hoisted.join("\n")}\n}\n`);
  return { code: ms.toString(), sites, imp };
});
