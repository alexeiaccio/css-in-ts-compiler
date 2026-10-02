---
# cssints-uifu
title: Mu's design tokens and layout
status: completed
type: task
priority: normal
tags:
    - wayfinder:research
created_at: 2026-10-02T14:20:14Z
updated_at: 2026-10-02T14:42:10Z
parent: cssints-co8y
---

## Question

Read eurosky-social-app (github.com/eurosky-social/eurosky-social-app, branch `eurosky/fork`): the theme system in `src/alf` (palette, light/dim/dark themes, spacing, radii, typography scale, fonts), the Mu overrides on top of Bluesky's (brands/, config), and the web layout (left navigation, centre column width, right rail, breakpoints). Also Witchsky's appearance options (tangled.org/jollywhoppers.com/witchsky.app): how the hue slider and colour schemes derive the palette, what "square-ish UI" and square avatars change.

Answer: `apps/sky/src/tokens.json` in DTCG 2025.10 (colour in oklch where it helps the hue slider; dimensions in px), a note in docs/research/mu-design.md with the layout grid, which colours can be derived from one hue (so a hue slider can drive them through derived tokens), the font and its licence, and what Mu's ASSETS.md/NOTICE.md forbid us to reuse.

## Resolution

Answered in `apps/sky/src/tokens.json` (DTCG, runs through `createTokens` and the plugin) and `docs/research/mu-design.md`.

- Mu changes colour only (`src/config/brand-theme.ts`, `brand.json`); spacing, radii, type scale and weights are `@bsky.app/alf` 0.1.15 tokens. Font is Inter variable (OFL 1.1, no reserved name).
- Layout: column 600 px, left nav 240 (80 minimal up to 1300), right rail 300 (250 from 1100 to 1300, hidden below 1100), column shifts -105 between 1100 and 1300, breakpoints 500, 800, 1100, 1300.
- Witchsky's hue is an OKLCH rotation of every palette colour but positive, negative and like. Here one number token, `hue.accent`, drives the accent colours as `oklch(L C {hue.accent})`.
- Found while validating: a `createGlobalTheme` override takes plain values, not `{path}` references. The themes set `accentTone.*` numbers and the derived colours follow.
- Dim and dark are `createGlobalTheme` overrides, given as a validated snippet in the research note (the ticket allowed one added file in `apps/sky/src`).
- Assets: use no Bluesky or Mu marks, no `assets/images`, `assets/pets`, Central icons or third-party logos; keep Inter (OFL), Phosphor (MIT).
