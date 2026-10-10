---
# cssints-q1j3
title: 'TUI: a system theme from the terminal''s palette'
status: todo
type: feature
priority: normal
created_at: 2026-10-10T15:47:29Z
updated_at: 2026-10-10T15:47:29Z
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
- [ ] research: what OpenTUI / @bomb.sh/tty already offer (OSC 4/10/11, scheme notifications); note in docs/research/tui.md
- [ ] API for role tokens and the system theme; runtime theme table
- [ ] solver (reversed contrast, OKLCH/OKHSL), unit tests on a few known palettes (Gruvbox dark, Catppuccin Latte, Nord)
- [ ] OSC queries + fallbacks + appearance change in both adapters
- [ ] sky-tui uses `system` by default, `--light`/`--dark` keep working
