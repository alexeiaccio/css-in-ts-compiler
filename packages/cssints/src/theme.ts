// createTokens(tree, name?): DTCG-shaped data to tokens (token.ts `declare`). Aliases keep their `@property` literal and
// stay live as `--a: var(--b)` on :root. createGlobalTheme(tokens, condition | selector, overrides): the tokens a theme
// sets, and the aliases that depend on them, under a condition or a selector. Both builders are called in user
// expressions, so their edge is plain code (`edge`); everything behind it is Effect.
import { checkSelector } from "@cssints/css-grammar/check";
import { DTCG_TYPES, type DtcgType, TOKEN_TYPES, type TokenType } from "@cssints/css-grammar/token";
import { Effect, Formatter, Predicate } from "effect";

import { MacroError } from "./errors.ts";
import { standIn } from "./derived-data.ts";
import { edge, fail } from "./lib.ts";
import { type At, registry, type ThemeRule } from "./registry.ts";
import { requireLayer } from "./sheet.ts";
import { checkSyntaxFx, CSSTokenValue, declare, nameOf, supportTest } from "./token.ts";

// The key of a token or group as code reads it: one that starts with a digit (`2xs`) is `_2xs`, a name.
const accessOf = (key: string) => (/^\d/.test(key) ? `_${key}` : key);

const SUPPORTED = Object.keys(DTCG_TYPES).join(", ");

// ---------- DTCG values to CSS text

// Named functions of css-color-4 (a percentage where DTCG has 0 to 100), the rest are `color(<space> ...)`.
const COLOR_FN: Record<string, number[]> = {
  hsl: [1, 2],
  hwb: [1, 2],
  lab: [],
  lch: [],
  oklab: [],
  oklch: [],
};
const COLOR_SPACES = new Set([
  "srgb",
  "srgb-linear",
  "display-p3",
  "a98-rgb",
  "prophoto-rgb",
  "rec2020",
  "xyz-d65",
  "xyz-d50",
]);
const FONT_WEIGHTS: Record<string, number> = {
  thin: 100,
  hairline: 100,
  "extra-light": 200,
  "ultra-light": 200,
  light: 300,
  normal: 400,
  regular: 400,
  book: 400,
  medium: 500,
  "semi-bold": 600,
  "demi-bold": 600,
  bold: 700,
  "extra-bold": 800,
  "ultra-bold": 800,
  black: 900,
  heavy: 900,
  "extra-black": 950,
  "ultra-black": 950,
};
const SHADOW = ["color", "offsetX", "offsetY", "blur", "spread"];
const UNITS: Record<string, string[]> = { dimension: ["px", "rem"], duration: ["ms", "s"] };

const isNumber = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const isComponent = (n: unknown) => isNumber(n) || n === "none";

