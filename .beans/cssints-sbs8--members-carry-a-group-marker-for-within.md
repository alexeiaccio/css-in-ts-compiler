---
# cssints-sbs8
title: Members carry a group() marker for within()
status: completed
type: feature
priority: normal
created_at: 2026-10-08T14:10:21Z
updated_at: 2026-10-08T15:29:39Z
---

Found by stuck (cssints-z1hd, repro under "## Engine gaps"). A member cannot add a `group()` marker, and `within()` only reads `_g-<name>`, so `sticky()` wraps its chain in a Proxy that adds `group("stuck")` at each step.

## Todo
- [x] a `group` field on a member (or a kernel) that adds the marker
- [x] drop stuck's Proxy

## Summary of Changes

- `group: true` on a chain or call member (scope.ts ChainDef/CallDef, scope-engine.ts `grouped`): every style of the member carries `_g-<scope>` after its kernels' markers; `within(state, "<scope>")` reads it.
- Naming: the group is the scope's name (unique per process); a user's `group("<scope>")` is the same group, documented. One group per scope.
- A group marker is a marker: a condition around the member with no declaration stays a build error (cssints-q83n), and the error names the kernel.
- Tests in packages/cssints/test/scope.mjs; docs/API.md (Plugins, Conditions), docs/wayfinder.md.
- @cssints/stuck: Proxy dropped, `sticky: { group: true, ... }`; class list is now `_stuck-core _g-stuck _x` (test, README).
