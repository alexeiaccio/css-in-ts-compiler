// The engine as a function of a source text: what plugin.ts does for one module (instrument, evaluate, replace the sites, render
// the sheet), over the engine files themselves. Differences from the plugin: a module runner of one module (ESM turned into a
// function body here, where Vite's ssr transform does it in Node), TypeScript and JSX removed by oxc-transform (wasm), and no
// DOM in the evaluation (a worker has none; Node gives the evaluator a happy-dom window).
import "./shims/process.ts";
import * as lib from "cssints-src/index.ts";
import { transformSync } from "@oxc-transform/binding-wasm32-wasi";
import { Cause, Effect, Exit, Formatter, Predicate } from "effect";
import MagicString from "magic-string";
import { targets } from "virtual:playground/data";
import { RUNTIME_ID } from "cssints-src/delivery.ts";
import { moduleEntries } from "cssints-src/entries.ts";
import { evaluate } from "cssints-src/evaluate.ts";
import { CV_CALL, instrument, keptImport, RUNTIME } from "cssints-src/instrument.ts";
import { forget, Registry, registry } from "cssints-src/registry.ts";
import runtimeSource from "cssints-src/runtime.ts?raw";
import { renderSheet } from "cssints-src/sheet.ts";

import { parseSync } from "./shims/oxc-parser.ts";
import { browserslistToTargets, ready, transform } from "./shims/lightningcss.ts";

export const FILE = "/playground.tsx";

export interface Diagnostic {
  message: string;
  /** 1-based */
  line: number;
  /** 1-based */
  column: number;
  /** the source text from the line, a code frame lines of it */
  frame: string;
}

export type Compiled =
  | {
      ok: true;
      /** what the plugin returns for the module: the source with each site replaced by its class string */
      module: string;
      /** the same with types and JSX removed (JSX becomes calls of `h`): what the preview runs */
      js: string;
      /** the sheet as cssints prints it */
      css: string;
      /** the sheet after LightningCSS for the targets of this site, as a build ships it (not minified) */
      shipped: string;
      classes: string[];
      warnings: string[];
      /** the body of a function (h, Fragment, imports) that returns the module's exports: see preview.ts */
      body: string;
    }
  | { ok: false; errors: Diagnostic[]; warnings: string[] };

