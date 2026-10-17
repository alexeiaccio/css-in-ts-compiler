// Browser support from @mdn/browser-compat-data against browserslist targets. Warnings, never errors: the value
// is valid CSS, some target browsers just drop it.
//
// Lookup, per declaration `p: v`:
//   - the property itself:  css.properties.<p>
//   - each keyword k:       css.properties.<P>.<k>, else css.types.<T>.<k>
//   - each function f(...): css.properties.<P>.<f>_function, else css.properties.<P>.<f> (BCD names some functions
//                           without the suffix: counter-reset.reversed), else css.types.<f>, else css.types.<T>.<f>
//   - a quoted string:      css.properties.<P>.string (text-overflow)
//   - `from` of a relative colour: css.types.color.<f>.relative_syntax, f the function it opens (a syntax shape in BCD)
// where P is p, then the properties its grammar reaches as <'q'> (flex-basis: fit-content() is under width), and
// T ranges over the <type>s the grammar reaches (so `scroll` in `overflow` is not mistaken for
// css.types.timeline-range-name.scroll). Tokens inside strings are ignored; units are not looked up.
//
// Targets where the property itself is unsupported get the property warning only: the values add nothing there.
//
// Support, per target browser version (browserslist agent mapped to a BCD browser):
//   - some statement counts: no `prefix`, no `alternative_name`, no `flags` (we emit the plain standard form);
//     `partial_implementation` counts as supported, unless the caller asks for `exact` (`lacking()`, for a kernel that
//     needs the whole feature: relative colour in Chrome 119-121 and Safari 16.4-17.6 has other channel scales).
//   - version_added "N" or "≤N" <= target, and version_removed absent or > target. "preview" is not released.
//   - `false` is unsupported. BCD 8 has no `true`/`null` any more; if they appear, `true` counts and `null`
//     (unknown) does not warn. A browser missing from the support block is unknown and does not warn.
//   - range targets like "ios_saf 18.5-18.7" become their lower bound. Agents BCD does not track (op_mini, kaios,
//     and_qq, and_uc) are skipped.
import type {
  BrowserName,
  CompatData,
  Identifier,
  SupportStatement,
} from "@mdn/browser-compat-data";
import { Effect } from "effect";

import { browsers as listBrowsers } from "./browsers.ts";
import type { BrowsersError } from "./errors.ts";
import { properties, syntaxes } from "./mdn.ts";

// require, not import: see browsers.ts.
const bcd = process.getBuiltinModule("node:module").createRequire(import.meta.url)(
  "@mdn/browser-compat-data",
) as CompatData;
const props: Record<string, string> = properties;
const syns: Record<string, string> = syntaxes;

const BCD_NAME: Record<string, BrowserName> = {
  chrome: "chrome",
  and_chr: "chrome_android",
  edge: "edge",
  firefox: "firefox",
  and_ff: "firefox_android",
  safari: "safari",
  ios_saf: "safari_ios",
  opera: "opera",
  op_mob: "opera_android",
  samsung: "samsunginternet_android",
  android: "webview_android",
  ie: "ie",
};

export type Target = [agent: string, version: string];
// `path`: where the browserslist config is looked up from, without a query (browsers.ts).
export const targets = Effect.fn("support.targets")(function* (
  query?: string,
  path?: string,
): Effect.fn.Return<Target[], BrowsersError> {
  const list = yield* listBrowsers(query, path);
  return list
    .map((t) => [t.split(" ")[0]!, t.split(" ")[1]!.split("-")[0]!] as Target)
    .filter(([a]) => BCD_NAME[a]);
});
// Module init is the boundary: the targets of process.cwd() are fixed for the process, like the BCD require above.
const DEFAULT = Effect.runSync(targets());

declare global {
  // oxlint-disable-next-line no-var -- an ambient declaration of a property of globalThis, not a variable
  var __cssintsTargets: Target[] | undefined;
}
// The default of every function below: the targets of the build in progress, else those of process.cwd(). On
// globalThis, as cssints' registry: the Vite Module Runner evaluates its own copy of this module.
const current = () => globalThis.__cssintsTargets ?? DEFAULT;
/**
 * Sets the targets the functions here default to (cssints: those of the Vite root, before each evaluation).
 * @param {Target[] | undefined} ts the targets, or `undefined` for those of process.cwd()
 */
export const useTargets = (ts: Target[] | undefined): void => {
  globalThis.__cssintsTargets = ts;
};

