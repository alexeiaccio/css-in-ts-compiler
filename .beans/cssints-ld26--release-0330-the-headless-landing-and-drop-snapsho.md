---
# cssints-ld26
title: 'Release 0.33.0: the headless landing and drop snapshot'
status: completed
type: task
priority: normal
created_at: 2026-11-04T10:41:16Z
updated_at: 2026-11-04T10:54:52Z
---

A changeset for PR #154 (`@cssints/headless` minor: `state().landing` and `state().drop`), the release PR, the Version Packages PR, and verification that 0.33.0 is on npm.

- [ ] write `.changeset/drag-landing.md`
- [x] open the release PR and merge it
- [x] merge the Version Packages PR
- [x] watch the publish run to the end
- [x] verify `npm view` for `@cssints/headless` and `cssints`
- [x] report

## Summary of Changes

`.changeset/drag-landing.md` (`@cssints/headless` minor) went out through `.github/workflows/release.yml`: PR #156 -> Version Packages PR #157 -> release run 41816261707 (success, 30 of 30 packages). 0.33.0 is on npm. A concurrent run for #153 reopened a stale Version Packages PR #158 (tree identical to master); closed instead of merged.