// The CSS text of a DTCG value of `type`; a string is CSS already (the grammar checks it), so is a number of a number.
const cssOf = Effect.fnUntraced(function* (
  type: DtcgType,
  value: unknown,
  what: string,
): Effect.fn.Return<string, MacroError> {
  if (typeof value === "string") {
    const key = value.trim().toLowerCase();
    return type === "fontWeight" && Object.hasOwn(FONT_WEIGHTS, key)
      ? String(FONT_WEIGHTS[key])
      : value.trim();
  }
  if (isNumber(value) && (type === "number" || type === "fontWeight")) return String(value);
  if (Predicate.isObject(value) && type === "color") {
    const { colorSpace: space, components: c, alpha } = value;
    const named = typeof space === "string" ? COLOR_FN[space] : undefined;
    if (
      !(named || COLOR_SPACES.has(space as string)) ||
      !Array.isArray(c) ||
      c.length !== 3 ||
      !c.every(isComponent) ||
      (alpha !== undefined && !isNumber(alpha))
    )
      return yield* fail(
        `cssints: ${what} is not a DTCG colour: { colorSpace, components: [3 numbers or "none"], alpha? } with a colorSpace of hsl, hwb, lab, lch, oklab, oklch or ${[...COLOR_SPACES].join(", ")}`,
      );
    const parts = c.map((n: number | "none", i) =>
      named?.includes(i) && n !== "none" ? `${n}%` : n,
    );
    const a = alpha === undefined ? "" : ` / ${alpha}`;
    return named
      ? `${space as string}(${parts.join(" ")}${a})`
      : `color(${space as string} ${parts.join(" ")}${a})`;
  }
  if (type === "cubicBezier") {
    if (!Array.isArray(value) || value.length !== 4 || !value.every(isNumber))
      return yield* fail(`cssints: ${what} is not a DTCG cubicBezier: [x1, y1, x2, y2]`);
    return `cubic-bezier(${value.join(", ")})`;
  }
  if (type === "shadow") {
    const layers: unknown[] = Array.isArray(value) ? value : [value];
    const out: string[] = [];
    for (const l of layers) {
      if (
        !Predicate.isObject(l) ||
        SHADOW.some((k) => l[k] === undefined) ||
        (l.inset !== undefined && typeof l.inset !== "boolean")
      )
        return yield* fail(
          `cssints: ${what} is not a DTCG shadow: { color, offsetX, offsetY, blur, spread, inset? } or an array of them`,
        );
      const parts = [];
      for (const k of SHADOW.slice(1)) parts.push(yield* cssOf("dimension", l[k], `${what} ${k}`));
      parts.push(yield* cssOf("color", l.color, `${what} color`));
      out.push(`${l.inset ? "inset " : ""}${parts.join(" ")}`);
    }
    return out.join(", ");
  }
  const units = UNITS[type];
  if (Predicate.isObject(value) && units) {
    const { value: n, unit } = value;
    if (!isNumber(n) || typeof unit !== "string" || !units.includes(unit))
      return yield* fail(
        `cssints: ${what} is not a DTCG ${type}: { value: number, unit: ${units.join(" | ")} }`,
      );
    return `${n}${unit}`;
  }
  return yield* fail(
    `cssints: ${what} is not a DTCG ${type} value: ${Formatter.formatJson(value)}`,
  );
});

// A value that is only `var(--target)` needs no feature of its own, so it stays live.
const PURE = /^var\(--[\w-]+\)$/;

// ---------- createTokens

interface Leaf {
  path: string[];
  dotted: string;
  type?: string;
  value: unknown;
}

// What createGlobalTheme reads of a token set: its tokens by path, their DTCG types, and its aliases.
export interface TokenSet {
  tokens: Map<string, CSSTokenValue>;
  types: Map<string, DtcgType>;
  /** the tokens that stay live on others: `css` is the value with `var(--target)` for each reference */
  aliases: { name: string; targets: string[]; css: string }[];
  /** a set of cssints/tui (tui.ts): its tokens are no sheet's */
  terminal?: true;
}
// every group of every token set, by object: a subtree is a token set too
export const sets = new WeakMap<object, TokenSet>();

const ALIAS = /^\{([^{}]+)\}$/;
// a reference inside a CSS value: `color-mix(in oklab, {color.accent}, black 15%)`
const REF = /\{([^{}]+)\}/g;
const IGNORED = new Set(["$description", "$extensions", "$deprecated"]);
const kebab = (s: string) => s.replace(/([a-z\d])([A-Z])/g, "$1-$2").toLowerCase();

