---
# cssints-m0yj
title: sky-tui styled with cssints' TUI target
status: in-progress
type: task
priority: normal
created_at: 2026-10-10T11:34:51Z
updated_at: 2026-10-10T15:46:15Z
parent: cssints-06ws
blocked_by:
    - cssints-3ff7
    - cssints-41z7
---

Move sky-tui's plain OpenTUI props to cssints' TUI target (themes, hover/focus states).

## Todo
- [ ] switch src/styles.ts to cssints/tui and @cssints/tui/opentui (use/attach, themes via setTheme)
- [ ] drop the `tui` Vite environment workaround now that cssints-ybcm is fixed (plain `vite build --ssr`)
