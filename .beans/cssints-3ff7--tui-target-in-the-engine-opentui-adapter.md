---
# cssints-3ff7
title: TUI target in the engine + OpenTUI adapter
status: completed
type: feature
priority: normal
created_at: 2026-10-10T11:34:51Z
updated_at: 2026-10-10T14:38:04Z
parent: cssints-06ws
---

Design note docs/research/tui.md, then the engine target: what css.* means in a terminal (cells, colours, text attributes, borders, flex on Yoga), which properties are accepted (grammar subset, type errors for the rest), the output shape (prop objects for OpenTUI renderables), states and themes through a small runtime, and the OpenTUI adapter.

## Todo
- [x] docs/research/tui.md: property mapping, units, states, themes, what is rejected
- [x] engine target and its types
- [x] OpenTUI adapter (box/text props, states, theme switch)
- [x] tests (fixtures, type tests, a render snapshot under Bun)
- [x] docs/API.md section, wayfinder entry

## Summary of Changes

- **Opt-in: the subpath `cssints/tui`** (`import * as css from "cssints/tui" with { type: "cssints" }`), no plugin option. Its members (packages/cssints/src/tui.ts, types in tui-types.ts) build `{ __tui }` nodes; `replacementOf` (macro.ts) turns a site holding one into an object literal of props, through `registry.tui`, after every web shape, so web sites do the same work. `createTokens`/`createGlobalTheme` are re-exported; colour tokens are resolved per named theme at build time (contrast.ts `valueOf`/`together`, now exported), the site carries `themes: { name: { ... } }`.
- **Properties**: color, backgroundColor/bg, borderColor, border(style, color?), borderStyle (solid/double/rounded/heavy/none), fontWeight (bold/normal/lighter=dim), fontStyle, textDecoration(Line), textAlign, padding/margin and sides (p, m, pt..ml, Inline/Block), gap/rowGap/columnGap, width/height/min/max/flexBasis, flex keywords, flexGrow/Shrink, position + edges, overflow, display (flex/none -> visible), opacity, zIndex, cursor, caretShape/Color/Animation; cn, hover, focus, active. Cells only: CSS lengths are type and build errors; colours become #rrggbb(aa) (culori, the derived-token evaluator for color-mix/relative colours).
- **@cssints/tui** (packages/tui): `resolve`, `theme`, `setTheme`, `onTheme` (neutral) and `@cssints/tui/opentui`: `attach(renderable, style)` (hooks `onMouseEvent` so user handlers still run; over/out, down/up, focused/blurred; `setMousePointer` from `cursor`; caret to `cursorStyle`/`cursorColor`; theme listener), `use(style)` = `{ ref }` for Solid/React spreads, `props()`.
- **Plugin**: the `ssr` environment of a build is an output (sites replaced, JSX of site-less components kept, which is cssints-ybcm), only dev ssr and the private build server evaluate. `vite build --ssr` of a Bun app works; a custom environment (sky-tui's `tui`) worked already.
- **Tests**: packages/tui/test/tui.mjs (dev transform, SSR build of .ts and .tsx entries, build errors), render.ts (Bun, OpenTUI test renderer: border chars, colours, hover, press, out, pointer, theme, focus, caret), types/tui.ts. bench/tui.ts budget 184,399 (tsc) / 193,608 (tsgo); web budgets unchanged.
- **Docs**: docs/research/tui.md, docs/API.md "TUI", README "In a terminal", AGENTS.md layout and command, wayfinder entry.

Deferred: terminal HMR, text inheritance, per-side borders/titles, cv()/firstThatWorks on terminal styles, the bomb.sh adapter (cssints-kotl).
