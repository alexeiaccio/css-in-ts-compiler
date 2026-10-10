---
# cssints-651s
title: 'Devtools overlay: dock the panel to any side of the page'
status: in-progress
type: feature
created_at: 2026-10-10T17:49:21Z
updated_at: 2026-10-10T17:49:21Z
---

Asked by the user (2026-10-10): the devtools overlay panel can be attached to different sides of the page.
- [ ] Dock positions: right (today), left, bottom, top, and maybe floating; a control in the panel header (and a keyboard shortcut if cheap) switches them; the choice persists (localStorage) per origin.
- [ ] Docked to a side the panel resizes (drag the inner edge; width for left/right, height for top/bottom; min/max), and the page is not covered where possible (optional: push the page with a margin on <html>, off by default; say what was chosen); the cssints button (fab) and the highlight still work in every position; the panel never covers the element being picked in a way that blocks picking (hover passes through to the page where the panel is not).
- [ ] Works in dev and in the 'build' mode (docs site); styles stay in the shadow root sheet (no tokens, as the README says).
- [ ] Tests: devtools browsers test (each dock position renders, persists across reload, resize works) in Chrome/Firefox/WebKit; docs browser test still green.
