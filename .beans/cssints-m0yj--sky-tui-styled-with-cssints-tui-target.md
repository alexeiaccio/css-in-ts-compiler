---
# cssints-m0yj
title: sky-tui styled with cssints' TUI target
status: completed
type: task
priority: normal
created_at: 2026-10-10T11:34:51Z
updated_at: 2026-10-10T16:11:19Z
parent: cssints-06ws
blocked_by:
    - cssints-3ff7
    - cssints-41z7
---

Move sky-tui's plain OpenTUI props to cssints' TUI target (themes, hover/focus states).

## Todo
- [x] switch src/styles.ts to cssints/tui and @cssints/tui/opentui (use/attach, themes via setTheme)
- [x] drop the `tui` Vite environment workaround now that cssints-ybcm is fixed (plain `vite build --ssr`)

- [x] test/screens.mjs green (the focus, the drawn border, the theme both ways); the app run in a pty (`script`): starts, `t` switches the theme, `q` quits
- [x] README, AGENTS.md, a wayfinder entry

## Summary of Changes

- src/styles.ts on `cssints/tui`: nine colour tokens (`createTokens`, dark by default), the `light` theme (`createGlobalTheme`), `hover`/`focus` states and `cursor("pointer")`; `hoverable()`, the palettes and the mode signal are gone. The components use `use()` of @cssints/tui/opentui; `t` and `--light` call `setTheme`.
- The selected row is the keyboard focus (its `:focus` is the accent border); the active tab is a second style under `<Show>`.
- vite.config.ts: a plain SSR build (`build.ssr`, `ssr.noExternal`, `@opentui/core` external); @cssints/tui aliased to its source (no dist). test/build.mjs unchanged and green.
- test/screens.mjs reads the drawn border colour (it read the prop, which hid cssints-pkpg), checks the focus and the theme both ways.

## Engine gaps

- cssints-5vnf: `use()` throws on a text node (`<span>`, `<a>`). Workaround: `span(style)` in Post.tsx (resolve + props, a theme signal).
- cssints-pkpg: a focused box draws `focusedBorderColor`. Workaround: `Row` sets it from the style.
- cssints-649r: dist/tui.mjs drops culori's colour modes. Workaround: `import "culori" with { type: "cssints" }` in styles.ts.
- cssints-qnif: the build's evaluation server ignores `resolve.alias`. Workaround: styles.ts imports only cssints/tui.
