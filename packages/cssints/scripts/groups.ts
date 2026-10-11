// Regenerates the export groups (docs/research/groups.md): src/groups-data.ts (what the build reads: the members of each group
// and the tokens it bans) and src/groups/<id>.ts (what TypeScript reads: the same, as declarations of the subpath
// `cssints/<id>`). Baseline groups come from web-features (the status of each BCD key); spec groups from @webref/css 6, which
// keeps one file per level of a spec (8 keeps the latest level only). Run: node scripts/groups.ts (bun run groups)
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

import { functions } from "@cssints/css-grammar/functions";
import { properties, syntaxes } from "@cssints/css-grammar/mdn";
import { get as bcd, lackingOf, tokenKey, type Target } from "@cssints/css-grammar/support";
import { parseGrammar, type Node } from "@cssints/css-grammar/twin-core";
import { getAllVersions, getCompatibleVersions } from "baseline-browser-mapping";
import { features } from "web-features";

import { BUILDERS, chainNames, CONTEXTS, FUNCTIONS, PROPS, PSEUDOS } from "../src/lib.ts";

// the pinned versions, from the manifests (the packages do not export their package.json)
const pins = (dir: string) => {
  const m = JSON.parse(readFileSync(`${import.meta.dirname}/${dir}/package.json`, "utf8")) as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  return { ...m.dependencies, ...m.devDependencies };
};
const pinned = { ...pins("../../css-grammar"), ...pins("..") };
const version = (p: string) => pinned[p]!.replace(/^npm:.*@/, "");
const props: Record<string, string> = properties;
const syns: Record<string, string> = syntaxes;
const here = import.meta.dirname;

// ---- what a group is: the CSS names of its members and the tokens it bans (by property, and everywhere)
interface Group {
  props: Set<string>;
  fns: Set<string>;
  sels: Set<string>; // pseudo-classes, without the colon
  at: Set<string>; // media, container, supports, keyframes, position-try
  kw: Map<string, Set<string>>; // property -> keywords, `name(` for a function
  fn: Set<string>;
  unit: Set<string>;
  media: Set<string>;
  container: Set<string>; // `scroll-state(`
  supports: Set<string>; // `selector(`
}
const empty = () => ({
  props: new Set<string>(),
  fns: new Set<string>(),
  sels: new Set<string>(),
  at: new Set<string>(),
  kw: new Map<string, Set<string>>(),
  fn: new Set<string>(),
  unit: new Set<string>(),
  media: new Set<string>(),
  container: new Set<string>(),
  supports: new Set<string>(),
});
const AT = ["media", "container", "supports", "keyframes", "position-try"];
const UNITS = {
  "css.types.angle.deg": ["deg"],
  "css.types.angle.grad": ["grad"],
  "css.types.angle.rad": ["rad"],
  "css.types.angle.turn": ["turn"],
  "css.types.flex": ["fr"],
  "css.types.length.Q": ["Q", "q"],
  "css.types.length.container_query_length_units": ["cqw", "cqh", "cqi", "cqb", "cqmin", "cqmax"],
  "css.types.length.viewport_percentage_units_dynamic": [
    "dvw",
    "dvh",
    "dvi",
    "dvb",
    "dvmin",
    "dvmax",
  ],
  "css.types.length.viewport_percentage_units_large": [
    "lvw",
    "lvh",
    "lvi",
    "lvb",
    "lvmin",
    "lvmax",
  ],
  "css.types.length.viewport_percentage_units_small": [
    "svw",
    "svh",
    "svi",
    "svb",
    "svmin",
    "svmax",
  ],
  "css.types.resolution.dpcm": ["dpcm"],
  "css.types.resolution.dpi": ["dpi"],
  "css.types.resolution.dppx": ["dppx"],
  "css.types.resolution.x": ["x"],
  ...Object.fromEntries(
    "cap ch em ex ic lh rcap rch rem rex ric rlh vb vh vi vmax vmin vw"
      .split(" ")
      .map((u) => [`css.types.length.${u}`, [u]]),
  ),
};
const CONTAINER = {
  "scroll-state(": "css.at-rules.container.scroll_state_queries",
  "style(": "css.at-rules.container.style_queries_for_custom_properties",
  "anchored(": "css.at-rules.container.anchor_position_queries",
};
const SUPPORTS = {
  "selector(": "css.at-rules.supports.selector",
  "font-tech(": "css.at-rules.supports.font-tech",
  "font-format(": "css.at-rules.supports.font-format",
};

