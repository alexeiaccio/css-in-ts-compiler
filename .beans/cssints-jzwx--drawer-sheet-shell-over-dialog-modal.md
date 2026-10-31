---
# cssints-jzwx
title: Drawer / sheet shell over dialog-modal
status: in-progress
type: feature
priority: normal
created_at: 2026-10-30T10:51:10Z
updated_at: 2026-10-31T14:52:12Z
parent: cssints-65eb
---

bottom-sheet.md says compose, don't add a primitive; the shell still has to exist (docs mobile nav, kocharin artwork popup below 768px).

- [x] modal drawer with backdrop, focus trap and scroll lock (reuse the confirm shell), Escape
- [x] a breakpoint switch: sheet below, dialog above, one API
- [x] drag-to-dismiss on touch? decide (bottom-sheet.md has the scroll-snap reasoning)
- [x] adopt in apps/docs Shell (mobile nav): `createDrawer({ id: "sidebar", side: "left", breakpoint: 900, modal: () => !wide() })` in `apps/docs/src/Shell.tsx` (the menu button its trigger, `#sidebar-content` its panel, the route effect closing it); the phone case of `apps/docs/test/browser.mjs` pins it
- [ ] adopt in the kocharin artwork popup (kocharin-art-3: another repo, another session)

## Progress

`createDrawer` is in `packages/headless/src/drawer.ts` (exported from `src/index.ts`, README, `docs/API.md`, `.changeset/drawer.md`), with `test/drawer.browser.test.tsx` as its oracle (13 tests). The scroll lock and the open-overlay stack moved to `src/overlay-shell.ts`, shared with `createConfirm`, so a confirm over a drawer nests.

Decisions: drag-to-dismiss is no — a drag is the host's native scroll snap, and the grab handle is decoration (`aria-hidden`, no pointer handlers); `breakpoint` is documented but not read, because the host owns `matchMedia` and passes `side` / `modal`, and `modal` is read at attribute-read time so the breakpoint may flip it while the drawer is open; no `attach`, because the panel is edge-anchored and nothing is measured.

Remaining: the kocharin artwork popup, a separate change in another repository (the docs' mobile nav is adopted: see the Summary below).

## Summary of Changes

`apps/docs/src/Shell.tsx` drops the hand-rolled drawer. The menu button spreads `createDrawer`'s `triggerProps` (`aria-haspopup`, `aria-expanded`, `aria-controls="sidebar-content"` and the toggle), the panel below 900 px spreads `contentProps` (`role="dialog"`, `aria-modal` while modal, Escape), a backdrop spreads `backdropProps` (the primitive hides it), and the open state is controlled, so a route change and a crossing of the breakpoint close it. Escape (read from the document, capture), the Tab cycle, the counted `overflow: hidden` on `<html>`, the outside `pointerdown` and the focus into the panel and back to the trigger are the shell's, shared with `createConfirm` through `packages/headless/src/overlay-shell.ts`.

The desktop column is untouched: above 900 px the drawer is `modal: false` and its panel is not rendered, so `#sidebar` is still the same sticky `<nav>` (same width, `aria-current="page"` links, no backdrop, no lock). The panel keeps its slide: `hidden` (display: none) is not spread, `visibility` is, with the delay on the close so the focus lands in a visible panel.
`apps/docs/test/browser.mjs` adds the phone case (trigger state, Tab trap, Escape and focus return, no scroll behind, outside dismiss, a link closing it) and pins the column (no `role`, hidden backdrop, no lock, no panel). See docs/wayfinder.md, "The docs' sidebar drawer".
