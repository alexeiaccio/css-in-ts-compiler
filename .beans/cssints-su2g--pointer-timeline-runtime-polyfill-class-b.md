---
# cssints-su2g
title: 'pointer-timeline: runtime polyfill (class B)'
status: todo
type: task
created_at: 2026-10-17T10:21:20Z
updated_at: 2026-10-17T10:21:20Z
---

Research: docs/research/unshipped-specs.md (2026-10-17, cssints-sh52). Ranked 7, class B. No BCD key; needs a script like @cssints/balance and the own-BCD-key table from cssints-6ctt.

- [ ] park until gradient-2d proves the runtime delivery of an own-key polyfill; then decide

## Checked against the engine (2026-10-17)

No overlap: nothing in the engine, the members or docs/API.md names \`pointer-timeline\`. It is in @webref/css 8.7.5 (pointer-animations-1) and Chrome 155 rejects it in CSS.supports; BCD has no key, so it needs the own-key table of cssints-6ctt first. Stays parked.
