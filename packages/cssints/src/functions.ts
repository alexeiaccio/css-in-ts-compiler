// The css functions of mdn-data as calls (`css.calc(t.space.md, "*", 2)`, `css.lightDark("white", t.color.bg)`): the list is
// generated (css-grammar functions.ts, `bun run extract`), a member each (FUNCTIONS in lib.ts). Build time only: a call is
// checked against the grammar of its function by the twin and replaced by its text, a Typed OM value of the function's type.
import { checkValueNow, isDeclarationError } from "@cssints/css-grammar/check";
import { functions } from "@cssints/css-grammar/functions";
import { CSSStyleValue } from "@cssints/css-grammar/values";
import { Formatter } from "effect";

import { MacroError } from "./errors.ts";
import { checkVars, FUNCTIONS, probed, fail } from "./lib.ts";
import { registry } from "./registry.ts";
import { CSSTokenValue } from "./token.ts";

// ponytail: stands in for the spec's CSSMathValue and the other function values, holds the text of a call.
class CSSFunctionValue extends CSSStyleValue {
  readonly value: string;
  constructor(value: string) {
    super();
    this.value = value;
  }
  override toString() {
    return this.value;
  }
}

// A math function is checked as the numeric type its arguments make (the twin types `calc(1px + 2s)` as it reads a primitive).
const MATH = "<number> | <length-percentage> | <angle-percentage> | <time> | <resolution>";
const OPERATORS = new Set(["+", "-", "*", "/"]);

type Atom = string | number | CSSStyleValue;
const isGroup = (p: Atom | readonly Atom[]): p is readonly Atom[] => Array.isArray(p);
type Spec = { sep: string; math?: string };

const build = (member: string, name: string) => {
  const { sep, math } = (functions as Record<string, Spec>)[name]!;
  const grammar = math ? MATH : `<${name}()>`;
  return (...parts: (Atom | readonly Atom[])[]) => {
    const atom = (p: Atom) => {
      if (typeof p === "string") checkVars(`${member}()`, p);
      else if (typeof p !== "number" && !(p instanceof CSSStyleValue))
        throw fail(
          `cssints: ${member}() takes strings, numbers and Typed OM values (tokens, other calls), got ${Formatter.formatJson(p)}`,
        );
      // oxlint-disable-next-line typescript/no-base-to-string -- strings, numbers and CSSStyleValues, which override toString
      return String(p);
    };
    // var(token, fallback?): the first part is the token's name, not its own var(); an array is one part, joined by a space
    const texts = parts.map((p, i) =>
      isGroup(p)
        ? p.map(atom).join(" ")
        : name === "var" && !i && p instanceof CSSTokenValue
          ? p.name
          : atom(p),
    );
    const join = (ts: string[]) =>
      ts.reduce(
        (acc, t, i) =>
          i ? `${acc}${OPERATORS.has(t) || OPERATORS.has(ts[i - 1]!) ? " " : sep}${t}` : t,
        "",
      );
    const text = join(texts);
    const value = `${name}(${text})`;
    const first = parts[0];
    if (name === "var") {
      if (!registry.properties.has(texts[0] ?? ""))
        throw fail(
          `cssints: var() takes a token and an optional fallback, got ${Formatter.formatJson(texts[0])}`,
        );
      // the fallback is a value of the token's type
      if (first instanceof CSSTokenValue && texts.length > 1)
        checkText(`var(${first.name}) fallback`, `<${first.syntax}>`, texts.slice(1).join(sep));
    } // the var() itself is valid by construction: a token is declared
    else
      checkText(
        `${name}()`,
        grammar,
        value,
        math ? undefined : () => argumentOf(name, grammar, texts, sep, join),
      );
    return new CSSFunctionValue(value);
  };
};

// Where a call stops matching `<name()>`, said like the types do: a `var()` stands for the rest (the recognizer's pending
// substitution), so the first part whose prefix can neither go on nor end is the bad one; if every prefix goes on, the call ends
// too soon. Runs on the failure path only.
const argumentOf = (
  name: string,
  grammar: string,
  texts: string[],
  sep: string,
  join: (ts: string[]) => string,
) => {
  const fits = (s: string) => {
    try {
      checkValueNow(name, grammar, s);
      return true;
    } catch (e) {
      if (!isDeclarationError(e)) throw e;
      return false;
    }
  };
  const i = texts.findIndex((t, n) =>
    probed(join(texts.slice(0, n + 1)), registry.properties).some(
      (h) =>
        !fits(`${name}(${h}${OPERATORS.has(t) ? " " : sep}var(--x))`) && !fits(`${name}(${h})`),
    ),
  );
  return !texts.length ? "" : i < 0 ? ` (after argument ${texts.length})` : ` (argument ${i + 1})`;
};

// `text` against `grammar`, a token in it as the literals of its type (lib.ts `probed`); the twin's message, at the call site.
// `where` names the argument, on the failure path.
const checkText = (label: string, grammar: string, text: string, where?: () => string) => {
  for (const v of probed(text, registry.properties))
    try {
      checkValueNow(label, grammar, v);
    } catch (e) {
      if (!isDeclarationError(e)) throw e; // a bug, not a user error
      throw new MacroError({
        message: `${e.message.replace(`, expected ${MATH}`, "")}${where?.() ?? ""}${v === text ? "" : ` ("${text}" is checked as "${v}": a token stands for a value of its type)`}`,
        cause: e,
        ...registry.at,
      });
    }
};

/** The members of `css` that are functions, by name. */
export const fns = Object.fromEntries(
  Object.entries(FUNCTIONS).map(([member, name]) => [member, build(member, name)]),
);
