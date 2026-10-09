---
# cssints-oj0c
title: CSS coverage per route on apps/sky
status: completed
type: feature
priority: normal
created_at: 2026-10-09T07:45:40Z
updated_at: 2026-10-09T09:07:07Z
parent: cssints-dk1q
---

From cssints-0a3p (docs/research/devtools.md). Playwright's page.coverage.startCSSCoverage works on the sheet as is (demo: 79% of the built sheet used on load). With one global sheet per app, the share of it each route uses is the measure for the one-sheet decision: run it over sky's five routes with the recorded fixtures (as test/browser.mjs), report bytes used per route and the union; optionally @projectwallace/css-code-coverage for thresholds.

## Todo

- [x] apps/sky/test/coverage.mjs: build, serve with the fixtures, rule usage per route (load and after interactions), union, unused by selector and source
- [x] test:coverage script (not in test)
- [x] docs/research/coverage.md: is per-route splitting worth it, what is dead, recommendation
- [x] follow-up bean (nothing of sky is dead; cssints-5jj1: the page.coverage layer artifact behind the demo figure, fixtures for the /dev/posts-only rules)
- [x] wayfinder entry

## Summary of Changes

- apps/sky/test/coverage.mjs (`bun run test:coverage`, not in `test`): builds sky, serves it with the recorded fixtures, measures each route (home, profile, thread, settings, 404) on load and after interactions (breakpoint sweep, hover, focus, dark, reduced motion, tabs, paging, states, settings modes/hue/squares) through CDP rule usage, /dev/posts on the dev server matched by at-rules and selector, and names every rule with its source from the dev sheet map. Prints per route, the union, the size of a sheet per route and every unused rule.
- page.coverage counts every rule inside a used @layer block (Chrome reports the block as one used range), so it reads 80.1 % on every sky route; the script counts leaf rules from CDP instead.
- Result: routes use 49-74 % of the style-rule bytes, the union 95.3 %; a sheet per route saves 0.7-1.0 KB gzip of 7.6 KB: keep one sheet. Nothing of sky is dead: 12 rules are content only /dev/posts has, 3 are the cssints style-query fallback.
- docs/research/coverage.md, a wayfinder entry; follow-up cssints-5jj1 (draft).
