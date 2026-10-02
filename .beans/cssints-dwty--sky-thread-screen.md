---
# cssints-dwty
title: 'sky: thread screen'
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

The thread screen at `/profile/:handle/post/:rkey`. Read docs/research/atproto-data.md (data layer, moderation, paging, Solid 2 traps) and docs/research/mu-design.md (tokens, layout, licence). Show the cssints feature named here and keep apps/sky's build, HMR and type checks green; add a check for what you build (build output or a node test against a recorded API fixture, never the live API in `bun run test`).

- Parents above, the focused post larger (its own card variant via `cv()`), replies below as a tree with connector lines; sort replies (the API returns them unsorted: by likes, then time); collapse deep branches.
- Not found, blocked and deleted posts as states.
