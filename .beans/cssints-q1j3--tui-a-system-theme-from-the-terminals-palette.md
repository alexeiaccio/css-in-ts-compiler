---
# cssints-q1j3
title: 'TUI: a system theme from the terminal''s palette'
status: completed
type: feature
priority: normal
created_at: 2026-10-10T15:47:29Z
updated_at: 2026-10-10T18:13:07Z
parent: cssints-06ws
blocked_by:
    - cssints-kotl
---

Reference: https://earendil.com/posts/system-theme/ (Pi's system theme, default since Pi 1.0.4) and Pi's docs/themes.md.

Idea: a `system` theme for cssints/tui built at run time from the terminal's own colours instead of a palette shipped by the app.
- Query the terminal: OSC 10/11 (fg/bg), OSC 4 (the 16 ANSI colours); wait at most ~100 ms, apply late answers. Check first whether OpenTUI already exposes this (palette detection on the renderer) and what @bomb.sh/tty's input parser reports.
- Each token is a role: a hue source (an ANSI slot, e.g. error <- red, link <- blue) and contrast rules against the surfaces it sits on (text >= 4.5:1 on bg and every panel). Lightness is solved from the strictest rule (reversed contrast: reuse cssints' contrast maths, cssints/check and check.contrast); hue and OKHSL saturation come from the terminal colour; chroma capped at the source's chroma, bell-shaped falloff near black/white.
- Fallbacks: only bg reported -> app's own hues; nothing reported -> ANSI colour indices, let the terminal draw them.
- Light/dark: decide from the reported bg; else the terminal's colour-scheme notification (CSI ?996n / mode 2031), then COLORFGBG, then dark. Rebuild on an appearance change notification.
- API sketch: createTokens roles with `css.system({ hue: 'red', on: [t.bg, t.panel], contrast: 4.5 })` or a theme `createSystemTheme(t, rules)`; the runtime theme table this needs also answers the open question of inline vs one shared theme table (cssints-3ff7 shipped inline per-site values).

## Todo
- [x] research: what OpenTUI / @bomb.sh/tty already offer (OSC 4/10/11, scheme notifications); note in docs/research/tui.md
- [x] API for role tokens and the system theme; runtime theme table
- [x] solver (reversed contrast, OKLCH/OKHSL), unit tests on a few known palettes (Gruvbox dark, Catppuccin Latte, Nord)
- [x] OSC queries + fallbacks + appearance change in both adapters
- [x] sky-tui uses `system` by default, `--light`/`--dark` keep working

## Summary of Changes

- **API** (docs/research/tui.md "The system theme", docs/API.md "TUI"): `createSystemTheme(tokens, roles, options)` of `@cssints/tui/system`, roles in the shape of the tokens (`{ hue, on, contrast, surface, ansi }`), `options.hues` (the app's own hues) and `options.themes` (the static theme under each appearance); `followSystemTheme` in `@cssints/tui/opentui` (renderer.getPalette, `palette` and `theme_mode` events) and `@cssints/tui/bomb` (writes OSC 10/11/4, `CSI ? 996 n`, mode 2031; `feed(bytes)` takes the replies out of stdin before `input.scan()`).
- **Solver**: keep a source that meets its rules, else bisect OKHSL lightness to the reversed WCAG ratio of the strictest rule at the source's hue and bell-scaled saturation, OKLCH chroma capped at the source's; surfaces at exact contrast toward the foreground. culori's WCAG luminance (check.contrast's maths).
- **Fallbacks/appearance**: bg only -> app hues; nothing -> `ansi:N`/`default` on OpenTUI (RGBA.fromIndex, defaultForeground/Background), the static theme on bomb.sh (no indexed colour); appearance from bg, then the scheme report / OpenTUI themeMode, then COLORFGBG, then dark; rebuild on mode 2031 notifications; 100 ms wait, late replies applied.
- **Theme table**: sites carry `vars` (token per colour prop, named without `--`); `defineTheme(name, values, base)` is the shared run-time table over a static theme; static themes stay inline.
- **sky-tui**: system theme by default (src/system.ts, main.tsx), `--light`/`--dark`/`t` keep the static themes; Post.tsx's span signal never equal, focus border through `props()`.
- **Tests**: packages/tui test/system.ts (Gruvbox dark, Catppuccin Latte, Nord: contrast met, hue within 6 deg, chroma <= source; fallbacks; replies as bytes; bomb follower; table), test/render.ts (OpenTUI on a fake terminal answering OSC 4/10/11, then turning light), test/types/tui.ts (roles types); sky-tui test/screens.mjs (system theme from a fake Gruvbox reply, then Latte after a 2031 notification).
- **Needs on master**: the rebuilt `packages/cssints/dist/tui.mjs` (+ tui-types.d.mts): until then a built app gets no `vars`, and sky-tui's system-theme screen test fails against the old dist (it passes with a locally rebuilt dist, not committed).
