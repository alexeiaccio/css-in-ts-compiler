---
# cssints-41z7
title: apps/sky-tui on OpenTUI + Solid
status: completed
type: feature
priority: normal
created_at: 2026-10-10T11:34:51Z
updated_at: 2026-10-10T11:54:37Z
parent: cssints-06ws
---

apps/sky-tui: Vite SSR build with vite-plugin-solid (universal, @opentui/solid), run with Bun; reuses sky's api.ts and post model; home feed with tabs, post card, thread; keyboard and mouse navigation; tests on recorded fixtures through a snapshot of the terminal buffer. Styles kept in one place as plain OpenTUI props until the TUI target lands.

## Todo
- [ ] build pipeline (vite build -> bun run) and the cssints plugin in it
- [x] feed with tabs, post card, thread, navigation
- [x] tests (recorded fixtures, buffer snapshot)
- [x] AGENTS.md layout line, wayfinder entry

## Engine gaps

- The app cannot build as the `ssr` environment: cssints evaluates style modules there and makes the JSX of every module in it inert (`__jsx`, plugin.ts `inertJsx`). Repro: `build.ssr: "src/main.tsx"` with `cssints()` in the plugins, then `bun dist/main.js` throws `ReferenceError: __jsx is not defined`. Workaround: a Vite environment of its own, `tui` (`consumer: "server"`), built by `builder.buildApp`.

## Summary of Changes

- apps/sky-tui: @opentui/solid 0.5.17 on its own solid-js 1.9.12; Vite build (vite-plugin-solid universal, moduleName @opentui/solid, solid-js aliased to its client build, @opentui/core external, environment `tui`) to one dist/main.js run by Bun; the cssints plugin in the config.
- Screens: home feed with three tabs (paging near the end), post card (author, facets, counts, embeds as text, quote boxes, repost line), thread (parents, focused post with full time and counts, replies indented to MAX_DEPTH, "Show N more" opens the branch). Keys j/k/arrows, enter, esc/backspace, tab/shift-tab/1-3, t, q; mouse click, wheel, hover highlight and pointer cursor; dark and light themes.
- src/styles.ts: every style as plain OpenTUI style objects plus hoverable().
- Shared from apps/sky by relative import: api.ts, post/model.ts, thread/model.ts, and FEEDS, moved into home/feeds.ts (tabs.ts re-exports it).
- Tests: test/build.mjs (build check, then under Bun test/screens.mjs on the test renderer with sky's fixtures; skips without Bun). Root typecheck includes sky-tui.
- Docs: AGENTS.md layout and commands, apps/sky-tui/README.md, wayfinder entry.

Deferred: profiles, images, reveal of warned posts, terminal HMR, the TUI target switch (cssints-m0yj).
