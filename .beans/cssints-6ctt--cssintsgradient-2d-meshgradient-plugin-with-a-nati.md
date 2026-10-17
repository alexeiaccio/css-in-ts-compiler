---
# cssints-6ctt
title: '@cssints/gradient-2d: meshGradient() plugin with a native switch and a runtime polyfill; own BCD keys'
status: in-progress
type: feature
created_at: 2026-10-17T10:14:28Z
updated_at: 2026-10-17T10:14:28Z
---

User (2026-10-17): mesh first, as a scope() plugin; BCD entries with version_added: false are fine, an own key too. Design: docs/research/2d-gradients.md (cssints-sh52).

- [ ] own BCD keys for mesh-gradient() and freeform-gradient() (css-grammar support.ts get(): a small table that real BCD overrides), so polyfills/requires/script work
- [ ] package @cssints/gradient-2d (24th of the fixed group): meshGradient(), the syntax checked, the fallback, the @supports native branch
- [ ] the runtime (plain code, no Effect) that draws the mesh (bicubic patches) when the browser has no native function
- [ ] tests (maths in Node, build output, Chrome read-back), README, docs/API.md Plugin packages, changeset, RELEASING.md counts
