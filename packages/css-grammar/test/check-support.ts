// node check-support.ts — support warnings (defaults targets) and prose rules, both ways.
import { checkRules, lacking, message, support } from "./sync.ts";

let failed = false;
const verify = (ok: boolean, what: string) => {
  if (!ok) failed = true;
  console.log(`${ok ? "ok  " : "FAIL"} ${what}`);
};

const warns: [string, string, string | null][] = [
  ["text-transform", "full-width", "css.properties.text-transform.full-width"],
  ["width", "fit-content(10px)", "css.properties.width.fit-content_function"],
  ["align-items", "anchor-center", "css.properties.align-items.anchor-center"],
  ["flex-basis", "fit-content(10px)", "css.properties.width.fit-content_function"],
  ["text-overflow", '"…"', "css.properties.text-overflow.string"],
  ["counter-reset", "reversed(a)", "css.properties.counter-reset.reversed"],
  ["color", "rgb(from red r g b)", "css.types.color.rgb.relative_syntax"],
  ["color", "oklch(from var(--x) l c h)", "css.types.color.oklch.relative_syntax"],
  ["color", "contrast-color(red)", "css.types.color.contrast-color"],
  ["color", "if(else: red)", "css.types.if"],
  ["width", "round(up, 1px, 1px)", "css.types.round"],
  ["width", "mod(10px, 3px)", "css.types.mod"],
  ["width", "rem(10px, 3px)", "css.types.rem"],
  ["width", "abs(-1px)", "css.types.abs"],
  ["opacity", "sign(-3)", "css.types.sign"],
  ["opacity", "sin(30deg)", "css.types.sin"],
  ["opacity", "cos(1)", "css.types.cos"],
  ["opacity", "tan(1)", "css.types.tan"],
  ["transform", "rotate(asin(0.5))", "css.types.asin"],
  ["transform", "rotate(acos(0.5))", "css.types.acos"],
  ["transform", "rotate(atan(1))", "css.types.atan"],
  ["transform", "rotate(atan2(1px, 2px))", "css.types.atan2"],
  ["opacity", "pow(2, 3)", "css.types.pow"],
  ["opacity", "sqrt(4)", "css.types.sqrt"],
  ["width", "hypot(3px, 4px)", "css.types.hypot"],
  ["opacity", "log(2)", "css.types.log"],
  ["opacity", "exp(1)", "css.types.exp"],
  ["width", "calc(100% - 2rem)", null],
  ["width", "min(100%, 40rem)", null],
  ["width", "max(10px, 2vw)", null],
  ["width", "clamp(10rem, 50%, 40rem)", null],
  ["padding", "calc(1rem + 2px) min(1rem, 5%)", null],
  ["color", "var(--x)", null],
  ["display", "flex", null],
  ["display", "grid-lanes", "css.properties.display.grid-lanes"],
  ["display", "inline-grid-lanes", "css.properties.display.inline-grid-lanes"],
  ["flow-tolerance", "normal", "css.properties.flow-tolerance"],
  ["color", "rgb(1 2 3)", null],
  ["font-family", '"full-width", serif', null],
];
for (const [p, v, key] of warns) {
  const ws = support(p, v);
  ws.forEach((w) => console.log(`     ${message(p, v, w)}`));
  verify(
    key
      ? ws.some((w) => w.key === key && w.lacking.some((t) => t.startsWith("chrome ")))
      : ws.length === 0,
    `${p}: ${v} ${key ? "warns" : "no warning"}`,
  );
}
// a target without the property gets the property warning only, not one per value
const ws = support("white-space-collapse", "preserve-spaces", [
  ["firefox", "120"],
  ["chrome", "120"],
]);
verify(
  JSON.stringify(ws.map((w) => [w.feature, w.lacking])) ===
    '[["white-space-collapse",["firefox 120"]],["preserve-spaces",["chrome 120"]]]',
  `white-space-collapse: preserve-spaces on firefox 120 warns for the property only`,
);
// the WebKit-only properties warn on a Firefox target; Chrome has two of them (touch-callout is iOS only)
for (const [p, v, chrome] of [
  ["-webkit-tap-highlight-color", "red", 0],
  ["-webkit-touch-callout", "none", 1],
  ["-webkit-box-reflect", "below", 0],
] as const) {
  verify(
    support(p, v, [["firefox", "120"]]).some((w) => w.key === `css.properties.${p}`) &&
      support(p, v, [["chrome", "120"]]).length === chrome,
    `${p}: ${v} warns on firefox, ${chrome} on chrome`,
  );
}
// a clamp is quiet everywhere (BCD files -webkit-line-clamp and -webkit-box-orient under prefixed standard names, which
// the lookup does not follow); the standard line-clamp warns, no engine ships it unprefixed
for (const [p, v] of [
  ["-webkit-line-clamp", "3"],
  ["-webkit-box-orient", "vertical"],
  ["display", "-webkit-box"],
] as const)
  verify(
    support(p, v, [
      ["firefox", "120"],
      ["safari", "17"],
    ]).length === 0,
    `${p}: ${v} is quiet`,
  );
