# Developer tools on cssints' sheet (cssints-0a3p)

Question: do the atomic-CSS devtools and the CSS tooling around them work with cssints' layered, content-hashed
classes as they are, what breaks, and what is the smallest cssints-side change that makes them (or Chrome's own
Elements panel) useful?

Answer: **atomic-css-devtools reads any stylesheet through the CSSOM and needs no class format**, and it gets
cssints' layer order right; it misses every rule under `@container`, `@supports` and `@scope`, ignores specificity
and puts unlayered rules below layered ones, so on the demo it shows a wrong winner on 2 of 85 elements, and on
an element with `hover()` and a media query in one layer. It cannot say _where_ a class comes from, and neither could Chrome: the dev sheet was one
`<style>` with no source map. **Shipped: a dev source map of the sheet** (each class rule points at the first
`css.*` call that made it; Chrome's Styles pane then names `Showcase.tsx:91` beside the rule, with
`css: { devSourcemap: true }`). Readable class names and a `data-cssints` attribute are not worth it. Sonda sees
the sheet as a 0-byte virtual module (since cssints-vxfr the build sheet has a map too, section 4); CSS coverage
works as is and reads 79 % of the demo's sheet as used.

Hands-on, Chrome 155 through playwright-core 1.63, apps/demo's dev server and build. The scripts are throwaway
(temp dir), the numbers below are their output.

## 1. atomic-css-devtools (astahmer, 2815e21, 2025-12-22)

**How it reads rules.** `src/inspect-api.ts` walks `document.styleSheets`, recursing into `CSSMediaRule` and
`CSSLayerBlockRule` only, and keeps each `CSSStyleRule` with `element.matches(rule.selectorText)`. Layer order comes
from every `@layer` statement and block it saw (`reorderNestedLayers`). The panel (`src/lib/rules.ts`
`computeStyles`) sorts the rules by layer, drops `@media` rules that do not match the window (media-query-fns),
and lets the **last rule per property win**. The source of a rule is the sheet's href or Vite's
`data-vite-dev-id` (here `\0virtual:cssints.css`). Nothing reads a class name or a source map, so any stylesheet
works and no class format is needed.

**The test.** The extension is a devtools panel (WXT); a panel cannot be driven by Playwright, so its own code
was bundled instead: `inspectElement` (what the content script runs) plus the store's `filterMatchedRulesByEnv`
and `computeStyles` (what the panel shows), from the repo's sources with `bun build`, injected into the demo's
dev page. For each of the 85 elements with a class, its matched rules were compared with Chrome's
(CDP `CSS.getMatchedStylesForNode`), and its winning values were set inline, all at once, on a childless clone in
place and compared with the element's computed style.

|                                                                                     | result on apps/demo (dev)                                                                                                                                                                  |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| layer order                                                                         | `_.k, _.a, _.b, _.c, _.d, _.e, app, author, viewer`: right                                                                                                                                 |
| hashed classes, `_.k` kernels, `@media` in a layer, custom properties (`--frame-p`) | read and shown                                                                                                                                                                             |
| `:where(._g:hover) ._x` (`within()`)                                                | right (no specificity, which is the point of `:where`)                                                                                                                                     |
| elements with a rule it misses                                                      | 2: `@container card (width < 24rem)` (2 rules), `@supports (display: grid)` (1)                                                                                                            |
| elements with a wrong winner                                                        | 2, both from those misses (`color` and `background-color`, `font-weight` show the base value); 2 more were the check's own noise (`1fr` rounding, a clone outside the surface's container) |

On hand-written sheets of cssints' shapes:

- **Specificity is ignored.** In `_.b` the sheet prints `._h:hover` before `@media (width >= 40rem) { ._m }`
  (packages/cssints/test/fixtures/conditions.ts prints this order), and cssints relies on the hover's (0,2,0) to beat
  the query (docs/API.md "With equal layers, `hover(...)` beats `md(...)` by specificity"). Hovered at 1200 px, Chrome
  shows red, the panel blue.
- **`@scope` is not traversed**: a theme with `{ scope }` (Mise en Mode's looks) is invisible.
- **Unlayered rules sort first**, so they lose in the panel; in the cascade they beat every layer. A user's own
  `.mine{color:blue}` beside `._c{color:red}` in `_.a` shows red; Chrome paints blue.
- CSS nesting is not traversed either; cssints prints flat selectors, so it does not matter here.
- The `@container style(...)` rules of the frame and surface kernels are missed with the rest of `@container`: the
  panel cannot explain where `--surface-s` comes from.

So it works as is for the common case (one element, plain and `@media` classes), and it is wrong exactly where
cssints' layering is clever: containers, supports, scoped looks, and the one place the sheet uses specificity.
These are upstream bugs (four recursion cases and the order of `computeStyles`), not a cssints format problem;
nothing cssints could print would fix them short of dropping `@container`/`@supports`. Chrome's own Styles pane
gets all of them right (it is the cascade), and shows each rule's layer and at-rule chain. What both lacked is the
step from `._tlfnko` to the TypeScript that wrote it.

## 2. What cssints changed: a source map of the dev sheet

`load()` of `virtual:cssints.css` in dev now returns `{ code, map }`. The client transform already knows, per site,
the class strings it produced and the site's offset; it keeps the first site of each class per module
(`siteOf`, plugin.ts), and `sheetMap` maps every sheet line holding a class (at its selector) to that site.
Vite chains it with LightningCSS's map when `css.devSourcemap` is on; with it off (Vite's default) the map is
dropped and nothing changes. About 50 lines in plugin.ts (the VLQ encoder is 10 of them, no dependency), dev only:
the build path is untouched. `packages/cssints/test/sheet-map.mjs` checks two classes and an unmapped line through
Vite's own CSS pipeline. On the demo, 150 of 150 class rules map, kernels included (`._surface-core` to the first
call that used the surface, `._icons-mask` to `App.tsx:116`). That was checked by decoding the map of the served
`<style>` in Chrome with trace-mapping; the Styles pane reads the same map (as for any Vite CSS with
`devSourcemap`) but was not screenshotted, since a DevTools window cannot be driven from Playwright.

