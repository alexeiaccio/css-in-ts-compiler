---
# cssints-dvq8
title: 'headless: confirm and drawer on <dialog>'
status: todo
type: task
priority: normal
created_at: 2026-11-14T10:42:10Z
updated_at: 2026-11-14T10:42:10Z
parent: cssints-oeb0
---

## What
`confirm.ts` and `drawer.ts` share `overlay-shell.ts` (scroll lock, tab cycle, overlay stack). A host that renders
`<dialog>` + `showModal()` gets all three from the browser, plus focus containment and Esc. Keep `overlay-shell` only
for hosts that do not (the Clay/native class of host).

## Todo
- [ ] The `<dialog>` host path for confirm and drawer; `closedby` and `requestClose()` as enhancement (C134 / F141,
      Safari unsupported)
- [ ] The tests that now assert platform behaviour move to the host fixture, not the primitive