verify(
  support("display", "grid-lanes", [["safari", "26.4"]]).length === 0 &&
    support("display", "grid-lanes", [["safari", "26.2"]]).length === 1,
  "display: grid-lanes is quiet on safari 26.4, warns on 26.2",
);
verify(
  support("line-clamp", "3", [["chrome", "154"]]).length === 1,
  "line-clamp: 3 warns on chrome 154",
);

// lacking(bcdKey, targets): the targets without the feature, by the rules of the warnings (no prefix, no flags)
verify(
  JSON.stringify(
    lacking("css.at-rules.property", [
      ["chrome", "50"],
      ["chrome", "120"],
      ["firefox", "130"],
      ["firefox", "100"],
    ]),
  ) === '[["chrome","50"],["firefox","100"]]',
  "lacking: @property is missing on chrome 50 and firefox 100",
);
verify(
  lacking("css.properties.-webkit-box-reflect", [
    ["firefox", "120"],
    ["chrome", "120"],
  ]).length === 1 && lacking("css.nonsense.key", [["chrome", "1"]]).length === 0,
  "lacking: a WebKit-only property lacks on firefox; an unknown key lacks nothing",
);

// exact: a partial implementation counts as lacking (relative colour: Chrome 119-121 and Safari 16.4-17.6 are partial)
const rel = "css.types.color.oklch.relative_syntax";
const both = [
  ["chrome", "120"],
  ["chrome", "122"],
  ["safari", "17.4"],
  ["safari", "18"],
] as [string, string][];
verify(
  JSON.stringify(lacking(rel, both)) === "[]" &&
    JSON.stringify(lacking(rel, both, true)) === '[["chrome","120"],["safari","17.4"]]',
  "lacking: partial counts as support, and as lacking when exact",
);
verify(
  support("color", "oklch(from red calc(l + 0.1) c h)", [["chrome", "120"]]).length === 0,
  "warnings: partial is still support",
);

