// The core on the hard cases of docs/research/devtools.md, in Node: happy-dom gives the tree and Element.matches (states are
// attributes here: `:hover` is `[data-hover]`), the test says which at-rules hold, and what the browser computes.
//   @container, @supports, @scope looks, hover vs media in one layer (specificity), an unlayered user rule, kernels in
//   _.k with custom properties (frame), a surface in a surface, within(), the grouping of classes by site, the table's
//   decoding.
import assert from "node:assert/strict";

import { Effect, Exit, Layer } from "effect";
import { Window } from "happy-dom";

import {
  buildPrompt,
  inspect,
  pagePrompt,
  toModel,
  Page,
  specificity,
  stripStates,
} from "../src/core/index.ts";

const window = new Window();
const document = window.document;

// the at-rules that hold, and what verify reports (default: the browser agrees with the winner)
let holds = new Set();
let observe = (el, prop, value, l) => ({
  prop: l,
  computed: value,
  expected: value,
  inline: "",
  foreign: [],
  animated: false,
});
const states = (sel) =>
  sel
    .replace(/:(hover|focus-visible|focus)\b/g, (_, s) => `[data-${s}]`)
    .replace(/:root\b/g, "html");
const matches = (el, sel) => {
  try {
    return el.matches(states(sel));
  } catch {
    return false;
  }
};
// @scope (start) to (limit): the nearest start around the element; `:scope` is that root
const inScope = (el, prelude, selector) => {
  const [, start, limit] = /^@scope\s*\(([^)]*)\)(?:\s*to\s*\(([^)]*)\))?/.exec(prelude);
  const root = el.closest(states(start));
  if (!root) return false;
  if (
    limit &&
    el !== root &&
    el.closest(states(limit)) !== el.closest(states(start)) &&
    root.contains(el.closest(states(limit)))
  )
    return false;
  if (!selector) return true;
  root.setAttribute("data-scope-root", "");
  const hit = matches(el, selector.replace(/:scope\b/g, "[data-scope-root]"));
  root.removeAttribute("data-scope-root");
  return hit;
};
const page = Layer.succeed(
  Page,
  Page.of({
    classes: (el) => Effect.sync(() => [...el.classList]),
    label: (el) => Effect.sync(() => el.localName + (el.id ? `#${el.id}` : "")),
    parent: (el) => Effect.sync(() => el.parentElement ?? undefined),
    matches: (el, sel) => Effect.sync(() => matches(el, sel)),
    probe: (el, probes) =>
      Effect.sync(() =>
        probes.map(({ wrap, selector }) => {
          const scope = wrap.find((w) => w.startsWith("@scope"));
          const rest = wrap.filter((w) => w !== scope);
          return (
            rest.every((w) => holds.has(w)) &&
            (scope ? inScope(el, scope, selector) : !selector || matches(el, selector))
          );
        }),
      ),
    custom: (el, names) => Effect.sync(() => names.map((n) => `computed(${n})`)),
    verify: (el, prop, selector, value, longhands) =>
      Effect.sync(() => longhands.map((l) => observe(el, prop, value, l, selector))),
  }),
);

const table = (
  sheet,
  classes = {},
  sites = [],
  layers = ["_.k", "_.a", "_.b", "_.c", "_.d", "_.e"],
) => ({
  root: "/app",
  sheet,
  layers,
  classes,
  sites,
  tokens: { "--color-bg": { path: "color.bg", value: "#fff" } },
});
const cls = (layer, css, more = {}) => ({
  kind: "class",
  layer,
  wrap: [],
  prop: "",
  css,
  tokens: [],
  sites: [],
  ...more,
});
const run = async (t, el) => {
  const exit = await Effect.runPromiseExit(
    toModel(t).pipe(
      Effect.flatMap((m) => inspect(m, el)),
      Effect.provide(page),
    ),
  );
  if (Exit.isFailure(exit)) throw new Error(String(exit.cause));
  return exit.value;
};
const row = (r, prop) => r.rows.find((x) => x.prop === prop || x.longhands.includes(prop));
const html = (s) => {
  document.body.innerHTML = s;
  return document.querySelector("#t");
};