const cmp = (a: string, b: string) => {
  const x = a.replace("≤", "").split("."),
    y = b.split(".");
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = Number(x[i] ?? 0) - Number(y[i] ?? 0);
    if (d) return d;
  }
  return 0;
};

function supports(s: SupportStatement | undefined, v: string, exact = false): boolean {
  if (!s) return true;
  return [s].flat().some((x) => {
    if (x.prefix || x.alternative_name || x.flags || (exact && x.partial_implementation))
      return false;
    const added = x.version_added;
    if (typeof added !== "string") return added !== false;
    if (added === "preview" || cmp(added, v) > 0) return false;
    return !(typeof x.version_removed === "string" && cmp(x.version_removed, v) <= 0);
  });
}

// every <type> name reachable from a grammar, without "()", and every <'property'> as "'property". A <declaration>
// (style() and supports() conditions, which <color> reaches through if()) is any property: not a place to look for one.
function reach(syntax: string, seen = new Set<string>()): Set<string> {
  for (const [, q, n] of syntax.matchAll(/<('?)([a-z-]+)(?:\(\))?'?(?: \[[^\]]*\])?>/g)) {
    if (seen.has(q! + n!) || (!q && n === "declaration")) continue;
    seen.add(q! + n!);
    const g = q ? props[n!] : (syns[n!] ?? syns[`${n}()`]);
    if (g) reach(g, seen);
  }
  return seen;
}

const bcdGet = (key: string) =>
  key
    .split(".")
    .reduce<Identifier | undefined>(
      (n, k) => n?.[k] ?? n?.[k.toLowerCase()],
      bcd as unknown as Identifier,
    );

// The CSSWG adopted mesh-gradient() and freeform-gradient() on 2026-10-14; BCD has no entry yet
// (docs/research/2d-gradients.md). Until a browser ships them, every target lacks them: a fallback that `get` reads
// only where BCD has no node, so the entries go as soon as BCD has the keys.
const absent = (description: string) =>
  ({
    __compat: {
      description,
      support: Object.fromEntries(
        [
          "chrome",
          "chrome_android",
          "edge",
          "firefox",
          "firefox_android",
          "safari",
          "safari_ios",
          "opera",
          "opera_android",
          "samsunginternet_android",
          "webview_android",
        ].map((b) => [b, { version_added: false }]),
      ),
    },
  }) as Identifier;
const OWN = new Map<string, Identifier>([
  ["css.types.gradient.mesh-gradient", absent("mesh-gradient()")],
  ["css.types.gradient.freeform-gradient", absent("freeform-gradient()")],
]);

export const get = (key: string) => bcdGet(key) ?? OWN.get(key);

export interface Warning {
  feature: string;
  key: string;
  lacking: string[];
}

type Compat = NonNullable<Identifier["__compat"]>;
const lacks = (c: Compat, on: Target[], exact = false) =>
  on.filter(([a, ver]) => !supports(c.support[BCD_NAME[a]!], ver, exact));

// The targets that lack a BCD feature (`css.at-rules.property`), by the same rules as the warnings: no prefix, no
// flags, `partial_implementation` counts unless `exact`. A key BCD does not know lacks nothing.
export const lackingOf = (key: string, ts: Target[] = current(), exact = false): Target[] => {
  const c = get(key)?.__compat;
  return c ? lacks(c, ts, exact) : [];
};

// Next to `support`: for a plugin's `requires`.
export const lacking = Effect.fnUntraced(function* (
  key: string,
  ts: Target[] = current(),
  exact: boolean = false,
): Effect.fn.Return<Target[]> {
  return yield* Effect.sync(() => lackingOf(key, ts, exact));
});

// What a property's grammar reaches depends on the property only, and walking it is the cost of a call (a grammar like
// `background` reaches hundreds of types): once per property.
const reached = new Map<string, [types: string[], owners: string[]]>();
const reachOf = (p: string) => {
  let r = reached.get(p);
  if (!r) {
    const all = [...reach(props[p] ?? "")];
    r = [
      all.filter((t) => get(`css.types.${t}`)),
      [p, ...all.filter((q) => q.startsWith("'")).map((q) => q.slice(1))],
    ];
    reached.set(p, r);
  }
  return r;
};

