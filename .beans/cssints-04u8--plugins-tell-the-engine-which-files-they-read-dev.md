---
# cssints-04u8
title: Plugins tell the engine which files they read (dev watch)
status: in-progress
type: feature
priority: normal
created_at: 2026-10-09T07:56:10Z
updated_at: 2026-10-09T12:03:46Z
---

Found by placeholder (cssints-cpca), same limit in icons and fonts: a member that reads a file at build time cannot register it, so an edited image, SVG or font is not picked up in dev until the importing module is touched or the server restarts.

## Todo
- [x] a `dependsOn(path)` (or similar) for build()/value/plain plugin code, wired to Vite's addWatchFile and the HMR of the importing modules
- [x] use it in placeholder, icons (fs) and fonts (fs)
