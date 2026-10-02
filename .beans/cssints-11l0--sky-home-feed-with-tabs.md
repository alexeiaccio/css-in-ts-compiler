---
# cssints-11l0
title: 'sky: home feed with tabs'
status: todo
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-10-02T15:09:09Z
updated_at: 2026-10-02T15:09:10Z
parent: cssints-co8y
blocked_by:
    - cssints-n3xy
---

## Question

The home screen. Read docs/research/atproto-data.md (data layer, moderation, paging, Solid 2 traps) and docs/research/mu-design.md (tokens, layout, licence). Show the cssints feature named here and keep apps/sky's build, HMR and type checks green; add a check for what you build (build output or a node test against a recorded API fixture, never the live API in `bun run test`).

- Tabs of a fixed list of feeds (Discover and two or three popular ones by their at:// URIs), infinite scroll with the paging helper (keep loading while a cursor exists; stop on 414 with a "that's all" note), `<Loading>` for the first page and `isPending` for later ones.
- Loading skeletons animated with `keyframes()`; respect `prefers-reduced-motion`.
- Tabs styled with tokens and a surface; the active tab's indicator animated.
