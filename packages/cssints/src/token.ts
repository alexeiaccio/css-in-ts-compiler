// token.<type>(initial, name?), token.set(token, value) and style(...): a token is a Typed OM value whose text is var(--name). Its `@property` rule goes in the
// registry (`properties`), which the sheet renders; a value that uses it is checked as a literal of its type (lib.ts
// `probed`). Like the css.* builders these are called in user expressions, so they are plain code that throws a MacroError.
import { createHash } from "node:crypto";
import { relative } from "node:path";

import { browsers, supportOf } from "@cssints/css-grammar/support";
import { grammarOf, TOKEN_TYPES, type TokenType } from "@cssints/css-grammar/token";
import { matches } from "@cssints/css-grammar/twin";
import { CSSStyleValue } from "@cssints/css-grammar/values";
import { Effect, Formatter, Predicate } from "effect";

import { MacroError } from "./errors.ts";
import { type Decl, edge, fail, isNode } from "./lib.ts";
import { fallbackOf } from "./lowered.ts";
import { registry, warn } from "./registry.ts";

export class CSSTokenValue extends CSSStyleValue {
  readonly name: string;
  readonly syntax: string;
  readonly settable: boolean;
  constructor(name: string, syntax: string, settable: boolean) {
    super();
    this.name = name;
    this.syntax = syntax;
    this.settable = settable;
  }
  override toString() {
    return `var(${this.name})`;
  }
  toJSON() {
    return this.toString();
  }
}

// A property that takes each syntax, so a token value gets the support check of a property value (a syntax with none,
// custom-ident and resolution, has nothing BCD tracks). A warning of the property itself is not about the value.
const SUPPORT_PROPERTY: Record<string, string> = {
  color: "color",
  length: "width",
  percentage: "width",
  "length-percentage": "width",
  number: "opacity",
  integer: "z-index",
  angle: "transform",
  time: "transition-duration",
  url: "background-image",
  image: "background-image",
  "transform-list": "transform",
  "easing-function": "transition-timing-function",
  shadow: "box-shadow",
};

// The condition of an `@supports` rule for a value of `syntax`: the browsers that parse `text` are the ones that can
// have the live value of a derived token or a theme value (its `var()` replaced by the literal the token starts with).
export const supportTest = (syntax: string, text: string): string =>
  `(${SUPPORT_PROPERTY[syntax]}:${text})`;

// `text` is a value of the grammar of `syntax` (`<syntax>`, `<shadow>#`); `what` names it in the error, and `who` (default `what`) in a support
// warning, once per `who` and BCD feature per build, in the `warned` set of the properties. `variable` is the custom
// property of the sheet that holds the value (a token, or a theme override), which LightningCSS lowers for the
// targets: when it lowers every feature that warns, there is no warning and the result is the lowered value (the
// first declaration it writes), which the caller uses where LightningCSS does not reach (the `@property` initial value)
// or as the default of a value that holds `var()`. An inline `token.set()` value has no `variable`: it keeps its warning.
export const checkSyntaxFx = Effect.fnUntraced(function* (
  what: string,
  syntax: string,
  text: string,
  who: string = what,
  variable?: string,
): Effect.fn.Return<string | undefined, MacroError> {
  const grammar = grammarOf(syntax);
  const ok = yield* matches(grammar, text).pipe(
    Effect.mapError((e) => new MacroError({ message: e.message, cause: e, ...registry.at })),
  );
  if (!ok) return yield* fail(`cssints: ${what} "${text}" is not a ${grammar}`);
  const prop = SUPPORT_PROPERTY[syntax];
  if (!prop) return;
  const ws = supportOf(prop, text).filter((w) => w.feature !== prop);
  const lacking = [...new Set(ws.flatMap((w) => w.lacking))];
  const lowered = ws.map((w) => variable && fallbackOf(variable, text, { ...w, lacking }));
  if (ws.length && lowered.every(Boolean)) return lowered[0] || undefined;
  for (const [i, w] of ws.entries()) {
    if (!lowered[i])
      warn(
        registry,
        `${who} ${w.key}`,
        `${who}: "${w.feature}" in "${text}" is not supported by ${browsers(w.lacking)} (${w.key})`,
      );
  }
  return undefined;
});
export const checkSyntax = (what: string, syntax: string, text: string): void => {
  edge(checkSyntaxFx(what, syntax, text));
};

