---
# cssints-03hk
title: The ui conformance suite is red in CI and green locally
status: todo
type: bug
priority: high
created_at: 2026-11-19T20:03:31Z
updated_at: 2026-11-19T20:03:31Z
---

The `ui` workflow fails on master (`d6783155`) and failed on the same code in PR #227 (`4a32347c`): the menu and menubar differential walks report `focus: "menuitem"` where the spec says `menuitem:4`, plus `trigger[aria-expanded]` and `menu[hidden]` mismatches. The signature says the probe resolved a menuitem that is not in its indexed list — a stale element from another mount, or a probe that ran before the fixture was ready.

Locally the same suite is green, four times: the two files alone (111 passed each, three runs) and the whole `apps/ui` suite (69 files, 1020 passed). So it is environment- or timing-dependent, not a plain regression.

Evidence to start from:
- `gh run view 44600046579 --log-failed` (PR) and the master run for `d6783155` carry the same diff.
- `5ebf4821` (18:19) was the last green `ui` before #225 merged; every real run after it is red — #225 touched `tabs.ts` and `workspace.ts`, not `focusgroup.ts` or `menu.ts`, so the correlation may be the CI machine rather than the change.
- The failed master job was re-run once; if the re-run is green, this is a flake and the fix is to make the probe wait for the fixture instead of trusting the DOM.

Why high: `ui` is the gate, so master sits red and every PR merges red until this is answered.


## Resolution

The failed master job was re-run and passed, and every `ui` run on master after it has been green (three in a row). So the signature above is a CI-environment flake, not a regression, and the gate heals on re-run.

What is worth doing eventually: the probe trusts the DOM at the moment it reads it. The failing diff (`focus: "menuitem"` instead of `menuitem:4`, `menu[hidden]` `null` where the spec has `"?"`) is what a read against a half-mounted fixture looks like. Making the walk wait for the fixture (the way `canvas.fixture` settles two frames before a read) would remove the class, not just the instance.
