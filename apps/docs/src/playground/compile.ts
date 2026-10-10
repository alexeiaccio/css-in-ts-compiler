// The engine as a function of some source files: what plugin.ts does for each module (instrument, evaluate, replace the sites,
// render the sheet), over the engine files themselves. Differences from the plugin: a module runner of one module (ESM turned into a
// function body here, where Vite's ssr transform does it in Node), TypeScript and JSX removed by oxc-transform (wasm), and no
// DOM in the evaluation (a worker has none; Node gives the evaluator a happy-dom window).
import "./shims/process.ts";
import * as lib from "cssints-src/index.ts";
import { transformSync } from "@oxc-transform/binding-wasm32-wasi";
import { Cause, Effect, Exit, Formatter, Predicate } from "effect";
import MagicString from "magic-string";
import { targets } from "virtual:playground/data";
import { entries, externals, sources } from "virtual:playground/packages";
import { RUNTIME_ID } from "cssints-src/delivery.ts";
import { moduleEntries } from "cssints-src/entries.ts";
import { evaluate } from "cssints-src/evaluate.ts";
import {
  CV_CALL,
  type Instrumented,
  instrument,
  keptImport,
  RUNTIME,
} from "cssints-src/instrument.ts";
import { forget, Registry, registry } from "cssints-src/registry.ts";
import runtimeSource from "cssints-src/runtime.ts?raw";
import { renderSheet } from "cssints-src/sheet.ts";

import { parseSync } from "./shims/oxc-parser.ts";
import { browserslistToTargets, ready, transform } from "./shims/lightningcss.ts";

/** The files of the playground: a name (a path without the leading slash) and its text; the first is the entry. */
export type Files = Record<string, string>;

export interface Diagnostic {
  file: string;
  message: string;
  /** 1-based */
  line: number;
  /** 1-based */
  column: number;
  /** the source text from the line, a code frame lines of it */
  frame: string;
}

export interface Output {
  /** what the plugin returns for the module: the source with each site replaced by its class string */
  module: string;
  /** the same with types and JSX removed (JSX becomes calls of `h`): what the preview runs */
  js: string;
  /** the body of a function (h, Fragment, imports) that returns the module's exports: see preview.ts */
  body: string;
}

export type Compiled =
  | {
      ok: true;
      /** the name of the first file, the one the preview runs */
      entry: string;
      /** by file name */
      files: Record<string, Output>;
      /** the sheet as cssints prints it, of all the files */
      css: string;
      /** the sheet after LightningCSS for the targets of this site, as a build ships it (not minified) */
      shipped: string;
      classes: string[];
      warnings: string[];
    }
  | { ok: false; errors: Diagnostic[]; warnings: string[] };

// The modules a file may import: the library as Node's evaluator sees it, the plugins of the cssints package, and the plugin
// packages that run without Node (plugin/playground.ts), which are files like the user's. The plugins are imported once the
// library has run: they call the engine at load (scope()), and the library waits for the wasm parser (a top-level await) while a
// module that does not import it would not.
const MODULES: Record<string, unknown> = { cssints: lib };
const KNOWN = [
  "cssints",
  "cssints/plugin",
  "cssints/frame",
  "cssints/surface",
  ...Object.keys(entries),
];
const moduleOf = async (name: string) => {
  if (!Object.hasOwn(MODULES, name)) {
    const [author, frame, surface] = await Promise.all([
      import("cssints-src/author.ts"),
      import("cssints-src/frame.ts"),
      import("cssints-src/surface.ts"),
    ]);
    Object.assign(MODULES, {
      "cssints/plugin": author,
      "cssints/frame": frame,
      "cssints/surface": surface,
    });
    if (Object.hasOwn(externals, name)) MODULES[name] = await externals[name]!();
  }
  if (!Object.hasOwn(MODULES, name))
    throw new Error(`"${name}" is not available in the playground`);
  return MODULES[name];
};