// What the Figma tools write that is not DTCG (docs/API.md "Themes", JSON from Figma): an error, not a silent misreading.
const RECIPE = "see docs/API.md, JSON from Figma";
// Tokens Studio's own $type names, and the DTCG type each stands for
const STUDIO_TYPES: Record<string, string> = {
  spacing: "dimension",
  sizing: "dimension",
  borderRadius: "dimension",
  borderWidth: "dimension",
  fontSizes: "dimension",
  letterSpacing: "dimension",
  paragraphSpacing: "dimension",
  paragraphIndent: "dimension",
  fontWeights: "fontWeight",
  lineHeights: "number",
  opacity: "number",
  boxShadow: "shadow",
};
// A token's $extensions that change what its $value means: a Tokens Studio colour modifier, a Figma boolean variable,
// the other modes of a variable (TokensBrücke's `mode`, `com.figma` `modes`).
const extensionError = (token: Record<string, unknown>, what: string): string | undefined => {
  const ext = token["$extensions"];
  if (!Predicate.isObject(ext)) return undefined;
  const studio = ext["studio.tokens"];
  if (Predicate.isObject(studio) && studio["modify"] !== undefined)
    return `cssints: ${what} has a Tokens Studio colour modifier ($extensions["studio.tokens"].modify), which cssints does not apply: write the colour as CSS (color-mix(), a relative colour) or resolve it with @tokens-studio/sd-transforms first (${RECIPE})`;
  if (ext["com.figma.type"] === "boolean")
    return `cssints: ${what} is a Figma boolean variable (com.figma.type "boolean"), which has no CSS value: leave it out of the tokens`;
  const figma = ext["com.figma"];
  const modes = ext["mode"] ?? (Predicate.isObject(figma) ? figma["modes"] : undefined);
  if (Predicate.isObject(modes) && Object.keys(modes).length > 1)
    return `cssints: ${what} has modes in $extensions (${Object.keys(modes).join(", ")}), which createTokens does not read: export one file per mode (TokensBrücke: "Split modes into separate files"; Figma: Export modes) and pass the others to createGlobalTheme (${RECIPE})`;
  return undefined;
};

const collect = Effect.fnUntraced(function* (
  node: Record<string, unknown>,
  path: string[],
  type: string | undefined,
  out: Leaf[],
): Effect.fn.Return<void, MacroError> {
  const here = path.join(".") || "the root";
  const own = node["$type"];
  if (own !== undefined && typeof own !== "string")
    return yield* fail(
      `cssints: createTokens(): $type of ${here} is a string, got ${Formatter.formatJson(own)}`,
    );
  const inherited = own ?? type;
  for (const [key, child] of Object.entries(node)) {
    if (key === "$type" || key === "$value" || IGNORED.has(key)) continue;
    if (key === "$themes" || key === "$metadata")
      return yield* fail(
        `cssints: createTokens(): ${key} of ${here} is a Tokens Studio file: convert its token sets to DTCG (${RECIPE})`,
      );
    if (key.startsWith("$"))
      return yield* fail(
        `cssints: createTokens(): ${key} of ${here} is not supported (${["$root", "$extends", "$ref"].join(", ")} are not, $description, $extensions and $deprecated are ignored)`,
      );
    if (/[{}.]/.test(key))
      return yield* fail(
        `cssints: createTokens(): the name "${key}" in ${here} has a { } or . (DTCG names cannot)`,
      );
    const at = [...path, key];
    if (!Predicate.isObject(child))
      return yield* fail(
        `cssints: createTokens(): ${at.join(".")} is a group or a token ({ $value }), got ${Formatter.formatJson(child)}`,
      );
    if (typeof child["type"] === "string" && Object.hasOwn(child, "value"))
      return yield* fail(
        `cssints: createTokens(): ${at.join(".")} has value and type without $, the legacy format of Tokens Studio (and of TokensBrücke without "DTCG 2025.10 format"): convert it to DTCG (${RECIPE})`,
      );
    if (Object.hasOwn(child, "$value")) {
      const stray = Object.keys(child).filter((k) => !k.startsWith("$"));
      if (stray.length)
        return yield* fail(
          `cssints: createTokens(): ${at.join(".")} has a $value and so is a token; it cannot hold ${stray.join(", ")}`,
        );
      const ext = extensionError(child, `createTokens(): ${at.join(".")}`);
      if (ext) return yield* fail(ext);
      const t = child["$type"] ?? inherited;
      out.push({
        path: at,
        dotted: at.join("."),
        type: t as string | undefined,
        value: child["$value"],
      });
    } else yield* collect(child, at, inherited, out);
  }
});

interface Resolved {
  dtcg: DtcgType;
  text: string;
  /** the dotted path of the token it is an alias of */
  alias?: string;
  /** a derived token: the dotted paths it references inside its value */
  refs?: string[];
}

