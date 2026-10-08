// The sheet: the declared layers (`layers()`), the @property rules of tokens, then the kernels, the global rules of members and css.global(), the token sets and themes and the data of the derived-token runtime (layer _.k), then every rule once, sorted by layer, condition, shorthand before
// longhand, class; the rules of one layer under the same at-rules share a block.

import { Effect, Formatter, Schema } from "effect";

import { FALLBACK } from "./delivery.ts";
import { derivedRule } from "./derived-data.ts";
import { MacroError } from "./errors.ts";
import { KERNEL } from "./kernel.ts";
import { width } from "./leaves.ts";
import {
  type At,
  GLOBAL,
  type GlobalRule,
  type Kernel,
  type Rule,
  Registry,
  type RegistryState,
  type Themed,
} from "./registry.ts";

// @effect-diagnostics-next-line schemaSync:off -- the entries are what formatJson wrote, read back in a sync map
const fromJson = Schema.decodeSync(Schema.fromJsonString(Schema.Unknown));

// The entries of token sets and themes start with this and a tab: `@theme\t<key>\t<css>`.
const THEME = "@theme\t";

// _.k is the layer of global rules (addGlobal, kernels), below every class layer: _.a (no condition) to _.e (four).
export const LAYERS = "@layer _.k, _.a, _.b, _.c, _.d, _.e;";

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const cmpCond = (a: number[], b: number[]) =>
  a.reduce((d, x, i) => d || (i < b.length ? x - b[i]! : 0), 0) || a.length - b.length;

type Sortable = Rule & { cls: string };
const wrapKey = (r: Rule) => r.wrap.join("{");
export const byOrder = (a: Sortable, b: Sortable) =>
  cmp(a.layer, b.layer) ||
  cmpCond(a.cond, b.cond) ||
  cmp(wrapKey(a), wrapKey(b)) ||
  width(b.prop) - width(a.prop) ||
  cmp(a.cls, b.cls);

// The entries of global rules and of declared layers: `@global\t<json of [layer, css]>`, `@layers\ta,b,c`.
const GLOBAL_RULE = "@global\t";
const LAYER_LIST = "@layers\t";
const LAYER_NAME = /^[A-Za-z_][\w-]*$/;

/** Adds a global rule (`*{box-sizing:border-box}`) of a plugin member, by its content, to the sheet of the module at `at`. `layer` names a declared top-level layer to wrap it in, no layer puts it in `_.k`. */
export const addGlobal = Effect.fnUntraced(function* (g: GlobalRule, at?: At) {
  const { globals } = yield* Registry;
  if (g.layer !== undefined) yield* requireLayer(g.layer, at);
  const key = `${g.layer ?? ""}\t${g.css}`;
  const entry = globals.get(key) ?? globals.set(key, { global: g, users: new Set() }).get(key)!;
  if (at) entry.users.add(at.file);
});

// The global rules a module holds: one line each, so the sheet needs no registry.
export const globalEntries = ({ globals }: RegistryState, file: string) =>
  [...globals.values()].flatMap((e) =>
    e.users.has(file)
      ? [`${GLOBAL_RULE}${Formatter.formatJson([e.global.layer ?? "", e.global.css])}`]
      : [],
  );

/**
 * Declares top-level layers, in order: the statement `@layer a, b, c;`, printed after the engine's own layers, once
 * whoever declares it, so what is in them beats the engine's `:root` fallbacks. Another statement may name the same layers
 * in the same order, or hold or be held by this one; layers in another order, or shared without one holding the other,
 * are build errors at `at`, since the sheet could not say which comes first.
 */
