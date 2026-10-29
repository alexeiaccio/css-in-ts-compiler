---
# cssints-wyoy
title: 'appear(): scroll-triggered motion presets (timeline-trigger + animation-trigger)'
status: in-progress
type: feature
created_at: 2026-10-29T09:51:10Z
updated_at: 2026-10-29T09:51:10Z
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
- [ ] A second kernel + runtime entry in revealScope: `timeline-trigger`, `animation-trigger`, `trigger-scope`, motion's keyframes and vars; built-in `@supports not (animation-trigger: none)` pause rule
- [ ] The `appear` chain: the shared methods + `inOut()`; export next to `reveal`
- [ ] runtime.ts: gate per feature (`animation-trigger`), observe `._reveal-appear` too
- [ ] Fixtures, a build-error (conflict) case, grammar errors, the fallback by targets; browsers.mjs: Chrome native, Firefox/WebKit and forced fallback
- [ ] README (the difference, rules, limits), API.md row, wayfinder entry, changeset (reveal minor)
