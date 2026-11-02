---
# cssints-3q55
title: The treeview differential walk exceeds its 15 s budget on a loaded machine
status: todo
type: bug
priority: normal
created_at: 2026-11-02T10:18:11Z
updated_at: 2026-11-02T10:18:11Z
---

The `createTreeview x spec (differential walk)` cases time out at 15 s when the machine is busy (several sessions run suites in parallel). One run failed at 15.1 s with `locator.click: Timeout 152 ms exceeded` on `getByRole("treeitem", { name: "Projects" })` — the walk had spent its whole budget.

Evidence, 2026-11-02, this worktree (`ui/workspace`, a change to `resizable-panels` only):

- full `packages/headless` suite: 8 files, 21 tests failed, every failure a 15 s timeout in a differential walk (button, checkbox, link, menu-button, player, switch, toast, treeview);
- each failing file alone: all pass except `test/treeview.browser.test.tsx`, which took ~100 s for 43 tests and failed 1–3 walks in most runs, passing one;
- `origin/master` alone in a fresh worktree: treeview passed twice, then failed once with a built `@cssints/apg-specs/dist` present (a one-off `{"multiSelectable":true}` failure in 761 ms, the rest timeouts).

The walks are correct-looking (the model and the DOM agree once one runs without contention) — the budget and the step cost are the suspects. Proposal: raise `testTimeout` for the differential-walk files only (the walks are bounded by `runs`/`steps`, not by wall time), or cache the decoded model per file. Not fixed here: the round only touched `resizable-panels`.
