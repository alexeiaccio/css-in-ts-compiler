---
# cssints-zdaa
title: Research arktype dual (runtime + type) parser API
status: completed
type: task
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T08:10:17Z
parent: cssints-tmv8
---

## Summary of Changes
- Studied arktype 2.2.3 `ark/type/parser`: `StaticState`/`RuntimeState` twins, a shift-reduce parser over the raw string, `ErrorMessage` threaded through the state, and `attest` instantiation tests.
- Decision: add a runtime twin in the arktype style as the build-time check (not LightningCSS or Effect Schema).
