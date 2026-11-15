---
# cssints-qyre
title: 'headless: popover.ts and the menu family on the Popover API'
status: completed
type: task
priority: normal
created_at: 2026-11-14T10:42:10Z
updated_at: 2026-11-15T13:09:10Z
parent: cssints-oeb0
---

## What
`popover.ts` implements light dismiss, Esc, the top layer and focus return by hand; the platform has all four. Move it
to `popover` + `showPopover()` and `commandfor`/`command` (Baseline newly 2025-12-12), keep the props. Then the menu
family (`menu.ts`, `filterable-menu.ts`, `command-palette.ts`) keeps only keys, typeahead and checkable items, with
anchor positioning for placement (C125 / F147 / S26).

## Todo
- [x] Port `popover.ts` to the Popover API behind the same props; the browser tests are the oracle
- [x] `createMenu` on the popover: `overlay: "popover"`, `menuProps.popover`, a platform `toggle` as a close request, and
      the kit's native CSS anchor positioning where `CSS.supports("anchor-name", "--a")`
- [x] Menubar: the same for its submenu levels — `manual` popovers with the kit's anchor positioning (a polyfill only if
      engines without anchor positioning matter)
- [x] Delete what the platform owns from the spec/model — nothing in the models was an overlay stack: the close stays a
      request, which is what the hosts hold or refuse



## Progress

`popover.ts` is on the Popover API: `contentProps.popover` is `"auto"` where the engine has it (and `hidden` is the
fallback's), the open effect calls `showPopover()`/`hidePopover()`, the platform's `toggle` feeds back a light dismiss or
an Escape, and the placement is client-space `position: fixed` with `inset` cancelled (the UA's `inset: 0; margin: auto`
re-centres the panel otherwise — measured: `top: 38px` rendered at 363). The focus contract, the outside press that does
not take focus back, and the placement stay. Tests: `test/popover.browser.test.tsx` (9) and the kit's popover and
date-picker files (13 and 16) pass; the kit's date picker composes the same primitive.

Remaining: the menu family. `menu.ts` has no element to attach (the panel is the host's), so the port needs a panel
`attach`/`ref` in its props first; the submenus are one more level of the same. Its keys, typeahead and checkable items
stay. Anchor positioning is the second half of that step (the placement code is still ours).



**Menu, second half:** `createMenu({ overlay: "popover" })` puts the list in the top layer; the kit places it with CSS
anchor positioning (`anchor-name` on the trigger, `position-anchor` + `inset: auto` + `top: anchor(bottom)` on the list,
which also beats the UA's `inset: 0; margin: auto` centring), and falls back to the inline absolute list where
`anchor-name` is unsupported. The platform's light dismiss and Escape arrive as `toggle` and the primitive treats them as
`leave()` — a close request a controlled host can refuse. Tests: the primitive's `test/menu-popover.browser.test.tsx`
(3: top layer + placement, the toggle request, a refusing host) and the kit's menu suite (59, including the top-layer
placement). The menubar's submenu levels and `confirm`/`drawer` on `<dialog>` remain.



**Menubar, done:** `createMenubar({ overlay: "popover" })` makes every menu and submenu a popover; the levels are
`manual` because the UA's close focus restore fought the move between bar item, menu and submenu (the scenario walks lost
a focus row and left a menu announced open), so the platform keeps the top layer and the primitive keeps Escape and the
host's outside press. The kit anchors each level to its bar item or parent row (`top: anchor(bottom)` / `top:
anchor(top); left: anchor(right)`). One ordering lesson: `bump` syncs the popovers itself instead of an effect, because
the kit focuses a row from the same state change and a focus into a still-closed popover is a no-op. Tests: the kit's
menubar suite (52, including the top-layer placement of both levels), menu (59) and combos (28); the primitive's menu
family 126. The `.changeset` covers `MenuOptions.overlay`/`MenubarOptions.overlay`.