const rules: [string, string, boolean][] = [
  ["transition", "none, opacity 1s", false],
  ["transition", "opacity 1s, none", false],
  ["transition", "none", true],
  ["transition", "none 1s", true],
  ["transition", "opacity 1s cubic-bezier(0, 0, 1, 1), color 2s", true],
  ["font-family", "system-ui foo", false],
  ["font-family", "Arial serif", false],
  ["font-family", "a, inherit", false],
  ["font-family", "system-ui, Open Sans, serif", true],
  ["font-family", '"system-ui foo", Serif', true],
  ["font-family", "inherit", true],
  ["transition", "ease-in allow-discrete steps(2)", false],
  ["transition", "ease linear 1s -2s, normal allow-discrete", true],
  ["transition", "opacity -1s -2s", false],
  ["transition", "opacity 1s -1s", true],
  ["transition", "opacity 1s steps(0)", false],
  ["transition", "opacity 1s steps(1, jump-none)", false],
  ["transition", "opacity 1s steps(1), color 1s steps(2, jump-none)", true],
  ["flex-basis", "anchor-size(width)", false],
  ["width", "anchor-size(width)", true],
  ["margin-top", "anchor-size(--a height, 1px)", true],
  ["grid-template-areas", '"a b" "a b"', true],
  ["grid-template-areas", '"a a" ". b" "c ..."', true],
  ["grid-template-areas", '"a b" "a"', false],
  ["grid-template-areas", '"a b" "b a"', false],
  ["grid-template-areas", '"a, b"', false],
  ["grid-template-areas", '""', false],
  ["grid", '"a b" auto / auto auto', true],
  ["grid-row", "span 2 / x", true],
  ["grid-row", "span", false],
  ["grid-area", "1 / x / span span / auto", false],
  ["grid-column-start", "x span", true],
  ["counter-reset", "a 1 reversed(b)", true],
  ["counter-reset", "a none", false],
  ["counter-increment", "reversed(none)", false],
  ["container-name", "none", true],
  ["container-name", "a b", true],
  ["container-name", "a not", false],
  ["view-transition-class", "a b", true],
  ["view-transition-class", "none a", false],
  ["color-scheme", "only light dark", true],
  ["color-scheme", "light foo only", true],
  ["color-scheme", "light only foo", false],
  ["color-scheme", "normal foo", false],
  ["font-feature-settings", '"liga" off, "smcp"', true],
  ["font-feature-settings", '"ligatures"', false],
  ["font-variation-settings", '"wght" 700, "wd  " 1', true],
  ["font-variation-settings", '"wg" 700', false],
  ["font-language-override", '"TRK"', true],
  ["font-language-override", '"TURKISH"', false],
  ["animation", "infinite 363.6", false],
  ["animation", "1s linear linear", true],
  ["animation", "2 infinite spin, ease-in 1s", true],
  ["animation", "linear(0, 1) steps(2) 1s", false],
  ["r", "10px", true],
  ["r", "-1px", false],
  ["rx", "auto", true],
  ["stroke-width", "-1", false],
  ["stroke-dasharray", "1 -2", false],
  ["stroke-dasharray", "1 2, 3", true],
  ["stroke-miterlimit", "-1", false],
  ["stroke-miterlimit", "0.5", true],
  ["filter", "saturate(-1)", false],
  ["filter", "hue-rotate(-90deg) blur(2px)", true],
  ["backdrop-filter", "blur(-2px)", false],
  ["d", 'path("M 0 0 L 10 10 z")', true],
  ["d", 'path(evenodd, "M0,0h10v10a5 5 0 0110 0z")', true],
  ["d", 'path("")', true],
  ["d", 'path("x-b")', false],
  ["d", 'path("L 0 0")', false],
  ["d", 'path("M 0")', false],
  ["clip-path", 'path("M0 0 X")', false],
];
for (const [p, v, ok] of rules) {
  let err = "";
  try {
    checkRules(p, v);
  } catch (e) {
    err = (e as Error).message;
  }
  if (err) console.log(`     ${err}`);
  verify(!err === ok, `${p}: ${v} ${ok ? "ok" : "error"}`);
}
// the 2D gradients have no BCD entry: support.ts's own table says every target lacks them, and a real BCD key is not
// shadowed by the table (chrome 26 has linear-gradient, chrome 25 does not)
verify(
  lacking("css.types.gradient.mesh-gradient", [["chrome", "155"]]).length === 1,
  "mesh-gradient(): chrome 155 lacks it (own table)",
);
verify(
  lacking("css.types.gradient.freeform-gradient", [["safari", "26"]]).length === 1,
  "freeform-gradient(): safari 26 lacks it (own table)",
);
verify(
  lacking("css.types.gradient.linear-gradient", [["chrome", "26"]]).length === 0,
  "linear-gradient: chrome 26 has it (BCD, not the table)",
);
verify(
  lacking("css.types.gradient.linear-gradient", [["chrome", "25"]]).length === 1,
  "linear-gradient: chrome 25 lacks it (BCD)",
);
process.exit(failed ? 1 : 0);
