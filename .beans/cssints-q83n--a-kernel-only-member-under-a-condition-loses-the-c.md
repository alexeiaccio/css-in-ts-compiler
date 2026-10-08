---
# cssints-q83n
title: A kernel-only member under a condition loses the condition silently
status: in-progress
type: bug
priority: high
created_at: 2026-10-08T14:10:21Z
updated_at: 2026-10-08T14:26:40Z
---

Found by balance (cssints-q6il, repro under "## Engine gaps"). `hover(pretty())` applies everywhere, with no error: a member whose style is only a kernel marker has no class of its own for the condition to wrap.

## Todo
- [ ] decide: a build error (`pretty() has no declarations a condition can wrap`) or emit the kernel's declarations under the condition
- [ ] fix at the root (conditions over a style with only markers), a fixture