const lineCol = (text: string, offset: number) => {
  let line = 1;
  let lineStart = 0;
  for (let i = text.indexOf("\n"); i !== -1 && i < offset; i = text.indexOf("\n", i + 1)) {
    line++;
    lineStart = i + 1;
  }
  return { line, column: offset - lineStart + 1 };
};

const diagnostic = (file: string, source: string, message: string, offset: number): Diagnostic => {
  const at = lineCol(source, Math.max(0, Math.min(offset, source.length)));
  const lines = source.split("\n");
  const first = Math.max(0, at.line - 3);
  const frame = lines
    .slice(first, at.line)
    .map((l, i) => `${String(first + i + 1).padStart(3)} | ${l}`)
    .concat(`    | ${" ".repeat(at.column - 1)}^`)
    .join("\n");
  return { file, message, ...at, frame };
};

// ---------- ESM as a function

interface Pos {
  start: number;
  end: number;
}
interface Ident extends Pos {
  name?: string;
  value?: string;
}
interface Node extends Pos {
  type: string;
  [key: string]: unknown;
}
interface Statement extends Node {
  source?: { value: string };
  specifiers?: (Node & { local: Ident; imported?: Ident; exported?: Ident })[];
  declaration?: (Node & { id?: Ident; declarations?: { id: Node }[] }) | null;
}

const nameOf = (i: Ident) => i.name ?? i.value!;

const bound = (pattern: unknown, out: string[]) => {
  if (!Predicate.isObject(pattern)) return;
  const p = pattern as Record<string, unknown>;
  if (p["type"] === "Identifier") out.push(p["name"] as string);
  else if (p["type"] === "ArrayPattern") (p["elements"] as unknown[]).forEach((e) => bound(e, out));
  else if (p["type"] === "ObjectPattern")
    (p["properties"] as Record<string, unknown>[]).forEach((x) =>
      bound(x["value"] ?? x["argument"], out),
    );
  else if (p["type"] === "AssignmentPattern") bound(p["left"], out);
  else if (p["type"] === "RestElement") bound(p["argument"], out);
};