// ---- baseline: the status of a BCD key in web-features, worst of the features that list it; an unlisted key takes its
// nearest listed ancestor's (a value of a property is part of the property's feature), no ancestor: limited availability
interface Info {
  level: 0 | 1 | 2; // 0 widely available (Baseline high), 1 newly available (low), 2 limited availability
  year: number; // the year of baseline_low_date, Infinity when the key is not Baseline
  dis: boolean; // discouraged
}
const LIMITED: Info = { level: 2, year: Infinity, dis: false };
const listed = new Map<string, Info>();
for (const f of Object.values(features)) {
  if (f.kind !== "feature") continue;
  for (const k of f.compat_features ?? []) {
    if (!k.startsWith("css.")) continue;
    const { baseline: b, baseline_low_date: low } = f.status.by_compat_key?.[k] ?? f.status;
    const level = b === "high" ? 0 : b === "low" ? 1 : 2;
    const old = listed.get(k);
    listed.set(k, {
      level: Math.max(old?.level ?? 0, level) as 0 | 1 | 2,
      year: Math.max(old?.year ?? 0, low ? Number(low.replace("≤", "").slice(0, 4)) : Infinity),
      dis: (old?.dis ?? false) || !!f.discouraged,
    });
  }
}
// One override: web-features counts a `cursor` keyword as limited for lacking iOS Safari (a touch screen has no pointer; BCD
// says the same, see the wayfinder), so the keywords of `cursor` take the status of the property.
const info = (key: string) => {
  const k = key.replace(/^(css\.properties\.cursor)\..*/, "$1");
  const own = k
    .split(".")
    .map((_, n, parts) => listed.get(parts.slice(0, parts.length - n).join(".")));
  return own.find((i, n) => n < own.length - 2 && i) ?? LIMITED;
};

// the keywords and functions a property's grammar reaches (through types and <'properties'>), as keywords.ts walks them
const reach = (p: string) => {
  const kws = new Set<string>();
  const fns = new Set<string>();
  const seen = new Set<string>([`'${p}`]);
  const walk = (n: Node) => {
    switch (n[0]) {
      case "kw":
        kws.add(n[1]);
        return;
      case "type": {
        const g = syns[n[1]];
        if (g === undefined || seen.has(n[1])) return;
        seen.add(n[1]);
        if (n[1].endsWith("()")) fns.add(n[1].slice(0, -2));
        return walk(parseGrammar(g));
      }
      case "prop": {
        const g = props[n[1]];
        if (g === undefined || seen.has(`'${n[1]}`)) return;
        seen.add(`'${n[1]}`);
        return walk(parseGrammar(g));
      }
      case "fn":
        if (n[1]) fns.add(n[1]);
        return walk(n[2]);
      case "opt":
      case "star":
      case "plus":
      case "list":
      case "bang":
      case "rep":
        return walk(n[1]);
      case "alt":
      case "or":
      case "and":
      case "seq":
        for (const x of n[1]) walk(x);
    }
  };
  walk(parseGrammar(props[p]!));
  return { kws, fns };
};

const propNames = Object.keys(props).filter((p) => p !== "--*");
const fnNames = Object.keys(functions);
const bcdTypes = Object.keys(bcd("css.types") ?? {});
// The BCD keys of a function: css.types.<f>, or css.types.<group>.<f> (members.ts does the same for the JSDoc); failing
// those, the key of its alias or the keys a property has for it (`width.fit-content_function`, `grid-template-columns.minmax`)
const ALIAS = new Map([
  ["rgba", "color.rgb"],
  ["hsla", "color.hsl"],
  ["linear", "easing-function.linear-function"],
]);
const scoped = new Map<string, string[]>();
for (const p of propNames)
  for (const c of Object.keys(bcd(`css.properties.${p}`) ?? {})) {
    const f = c.replace(/_function$/, "");
    if (f in functions) scoped.set(f, [...(scoped.get(f) ?? []), `css.properties.${p}.${c}`]);
  }
