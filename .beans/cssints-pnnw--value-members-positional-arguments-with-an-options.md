---
# cssints-pnnw
title: 'Value members: positional arguments with an options object, and sub-members (fluid.container)'
status: in-progress
type: feature
priority: low
created_at: 2026-10-08T09:42:20Z
updated_at: 2026-10-08T10:02:47Z
---

Found by fluid() (cssints-ni5c, repros under "## Engine gaps").

- A value member's `args` is only a grammar string; call members take a tuple ending in an options object, value members do not. fluid wraps a four-length member in a plain function, and passes `zoom: false` as a trailing `unchecked` keyword part.
- A member key cannot contain a dot and value members have no methods, so `fluid.container` is a member `fluidContainer` attached by hand, and its errors say `fluidContainer:`.

## Todo
- [ ] tuple args (with a trailing options object) for value members
- [ ] a label override or dotted names for errors
