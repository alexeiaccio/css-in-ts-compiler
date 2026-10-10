---
# cssints-fjho
title: Dev sheet keeps the rules of a module that lost its last cssints import
status: completed
type: bug
priority: normal
created_at: 2026-10-09T15:37:29Z
updated_at: 2026-10-10T11:39:58Z
---

Found by cssints-4v2z: on a dev server, a module edited so that it no longer imports cssints keeps its old rules in the sheet: plugin.ts returns early for a file without the attribute and never clears its usedBy / forgets its kernels, globals and themes. Fix in the early return (forget the file as a re-run does), a test in the HMR suite (test/hmr or plugin-seams.mjs style), and the Quint model if the HMR states change.

## Summary of Changes

Root cause: plugin.ts `transform` returned early for a client module without the cssints attribute, so the module kept its `usedBy` entry (its classes, and the globals, layers and kernels that the sheet reads through it) and its themes and checks in the registry.

Fix: that early return now calls `drop(id)`: `usedBy`, `siteOf` and `callsOf` lose the module, `forget(id)` runs as a re-run does, and the sheet reloads. Test: test/dev-drop.mjs (a dev server: styles, global, layer, theme and check; the edit that drops the import; the edit that brings it back). The Quint model is unchanged (no await point moved; it models modules that use css.*). dist rebuilt.