const fnKeys = (f: string) => {
  const types = [f, ...bcdTypes].map((g) => `css.types.${g}${g === f ? "" : `.${f}`}`);
  const own = types.find((k) => bcd(k)?.__compat);
  if (own) return [own];
  const alias = ALIAS.has(f) ? `css.types.${ALIAS.get(f)}` : undefined;
  return alias && bcd(alias)?.__compat ? [alias] : (scoped.get(f) ?? []);
};
const selNames = Object.values(PSEUDOS).map((c) => c.text.slice(1));
const mediaKeys = Object.keys(bcd("css.at-rules.media") ?? {}).filter((k) =>
  /^[a-z][a-z0-9-]*$/.test(k),
);

// A downstream group also needs every key supported, by BCD, in each downstream browser at the minimum version that
// baseline-browser-mapping gives for the group's target (docs/research/groups.md). The same rule as the support warnings
// (lackingOf: no prefix, no flag; a key BCD does not know, or a browser it lacks, lacks nothing). UC and QQ are not in BCD:
// they are Blink, and the mapping names the Chromium version of each build, so they are checked as Chrome at that version.
const AGENT = new Map([
  ["opera", "opera"],
  ["opera_android", "op_mob"],
  ["samsunginternet_android", "samsung"],
  ["webview_android", "android"],
]);
const ENGINE = new Map(
  (
    getAllVersions({ includeDownstreamBrowsers: true, suppressWarnings: true }) as {
      browser: string;
      version: string;
      engine_version?: string;
    }[]
  ).map((v) => [`${v.browser} ${v.version}`, v.engine_version ?? ""]),
);
const downstream = (target: Parameters<typeof getCompatibleVersions>[0]) =>
  getCompatibleVersions({ ...target, includeDownstreamBrowsers: true, suppressWarnings: true })
    .filter((v) => AGENT.has(v.browser) || v.browser === "uc_android" || v.browser === "qq_android")
    .map(
      (v) =>
        (AGENT.has(v.browser)
          ? [AGENT.get(v.browser)!, v.version]
          : ["chrome", ENGINE.get(`${v.browser} ${v.version}`)!]) satisfies Target,
    );

const baseline = (out: (i: Info) => boolean, down?: Target[]) => {
  const g = empty();
  const ok = (key: string) => !out(info(key)) && (!down || !lackingOf(key, down).length);
  for (const p of propNames) if (ok(`css.properties.${p}`)) g.props.add(p);
  for (const f of fnNames) {
    const keys = fnKeys(f);
    if (keys.length ? keys.every(ok) : !out(info("")))
      g.fns.add(f); // no BCD key: limited availability
    else g.fn.add(f);
  }
  for (const s of selNames) if (ok(`css.selectors.${s}`)) g.sels.add(s);
  for (const a of AT) if (ok(`css.at-rules.${a}`)) g.at.add(a);
  // a property-scoped keyword or function: only for the properties the group has
  for (const p of g.props) {
    const { kws, fns } = reach(p);
    const bad = new Set<string>();
    for (const [toks, isFn] of [
      [kws, false],
      [fns, true],
    ] as const)
      for (const t of toks) {
        const key = tokenKey(p, t, isFn);
        if (key?.startsWith("css.properties.") && !ok(key)) bad.add(isFn ? `${t}(` : t);
      }
    if (bad.size) g.kw.set(p, bad);
  }
  for (const [key, us] of Object.entries(UNITS)) if (!ok(key)) us.forEach((u) => g.unit.add(u));
  for (const m of mediaKeys) if (!ok(`css.at-rules.media.${m}`)) g.media.add(m);
  for (const [w, key] of Object.entries(CONTAINER)) if (!ok(key)) g.container.add(w);
  for (const [w, key] of Object.entries(SUPPORTS)) if (!ok(key)) g.supports.add(w);
  return g;
};

