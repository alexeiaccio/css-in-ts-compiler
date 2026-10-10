---
# cssints-3ff7
title: TUI target in the engine + OpenTUI adapter
status: in-progress
type: feature
priority: normal
created_at: 2026-10-10T11:34:51Z
updated_at: 2026-10-10T12:07:03Z
parent: cssints-06ws
---

Design note docs/research/tui.md, then the engine target: what css.* means in a terminal (cells, colours, text attributes, borders, flex on Yoga), which properties are accepted (grammar subset, type errors for the rest), the output shape (prop objects for OpenTUI renderables), states and themes through a small runtime, and the OpenTUI adapter.

## Todo
- [x] docs/research/tui.md: property mapping, units, states, themes, what is rejected
- [x] engine target and its types
- [x] OpenTUI adapter (box/text props, states, theme switch)
- [x] tests (fixtures, type tests, a render snapshot under Bun)
- [x] docs/API.md section, wayfinder entry
