// The selector of css.global(), against <complex-selector-list> (css-selectors-4): a plain recognizer written over that
// grammar, since the twin reads values and drops the whitespace a selector is made of (a descendant combinator).
//   <complex-selector> = <compound-selector> [ <combinator>? <compound-selector> ]*
//   <compound-selector> = [ <type-selector>? <subclass-selector>* [ <pseudo-element-selector> <pseudo-class-selector>* ]* ]!
// The arguments of a functional pseudo-class are <any-value>: balanced, not read. Not accepted: `&` (nesting, relative
// selectors). Throws an InvalidValueError at the point it reached.
import { InvalidValueError } from "./errors.ts";

const I = String.raw`(?:--|-?(?:[A-Za-z_\u0080-\uffff]|\\.))(?:[\w\u0080-\uffff-]|\\.)*`;
const STR = String.raw`"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'`;
const NS = String.raw`(?:(?:${I}|\*)?\|)?`;
const y = (src: string) => new RegExp(src, "y");
const TYPE = y(`${NS}(?:${I}|\\*)`);
const SUB = y(
  String.raw`#${I}|\.${I}|\[\s*${NS}${I}\s*(?:[~|^$*]?=\s*(?:${STR}|${I})\s*[is]?\s*)?\]|::?${I}`,
);
const COMB = y(String.raw`(?:\|\||[>+~])\s*`);
const WS = y(String.raw`\s+`);

/** `(` at `i`: the index after its matching `)`, or -1; the content is not empty. */
const close = (s: string, i: number): number => {
  for (let depth = 0, j = i; j < s.length; j++) {
    const c = s[j]!;
    if (c === "\\") j++;
    else if (c === '"' || c === "'") {
      const end = new RegExp(`${c}(?:[^${c}\\\\]|\\\\.)*${c}`, "y");
      end.lastIndex = j;
      const m = end.exec(s);
      if (!m) return -1;
      j += m[0].length - 1;
    } else if (c === "(") depth++;
    else if (c === ")" && !--depth) return /^\(\s*\)$/.test(s.slice(i, j + 1)) ? -1 : j + 1;
  }
  return -1;
};

/** `sel` is a <complex-selector-list>, or throws an InvalidValueError that names the token it stopped at. */
export function checkSelectorNow(sel: string): void {
  let i = 0;
  const eat = (re: RegExp) => {
    re.lastIndex = i;
    const m = re.exec(sel);
    if (m) i += m[0].length;
    return m?.[0];
  };
  const stop = (): never => {
    const token = /^,|^[^\s,]*/.exec(sel.slice(i))![0];
    throw new InvalidValueError({
      message: `selector: ${token ? `unexpected "${token}"` : "unexpected end"} in "${sel}", expected <complex-selector-list>`,
      property: "selector",
      value: sel,
      position: i,
      expected: ["<complex-selector-list>"],
    });
  };
  const compound = () => {
    const start = i;
    let pseudoElement = false;
    eat(TYPE);
    for (let s: string | undefined; (s = eat(SUB)); ) {
      if (pseudoElement && s[0] !== ":") {
        i -= s.length;
        return stop();
      }
      if (s.startsWith("::")) pseudoElement = true;
      if (sel[i] === "(" && s[0] === ":") {
        const end = close(sel, i);
        if (end < 0) return stop();
        i = end;
      }
    }
    if (i === start) stop();
  };
  eat(WS);
  for (;;) {
    compound();
    for (;;) {
      const space = eat(WS);
      if (i === sel.length) return;
      if (sel[i] === ",") {
        i++;
        eat(WS);
        break;
      }
      if (!eat(COMB) && !space) stop();
      compound();
    }
  }
}
