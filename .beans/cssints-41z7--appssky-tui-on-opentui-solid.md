---
# cssints-41z7
title: apps/sky-tui on OpenTUI + Solid
status: in-progress
type: feature
priority: normal
created_at: 2026-10-10T11:34:51Z
updated_at: 2026-10-10T11:53:09Z
parent: cssints-06ws
---

apps/sky-tui: Vite SSR build with vite-plugin-solid (universal, @opentui/solid), run with Bun; reuses sky's api.ts and post model; home feed with tabs, post card, thread; keyboard and mouse navigation; tests on recorded fixtures through a snapshot of the terminal buffer. Styles kept in one place as plain OpenTUI props until the TUI target lands.

## Todo
- [ ] build pipeline (vite build -> bun run) and the cssints plugin in it
- [x] feed with tabs, post card, thread, navigation
- [x] tests (recorded fixtures, buffer snapshot)
- [ ] AGENTS.md layout line, wayfinder entry
