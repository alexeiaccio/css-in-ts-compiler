// The members of an export group at build time (docs/research/groups.md): `import { color } from "cssints/widely-available"
// with { type: "cssints" }` is rewritten by the plugin (instrument.ts) to the members of `group("widely-available")`. They are
// those of `css`, the ones that name a CSS feature only when the group has it, and a property or a condition checks what it
// built for the tokens the group bans (generated, groups-data.ts), with the words of the types' message (group-types.ts).
// Plain code like lib.ts: user code calls the members in expressions, and an error is thrown at the call site being evaluated.
import { groups as data, type GroupData } from "./groups-data.ts";
import { CONTEXTS, FUNCTIONS, PROPS, PSEUDOS } from "./lib.ts";
import { fail, isNode, type CssNode } from "./node.ts";

const CONDITIONS = ["media", "container", "supports"] as const;
// Members that name a CSS feature: a group has them or not. Anything else is in every group.
const TIED = new Set([
  ...Object.keys(PROPS),
  ...Object.keys(FUNCTIONS),
  ...Object.keys(PSEUDOS),
  ...CONDITIONS,
  "keyframes",
  "positionTry",
]);

// the words of a value, as the types read them (group-types.ts `Words`): runs of non-separators, `name(` for a function
const WORDS = /[^ ,)/:;"'<>=+*[\]{}!#%.⟨⟩&|\n\t(]+\(?/g;

interface Compiled {
  id: string;
  members: Set<string>;
  props: Set<string>;
  kw: Map<string, Set<string>>;
  fn: Set<string>;
  unit: RegExp | undefined;
  query: Record<(typeof CONDITIONS)[number], Set<string>>;
}
const words = (s: string) => new Set(s ? s.split(" ") : []);
const groups = new Map<string, GroupData>(Object.entries(data));
const compiled = new Map<string, Compiled>();
const compile = (id: string): Compiled => {
  const g = groups.get(id);
  if (!g) throw fail(`cssints: no export group cssints/${id}`);
  const members = words(g.members);
  const units = g.ban.unit ? g.ban.unit.split(" ") : [];
  return {
    id,
    members,
    props: new Set([...members].flatMap((m) => (PROPS[m] ? [PROPS[m]] : []))),
    kw: new Map(Object.entries(g.ban.kw).map(([p, ws]) => [p, words(ws)])),
    fn: new Set((g.ban.fn ? g.ban.fn.split(" ") : []).map((f) => `${f}(`)),
    unit: units.length
      ? new RegExp(
          `^[0-9]+(?:e[0-9]+)?(?:${units.toSorted((a, b) => b.length - a.length).join("|")})$`,
        )
      : undefined,
    query: {
      media: words(g.ban.media),
      container: words(g.ban.container),
      supports: words(g.ban.supports),
    },
  };
};

const of = (id: string) => compiled.get(id) ?? compiled.set(id, compile(id)).get(id)!;

// The first banned word of `text`: the property's keywords (or the words of a query), a function, a number with a unit.
const hit = (c: Compiled, own: Set<string> | undefined, text: string) =>
  text.match(WORDS)?.find((w) => own?.has(w) || c.fn.has(w) || c.unit?.test(w));
const said = (w: string) => (w.endsWith("(") ? `${w.slice(0, -1)}()` : w);
const refuse = (c: Compiled, label: string, w: string) =>
  fail(`cssints: ${label}: "${said(w)}" is not in cssints/${c.id}`);

// A declaration a member built: its value, and the other values of a firstThatWorks.
const guard = (c: Compiled, n: CssNode): CssNode => {
  for (const [prop, value, , fallbacks] of n.__cssints) {
    const own = c.kw.get(prop);
    for (const v of fallbacks ? [value, ...fallbacks] : [value]) {
      const w = hit(c, own, v);
      if (w) throw refuse(c, prop, w);
    }
  }
  return n;
};
// A chained method (`flex().gap(...)`) is a member too: its property has to be the group's, and its result chains on.
const chained = (c: Compiled, n: CssNode): CssNode =>
  new Proxy(n, {
    get: (t, k) => {
      const v = Reflect.get(t, k) as unknown;
      if (typeof k !== "string" || k in t || typeof v !== "function") return v;
      return (...args: unknown[]) => {
        const next = guard(c, (v as (...a: unknown[]) => CssNode)(...args));
        const prop = next.__cssints.at(-1)?.[0];
        if (prop && !c.props.has(prop))
          throw fail(`cssints: ${prop} is not in cssints/${c.id} (.${k}())`);
        return chained(c, next);
      };
    },
  });

const texts = (q: unknown): string[] =>
  typeof q === "string" ? [q] : q && typeof q === "object" ? Object.values(q).flatMap(texts) : [];
const wrap = (c: Compiled, name: string, member: unknown): unknown => {
  const fn = member as (...a: unknown[]) => unknown;
  if ((CONDITIONS as readonly string[]).includes(name))
    return (...qs: unknown[]) => {
      const kind = name as (typeof CONDITIONS)[number];
      for (const q of qs.flatMap(texts)) {
        const w = hit(c, c.query[kind], q);
        if (w) throw refuse(c, `@${kind}`, w);
      }
      return fn(...qs);
    };
  if (!(name in PROPS) || typeof member !== "function") return member;
  return (...args: unknown[]) => {
    const made = fn(...args);
    if (!isNode(made)) return made; // positionTry(style) is a rule, not a declaration
    return name in CONTEXTS ? chained(c, guard(c, made)) : guard(c, made);
  };
};

/**
 * The members of an export group.
 * @param {Record<string, unknown>} css `css` of macro.ts, passed in so that this file imports no engine module
 * @param {string} id the group: `widely-available`, `css-grid-2`, ...
 * @returns {Record<string, unknown>} `css` with the members of the group, as they are, and the ones it has not throwing, naming the group, when called
 */
export const groupOf = (css: Record<string, unknown>, id: string): Record<string, unknown> => {
  if (id === "limited-availability") return css;
  const c = of(id);
  return new Proxy(css, {
    get: (t, k) => {
      if (typeof k !== "string") return Reflect.get(t, k) as unknown;
      if (TIED.has(k) && !c.members.has(k))
        return () => {
          throw fail(`cssints: ${k} is not in cssints/${id}`); // at the call, where the site is known
        };
      return wrap(c, k, t[k]);
    },
  });
};

// The CSS properties cssints has a member for: any other (a custom or a vendor-prefixed one) names no feature of the data.
const KNOWN = new Set(Object.values(PROPS));

/**
 * Whether a declaration is in an export group: the group has the property, and the value holds no word it bans.
 * @param {string} id the group: `widely-available`, `baseline-2022/with-downstream`, `css-grid-2`, ...
 * @param {string} property the CSS name: `text-wrap`
 * @param {string} value the value as written: `balance`
 * @returns {boolean} true for a property cssints has no member for (`--x`, `-webkit-text-size-adjust`)
 */
export const inGroup = (id: string, property: string, value: string): boolean => {
  if (id === "limited-availability") return true;
  const c = of(id);
  return (c.props.has(property) || !KNOWN.has(property)) && !hit(c, c.kw.get(property), value);
};
