---
# cssints-ey13
title: 'Docs site: a live TUI page (ghostty-web + bomb.sh, system theme from the site palette)'
status: in-progress
type: feature
created_at: 2026-10-10T20:55:11Z
updated_at: 2026-10-10T20:55:11Z
---

A TUI page on the docs site with a live terminal: ghostty-web in the browser runs a sky screen (feed with tabs from sky's recorded fixtures) on the @bomb.sh/tty adapter, keys and mouse live. The system theme answers OSC 10/11/4 from the site's display settings (palette, light/dark), so changing them re-solves the terminal theme. OpenTUI cannot run in a browser (native Zig over bun:ffi), so it is not shown.

## Todo
- [ ] Spike: @bomb.sh/tty (wasm, node:zlib) and @cssints/tui/bomb run in a browser; ghostty-web as the terminal
- [ ] Sky screen on bomb.sh, sharing sky-tui's styles.ts and sky's fixtures
- [ ] OSC replies from the site palette; re-solve on a settings change
- [ ] Docs page (lazy, like /playground), linked from API.md TUI
- [ ] Browser test (Chrome): renders, j/k moves focus, a palette change recolours
- [ ] Docs: API.md TUI, wayfinder
