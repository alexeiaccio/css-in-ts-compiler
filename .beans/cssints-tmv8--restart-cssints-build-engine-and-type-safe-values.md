---
# cssints-tmv8
title: 'Restart cssints: build engine and type-safe values'
status: in-progress
type: epic
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T08:10:17Z
---

Restart of the CSS-in-TS compiler after five failed macro-engine attempts. The shared root cause: macro arguments were captured as source text, not values. Findings, tables and decisions live in `docs/wayfinder.md`.

Direction:
- Engine: own thin Vite plugin on the Module Runner (`spikes/runner`).
- Types: type-level recognizer over verbatim mdn-data grammar strings (`spikes/typelevel/css.ts`), with a runtime twin (`twin.ts`) as the build-time check.
- Values: CSS Typed OM as the object model. LightningCSS is only the optimizer.
- tsgo is the primary target, and tsc 5.9 must stay green.
