---
# cssints-wyoy
title: 'appear(): scroll-triggered motion presets (timeline-trigger + animation-trigger)'
status: completed
type: feature
priority: normal
created_at: 2026-10-29T09:51:10Z
updated_at: 2026-10-29T10:27:23Z
---

A scroll-triggered sibling of `reveal()` in @cssints/reveal: the same motion presets, but the scroll only decides *when* the animation plays, not how — `timeline-trigger` + `animation-trigger` instead of `animation-timeline: view()`. The utilitybend article (2026-10-13) is the case: scrubbing an entrance makes it ooze with the scroll speed, triggers play a normal time-based animation with its own duration and easing.

`appear().preset("slide-in-up").duration("600ms").easing("linear").range("entry 100% exit 0%").inOut()`

Semantics:
- the same `preset`/`range`/`duration`/`easing` methods as `reveal()`, each once; the range is the *activation* range of the trigger (`entry 100% exit 0%` by default) — the element is fully in when it plays;
- default actions `play-once none`: it plays once and stays, which is what an entrance wants; `inOut()` is `play-forwards play-backwards`, so it plays back out when it leaves;
- the trigger is on the element itself, named by the kernel (`--reveal-t`), with `trigger-scope` on the same element: without it the last element in the document with that name would drive every card (checked in Chrome 156: with trigger-scope, two boxes of the same class trigger independently);
- an element below the fold stays at its from-frame (`animation-fill-mode: both`), plays on entry, and finishes in its own time;
- reduced motion: the opacity-only keyframes, as reveal() (motion's rule);
- where a target lacks triggers (Firefox, Safari today; Chrome/Edge 146+, Opera 130), the runtime pauses the animation until an IntersectionObserver marks the element entered, then plays it once — the fallback is exactly the default behaviour;
- deferred: a trigger element separate from the animated element (a tall section that triggers its children; \`css.timelineTrigger()\` by hand) and a `.from("--name")` method.

## Todo
- [x] A second kernel + runtime entry in revealScope: `timeline-trigger`, `animation-trigger`, `trigger-scope`, motion's keyframes and vars; built-in `@supports not (animation-trigger: none)` pause rule
- [x] The `appear` chain: the shared methods + `inOut()`; export next to `reveal`
- [x] runtime.ts: gate per feature (`animation-trigger`), observe `._reveal-enter` too
- [x] Fixtures, a build-error (conflict) case, grammar errors, the fallback by targets; browsers.mjs: Chrome native, Firefox/WebKit and forced fallback
- [x] README (the difference, rules, limits), API.md row, wayfinder entry, changeset (reveal minor)


## Engine gaps

- **Two kernels of one scope cannot declare one custom property.** Repro: a scope with `#core` (motion's keyframes,
  `--motion-o`, `--_k`, …) and a second kernel that runs the same keyframes declares the same properties →
  `cssints: kernels reveal.core and reveal.enter both declare --reveal-k: a plugin picks its own short custom-property
  names`. This is the documented rule (`addKernel`), and it holds across scopes too: `motion()` and `reveal()` on one
  page fail the same way. Workaround: `appear()`'s kernel carries its own copy of motion's keyframe declarations under
  its own names (`--reveal-enter-*`) and its presets set those; the `presets` table is reused. A second `@keyframes`
  pair is the cost (~200 bytes).
- **A private kernel and a member may not share a name.** `"#appear"` beside `appear` fails at build time:
  `cssints: reveal: #appear and appear share a name: rename one`, and `uses: ["appear"]` would resolve to the member,
  not the kernel (`entry()` prefers an unhashed key). Naming it with the hash (`uses: ["#appear"]`) type-checks by a
  hole but is undocumented, so the kernel is `#enter` (class `._reveal-enter`).

## Summary of Changes

`appear()` is a second chain member of `revealScope`. Its kernel `#enter` (class `._reveal-enter`) is the same entrance
as `reveal()`'s `#core`, but time-based: `animation: var(--reveal-enter-k) … both`, then
`timeline-trigger: --reveal-t view() var(--reveal-enter-g)`,
`animation-trigger: --reveal-t var(--reveal-enter) var(--reveal-leave)` and `trigger-scope: --reveal-t`, with reduced
motion on the opacity-only keyframes. The default actions are `play-once none`; `inOut()` sets
`play-forwards play-backwards`. Because two kernels may not declare one custom property (see Engine gaps), the kernel
defines its own keyframes and values under `--reveal-enter-*` instead of motion's `--motion-*`; motion's `presets`
table and `names` are reused, and `emitPreset` is parameterized by the target names.

- `src/index.ts`: `#enter` kernel, `#io-appear` runtime entry (`polyfills` the three BCD keys, `script`, the
  `@supports not (animation-trigger:none)` pause rule), the `appear` chain with `inOut()`, and `export const { reveal,
  appear }` with the JSDoc of both.
- `src/runtime.ts`: one script, two gates. `._reveal-core` when `animation-timeline: view()` is missing,
  `._reveal-enter` when `animation-trigger: none` is missing; nothing when both hold; the same `data-reveal` root
  marker, the same `IntersectionObserver` + `MutationObserver` and unobserve-on-entry for both.
- Tests: `test/fixtures/appear.ts`, `appear-conflict.ts`, `bad-appear-{range,preset}.ts`, `test/fixtures/appear/`
  (`page.ts`, `app.js`), `test/types/reveal.ts`; `test/reveal.mjs` asserts the appear class strings, kernel
  declarations and order (`animation` before `animation-trigger`), reduced motion, `inOut()`, the fallback by targets,
  both runtime modules (empty for all-trigger targets), the derived conflict with its call line, the two grammar errors
  and no support warnings. Modes: `native` (chrome 120, safari 26), `old` (firefox 128), `triggers` (chrome 146,
  safari 26: reveal native, appear's fallback for Safari) and `new` (chrome 146: both native, both runtime modules
  empty). `test/browsers.mjs` builds the appear page for chrome 156 and for chrome 120 + firefox 128, probes
  `CSS.supports`, runs the native trigger path where it exists (below the fold opacity 0 on a `DocumentTimeline`,
  opacity 1 after scrollY 600, still 1 after scrolling back) and the fallback (as built where triggers are missing,
  forced in Chrome), asserting `data-reveal` and `data-reveal-in`; the reveal runs and control are unchanged, and
  `state()` now reports the two gates apart because the one script marks `data-reveal` in WebKit for the appear gate
  while reveal's timeline is native.
- Docs: the README retitles the idea (scroll-driven vs scroll-triggered), adds the `appear()` example and its CSS,
  the rules (`trigger-scope` and why, play-once, `inOut()`, conflicts), Browsers (Chrome/Edge 146, Opera 130; the
  fallback; one script, two gates), Limits (trigger on the element itself, no `.from()`, the fallback ignores the range
  and `inOut()`); the package description, the `docs/API.md` row, the wayfinder entry and the minor changeset.
- Verified: `node test/reveal.mjs` (all four target modes), `bun run typecheck`, `bunx vp lint`,
  `bunx vp fmt --check`, `node test/browsers.mjs` in Chrome 156, Firefox 157 and WebKit 27.2, and
  `node packages/cssints/test/docs.mjs` (with `NODE_OPTIONS=--conditions=development`: the worktree has no `dist/`).
  The apps/docs build test was not run: it needs the packages' `dist/`, which the branch does not build.
