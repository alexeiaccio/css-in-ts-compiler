---
# cssints-ovvz
title: CI runs one headless test file out of 77, and the other 1426 tests hide real reds
status: todo
type: bug
priority: high
created_at: 2026-11-15T15:59:21Z
updated_at: 2026-11-15T15:59:21Z
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
