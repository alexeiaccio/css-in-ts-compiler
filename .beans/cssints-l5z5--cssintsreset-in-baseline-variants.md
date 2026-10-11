---
# cssints-l5z5
title: '@cssints/reset in Baseline variants'
status: in-progress
type: feature
created_at: 2026-10-11T17:17:58Z
updated_at: 2026-10-11T17:17:58Z
---

User (2026-10-11): Baseline variants for the reset package, as cssints has export groups. `@cssints/reset/widely-available`, `/newly-available`, `/baseline-YYYY`, the `/with-downstream` ones (the Baseline groups of cssints, not the spec groups); `@cssints/reset` stays everything. A variant keeps only the declarations (and selectors, e.g. :where, ::backdrop) whose features are in the group, from the group data of cssints, not a hand list.

- [ ] a plugin-side check in cssints/plugin (is this declaration/selector in group X), reusing groups-data
- [ ] reset subpaths generated or a pattern export; README table of what each variant drops
- [ ] tests (which declarations each variant has), types, docs, changeset (minor)
