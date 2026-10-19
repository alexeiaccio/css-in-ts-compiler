---
# cssints-twtp
title: createGlobalTheme types do not map digit keys of a DTCG override
status: in-progress
type: bug
priority: normal
created_at: 2026-10-19T10:04:31Z
updated_at: 2026-10-19T10:05:56Z
---

docs/API.md says a DTCG file used as a theme maps a digit key such as `500` to `_500`, but the types of createGlobalTheme do not: a DTCG override with digit keys (`"0"`..`"15"`) fails with TS2345. Found with @cssints/tokens/madoromi (cssints-bm7a), whose ANSI colours are named instead.

## Todo
- [ ] Failing type test: a DTCG group with digit keys as the override of createGlobalTheme
- [ ] Map digit keys in the theme types as the run time does
