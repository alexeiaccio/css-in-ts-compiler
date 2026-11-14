---
# cssints-eexo
title: 'Release 0.37.0: view-transition, progress-bar, shape-connectors'
status: completed
type: task
priority: normal
created_at: 2026-11-14T10:49:20Z
updated_at: 2026-11-14T11:04:12Z
---

Ship PR #184 (createViewTransition + view-transition.qnt spec) through the CI release flow.

- [x] Confirm the incoming changeset and the fixed-group next version (0.36.0 -> 0.37.0)
- [x] Wait for the changesets action to update the Version Packages PR #183 (run 43586976756)
- [x] Merge the Version Packages PR (approved) - merge ee2de7b
- [x] Close a duplicate Version Packages PR if one appears - none appeared
- [x] Watch the publish run to the end - run 43587140457 green
- [x] Verify npm dist-tags for headless, cssints, apg-specs - all 32 at 0.37.0
- [x] Report PR URLs, run ids, predicted vs published versions

## Summary of Changes

Released 0.37.0 of the 32-package fixed group through CI only; nothing published by hand.

- #184 landed three changesets (view-transition, progress-bar, shape-connectors), all minor, so the group went 0.36.0 -> 0.37.0.
- Run 43586976756 (push of #184) consumed the third changeset into the already-open Version Packages PR #183.
- PR #183 merged as ee2de7b; run 43587140457 published 32 of 32 packages and pushed 32 tags.
- No duplicate Version Packages PR was created this time.
- Verified: registry version documents 200 for all 32; the apg-specs 0.37.0 tarball carries specs/patterns/view-transition.qnt, its scenario and generated model.