// A name: "color-primary", "--color-primary" or { var, inherit }; none makes the token private.
const NAME = /^(?:--)?([A-Za-z_][\w-]*)$/;
export const nameOf = (name: unknown) => {
  const { var: v, inherit = true } =
    typeof name === "string" ? { var: name } : (name as { var?: unknown; inherit?: unknown });
  const m = typeof v === "string" ? NAME.exec(v) : null;
  if (!m || typeof inherit !== "boolean")
    throw fail(
      `cssints: a token name is a CSS identifier or { var, inherit }, got ${Formatter.formatJson(name)}`,
    );
  return { name: `--${m[1]}`, inherit };
};

// The variable of a private token: the hash of the file (relative to the working directory) and the site.
const privateName = (): string => {
  const at = registry.at!;
  const key = `${relative(process.cwd(), at.file)}:${at.site}:${registry.tokens}`;
  return `--_${createHash("sha1").update(key).digest("hex").slice(0, 8)}`;
};

// A browser drops an `@property` rule whose initial-value is relative to a font size (`1rem`, `1em`): the initial
// value is the text in px at a 16px font (the fallbacks CSS gives: 1ex and 1ch are 0.5em, 1lh is 1.2em), and `:root`
// gets the text itself, so the token follows the user's font size.
const FONT_RELATIVE = /(\d*\.?\d+(?:e[+-]?\d+)?)(r?em|r?ex|r?ch|r?cap|r?ic|r?lh)\b/gi;
const EM: Record<string, number> = { em: 1, ex: 0.5, ch: 0.5, cap: 0.7, ic: 1, lh: 1.2 };
const inPx = (text: string) =>
  text.replace(FONT_RELATIVE, (_, n: string, unit: string) => {
    const u = unit.toLowerCase();
    return `${Number((Number(n) * 16 * (EM[u] ?? EM[u.slice(1)]!)).toFixed(4))}px`;
  });

// Registers the `@property` rule of a token and what it is worth. `text` is a literal of the type, and `what` names it
// in an error. A target that cannot parse `text` would drop the rule and leave the token with no value: the initial value
// is what LightningCSS lowers `text` to, and `:root` gets `text` itself, which LightningCSS lowers too and adds the wide
// value under `@supports`. A font-relative `text` goes on `:root` the same way, with the px value as the initial one.
// `live`: the caller declares the `:root` value (an alias, a derived token, see theme.ts).
export const declare = Effect.fnUntraced(function* (
  kind: TokenType,
  text: string,
  variable: string,
  inherit: boolean,
  settable: boolean,
  what?: string,
  live = false,
): Effect.fn.Return<CSSTokenValue, MacroError> {
  const at = registry.at!;
  const type: { syntax: string; probes: readonly string[]; property?: string } = TOKEN_TYPES[kind];
  const { syntax, probes, property = `<${syntax}>` } = type;
  const name = what ?? `token.${kind}() initial value`;
  const fallback = yield* checkSyntaxFx(
    name,
    syntax,
    text,
    what ?? `${name} of ${variable}`,
    variable,
  );
  // `*` takes any initial value, font-relative or not
  const initial = property === "*" ? (fallback ?? text) : inPx(fallback ?? text);
  const n = registry.tokens++;
  const by = `${at.file}#${at.site}.${n}`;
  const css = `@property ${variable}{syntax:"${property}";inherits:${inherit};initial-value:${initial}}`;
  // Another declaration of the name is fine when it is the same rule, this site again (an edit), or this file's
  // from an earlier evaluation (every evaluation runs its modules again). Otherwise the second one is the error.
  const prev = registry.properties.get(variable);
  if (
    prev &&
    prev.css !== css &&
    prev.by !== by &&
    !(prev.file === at.file && prev.gen !== registry.gen)
  )
    return yield* fail(
      `cssints: ${variable} is already declared with another @property, in ${relative(process.cwd(), prev.file)}: ${prev.css}; here: ${css}`,
    );
  registry.properties.set(variable, { css, probes, by, file: at.file, gen: registry.gen });
  registry.defs.set(variable, { kind, inherit, path: variable, value: text, fallback });
  if ((fallback || initial !== text) && !live)
    registry.themed.set(by, {
      file: at.file,
      key: `0:${at.file}#${String(at.site).padStart(6, "0")}.${n}`,
      css: `${inherit ? ":root" : ":where(*)"}{${variable}:${text}}`,
      names: [variable],
    });
  return new CSSTokenValue(variable, syntax, settable);
});

