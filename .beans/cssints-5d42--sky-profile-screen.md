---
# cssints-5d42
title: 'sky: profile screen'
status: in-progress
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-10-02T15:09:09Z
updated_at: 2026-10-02T16:04:45Z
parent: cssints-co8y
blocked_by:
    - cssints-n3xy
---

## Question

The profile screen at `/profile/:handle`. Read docs/research/atproto-data.md (data layer, moderation, paging, Solid 2 traps) and docs/research/mu-design.md (tokens, layout, licence). Show the cssints feature named here and keep apps/sky's build, HMR and type checks green; add a check for what you build (build output or a node test against a recorded API fixture, never the live API in `bun run test`).

- Header: banner, avatar overlapping it, display name, handle, bio as rich text, follower/following/post counts; its layout by `container()` (wide: avatar beside the name, narrow: stacked).
- Tabs Posts / Replies / Media via `getAuthorFeed` filters, with the post card and the paging helper; pinned post first.
- Not found and errors as states.
