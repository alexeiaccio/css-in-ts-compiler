---
# cssints-1aku
title: 'Kit: the starters the registry still lacks (drawer, scrollspy, panzoom, diagram, hotkeys, carousel, grid, feed, player, treegrid, resizable-panels)'
status: completed
type: feature
priority: normal
created_at: 2026-10-31T17:44:18Z
updated_at: 2026-10-31T17:51:11Z
---

Audited `@cssints/headless` against `apps/ui/src/registry` on 2026-10-31: these starters are still missing.

- [x] drawer
- [ ] scrollspy
- [ ] panzoom
- [ ] diagram
- [ ] hotkeys
- [ ] carousel
- [ ] grid
- [ ] feed
- [ ] player
- [ ] treegrid
- [ ] resizable-panels

This round adds the drawer starter.



## Summary of Changes

- Added `apps/ui/src/registry/drawer/`: `Drawer`, `DrawerTrigger`, `DrawerContent`, `DrawerHeader`, `DrawerTitle`, `DrawerBody`, `DrawerFooter`, `DrawerClose` over `createDrawer`; the skin is the three edges, the slide, the slotted panel and the close control.
- Added the fixture (controlled right rail with a form, uncontrolled bottom sheet) and the Chromium browser test: aria, focus in/out, Tab cycle, Escape, backdrop pointerdown, scroll lock, the sheet geometry and a controlled host refusing to close.
- Added `color.sheetBackground` (light and dark) and regenerated `theme.css`, `r/*.json`, `r/registry.json` and `public/llms.txt`; added the demo to `src/docs/demos.tsx`.

Tests: `apps/ui` 343 passed (7 new for the drawer), `bun run typecheck`, `bun run build` and `theme:check` pass.
