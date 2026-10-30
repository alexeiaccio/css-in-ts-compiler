---
# cssints-jzwx
title: Drawer / sheet shell over dialog-modal
status: in-progress
type: feature
priority: normal
created_at: 2026-10-30T10:51:10Z
updated_at: 2026-10-30T16:32:40Z
parent: cssints-65eb
---

bottom-sheet.md says compose, don't add a primitive; the shell still has to exist (docs mobile nav, kocharin artwork popup below 768px).

- [x] modal drawer with backdrop, focus trap and scroll lock (reuse the confirm shell), Escape
- [x] a breakpoint switch: sheet below, dialog above, one API
- [x] drag-to-dismiss on touch? decide (bottom-sheet.md has the scroll-snap reasoning)
- [ ] adopt in apps/docs Shell (mobile nav) and kocharin artwork popup

## Progress

`createDrawer` is in `packages/headless/src/drawer.ts` (exported from `src/index.ts`, README, `docs/API.md`, `.changeset/drawer.md`), with `test/drawer.browser.test.tsx` as its oracle (13 tests). The scroll lock and the open-overlay stack moved to `src/overlay-shell.ts`, shared with `createConfirm`, so a confirm over a drawer nests.

Decisions: drag-to-dismiss is no — a drag is the host's native scroll snap, and the grab handle is decoration (`aria-hidden`, no pointer handlers); `breakpoint` is documented but not read, because the host owns `matchMedia` and passes `side` / `modal`, and `modal` is read at attribute-read time so the breakpoint may flip it while the drawer is open; no `attach`, because the panel is edge-anchored and nothing is measured.

Remaining: adopt in `apps/docs` Shell (mobile nav) and the kocharin artwork popup, which is a separate change.