// ---------- selectors
assert.deepEqual(specificity("._x:hover"), [0, 2, 0]);
assert.deepEqual(specificity(":where(._g:hover) ._x"), [0, 1, 0]);
assert.deepEqual(specificity(":is(#a, .b) p::before"), [1, 0, 2]);
assert.deepEqual(specificity(':where([data-mode="x"], [data-mode~="x/c"])'), [0, 0, 0]);
assert.deepEqual(stripStates("._x:hover"), { base: "._x", states: [":hover"] });
assert.deepEqual(stripStates(":where(._g:hover) ._x"), {
  base: ":where(._g) ._x",
  states: ["within :hover"],
});
assert.deepEqual(stripStates('._x[aria-current="page"]'), {
  base: "._x",
  states: ['[aria-current="page"]'],
});
assert.deepEqual(stripStates("._k:hover > *"), { base: "._k > *", states: [":hover"] });

// ---------- hover vs media in one layer: :hover is printed first and wins by specificity (0,2,0) over (0,1,0)
{
  const sheet = `@layer _.k, _.a, _.b, _.c, _.d, _.e;
@layer _.b {
  ._h:hover{color:red}
  @media (width >= 40rem) {
    ._m{color:blue}
  }
}
`;
  const t = table(sheet, {
    _h: cls("_.b", "._h:hover{color:red}"),
    _m: cls("_.b", "._m{color:blue}", { wrap: ["@media (width >= 40rem)"] }),
  });
  const el = html('<a id="t" class="_h _m" data-hover></a>');
  holds = new Set(["@media (width >= 40rem)"]);
  let r = await run(t, el);
  assert.equal(
    row(r, "color").winner.selector,
    "._h:hover",
    "hovered and wide: the hover wins by specificity",
  );
  assert.deepEqual(
    row(r, "color").overridden.map((c) => c.selector),
    ["._m"],
  );
  assert.deepEqual(row(r, "color").winner.conditions, [{ text: ":hover", holds: true }]);
  el.removeAttribute("data-hover");
  r = await run(t, el);
  assert.equal(row(r, "color").winner.selector, "._m", "not hovered: the query");
  const idle = row(r, "color").inactive[0];
  assert.deepEqual(idle.conditions, [{ text: ":hover", holds: false }]);
  holds = new Set();
  r = await run(t, el);
  assert.equal(row(r, "color").winner, undefined, "narrow, not hovered: nothing applies");
  assert.deepEqual(
    row(r, "color").inactive.map((c) => c.conditions.map((x) => `${x.text}=${x.holds}`).join()),
    [":hover=false", "@media (width >= 40rem)=false"],
  );
}

// ---------- @container and @supports: a layer up, and only where the browser says it holds
{
  const q = "@container card (width < 24rem)";
  const s = "@supports (display: grid)";
  const sheet = `@layer _.a {
  ._b{background-color:#dbeafe}
  ._w{font-weight:400}
}
@layer _.b {
  ${q} {
    ._n{background-color:#fee2e2}
  }
  ${s} {
    ._s{font-weight:700}
  }
}`;
  const t = table(sheet, {
    _b: cls("_.a", ""),
    _n: cls("_.b", "", { wrap: [q] }),
    _w: cls("_.a", ""),
    _s: cls("_.b", "", { wrap: [s] }),
  });
  const el = html('<div class="_cb"><p id="t" class="_b _n _w _s"></p></div>');
  holds = new Set([q, s]);
  let r = await run(t, el);
  assert.equal(row(r, "background-color").winner.selector, "._n");
  assert.equal(row(r, "background-color").winner.layer, "_.b");
  assert.equal(row(r, "font-weight").winner.selector, "._s");
  holds = new Set();
  r = await run(t, el);
  assert.equal(row(r, "background-color").winner.selector, "._b");
  assert.deepEqual(row(r, "background-color").inactive[0].conditions, [{ text: q, holds: false }]);
  assert.equal(row(r, "font-weight").winner.selector, "._w");
  const g = r.groups.flatMap((x) => x.classes).find((c) => c.cls === "_n");
  assert.equal(g.active, false);
  assert.deepEqual(g.conditions, [{ text: q, holds: false }]);
}

