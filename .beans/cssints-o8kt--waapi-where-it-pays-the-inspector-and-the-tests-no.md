---
# cssints-o8kt
title: 'WAAPI where it pays: the inspector and the tests, not the primitives'
status: todo
type: task
created_at: 2026-11-14T10:09:53Z
updated_at: 2026-11-14T10:09:53Z
---

The repo's WAAPI usage is already in the right layer and nowhere else: `@cssints/headless` uses **none** of it (grep), the skins do (`apps/ui/src/registry/drawer/drawer.tsx:499` `element.animate`, the toast/drawer fixtures `getAnimations()`), and devtools asks the one boolean it needs (`packages/devtools/src/core/dom.ts:150`).

Three uses that pay, in order:

1. **Browser tests instead of sleeps.** `row.getAnimations().find((a) => a.id === id)`, then `a.finish()` or `a.currentTime = x` — deterministic assertions that an animation ran, and a way to end it without waiting. The pattern exists (`toast.browser.test.tsx:65,299,318`, `drawer.fixture.tsx:249`) but is not applied to the primitives with motion (menu, VT, skeleton, drawer tests).
2. **The X-ray.** `dom.ts:150` already knows *that* something animates; showing *what* is `animation.effect.getKeyframes()` + `getComputedTiming()`, and two inspector one-liners: slow motion (`getAnimations().forEach((a) => (a.playbackRate = 0.25))`) and a reduce-motion preview (`…forEach((a) => a.finish())`) — exact, no CSS restart.
3. **Runtime retiming of a `motion` preset** (transient demos), not a replacement for it: `packages/motion` is CSS keyframes already and should stay that way.

**Where it does not go**, written down so nobody re-litigates it: the canvas (tick-driven frames keep the differential walk deterministic — `prefs.ts` says so), the virtualizer (measurement and windowing; WAAPI cannot animate `scrollTop`, and row enter/exit is View Transitions' `match-element`, not WAAPI), and the View Transitions fallback (a correct FLIP fallback needs rects and clones, so it is a **skin**, not a primitive; and VT is Baseline since October 2025, so its value shrinks every month).
