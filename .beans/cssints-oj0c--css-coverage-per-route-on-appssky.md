---
# cssints-oj0c
title: CSS coverage per route on apps/sky
status: draft
type: feature
created_at: 2026-10-09T07:45:40Z
updated_at: 2026-10-09T07:45:40Z
parent: cssints-dk1q
---

From cssints-0a3p (docs/research/devtools.md). Playwright's page.coverage.startCSSCoverage works on the sheet as is (demo: 79% of the built sheet used on load). With one global sheet per app, the share of it each route uses is the measure for the one-sheet decision: run it over sky's five routes with the recorded fixtures (as test/browser.mjs), report bytes used per route and the union; optionally @projectwallace/css-code-coverage for thresholds.