// ---- specs: one @webref/css 6 file per spec level; a group is the levels of a series up to its own, and bans what only the
// later levels of that series define
interface Spec {
  id: string;
  series: string;
  level: number;
  title: string;
  kw: Map<string, Set<string>>; // property -> keywords and functions of its grammar
  fns: Set<string>; // every function it defines
  sels: Set<string>;
  at: Set<string>;
  media: Set<string>;
  unit: Set<string>;
}
// what the script reads of a file of @webref/css 6
interface Value {
  name: string;
  type?: string;
  values?: Value[];
}
interface Extract {
  spec: { title: string; url: string };
  properties?: (Value & { value?: string; newValues?: string })[];
  selectors?: Value[];
  values?: Value[];
  atrules?: (Value & { descriptors?: Value[] })[];
}
// the keywords of a grammar, and `name(` for a function it names
const words = (grammar: string, into: Set<string>) => {
  const g = grammar.replace(/<[^>]*>/g, " ").replace(/\{[^}]*\}/g, " ");
  for (const [, w, paren] of g.matchAll(/(?<![\w-])([a-z][\w-]*)(\()?/g))
    into.add(`${w}${paren ?? ""}`);
};
const dir = `${import.meta.dirname}/../node_modules/webref-specs/`;
const specs: Spec[] = [];
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "package.json")) {
  const j = JSON.parse(readFileSync(`${dir}${file}`, "utf8")) as Extract;
  const m = /^https:\/\/drafts\.(?:csswg|fxtf)\.org\/([a-z0-9-]+)\/$/.exec(j.spec.url);
  if (!m) continue;
  const id = m[1]!;
  const lv = /^(.+)-(\d+)$/.exec(id);
  const s: Spec = {
    id,
    series: lv ? lv[1]! : id,
    level: lv ? Number(lv[2]) : 0,
    title: j.spec.title,
    kw: new Map(),
    fns: new Set(),
    sels: new Set(),
    at: new Set(),
    media: new Set(),
    unit: new Set(),
  };
  const nested = (vs: Value[] | undefined, owner?: string) => {
    for (const v of vs ?? []) {
      if (v.type === "function") s.fns.add(String(v.name).replace(/\(\)$/, ""));
      if (owner && v.type === "value" && /^[a-z][\w-]*$/.test(v.name)) {
        if (/^<(?:length|angle|time|resolution|frequency|flex)>$/.test(owner)) s.unit.add(v.name);
        else if (owner.startsWith("<")) continue;
        else (s.kw.get(owner) ?? s.kw.set(owner, new Set()).get(owner)!).add(v.name);
      }
      nested(v.values, owner ?? (v.type === "type" ? v.name : undefined));
    }
  };
  for (const p of j.properties ?? []) {
    const set = s.kw.get(p.name) ?? s.kw.set(p.name, new Set()).get(p.name)!;
    words(`${p.value ?? ""} | ${p.newValues ?? ""}`, set);
    nested(p.values, p.name);
  }
  nested(j.values);
  for (const x of j.selectors ?? []) if (/^:[a-z-]+$/.test(x.name)) s.sels.add(x.name.slice(1));
  for (const a of j.atrules ?? []) {
    s.at.add(a.name.slice(1));
    if (a.name === "@media") for (const d of a.descriptors ?? []) s.media.add(d.name);
  }
  specs.push(s);
}

const fromSpec = (id: string) => {
  const me = specs.find((s) => s.id === id)!;
  const same = specs.filter((s) => s.series === me.series);
  const upTo = same.filter((s) => s.level <= me.level);
  const later = same.filter((s) => s.level > me.level);
  const g = empty();
  const union = <T>(of: Spec[], f: (s: Spec) => Iterable<T>) =>
    new Set(of.flatMap((s) => [...f(s)]));
  const mine = union(upTo, (s) => s.kw.keys());
  mine.forEach((p) => props[p] !== undefined && g.props.add(p));
  union(upTo, (s) => s.fns).forEach((f) => f in functions && g.fns.add(f));
  union(upTo, (s) => s.sels).forEach((x) => selNames.includes(x) && g.sels.add(x));
  union(upTo, (s) => s.at).forEach((a) => AT.includes(a) && g.at.add(a));
  const gone = <T>(f: (s: Spec) => Iterable<T>) => {
    const have = union(upTo, f);
    return [...union(later, f)].filter((x) => !have.has(x));
  };
  for (const p of g.props) {
    const bad = new Set(
      later
        .flatMap((s) => [...(s.kw.get(p) ?? [])])
        .filter((w) => !upTo.some((s) => s.kw.get(p)?.has(w))),
    );
    if (bad.size) g.kw.set(p, bad);
  }
  gone((s) => s.fns).forEach((f) => f in functions && g.fn.add(f));
  gone((s) => s.unit).forEach((u) => g.unit.add(u));
  gone((s) => s.media).forEach((m) => g.media.add(m));
  return g;
};

