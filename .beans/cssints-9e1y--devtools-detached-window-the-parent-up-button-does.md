---
# cssints-9e1y
title: 'Devtools detached window: the parent (up) button does not work'
status: in-progress
type: bug
created_at: 2026-10-10T20:51:50Z
updated_at: 2026-10-10T20:51:50Z
---

Reported by the user (2026-10-10) after cssints-tko6: in the detached devtools window the parent button (select the picked element's parent, ↑) does not work; check the other navigation buttons/keys there too (first child, siblings), and Esc/arrows heard in the window. Root cause likely: the handler uses document/window of the page vs the popup, an event listener on the page window only, or a focus/keyboard check against the wrong document. Fix, and extend test/browsers.mjs: in the detached window click parent and child buttons and press the arrow keys; the page's picked element changes accordingly (Chrome, Firefox, WebKit).
