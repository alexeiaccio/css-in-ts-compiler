---
# cssints-1aku
title: 'Kit: the starters the registry still lacks (drawer, scrollspy, panzoom, diagram, hotkeys, carousel, grid, feed, player, treegrid, resizable-panels)'
status: completed
type: feature
priority: normal
created_at: 2026-10-31T17:44:18Z
updated_at: 2026-10-31T18:01:56Z
---

Audited `@cssints/headless` against `apps/ui/src/registry` on 2026-10-31: these starters are still missing.

- [x] drawer
- [ ] scrollspy
- [x] panzoom
- [ ] diagram
- [ ] hotkeys
- [ ] carousel
- [ ] grid
- [ ] feed
- [ ] player
- [ ] treegrid
- [ ] resizable-panels

The drawer starter was the first round; the panzoom starter is the second.



## Summary of Changes

- Added `apps/ui/src/registry/drawer/`: `Drawer`, `DrawerTrigger`, `DrawerContent`, `DrawerHeader`, `DrawerTitle`, `DrawerBody`, `DrawerFooter`, `DrawerClose` over `createDrawer`; the skin is the three edges, the slide, the slotted panel and the close control.
- Added the fixture (controlled right rail with a form, uncontrolled bottom sheet) and the Chromium browser test: aria, focus in/out, Tab cycle, Escape, backdrop pointerdown, scroll lock, the sheet geometry and a controlled host refusing to close.
- Added `color.sheetBackground` (light and dark) and regenerated `theme.css`, `r/*.json`, `r/registry.json` and `public/llms.txt`; added the demo to `src/docs/demos.tsx`.

Tests: `apps/ui` 343 passed (7 new for the drawer), `bun run typecheck`, `bun run build` and `theme:check` pass.


## Pan and zoom (round two)

- Added `apps/ui/src/registry/panzoom/`: `Panzoom` over `createPanZoom`; the skin is the surface frame with its rounded corners and focus ring, the visible live value, the hint and the three controls. The primitive owns the drag, the pinch, the wheel, the double click, the keys and the live value.
- Added the fixture (a drawn 16:9 landscape at a 480 px frame, so the test's bounds are whole numbers) and the Chromium browser test: the named focusable viewport, + / - / 0, arrows with Shift and the clamp, a double click, a pointer drag and bounds, and the controls.
- Regenerated `r/panzoom.json`, `r/registry.json` and `public/llms.txt`; added the demo to `src/docs/demos.tsx`.

Tests: `apps/ui` 350 passed (7 new for the panzoom), `bun run typecheck`, `bun run build` and `theme:check` pass.
