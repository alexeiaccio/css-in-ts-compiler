---
# cssints-ovvz
title: CI runs one headless test file out of 77, and the other 1426 tests hide real reds
status: todo
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

## Status: the patch is written, the landing is held

The step is ready (`packages/headless`'s suite, `timeout-minutes: 12`, `packages/headless/package.json` added to both
`paths` lists, ~110-125 s measured on this machine), but it does not land yet: the walk it would gate still fails about
one full run in three (see `cssints-6fau`, "Measured"), and this bean's own rule is that such a gate is worse than none.

Apply this when the walk is deterministic (the two primitive-side steps in `cssints-6fau`):

```yaml
      # The whole package, not one file: 77 browser test files — the differential walks against the Quint specs, the
      # ported scenario replays and the DOM oracles. This is the only workflow that runs any of them, so a primitive
      # that regresses otherwise lands green (a drawer lost its panel's tabindex that way). Chromium is the one
      # installed above: `apps/ui` pins the same `playwright` the package does, so it is the same revision.
      - name: The headless primitives' suite
        working-directory: packages/headless
        # ~2.5 min on a quiet runner; a walk is bounded by steps, not wall time, and `vite.config.ts` already
        # raises a single test to 60 s.
        timeout-minutes: 12
        run: bun run test
```

and, in both `paths` lists:

```yaml
      - packages/headless/package.json
```

The workflow already installs Chromium (`bunx playwright install --with-deps chromium` in `apps/ui`, the same pinned
`playwright` 1.64.1 the package uses), and already builds the packages first.
