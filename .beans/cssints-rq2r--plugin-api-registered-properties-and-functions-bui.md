---
# cssints-rq2r
title: 'Plugin API: registered properties and functions, build-time lowering, runtime polyfills'
status: completed
type: task
priority: normal
tags:
    - wayfinder:research
created_at: 2026-09-29T15:06:15Z
updated_at: 2026-09-29T15:39:05Z
parent: cssints-vy0o
---

## Question

Icons (packages/plugin-icon) and CSS features that browsers lack (for example anchor positioning or container queries on old targets) could be cssints plugins. Nonstandard properties are mostly not a plugin case: LightningCSS emits vendor prefixes and legacy flexbox from the browserslist targets, and the rest is dead, except ~5 live WebKit-only properties (see cssints-lmru). Decide whether those 5 are a built-in list or the first plugin. A plugin registers a property, function or keyword with a grammar in mdn value-definition syntax, lowers it at build time (`computeTo`), and optionally ships a runtime polyfill (`onElementMatch`/`onElementUnmatch`). A draft of this exists: ~/github/macros/docs/2026-04-27-oxc-macro-css-in-ts-design.md, section 6 "Polyfill Plugin API", inspired by CSS Parser Extensions.

- The current state of CSS Parser Extensions (explainer, spec drafts, Chrome status) and nearby prior art: Houdini (Properties and Values, Typed OM), PostCSS plugins and postcss-preset-env, CSS polyfill runtimes (e.g. the css-typed-om polyfill already noted, container-query and anchor-positioning polyfills), and how each registers syntax and decides when a polyfill runs.
- Review the ../macros draft against our engine as it is now (docs/API.md; docs/wayfinder.md): what carries over, what was tied to the old engine (VFS, Rust pipeline, QuickJS), what is missing.
- How it maps: a grammar string `as const` in the plugin feeds our type-level recognizer and the runtime twin, so plugin properties get typed functions; the plugin is a build-time module imported with `with { type: \"cssints\" }`; `computeTo` returns css values or Typed OM; runtime polyfills as one chunk included only when a browserslist target needs it (decided from BCD, as the support warnings are); how plugin-icon would look on it.
- What 0.1 needs at minimum for nonstandard properties and icons, and what can wait.

Answer: findings in docs/research/plugins.md, an API sketch in TS, and a recommendation with the scope for 0.1.

## Primary use cases (added 2026-09-29)
1. **`surface()` and `frame()` as the first plugin** (cssints-1xqr, docs/research/surfaces-frames.md). The build-time half registers the chaining contexts with their grammars, emits the kernel once by key into layer `_.k` and sets only custom properties per site. The runtime half is a polyfill for targets without `@container style()` on custom properties (Firefox < 151, Safari < 18): a small script walks the DOM and writes the parent values into custom properties, with a MutationObserver keeping them fresh. It is included only when a browserslist target needs it (BCD). Moving to `inherit()` later is a plugin update behind `@supports`.
2. **Icons** (packages/plugin-icon rebuilt on the API).
3. **The ~5 live WebKit-only properties**: a built-in list or a tiny plugin.

## Resolution

Findings: [docs/research/plugins.md](../docs/research/plugins.md); prototype and numbers: [docs/research/plugins-proto/](../docs/research/plugins-proto/) (`results.txt`).

- **Prior art.** CSS Parser Extensions is one person's explainer (bramus, "Inception", last push 2026-01-19): no spec draft, no implementation; csswg-drafts #13186 asks only for the minimal CSSOM step and is open. Nothing native to plan on. Our engine is already the parser extension: it knows every class it emits, so a runtime needs no CSS parsing (730 B gzip against 9.8 kB for the container-query polyfill).
- **The runtime polyfill for `@container style()` works and matches exactly.** Chrome 154, Firefox 155, WebKit 26.6: 2 088 values (radii, oklch colours, three depths with plain wrappers between, class toggles, inserts, wrapping, inline style, `:hover`, media query), 0 mismatches. Cost: about 10× the style-query CSS on a first pass (5 461 nested elements: 117 ms Chrome, 90 Firefox, 283 WebKit, against 12 / 11 / 21), about 15× when the whole tree changes, 2 ms for a small subtree; deep chains are faster than the style-query kernel (14 vs 146 ms at depth 300). Watching `:hover`/media needs a transition sentinel that costs 3× more, so only `_w`-marked sites have it.
- **Floors.** Frames drop to Chrome 99 / Firefox 128 / Safari 16.4; surfaces only to Firefox 128 (relative colour keeps Chrome 122 and Safari 18). Kernels of two plugins must not share custom-property names (found the hard way: radii went to 0).
- **Contract.** `definePlugin({ name, members, kernels, runtime, conflicts })`; members `property | style | context | fn`; grammars `as const` feed the existing `Matches<G, S>` unchanged (checked with tsgo and tsc); kernel by key into `_.k`; runtime declared as data (`polyfills: BcdKey[]`, `parentVars`), decided by BCD against the browserslist targets. Delivered by an import that the client transform adds per used plugin (`virtual:cssints/runtime/<plugin>`), which tree-shakes by construction.
- **Icons** map to a `style` member plus a mask kernel and one `--_svg` class per icon, no runtime; one engine change (definition sites may return plugin values).
- **WebKit-only properties**: a built-in list. LightningCSS passes all five through untouched; a plugin would be data behind a contract. `property()` is how users add more.
- **Recommendation.** 0.1: no public plugin API; ship the internal seams (kernel by key in `_.k`, `markers`/`kernels` on the style node, `lacking(bcdKey, targets)`) and the five properties as a built-in list. 0.2: the public contract with `frame()` as first consumer and the runtime engine, then icons. Later: `surface()`, `fn()`, `inherit()` behind `@supports`.
