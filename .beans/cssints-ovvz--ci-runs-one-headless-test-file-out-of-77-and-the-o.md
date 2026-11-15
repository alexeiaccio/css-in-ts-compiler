---
# cssints-ovvz
title: CI runs one headless test file out of 77, and the other 1426 tests hide real reds
status: completed
type: bug
priority: high
created_at: 2026-11-15T15:59:21Z
updated_at: 2026-11-15T21:30:00Z
---

`packages/headless` holds 77 browser test files (1426 passing tests, 1234 skipped fixtures). The only one any workflow runs is:

`,.github/workflows/ui.yml`:
```
- name: The headless primitives' request/commit guard
  working-directory: packages/headless
  run: bunx vp test run test/controllable.test.ts
```

The comment there says it is the one suite nobody else runs — true, and that is the problem: everything else in the package is unchecked. What that hides, found today in one afternoon:

- `test/drawer.browser.test.tsx` was red on master — the native-dialog landing removed `tabindex` from the shell's panel and the test was the only thing that noticed;
- `apps/ui`'s own suite was red on master twice for the same class (`shortcuts`, then `combos`) and CI *did* see those, so the headless gap is strictly worse: a primitive can regress and the gate is green.

**Fix**: run the package's suite in `ui.yml` (it is the same browser job, ~2 minutes), or in a workflow of its own on `packages/headless/**`. It also needs the flake fixed first — see the differential-walk bean — because a 2-minute job that fails one run in three is worse than none.

## Done

`.github/workflows/ui.yml` now runs the package's suite in place of the single-file step:

```yaml
      - name: The headless primitives' suite
        working-directory: packages/headless
        timeout-minutes: 12
        run: bun run test
```

with `packages/headless/package.json` added to both `paths` lists (a new dependency is a reason to run it). The job
already installs Chromium (`bunx playwright install --with-deps chromium` in `apps/ui`, the same pinned `playwright`
1.64.1 the package uses) and already builds the packages first.

**Cost:** 130-131 s wall clock on this machine (77 files, 1427 passed, 1234 skipped fixtures), and green under doubled
load. `timeout-minutes: 12` leaves room
for a loaded runner without hiding a hung walk (`vite.config.ts` already caps a single test at 60 s).

It lands only because `cssints-6fau` closed: five consecutive green runs of the suite, plus two under artificial load.
