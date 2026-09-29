// token.<type>(initial, name?): a token is a Typed OM value whose text is var(--name). Its `@property` rule goes in the
// registry (`properties`), which the sheet renders; a value that uses it is checked as a literal of its type (lib.ts
// `probed`). Like the css.* builders these are called in user expressions, so they are plain code that throws a MacroError.
import { createHash } from "node:crypto";
import { relative } from "node:path";

import { TOKEN_TYPES, type TokenType } from "@cssints/css-grammar/token";
import { matches } from "@cssints/css-grammar/twin";
import { CSSStyleValue } from "@cssints/css-grammar/values";
import { Cause, Effect, Exit } from "effect";

import { MacroError } from "./errors.ts";
import { fail } from "./lib.ts";
import { registry } from "./registry.ts";

export class CSSTokenValue extends CSSStyleValue {
  readonly name: string;
  readonly settable: boolean;
  constructor(name: string, settable: boolean) {
    super();
    this.name = name;
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
    return new CSSTokenValue(variable, name !== undefined);
  };

export const token = Object.fromEntries(
  (Object.keys(TOKEN_TYPES) as TokenType[]).map((kind) => [kind, make(kind)]),
);