// ---------- @scope looks: the token on the element comes from the look of the nearest scope, in its top-level layer
{
  const look = "@scope (article.post)";
  const sheet = `@layer _.k, _.a, _.b, _.c, _.d, _.e;
@layer app, author, viewer;
@layer _.k {
  :root{--color-bg:#fff}
}
@layer author {
  ${look}{:where([data-mode="hero"], [data-mode~="hero/color"]){--color-bg:#123456}}
}
@layer _.a {
  ._bg{background-color:var(--color-bg)}
}`;
  const t = table(
    sheet,
    { _bg: cls("_.a", "", { tokens: ["--color-bg"] }) },
    [],
    ["_.k", "_.a", "_.b", "_.c", "_.d", "_.e", "app", "author", "viewer"],
  );
  let el = html(
    '<article class="post"><section data-mode="hero"><p id="t" class="_bg"></p></section></article>',
  );
  let r = await run(t, el);
  assert.equal(row(r, "background-color").winner.selector, "._bg");
  const token = r.tokens.find((x) => x.name === "--color-bg");
  assert.equal(token.path, "color.bg");
  assert.equal(token.computed, "computed(--color-bg)");
  assert.deepEqual(
    {
      selector: token.source.selector,
      layer: token.source.layer,
      wrap: token.source.wrap,
      on: token.source.on,
    },
    {
      selector: ':where([data-mode="hero"], [data-mode~="hero/color"])',
      layer: "author",
      wrap: [look],
      on: "section",
    },
  );
  // outside the scope the look does not apply: the :root rule of _.k gives it
  el = html('<div><section data-mode="hero"><p id="t" class="_bg"></p></section></div>');
  r = await run(t, el);
  assert.deepEqual(
    [r.tokens[0].source.selector, r.tokens[0].source.layer, r.tokens[0].source.on],
    [":root", "_.k", "html"],
  );
}

// ---------- an unlayered user rule beats cssints' layers: the panel says so instead of claiming the winner
{
  const t = table(`@layer _.a {\n  ._c{color:red}\n}`, { _c: cls("_.a", "") });
  const el = html('<p id="t" class="_c mine"></p>');
  observe = (el, prop, value, l) => ({
    prop: l,
    computed: "rgb(0, 0, 255)",
    expected: "rgb(255, 0, 0)",
    inline: "",
    foreign: [
      { selector: ".mine", source: "/src/mine.css", layer: "", value: "blue", important: false },
    ],
    animated: false,
  });
  const r = await run(t, el);
  const v = row(r, "color").verdicts[0];
  assert.equal(v.status, "mismatch");
  assert.match(
    v.reason,
    /\.mine \{ color: blue \} in \/src\/mine\.css beats it: a rule outside every layer/,
  );
  assert.deepEqual(
    r.groups.at(-1).classes.map((c) => [c.cls, c.kind]),
    [
      ["_c", "class"],
      ["mine", "other"],
    ],
  );
  // an inline style is named as such
  observe = (el, prop, value, l) => ({
    prop: l,
    computed: "blue",
    expected: "red",
    inline: "blue",
    foreign: [],
    animated: false,
  });
  assert.match(row(await run(t, el), "color").verdicts[0].reason, /style attribute/);
  observe = (el, prop, value, l) => ({
    prop: l,
    computed: value,
    expected: value,
    inline: "",
    foreign: [],
    animated: false,
  });
}

// ---------- kernels in _.k with custom properties (frame): the kernel reads what the member's class sets in _.a
{
  const sheet = `@layer _.k {
._frame-core {
  padding: var(--frame-p);
  border-radius: var(--frame-x);
}
@container (style(--frame-c: e)) or (not style(--frame-c)) {
  ._frame-core { --frame-c: o; --frame-x: max(var(--frame-r) - var(--frame-m), 0px); }
}
}
@layer _.a {
  ._fp{--frame-p:0.5rem}
  ._pl{padding-left:2rem}
}`;
  const t = table(
    `@property --frame-p { syntax: "<length>"; inherits: false; initial-value: 0px; }\n${sheet}`,
    {
      "_frame-core": {
        kind: "marker",
        layer: "_.k",
        wrap: [],
        prop: "",
        css: "",
        tokens: [],
        plugin: "frame.core",
        sites: [0],
      },
      _fp: cls("_.a", "", { plugin: "frame", sites: [0] }),
      _pl: cls("_.a", "", { sites: [1] }),
    },
    [
      { file: "/app/src/Card.tsx", line: 4, column: 13, classes: ["_frame-core", "_fp"] },
      { file: "/app/src/Card.tsx", line: 9, column: 2, classes: ["_pl"] },
    ],
  );
  const el = html('<div><div id="t" class="_frame-core _fp _pl"></div></div>');
  holds = new Set(["@container (style(--frame-c: e)) or (not style(--frame-c))"]);
  const r = await run(t, el);
  const pad = r.rows.find((x) => x.prop === "padding");
  assert.equal(pad.winner.selector, "._frame-core");
  assert.equal(pad.winner.layer, "_.k");
  assert.deepEqual(
    pad.lost.map((l) => [l.prop, l.by.selector]),
    [["padding-left", "._pl"]],
    "_.a beats the kernel's _.k",
  );
  assert.equal(row(r, "padding-left").winner.selector, "._pl");
  assert.equal(
    row(r, "--frame-x").winner.wrap[0],
    "@container (style(--frame-c: e)) or (not style(--frame-c))",
  );
  assert.equal(row(r, "--frame-p").winner.selector, "._fp");
  // --frame-p does not inherit (its @property): its source is the element's own class
  assert.equal(r.tokens.find((x) => x.name === "--frame-p").source.selector, "._fp");
  // grouped by the call: the frame() call first, then the other
  assert.deepEqual(
    r.groups.map((g) => [
      g.site.line,
      g.classes.map((c) => `${c.cls}:${c.kind}:${c.plugin ?? ""}`),
    ]),
    [
      [4, ["_frame-core:marker:frame.core", "_fp:class:frame"]],
      [9, ["_pl:class:"]],
    ],
  );
}

