---
# cssints-tt24
title: 'Docs site: theme settings (hue, light/dim/dark, text size and density, font and radii)'
status: in-progress
type: feature
created_at: 2026-10-09T12:50:59Z
updated_at: 2026-10-09T12:50:59Z
---

Asked by the user (2026-10-09). A settings panel on cssints.accio.blue like apps/sky's /settings, built on cssints tokens and themes, persisted in localStorage, applied before first paint.
- [ ] Accent hue slider: the accent palette as derived tokens (color-mix/relative colour from a hue token, as sky does), check.contrast over the hue range (sky's contrast.mjs pattern), the derived-token runtime for old targets.
- [ ] Modes: system, light, dim, dark (dim new).
- [ ] Text size (e.g. 3 steps) and density (compact/normal/comfortable) through tokens (font.scale, space scale), not per-component code.
- [ ] Font family (system sans, serif, and one via @cssints/fonts if it fits) and radius scale (sharp/normal/round) as tokens.
- [ ] A panel reachable from the header (popover or /settings page; say which), keyboard accessible; prerendered pages stay correct (settings applied before paint by an inline script, as the mode toggle does).
- [ ] Tests: build check (themes in the sheet, contrast passes), Chrome check (each setting changes computed styles, persists across reload, no console error).
