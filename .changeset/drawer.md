---
"@cssints/headless": minor
---

`@cssints/headless`: `createDrawer`, the drawer / bottom-sheet shell over Dialog (Modal): `side` (`"left" | "right" | "bottom"`) and `modal` are the whole presentation API, so a sheet below a breakpoint and a side rail above it are one drawer; `modal` is read at attribute-read time, so the host's breakpoint may flip it while the drawer is open. A modal drawer has a backdrop, focus into the panel and back to the trigger, a Tab cycle, a counted page-wide scroll lock (shared with `createConfirm`, so a confirm over a drawer nests) and Escape from the document; a non-modal one keeps the page's scroll, focus and clicks. No drag-to-dismiss: a drag is the host's native scroll snap (docs/bottom-sheet.md), so `handleProps` is a decorative grab handle and swipe-to-dismiss stays a separate decision. No `attach`: the panel is edge-anchored and nothing is measured.
