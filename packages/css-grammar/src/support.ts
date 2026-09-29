// Browser support from @mdn/browser-compat-data against browserslist targets. Warnings, never errors: the value
// is valid CSS, some target browsers just drop it.
//
// Lookup, per declaration `p: v`:
//   - the property itself:  css.properties.<p>
//   - each keyword k:       css.properties.<P>.<k>, else css.types.<T>.<k>
//   - each function f(...): css.properties.<P>.<f>_function, else css.types.<f>, else css.types.<T>.<f>
// where P is p, then the properties its grammar reaches as <'q'> (flex-basis: fit-content() is under width), and
// T ranges over the <type>s the grammar reaches (so `scroll` in `overflow` is not mistaken for
// css.types.timeline-range-name.scroll). Tokens inside strings are ignored; units are not looked up.
//
// Targets where the property itself is unsupported get the property warning only: the values add nothing there.
//
// Support, per target browser version (browserslist agent mapped to a BCD browser):
//   - some statement counts: no `prefix`, no `alternative_name`, no `flags` (we emit the plain standard form);
//     `partial_implementation` counts as supported.
//   - version_added "N" or "≤N" <= target, and version_removed absent or > target. "preview" is not released.
//   - `false` is unsupported. BCD 8 has no `true`/`null` any more; if they appear, `true` counts and `null`
//     (unknown) does not warn. A browser missing from the support block is unknown and does not warn.
//   - range targets like "ios_saf 18.5-18.7" become their lower bound. Agents BCD does not track (op_mini, kaios,
//     and_qq, and_uc) are skipped.
import type { BrowserName, CompatData, Identifier, SupportStatement } from "@mdn/browser-compat-data";

import { browsers as listBrowsers } from "./browsers.ts";
import { properties, syntaxes } from "./mdn.ts";

// require, not import: see browsers.ts.
const bcd: CompatData = process.getBuiltinModule("node:module").createRequire(import.meta.url)("@mdn/browser-compat-data");
const props: Record<string, string> = properties;
const syns: Record<string, string> = syntaxes;

const BCD_NAME: Record<string, BrowserName> = {
  chrome: "chrome", and_chr: "chrome_android", edge: "edge", firefox: "firefox", and_ff: "firefox_android",
  safari: "safari", ios_saf: "safari_ios", opera: "opera", op_mob: "opera_android",
  samsung: "samsunginternet_android", android: "webview_android", ie: "ie",
};

export type Target = [agent: string, version: string];
export const targets = (query?: string): Target[] =>
  listBrowsers(query).map((t) => [t.split(" ")[0]!, t.split(" ")[1]!.split("-")[0]!] as Target).filter(([a]) => BCD_NAME[a]);
const DEFAULT = targets();

const cmp = (a: string, b: string) => {
  const x = a.replace("≤", "").split("."), y = b.split(".");
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = Number(x[i] ?? 0) - Number(y[i] ?? 0);
    if (d) return d;
  }
  return 0;
};

function supports(s: SupportStatement | undefined, v: string): boolean {
  if (!s) return true;
  return [s].flat().some((x) => {
    if (x.prefix || x.alternative_name || x.flags) return false;
    const added = x.version_added;
    if (typeof added !== "string") return added !== false;
    if (added === "preview" || cmp(added, v) > 0) return false;
    return !(typeof x.version_removed === "string" && cmp(x.version_removed, v) <= 0);
  });
}

// every <type> name reachable from a grammar, without "()", and every <'property'> as "'property"
function reach(syntax: string, seen = new Set<string>()): Set<string> {
  for (const [, q, n] of syntax.matchAll(/<('?)([a-z-]+)(?:\(\))?'?(?: \[[^\]]*\])?>/g)) {
    if (seen.has(q + n)) continue;
    seen.add(q + n);
    const g = q ? props[n!] : (syns[n!] ?? syns[`${n}()`]);
    if (g) reach(g, seen);
  }
  return seen;
}

const get = (key: string) => key.split(".").reduce<Identifier | undefined>((n, k) => n?.[k] ?? n?.[k.toLowerCase()], bcd as unknown as Identifier);

export interface Warning {
  feature: string;
  key: string;
  lacking: string[];
}

export function support(p: string, v: string, ts: Target[] = DEFAULT): Warning[] {
  const pc = get(`css.properties.${p}`)?.__compat;
  if (!pc) return [];
  const reached = [...reach(props[p] ?? "")];
  const types = reached.filter((t) => get(`css.types.${t}`));
  const owners = [p, ...reached.filter((q) => q.startsWith("'")).map((q) => q.slice(1))];
  const found: [feature: string, key: string][] = [];
  for (const [tok, fn] of v.replace(/"[^"]*"|'[^']*'/g, "").matchAll(/(?<![\w.#-])-?[A-Za-z_][\w-]*(\()?/g)) {
    const k = fn ? tok.slice(0, -1) : tok;
    const keys = [...owners.map((q) => `css.properties.${q}.${fn ? `${k}_function` : k}`), ...(fn ? [`css.types.${k}`] : []), ...types.map((t) => `css.types.${t}.${k}`)];
    const key = keys.find((x) => get(x)?.__compat);
    if (key) found.push([fn ? `${k}()` : k, key]);
  }
  const lacks = (c: typeof pc, on: Target[]) => on.filter(([a, ver]) => !supports(c.support[BCD_NAME[a]!], ver)).map((t) => t.join(" "));
  const off = lacks(pc, ts);
  const out: Warning[] = off.length ? [{ feature: p, key: `css.properties.${p}`, lacking: off }] : [];
  const on = ts.filter((t) => !off.includes(t.join(" ")));
  for (const [feature, key] of found) {
    const c = get(key)?.__compat;
    if (!c || out.some((w) => w.key === key)) continue;
    const lacking = lacks(c, on);
    if (lacking.length) out.push({ feature, key, lacking });
  }
  return out;
}

// "chrome 154, chrome 153, edge 152" -> "chrome 153-154, edge 152"
function browsers(lacking: string[]): string {
  const by = new Map<string, string[]>();
  for (const t of lacking) {
    const [a, ver] = t.split(" ") as [string, string];
    by.set(a, [...(by.get(a) ?? []), ver]);
  }
  return [...by].map(([a, vs]) => {
    vs.sort(cmp);
    return vs.length === 1 ? `${a} ${vs[0]}` : `${a} ${vs[0]}-${vs.at(-1)}`;
  }).join(", ");
}

export const message = (p: string, v: string, w: Warning) =>
  `${p}: ${w.feature === p ? "the property" : `"${w.feature}"`} in "${v}" is not supported by ${browsers(w.lacking)} (${w.key})`;
