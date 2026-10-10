---
# cssints-06ws
title: cssints for TUI (OpenTUI, bomb.sh)
status: in-progress
type: epic
priority: normal
created_at: 2026-10-10T11:34:51Z
updated_at: 2026-10-10T11:34:51Z
---

cssints for terminal UIs. Decisions (user, 2026-10-10): css.* compiles to typed prop objects, not a cascade; a small runtime applies states (hover/focus/active) and themes. OpenTUI first (with Solid), @bomb.sh/tty ops second (pointer states, cursor). Build: the same cssints/vite plugin, an SSR build with vite-plugin-solid in universal mode for @opentui/solid, run with Bun; no terminal HMR in v1. Example app: apps/sky-tui (feed with tabs, post card, thread) on sky's api.
