---
# cssints-vk1y
title: Non-modal popover
status: todo
type: feature
created_at: 2026-10-30T10:51:10Z
updated_at: 2026-10-30T10:51:10Z
parent: cssints-65eb
---

Anchored, light-dismiss, focus return, no inert background. dialog-modal is modal, so it is the wrong base.

- [ ] anchor + placement (top/bottom/left/right + flip), RTL
- [ ] open/close on trigger click, Escape, outside pointerdown; focus stays where the host puts it
- [ ] not a menu: no roving focus. It is the base for menu-in-popover and the filterable menu
- [ ] adopt in apps/docs SettingsPanel (native popover today)