// ---------- within(): the state of the marked ancestor, one class of specificity, under the element's own state
{
  const sheet = `@layer _.b {
  :where(._g:hover) ._x{text-decoration:underline}
  ._y:hover{text-decoration:none}
}`;
  const t = table(sheet, {
    _g: { kind: "group", layer: "", wrap: [], prop: "", css: "", tokens: [], sites: [] },
    _x: cls("_.b", ""),
    _y: cls("_.b", ""),
  });
  const el = html('<div class="_g" data-hover><a id="t" class="_x _y"></a></div>');
  let r = await run(t, el);
  const td = row(r, "text-decoration");
  assert.equal(td.winner.selector, ":where(._g:hover) ._x");
  assert.deepEqual(td.winner.specificity, [0, 1, 0]);
  assert.deepEqual(td.inactive[0].conditions, [{ text: ":hover", holds: false }]);
  el.setAttribute("data-hover", "");
  r = await run(t, el);
  assert.equal(
    row(r, "text-decoration").winner.selector,
    "._y:hover",
    "the element's own state wins",
  );
  document.querySelector("._g").removeAttribute("data-hover");
  el.removeAttribute("data-hover");
  r = await run(t, el);
  assert.deepEqual(row(r, "text-decoration").inactive[0].conditions, [
    { text: "within :hover", holds: false },
  ]);
}

