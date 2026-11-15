---
# cssints-oeb0
title: 'headless: cash the platform''s native/hybrid labels'
status: todo
type: epic
priority: normal
created_at: 2026-11-14T10:41:57Z
updated_at: 2026-11-15T13:15:08Z
---

## What
The 2026-11 delta of `packages/headless/docs/apg-platform-features.md` lists every primitive that still re-implements a
platform behaviour, with the JS it would delete. This epic is the two moves that pay: the host recipes / kit markup
(the "native" labels the summary table never cashed), and the overlay half on the Popover API and `<dialog>`.

## Why
Modern Web Guidance (installed 2026-11-14) and `legacy-scan` confirmed the package is mostly a contract already.
The overlay family and the kit markup are the only places where the platform would remove code, not add a dependency.

## Children
- host recipes and kit markup: details, dialog, native range, `<meter>`, the `switch` attribute
- `popover.ts` and the menu family on the Popover API + `commandfor` + anchor positioning
- `confirm` / `drawer` on `<dialog>`, and the removal of `overlay-shell`'s trap, scroll lock and overlay stack



## Progress

- `cssints-jr2a` — **done**: `docs/hosts.md`, a native story per recipe in the kit, and one Chromium test that holds the
  stories to the platform (`details` toggle/exclusivity, `:modal` + focus on Escape, `<meter>`, the switch, `field-sizing`,
  `:user-invalid`).
- `cssints-qyre` — the popover half is **done** (`createPopover` on the Popover API, the top layer, client-space fixed
  placement, tests on `:popover-open`); the menu family is **next**: its panel is the host's, so the port needs a panel
  attach/ref in its props before `showPopover()` can be called. Anchor positioning comes with it.
- `cssints-dvq8` — **not started**: a `<dialog>` host path for confirm and drawer (the primitive would sync
  `showModal()`/`close()` and let the platform own Esc, focus containment and the scroll lock; `closedby` is the
  enhancement), then the kit's dialog/drawer items can render it.



**Second pass:** `cssints-dvq8`'s dialog-modal half is done (`nativeProps` + `attachDialog`, 5 new browser tests, the
existing 71 still green). What is left of the epic is the overlay host for `confirm`/`drawer` (they still use
`overlay-shell`) and the menu family's panel attach (its blocker: the panel is the host's element, so `showPopover()` has
no element to act on until the props gain a panel `attach`; the kit's anchor-absolute positioning also has to become a
placement or anchor positioning).



**qyre is complete:** the popover, the menu and now the menubar (manual levels, anchor positioning per level) are on the
platform; the epic's remaining item is `cssints-dvq8`'s confirm/drawer (`overlay-shell` still owns their trap and lock).



**dvq8's drawer half is done.** The epic is now: `confirm` on `<dialog>` (the last primitive still owning `overlay-shell`'s
trap and lock) and the kit's dialog/drawer items rendering `<dialog>` with the platform's backdrop and `@starting-style`
motion instead of the JS overlay. Everything else the assessment listed is done: recipes and stories, the popover, the
menu and the menubar in the top layer, the dialog modal and the drawer on `<dialog>`.
