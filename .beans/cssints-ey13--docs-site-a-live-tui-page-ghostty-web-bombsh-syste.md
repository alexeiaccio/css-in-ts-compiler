---
# cssints-ey13
title: 'Docs site: a live TUI page (ghostty-web + bomb.sh, system theme from the site palette)'
status: completed
type: feature
priority: normal
created_at: 2026-10-10T20:55:11Z
updated_at: 2026-10-10T22:06:55Z
---

A TUI page on the docs site with a live terminal: ghostty-web in the browser runs a sky screen (feed with tabs from sky's recorded fixtures) on the @bomb.sh/tty adapter, keys and mouse live. The system theme answers OSC 10/11/4 from the site's display settings (palette, light/dark), so changing them re-solves the terminal theme. OpenTUI cannot run in a browser (native Zig over bun:ffi), so it is not shown.

## Todo
- [x] Spike: @bomb.sh/tty (wasm, node:zlib) and @cssints/tui/bomb run in a browser; ghostty-web as the terminal
- [x] Sky screen on bomb.sh, sharing sky-tui's styles.ts and sky's fixtures
- [x] OSC replies from the site palette; re-solve on a settings change
- [x] Docs page (lazy, like /playground), linked from API.md TUI
- [x] Browser test (Chrome): renders, j/k moves focus, a palette change recolours
- [x] Docs: API.md TUI, wayfinder

## Engine gaps

- `cssints/tui`'s `createTokens` and `createGlobalTheme` are the web ones: they declare `@property` rules in the process-global registry. In a build that also has web styles (apps/docs importing apps/sky-tui's styles.ts) the names clash: `MacroError: cssints: --color-bg is already declared with another @property, in src/theme.ts`. Repro: import `apps/sky-tui/src/styles.ts` from any module of apps/docs and `bun run build`. Workaround: `apps/docs/plugin/tui-styles.ts` builds styles.ts in a child process into plain prop objects. Fix: tui tokens stay out of the sheet's `@property` table.

## Summary of Changes

- `/tui` on the docs site (lazy route, `apps/docs/src/tui/`): ghostty-web 0.4 runs sky's feed (tabs) and thread on `@cssints/tui/bomb` with apps/sky-tui's `styles.ts` and `system.ts`, sky's `api.ts` and models; posts from sky's recorded fixtures (`fixtures.ts`, a fetch handler for `@atcute/client`: no request). Keys (j/k, arrows, tab/shift-tab, 1-3, enter, esc) and the mouse (hover, pointer, click).
- The page is the terminal (`host.ts`): answers OSC 10/11/4 and `CSI ? 996 n` from the site's colour tokens, sends `CSI ? 997 ; 1|2 n` when the settings or the system scheme change (mode 2031 on), encodes SGR mouse reports (ghostty-web has none), sends `CSI Z` for shift-tab, sets the canvas cursor from OSC 22.
- `plugin/tui.ts`: bomb.sh's brotli-packed WASM unpacked at build time into an asset (no `node:zlib`), ghostty-web's inlined WASM replaced by its `.wasm` file, the fixtures shim, `@cssints/tui` from source, sky-tui's styles built in a child process (`tui-styles.ts`, see Engine gaps), the `tui/index.html` document.
- Fix in `@cssints/tui`: the bomb.sh follower re-asked the scheme report on a change notification and looped with a terminal that answers it; it asks `COLOURS` now (new export of `@cssints/tui/system`), with a test.
- apps/sky-tui: `src/model.ts` (thread rows, embed text, quote tombstones) shared with the page.
- Tests: `apps/docs/test/tui.mjs` (Chrome: fixture text read from ghostty-web's buffer, j/k border colour, tab, enter/esc, hover background and pointer, settings panel dark/flexoki/light recolour cells; fails on any request to bsky); build.mjs: nothing of it in the entry, the chunk and both wasm files, the tui document.
- Docs: API.md TUI bullet links the page; markdown.ts makes `https://cssints.dev/<page>` links site links; apps/docs README, AGENTS.md, wayfinder entry.
- Size: lazy chunk 299 kB (82 kB gzip) + ghostty-vt.wasm 423 kB (126 kB gzip) + bomb-tty.wasm 117 kB (39 kB gzip).
