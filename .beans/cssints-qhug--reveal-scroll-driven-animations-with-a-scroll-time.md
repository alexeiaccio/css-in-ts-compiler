---
# cssints-qhug
title: 'reveal(): scroll-driven animations with a scroll-timeline polyfill'
status: completed
type: feature
priority: normal
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T15:34:21Z
parent: cssints-dk1q
blocked_by:
    - cssints-11pj
---

## What
`reveal().preset("fade-up").range("entry 0% entry 100%")`: `animation-timeline: view()` natively, flackr's scroll-timeline polyfill as the runtime for targets that lack it.

## Sources
- https://github.com/the-illarionov/the-supersonic-plugin-for-scroll-based-animation
- https://github.com/alexfoxy/lax.js
- https://github.com/bramus/ie-page-transitions (view transitions, a later member)

## Shape
- builds on motion()'s presets; `polyfills: ["css.properties.animation-timeline"]`.

## Todo
- [x] kernel + chain
- [x] runtime entry with the polyfill (an IntersectionObserver runtime instead of flackr's polyfill: README)
- [x] fixture

## Engine gaps

1. **A runtime cannot ship a script of its own.** `runtime: { polyfills, parentVars?, css? }` delivers fallback CSS or `cssints/parent-vars`; `runtimeModule` (packages/cssints/src/delivery.ts) returns `export {};` for any other runtime, so `virtual:cssints/runtime/reveal.io` is always empty. Repro: `scope("x", { "#k": { css: "&{color:red}" }, "#r": { polyfills: ["css.properties.animation-timeline"], css: "&{opacity:1}" }, m: { uses: ["k", "r"], chain: { a: { args: "<time>", emit: (v) => [["--_a", v]] } } } })`, BROWSERSLIST=firefox 128: the fallback CSS is in the sheet, the runtime module is `export {};`. Workaround: the script is `@cssints/reveal/runtime`, imported by the app (it probes and stays off where the timeline works). Proposal: `runtime: { script: "<specifier>" }`, imported by the runtime module when `needed()`.
2. **Support warnings of a kernel written as styles are not covered by a runtime's `polyfills`.** Only `requires` is. Repro: a kernel `css: (css) => [css.animationTimeline("view()"), css.animationRange("var(--_g)")]` in a member whose `uses` has a runtime with `polyfills: ["css.properties.animation-timeline", "css.properties.animation-range"]` warns, per module, `animation-timeline: the property in "view()" is not supported by ... firefox 140-156 ...` (and prints `var(--_g)`, not `var(--reveal-g)`, in the animation-range one). Workaround: those two declarations are a raw kernel (`"#view": { css: "&&{...}", requires }`), whose `requires` the runtime covers.
3. **No order between the kernels of one member.** The `animation` shorthand of kernel `core` resets `animation-timeline` and `animation-range`, which must win; nothing documents which kernel comes later in `_.k`. Workaround: the raw kernel's selector is `&&` (the class twice), which wins by specificity.

## Follow-ups

- @cssints/motion could export the names of its custom properties (or its `emitPreset`): reveal writes `--motion-o`, `--motion-x`, ... by hand (its test fails if motion renames them).

## Summary of Changes

- packages/reveal (@cssints/reveal, depends on @cssints/motion): `reveal().preset().range().duration().easing()`, a chain member over two kernels: `core` (motion's `motionKeyframes.in` / `reducedIn` named in vars, defaults that reset `--motion-*`, `animation: ... both`, motion's reduced-motion rule) and `view` (`animation-timeline: view(); animation-range: var(--reveal-g)`, `requires` both BCD keys). Presets are motion's entrance presets, set from motion's `presets` table; nothing copied.
- Fallback: a CSS runtime (`polyfills` = both keys) adds `@supports not (animation-timeline:view()){[data-reveal] &:not([data-reveal-in]){animation-play-state:paused}}` only when a target lacks the feature, and `@cssints/reveal/runtime` (536 B min, 319 B gzip; IntersectionObserver + MutationObserver, off where `CSS.supports` says yes) plays it once on entry. Chosen over flackr's scroll-timeline polyfill (61 kB min / 17 kB gzip, scrubbed): README "Browsers".
- Tests: test/reveal.mjs (output, default / native / Firefox targets, runtime module, no warnings, conflicts, grammar errors), test/types/reveal.ts, test/browsers.mjs (`test:browsers`): Chrome 154 and WebKit 26.6 scrubbed natively, Firefox 155 by the fallback, the fallback forced in all three, and a control that fails without the fallback.
- README in motion's style.

## Engine gaps, resolved (2026-10-08)
- A runtime ships its own script: cssints-kuki (no manual import).
- Styles-kernel warnings covered by polyfills, `--_x` expanded in messages: cssints-rp0e (reveal's kernels merged into one, no doubled class).
- Order between two kernels of one member: cssints-life (overlap is a build error).
- Open: motion's custom property names (cssints-2mnh).
