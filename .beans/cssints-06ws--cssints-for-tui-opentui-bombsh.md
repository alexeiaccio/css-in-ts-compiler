---
# cssints-06ws
title: cssints for TUI (OpenTUI, bomb.sh)
status: completed
type: epic
priority: normal
created_at: 2026-10-10T11:34:51Z
updated_at: 2026-10-10T18:54:52Z
---

cssints for terminal UIs. Decisions (user, 2026-10-10): css.* compiles to typed prop objects, not a cascade; a small runtime applies states (hover/focus/active) and themes. OpenTUI first (with Solid), @bomb.sh/tty ops second (pointer states, cursor). Build: the same cssints/vite plugin, an SSR build with vite-plugin-solid in universal mode for @opentui/solid, run with Bun; no terminal HMR in v1. Example app: apps/sky-tui (feed with tabs, post card, thread) on sky's api.

## Summary of Changes
- cssints/tui: terminal styles compile to typed prop objects (cells, hex colours, text attributes, borders, Yoga flex); web-only properties are type errors.
- @cssints/tui: renderer-neutral runtime (resolve, setTheme, defineTheme), OpenTUI adapter (attach/use, hover/active/focus, mouse pointer, caret, focused colours, text nodes, restyle and use() with an accessor), @bomb.sh/tty adapter (createTracker: pointer states, OSC 22, caret).
- System theme (@cssints/tui/system): roles solved against the terminal's palette (reversed WCAG contrast in OKHSL, chroma cap), OSC 4/10/11 queries, mode 2031 appearance changes, ANSI fallback.
- Engine fixes found on the way: SSR build output (ybcm), culori in dist/tui.mjs (649r), the build evaluation server's resolve (qnif).
- apps/sky-tui: feed with tabs, post card, thread on OpenTUI + Solid 1.9, styled with cssints/tui, system theme by default; tests on OpenTUI's test renderer with sky's fixtures.
