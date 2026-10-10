---
# cssints-kotl
title: 'TUI target: @bomb.sh/tty adapter'
status: in-progress
type: feature
priority: low
created_at: 2026-10-10T11:34:51Z
updated_at: 2026-10-10T16:00:08Z
parent: cssints-06ws
blocked_by:
    - cssints-3ff7
---

Second adapter: css.* prop objects to @bomb.sh/tty open() options (layout, bg, border, text colours), pointer states (pointerenter/leave/click) as hover/active, terminal cursor states; a small example.

## Todo

- [x] @cssints/tui/bomb: openProps/textProps (layout, bg, border, text attrs), hex to rgba
- [x] states tracker (pointerenter/leave, pointer down, click), OSC 22 cursor, caret (DECSCUSR, OSC 12), focus
- [x] test/bomb.ts on createTerm (colours, border, hover after a pointer move, theme)
- [ ] examples/bomb.ts (list, hover, theme key), run once in a pty
- [ ] docs: README, API.md, research/tui.md table, AGENTS.md, wayfinder
