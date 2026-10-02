---
# cssints-uifu
title: Mu's design tokens and layout
status: in-progress
type: task
priority: normal
tags:
    - wayfinder:research
created_at: 2026-10-02T14:20:14Z
updated_at: 2026-10-02T14:20:29Z
parent: cssints-co8y
---

## Question

Read eurosky-social-app (github.com/eurosky-social/eurosky-social-app, branch `eurosky/fork`): the theme system in `src/alf` (palette, light/dim/dark themes, spacing, radii, typography scale, fonts), the Mu overrides on top of Bluesky's (brands/, config), and the web layout (left navigation, centre column width, right rail, breakpoints). Also Witchsky's appearance options (tangled.org/jollywhoppers.com/witchsky.app): how the hue slider and colour schemes derive the palette, what "square-ish UI" and square avatars change.

Answer: `apps/sky/src/tokens.json` in DTCG 2025.10 (colour in oklch where it helps the hue slider; dimensions in px), a note in docs/research/mu-design.md with the layout grid, which colours can be derived from one hue (so a hue slider can drive them through derived tokens), the font and its licence, and what Mu's ASSETS.md/NOTICE.md forbid us to reuse.
