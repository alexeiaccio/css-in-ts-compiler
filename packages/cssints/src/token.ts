// token.<type>(initial, name?), token.set(token, value) and style(...): a token is a Typed OM value whose text is var(--name). Its `@property` rule goes in the
// registry (`properties`), which the sheet renders; a value that uses it is checked as a literal of its type (lib.ts
// `probed`). Like the css.* builders these are called in user expressions, so they are plain code that throws a MacroError.
import { createHash } from "node:crypto";
import { relative } from "node:path";

import { TOKEN_TYPES, type TokenType } from "@cssints/css-grammar/token";
import { matches } from "@cssints/css-grammar/twin";
import { CSSStyleValue } from "@cssints/css-grammar/values";
import { Cause, Effect, Exit } from "effect";

import { MacroError } from "./errors.ts";
import { type Decl, fail, isNode } from "./lib.ts";
import { registry } from "./registry.ts";

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
}

// `text` is a value of the grammar `<syntax>`; `what` names it in the error.
export function checkSyntax(what: string, syntax: string, text: string): void {
  const exit = Effect.runSyncExit(matches(`<${syntax}>`, text));
  if (Exit.isFailure(exit)) {
    const e = Cause.squash(exit.cause) as Error;
    throw new MacroError({ message: e.message, cause: e, ...registry.at });
  }
  if (!exit.value) throw fail(`cssints: ${what} "${text}" is not a <${syntax}>`);
}

// A name: "color-primary", "--color-primary" or { var, inherit }; none makes the token private.
const NAME = /^(?:--)?([A-Za-z_][\w-]*)$/;
const nameOf = (name: unknown) => {
  const { var: v, inherit = true } =
    typeof name === "string" ? { var: name } : (name as { var?: unknown; inherit?: unknown });
  const m = typeof v === "string" ? NAME.exec(v) : null;
  if (!m || typeof inherit !== "boolean")
    throw fail(
      `cssints: a token name is a CSS identifier or { var, inherit }, got ${JSON.stringify(name)}`,
    );
  return { name: `--${m[1]}`, inherit };
};

// The variable of a private token: the hash of the file (relative to the working directory) and the site.
const privateName = (): string => {
  const at = registry.at!;
  const key = `${relative(process.cwd(), at.file)}:${at.site}:${registry.tokens}`;
  return `--_${createHash("sha1").update(key).digest("hex").slice(0, 8)}`;
};

// Chrome rejects `1rem` and `1em` as an initial-value: relative to a font size, which CSS can change.
const FONT_RELATIVE = /[\d.](?:r?em|r?ex|r?ch|r?cap|r?ic|r?lh)\b/i;

const make =
  (kind: TokenType) =>
  (...args: unknown[]): CSSTokenValue => {
    const [initial, name] = args;
    const at = registry.at;
    if (!at || (typeof initial !== "string" && typeof initial !== "number") || args.length > 2)
      throw fail(
        `cssints: token.${kind}(initial, name?) takes an initial value (a string) and an optional name`,
      );
    const { syntax, probes } = TOKEN_TYPES[kind];
    const text = String(initial).trim();
    checkSyntax(`token.${kind}() initial value`, syntax, text);
    if (FONT_RELATIVE.test(text))
      throw fail(
        `cssints: token.${kind}() initial value "${text}" depends on the font size, and a browser drops an @property rule whose initial-value is not computationally independent; use px or a viewport unit`,
      );
    const { name: variable, inherit } =
      name === undefined ? { name: privateName(), inherit: true } : nameOf(name);
    const by = `${at.file}#${at.site}.${registry.tokens++}`;
    const css = `@property ${variable}{syntax:"<${syntax}>";inherits:${inherit};initial-value:${text}}`;
    // Another declaration of the name is fine when it is the same rule, this site again (an edit), or this file's
    // from an earlier evaluation (every evaluation runs its modules again). Otherwise the second one is the error.
    const prev = registry.properties.get(variable);
    if (
      prev &&
      prev.css !== css &&
      prev.by !== by &&
      !(prev.file === at.file && prev.gen !== registry.gen)
    )
      throw fail(
        `cssints: ${variable} is already declared with another @property, in ${relative(process.cwd(), prev.file)}: ${prev.css}; here: ${css}`,
      );
    registry.properties.set(variable, { css, probes, by, file: at.file, gen: registry.gen });
    return new CSSTokenValue(variable, syntax, name !== undefined);
  };

/**
 * What style() and token.set() return: custom properties to set (`sets`, name and value) and declarations, which the
 * site turns into one object literal for a `style` prop.
 */
export interface StyleNode {
  __style: { sets: [name: string, value: string][]; decls: Decl[] };
}
export const isStyle = (v: unknown): v is StyleNode =>
  !!v && typeof v === "object" && "__style" in v;

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
      if (a.__cssints.some(([, , conds]) => conds?.length))
        throw fail(
          "cssints: style() takes styles without conditions: an inline style has no media query or :hover",
        );
      decls.push(...a.__cssints);
    } else
      throw fail(
        `cssints: style() takes css.* values and token.set(...) results, got ${JSON.stringify(a)}`,
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
