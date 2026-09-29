---
# cssints-tmv8
title: 'Restart cssints: build engine and type-safe values'
status: completed
type: epic
priority: normal
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-29T13:28:04Z
---

Restart of the CSS-in-TS compiler after five failed macro-engine attempts. The shared root cause: macro arguments were captured as source text, not values. Findings, tables and decisions live in `docs/wayfinder.md`.

Direction:
- Engine: own thin Vite plugin on the Module Runner (`spikes/runner`).
- Types: type-level recognizer over verbatim mdn-data grammar strings (`spikes/typelevel/css.ts`), with a runtime twin (`twin.ts`) as the build-time check.
- Values: CSS Typed OM as the object model. LightningCSS is only the optimizer.
- tsgo is the primary target, and tsc 5.9 must stay green.

## Summary of Changes
The restart reached its goal: engine (Vite Module Runner plugin, HMR checked by a Quint model), types (type-level recognizer over mdn-data with a runtime twin, budgets, differential tests against Chrome), Typed OM values, browser support warnings and prose rules. The spikes were promoted to `packages/cssints` and `packages/css-grammar` (`cssints-vq75`). Work continues on the map `cssints-vy0o`; the open bug `cssints-wiqx` moved there.
