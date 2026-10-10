---
# cssints-kotl
title: 'TUI target: @bomb.sh/tty adapter'
status: completed
type: feature
priority: low
created_at: 2026-10-10T11:34:51Z
updated_at: 2026-10-10T16:07:47Z
parent: cssints-06ws
blocked_by:
    - cssints-3ff7
---

Second adapter: css.* prop objects to @bomb.sh/tty open() options (layout, bg, border, text colours), pointer states (pointerenter/leave/click) as hover/active, terminal cursor states; a small example.

## Todo

- [x] @cssints/tui/bomb: openProps/textProps (layout, bg, border, text attrs), hex to rgba
- [x] states tracker (pointerenter/leave, pointer down, click), OSC 22 cursor, caret (DECSCUSR, OSC 12), focus
- [x] test/bomb.ts on createTerm (colours, border, hover after a pointer move, theme)
- [x] examples/bomb.ts (list, hover, theme key), run once in a pty
- [x] docs: README, API.md, research/tui.md table, AGENTS.md, wayfinder

## Summary of Changes

- `@cssints/tui/bomb` (packages/tui/src/bomb.ts): `openProps`/`textProps` map resolved props to bomb.sh's open()/text() options (sizes fixed/percent/fit/grow, direction, padding, gap, alignX/alignY, bg, a one-cell border with round corners for `rounded`, clip, floating, display none as a 0-size box, attrs bits); `createTracker()` keeps :hover/:active/:focus across frames from pointerenter/leave and pointer.down, renders again when a state changed, writes OSC 22 for `cursor` and DECSCUSR/OSC 12 for the caret, `reset()` undoes them. Core unchanged.
- @bomb.sh/tty 0.9.0: optional peer and dev dependency; subpath export and pack entry.
- test/bomb.ts (Node, in `bun run test`): frames at 30x8 read back as cells; colours, border, attrs, hover after a pointer move, press, click, theme, focus, caret.
- examples/bomb.ts + run.mjs (`bun run example`): ran in a pty with SGR mouse input (hover, press, click, theme key, q).
- Docs: README, API.md, research/tui.md (mapping table and what does not map), AGENTS.md, wayfinder.

Deferred: scroll offsets (no option in the 0.9 ops), a key-driven focus helper, transitions as a style member.