// createTokens(tree, name?): every leaf `{ $value }` is a token, reached by the path it has in `tree`. `$type` is
// inherited through groups. The variable is the kebab-case path (`--color-bg`), or what `name(path)` returns.
export const createTokens = (...args: unknown[]): unknown =>
  edge(
    Effect.gen(function* () {
      const [tree, mapper] = args;
      if (
        !registry.at ||
        !Predicate.isObject(tree) ||
        args.length > 2 ||
        (mapper !== undefined && typeof mapper !== "function")
      )
        return yield* fail(
          "cssints: createTokens(tokens, name?) takes a DTCG-shaped object and an optional function from a path to a name",
        );
      const leaves: Leaf[] = [];
      yield* collect(tree, [], undefined, leaves);
      if (!leaves.length)
        return yield* fail("cssints: createTokens(): the tokens have no leaf ({ $value })");

      const names = new Map<string, string>(); // variable -> dotted path
      const read = new Map<string, string>(); // the path as code reads it (t.space._2xs) -> dotted path
      const inherit = new Map<string, boolean>();
      for (const l of leaves) {
        const given = mapper
          ? (mapper as (path: string[]) => unknown)([...l.path])
          : l.path.map(kebab).join("-");
        const n = yield* Effect.try({
          try: () => nameOf(given),
          catch: (e) => e as MacroError,
        });
        if (names.has(n.name))
          return yield* fail(
            `cssints: createTokens(): ${names.get(n.name)} and ${l.dotted} are both ${n.name}`,
          );
        names.set(n.name, l.dotted);
        inherit.set(l.dotted, n.inherit);
        const as = l.path.map(accessOf).join(".");
        if (read.has(as))
          return yield* fail(
            `cssints: createTokens(): ${read.get(as)} and ${l.dotted} are both read as t.${as}`,
          );
        read.set(as, l.dotted);
      }
      const variable = new Map([...names].map(([v, dotted]) => [dotted, v]));
      const byPath = new Map(leaves.map((l) => [l.dotted, l]));

      const resolved = new Map<string, Resolved>();
      const resolve = Effect.fnUntraced(function* (
        leaf: Leaf,
        stack: string[],
      ): Effect.fn.Return<Resolved, MacroError> {
        const done = resolved.get(leaf.dotted);
        if (done) return done;
        if (leaf.type !== undefined && !Object.hasOwn(DTCG_TYPES, leaf.type))
          return yield* fail(
            `cssints: createTokens(): ${leaf.dotted} has $type "${leaf.type}", which has no token type (no @property syntax); supported: ${SUPPORTED}${Object.hasOwn(STUDIO_TYPES, leaf.type) ? ` ("${leaf.type}" is a Tokens Studio type: its DTCG type is "${STUDIO_TYPES[leaf.type]}")` : ""}`,
          );
        const own = leaf.type as DtcgType | undefined;
        const [, ref] =
          (typeof leaf.value === "string" ? ALIAS.exec(leaf.value.trim()) : null) ?? [];
        let r: Resolved;
        if (ref !== undefined) {
          const target = byPath.get(ref);
          if (!target)
            return yield* fail(
              `cssints: createTokens(): ${leaf.dotted} is an alias of {${ref}}, and there is no token at ${ref}${[...byPath.keys()].some((k) => k.startsWith(`${ref}.`)) ? " (it is a group)" : ""}`,
            );
          const chain = [...stack, leaf.dotted];
          if (chain.includes(target.dotted))
            return yield* fail(
              `cssints: createTokens(): aliases go round in a circle: ${[...chain.slice(chain.indexOf(target.dotted)), target.dotted].join(" -> ")}`,
            );
          const t = yield* resolve(target, chain);
          if (own !== undefined && own !== t.dtcg)
            return yield* fail(
              `cssints: createTokens(): ${leaf.dotted} is a ${own}, and its alias {${ref}} is a ${t.dtcg}`,
            );
          r = { dtcg: t.dtcg, text: t.text, alias: target.dotted };
        } else if (typeof leaf.value === "string" && leaf.value.includes("{")) {
          // derived: references inside a CSS value. The initial value takes the targets' literals (an @property
          // initial value cannot hold var()); the live value keeps var(), so a theme of a target reaches it.
          if (own === undefined)
            return yield* fail(
              `cssints: createTokens(): ${leaf.dotted} is derived from other tokens and has no $type: give it one, or its group`,
            );
          // Tokens Studio math (`{spacing.base} * 2`): CSS has it in calc()
          if (/^[^(]*\s[*/+-]\s/.test(leaf.value))
            return yield* fail(
              `cssints: createTokens(): ${leaf.dotted} value "${leaf.value}" is math outside calc() (Tokens Studio math): write "calc(${leaf.value})"`,
            );
          const refs: string[] = [];
          for (const [, ref] of leaf.value.matchAll(REF)) {
            const target = byPath.get(ref!);
            if (!target)
              return yield* fail(
                `cssints: createTokens(): ${leaf.dotted} refers to {${ref}}, and there is no token at ${ref}`,
              );
            const chain = [...stack, leaf.dotted];
            if (chain.includes(target.dotted))
              return yield* fail(
                `cssints: createTokens(): aliases go round in a circle: ${[...chain.slice(chain.indexOf(target.dotted)), target.dotted].join(" -> ")}`,
              );
            yield* resolve(target, chain);
            refs.push(target.dotted);
          }
          const text = leaf.value.replace(REF, (_, ref: string) => resolved.get(ref)!.text);
          r = { dtcg: own, text, refs };
        } else {
          if (own === undefined)
            return yield* fail(
              `cssints: createTokens(): ${leaf.dotted} has no $type: give it one, or its group (a type is not guessed from the value)`,
            );
          r = { dtcg: own, text: yield* cssOf(own, leaf.value, leaf.dotted) };
        }
        resolved.set(leaf.dotted, r);
        return r;
      });

      const root: Record<string, unknown> = {};
      const set: TokenSet = { tokens: new Map(), types: new Map(), aliases: [] };
      const live: string[] = [];
      const guarded: string[] = [];
      for (const l of leaves) {
        const r = yield* resolve(l, []);
        const name = variable.get(l.dotted)!;
        const kind: TokenType = DTCG_TYPES[r.dtcg];
        const token = yield* declare(
          kind,
          r.text,
          name,
          inherit.get(l.dotted)!,
          true,
          `createTokens(): ${l.dotted} value`,
          !!(r.alias ?? r.refs),
        );
        registry.defs.get(name)!.path = l.dotted;
        const refs = r.alias === undefined ? r.refs : [r.alias];
        if (refs) {
          const css = (r.alias === undefined ? (l.value as string) : `{${r.alias}}`).replace(
            REF,
            (_, ref: string) => `var(${variable.get(ref)})`,
          );
          const targets = [...new Set(refs.map((d) => variable.get(d)!))];
          set.aliases.push({ name, targets, css });
          // a derived token whose literal a target cannot parse starts as that target's lowered literal (its `var()`
          // replaced by the default), and the live value follows for the browsers that parse the literal
          const fb = r.alias === undefined ? registry.defs.get(name)!.fallback : undefined;
          live.push(`${name}:${fb ?? css}`);
          const def = registry.defs.get(name)!;
          if (fb) {
            guarded.push(
              `@supports ${supportTest(TOKEN_TYPES[kind].syntax, r.text)}{:root{${name}:${css}}}`,
            );
            if (yield* standIn(registry.at, l.dotted, kind, r.text, def.inherit, true))
              def.poly = r.text;
          }
          Object.assign(def, { template: css, refs: targets });
        }
        set.tokens.set(l.dotted, token);
        set.types.set(name, r.dtcg);
        let group = root;
        for (const [i, key] of l.path.entries()) {
          const k = accessOf(key);
          if (i === l.path.length - 1) group[k] = token;
          else if (Predicate.isObject(group[k])) group = group[k];
          else {
            const g: Record<string, unknown> = (group[k] = {});
            sets.set(g, set);
            group = g;
          }
        }
      }
      sets.set(root, set);
      if (live.length) {
        const { file, site } = registry.at;
        const n = registry.tokens++;
        registry.themed.set(`${file}#${site}.${n}`, {
          file,
          key: `0:${file}#${String(site).padStart(6, "0")}.${n}`,
          css: `:root{${live.join(";")}}${guarded.join("")}`,
          names: set.aliases.flatMap((a) => [a.name, ...a.targets]),
        });
      }
      return root;
    }),
  );

// The text a site of createTokens leaves on the client: the tokens by path, as `var(--name)` strings. A terminal set's
// `--` is written `-\u002d`: a `--name` in a site's text counts as a token the module uses (entries.ts), and would pull
// a web token of that name, its @property rule and its themes, into the sheet.
export const tokensOf = (v: unknown): string | undefined => {
  const set = Predicate.isObject(v) ? sets.get(v) : undefined;
  if (!set) return undefined;
  const text = Formatter.formatJson(v);
  return set.terminal ? text.replaceAll("--", "-\\u002d") : text;
};

// ---------- createGlobalTheme

// What a theme call returns: nothing that ships (its site becomes `undefined`).
export const DONE = Object.freeze({ __done: true });
export const isDone = (v: unknown): boolean => v === DONE;

interface Condition {
  cond: { text: string };
}
const isCondition = (v: unknown): v is Condition =>
  typeof v === "function" && Predicate.hasProperty(v, "__cond") && Predicate.hasProperty(v, "cond");

// Custom properties are declared on :root. Under a container query :root matches nothing (it has no container above
// it), so there every element inside the container gets them; :where() keeps the specificity at zero.
const SCOPE = { "@media": ":root", "@container": ":where(*)" } as const;

// A theme of a plugin member (`Made.themes`): the same path as createGlobalTheme, at the call site `at` of the member.
export const addTheme = (t: ThemeRule, at: At) =>
  Effect.try({
    try: () => theme(at, [t.tokens, t.selector, t.overrides, { layer: t.layer, scope: t.scope }]),
    catch: (e) => e as MacroError,
  });

export const createGlobalTheme = (...args: unknown[]) => theme(registry.at, args);

// createGlobalTheme(tokens, condition | selector, overrides, { layer, scope }?): `overrides` has the shape of the tokens.
// Each value is a DTCG value or a CSS string of the token's type, which may refer to tokens with `{path}` (declared as
// var(--target), so live). Aliases that depend on an overridden token are declared again in the block, since `var()` is
// substituted where it is declared.
const theme = (at: At | undefined, args: unknown[]) =>
  edge(
    Effect.gen(function* () {
      const [tokens, condition, overrides, options] = args;
      const set = Predicate.isObject(tokens) ? sets.get(tokens) : undefined;
      const asked = Predicate.isObject(options) ? options.layer : undefined;
      const layer = typeof asked === "string" ? asked : undefined;
      const wanted = Predicate.isObject(options) ? options.scope : undefined;
      const scope = typeof wanted === "string" ? wanted.trim() : undefined;
      if (
        !at ||
        !set ||
        args.length < 3 ||
        args.length > 4 ||
        !Predicate.isObject(overrides) ||
        (args.length === 4 &&
          (!Predicate.isObject(options) ||
            (asked !== undefined && layer === undefined) ||
            (wanted !== undefined && scope === undefined)))
      )
        return yield* fail(
          "cssints: createGlobalTheme(tokens, condition | selector, overrides, { layer, scope }?) takes tokens of createTokens, a media() or container() condition or a selector, the values to set, and optionally a declared top-level layer and a selector to scope them to",
        );
      if (layer !== undefined) yield* requireLayer(layer, at);
      if (scope !== undefined) {
        if (typeof condition !== "string")
          return yield* fail(
            "cssints: createGlobalTheme(): a scope goes with a selector, not a condition",
          );
        yield* checkSelector(scope).pipe(
          Effect.mapError(
            (e) =>
              new MacroError({
                message: `cssints: createGlobalTheme(): scope: ${e.message}`,
                cause: e,
                ...at,
              }),
          ),
        );
      }
      let label: string;
      let block: (decls: string) => string;
      if (typeof condition === "string") {
        label = condition.trim();
        if (!/^[^{};@]+$/.test(label))
          return yield* fail(`cssints: createGlobalTheme(): "${condition}" is not a selector`);
        block = (d) => `${label}{${d}}`;
      } else if (isCondition(condition)) {
        label = condition.cond.text;
        const prelude = /^@(media|container)\b/.exec(label)?.[0] as keyof typeof SCOPE | undefined;
        if (!prelude)
          return yield* fail(
            `cssints: createGlobalTheme(): ${label} is not a theme, use a media() or container() condition, or a selector`,
          );
        block = (d) => `${label}{${SCOPE[prelude]}{${d}}}`;
      } else
        return yield* fail(
          `cssints: createGlobalTheme(): the second argument is a media() or container() condition or a selector, got ${Formatter.formatJson(condition)}`,
        );

      const changed = new Map<string, string>(); // variable -> the value it gets here
      const defaults = new Map<string, string>(); // variable -> the lowered literal that stands for it in older browsers
      const guards = new Map<string, string[]>(); // `@supports` condition -> the live declarations it lets through
      const poly = new Map<string, string>(); // variable -> the literal, for the values the runtime of derived tokens computes
      const refs = new Map<string, string[]>(); // variable -> the variables its value here refers to
      const walk = Effect.fnUntraced(function* (
        node: Record<string, unknown>,
        values: Record<string, unknown>,
        path: string[],
      ): Effect.fn.Return<void, MacroError> {
        for (const [key, given] of Object.entries(values)) {
          // a DTCG file of another mode (Figma's per-mode export): `{ $value }` leaves, and `$type`, `$extensions`, ... beside them
          if (key.startsWith("$")) continue;
          const leaf = Predicate.isObject(given) && Object.hasOwn(given, "$value");
          const v = leaf ? given["$value"] : given;
          // the file's key `500` is the set's `_500`
          const own = Object.hasOwn(node, key) ? key : accessOf(key);
          const child = Object.hasOwn(node, own) ? node[own] : undefined;
          const dotted = [...path, key].join(".");
          const ext = leaf ? extensionError(given, `createGlobalTheme(): ${dotted}`) : undefined;
          if (ext) return yield* fail(ext);
          if (child instanceof CSSTokenValue) {
            const kind = registry.defs.get(child.name)!.kind;
            const text = yield* cssOf(set.types.get(child.name)!, v, dotted);
            // a reference stays live as var(--target); the grammar check reads the targets' literals
            const targets = new Map<string, CSSTokenValue>();
            for (const [, ref] of text.matchAll(REF)) {
              const target = set.tokens.get(ref!);
              if (!target)
                return yield* fail(
                  `cssints: createGlobalTheme(): ${dotted} refers to {${ref}}, and there is no token at ${ref}`,
                );
              targets.set(ref!, target);
            }
            const whole = ALIAS.exec(text)?.[1];
            const other = whole && registry.defs.get(targets.get(whole)!.name)!.kind;
            if (other && other !== kind)
              return yield* fail(
                `cssints: createGlobalTheme(): ${dotted} is a ${kind}, and its reference {${whole}} is a ${other}`,
              );
            const literal = text.replace(
              REF,
              (_, r: string) => registry.defs.get(targets.get(r)!.name)!.value,
            );
            const css = text.replace(REF, (_, r: string) => `var(${targets.get(r)!.name})`);
            const fb = yield* checkSyntaxFx(
              `createGlobalTheme(): ${dotted} value`,
              TOKEN_TYPES[kind].syntax,
              literal,
              `createGlobalTheme(): ${dotted} value in ${label}`,
              child.name,
            );
            if (fb && css !== literal && !PURE.test(css)) {
              const test = supportTest(TOKEN_TYPES[kind].syntax, literal);
              guards.set(test, [...(guards.get(test) ?? []), `${child.name}:${css}`]);
              defaults.set(child.name, fb);
              const { inherit } = registry.defs.get(child.name)!;
              if (
                yield* standIn(
                  at,
                  `${dotted} in ${label}`,
                  kind,
                  literal,
                  inherit,
                  !label.startsWith("@container"),
                )
              )
                poly.set(child.name, literal);
            }
            changed.set(child.name, css);
            if (targets.size)
              refs.set(
                child.name,
                [...targets.values()].map((t) => t.name),
              );
          } else if (Predicate.isObject(child) && Predicate.isObject(v))
            yield* walk(child, v, [...path, key]);
          else
            return yield* fail(
              child === undefined
                ? `cssints: createGlobalTheme(): there is no token at ${dotted}`
                : `cssints: createGlobalTheme(): ${dotted} is a group, its values are an object`,
            );
        }
      });
      yield* walk(tokens as Record<string, unknown>, overrides, []);
      if (!changed.size)
        return yield* fail("cssints: createGlobalTheme(): the theme sets no token");

      // a reference in a theme joins the base references: a circle is an error. Order does not matter otherwise: the
      // declarations of one rule are one element's, and var() reads that element's own values, however they are ordered.
      const deps = (n: string) =>
        refs.get(n) ?? set.aliases.find((a) => a.name === n)?.targets ?? [];
      const done = new Set<string>();
      const visit = (n: string, stack: string[]): string[] | undefined => {
        if (stack.includes(n)) return [...stack.slice(stack.indexOf(n)), n];
        if (done.has(n)) return undefined;
        for (const d of deps(n)) {
          const circle = visit(d, [...stack, n]);
          if (circle) return circle;
        }
        done.add(n);
        return undefined;
      };
      for (const n of refs.keys()) {
        const circle = visit(n, []);
        if (circle)
          return yield* fail(
            `cssints: createGlobalTheme(): references go round in a circle: ${circle.map((c) => registry.defs.get(c)!.path).join(" -> ")}`,
          );
      }

      const stale = new Set(changed.keys());
      for (let grew = true; grew; )
        grew = set.aliases.some(
          (a) => a.targets.some((t) => stale.has(t)) && !stale.has(a.name) && !!stale.add(a.name),
        );
      const decls = [
        ...[...changed].map(([name, text]) => `${name}:${defaults.get(name) ?? text}`),
        ...set.aliases
          .filter((a) => stale.has(a.name) && !changed.has(a.name))
          .map((a) => `${a.name}:${a.css}`),
      ];
      const n = registry.tokens++;
      const rules =
        block(decls.join(";")) +
        [...guards].map(([test, live]) => `@supports ${test}{${block(live.join(";"))}}`).join("");
      registry.themed.set(`${at.file}#${at.site}.${n}`, {
        file: at.file,
        key: `${typeof condition === "string" ? 2 : 1}:${at.file}#${String(at.site).padStart(6, "0")}.${n}`,
        css: scope === undefined ? rules : `@scope (${scope}){${rules}}`,
        names: decls.map((d) => d.slice(0, d.indexOf(":"))),
        ...(layer === undefined ? {} : { layer }),
        theme: { label, scope, values: changed, poly: poly.size ? poly : undefined },
      });
      return DONE;
    }),
  );

// ---------- check.contrast

// css.check.contrast(fg, bg, { min }): registers the check, which runs once the module that made it has run (contrast.ts, evaluate.ts):
// its themes may come after it, or from a module it imports. A build runs them all again at its end (plugin.ts).
const contrast = (...args: unknown[]): unknown =>
  edge(
    Effect.gen(function* () {
      const [fg, bg, options] = args;
      const min = (options as { min?: unknown } | null)?.min;
      const at = registry.at;
      if (
        !at ||
        args.length !== 3 ||
        !(fg instanceof CSSTokenValue) ||
        !(bg instanceof CSSTokenValue) ||
        fg.syntax !== "color" ||
        bg.syntax !== "color" ||
        typeof min !== "number" ||
        !(min >= 1 && min <= 21)
      )
        return yield* fail(
          "cssints: check.contrast(fg, bg, { min }) takes two colour tokens and a minimum ratio from 1 to 21",
        );
      registry.checks.set(`${at.file}#${at.site}.${registry.tokens++}`, {
        at,
        fg: fg.name,
        bg: bg.name,
        min,
        gen: registry.gen,
      });
      return DONE;
    }),
  );

export const check = { contrast };
