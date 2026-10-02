---
# cssints-1kob
title: 'sky: appearance settings'
status: completed
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-10-02T15:09:09Z
updated_at: 2026-10-02T15:53:51Z
parent: cssints-co8y
blocked_by:
    - cssints-dqw8
---

## Question

Witchsky-style appearance settings, kept in localStorage. Read docs/research/atproto-data.md (data layer, moderation, paging, Solid 2 traps) and docs/research/mu-design.md (tokens, layout, licence). Show the cssints feature named here and keep apps/sky's build, HMR and type checks green; add a check for what you build (build output or a node test against a recorded API fixture, never the live API in `bun run test`).

- Hue slider (-180 to 180 around Mu pink, 345): sets `--hue-accent` on `<html>`, and every accent colour follows through derived tokens; show a few swatches.
- Theme: light, dim, dark, system.
- Square buttons and square avatars (Witchsky's two flags): theme classes that swap radius tokens; `frame()` children follow.
- A contrast check (`css.check.contrast`) over the themes for text on background and on the accent.
- Where the panel lives (a route `/settings` or the right rail) is the agent's call; say which.

## Summary of Changes

- Panel at `/settings` (nav item with a gear, route in router.tsx), not the right rail: the rail is hidden under 1100 px.
- `src/settings.ts`: the store (`sky.settings` in localStorage; invalid fields fall back one by one), `apply()` writes the mode and flag classes and `--hue-accent` on `<html>`. Slider -180..180 is the shift from 345. Defaults: system, round, hue 0.
- No flash: a 10-line inline script in `index.html` (same rules) plus `html { background: var(--color-bg) }` in base.css.
- `.square-buttons` and `.square-avatars` theme classes swap `radius.button`, `radius.avatar`, `radius.avatarSmall` (tokens already in tokens.json); the nav items read `radius.button`; the preview is two nested `frame()`s whose inner radius follows the outer one.
- Contrast: more pairs in the build check at the default hue (text and textMedium on the three backgrounds, textHigh on bgMuted, link on bg); `test/contrast.mjs` reads the accent pairs at all 361 slider positions in light, dim and dark and holds the worst case to a floor (accent/bg 2.76 light, accentStrong/accentSoft 3.69 light at hue 190: below 3 and 4.5 for that hue).
- Tests: `test/settings.mjs` (parse, store, apply, the inline script run in node:vm on 26 inputs), `test/contrast.mjs`, build.mjs (theme classes, radius tokens), `test/browser.mjs` (Chrome: slider in four modes, radii, reload, first frame with a control that shows the flash).
- Docs: mu-design.md section, one sentence in API.md on check.contrast and run-time values, AGENTS.md layout.
- cssints gap, not fixed: a `check.contrast` applies to every theme that touches its tokens, so it cannot be scoped to a subset of themes (a sweep of per-hue themes would be held to the default-hue thresholds and would ship in the sheet).
