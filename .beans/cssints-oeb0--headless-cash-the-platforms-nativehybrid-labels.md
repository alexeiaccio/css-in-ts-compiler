---
# cssints-oeb0
title: 'headless: cash the platform''s native/hybrid labels'
status: todo
type: epic
priority: normal
created_at: 2026-11-14T10:41:57Z
updated_at: 2026-11-14T10:41:57Z
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
