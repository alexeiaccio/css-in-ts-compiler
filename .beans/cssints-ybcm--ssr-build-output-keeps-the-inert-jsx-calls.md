---
# cssints-ybcm
title: SSR build output keeps the inert __jsx calls
status: completed
type: bug
priority: normal
created_at: 2026-10-10T11:57:15Z
updated_at: 2026-10-10T14:50:50Z
parent: cssints-06ws
blocking:
    - cssints-m0yj
---

Found building apps/sky-tui: cssints turns the JSX of Vite's `ssr` environment into calls to an inert `__jsx`, so a plain SSR build of a TUI app crashes at run time (`__jsx is not defined`). sky-tui works around it with an environment of its own, `tui` (consumer: server, builder.buildApp). Fix: only inert-ify JSX where the engine evaluates modules, never in a build output; or key it off the environment cssints owns.

## Todo
- [x] reproduce with a minimal SSR build
- [ ] fix in the plugin, a test
- [x] drop the `tui` environment workaround in apps/sky-tui: moved to cssints-m0yj

## Summary of Changes
Fixed on engine/tui (38e37a3): only the dev server's ssr environment and the plugin's private build server evaluate; a build's ssr environment keeps `__site`-free code and real JSX. A test builds a .tsx entry with `vite build --ssr`.