// ---------- a surface in a surface: the step `--surface-d` is unregistered. On each surface its member class (_.a) beats
// the kernel's `0` (_.k); a plain child inherits it from the nearest surface. verify gets the winner's selector, so the
// page can find the declaration as it has it (a transformer reprints `0.04` as `.04`), and the value as written.
{
  const even = "@container (style(--surface-p: e)) or (not style(--surface-p))";
  const odd = "@container style(--surface-p: o)";
  const sheet = `@property --surface-e { syntax: "<color>"; inherits: true; initial-value: canvas; }
@layer _.k {
._surface-core { --surface-k: initial; --surface-d: 0; background-color: var(--surface-s); }
${even} {
  ._surface-core { --surface-p: o; --surface-s: oklch(from var(--surface-k, var(--surface-e)) calc(l + var(--surface-d)) c h); }
}
${odd} {
  ._surface-core { --surface-p: e; --surface-s: oklch(from var(--surface-k, var(--surface-o)) calc(l + var(--surface-d)) c h); }
}
}
@layer _.a {
  ._lt{--surface-d:0.04}
  ._k{--surface-k:  oklch( 0.9   0.02 90 ) }
  ._ct{--surface-d:calc(0.03 * clamp(-1, (0.5636 - l) * 1e6, 1))}
}`;
  const marker = {
    kind: "marker",
    layer: "_.k",
    wrap: [],
    prop: "",
    css: "",
    tokens: [],
    plugin: "surface.core",
    sites: [],
  };
  const t = table(sheet, {
    "_surface-core": marker,
    _lt: cls("_.a", "", { plugin: "surface" }),
    _k: cls("_.a", "", { plugin: "surface" }),
    _ct: cls("_.a", "", { plugin: "surface" }),
    _c: cls("_.a", "", { tokens: ["--surface-d"] }),
  });
  const seen = [];
  observe = (el, prop, value, l, selector) => {
    seen.push([selector, prop, value]);
    return { prop: l, computed: "x", expected: "x", inline: "", foreign: [], animated: false };
  };
  const el = html(
    '<div id="o" class="_surface-core _k _lt"><div id="t" class="_surface-core _ct"><p class="_c"></p></div></div>',
  );
  holds = new Set([odd]);
  let r = await run(t, el);
  assert.equal(row(r, "--surface-d").winner.selector, "._ct");
  assert.deepEqual(
    row(r, "--surface-d").overridden.map((c) => c.selector),
    ["._surface-core"],
  );
  assert.equal(row(r, "--surface-p").winner.decl.value, "e");
  assert.equal(row(r, "--surface-s").winner.wrap[0], odd);
  assert.equal(
    row(r, "--surface-k").winner.selector,
    "._surface-core",
    "the inner one has no base",
  );
  assert.ok(
    seen.some(
      ([s, p, v]) =>
        s === "._ct" &&
        p === "--surface-d" &&
        v === "calc(0.03 * clamp(-1, (0.5636 - l) * 1e6, 1))",
    ),
  );
  holds = new Set([even]);
  seen.length = 0;
  r = await run(t, document.querySelector("#o"));
  assert.equal(row(r, "--surface-d").winner.selector, "._lt");
  assert.equal(row(r, "--surface-p").winner.decl.value, "o");
  assert.ok(
    seen.some(([s, p, v]) => s === "._k" && p === "--surface-k" && v === "oklch( 0.9   0.02 90 )"),
  );
  assert.ok(row(r, "--surface-k").verdicts.every((v) => v.status === "ok"));
  // a plain child: the step comes from the nearest surface's class
  r = await run(t, document.querySelector("p"));
  const d = r.tokens.find((x) => x.name === "--surface-d");
  assert.deepEqual([d.source.selector, d.source.on], ["._ct", "div#t"]);
  assert.equal(d.registered, false);
  holds = new Set();
  observe = (el, prop, value, l) => ({
    prop: l,
    computed: value,
    expected: value,
    inline: "",
    foreign: [],
    animated: false,
  });
}

