---
# cssints-6fau
title: The menu differential walk diverges when the machine is loaded
status: todo
type: bug
priority: high
created_at: 2026-11-15T15:59:21Z
updated_at: 2026-11-15T15:59:21Z
---

`test/menu.browser.test.tsx > createMenu (checkable) x menu-checkable.qnt (differential walk)` failed **4 of 11** configurations in a full-suite run, and passed **77/77** when the same file ran alone — twice, with and without an unrelated change stashed. Configurations: `variant: mixed` with `controlled: true`, `accepts` true and false, `value` 3 and 7.

Evidence: full run — `Tests 4 failed | 1423 passed`; single file — `77 passed | 44 skipped (19.9s)`; the same file on a stashed tree — `77 passed`. So it is **load- or timing-sensitive**, not a seed and not a change.

This matters more than a normal flake because the walk *is* the oracle for the primitive: a real divergence looks exactly like this. It also blocks the 'run the headless suite in CI' fix (see the CI bean) — a 2-minute gate that fails one run in three trains people to ignore it.

**Direction**: the walk drives the DOM and the model with the same steps and compares after each; under load the DOM settle wins or loses a race (the file's own `tick`/settle helpers). Make the observation deterministic — await the settled state per step rather than a fixed turn — the same fix `6uih` was filed for on the canvas walks.
