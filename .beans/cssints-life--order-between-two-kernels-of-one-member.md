---
# cssints-life
title: Order between two kernels of one member
status: todo
type: bug
priority: normal
created_at: 2026-10-08T14:10:21Z
updated_at: 2026-10-08T14:10:21Z
---

Found by reveal (cssints-qhug, repro under "## Engine gaps"). A member that uses two kernels has no defined order between them in `_.k`; reveal's `animation` shorthand kernel reset the timeline kernel, worked around with a doubled class `._reveal-view._reveal-view`.

## Todo
- [ ] kernels of one member print in `uses` order (or sort shorthand before longhand as the sheet does for classes)
- [ ] drop reveal's doubled class