// ---- the output
const lengthOf = (g: Group) => g.props.size + g.fns.size + g.sels.size + g.at.size;
const groups = new Map<string, { kind: "baseline" | "spec"; title: string; g: Group }>();
// "widely available" is a date in baseline-browser-mapping: web-features 3.42.0 was published on 2026-10-09
const AS_OF = "2026-10-09";
const YEARS = [...listed.values()].flatMap((i) => (Number.isFinite(i.year) ? [i.year] : []));
const [FIRST, LAST] = [Math.min(...YEARS), Math.max(...YEARS)];
type Def = [
  id: string,
  title: string,
  out: (i: Info) => boolean,
  target?: Parameters<typeof downstream>[0],
];
const BASELINE: Def[] = [
  [
    "widely-available",
    "Baseline widely available (high)",
    (i) => i.level > 0,
    { widelyAvailableOnDate: AS_OF },
  ],
  [
    "newly-available",
    "Baseline newly available (low) and widely available",
    (i) => i.level > 1,
    { targetYear: LAST },
  ],
  ["not-discouraged", "everything web-features does not discourage", (i) => i.dis],
  ...Array.from({ length: LAST - FIRST + 1 }, (_, n) => {
    const y = FIRST + n;
    return [
      `baseline-${y}`,
      `Baseline ${y}: what was newly available by the end of ${y}`,
      (i: Info) => i.year > y,
      { targetYear: y },
    ] satisfies Def;
  }),
];
for (const [id, title, out, target] of BASELINE) {
  groups.set(id, { kind: "baseline", title, g: baseline(out) });
  if (target)
    groups.set(`${id}/with-downstream`, {
      kind: "baseline",
      title: `${title}, and in the downstream browsers`,
      g: baseline(out, downstream(target)),
    });
}
for (const s of specs) {
  const g = fromSpec(s.id);
  if (lengthOf(g)) groups.set(s.id, { kind: "spec", title: s.title, g });
}
if (groups.has("limited-availability"))
  throw new Error("limited-availability is the whole of cssints");

// member names (lib.ts): property builders (with the short set), functions, pseudo-class wrappers, conditions
// a property's members; `container` is the condition (macro.ts) and `positionTry` both, so those come with their at-rule
const byProp = new Map<string, string[]>();
for (const [m, p] of Object.entries(PROPS))
  if (!(BUILDERS.has(m) && m !== "flex" && m !== "grid") && m !== "positionTry")
    byProp.set(p, [...(byProp.get(p) ?? []), m]);
const byFn = new Map(Object.entries(FUNCTIONS).map(([m, f]) => [f, m]));
const byPseudo = new Map(Object.entries(PSEUDOS).map(([m, c]) => [c.text.slice(1), m]));
const CONDITION = {
  media: "media",
  container: "container",
  supports: "supports",
  keyframes: "keyframes",
};
const membersOf = (g: Group) => {
  const out: string[] = [];
  for (const p of g.props) out.push(...(byProp.get(p) ?? []));
  for (const f of g.fns) if (byFn.has(f)) out.push(byFn.get(f)!);
  for (const s of g.sels) if (byPseudo.has(s)) out.push(byPseudo.get(s)!);
  for (const [a, m] of Object.entries(CONDITION)) if (g.at.has(a)) out.push(m);
  if (g.at.has("position-try") && g.props.has("position-try")) out.push("positionTry");
  return [...new Set(out)].sort();
};
const list = (s: Iterable<string>) => [...s].sort().join(" ");
const sorted = <T>(m: Map<string, T>) => [...m].sort(([a], [b]) => (a < b ? -1 : 1));

