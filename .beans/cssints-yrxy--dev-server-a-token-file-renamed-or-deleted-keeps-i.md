---
# cssints-yrxy
title: 'Dev server: a token file renamed (or deleted) keeps its @property, so a new declaration fails ''already declared'''
status: in-progress
type: bug
created_at: 2026-10-11T19:00:04Z
updated_at: 2026-10-11T19:00:04Z
---

Reproduced 2026-10-11 on the dev server: a.ts declares css.token.color("#ff0000", "brand"); rename a.ts to b.ts and change the value to #0000ff; transformRequest('/b.ts') fails: '--brand is already declared with another @property, in a.ts'. The registry's `properties` keep entries of a file that is gone: `forget(file)` (registry.ts) drops kernels, themes, checks but not properties/defs of that file, and hotUpdate on a delete only invalidates the dependents (forget is not called for the deleted file). Same stale state the playground worked around (cssints-1fq0 clears tokens per compile).

- [ ] failing test (dev server: rename with a new value, and delete then re-declare elsewhere)
- [ ] forget drops the file's @property/defs (and anything else keyed by file that survives: themed? globals?), hotUpdate forgets a deleted file
- [ ] the playground's per-compile clear can go if the engine handles it (check)
- [ ] Quint model / race test still green
