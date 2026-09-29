// createTokens(tree, name?): DTCG-shaped data to tokens (token.ts `declare`). Aliases keep their `@property` literal and
// stay live as `--a: var(--b)` on :root. createGlobalTheme(tokens, condition | selector, overrides): the tokens a theme
// sets, and the aliases that depend on them, under a condition or a selector. Both builders are called in user
// expressions, so their edge is plain code (`edge`); everything behind it is Effect.
import { DTCG_TYPES, type DtcgType, TOKEN_TYPES, type TokenType } from "@cssints/css-grammar/token";
import { Effect } from "effect";

import type { MacroError } from "./errors.ts";
import { edge, fail } from "./lib.ts";
import { registry } from "./registry.ts";
import { checkSyntaxFx, CSSTokenValue, declare, nameOf } from "./token.ts";

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
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
    return type === "fontWeight" && key in FONT_WEIGHTS ? String(FONT_WEIGHTS[key]) : value.trim();
  }
  if (isNumber(value) && (type === "number" || type === "fontWeight")) return String(value);
  if (isObject(value) && type === "color") {
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
  const units = UNITS[type];
  if (isObject(value) && units) {
    const { value: n, unit } = value;
    if (!isNumber(n) || typeof unit !== "string" || !units.includes(unit))
      return yield* fail(
        `cssints: ${what} is not a DTCG ${type}: { value: number, unit: ${units.join(" | ")} }`,
      );
    return `${n}${unit}`;
  }
  return yield* fail(`cssints: ${what} is not a DTCG ${type} value: ${JSON.stringify(value)}`);
});

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
  aliases: { name: string; target: string }[];
}
// every group of every token set, by object: a subtree is a token set too
export const sets = new WeakMap<object, TokenSet>();

