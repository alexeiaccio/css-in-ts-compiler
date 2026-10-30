---
# cssints-h0d5
title: 'Hotkeys: one registry instead of a handler per app'
status: todo
type: task
created_at: 2026-10-30T10:51:10Z
updated_at: 2026-10-30T10:51:10Z
parent: cssints-65eb
---

Every app rewrites /, Cmd+K, Cmd+S, arrows: apps/docs Search.tsx, cms-admin, kocharin Artworks.

- [ ] a small composable (register a chord with modifiers, ignore while a text field is focused unless asked, scope to a subtree)
- [ ] documented collisions with the browser's own chords
- [ ] adopt in apps/docs (search focus) and cms-admin (save, publish)
