---
# cssints-rq2r
title: 'Plugin API: registered properties and functions, build-time lowering, runtime polyfills'
status: todo
type: task
priority: normal
tags:
    - wayfinder:research
created_at: 2026-09-29T15:06:15Z
updated_at: 2026-09-29T15:06:47Z
parent: cssints-vy0o
---

## Question

Icons (packages/plugin-icon) and CSS features that browsers lack (for example anchor positioning or container queries on old targets) could be cssints plugins. Nonstandard properties are mostly not a plugin case: LightningCSS emits vendor prefixes and legacy flexbox from the browserslist targets, and the rest is dead, except ~5 live WebKit-only properties (see cssints-lmru). Decide whether those 5 are a built-in list or the first plugin. A plugin registers a property, function or keyword with a grammar in mdn value-definition syntax, lowers it at build time (`computeTo`), and optionally ships a runtime polyfill (`onElementMatch`/`onElementUnmatch`). A draft of this exists: ~/github/macros/docs/2026-04-27-oxc-macro-css-in-ts-design.md, section 6 "Polyfill Plugin API", inspired by CSS Parser Extensions.

- The current state of CSS Parser Extensions (explainer, spec drafts, Chrome status) and nearby prior art: Houdini (Properties and Values, Typed OM), PostCSS plugins and postcss-preset-env, CSS polyfill runtimes (e.g. the css-typed-om polyfill already noted, container-query and anchor-positioning polyfills), and how each registers syntax and decides when a polyfill runs.
- Review the ../macros draft against our engine as it is now (docs/API.md; docs/wayfinder.md): what carries over, what was tied to the old engine (VFS, Rust pipeline, QuickJS), what is missing.
- How it maps: a grammar string `as const` in the plugin feeds our type-level recognizer and the runtime twin, so plugin properties get typed functions; the plugin is a build-time module imported with `with { type: \"cssints\" }`; `computeTo` returns css values or Typed OM; runtime polyfills as one chunk included only when a browserslist target needs it (decided from BCD, as the support warnings are); how plugin-icon would look on it.
- What 0.1 needs at minimum for nonstandard properties and icons, and what can wait.

Answer: findings in docs/research/plugins.md, an API sketch in TS, and a recommendation with the scope for 0.1.
