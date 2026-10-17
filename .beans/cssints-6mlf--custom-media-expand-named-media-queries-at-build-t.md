---
# cssints-6mlf
title: '@custom-media: expand named media queries at build time'
status: todo
type: feature
created_at: 2026-10-17T10:21:20Z
updated_at: 2026-10-17T10:21:20Z
---

Research: docs/research/unshipped-specs.md (2026-10-17, cssints-sh52). Ranked 2, class A. Firefox has it behind a flag, no other engine.

- [ ] syntax and where the name is declared (a plugin or a cssints option; css.media(...) with a name)
- [ ] expand the name in every @media at build time, in dev and build, with HMR of the declaring module
- [ ] errors: unknown name, cycle, a name used before it is declared
- [ ] tests, docs/API.md, changeset