// A relative specifier is the id of a file ("/tokens.ts"): the name as written, or with an extension a bundler would add.
const resolveFile = (
  importer: string,
  spec: string,
  has: (name: string) => boolean,
): string | undefined => {
  if (!spec.startsWith(".")) return undefined;
  const parts: string[] = [];
  for (const p of `${importer.slice(0, importer.lastIndexOf("/"))}/${spec}`.split("/"))
    if (p === "..") parts.pop();
    else if (p && p !== ".") parts.push(p);
  const base = parts.join("/");
  const found = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`].find(
    has,
  );
  return found && `/${found}`;
};

// Imports become a read of `await __imp(specifier)` (a file by its id, a module by its name), exports become getters of
// `__exports`: the module is the body of an async function `(__imp, ...) => __exports`. A static `import` is hoisted in a module
// and not in a function; nothing here reads an import before the line that imports it, and the instrumented code puts its own first.
const asBody = (code: string, id: string, files: Files = {}): string => {
  const has = (n: string) => Object.hasOwn(files, n) || Object.hasOwn(sources, `/${n}`);
  const { program, errors } = parseSync(id, code, { lang: "js" });
  if (errors.length) throw new Error(errors[0]!.message);
  const ms = new MagicString(code);
  const exports: [string, string][] = [];
  const from = (s: Statement) =>
    Formatter.formatJson(resolveFile(id, s.source!.value, has) ?? s.source!.value);
  for (const s of program.body as Statement[]) {
    if (s.type === "ImportDeclaration") {
      const spec = s.specifiers!;
      const ns = spec.find((x) => x.type === "ImportNamespaceSpecifier");
      const pairs = spec
        .filter((x) => x !== ns)
        .map((x) =>
          x.type === "ImportDefaultSpecifier"
            ? `default: ${x.local.name}`
            : `${Formatter.formatJson(nameOf(x.imported!))}: ${x.local.name}`,
        );
      ms.overwrite(
        s.start,
        s.end,
        ns
          ? `const ${ns.local.name} = await __imp(${from(s)});`
          : pairs.length
            ? `const { ${pairs.join(", ")} } = await __imp(${from(s)});`
            : `await __imp(${from(s)});`,
      );
    } else if (s.type === "ExportNamedDeclaration") {
      const d = s.declaration;
      if (d) {
        ms.remove(s.start, d.start);
        const names: string[] = [];
        if (d.declarations) d.declarations.forEach((x) => bound(x.id, names));
        else if (d.id) names.push(d.id.name!);
        names.forEach((n) => exports.push([n, n]));
      } else if (s.source) {
        const local = `__from${s.start}`;
        ms.overwrite(s.start, s.end, `const ${local} = await __imp(${from(s)});`);
        for (const x of s.specifiers!)
          exports.push([nameOf(x.exported!), `${local}[${Formatter.formatJson(nameOf(x.local))}]`]);
      } else {
        ms.remove(s.start, s.end);
        for (const x of s.specifiers!) exports.push([nameOf(x.exported!), x.local.name!]);
      }
    } else if (s.type === "ExportDefaultDeclaration") {
      const d = s.declaration!;
      if ((d.type === "FunctionDeclaration" || d.type === "ClassDeclaration") && d.id) {
        ms.remove(s.start, d.start);
        exports.push(["default", d.id.name!]);
      } else {
        ms.overwrite(s.start, d.start, "const __default = ");
        exports.push(["default", "__default"]);
      }
    } else if (s.type === "ExportAllDeclaration") {
      throw new Error(`export * from "${s.source!.value}" is not available in the playground`);
    }
  }
  const getters = exports
    .map(([e, l]) => `${Formatter.formatJson(e)}: { get: () => ${l}, enumerable: true }`)
    .join(", ");
  return `"use strict";\nconst __exports = {};\nObject.defineProperties(__exports, { ${getters} });\n${ms.toString()}\nreturn __exports;`;
};

const AsyncFunction = (async () => {}).constructor as unknown as new (
  ...args: string[]
) => (...values: unknown[]) => Promise<Record<string, unknown>>;

// ---------- TypeScript and JSX

interface Stripped {
  code: string;
  errors: { message: string; labels: { start: number }[] }[];
}
const strip = (code: string, pragma: string, id: string): Stripped =>
  transformSync(id, code, {
    lang: "tsx",
    jsx: { runtime: "classic", pragma, pragmaFrag: pragma === "h" ? "Fragment" : pragma },
    sourcemap: false,
  });

// ---------- one compile

const idOf = (name: string) => `/${name}`;
const nameFrom = (id: string) => id.slice(1);
let previous: string[] = [];

// Each compile is an edit of the files: what they left in the registry is dropped, as the plugin's hotUpdate does.
const edit = (ids: string[]) => {
  registry.warned.clear();
  registry.warnings.length = 0;
  for (const id of new Set([...previous, ...ids])) forget(id);
  previous = ids;
};

// A package's file is run as a user's is, instrumented for the evaluation (Node's runner does the same). Its code does not change
// between compiles; each compile runs it again, as the runner of Node does for the modules that are not the library.
const packageBodies = new Map<string, Promise<string>>();
const packageBody = (id: string) =>
  packageBodies.get(id) ??
  packageBodies
    .set(
      id,
      (async () => {
        const code = await sources[id]!();
        const site = await Effect.runPromise(instrument(code, id, false));
        const out = strip(site?.code ?? code, "__jsx", id);
        if (out.errors.length) throw new Error(`${id}: ${out.errors[0]!.message}`);
        return asBody(out.code, id);
      })(),
    )
    .get(id)!;

// The files run in a runner of the engine's kind: a module is imported once per evaluation (a table of promises), a file by its
// id and anything else from the module table. `__jsx` is the evaluator's no-op for JSX (an element has no value at build time).
const runner = (bodies: Map<string, string>) => {
  const cache = new Map<string, Promise<Record<string, unknown>>>();
  const load = (id: string) => {
    const hit = cache.get(id);
    if (hit) return hit;
    const run = (async () => {
      const body =
        bodies.get(id) ?? (Object.hasOwn(sources, id) ? await packageBody(id) : undefined);
      if (body === undefined) throw new Error(`"${id}" is not a file of the playground`);
      return new AsyncFunction("__imp", "__jsx", body)(imp, () => null);
    })();
    cache.set(id, run);
    return run;
  };
  const imp = (name: string) =>
    name.startsWith("/")
      ? load(name)
      : Object.hasOwn(entries, name)
        ? load(entries[name]!)
        : moduleOf(name);
  return {
    evaluatedModules: {
      idToModuleMap: new Map(),
      urlToIdModuleMap: new Map(),
      fileToModulesMap: new Map(),
    },
    import: load,
  } as unknown as Parameters<typeof evaluate>[0];
};

// Syntax errors, and imports that name nothing: a file that is not there, a module the playground does not have.
const problems = (files: Files): Diagnostic[] =>
  Object.entries(files).flatMap(([name, source]) => {
    const { program, errors } = parseSync(idOf(name), source, { lang: "tsx" });
    if (errors.length)
      return errors.map((e) => diagnostic(name, source, e.message, e.labels[0]?.start ?? 0));
    return (program.body as Statement[]).flatMap((s) => {
      const spec = s.source?.value;
      if (
        spec === undefined ||
        !/^(Import|Export)/.test(s.type) ||
        (s as unknown as { importKind?: string }).importKind?.startsWith("type") ||
        (s as unknown as { exportKind?: string }).exportKind?.startsWith("type") ||
        resolveFile(idOf(name), spec, (n) => Object.hasOwn(files, n)) ||
        KNOWN.includes(spec)
      )
        return [];
      const message = spec.startsWith(".")
        ? `cannot find "${spec}" among the files: ${Object.keys(files).join(", ")}`
        : `"${spec}" is not available in the playground: the modules are ${KNOWN.join(", ")}`;
      return [diagnostic(name, source, message, s.start)];
    });
  });

const located = (files: Files, fallback: string, e: unknown): Diagnostic => {
  const message = Predicate.hasProperty(e, "message") ? String(e.message) : String(e);
  const file =
    Predicate.hasProperty(e, "file") && Predicate.isString(e.file) ? nameFrom(e.file) : "";
  const name = Object.hasOwn(files, file) ? file : fallback;
  const offset = Predicate.hasProperty(e, "offset") && Predicate.isNumber(e.offset) ? e.offset : 0;
  return diagnostic(name, files[name]!, message.replace(/\n[\s\S]*$/, ""), offset);
};

const shipped = (css: string) =>
  transform({
    filename: "playground.css",
    code: new TextEncoder().encode(css),
    minify: false,
    targets: browserslistToTargets(targets),
  }).code.toString();

const strips = (name: string, code: string, pragma: string): Stripped | Diagnostic[] => {
  const out = strip(code, pragma, idOf(name));
  return out.errors.length
    ? out.errors.map((e) => diagnostic(name, code, e.message, e.labels[0]?.start ?? 0))
    : out;
};

const program = Effect.fn("playground.compile")(function* (files: Files) {
  const names = Object.keys(files);
  yield* Effect.sync(() => edit(names.map(idOf)));
  const fail = (errors: Diagnostic[], warnings: string[] = []) =>
    ({ ok: false, errors, warnings }) satisfies Compiled;
  const bad = problems(files);
  if (bad.length) return fail(bad);

  // what the plugin finds in each file: its sites (none: the plugin leaves the module as it is), and the code the runner runs
  const parsed = new Map<string, Instrumented>();
  const bodies = new Map<string, string>();
  for (const name of names) {
    const id = idOf(name);
    const site = yield* instrument(files[name]!, id);
    let code = files[name]!;
    if (site) {
      parsed.set(name, site);
      code = (yield* instrument(code, id, false))!.code;
    }
    const out = strips(name, code, "__jsx");
    if (Array.isArray(out)) return fail(out);
    bodies.set(id, asBody(out.code, id, files));
  }

  const entries = new Map<string, string[]>();
  const sitesOf = new Map<string, Map<number, string>>();
  const runtimesOf = new Map<string, string[]>();
  const errors: Diagnostic[] = [];
  const warnings: string[] = [];
  for (const [name, site] of parsed) {
    const id = idOf(name);
    const recorded = (sites: Map<number, string>) =>
      Effect.gen(function* () {
        if (site.sites.every((_, n) => sites.has(n))) {
          const made = yield* moduleEntries(id, sites);
          // as plugin.ts `record`: sorted, once each
          entries.set(name, [...new Set(made.entries)].sort());
          runtimesOf.set(name, made.runtimes);
        }
        return sites;
      });
    const exit = yield* Effect.exit(evaluate(runner(bodies), id, recorded));
    warnings.push(...(yield* Registry).warnings.splice(0).map((w) => w.message));
    if (Exit.isFailure(exit)) {
      const e = located(files, name, Cause.squash(exit.cause));
      if (!errors.some((x) => x.file === e.file && x.line === e.line && x.column === e.column))
        errors.push(e);
    } else sitesOf.set(name, exit.value);
  }
  if (errors.length) return fail(errors, warnings);

  const css = yield* renderSheet([...entries.values()].flat());
  const out: Record<string, Output> = {};
  const classes = new Set<string>();
  for (const name of names) {
    const source = files[name]!;
    const site = parsed.get(name);
    let module = source;
    if (site) {
      const sites = sitesOf.get(name)!;
      const runtimes = runtimesOf.get(name) ?? [];
      const ms = new MagicString(source);
      if (runtimes.length)
        ms.prepend(
          runtimes.map((n) => `import ${Formatter.formatJson(RUNTIME_ID + n)};\n`).join(""),
        );
      if ([...sites.values()].some((r) => r.startsWith(CV_CALL)))
        ms.prepend(`import { _cv as __cv } from ${Formatter.formatJson(RUNTIME)};\n`);
      for (const [n, s] of site.sites.entries()) ms.overwrite(s.start, s.end, sites.get(n)!);
      for (const decl of site.imp.decls) {
        const kept = keptImport(decl, source);
        if (kept) ms.overwrite(decl.start, decl.end, kept);
        else ms.remove(decl.start, decl.end);
      }
      module = ms.toString();
      for (const m of module.matchAll(/"(_[\w-]+(?: _[\w-]+)*)"/g))
        m[1]!.split(" ").forEach((c) => classes.add(c));
    }
    const js = strips(name, module, "h");
    if (Array.isArray(js)) return fail(js);
    out[name] = { module, js: js.code, body: asBody(js.code, idOf(name), files) };
  }
  return {
    ok: true,
    entry: names[0]!,
    files: out,
    css,
    shipped: shipped(css),
    classes: [...classes],
    warnings,
  } satisfies Compiled;
});

/** The wasm engines are loaded: lightningcss (the module loads the others when it first needs them). */
export const loaded = ready;

/**
 * Compiles the files; a failure of the user's code is a located diagnostic, never a rejection.
 * @param {Files} files the modules; the first is the entry
 * @returns {Promise<Compiled>} what the plugin makes of them, or the errors
 */
export const compile = async (files: Files): Promise<Compiled> => {
  await ready;
  const exit = await Effect.runPromiseExit(program(files));
  if (Exit.isSuccess(exit)) return exit.value;
  const failure = Cause.squash(exit.cause);
  const warnings = registry.warnings.splice(0).map((w) => w.message);
  return { ok: false, errors: [located(files, Object.keys(files)[0]!, failure)], warnings };
};

/**
 * The runtime of the client, for the preview.
 * @returns {string} the body of a function of `__imp` that returns the exports of cssints/runtime: `cx` and `_cv`
 */
export const runtimeBody = (): string =>
  asBody(strip(runtimeSource, "h", "runtime.ts").code, "runtime.js");
