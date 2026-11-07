// Selector arithmetic: splitting at a separator outside brackets, the index after a bracket closes, and a selector's
// specificity. Plain code with no Effect import, so the browser-side vitals report can rank a sheet's selectors without
// pulling the Effect runtime; the cascade imports it too (css.ts re-exports it for its callers).
export type Spec = [number, number, number];

export const skipString = (s: string, i: number) => {
  for (let j = i + 1; j < s.length; j++) {
    if (s[j] === "\\") j++;
    else if (s[j] === s[i]) return j;
  }
  return s.length;
};

// The index after the bracket that closes the one at `i` (`{`, `(` or `[`), skipping strings.
export const close = (s: string, i: number) => {
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    const ch = s[j]!;
    if (ch === '"' || ch === "'") j = skipString(s, j);
    else if (ch === "{" || ch === "(" || ch === "[") depth++;
    else if (ch === "}" || ch === ")" || ch === "]") if (--depth === 0) return j + 1;
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
