---
# cssints-ybcm
title: SSR build output keeps the inert __jsx calls
status: todo
type: bug
priority: normal
created_at: 2026-10-10T11:57:15Z
updated_at: 2026-10-10T11:57:15Z
parent: cssints-06ws
blocking:
    - cssints-m0yj
---

Found building apps/sky-tui: cssints turns the JSX of Vite's `ssr` environment into calls to an inert `__jsx`, so a plain SSR build of a TUI app crashes at run time (`__jsx is not defined`). sky-tui works around it with an environment of its own, `tui` (consumer: server, builder.buildApp). Fix: only inert-ify JSX where the engine evaluates modules, never in a build output; or key it off the environment cssints owns.

## Todo
- [ ] reproduce with a minimal SSR build
- [ ] fix in the plugin, a test
- [ ] drop the `tui` environment workaround in apps/sky-tui if it is no longer needed
