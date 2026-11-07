// The sheet as cssints prints it, read back into rules: layer, at-rules, selector, declarations, and the sheet's index.
// Plus what the cascade needs of a selector: its specificity, and the selector without its states. Plain code, called per
// rule inside the Effect boundary of `parseSheet` and `inspect` (the hot path of an inspection).
import { Effect } from "effect";

import { close, skipString, splitTop } from "./selector.ts";

export interface Decl {
  prop: string;
  value: string;
  important: boolean;
}

export interface SheetRule {
  /** the place in the sheet: later wins at equal layer and specificity */
  index: number;
  /** the top-level layer path (`_.b`, `viewer`); "" outside every layer */
  layer: string;
  /** the at-rule preludes around the rule, outermost first, @layer excluded */
  wrap: string[];
  selector: string;
  decls: Decl[];
}

export interface Sheet {
  rules: SheetRule[];
  /** custom properties registered by `@property`, and whether they inherit */
  inherits: Map<string, boolean>;
}

const WRAPS = /^@(media|supports|container|scope|starting-style)\b/i;

// The selector arithmetic (splitting, brackets, specificity, states) is plain code in selector.ts, so a browser-side
// reader of a sheet can rank its selectors without the Effect runtime; its callers keep importing it from here.
export { cmpSpec, type Spec, specificity, splitTop, stripStates } from "./selector.ts";

export const parseDecls = (body: string): Decl[] =>
  splitTop(body, ";").flatMap((d) => {
    const colon = d.indexOf(":");
    if (colon <= 0) return [];
    const name = d.slice(0, colon).trim();
    let value = d.slice(colon + 1).trim();
    const important = /!\s*important$/i.test(value);
    if (important) value = value.replace(/\s*!\s*important$/i, "");
    return [{ prop: name.startsWith("--") ? name : name.toLowerCase(), value, important }];
  });

const parseBlock = (s: string, layer: string, wrap: string[], out: Sheet): void => {
  let i = 0;
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i]!)) i++;
    if (i >= s.length) return;
    // the prelude: up to `{` or `;` at depth 0
    let j = i;
    while (j < s.length && s[j] !== "{" && s[j] !== ";") {
      const ch = s[j]!;
      j =
        ch === '"' || ch === "'"
          ? skipString(s, j) + 1
          : ch === "(" || ch === "["
            ? close(s, j)
            : j + 1;
    }
    const prelude = s.slice(i, j).trim();
    if (j >= s.length || s[j] === ";") {
      i = j + 1;
      continue;
    }
    const end = close(s, j);
    const body = s.slice(j + 1, end - 1);
    i = end;
    if (/^@layer\b/i.test(prelude)) {
      const name = prelude.slice(6).trim();
      parseBlock(body, layer ? `${layer}.${name}` : name, wrap, out);
    } else if (WRAPS.test(prelude)) parseBlock(body, layer, [...wrap, prelude], out);
    else if (/^@property\b/i.test(prelude)) {
      const inherits = parseDecls(body).find((d) => d.prop === "inherits");
      out.inherits.set(prelude.slice(9).trim(), inherits?.value.trim() !== "false");
    } else if (prelude.startsWith("@")) continue;
    else {
      // a style rule; nested rules in it (CSS nesting) are not read: cssints prints flat selectors
      const flat = body.replace(/[^;{}]*\{[^]*\}/g, "");
      out.rules.push({
        index: out.rules.length,
        layer,
        wrap,
        selector: prelude,
        decls: parseDecls(flat),
      });
    }
  }
};

/** The rules of a sheet in its order, with their layers and at-rules, and its `@property` registrations. */
export const parseSheet = Effect.fn("devtools.parseSheet")(function* (text: string) {
  return yield* Effect.sync(() => {
    const out: Sheet = { rules: [], inherits: new Map() };
    parseBlock(text.replace(/\/\*[^]*?\*\//g, ""), "", [], out);
    return out;
  });
});
