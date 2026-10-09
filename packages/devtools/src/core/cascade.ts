// The cascade of cssints' sheet for one element (docs/research/devtools.md "Our devtools"): the rules that are the
// element's, which of them apply now (the page decides the at-rules and the states), the winner per longhand by layer
// rank, specificity and the sheet's order, and each winner checked against the browser's computed style.
import { longhands } from "@cssints/css-grammar/longhands";
import { Effect } from "effect";

import { cmpSpec, type Decl, specificity, splitTop, stripStates, type SheetRule } from "./css.ts";
import { type Observed, Page, type Probe } from "./page.ts";
import type { Model, Site } from "./table.ts";

export type Spec = [number, number, number];

export interface Condition {
  text: string;
  holds: boolean;
}

/** One declaration of a rule that is the element's. */
export interface Candidate {
  rule: number;
  selector: string;
  layer: string;
  wrap: readonly string[];
  specificity: Spec;
  decl: Decl;
  /** the at-rules, then the states of the selector */
  conditions: Condition[];
  applies: boolean;
}

export interface Verdict {
  prop: string;
  status: "ok" | "mismatch" | "unverified";
  computed: string;
  expected: string;
  reason?: string;
}

/** The longhands one declaration wins, with what it beat and what does not apply now. */
export interface Row {
  /** the winner's property, or the property of declarations of which none applies */
  prop: string;
  longhands: string[];
  winner?: Candidate;
  /** longhands of the winner's property that another declaration wins */
  lost: { prop: string; by: Candidate }[];
  overridden: Candidate[];
  inactive: Candidate[];
  verdicts: Verdict[];
}

export interface ClassRow {
  cls: string;
  kind: "class" | "marker" | "group" | "other";
  plugin?: string;
  layer?: string;
  decls: Decl[];
  conditions: Condition[];
  active: boolean;
  tokens: readonly string[];
}

export interface Group {
  site?: Site;
  classes: ClassRow[];
}

export interface TokenRow {
  name: string;
  path?: string;
  declared?: string;
  computed: string;
  /** has an `@property` rule: with no source, its value is the initial one */
  registered: boolean;
  /** the rule that sets it on the element or the nearest ancestor */
  source?: { selector: string; layer: string; wrap: readonly string[]; on: string };
}

export interface Inspection {
  element: string;
  root: string;
  groups: Group[];
  rows: Row[];
  tokens: TokenRow[];
}

const lh = (prop: string): readonly string[] => longhands[prop] ?? [prop];
const isScope = (w: string) => /^@scope\b/i.test(w);
const CLASSY = /\._[\w-]/;
const UNLAYERED = 1e9;
// Computed values of these depend on the element's content, which the clone does not have.
const LAYOUT =
  /^(width|height|inline-size|block-size|min-width|min-height|max-width|max-height|flex-basis|grid-template-columns|grid-template-rows)$/;

const layerKey = (model: Model, layer: string) =>
  layer === "" ? UNLAYERED : (model.rank.get(layer) ?? model.rank.get(layer.split(".")[0]!) ?? -1);

// Whether `a` beats `b` in the cascade: importance, then the layer (reversed for `!important`), specificity, order.
export const beats = (model: Model, a: Candidate, b: Candidate): boolean => {
  if (a.decl.important !== b.decl.important) return a.decl.important;
  const la = layerKey(model, a.layer);
  const lb = layerKey(model, b.layer);
  const byLayer = a.decl.important ? lb - la : la - lb;
  return (byLayer || cmpSpec(a.specificity, b.specificity) || a.rule - b.rule) > 0;
};

