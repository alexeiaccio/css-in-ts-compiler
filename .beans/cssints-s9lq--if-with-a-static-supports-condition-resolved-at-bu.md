---
# cssints-s9lq
title: if() with a static supports() condition resolved at build time
status: todo
type: feature
created_at: 2026-10-17T10:21:20Z
updated_at: 2026-10-17T10:21:20Z
---

Research: docs/research/unshipped-specs.md (2026-10-17, cssints-sh52). Ranked 4, class A (partly). Chrome and Edge 137 ship if(); Firefox and Safari do not.

- [ ] scope: only conditions the build knows (supports(), the targets of the browserslist); style(), media() and attr() tests stay runtime and the plugin then does nothing
- [ ] decide the surface: a value fn() `when(supports(...), a, b)` or a lowering of a real if() in a declaration
- [ ] tests against Chrome (native if) and the build output for old targets, docs, changeset
