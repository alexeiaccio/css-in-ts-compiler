---
# cssints-w597
title: 'Copy-carried conformance tests: menu, tooltip, select, spinbutton (+ dialog fix)'
status: completed
type: task
priority: normal
created_at: 2026-11-02T10:10:05Z
updated_at: 2026-11-02T11:34:48Z
---

Add tested:true conformance tests for the styled menu, tooltip, select and spinbutton starters, and verify/fix dialog's.

- [ ] menu fixture, driver, browser test
- [ ] tooltip fixture, browser test
- [ ] select fixture, browser test
- [ ] spinbutton fixture, driver, browser test
- [ ] dialog: verify test runs, report with/deps
- [ ] verify: per-item vitest, full suite, typecheck, fmt, lint, release:check
- [x] commit and push

## Summary of Changes

- menu: menu.fixture.tsx, menu-driver.ts (byte copy of the headless driver), menu.browser.test.tsx: checkable and plain walks plus the ported menu-button/checkable scenarios; `Menu` gained an `onReady` accessor for the fixture.
- spinbutton: spinbutton.fixture.tsx, spinbutton-driver.ts (byte copy), spinbutton.browser.test.tsx: both ported suites, five walk configs, its own disabled case.
- select: select.fixture.tsx + a focused DOM test (no scenario walk/driver).
- tooltip: tooltip.fixture.tsx + a focused DOM test (the kit hides its group, one trigger, no timer props).
- dialog: existing test verified (18 pass); the item's `with` still needs `input/input.tsx` for its fixture's flattened `./input.tsx`.
- Verified: per item 109/6/9/17/18 pass; full apps/ui suite 583 pass with two load-flaky walks that pass alone; typecheck, vp fmt, vp lint, release:check green.