const ALIAS = /^\{([^{}]+)\}$/;
const IGNORED = new Set(["$description", "$extensions", "$deprecated"]);
const kebab = (s: string) => s.replace(/([a-z\d])([A-Z])/g, "$1-$2").toLowerCase();

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
      `cssints: createTokens(): $type of ${here} is a string, got ${JSON.stringify(own)}`,
    );
  const inherited = own ?? type;
  for (const [key, child] of Object.entries(node)) {
    if (key === "$type" || key === "$value" || IGNORED.has(key)) continue;
    if (key.startsWith("$"))
      return yield* fail(
        `cssints: createTokens(): ${key} of ${here} is not supported (${["$root", "$extends", "$ref"].join(", ")} are not, $description, $extensions and $deprecated are ignored)`,
      );
    if (/[{}.]/.test(key))
      return yield* fail(
        `cssints: createTokens(): the name "${key}" in ${here} has a { } or . (DTCG names cannot)`,
      );
    const at = [...path, key];
    if (!isObject(child))
      return yield* fail(
        `cssints: createTokens(): ${at.join(".")} is a group or a token ({ $value }), got ${JSON.stringify(child)}`,
      );
    if ("$value" in child) {
      const stray = Object.keys(child).filter((k) => !k.startsWith("$"));
      if (stray.length)
        return yield* fail(
          `cssints: createTokens(): ${at.join(".")} has a $value and so is a token; it cannot hold ${stray.join(", ")}`,
        );
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
}

// createTokens(tree, name?): every leaf `{ $value }` is a token, reached by the path it has in `tree`. `$type` is
// inherited through groups. The variable is the kebab-case path (`--color-bg`), or what `name(path)` returns.
export const createTokens = (...args: unknown[]): unknown =>
  edge(
    Effect.gen(function* () {
      const [tree, mapper] = args;
      if (
        !registry.at ||
        !isObject(tree) ||
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
        if (leaf.type !== undefined && !(leaf.type in DTCG_TYPES))
          return yield* fail(
            `cssints: createTokens(): ${leaf.dotted} has $type "${leaf.type}", which has no token type (no @property syntax); supported: ${SUPPORTED}`,
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
        );
        registry.defs.get(name)!.path = l.dotted;
        if (r.alias !== undefined) {
          const target = variable.get(r.alias)!;
          registry.defs.get(name)!.alias = target;
          set.aliases.push({ name, target });
          live.push(`${name}:var(${target})`);
        }
        set.tokens.set(l.dotted, token);
        set.types.set(name, r.dtcg);
        let group = root;
        for (const [i, k] of l.path.entries())
          if (i === l.path.length - 1) group[k] = token;
          else if (isObject(group[k])) group = group[k];
          else {
            const g: Record<string, unknown> = (group[k] = {});
            sets.set(g, set);
            group = g;
          }
      }
      sets.set(root, set);
      if (live.length) {
        const { file, site } = registry.at;
        const n = registry.tokens++;
        registry.themed.set(`${file}#${site}.${n}`, {
          file,
          key: `0:${file}#${String(site).padStart(6, "0")}.${n}`,
          css: `:root{${live.join(";")}}`,
          names: set.aliases.flatMap((a) => [a.name, a.target]),
        });
      }
      return root;
    }),
  );

// The text a site of createTokens leaves on the client: the tokens by path, as `var(--name)` strings.
export const tokensOf = (v: unknown): string | undefined =>
  isObject(v) && sets.has(v)
    ? JSON.stringify(v, (_, x: unknown) => (x instanceof CSSTokenValue ? String(x) : x))
    : undefined;

// ---------- createGlobalTheme

// What a theme call returns: nothing that ships (its site becomes `undefined`).
export const DONE = Object.freeze({ __done: true });
export const isDone = (v: unknown): boolean => v === DONE;

interface Condition {
  cond: { text: string };
}
const isCondition = (v: unknown): v is Condition =>
  typeof v === "function" && "__cond" in v && "cond" in v;

// Custom properties are declared on :root. Under a container query :root matches nothing (it has no container above
// it), so there every element inside the container gets them; :where() keeps the specificity at zero.
const SCOPE = { "@media": ":root", "@container": ":where(*)" } as const;

// createGlobalTheme(tokens, condition | selector, overrides): `overrides` has the shape of the tokens. Each value is
// a DTCG value or a CSS string of the token's type. Aliases that depend on an overridden token are declared again in
// the block, since `var()` is substituted where it is declared.
export const createGlobalTheme = (...args: unknown[]): unknown =>
  edge(
    Effect.gen(function* () {
      const [tokens, condition, overrides] = args;
      const set = isObject(tokens) ? sets.get(tokens) : undefined;
      const at = registry.at;
      if (!at || !set || args.length !== 3 || !isObject(overrides))
        return yield* fail(
          "cssints: createGlobalTheme(tokens, condition | selector, overrides) takes tokens of createTokens, a media() or container() condition or a selector, and the values to set",
        );
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
          `cssints: createGlobalTheme(): the second argument is a media() or container() condition or a selector, got ${JSON.stringify(condition)}`,
        );

      const changed = new Map<string, string>(); // variable -> the value it gets here
      const walk = Effect.fnUntraced(function* (
        node: Record<string, unknown>,
        values: Record<string, unknown>,
        path: string[],
      ): Effect.fn.Return<void, MacroError> {
        for (const [key, v] of Object.entries(values)) {
          const child = Object.hasOwn(node, key) ? node[key] : undefined;
          const dotted = [...path, key].join(".");
          if (child instanceof CSSTokenValue) {
            const { syntax } = TOKEN_TYPES[registry.defs.get(child.name)!.kind];
            const text = yield* cssOf(set.types.get(child.name)!, v, dotted);
            yield* checkSyntaxFx(`createGlobalTheme(): ${dotted} value`, syntax, text);
            changed.set(child.name, text);
          } else if (isObject(child) && isObject(v)) yield* walk(child, v, [...path, key]);
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

      const stale = new Set(changed.keys());
      for (let grew = true; grew; )
        grew = set.aliases.some(
          (a) => stale.has(a.target) && !stale.has(a.name) && !!stale.add(a.name),
        );
      const decls = [
        ...[...changed].map(([name, text]) => `${name}:${text}`),
        ...set.aliases
          .filter((a) => stale.has(a.name) && !changed.has(a.name))
          .map((a) => `${a.name}:var(${a.target})`),
      ];
      const n = registry.tokens++;
      registry.themed.set(`${at.file}#${at.site}.${n}`, {
        file: at.file,
        key: `${typeof condition === "string" ? 2 : 1}:${at.file}#${String(at.site).padStart(6, "0")}.${n}`,
        css: block(decls.join(";")),
        names: decls.map((d) => d.slice(0, d.indexOf(":"))),
        theme: { label, values: changed },
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
