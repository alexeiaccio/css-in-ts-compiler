---
# cssints-1aku
title: 'Kit: the starters the registry still lacks (drawer, scrollspy, panzoom, diagram, hotkeys, carousel, grid, feed, player, treegrid, resizable-panels)'
status: completed
type: feature
priority: normal
created_at: 2026-10-31T17:44:18Z
updated_at: 2026-10-31T19:32:09Z
---

Audited `@cssints/headless` against `apps/ui/src/registry` on 2026-10-31: these starters are still missing.

- [x] drawer
- [x] scrollspy
- [x] panzoom
- [x] diagram
- [x] hotkeys
- [x] carousel
- [x] grid — infrastructure, not a starter: the two-dimensional focus and window machine `table` and `treegrid` sit on
- [x] feed
- [x] player
- [x] treegrid
- [x] resizable-panels

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

## Treegrid (round seven)

- Added `apps/ui/src/registry/treegrid/`: `Treegrid` over `createTreegrid`; the skin is the surface frame and its radius, the header row, the zebra, the hover and selected looks, the indent by the level the primitive announces, the expander and the chevron it turns with `aria-expanded`, and the focus ring on the row or cell the primitive made its tab stop. The primitive owns the tree (visible rows, levels, sizes, positions), the expanders, the roving focus across rows and columns, the selection and every `aria-*`.
- Added the fixture (a project's three roots and their children, two folders open, `src` / `public` / `tests`, sizes and dates, and `mountTreegrid` with a button after the grid) and the Chromium browser test: the role and label, the header row, levels and `aria-posinset` / `aria-setsize`, Right and Left expanding and collapsing, Down and Up, Home and End, Tab leaving, cell navigation, the selection painted from `aria-selected`, and the expander's name.
- Added the demo to `src/docs/demos.tsx` and a `.demo-treegrid` rule in `docs.css`; regenerated `r/treegrid.json`, `r/registry.json` and `public/llms.txt`.
- `grid` is not a starter: it is the infrastructure `table` and `treegrid` sit on, and a skin of it alone would be the focus and window machinery the two starters already demonstrate. The bean's list now says that.

## Feed (round eight)

- Added `apps/ui/src/registry/feed/`: `Feed` over `createFeed`; the skin is the 420 px scrollport on the page colour, the cards on the surface with the kit's border and radius, the 3:2 thumbnail crop (a slot, with the title's first letter when the page has no picture), the "Loading more…" sentinel and its spinner, the status line, and the reduced-motion rule the spinner reads. The primitive owns the loaded count, `aria-posinset` / `aria-setsize`, the focusable article and its keys (Page Up/Down, Control+Home/End), the focus on the article the reading cursor is at, and `aria-busy`; the skin bridges the batch: it calls the host's `loadMore` while the primitive is busy, `loadFinish`es the count that arrived, and `loadFail`s a rejection into the status line.
- The scroll trigger is the host's, as the spec says: an `IntersectionObserver` on the after sentinel calls `loadStart` when the scrollport reaches it. A batch that lands while the sentinel holds the focus (the Control+End path) moves the focus to the first article that came in instead of dropping it with the sentinel.
- Added the fixture (nine articles of a drawn journal, six at mount, the loader waiting 180 ms and returning three from the same local array, no network) and the Chromium browser test: the role and label, the position and size of the articles and the ids their headings and summaries carry, the scrollport loading the batch with `aria-busy` and the spinner, the status line and the sentinel at the end, Page Down / Page Up moving the focus, and Control+End keeping it when the sentinel goes.
- Added the demo to `src/docs/demos.tsx` and a `.demo-feed` rule in `docs.css`; regenerated `r/feed.json`, `r/registry.json` and `public/llms.txt`. The other `r/*.json` were left as committed (several embed a pre-format copy of their sources), so a full regeneration is still owed.
- Finding: `docs/API.md` has no feed section and `packages/headless/README.md` only lists the pattern in the prefs table, so the contract is read from `src/feed.ts`, `specs/apg/feed.qnt` and `feed.browser.test.tsx`. The spec's deliberate omission ("scroll-position-triggered loading: load_start stands in for it") is exactly the seam this skin fills.


## Player (round nine)

