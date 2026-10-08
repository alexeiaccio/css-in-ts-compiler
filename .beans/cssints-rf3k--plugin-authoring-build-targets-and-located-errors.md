---
# cssints-rf3k
title: 'Plugin authoring: build targets and located errors'
status: in-progress
type: feature
priority: low
created_at: 2026-10-08T14:10:21Z
updated_at: 2026-10-08T15:48:22Z
---

Found by stuck (cssints-z1hd, repros under "## Engine gaps").
- A plugin cannot read the build targets: stuck imports `lackingOf` from `@cssints/css-grammar/support` (a new dependency).
- `stuck("middle")` fails the build with the right message but no source location: the error is thrown where the plugin cannot raise a `MemberError` at the call.

## Todo
- [ ] expose `lacking(keys)` (the targets that lack a BCD key) on the build context of `build()`/`value`
- [x] errors thrown from a member's own code keep the call site
- [ ] drop stuck's css-grammar dependency