// The declarations of the rules that are the element's (all, or those that set `only`), with whether each applies now.
const candidates = Effect.fnUntraced(function* (model: Model, el: Element, only?: string) {
  const page = yield* Page;
  const rules = model.sheet.rules.filter(
    (r) => r.decls.length && (!only || r.decls.some((d) => d.prop === only)),
  );
  const items = (r: SheetRule) =>
    splitTop(r.selector, ",").map((s) => ({
      full: s,
      ...(CLASSY.test(s) ? stripStates(s) : { base: s, states: [] as string[] }),
    }));
  // which rules are the element's: the selector without its states matches (inside its @scope, if any)
  const scoped = rules.filter((r) => r.wrap.some(isScope));
  const scopedProbes: Probe[] = scoped.flatMap((r) => {
    const wrap = r.wrap.filter(isScope);
    return [
      {
        wrap,
        selector: items(r)
          .map((x) => x.base)
          .join(", "),
      },
      { wrap, selector: r.selector },
    ];
  });
  const scopedHits = yield* page.probe(el, scopedProbes);
  const mine: { rule: SheetRule; specificity: Spec; matched: boolean; states: string[] }[] = [];
  for (const r of rules) {
    const its = items(r);
    const s = scoped.indexOf(r);
    if (s >= 0) {
      if (!scopedHits[2 * s]) continue;
      mine.push({
        rule: r,
        specificity: its
          .map((x) => specificity(x.full))
          .reduce((m, x) => (cmpSpec(x, m) > 0 ? x : m)),
        matched: !!scopedHits[2 * s + 1],
        states: its.flatMap((x) => x.states),
      });
      continue;
    }
    const base: typeof its = [];
    for (const x of its) if (yield* page.matches(el, x.base)) base.push(x);
    if (!base.length) continue;
    const full: typeof its = [];
    for (const x of base) if (yield* page.matches(el, x.full)) full.push(x);
    const specs = (full.length ? full : base).map((x) => specificity(x.full));
    mine.push({
      rule: r,
      specificity: specs.reduce((m, x) => (cmpSpec(x, m) > 0 ? x : m)),
      matched: full.length > 0,
      states: base.flatMap((x) => x.states),
    });
  }
  // the at-rules, each on its own, for this element
  const preludes = [...new Set(mine.flatMap((m) => m.rule.wrap.filter((w) => !isScope(w))))];
  const held = yield* page.probe(
    el,
    preludes.map((w) => ({ wrap: [w] })),
  );
  const holds = new Map(preludes.map((w, i) => [w, !!held[i]]));
  return mine.flatMap(({ rule, specificity: spec, matched, states }) => {
    const conditions: Condition[] = [
      ...rule.wrap.map((w) => ({ text: w, holds: isScope(w) || !!holds.get(w) })),
      ...[...new Set(states)].map((text) => ({ text, holds: matched })),
    ];
    const applies = matched && conditions.every((c) => c.holds);
    return rule.decls.flatMap((decl) =>
      only && decl.prop !== only
        ? []
        : [
            {
              rule: rule.index,
              selector: rule.selector,
              layer: rule.layer,
              wrap: rule.wrap,
              specificity: spec,
              decl,
              conditions,
              applies,
            } satisfies Candidate,
          ],
    );
  });
});

const verdictOf = (o: Observed, winner: Candidate, root: string): Verdict => {
  const base = { prop: o.prop, computed: o.computed, expected: o.expected };
  if (o.computed === o.expected) return { ...base, status: "ok" };
  if (o.inline)
    return {
      ...base,
      status: "mismatch",
      reason: `the element's style attribute sets ${o.prop}: ${o.inline}`,
    };
  const foreign =
    o.foreign.find((f) => f.important) ?? o.foreign.find((f) => f.layer === "") ?? o.foreign[0];
  if (foreign)
    return {
      ...base,
      status: "mismatch",
      reason: `${foreign.selector} { ${o.prop}: ${foreign.value}${foreign.important ? " !important" : ""} } in ${foreign.source.replace(`${root}/`, "")} beats it: ${
        foreign.layer
          ? `layer ${foreign.layer}`
          : "a rule outside every layer beats every layer, cssints' too"
      }`,
    };
  if (o.animated)
    return {
      ...base,
      status: "mismatch",
      reason: "an animation or a transition is running on the element",
    };
  if (LAYOUT.test(o.prop))
    return {
      ...base,
      status: "unverified",
      reason: `${o.prop} depends on the element's content and layout, which the probe does not have`,
    };
  return {
    ...base,
    status: "mismatch",
    reason: `the browser computes ${o.computed}; ${winner.selector} would give ${o.expected}`,
  };
};

// The winner of one property on one element, among the rules that set it.
const winnerOf = Effect.fnUntraced(function* (model: Model, el: Element, prop: string) {
  let best: Candidate | undefined;
  for (const c of yield* candidates(model, el, prop))
    if (c.applies && (!best || beats(model, c, best))) best = c;
  return best;
});

// The rule that gives the element a custom property: on it, or inherited from the nearest ancestor that has one.
const sourceOf = Effect.fnUntraced(function* (model: Model, el: Element, name: string) {
  const page = yield* Page;
  const inherits = model.sheet.inherits.get(name) ?? true;
  let node: Element | undefined = el;
  for (let depth = 0; node && depth < 64; depth++) {
    const w = yield* winnerOf(model, node, name);
    if (w)
      return { selector: w.selector, layer: w.layer, wrap: w.wrap, on: yield* page.label(node) };
    if (!inherits) return undefined;
    node = yield* page.parent(node);
  }
  return undefined;
});

