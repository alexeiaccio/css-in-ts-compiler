---
# cssints-o8kt
title: 'WAAPI where it pays: the inspector and the tests, not the primitives'
status: todo
type: task
priority: normal
created_at: 2026-11-14T10:09:53Z
updated_at: 2026-11-17T06:34:47Z
---

The repo's WAAPI usage is already in the right layer and nowhere else: `@cssints/headless` uses **none** of it (grep), the skins do (`apps/ui/src/registry/drawer/drawer.tsx:499` `element.animate`, the toast/drawer fixtures `getAnimations()`), and devtools asks the one boolean it needs (`packages/devtools/src/core/dom.ts:150`).

Three uses that pay, in order:

1. **Browser tests instead of sleeps.** `row.getAnimations().find((a) => a.id === id)`, then `a.finish()` or `a.currentTime = x` — deterministic assertions that an animation ran, and a way to end it without waiting. The pattern exists (`toast.browser.test.tsx:65,299,318`, `drawer.fixture.tsx:249`) but is not applied to the primitives with motion (menu, VT, skeleton, drawer tests).
2. **The X-ray.** `dom.ts:150` already knows *that* something animates; showing *what* is `animation.effect.getKeyframes()` + `getComputedTiming()`, and two inspector one-liners: slow motion (`getAnimations().forEach((a) => (a.playbackRate = 0.25))`) and a reduce-motion preview (`…forEach((a) => a.finish())`) — exact, no CSS restart.
3. **Runtime retiming of a `motion` preset** (transient demos), not a replacement for it: `packages/motion` is CSS keyframes already and should stay that way.

**Where it does not go**, written down so nobody re-litigates it: the canvas (tick-driven frames keep the differential walk deterministic — `prefs.ts` says so), the virtualizer (measurement and windowing; WAAPI cannot animate `scrollTop`, and row enter/exit is View Transitions' `match-element`, not WAAPI), and the View Transitions fallback (a correct FLIP fallback needs rects and clones, so it is a **skin**, not a primitive; and VT is Baseline since October 2025, so its value shrinks every month).

## Done in #205 (2026-11-17)

**1. Tests ask the animation instead of sleeping.** Four motion waits replaced, each now failing for the reason it is named for: drawer's `settleSlide` (260 ms for a 200 ms slide) finishes the sheet's transition; menubar's `setTimeout(200)` for the chevron's 120 ms turn is a frame plus `finish()` (a transition is created on the frame *after* the attribute changes — the sleep was hiding that); donut's 250 ms hover-lift sleep finishes the `::before` transition; resizable-panels' `settleMotion` (200 ms for a 160 ms grid ease) finishes the grid's transition. Still timers, with reasons: a toast's expiry, a tooltip's 300 ms grace, panzoom's velocity window, the carousel's autoplay interval, canvas tweens (tick-driven for the differential walk), and every `settle()`/`tick()` that waits on Solid's flush. **Left:** the VT and skeleton motion waits.

`Element.getAnimations()` returns **nothing** for a pseudo-element's transition (measured in Chromium: 0 for a `::before` lift, while `document.getAnimations()` has it as `target: el, pseudoElement: \::before\`). So the element-scoped helpers ask `document.getAnimations()` and filter by the effect's target (`target === el`, or `contains` for a subtree).

**2. The X-ray.** The panel's Motion section, in `packages/devtools/src/ui/overlay.tsx`, below the properties: one row per running animation from `document.getAnimations()` (transitions included) — the properties its keyframes set, `duration easing`, the `animation-name` / transitioned property / WAAPI id, the pseudo-element, the play state; `slow motion ×0.25` (playbackRate on every running animation and back to 1, kept on for what starts later, dropped when the panel closes) and `reduced motion preview` (`finish()` on every running animation, infinite ones skipped). Read on the panel's existing 600 ms timer — no frame loop, no live region. A CSS animation's `animation-timing-function` is the keys' easing and the effect reports `linear`, so the easing shown is the frames' when the effect says `linear` (`getComputedTiming().easing` alone printed `linear` for `ease-in-out`; the browser check caught it). Browser check: `packages/devtools/test/motion-browser.mjs` (in `test:browsers`).

**The `animated` flag** (`packages/devtools/src/core/dom.ts:150`) had the same blind spot and now uses the same rule: `el.ownerDocument.getAnimations()` filtered to `target === el`, so a `::before` transition is motion on the element. Pinned in `packages/devtools/test/core.mjs` (the only test that runs the real `domPage.verify`), which fails if the flag goes back to `el.getAnimations()`.

**3. Runtime retiming** was not done: `packages/motion` stays CSS keyframes.

Found on the way, for other beans: pre-existing lint errors on master (`packages/tui/test/system.ts`, `render.ts`, `packages/headless/test/confirm-native.browser.test.tsx`); 41-file `fmt:check` drift including `docs/API.md`; a stray committed `packages/devtools/probe.tmp.mjs` (a scratch probe from `142d873f`); and `verify()`'s flag can only explain a mismatch the element's *own* value shows, so a pseudo transition is visible to the row but cannot be the cause of one.
