---
# cssints-oj0c
title: CSS coverage per route on apps/sky
status: in-progress
type: feature
priority: normal
created_at: 2026-10-09T07:45:40Z
updated_at: 2026-10-09T09:01:09Z
parent: cssints-dk1q
---

From cssints-0a3p (docs/research/devtools.md). Playwright's page.coverage.startCSSCoverage works on the sheet as is (demo: 79% of the built sheet used on load). With one global sheet per app, the share of it each route uses is the measure for the one-sheet decision: run it over sky's five routes with the recorded fixtures (as test/browser.mjs), report bytes used per route and the union; optionally @projectwallace/css-code-coverage for thresholds.

## Todo

- [x] apps/sky/test/coverage.mjs: build, serve with the fixtures, rule usage per route (load and after interactions), union, unused by selector and source
- [x] test:coverage script (not in test)
- [ ] docs/research/coverage.md: is per-route splitting worth it, what is dead, recommendation
- [ ] follow-up bean for what is dead (if anything)
- [ ] wayfinder entry