const VAR = /var\(\s*(--[\w-]+)/g;

/** The cssints classes of an element grouped by the call that made them, the cascade per property, and its tokens. */
export const inspect = Effect.fn("devtools.inspect")(function* (model: Model, el: Element) {
  const page = yield* Page;
  const { table } = model;
  const all = yield* candidates(model, el);
  const applying = all.filter((c) => c.applies);
  const waiting = all.filter((c) => !c.applies);

  // per longhand, the winner
  const winners = new Map<string, Candidate>();
  for (const c of applying)
    for (const l of lh(c.decl.prop)) {
      const w = winners.get(l);
      if (!w || beats(model, c, w)) winners.set(l, c);
    }
  const won = new Map<Candidate, string[]>();
  for (const [l, c] of winners) (won.get(c) ?? won.set(c, []).get(c)!).push(l);
  const touches = (c: Candidate, ls: readonly string[]) =>
    lh(c.decl.prop).some((l) => ls.includes(l));
  const rows: Row[] = [];
  for (const [c, ls] of won) {
    const verdicts = (yield* page.verify(el, c.decl.prop, c.selector, c.decl.value, ls)).map((o) =>
      verdictOf(o, c, table.root),
    );
    rows.push({
      prop: c.decl.prop,
      longhands: ls,
      winner: c,
      lost: lh(c.decl.prop).flatMap((l) => {
        const by = winners.get(l);
        return by && by !== c ? [{ prop: l, by }] : [];
      }),
      overridden: applying.filter((o) => o !== c && touches(o, ls)),
      inactive: waiting.filter((o) => touches(o, ls)),
      verdicts,
    });
  }
  // declarations of which none applies now (a hover colour with no base colour)
  const idle = new Map<string, Candidate[]>();
  for (const c of waiting)
    if (!lh(c.decl.prop).some((l) => winners.has(l)))
      (idle.get(c.decl.prop) ?? idle.set(c.decl.prop, []).get(c.decl.prop)!).push(c);
  for (const [prop, inactive] of idle)
    rows.push({ prop, longhands: [...lh(prop)], lost: [], overridden: [], inactive, verdicts: [] });
  rows.sort(
    (a, b) =>
      Number(a.prop.startsWith("--")) - Number(b.prop.startsWith("--")) ||
      (a.prop < b.prop ? -1 : a.prop > b.prop ? 1 : 0),
  );

  // the classes, grouped by the call that made them
  const classes = yield* page.classes(el);
  const byRule = new Map(all.map((c) => [c.rule, c]));
  const classRow = (cls: string): ClassRow => {
    const rec = table.classes[cls];
    if (!rec) return { cls, kind: "other", decls: [], conditions: [], active: true, tokens: [] };
    const own = rec.kind === "class" ? (model.rulesOf.get(cls) ?? []) : [];
    const seen = own.flatMap((i) => byRule.get(i) ?? []);
    const first = own[0] === undefined ? undefined : model.sheet.rules[own[0]];
    const states = first ? splitTop(first.selector, ",").flatMap((s) => stripStates(s).states) : [];
    return {
      cls,
      kind: rec.kind,
      ...(rec.plugin ? { plugin: rec.plugin } : {}),
      layer: rec.layer,
      decls: own.flatMap((i) => model.sheet.rules[i]?.decls ?? []),
      conditions: seen[0]?.conditions ?? [
        ...rec.wrap.map((text) => ({ text, holds: false })),
        ...states.map((text) => ({ text, holds: false })),
      ],
      active: rec.kind !== "class" || seen.some((c) => c.applies),
      tokens: rec.tokens,
    };
  };
  const groups: Group[] = [];
  let left = classes.filter((c) => table.classes[c]);
  while (left.length) {
    let best: { site: Site; n: number } | undefined;
    for (const c of left)
      for (const i of table.classes[c]!.sites) {
        const site = table.sites[i]!;
        const n = site.classes.filter((x) => left.includes(x)).length;
        if (!best || n > best.n || (n === best.n && site.classes.length < best.site.classes.length))
          best = { site, n };
      }
    if (!best) break;
    const site = best.site;
    groups.push({ site, classes: left.filter((c) => site.classes.includes(c)).map(classRow) });
    left = left.filter((c) => !site.classes.includes(c));
  }
  const rest = classes.filter((c) => !groups.some((g) => g.classes.some((r) => r.cls === c)));
  if (rest.length) groups.push({ classes: rest.map(classRow) });

  // the tokens the element's rules read
  const names = [
    ...new Set([
      ...all.flatMap((c) => [...c.decl.value.matchAll(VAR)].map((m) => m[1]!)),
      ...classes.flatMap((c) => table.classes[c]?.tokens ?? []),
    ]),
  ].sort();
  const computed = yield* page.custom(el, names);
  const tokens: TokenRow[] = [];
  for (const [i, name] of names.entries()) {
    const def = table.tokens[name];
    const source = yield* sourceOf(model, el, name);
    tokens.push({
      name,
      ...(def ? { path: def.path, declared: def.value } : {}),
      computed: computed[i] ?? "",
      registered: model.sheet.inherits.has(name),
      ...(source ? { source } : {}),
    });
  }
  return {
    element: yield* page.label(el),
    root: table.root,
    groups,
    rows,
    tokens,
  } satisfies Inspection;
});