const data = [...groups].map(([id, { kind, title, g }]) => {
  const kw = sorted(g.kw).map(([p, ws]) => `${JSON.stringify(p)}: ${JSON.stringify(list(ws))}`);
  return `  ${JSON.stringify(id)}: {
    kind: ${JSON.stringify(kind)},
    title: ${JSON.stringify(title)},
    members: ${JSON.stringify(membersOf(g).join(" "))},
    ban: {
      kw: { ${kw.join(", ")} },
      fn: ${JSON.stringify(list(g.fn))},
      unit: ${JSON.stringify(list(g.unit))},
      media: ${JSON.stringify(list(g.media))},
      container: ${JSON.stringify(list(g.container))},
      supports: ${JSON.stringify(list(g.supports))},
    },
  },`;
});
const sources = `web-features ${version("web-features")}, @webref/css ${version("webref-specs")}, @mdn/browser-compat-data ${version("@mdn/browser-compat-data")}`;
writeFileSync(
  `${here}/../src/groups-data.ts`,
  `// Generated by scripts/groups.ts from ${sources}. Do not edit.
// The export groups (docs/research/groups.md): the members of each (space-separated names) and the tokens it bans.
export interface GroupData {
  kind: "baseline" | "spec";
  title: string;
  members: string;
  ban: {
    kw: Record<string, string>;
    fn: string;
    unit: string;
    media: string;
    container: string;
    supports: string;
  };
}
export const groups = {
${data.join("\n")}
} satisfies Record<string, GroupData>;
`,
);

// ---- the declarations of each subpath
const lit = (s: string[]) => (s.length ? s.map((x) => JSON.stringify(x)).join(" | ") : "never");
// A with-downstream group has the members of its Baseline group but a few, and a few more banned words. Where a member is
// typed by the same bans in both (the same functions and units, and for its own part the same keywords or query words),
// the group re-exports the member of the Baseline group instead of declaring it again: names, not declarations. Such a
// member says "is not in cssints/<the Baseline group>" for a token that both ban, which is true of both.
const dep = (g: Group, m: string, p?: string) =>
  p
    ? list(g.kw.get(p) ?? [])
    : m === "media" || m === "container" || m === "supports"
      ? list(g[m])
      : "";