const make =
  (kind: TokenType) =>
  (...args: unknown[]): CSSTokenValue => {
    const [initial, name] = args;
    if (
      !registry.at ||
      (typeof initial !== "string" && typeof initial !== "number") ||
      args.length > 2
    )
      throw fail(
        `cssints: token.${kind}(initial, name?) takes an initial value (a string) and an optional name`,
      );
    const { name: variable, inherit } =
      name === undefined ? { name: privateName(), inherit: true } : nameOf(name);
    return edge(declare(kind, String(initial).trim(), variable, inherit, name !== undefined));
  };

/**
 * What style() and token.set() return: custom properties to set (`sets`, name and value) and declarations, which the
 * site turns into one object literal for a `style` prop.
 */
export interface StyleNode {
  __style: { sets: [name: string, value: string][]; decls: Decl[] };
}
export const isStyle = (v: unknown): v is StyleNode => Predicate.hasProperty(v, "__style");

const set = (...args: unknown[]): StyleNode => {
  const [t, value] = args;
  if (
    args.length !== 2 ||
    !(t instanceof CSSTokenValue) ||
    (typeof value !== "string" && typeof value !== "number")
  )
    throw fail("cssints: token.set(token, value) takes a token and a value");
  if (!t.settable)
    throw fail(
      `cssints: ${t.name} is private, only a token with a name can be set: token.<type>(initial, "name")`,
    );
  const text = String(value).trim();
  checkSyntax(`token.set() value of ${t.name}`, t.syntax, text);
  return { __style: { sets: [[t.name, text]], decls: [] } };
};

// style(...): css.* values (declarations, no conditions) and token.set() results, as an inline style.
export const style = (...args: unknown[]): StyleNode => {
  if (!args.length) throw fail("cssints: style() expects css.* values or token.set(...) results");
  const sets: [string, string][] = [];
  const decls: Decl[] = [];
  for (const a of args) {
    if (isStyle(a)) {
      sets.push(...a.__style.sets);
      decls.push(...a.__style.decls);
    } else if (isNode(a)) {
      if (a.markers || a.kernels)
        throw fail(
          "cssints: style() takes plain declarations: an inline style has no marker class",
        );
      if (a.__cssints.some(([, , conds]) => conds?.length))
        throw fail(
          "cssints: style() takes styles without conditions: an inline style has no media query or :hover",
        );
      if (a.__cssints.some((d) => d[3]))
        throw fail(
          "cssints: style() takes one value per property: an inline style cannot hold a firstThatWorks(...) fallback",
        );
      decls.push(...a.__cssints);
    } else
      throw fail(
        `cssints: style() takes css.* values and token.set(...) results, got ${Formatter.formatJson(a)}`,
      );
  }
  return { __style: { sets, decls } };
};

export const token = {
  ...Object.fromEntries(
    (Object.keys(TOKEN_TYPES) as TokenType[]).map((kind) => [kind, make(kind)]),
  ),
  set,
};
