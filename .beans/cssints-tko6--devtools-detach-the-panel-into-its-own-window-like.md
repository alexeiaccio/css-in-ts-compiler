---
# cssints-tko6
title: 'Devtools: detach the panel into its own window (like TanStack devtools)'
status: completed
type: feature
priority: normal
created_at: 2026-10-10T19:54:52Z
updated_at: 2026-10-10T20:34:59Z
---

Asked by the user (2026-10-10): the devtools overlay panel can be detached into a separate browser window, as TanStack devtools do.
- [x] A detach button in the panel header (beside the dock buttons of cssints-651s): opens a popup window (window.open, or the Document Picture-in-Picture API where available: say which and why) that shows the same panel; the page keeps picking (hover highlight and click on the page), and the detached panel follows the picked element live; closing the window re-docks the panel; the choice persists like the dock.
- [x] How the panel renders in the other window: the overlay's Solid UI mounted into the popup's document (same JS realm via window.open's same-origin document, styles adopted from the shadow-root sheet), or a message channel; pick the simplest that works in Chrome, Firefox and WebKit (PiP is Chromium-only: fall back to window.open).
- [x] Works in dev and in the 'build' mode; popup blocked = a clear message and the panel stays docked.
- [x] Tests in the devtools browsers test: detach opens a window with the panel, a pick in the page updates it, closing re-docks; dist/overlay.js size.

## Summary of Changes

- A ⧉ button in the panel header (beside the docks) detaches the panel with `window.open("", "cssints-devtools", "popup,...")`: a same-origin about:blank pop-up. The Document Picture-in-Picture API was not used: it is Chromium only and would need the same pop-up as a fallback.
- The panel is the same Solid tree: a `Portal` mounts it into the pop-up's body, with the overlay sheet in a `<style>` there. So no message channel: the signals, picking, the highlight and the 600 ms re-inspect stay in the page, and the window follows the picked element live. Keys (Esc, arrows) are also heard in the window.
- Closing the window (polled with the 600 ms tick), ⧉ again or a dock button re-docks; Esc, the fab and a page reload close the window and keep the choice. The choice is kept in the dock's localStorage record (`detached`) and the next open (a click or the shortcut: a pop-up needs a gesture) opens the window again. A blocked pop-up shows a message in the docked panel.
- Also fixed: `moveTo` saved `place()` before the flush (Solid 2 shows a write after the flush); `keep` saves the new value.
- Dev and `"build"` modes use the same overlay. In the build mode the panel opens without a click, so a kept window is blocked until the next click on ⧉.
- Tests: test/browsers.mjs in Chrome, Firefox and WebKit: the popup page event with the panel, a pick in the page followed in the window, the window's buttons, the choice after a reload, closing re-docks for good, a blocked `window.open` gives the message. dist/overlay.js: 266866 -> 269627 bytes.