export const addLayers = Effect.fnUntraced(function* (names: readonly string[], at?: At) {
  const { layers } = yield* Registry;
  const fail = (message: string) => new MacroError({ message: `cssints: ${message}`, ...at });
  const list = names.join(", ");
  if (
    !names.length ||
    new Set(names).size !== names.length ||
    !names.every((n) => LAYER_NAME.test(n))
  )
    return yield* fail(
      `layers(${list}) takes names of layers, each once: letters, digits, _ and -`,
    );
  for (const l of layers.values()) {
    const mine = names.filter((n) => l.names.includes(n));
    if (mine.length && mine.join() !== l.names.filter((n) => names.includes(n)).join())
      return yield* fail(
        `layers(${list}) names layers in another order than layers(${l.names.join(", ")})`,
      );
    if (mine.length && mine.length < Math.min(names.length, l.names.length))
      return yield* fail(
        `layers(${list}) and layers(${l.names.join(", ")}) share layers, and neither holds the other: declare them in one call`,
      );
  }
  const key = names.join();
  const entry =
    layers.get(key) ?? layers.set(key, { names: [...names], users: new Set() }).get(key)!;
  if (at) entry.users.add(at.file);
});

/** A build error at `at` unless `layer` is declared by a `layers()` that has run (this module, or one it imports). */
export const requireLayer = Effect.fnUntraced(function* (layer: string, at?: At) {
  const { layers } = yield* Registry;
  if (![...layers.values()].some((l) => l.names.includes(layer)))
    return yield* new MacroError({
      message: `cssints: the layer "${layer}" is not declared: call layers("${layer}", ...) in this module or in one it imports`,
      ...at,
    });
});

// The layers a module declared: one line each.
export const layerEntries = ({ layers }: RegistryState, file: string) =>
  [...layers.values()].flatMap((l) =>
    l.users.has(file) ? [`${LAYER_LIST}${l.names.join()}`] : [],
  );

// The statements to print, each once, the longer first: one that holds another has already said its order.
export const layerStatements = (lists: Iterable<readonly string[]>) =>
  [...new Map([...lists].map((l) => [l.join(), [...l]])).values()].sort(
    (a, b) => b.length - a.length || cmp(a.join(), b.join()),
  );

// What a module records of token sets and themes: those it made, and those that set or read a variable it uses (`names`).
// One line each, sorted by `key` when the sheet is rendered.
export const themedEntries = (
  themed: Map<string, Themed>,
  file: string,
  names: Set<string>,
): string[] =>
  [...themed.values()].flatMap((t) =>
    t.file === file || t.names.some((n) => names.has(n))
      ? [`${THEME}${t.key}\t${t.layer ?? ""}\t${t.css}`]
      : [],
  );

// The variables that the global rules of `file` read: their tokens need a `@property` rule in its sheet.
export const globalNames = (themed: Map<string, Themed>, file: string): string[] =>
  [...themed.values()]
    .filter((t) => t.file === file && t.key.startsWith(GLOBAL))
    .flatMap((t) => t.css.match(/--[\w-]+/g) ?? []);

// Adds to `names` the tokens that those are made of: a derived token is `oklch(0.6 0.2 var(--hue-accent))`, no colour
// unless `--hue-accent` has its @property rule, and so is a theme value that refers to a token. Through chains. Only the
// declarations of those names count: a theme that sets 300 tokens adds nothing for the 299 the module does not use.
const DECL = /(--[\w-]+):([^;{}]*)/g;
export const closeNames = (
  names: Set<string>,
  defs: Map<string, { refs?: string[] }>,
  themed: Map<string, Themed>,
): void => {
  for (let size = -1; size !== names.size; ) {
    size = names.size;
    for (const n of [...names]) defs.get(n)?.refs?.forEach((r) => names.add(r));
    for (const t of themed.values())
      if (t.names.some((n) => names.has(n)))
        for (const [, n, value] of t.css.matchAll(DECL))
          if (names.has(n!)) value!.match(/--[\w-]+/g)?.forEach((r) => names.add(r));
  }
};