// ---------- the prompt for OpenCode: the instruction, the call sites with their text, the winner and what it beat, the tokens;
// every list is cut
{
  const sheet = `@layer _.b {
  ._h:hover{color:red}
  ._m{color:blue}
}`;
  const sites = [
    {
      file: "/app/src/Card.tsx",
      line: 12,
      column: 4,
      classes: ["_h", "_m"],
      text: 'color("blue").hover(color("red"))',
    },
    ...Array.from({ length: 12 }, (_, i) => ({
      file: `/app/src/other${i}.ts`,
      line: i + 1,
      column: 0,
      classes: [`_s${i}`],
      text: "x".repeat(1000),
    })),
  ];
  const t = table(sheet, {
    _h: cls("_.b", "._h:hover{color:red}", { sites: [0] }),
    _m: cls("_.b", "._m{color:blue}", { tokens: ["--color-bg"], sites: [0] }),
    ...Object.fromEntries(
      sites
        .slice(1)
        .map((_, i) => [`_s${i}`, cls("_.b", `._s${i}{color:blue}`, { sites: [i + 1] })]),
    ),
  });
  t.sites = sites;
  const el = html(
    `<main><a id="t" class="_h _m ${sites
      .slice(1)
      .map((_, i) => `_s${i}`)
      .join(" ")}" data-hover>Buy now</a></main>`,
  );
  holds = new Set();
  const text = buildPrompt(await run(t, el), el, "  make it bigger ");
  assert.match(text, /Instruction: make it bigger\n/);
  assert.match(text, /Element: <a#t>/);
  assert.match(text, /DOM path: html > body > main > a#t/);
  assert.match(text, /Text: Buy now/);
  assert.match(text, /- src\/Card\.tsx:12\n {2}color\("blue"\)\.hover\(color\("red"\)\)/);
  assert.match(
    text,
    /- color: red from \._h:hover \(_\.b\); overridden: color: blue \._m \(_\.b\)/,
  );
  assert.match(text, /- --color-bg = computed\(--color-bg\) \(color\.bg\)/);
  assert.match(text, /… and \d+ more/, "the sites are cut");
  assert.ok(!text.includes("x".repeat(401)), "a call is cut");
  assert.ok(text.length < 6000, `${text.length} characters`);
  assert.ok(!text.includes("/app/"), "paths are relative to the root");

  // no element picked: the instruction, the route and the display
  const site = new Window({
    url: "http://localhost:5173/docs/install?tab=npm#top",
    width: 800,
    height: 600,
  });
  site.document.title = "Install  ·\ncssints";
  site.document.documentElement.setAttribute("class", "dim");
  site.document.documentElement.setAttribute("data-mode", "dark");
  site.document.documentElement.setAttribute("data-hue", "210");
  site.document.documentElement.setAttribute("lang", "en");
  const page = pagePrompt("  make the page darker ", site.document);
  assert.match(page, /^Change the UI of the running app/);
  assert.match(page, /Instruction: make the page darker\n/);
  assert.match(page, /\nPage: \/docs\/install\?tab=npm#top\n/, "the route, not the origin");
  assert.match(page, /\nTitle: Install · cssints\n/);
  assert.match(page, /\n- viewport: 800x600\n/, "devicePixelRatio 1 is the default");
  assert.match(page, /\n- <html> class="dim" data-mode="dark" data-hue="210"\n/);
  assert.match(page, /\n- prefers-color-scheme: light$/);
  assert.ok(!page.includes("localhost") && !page.includes("Element:"));
  assert.ok(
    page.indexOf("Instruction:") < page.indexOf("Page:"),
    "the header follows the instruction",
  );

  // an element: the same header, its box and state, what it is, never a value
  const form = site.document.createElement("main");
  form.setAttribute("data-section", "install");
  form.innerHTML = `<div data-a="1"><div data-b="2"><section data-c="3"><span data-d="4">
    <input id="pw" type="password" name="pw" value="hunter2" placeholder="Password" data-x="${"y".repeat(500)}"></span></section></div></div>`;
  site.document.body.append(form);
  const input = form.querySelector("input");
  input.focus();
  const info = buildPrompt(await run(table(sheet, {}), input), input, "fix");
  assert.match(info, /\nPage: \/docs\/install\?tab=npm#top\nTitle: Install · cssints\nDisplay:\n/);
  assert.match(info, /\n- rect: 0x0 at 0,0 in the viewport; focused\n/);
  input.setAttribute("aria-disabled", "true");
  assert.match(
    buildPrompt(await run(table(sheet, {}), input), input, "x"),
    /; focused, disabled\n/,
  );
  input.removeAttribute("aria-disabled");
  assert.match(info, /\nAttributes: id="pw" type="password" name="pw" placeholder="Password"\n/);
  assert.ok(!info.includes("hunter2") && !/value=/.test(info), "a value never leaves the page");
  assert.ok(!info.includes("y".repeat(81)), "an attribute is cut");
  assert.match(info, /\nData of input#pw: data-x="y{80}…"\n/);
  assert.match(
    info,
    /\nData of span: data-d="4"\nData of section: data-c="3"\nData of div: data-b="2"\n/,
  );
  assert.ok(!info.includes("data-a=") && !info.includes("data-section"), "three ancestors");
  assert.match(info, /start from the route \(Page\) and the app \(App\)/);

  // a huge page and instruction: the header stays and the whole is bounded
  const big = site.document.createElement("p");
  big.textContent = "t".repeat(5000);
  for (let i = 0; i < 100; i++) {
    big.setAttribute(`data-n${i}`, "v".repeat(500));
    site.document.documentElement.setAttribute(`data-h${i}`, "v".repeat(500));
  }
  big.setAttribute("href", "/".repeat(5000));
  site.document.title = "T".repeat(5000);
  form.append(big);
  const huge = buildPrompt(await run(table(sheet, {}), big), big, "z".repeat(20000));
  assert.ok(huge.length < 8000, `${huge.length} characters`);
  assert.match(huge, /Instruction: z+…\n/);
  assert.match(huge, /\nTitle: T+…\n/);
  assert.match(huge, /\nElement: <p>/, "the element follows");
}

// ---------- a bad table is a TableError
{
  const exit = await Effect.runPromiseExit(toModel({ sheet: 1 }));
  assert.ok(Exit.isFailure(exit));
  assert.match(String(exit.cause), /TableError/);
}

console.log("devtools core ok");