Limits: a class is a hash of its declaration, so a rule shared by many calls points at the first one the server
transformed (since cssints-vxfr: the first module by path), not at all of them; the place is the site
(`cn(...)`), not the argument inside it; token, theme and `@property` rules map nowhere (they have no class). Mapping them is a follow-up if
anyone asks.

Not done, and why:

- **Readable class names in dev** (`_color-1hu9sys`): the Styles pane already prints the declaration beside the
  class, so a name repeats what is shown; it would make dev and build classes differ (HMR tests, hydration of a
  server-rendered page, `cx` strings in tests).
- **A `data-cssints` attribute**: cssints does not own the JSX, so it would need a transform per framework, and
  it says the same as the map.
- **A JSON class map endpoint**: the map carries the same data to the tool that needs it (the browser).

## 3. The other tools

- **Sonda** (bundle analyzer from source maps): on the demo build (`build.sourcemap`, `deep: true`) it lists
  `virtual:cssints.css` at 0 bytes, and the 9 kB CSS asset has no map back to modules (its Vite plugin does not
  analyse CSS assets at all, section 4). It does show what cssints ships in JS: `parent-vars.mjs` 2.0 kB,
  `runtime.mjs` 0.6 kB and the two fallback runtimes. **Since cssints-vxfr the build sheet has a map** (section 4).
- **CSS coverage with Playwright** (`page.coverage.startCSSCoverage`, Chromium; @projectwallace/css-code-coverage
  for thresholds): works on the sheet as is. The demo's built sheet: 7 185 of 9 066 bytes used on load (79.3 %),
  80.5 % after hovering every button and a narrow viewport. With one global sheet per app, coverage per route is the
  measure cssints lacks for the "one sheet" decision; apps/sky (five routes, one sheet) is where it would say
  something (follow-up).
- **css-benchpress** (scales a CSS pattern until style/layout time crosses a threshold): its cases
  `custom-property-root-fanout` and `registered-property-inheritance` are the costs of cssints' tokens and of the
  registered `@property` inputs of frame and surface. Useful as a one-off measurement, nothing to integrate.
- **css-console** (probes written as CSS comments): needs comments in the served CSS; the sheet is generated and
  LightningCSS drops every comment, so it does not apply. The question it answers (the resolved value at each
  element) is the Computed pane's.

## 4. A source map of the build sheet (cssints-vxfr, 2026-10-09)

**Vite drops CSS maps in a build.** In Vite 8 (vite-plus-core 1.0.0, `cssPostPlugin`) the `transform` of
`vite:css-post` keeps only the CSS string of each module (`styles.set(id, css)`, `map: { mappings: "" }`);
`renderChunk` joins the strings, `finalizeCss` (minify) returns a string and `emitFile` writes the asset with no map,
whatever `build.sourcemap` or `css.devSourcemap` say (the latter is read in dev only). `vite build --sourcemap` on the
demo writes `index-*.js.map` and no `.css.map`. So a map handed to `vite:css` in cssints' `renderChunk` would be
dropped, and no map of cssints survives the pipeline.

**The path taken: map the asset as written.** With `build.sourcemap` set, the client transform records `siteOf` in the
build too (as in dev), and a `generateBundle` hook (`order: "post"`, after `vite:css-post`) runs the same `sheetMap` over
each `.css` asset of the bundle: a segment at every selector, pointing at the first call of its first class (modules
taken by path, so two builds write the same map), an unmapped segment at every other selector or at-rule prelude
(`@layer`, `@property`, `:root`, `@keyframes` steps). It emits `<asset>.css.map` with paths relative to it and appends
the comment (`"hidden"`: no comment, `"inline"`: a data URL). Since LightningCSS prints one rule per selector, the
granularity it preserves is the rule, which is what the map needs; the dev map moved to the same per-selector
segments (a minified line holds many rules). Without `build.sourcemap` nothing is recorded or emitted: the demo build
is byte-identical to the one before the change.

**Sonda (0.14.0) on apps/demo.** Its Vite plugin hands only chunks to its report (`writeBundle` passes `undefined`
entrypoints for an asset, and `Report.generate` drops those), so a CSS asset never reaches its source-map analysis,
map or not: an upstream gap. Fed to the same `Report` directly (`report.addAsset(css, [])`, a throwaway script), the
demo's CSS asset:

| input                       | before (no map) | with the map |
| --------------------------- | --------------: | -----------: |
| src/components/Showcase.tsx |               0 |      3 434 B |
| src/App.tsx                 |               0 |      2 109 B |
| src/components/Button.tsx   |               0 |        762 B |
| src/components/Card.tsx     |               0 |        349 B |
| [unassigned]                |               0 |      2 459 B |
| asset                       |         9 066 B |      9 113 B |

The unassigned bytes are the layer statements, tokens and `@property` rules, the keyframes and the kernels' at-rules;
the 47 extra bytes are the comment. Same limit as in dev: a class shared by modules counts for one of them.

## Follow-ups

Beans under cssints-dk1q: a source map of the build sheet (Sonda, per-module bytes; done, section 4), CSS
coverage per route on apps/sky, and the four atomic-css-devtools gaps reported upstream with the repro sheets above.
