---
# cssints-o3dz
title: Check @projectwallace/css-code-coverage on @layer blocks; report upstream
status: scrapped
type: task
priority: low
created_at: 2026-10-09T12:54:33Z
updated_at: 2026-10-09T14:03:35Z
parent: cssints-dk1q
---

Split from cssints-5jj1. Chrome reports a used @layer block as one range over all its rules and page.coverage merges the ranges (docs/research/coverage.md, 'Why not page.coverage'). Check whether @projectwallace/css-code-coverage, fed Playwright's coverage, counts every rule of a used layer; if so, report it upstream (and/or to Playwright) with the three-rule repro of coverage.md.

- [ ] run the three-rule repro through @projectwallace/css-code-coverage
- [ ] report upstream if it counts the whole layer

## Reasons for Scrapping
Not wanted by the user (2026-10-09): no upstream reports. The @layer coverage problem and the per-rule method stay documented in docs/research/coverage.md.