const decl = (id: string, g: Group, title: string, base?: { id: string; g: Group }) => {
  const up = "../".repeat(id.split("/").length);
  const names = new Set(membersOf(g));
  const kw = sorted(g.kw)
    .map(([p, ws]) => `${JSON.stringify(p)}: ${lit([...ws].sort())}`)
    .join("; ");
  const same = base && list(g.fn) === list(base.g.fn) && list(g.unit) === list(base.g.unit);
  const lines: string[] = [];
  const reused: string[] = [];
  const add = (m: string, text: string, p?: string) =>
    same && membersOf(base.g).includes(m) && dep(g, m, p) === dep(base.g, m, p)
      ? reused.push(m)
      : lines.push(text);
  for (const [m, p] of Object.entries(PROPS).sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (!names.has(m) || BUILDERS.has(m) || m === "positionTry") continue;
    add(m, `export declare const ${m}: P<${JSON.stringify(p)}>;`, p);
  }
  for (const m of [...names].filter((n) => n in PSEUDOS).sort())
    add(m, `export declare const ${m}: StateWrap;`);
  for (const m of [...names].filter((n) => n in FUNCTIONS).sort()) {
    const f = FUNCTIONS[m]!;
    const { sep, math } = functions[f as keyof typeof functions] as { sep: string; math?: string };
    const type = math
      ? `GMath<B, ${JSON.stringify(math)}>`
      : f === "var"
        ? "VarCall"
        : `GFn<B, ${JSON.stringify(f)}, ${JSON.stringify(sep)}>`;
    add(
      m,
      m === "var"
        ? `declare const _var: ${type};\nexport { _var as var };`
        : `export declare const ${m}: ${type};`,
    );
  }
  for (const m of ["media", "container", "supports"])
    if (names.has(m))
      add(
        m,
        `export declare const ${m}: GCondition<B, ${JSON.stringify(m)}, ${m === "supports" ? "Wrap" : "QueryWrap"}>;`,
      );
  if (names.has("keyframes")) lines.push(`export { keyframes } from "${up}types.ts";`);
  if (names.has("positionTry"))
    add(
      "positionTry",
      `export declare const positionTry: ((style: Style) => PositionTry) & P<"position-try">;`,
      "position-try",
    );
  for (const c of ["flex", "grid"]) {
    if (!g.props.has(c)) continue;
    const M = c === "flex" ? "FlexMethods" : "GridMethods";
    const own = chainNames(c).filter((_, i) => g.props.has(CONTEXTS[c]![i]!));
    lines.push(
      `export declare const ${c}: GLayout<B, ${JSON.stringify(c)}, Pick<${M}, ${lit(own)}>>;`,
    );
  }
  if (reused.length) lines.push(`export { ${reused.join(", ")} } from "../${base!.id}.ts";`);
  const ban = `{ id: ${JSON.stringify(id)}; kw: ${kw ? `{ ${kw} }` : "Record<never, never>"}; fn: ${lit([...g.fn].sort())}; unit: ${lit([...g.unit].sort())}; media: ${lit([...g.media].sort())}; container: ${lit([...g.container].sort())}; supports: ${lit([...g.supports].sort())} }`;
  const body = lines.join("\n");
  const has = (n: string) => new RegExp(`\\b${n}\\b`).test(body);
  const withP = has("P"); // P is declared for the properties, and GProp with it
  const used = (n: string) => has(n) || (n === "GProp" && withP);
  // only what the file uses: a generated file is linted like any other
  const from = (file: string, names: string[]) =>
    names.some(used)
      ? `import type { ${names.filter(used).join(", ")} } from "${up}${file}";\n`
      : "";
  const hasB = withP || /<B,/.test(body);
  return `// Generated by scripts/groups.ts from ${sources}. Do not edit.
// cssints/${id}: ${title}.
${from("members.ts", ["FlexMethods", "GridMethods"])}${from("group-types.ts", ["GCondition", "GFn", "GLayout", "GMath", "GProp"])}${withP ? 'import type { properties } from "@cssints/css-grammar/mdn";\n' : ""}${from("function-types.ts", ["VarCall"])}${from("types.ts", ["PositionTry", "QueryWrap", "StateWrap", "Style", "Wrap"])}
export * from "${up}group-common.ts";
${hasB ? `\ntype B = ${ban};\n` : ""}${withP ? "type P<K extends keyof typeof properties> = GProp<B, K>;\n" : ""}
${body}
`;
};
// A Baseline group with the same members and bans as an earlier one (Baseline 2026 is newly available) is that group.
const twin = new Map<string, string>();
const aliasOf = (id: string, g: Group) => {
  if (groups.get(id)!.kind !== "baseline") return undefined;
  const key = JSON.stringify([
    membersOf(g),
    sorted(g.kw).map(([p, ws]) => [p, list(ws)]),
    ...[g.fn, g.unit, g.media, g.container, g.supports].map(list),
  ]);
  const first = twin.get(key) ?? twin.set(key, id).get(key)!;
  return first === id ? undefined : first;
};
rmSync(`${here}/../src/groups`, { recursive: true, force: true });
mkdirSync(`${here}/../src/groups`);
for (const [id, { title, g }] of groups) {
  mkdirSync(`${here}/../src/groups/${id}`.replace(/\/[^/]*$/, ""), { recursive: true });
  const alias = aliasOf(id, g);
  const down = id.endsWith("/with-downstream")
    ? groups.get(id.replace("/with-downstream", ""))
    : undefined;
  writeFileSync(
    `${here}/../src/groups/${id}.ts`,
    alias
      ? `// Generated by scripts/groups.ts. Do not edit.\n// cssints/${id}: ${title}; the same members and bans as cssints/${alias}.\nexport * from "${"../".repeat(id.split("/").length - 1) || "./"}${alias}.ts";\n`
      : decl(id, g, title, down && { id: id.replace("/with-downstream", ""), g: down.g }),
  );
}
// the whole of cssints, by its Baseline name
writeFileSync(
  `${here}/../src/groups/limited-availability.ts`,
  `// Generated by scripts/groups.ts. Do not edit.\n// cssints/limited-availability: everything, Baseline limited availability and up: the members of "cssints" itself.\nexport * from "../types.ts";\n`,
);
console.log(
  `groups: ${groups.size} (${[...groups.values()].filter((x) => x.kind === "spec").length} specs); ` +
    [...groups]
      .slice(0, 3)
      .map(
        ([id, { g }]) =>
          `${id} ${membersOf(g).length} members, ${g.fn.size} fns, ${g.unit.size} units, ${g.kw.size} props with banned words`,
      )
      .join("; "),
);
