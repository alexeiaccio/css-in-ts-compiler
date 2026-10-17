---
# cssints-edph
title: 'fit-content(L) on size properties: approximation for browsers without it'
status: todo
type: task
created_at: 2026-10-17T10:21:20Z
updated_at: 2026-10-17T10:21:20Z
---

Research: docs/research/unshipped-specs.md (2026-10-17, cssints-sh52). Ranked 5, class A (approximation). Firefox flag since 91, rest false. The fallback is not exact.

- [ ] decide whether an approximation is honest enough to ship (min(max-content, max(min-content, L)) in a width context)
- [ ] if yes: a lowering with a support warning; if no: record the decision here and close