- Added `apps/ui/src/registry/player/`: `Player` over `createPlayer`; the skin is the surface (a video frame with the caller's source and poster, or an audio bar), the frame's radius, border and tokens in light and dark, the control bar, the seek's rail, fill and thumb, the m:ss time line, the mute toggle painted from `aria-pressed`, the press on the rail that seeks, and the reduced-motion rules. The primitive owns the playback stage, the position and duration, the seek's `role="slider"` with its `aria-value*` and keys, the play/pause label, the mute toggle's `aria-pressed`, the four preferences and the surface keys (Space / K, the arrows, M, F).
- The adapter is the caller's, so the primitive still imports no media library: the fixture's `DemoPlaybackAdapter` announces 1:30 and runs a 200 ms clock while playing, so pressing Play visibly moves the seek, the time and the fill, and it records every committed seek the test reads. No media file and no image file: the demo's frame is an inline SVG poster.
- Added the fixture (a made-up 3:2 film, the control bar and the sentence about the keys) and the Chromium browser test: the named group and the caller's video frame, the m:ss duration and the slider's value text, the play/pause name following the stage, the slider's role, name and keys with every commit reaching the adapter, the clock advancing the slider/time/fill, a press on the rail seeking to the middle, and the mute toggle plus the surface keys.
- Added the demo to `src/docs/demos.tsx`; regenerated `r/player.json`, `r/registry.json` and `public/llms.txt`. The other `r/*.json` were left as committed.
- Finding: `PlayerSurfaceProps` carries only the tab stop and the keys, with no role or name, and `PlayerSeekProps` has no `aria-label`; the skin names the stage (`role="group"` and the caller's `label`) and the slider ("Seek"). Fullscreen stays the primitive's state without a button: requesting it on an element is the page's container decision.

Tests: `apps/ui` 409 passed (6 new for the player), `bun run typecheck`, `bun run build` and `theme:check` pass.

## Resizable panels (round ten)

- Added `apps/ui/src/registry/resizable-panels/`: `ResizablePanels` over `createResizablePanels`; the skin is the grid frame and the surface panes, the bars as the separator itself (no button wrapper), the grab handle that appears on hover, keyboard focus and drag, the focus ring, and the layout transition that honours reduced motion and stops while dragging. The primitive owns the sizes (percent, summing to 100), each pane's `min`/`max`, the `role=separator` and every `aria-*`, the arrows / Home / End / Enter keys, the pointer drag, collapse/restore and `storageKey` persistence.
- Added the fixture (Files / Editor / Preview, a flexible middle, side minimums, the first pane collapsible, and the sentence about dragging and the arrow keys; no `storageKey`, since persistence is the host's choice) and the Chromium browser test: the named group and the separator semantics (role, orientation, value, `aria-controls`, bounds), Tab reaching a bar, the grip on focus, the arrows and the minimum, Home/End at both pair bounds, Enter collapsing and restoring, a pointer drag following the pointer, and the second separator of three panes moving only its own pair.
- Added the demo to `src/docs/demos.tsx` and a `.demo-panels` width in `docs.css`; regenerated `r/resizable-panels.json`, `r/registry.json` and `public/llms.txt`, leaving the other `r/*.json` as committed.
- Finding: `docs/API.md` has no resizable-panels section either; the contract is the primitive's doc comment, `specs/patterns/resizable-panels.qnt` and `packages/headless/README.md`.

Tests: `apps/ui` 416 passed (7 new for the resizable panels), `bun run typecheck`, `bun run build` and `theme:check` pass.

## Engine gaps

- **The tree was fixed.** `createTreegrid` read the spec's seven-row Email Inbox tree from a module constant, so no host could render its own rows, and a starter could not be a file tree. Added `parents` (the parent of each row, in document order) and `defaultExpanded`, both optional; the spec's tree stays the default, so `treegrid.qnt`, the ported scenarios and the differential walk are unchanged. The custom-tree path is covered by the kit's browser test, not by the machine: a Quint spec parameterised by the tree is the upgrade if a second consumer needs one. `.changeset/treegrid-parents.md` (minor).

Tests: `apps/ui` 398 passed (9 new for the treegrid), `bun run typecheck`, `bun run build` and `theme:check` pass; `@cssints/headless`'s treegrid browser test (7 passed, 86 skipped) passes.

## Summary of the whole list

The registry now has every starter the audit listed: drawer, scrollspy, panzoom, diagram, shortcuts (the bean's "hotkeys"), carousel, feed, player, treegrid and resizable-panels, each as an item with a fixture, a Chromium test and a demo. `grid` is infrastructure, not a starter: it is the two-dimensional focus and window machine that `table` and `treegrid` sit on, and a skin of it alone would demonstrate machinery the two starters already show.

Tests: `apps/ui` 416 passed (the ten starters' fixtures and Chromium tests included); `bun run build:packages`, `bun run typecheck`, `bun run build`, `theme:check` and `vp fmt --check` / `vp lint` on the touched files pass.

