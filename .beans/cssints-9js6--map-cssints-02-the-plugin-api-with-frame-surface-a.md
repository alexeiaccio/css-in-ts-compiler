---
# cssints-9js6
title: 'Map: cssints 0.2, the plugin API with frame(), surface() and icons'
status: todo
type: epic
priority: normal
tags:
    - wayfinder:map
created_at: 2026-09-30T11:57:32Z
updated_at: 2026-09-30T12:23:00Z
---

## Destination

A public plugin API (`definePlugin` with `property`, `context` and `style` members, kernels by key in layer `_.k`, a declarative runtime included only when a browserslist target lacks a feature) with three consumers built on it: `frame()`, `surface()` and icons. They work end to end in `apps/demo`, which type-checks with tsc and tsgo; the packages stay packable and unpublished. The fog carried from 0.1 (error DX, derived tokens, value helpers, sublayers) is either shipped or ruled out.

## Notes

- Log findings in `docs/wayfinder.md`; the map only indexes them.
- Tracker is beans. A ticket is a child of this epic with a `wayfinder:<type>` tag. Claim a ticket by setting it `in-progress`. The frontier is `beans list --ready --parent <this map>`.
- Execution is allowed on this map, as on 0.1 (cssints-vy0o): a decision ticket may end with an implementation ticket that does the work. Implementation runs on Sonnet subagents in `.worktrees/<branch>`; the coordinator merges and runs every check (AGENTS.md).
- Start from the research: docs/research/plugins.md (contract §4, runtime delivery §5, icons §6, scope §8, prototype in plugins-proto/) and docs/research/surfaces-frames.md (kernels §2, floor §5, mapping §6).
- Standing preferences: tsgo is primary and tsc 5.9 stays green; every type-level change is checked with `bun run bench`; minimal code (ponytail); Effect TS 4 where there are side effects, the sync `css.*` builders and the browser runtime stay plain; Vite 8 only; not published (MIT).
- After a harness crash, never reuse or move a worktree: give the retry a new branch in a new directory.

## Decisions so far

- [Plugin contract: registration, naming and types](cssints-zho2): an attributed import, no registration and no `definePlugin`; `context/style/property` in `cssints/plugin` carry kernel, runtime and conflicts; `cssints/frame`, `cssints/surface`, `@cssints/icons`; name collisions are build errors.

## Not yet specified

- Derived tokens (`contrastColor()` in CSS, `derive()` at build time) and JSON token input with generated types (cssints-exof). May sharpen once `surface()` shows what a derived colour needs.
- Value helper functions (`css.colorMix(...)`, API.md "Functions"): whether they exist next to typed string parts, and how they are typed. Tied to the plugin `fn()` member, which the research put after "Functions" is specified.
- Shorthand vs longhand through sublayers instead of sort order (`_.a.a/_.a.b/_.a.c`, depth from mdn-data `computed`, max depth 2). Deferred on 2026-09-29; revisit only if the sort order shows a real case it gets wrong, or rule it out.

## Out of scope

- Publishing to npm (decided 2026-09-30 for this map too): packable (`bun run test:smoke`) but unpublished.
- Bundlers other than Vite; a non-compiled runtime mode.
- The `inherit()` emission of the kernels: a plugin update behind `@supports` once two engines ship it.
- The plugin `fn()` and `keyword` members (see the value-helper fog for `fn()`).
