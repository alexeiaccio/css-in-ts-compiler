// node diff-support.ts — the "twin accepts, Chrome rejects" rows of diff.ts (same samples, seed and N), split by
// what explains them now: a known upstream issue (KNOWN), a support warning that names the Chrome version under
// test, a prose rule, or nothing.
// Also lists the reverse: warnings or rule errors on values Chrome accepts.
import * as fc from "fast-check";
import { chromium } from "playwright-core";

import { arbFor } from "./gen.ts";
import { properties, syntaxes } from "../src/mdn.ts";
import { checkRules, matches, support } from "./sync.ts";

const SEED = Number(process.env.SEED ?? 42);
const N = Number(process.env.N ?? 20);
const props: Record<string, string> = properties;
const syns: Record<string, string> = syntaxes;

// same cases as diff.ts step 2
const cases: { p: string; v: string; kind: string }[] = [];
for (const p of Object.keys(props)) {
  const a = arbFor(p);
  if (!a) continue;
  fc.sample(a, { seed: SEED, numRuns: N }).forEach((v, i) => {
    cases.push({ p, v, kind: "gen" });
    const t = v.split(" ");
    const j = i % t.length;
    const mut = [
      [...t.slice(0, j), ...t.slice(j + 1)],
      [...t.slice(0, j + 1), ...t.slice(j)],
      t.length > 1 ? [...t.slice(1), t[0]] : [...t, t[0]],
    ][i % 3]!.join(" ");
    if (mut && mut !== v) cases.push({ p, v: mut, kind: "mut" });
  });
}

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
const chrome: boolean[] = await page.evaluate(
  (cs) => cs.map(([p, v]) => CSS.supports(p, v)),
  cases.map((c) => [c.p, c.v] as [string, string]),
);
const major = browser.version().split(".")[0];
await browser.close();

// Known disagreements that are not ours to fix; the support lookup gets no overrides for them. Every entry names the
// upstream cause. A test that also matches values Chrome accepts shows up below as "chrome accepts, but known".
const negBlur = (v: string) =>
  v.split(",").some((s) =>
    s
      .split(/\s+/)
      .filter((t) => matches("<length>", t))[2]
      ?.startsWith("-"),
  );
