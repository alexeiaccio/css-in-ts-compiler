---
# cssints-1aku
title: 'Kit: the starters the registry still lacks (drawer, scrollspy, panzoom, diagram, hotkeys, carousel, grid, feed, player, treegrid, resizable-panels)'
status: completed
type: feature
priority: normal
created_at: 2026-10-31T17:44:18Z
updated_at: 2026-10-31T18:35:54Z
---

Audited `@cssints/headless` against `apps/ui/src/registry` on 2026-10-31: these starters are still missing.

- [x] drawer
- [x] scrollspy
- [x] panzoom
- [x] diagram
- [x] hotkeys
- [x] carousel
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



## Scrollspy (round three)

- Added `apps/ui/src/registry/scrollspy/`: `Scrollspy` over `createScrollspy`; the skin is the named navigation landmark, the list with an indent per entry level, and the left rule painted from `aria-current` in the theme's tokens. The primitive owns the one passive scroll listener on the container, the "last heading at or above the offset" rule and the one-current-link invariant.
- Added the fixture (an article of four 300 px sections in a 260 px pane, the table beside it, and `reveal()` that adds the last entry) and the Chromium browser test: the named landmark and its list, indentation by level, scrolling moving `aria-current` to the heading that passed the top (exactly one), a heading below the fold staying out, a link click scrolling the pane, and the entries being read again when they change.
- Added the demo to `src/docs/demos.tsx` and `docs.css`; a fragment link inside a preview no longer moves the gallery page (an in-page anchor is not an item or a guide).
- Regenerated `r/scrollspy.json`, `r/registry.json` and `public/llms.txt`.

Tests: `apps/ui` 362 passed (6 new for the scrollspy), `bun run typecheck`, `bun run build` and `theme:check` pass.


## Diagram (round four)

- Added `apps/ui/src/registry/diagram/`: `Diagram` over `createDiagramFocus`; the skin is the named group, the SVG lines behind the nodes (one per edge, trimmed to the node borders, with an arrow head and the label), the positioned node buttons, the tokens, the focus ring and the active look it paints from `tabindex="0"`. The primitive owns the roving tab stop, the layout arrows, Home / End, the edge cursor and the live region.
- Added the fixture (a payment flow of four nodes and five edges, the sentence about the keys, the line that says what the host got, and a button after the diagram that Tab reaches) and the Chromium browser test: the named group and the one tab stop, the active look, the arrows following the layout, Home / End, Enter on a node, the outgoing edges and their cursor firing `onEdge`, a click on an edge's line, the live region, a node with no edges, Tab leaving, and the drawn geometry.
- Added the demo to `src/docs/demos.tsx` and a `.demo-diagram` rule in `docs.css`.
- Regenerated `r/diagram.json`, `r/registry.json` and `public/llms.txt`.

Tests: `apps/ui` 373 passed (11 new for the diagram), `bun run typecheck`, `bun run build` and `theme:check` pass.


## Shortcuts (round five)

- Added `apps/ui/src/registry/shortcuts/`: `Kbd`, `Shortcuts` and `createShortcuts` over `createHotkeys`. The skin is the key cap (one `kbd` per `+` part, a visible `+` between them, `mod` as ⌘ or Ctrl) and the trigger-less sheet over the kit's `Dialog` (named "Keyboard shortcuts", a group of rows each, a close control). `createShortcuts` owns the registry and the open state: `?` (`allowInEditable: false`, an optional `scope`) opens the sheet, and the host binds the page's own chords through `controller.hotkeys` and lists them in `Shortcuts`.
- Added the fixture (a button, `mod+k` scoped to the demo box, a page-wide `s`, and a note with its own scoped `s` over the page's) and the Chromium browser test: `?` on the page, not while a field is focused, Escape and the close control returning the focus, the caps and their `aria-label` in both platforms, Cmd vs Ctrl, the scope shadowing and the disposer.
- Added the demo to `src/docs/demos.tsx`; regenerated `r/shortcuts.json`, `r/registry.json` and `public/llms.txt`.

Tests: `apps/ui` 382 passed (9 new for the shortcuts), `bun run typecheck`, `bun run build` and `theme:check` pass.


## Carousel (round six)

- Added `apps/ui/src/registry/carousel/`: `Carousel` over `createCarousel`; the skin is the named region, the surface frame and its rounded track, the control row (`‹` / `›` with names), the dots and the "2 of 5" count, the enter animation that honours reduced motion, and the two gestures the primitive leaves to the host: the arrow keys on a focused slide (the focus follows the slide that is shown) and a touch swipe. The primitive owns the shown slide, the next / previous requests, the slide semantics (`aria-roledescription="slide"`, `aria-label="1 of 5"`, `tabindex`), the hover / focus pause and the `aria-live` the frame announces; the skin does not translate the track, because the primitive hides the non-current slides rather than scrolling a strip.
- Added the fixture (five drawn slides, the sentence about the keys and the swipe, and `mountCarousel`) and the Chromium browser test: the named region and the slide semantics, the controls' `aria-controls`, next / previous and the indicator, wrapping at both ends, a dot click, the arrow keys and the focus that follows, and a touch swipe versus a mouse drag.
- Added the demo to `src/docs/demos.tsx` and a `.demo-carousel` rule in `docs.css`; regenerated `r/carousel.json`, `r/registry.json` and `public/llms.txt`.
- Finding: `docs/API.md` has no carousel section and `packages/headless/README.md` only lists the pattern under the prefs table, so the primitive's contract is read from `src/carousel.ts` and its scenario test. Its doc comment calls the platform "hybrid — CSS scroll-snap (widely) scrolls slides", but the implementation hides every slide but the current one (`hidden`, `tabindex` 0/-1), so a scroll-snap skin would fight it; the starter stacks the slides instead.

Tests: `apps/ui` 389 passed (7 new for the carousel), `bun run typecheck`, `bun run build` and `theme:check` pass.
