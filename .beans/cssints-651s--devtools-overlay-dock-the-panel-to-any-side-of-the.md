---
# cssints-651s
title: 'Devtools overlay: dock the panel to any side of the page'
status: completed
type: feature
priority: normal
created_at: 2026-10-10T17:49:21Z
updated_at: 2026-10-10T18:35:49Z
---

Asked by the user (2026-10-10): the devtools overlay panel can be attached to different sides of the page.
- [x] Dock positions: right (today), left, bottom, top, and maybe floating; a control in the panel header (and a keyboard shortcut if cheap) switches them; the choice persists (localStorage) per origin.
- [x] Docked to a side the panel resizes (drag the inner edge; width for left/right, height for top/bottom; min/max), and the page is not covered where possible (optional: push the page with a margin on <html>, off by default; say what was chosen); the cssints button (fab) and the highlight still work in every position; the panel never covers the element being picked in a way that blocks picking (hover passes through to the page where the panel is not).
- [x] Works in dev and in the 'build' mode (docs site); styles stay in the shadow root sheet (no tokens, as the README says).
- [x] Tests: devtools browsers test (each dock position renders, persists across reload, resize works) in Chrome/Firefox/WebKit; docs browser test still green.

## Summary of Changes

- Four buttons in the panel header (◧ ⬒ ⬓ ◨) dock the panel left, top, bottom or right (default). Floating and a keyboard shortcut are not done (not cheap, not needed).
- The grip on the inner edge resizes it (min 200 px, a strip of 80 px of the page stays; CSS `min(Npx, 100vw/vh)` keeps it inside small windows). The dock and both sizes are kept in `localStorage` (`cssints-devtools:dock`).
- The page is not pushed aside; the panel covers its side and picking works on the rest. The fab stays bottom right; the panel opens again from it in every dock. Build mode uses the same overlay, so it docks the same (apps/docs build green).
- Tests: test/browsers.mjs in Chrome, Firefox and WebKit: each dock hugs its side, a pick beside the panel, a drag of the grip (+100 px), the fab after Esc, the dock and both sizes after a reload. dist/overlay.js rebuilt: 263393 -> 266866 bytes.