// The modules a playground file may import: the library as Node's evaluator sees it, and the plugins of the cssints package.
// The plugins are imported once the library has run: they call the engine at load (scope()), and the library waits for the wasm
// parser (a top-level await) while a module that does not import it would not.
const MODULES: Record<string, unknown> = { cssints: lib };
const plugins = async () => {
  if (Object.hasOwn(MODULES, "cssints/frame")) return;
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

const diagnostic = (source: string, message: string, offset: number): Diagnostic => {
  const at = lineCol(source, Math.max(0, Math.min(offset, source.length)));
  const lines = source.split("\n");
  const first = Math.max(0, at.line - 3);
  const frame = lines
    .slice(first, at.line)
    .map((l, i) => `${String(first + i + 1).padStart(3)} | ${l}`)
    .concat(`    | ${" ".repeat(at.column - 1)}^`)
    .join("\n");
  return { message, ...at, frame };
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

// Imports become a read of `__imp(specifier)`, exports become getters of `__exports`: the module is the body of an async
// function `(__imp, ...) => __exports`. A static `import` is hoisted in a module and not in a function; nothing here reads
// an import before the line that imports it, and the instrumented code puts its own first.
const asBody = (code: string, id: string): string => {
  const { program, errors } = parseSync(id, code, { lang: "js" });
  if (errors.length) throw new Error(errors[0]!.message);
  const ms = new MagicString(code);
  const exports: [string, string][] = [];
  for (const s of program.body as Statement[]) {
    if (s.type === "ImportDeclaration") {
      const from = Formatter.formatJson(s.source!.value);
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
          ? `const ${ns.local.name} = __imp(${from});`
          : pairs.length
            ? `const { ${pairs.join(", ")} } = __imp(${from});`
            : `__imp(${from});`,
      );
    } else if (s.type === "ExportNamedDeclaration") {
      const d = s.declaration;
      if (d) {
        ms.remove(s.start, d.start);
        const names: string[] = [];
        if (d.declarations) d.declarations.forEach((x) => bound(x.id, names));
        else if (d.id) names.push(d.id.name!);
        names.forEach((n) => exports.push([n, n]));
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
const strip = (code: string, pragma: string, id = FILE): Stripped =>
  transformSync(id, code, {
    lang: "tsx",
    jsx: { runtime: "classic", pragma, pragmaFrag: pragma === "h" ? "Fragment" : pragma },
    sourcemap: false,
  });

// ---------- one compile

// Each compile is an edit of the same module: what the module left in the registry is dropped, as the plugin's hotUpdate does.
const edit = () => {
  registry.warned.clear();
  registry.warnings.length = 0;
  forget(FILE);
};

// A module that is run once. `__jsx` is the evaluator's no-op for JSX (an element has no value at build time).
const runner = (body: string) =>
  ({
    evaluatedModules: {
      idToModuleMap: new Map(),
      urlToIdModuleMap: new Map(),
      fileToModulesMap: new Map(),
    },
    import: () =>
      new AsyncFunction("__imp", "__jsx", body)(
        (name: string) => {
          if (!Object.hasOwn(MODULES, name))
            throw new Error(`"${name}" is not available in the playground`);
          return MODULES[name];
        },
        () => null,
      ),
  }) as unknown as Parameters<typeof evaluate>[0];

const unsupported = (source: string): Diagnostic[] => {
  const { program } = parseSync(FILE, source, { lang: "tsx" });
  return (program.body as Statement[]).flatMap((s) =>
    s.type === "ImportDeclaration" &&
    !(s as unknown as { importKind?: string }).importKind?.startsWith("type") &&
    !Object.hasOwn(MODULES, s.source!.value)
      ? [
          diagnostic(
            source,
            `"${s.source!.value}" is not available in the playground: it has one file and the modules ${Object.keys(MODULES).join(", ")}`,
            s.start,
          ),
        ]
      : [],
  );
};

const located = (source: string, e: unknown): Diagnostic => {
  const message = Predicate.hasProperty(e, "message") ? String(e.message) : String(e);
  const offset = Predicate.hasProperty(e, "offset") && Predicate.isNumber(e.offset) ? e.offset : 0;
  return diagnostic(source, message.replace(/\n[\s\S]*$/, ""), offset);
};

const shipped = (css: string) =>
  transform({
    filename: "playground.css",
    code: new TextEncoder().encode(css),
    minify: false,
    targets: browserslistToTargets(targets),
  }).code.toString();

const plain = Effect.fnUntraced(function* (source: string) {
  const js = strip(source, "h");
  const css = yield* renderSheet([]);
  return {
    ok: true,
    module: source,
    js: js.code,
    css,
    shipped: shipped(css),
    classes: [],
    warnings: [],
    body: asBody(js.code, FILE),
  } satisfies Compiled;
});

const program = Effect.fn("playground.compile")(function* (source: string) {
  yield* Effect.sync(edit);
  const syntax = parseSync(FILE, source, { lang: "tsx" }).errors;
  if (syntax.length)
    return {
      ok: false,
      errors: syntax.map((e) => diagnostic(source, e.message, e.labels[0]?.start ?? 0)),
      warnings: [],
    } satisfies Compiled;
  const bad = unsupported(source);
  if (bad.length) return { ok: false, errors: bad, warnings: [] } satisfies Compiled;

  const parsed = yield* instrument(source, FILE);
  // no import `with { type: "cssints" }`: the plugin leaves the module as it is, and so does this
  if (!parsed) return yield* plain(source);
  const ssr = yield* instrument(source, FILE, false);
  const code = strip(ssr!.code, "__jsx");
  if (code.errors.length)
    return {
      ok: false,
      errors: code.errors.map((e) => diagnostic(source, e.message, e.labels[0]?.start ?? 0)),
      warnings: [],
    } satisfies Compiled;

  const recorded = (sites: Map<number, string>) =>
    Effect.gen(function* () {
      let css = "";
      let runtimes: string[] = [];
      if (parsed.sites.every((_, n) => sites.has(n))) {
        const made = yield* moduleEntries(FILE, sites);
        // as plugin.ts `record`: sorted, once each
        const entries = [...new Set(made.entries)].sort().join("\n").split("\n");
        css = yield* renderSheet(entries);
        runtimes = made.runtimes;
      }
      return { sites, css, runtimes };
    });
  const { sites, css, runtimes } = yield* evaluate(runner(asBody(code.code, FILE)), FILE, recorded);
  const warnings = (yield* Registry).warnings.splice(0).map((w) => w.message);

  const ms = new MagicString(source);
  if (runtimes.length)
    ms.prepend(runtimes.map((n) => `import ${Formatter.formatJson(RUNTIME_ID + n)};\n`).join(""));
  if ([...sites.values()].some((r) => r.startsWith(CV_CALL)))
    ms.prepend(`import { _cv as __cv } from ${Formatter.formatJson(RUNTIME)};\n`);
  for (const [n, s] of parsed.sites.entries()) ms.overwrite(s.start, s.end, sites.get(n)!);
  for (const decl of parsed.imp.decls) {
    const kept = keptImport(decl, source);
    if (kept) ms.overwrite(decl.start, decl.end, kept);
    else ms.remove(decl.start, decl.end);
  }
  const module = ms.toString();
  const js = strip(module, "h");
  const classes = [
    ...new Set([...module.matchAll(/"(_[\w-]+(?: _[\w-]+)*)"/g)].flatMap((m) => m[1]!.split(" "))),
  ];
  return {
    ok: true,
    module,
    js: js.code,
    css,
    shipped: shipped(css),
    classes,
    warnings,
    body: asBody(js.code, FILE),
  } satisfies Compiled;
});

/** The wasm engines are loaded: lightningcss (the module loads the others when it first needs them). */
export const loaded = ready;

/**
 * Compiles a source text; a failure of the user's code is a located diagnostic, never a rejection.
 * @param {string} source the module
 * @returns {Promise<Compiled>} what the plugin makes of it, or the errors
 */
export const compile = async (source: string): Promise<Compiled> => {
  await ready;
  await plugins();
  const exit = await Effect.runPromiseExit(program(source));
  if (Exit.isSuccess(exit)) return exit.value;
  const failure = Cause.squash(exit.cause);
  const warnings = registry.warnings.splice(0).map((w) => w.message);
  return { ok: false, errors: [located(source, failure)], warnings };
};

/**
 * The runtime of the client, for the preview.
 * @returns {string} the body of a function of `__imp` that returns the exports of cssints/runtime: `cx` and `_cv`
 */
export const runtimeBody = (): string =>
  asBody(strip(runtimeSource, "h", "runtime.ts").code, "runtime.js");