/** The rules of `entries`: class names, and the text of `@property` rules (once each, whichever module has them). */
export const renderSheet = Effect.fn("cssints.renderSheet")(function* (
  entries: Iterable<string>,
): Effect.fn.Return<string> {
  const { rules, layers } = yield* Registry;
  const all = [...new Set(entries)];
  const properties = all.filter((e) => e.startsWith("@property")).sort();
  const themes = all
    .flatMap((e) =>
      e.startsWith(THEME) ? [e.split("\t") as [string, string, string, string]] : [],
    )
    .sort((a, b) => cmp(a[1], b[1]));
  const kThemes = themes.filter((t) => t[2] === "");
  const topThemes = themes.filter((t) => t[2] !== "");
  const used = all
    .flatMap((e) => (e.startsWith(KERNEL) ? [fromJson(e.slice(KERNEL.length)) as Kernel] : []))
    .sort((a, b) => cmp(a.key, b.key));
  const fallbacks = all
    .flatMap((e) => (e.startsWith(FALLBACK) ? [fromJson(e.slice(FALLBACK.length)) as string] : []))
    .sort();
  const derived = yield* derivedRule(
    properties,
    themes.map((t) => t[1]),
  );
  const sorted = all
    .flatMap((cls) => {
      const rule = rules.get(cls);
      return rule ? [{ cls, ...rule }] : [];
    })
    .sort(byOrder);
  // Sorted by their text: the layer, then the css. Rules of one layer do not depend on each other's order (a look sets
  // a variable at most once per layer and selector).
  const globals = all
    .filter((e) => e.startsWith(GLOBAL_RULE))
    .sort(cmp)
    .map((e) => fromJson(e.slice(GLOBAL_RULE.length)) as [layer: string, css: string]);
  const kGlobals = globals.flatMap(([layer, css]) => (layer === "" ? [css] : []));
  const layered = globals.filter(([layer]) => layer !== "");
  // The statements of the modules of this sheet, and those that the layers it uses are declared in
  const inUse = new Set([...layered.map(([layer]) => layer), ...topThemes.map((t) => t[2])]);
  const statements = layerStatements([
    ...all.flatMap((e) =>
      e.startsWith(LAYER_LIST) ? [e.slice(LAYER_LIST.length).split(",")] : [],
    ),
    ...[...layers.values()].flatMap((l) => (l.names.some((n) => inUse.has(n)) ? [l.names] : [])),
  ]);
  let out = `${LAYERS}\n${[...properties, ...used.flatMap((k) => k.atProperty ?? [])].map((p) => `${p}\n`).join("")}`;
  // the declared layers follow the engine's, so everything named after them ranks above it
  out = out.replace("\n", `\n${statements.map((s) => `@layer ${s.join(", ")};\n`).join("")}`);
  if (kGlobals.length || used.length || fallbacks.length || kThemes.length)
    out += `@layer _.k {\n${[...kGlobals, ...used.map((k) => k.css), ...fallbacks, ...kThemes.map((t) => t[3]), ...(derived ? [derived] : [])].map((g) => `  ${g}\n`).join("")}}\n`;
  // Named top-level layers (a look's `@layer app`), declared by the statements above: after `_.k` and the class layers,
  // so a look beats the engine's `:root` fallbacks.
  for (const [layer, css] of layered) out += `@layer ${layer} {\n  ${css}\n}\n`;
  for (const t of topThemes) out += `@layer ${t[2]} {\n  ${t[3]}\n}\n`;
  let layer = "";
  let wrap = ""; // the at-rules that are open
  let depth = 0;
  const closeWrap = () => (out += depth ? `  ${"}".repeat(depth)}\n` : "");
  for (const r of sorted) {
    const key = wrapKey(r);
    if (r.layer !== layer) {
      closeWrap();
      out += `${layer ? "}\n" : ""}@layer ${r.layer} {\n`;
      layer = r.layer;
      wrap = "";
      depth = 0;
    }
    if (key !== wrap) {
      closeWrap();
      wrap = key;
      depth = r.wrap.length;
      if (depth) out += `  ${r.wrap.map((w) => `${w} {`).join(" ")}\n`;
    }
    out += `${depth ? "    " : "  "}${r.css}\n`;
  }
  closeWrap();
  return layer ? `${out}}\n` : out;
});
