// The sheet as cssints prints it, read back into rules: layer, at-rules, selector, declarations, and the sheet's index.
// Plus what the cascade needs of a selector: its specificity, and the selector without its states. Plain code, called per
// rule inside the Effect boundary of `parseSheet` and `inspect` (the hot path of an inspection).
import { Effect } from "effect";

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

// The index after the bracket that closes the one at `i` (`{`, `(` or `[`), skipping strings.
const close = (s: string, i: number) => {
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    const ch = s[j]!;
    if (ch === '"' || ch === "'") j = skipString(s, j);
    else if (ch === "{" || ch === "(" || ch === "[") depth++;
    else if (ch === "}" || ch === ")" || ch === "]") if (--depth === 0) return j + 1;
  }
  return s.length;
};
const skipString = (s: string, i: number) => {
  for (let j = i + 1; j < s.length; j++) {
    if (s[j] === "\\") j++;
    else if (s[j] === s[i]) return j;
  }
  return s.length;
};

// Splits at `sep` outside brackets and strings.
export const splitTop = (s: string, sep: string): string[] => {
  const out: string[] = [];
  let depth = 0;
  let from = 0;
  for (let j = 0; j < s.length; j++) {
    const ch = s[j]!;
    if (ch === '"' || ch === "'") j = skipString(s, j);
    else if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") depth--;
    else if (ch === sep && depth === 0) {
      out.push(s.slice(from, j));
      from = j + 1;
    }
  }
  out.push(s.slice(from));
  return out.flatMap((x) => (x.trim() ? [x.trim()] : []));
};

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

// ---------- selectors

type Spec = [number, number, number];
const ZERO: Spec = [0, 0, 0];
const add = (a: Spec, b: Spec): Spec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const cmpSpec = (a: Spec, b: Spec): number => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
const max = (specs: Spec[]) => specs.reduce((m, x) => (cmpSpec(x, m) > 0 ? x : m), ZERO);

const IDENT = /^-?[\w-]+/;
const NAMED_ARGS = /^(is|not|has|matches)$/i;

// Specificity of one complex selector (not a list): `:where()` is 0, `:is()`, `:not()`, `:has()` their most specific argument.
export const specificity = (sel: string): Spec => {
  let spec: Spec = [0, 0, 0];
  for (let i = 0; i < sel.length; ) {
    const ch = sel[i]!;
    const rest = sel.slice(i + 1);
    if (ch === "#") {
      spec = add(spec, [1, 0, 0]);
      i += 1 + (IDENT.exec(rest)?.[0].length ?? 0);
    } else if (ch === ".") {
      spec = add(spec, [0, 1, 0]);
      i += 1 + (IDENT.exec(rest)?.[0].length ?? 0);
    } else if (ch === "[") {
      spec = add(spec, [0, 1, 0]);
      i = close(sel, i);
    } else if (ch === ":") {
      const element = sel[i + 1] === ":";
      const at = i + (element ? 2 : 1);
      const name = IDENT.exec(sel.slice(at))?.[0] ?? "";
      let next = at + name.length;
      const args = sel[next] === "(" ? sel.slice(next + 1, close(sel, next) - 1) : undefined;
      if (args !== undefined) next = close(sel, next);
      if (element) spec = add(spec, [0, 0, 1]);
      else if (/^where$/i.test(name)) spec = add(spec, ZERO);
      else if (NAMED_ARGS.test(name) && args !== undefined)
        spec = add(spec, max(splitTop(args, ",").map(specificity)));
      else spec = add(spec, [0, 1, 0]);
      i = next;
    } else if (/[a-zA-Z]/.test(ch)) {
      spec = add(spec, [0, 0, 1]);
      i += IDENT.exec(sel.slice(i))?.[0].length ?? 1;
    } else i++;
  }
  return spec;
};

// The pseudo-classes that say where an element is, not what state it is in: kept by `stripStates`.
const STRUCTURE =
  /^(where|is|not|has|root|scope|host|first-child|last-child|only-child|first-of-type|last-of-type|only-of-type|empty|defined|nth-child|nth-last-child|nth-of-type|nth-last-of-type)$/i;

// A selector of a class rule without its states, and the states: `._x:hover` is `._x` and `:hover`,
// `:where(._g:hover) ._x` is `:where(._g) ._x` and `within :hover`, `._x[aria-current="page"]` is `._x` and the attribute.
export const stripStates = (sel: string, within = false): { base: string; states: string[] } => {
  let base = "";
  const states: string[] = [];
  for (let i = 0; i < sel.length; ) {
    const ch = sel[i]!;
    if (ch === "[") {
      const end = close(sel, i);
      states.push(`${within ? "within " : ""}${sel.slice(i, end)}`);
      i = end;
    } else if (ch === ":" && sel[i + 1] !== ":") {
      const name = IDENT.exec(sel.slice(i + 1))?.[0] ?? "";
      const next = i + 1 + name.length;
      const hasArgs = sel[next] === "(";
      const end = hasArgs ? close(sel, next) : next;
      if (STRUCTURE.test(name)) {
        if (hasArgs && /^(where|is|not|has)$/i.test(name)) {
          const inner = splitTop(sel.slice(next + 1, end - 1), ",").map((a) =>
            stripStates(a, within || /^where$/i.test(name)),
          );
          inner.forEach((x) => states.push(...x.states));
          base += `:${name}(${inner.map((x) => x.base || "*").join(", ")})`;
        } else base += sel.slice(i, end);
      } else states.push(`${within ? "within " : ""}${sel.slice(i, end)}`);
      i = end;
    } else {
      base += ch;
      i++;
    }
  }
  base = base.trim();
  return { base: /(^|[\s>+~])$/.test(base) ? `${base}*` : base, states };
};