const negative = (v: string) => /(^|[\s,])-\.?\d/.test(v);
const LINEAR = /linear\([^,()]*\)/;
const KNOWN: [p: string | (string | RegExp)[], test: (v: string) => boolean, why: string][] = [
  [
    "display",
    (v) => /\b(run-in|inline-list-item)\b/.test(v),
    "BCD gap: css.properties.display has no run-in / inline-list-item entry, and no engine ships them",
  ],
  [
    ["align-items", "justify-items", "place-items"],
    (v) => v.includes("anchor-center"),
    "mdn-data and BCD bug: css-anchor-position-1 §4.2 adds anchor-center to justify-self and align-self only",
  ],
  [
    "box-shadow",
    negBlur,
    "range lost: webref's <shadow> blur is <length [0,∞]>, mdn-data's <length>{2,4} has no place for it",
  ],
  [
    ["transition", "transition-timing-function", "animation", "animation-timing-function"],
    (v) => LINEAR.test(v),
    "spec gap: css-easing-2 allows linear() with one stop, Chrome and WPT (linear-timing-functions-syntax.html) need two",
  ],
  // ---- the property is not in Chrome, and BCD has no entry that support.ts could warn with
  [
    [
      "caret",
      "mask-border-mode",
      "image-resolution",
      "initial-letter-align",
      "line-height-step",
      "ruby-merge",
    ],
    () => true,
    "BCD gap: no css.properties entry, and Chrome 154 does not know the property",
  ],
  [
    [
      "timeline-trigger-range",
      "timeline-trigger-range-start",
      "timeline-trigger-range-end",
      "timeline-trigger-exit-range",
      "timeline-trigger-exit-range-start",
      "timeline-trigger-exit-range-end",
    ],
    () => true,
    "mdn-data is stale: the longhands were renamed -activation-range and -active-range (webref), Chrome knows neither name",
  ],
  // ---- mdn-data grammar that is wider than the spec or than what ships
  [
    "column-rule-width",
    (v) => !matches("<line-width>", v),
    "mdn-data: <'border-width'> takes one to four values, css-gap-decorations <line-width> one (Chrome 154 has no lists)",
  ],
  [
    "column-rule-style",
    (v) => !matches("<line-style>", v),
    "mdn-data: <'border-style'> takes one to four values, css-gap-decorations <line-style> one",
  ],
  [
    "column-rule",
    (v) => !matches("<line-width> || <line-style> || <color>", v),
    "mdn-data: the longhands' <'border-width'> and <'border-style'> take one to four values, the spec one",
  ],
  [
    "zoom",
    (v) => !matches("normal | reset | <number [0,∞]> | <percentage [0,∞]>", v),
    "mdn-data: `<number> || <percentage>`, css-viewport (webref) `<number> | <percentage>`",
  ],
  [
    "transform-origin",
    (v) =>
      !matches(
        "[ left | center | right | top | bottom | <length-percentage> ] | [ left | center | right | <length-percentage> ] [ top | center | bottom | <length-percentage> ] <length>? | [ [ center | left | right ] && [ center | top | bottom ] ] <length>?",
        v,
      ),
    "mdn-data: the `&&` form takes a horizontal or vertical part in either place, css-transforms-1 (webref) fixes the order",
  ],
  [
    "outline-color",
    (v) => !matches("<color>", v),
    "mdn-data: outline-color still lists `auto`, which css-ui-4 removed (webref: <'border-top-color'>) and no engine ships",
  ],
  [
    "outline",
    (v) => !matches("<'outline-width'> || <'outline-style'> || <color>", v),
    "mdn-data: outline-color still lists `auto`, which css-ui-4 removed (webref: <'border-top-color'>) and no engine ships",
  ],
  [
    "image-orientation",
    (v) => !matches("from-image | none", v),
    "mdn-data has the css-images-3 grammar (<angle>, flip) that Chrome never shipped; css-images-4: from-image | none",
  ],
  [
    "tab-size",
    negative,
    "mdn-data: <integer> | <length>, css-text-4 (webref): <number [0,∞]> | <length [0,∞]>",
  ],
  [
    ["-webkit-text-stroke", "-webkit-text-stroke-width"],
    negative,
    "mdn-data: <'border-width'> / <length> without the range, compat (webref): <line-width> with [0,∞]",
  ],
  [
    "mask",
    (v) => v.includes("margin-box"),
    "mdn-data: <geometry-box> takes margin-box, css-masking-1 <coord-box> does not (BCD mask-clip has no margin-box)",
  ],
  [
    ["position-try", "position-try-fallbacks"],
    (v) => v.includes(",") && /(^|,)\s*(?:\S+\s+)?none\s*(?=,|$)/.test(v),
    "mdn-data: <'position-area'> is the property, which takes none; the spec type <position-area> does not",
  ],
  [
    ["animation-trigger"],
    (v) => v.split(",").some((i) => (i.match(/--[\w-]+/g) ?? []).length > 1),
    "spec newer than Chrome 154: `[ <dashed-ident> <animation-action>+ ]+` repeats in one item, Chrome takes one",
  ],
  [
    [
      "background-image",
      "border-image-source",
      "list-style-image",
      "mask-image",
      "mask",
      "shape-outside",
      "content",
    ],
    (v) => v.includes("image-set(") && /(^|\s)-\.?\d[\d.]*(dpi|dpcm|dppx|x)\b/.test(v),
    "range gap: <image-set-option> has no [0,∞] on <resolution> in mdn-data or webref; Chrome rejects it (WPT css-images/image-set/image-set-negative-resolution-rendering.html)",
  ],
  // ---- grammar as written differs from its intent, or from Chrome
  [
    [
      "top",
      "right",
      "bottom",
      "left",
      "inset",
      "inset-block",
      "inset-inline",
      /^inset-(block|inline)-(start|end)$/,
    ],
    (v) => /anchor\([^)]*,[^)]*--/.test(v),
    "css-anchor-position-1: `<anchor-name>? && <anchor-side>, <length-percentage>?` binds && looser than the comma, so the name may follow the fallback; the text and Chrome put it first",
  ],
  [
    ["scroll-timeline"],
    (v) => !matches("[ [ none | <dashed-ident> ] <axis>? ]#", v),
    "css-scroll-animations-1: the shorthand reuses <'scroll-timeline-axis'>, a list, so commas nest; each item takes one axis",
  ],
  [
    ["view-timeline"],
    (v) =>
      !matches(
        "[ [ none | <dashed-ident> ] [ <axis> || [ auto | <length-percentage> ]{1,2} ]? ]#",
        v,
      ),
    "css-scroll-animations-1: the shorthand reuses <'view-timeline-axis'> and <'view-timeline-inset'>, lists, so commas nest",
  ],
  [
    ["timeline-trigger"],
    (v) => /(^|,)\s*none\s+\S/.test(v),
    "css-animations-2: the shorthand reuses <'timeline-trigger-name'>, which takes none; a shorthand item cannot start with none",
  ],
  [
    ["animation-timeline", "timeline-trigger-source"],
    (v) => /view\([^)]*,/.test(v),
    "css-scroll-animations-1: view() reuses <'view-timeline-inset'>, a list, so its arguments may contain commas; Chrome takes one",
  ],
  [
    "animation",
    (v) =>
      v.split(/,(?![^()]*\))/).some((item) => {
        const t: string[] = item.match(/[\w-]+\([^)]*\)|\S+/g) ?? [];
        const claimed = (x: string) =>
          matches(
            "<time> | auto | none | <easing-function> | <single-animation-iteration-count> | <single-animation-direction> | <single-animation-fill-mode> | <single-animation-play-state>",
            x,
          );
        const time = t.findIndex((x) => matches("<time>", x));
        return time >= 0 && t.indexOf("auto", time) > time && t.some((x) => !claimed(x));
      }),
    "Chrome's animation shorthand has no timeline, so an auto after the first <time> (the duration, css-animations-1 §3) is the name, and a second name is one too many",
  ],
  [
    "animation",
    (v) =>
      !matches(
        `[ ${syns["single-animation"]!.replace(" || <single-animation-timeline>", "")} ]#`,
        v,
      ),
    "Chrome's animation shorthand only resets animation-timeline (BCD animation.animation-timeline_included, partial): no scroll(), view(), dashed-ident or second auto or none",
  ],
  [
    ["dynamic-range-limit"],
    (v) => /[(,]\s*[\d.]+%\s+[a-z]/.test(v),
    "Chrome takes `<limit> <percentage>` only, the spec `&&` takes either order",
  ],
  [
    ["font-palette"],
    (v) => /palette-mix\(\s*in\s+--/.test(v),
    "Chrome does not implement custom color spaces (@color-profile): CSS.supports('color', 'color-mix(in --x, red, blue)') is false",
  ],
  [
    "overflow-clip-margin",
    (v) => /^\s*0(\s|$)/.test(v),
    "Chrome bug: overflow-clip-margin rejects a leading unitless 0, css-overflow-4 says <length>",
  ],
  [
    ["interest-delay", "interest-delay-start", "interest-delay-end"],
    negative,
    "range gap: `normal | <time>` has no [0s,∞] in mdn-data or webref, Chrome rejects negative times",
  ],
  [
    "text-box-edge",
    (v) => /^\s*(cap|ex|ideographic)\s*$/.test(v),
    "Chrome 154 rejects a lone cap, ex or ideographic, css-inline-3 <text-edge> makes the second keyword optional",
  ],
  // ---- BCD has no sub-feature for the value, so support.ts cannot see that Chrome lacks it
  [
    "stroke-linejoin",
    (v) => /\b(arcs|miter-clip)\b/.test(v),
    "BCD gap: stroke-linejoin lists bevel, miter, round only",
  ],
  [
    "vector-effect",
    (v) => /non-rotation|fixed-position|non-scaling-size/.test(v),
    "BCD gap: vector-effect lists none and non-scaling-stroke only",
  ],
  [
    ["break-inside", "break-before", "break-after"],
    (v) => /region/.test(v),
    "BCD gap: no region entries, and Chrome has no regions",
  ],
  [
    "text-combine-upright",
    (v) => v.includes("digits"),
    "BCD gap: text-combine-upright lists all and none only",
  ],
  [
    "text-autospace",
    (v) => /\breplace\b/.test(v),
    "BCD gap: text-autospace lists insert (not shipped) but not replace",
  ],
  [
    "ruby-position",
    (v) => /inter-character|alternate/.test(v),
    "BCD gap: no ruby-position value entries; Chrome 154 takes over and under only",
  ],
  [
    "text-overflow",
    (v) => !matches("clip | ellipsis | <string>", v),
    "BCD css.properties.text-overflow.two_value_syntax is a syntax shape, support.ts looks up tokens",
  ],
  [
    [
      "background",
      "background-image",
      "border-image-source",
      "content",
      "list-style-image",
      "mask",
      "mask-image",
      "shape-outside",
    ],
    (v) => /(?<![-\w])paint\(/.test(v),
    "Chrome's CSS.supports rejects paint() (no worklet registered), BCD css.types.image.paint says Chrome 65",
  ],
  [
    [
      "background",
      "background-image",
      "border-image-source",
      "content",
      "list-style-image",
      "mask",
      "mask-image",
      "shape-outside",
    ],
    (v) => /(?<![-\w])image\((?!\s*[a-z]+\))/i.test(v),
    "BCD gap: no css.types.image.image entry; Chrome 154 rejects image() with a source or a direction",
  ],
];

const why = (p: string, v: string) => {
  const k = KNOWN.find(
    ([q, test]) => [q].flat().some((x) => (typeof x === "string" ? x === p : x.test(p))) && test(v),
  );
  if (k) return `known: ${k[2]}`;
  try {
    checkRules(p, v);
  } catch {
    return "prose rule";
  }
  return support(p, v).some((w) => w.lacking.includes(`chrome ${major}`))
    ? "support warning"
    : "unexplained";
};

const groups = new Map<string, string[]>();
cases.forEach((c, i) => {
  if (!matches(props[c.p]!, c.v)) return;
  const w = why(c.p, c.v);
  const key = chrome[i]
    ? w === "unexplained"
      ? null
      : `chrome accepts, but ${w}`
    : `twin accepts, chrome rejects: ${w}`;
  if (key)
    groups.set(key, [...(groups.get(key) ?? []), `${c.kind} ${c.p}: ${JSON.stringify(c.v)}`]);
});
const rejected = [...groups]
  .filter(([k]) => k.startsWith("twin"))
  .reduce((n, [, xs]) => n + xs.length, 0);
console.log(`# twin accepts, Chrome ${major} rejects: ${rejected} rows`);
for (const [k, xs] of [...groups].sort()) {
  console.log(`\n## ${k}: ${xs.length}`);
  xs.forEach((x) => console.log(`  ${x}`));
}
