---
# cssints-tko6
title: 'Devtools: detach the panel into its own window (like TanStack devtools)'
status: in-progress
type: feature
created_at: 2026-10-10T19:54:52Z
updated_at: 2026-10-10T19:54:52Z
---

Asked by the user (2026-10-10): the devtools overlay panel can be detached into a separate browser window, as TanStack devtools do.
- [ ] A detach button in the panel header (beside the dock buttons of cssints-651s): opens a popup window (window.open, or the Document Picture-in-Picture API where available: say which and why) that shows the same panel; the page keeps picking (hover highlight and click on the page), and the detached panel follows the picked element live; closing the window re-docks the panel; the choice persists like the dock.
- [ ] How the panel renders in the other window: the overlay's Solid UI mounted into the popup's document (same JS realm via window.open's same-origin document, styles adopted from the shadow-root sheet), or a message channel; pick the simplest that works in Chrome, Firefox and WebKit (PiP is Chromium-only: fall back to window.open).
- [ ] Works in dev and in the 'build' mode; popup blocked = a clear message and the panel stays docked.
- [ ] Tests in the devtools browsers test: detach opens a window with the panel, a pick in the page updates it, closing re-docks; dist/overlay.js size.
