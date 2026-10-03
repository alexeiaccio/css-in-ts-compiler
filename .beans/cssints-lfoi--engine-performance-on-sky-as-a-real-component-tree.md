---
# cssints-lfoi
title: Engine performance on sky as a real component tree
status: in-progress
type: task
created_at: 2026-10-03T12:48:57Z
updated_at: 2026-10-03T12:48:57Z
---

Asked by the user (2026-10-03). The last measurement was in 0.1 (packages/cssints/test/perf.mjs, demo-sized). Measure on apps/sky: cold build, dev cold start and first page, HMR latency on a style edit and a component edit, per-module transform cost (top modules), share of time in the Module Runner eval vs oxc walk vs twin checks vs LightningCSS vs sheet render, type-check cost (tsgo/tsc instantiations of sky's src) and editor latency (bench/lsp.mjs on a sky file). Profile, name the hot spots, fix clear wins outside files another session is editing, report the rest as follow-ups.
