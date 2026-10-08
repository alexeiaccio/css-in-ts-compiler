---
# cssints-sbs8
title: Members carry a group() marker for within()
status: in-progress
type: feature
priority: normal
created_at: 2026-10-08T14:10:21Z
updated_at: 2026-10-08T15:29:33Z
---

Found by stuck (cssints-z1hd, repro under "## Engine gaps"). A member cannot add a `group()` marker, and `within()` only reads `_g-<name>`, so `sticky()` wraps its chain in a Proxy that adds `group("stuck")` at each step.

## Todo
- [x] a `group` field on a member (or a kernel) that adds the marker
- [ ] drop stuck's Proxy
