---
# cssints-1kob
title: 'sky: appearance settings'
status: in-progress
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-10-02T15:09:09Z
updated_at: 2026-10-02T15:34:14Z
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