const tokenKeys = (owners: string[], types: string[], k: string, fn: boolean) => [
  ...owners.map((q) => `css.properties.${q}.${fn ? `${k}_function` : k}`),
  ...(fn ? owners.map((q) => `css.properties.${q}.${k}`) : []),
  ...(fn ? [`css.types.${k}`] : []),
  ...types.map((t) => `css.types.${t}.${k}`),
];
/**
 * The BCD key of a keyword or function in a value of a property, by the lookup above.
 * @param {string} p the property
 * @param {string} k the keyword, or the name of the function
 * @param {boolean} fn whether `k` is a function
 * @returns {string | undefined} the key, or `undefined` when BCD has none
 */
export const tokenKey = (p: string, k: string, fn: boolean) => {
  const [types, owners] = reachOf(p);
  return tokenKeys(owners, types, k, fn).find((x) => get(x)?.__compat);
};

// The answer for a list of targets is a function of `p: v`, and a build asks the same declarations again (every
// evaluation of a module that imports the theme): once per declaration and list. Callers read the warnings, none
// changes them.
const known = new WeakMap<Target[], Map<string, Warning[]>>();
export function supportOf(p: string, v: string, ts: Target[] = current()): Warning[] {
  let byDecl = known.get(ts);
  if (!byDecl) known.set(ts, (byDecl = new Map<string, Warning[]>()));
  const key = `${p}\0${v}`;
  let out = byDecl.get(key);
  if (!out) byDecl.set(key, (out = compute(p, v, ts)));
  return out;
}

// Plain core, also called by check.ts (one boundary per declaration).
function compute(p: string, v: string, ts: Target[]): Warning[] {
  const pc = get(`css.properties.${p}`)?.__compat;
  if (!pc) return [];
  const [types, owners] = reachOf(p);
  const found: [feature: string, key: string][] = [];
  const code = v.replace(/"[^"]*"|'[^']*'/g, "");
  for (const { 0: tok, 1: fn, index } of code.matchAll(/(?<![\w.#-])-?[A-Za-z_][\w-]*(\()?/g)) {
    const k = fn ? tok.slice(0, -1) : tok;
    // relative colour: BCD has it as a syntax shape, css.types.color.<fn>.relative_syntax; its token is `from`
    const rel = tok === "from" ? /([a-z-]+)\(\s*$/.exec(code.slice(0, index))?.[1] : undefined;
    const keys = rel
      ? [`css.types.color.${rel}.relative_syntax`]
      : tokenKeys(owners, types, k, !!fn);
    const key = keys.find((x) => get(x)?.__compat);
    if (key) found.push([fn ? `${k}()` : k, key]);
  }
  if (/"[^"]*"|'[^']*'/.test(v)) {
    const key = owners.map((q) => `css.properties.${q}.string`).find((x) => get(x)?.__compat);
    if (key) found.push(["string", key]);
  }
  const off = lacks(pc, ts).map((t) => t.join(" "));
  const out: Warning[] = off.length
    ? [{ feature: p, key: `css.properties.${p}`, lacking: off }]
    : [];
  const on = ts.filter((t) => !off.includes(t.join(" ")));
  for (const [feature, key] of found) {
    const c = get(key)?.__compat;
    if (!c || out.some((w) => w.key === key)) continue;
    const lacking = lacks(c, on).map((t) => t.join(" "));
    if (lacking.length) out.push({ feature, key, lacking });
  }
  return out;
}

// "chrome 154, chrome 153, edge 152" -> "chrome 153-154, edge 152"
export function browsers(lacking: string[]): string {
  const by = new Map<string, string[]>();
  for (const t of lacking) {
    const [a, ver] = t.split(" ") as [string, string];
    by.set(a, [...(by.get(a) ?? []), ver]);
  }
  return [...by]
    .map(([a, vs]) => {
      vs.sort(cmp);
      return vs.length === 1 ? `${a} ${vs[0]}` : `${a} ${vs[0]}-${vs.at(-1)}`;
    })
    .join(", ");
}

// Once per declaration that has not been seen yet: fnUntraced, like `valid` in twin.ts.
export const support = Effect.fnUntraced(function* (
  p: string,
  v: string,
  ts: Target[] = current(),
): Effect.fn.Return<Warning[]> {
  return yield* Effect.sync(() => supportOf(p, v, ts));
});

// Plain core, also called by cssints classesOf (see check.ts).
export const messageOf = (p: string, v: string, w: Warning) =>
  `${p}: ${w.feature === p ? "the property" : `"${w.feature}"`} in "${v}" is not supported by ${browsers(w.lacking)} (${w.key})`;

export const message = Effect.fn("support.message")(function* (
  p: string,
  v: string,
  w: Warning,
): Effect.fn.Return<string> {
  return yield* Effect.sync(() => messageOf(p, v, w));
});
