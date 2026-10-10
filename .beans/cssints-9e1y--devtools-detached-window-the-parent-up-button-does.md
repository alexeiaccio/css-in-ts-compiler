---
# cssints-9e1y
title: 'Devtools detached window: the parent (up) button does not work'
status: completed
type: bug
priority: normal
created_at: 2026-10-10T20:51:50Z
updated_at: 2026-10-10T21:07:43Z
---

Reported by the user (2026-10-10) after cssints-tko6: in the detached devtools window the parent button (select the picked element's parent, ↑) does not work; check the other navigation buttons/keys there too (first child, siblings), and Esc/arrows heard in the window. Root cause likely: the handler uses document/window of the page vs the popup, an event listener on the page window only, or a focus/keyboard check against the wrong document. Fix, and extend test/browsers.mjs: in the detached window click parent and child buttons and press the arrow keys; the page's picked element changes accordingly (Chrome, Firefox, WebKit).

## Summary of Changes

- Root cause: not the pop-up's document or window. The walk handlers (the ↑ button and the arrow keys) started from selected(), and the arrows also returned while picking. After the panel opens (or ⧉ is pressed) picking is on and nothing is selected, so the panel shows only the hovered element, and the pointer is now in the other window. ↑ and the arrows then did nothing. A click in the page first made them work, which the old test did. The docked panel had the same gap.
- Fix, once for every control: go(step) in overlay.tsx starts from target() (the element the panel shows: hovered while picking, else selected), selects the result and ends picking. The ↑ button and the keydown handler share it through the STEPS table. In the page the arrows still pass while picking (e.view === window); in the window they walk from the hovered element.
- Tests: test/browsers.mjs (Chrome, Firefox, WebKit) walkTree in the pop-up: hover only then ↑, pick then ↑ (the page highlight moves), arrows Down, Right, Down, Up, Left, Up; run in the first window, the window opened again after a reload and a second window after re-docking. It fails on the old source. dist/overlay.js rebuilt: 269627 -> 269650 bytes.
