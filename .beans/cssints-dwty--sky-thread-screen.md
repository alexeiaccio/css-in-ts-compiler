---
# cssints-dwty
title: 'sky: thread screen'
status: completed
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-10-02T15:09:09Z
updated_at: 2026-10-02T16:40:59Z
parent: cssints-co8y
blocked_by:
    - cssints-n3xy
---

## Question

The thread screen at `/profile/:handle/post/:rkey`. Read docs/research/atproto-data.md (data layer, moderation, paging, Solid 2 traps) and docs/research/mu-design.md (tokens, layout, licence). Show the cssints feature named here and keep apps/sky's build, HMR and type checks green; add a check for what you build (build output or a node test against a recorded API fixture, never the live API in `bun run test`).

- Parents above, the focused post larger (its own card variant via `cv()`), replies below as a tree with connector lines; sort replies (the API returns them unsorted: by likes, then time); collapse deep branches.
- Not found, blocked and deleted posts as states.

## Summary of Changes

Thread screen at /profile/:handle/post/:rkey (apps/sky).

- Data (api.ts, thread section only): getPostThread with depth 6 and parentHeight 20; replies sorted at every level by likes, then earlier first, tombstones last; a 400 NotFound is a state (root gone/notFound), not an error; blocked, not found and moderated-hidden posts are `gone` nodes in the parent chain, in the replies and as the whole screen.
- Model (src/thread/model.ts): `branches()` cuts the reply tree at 3 levels, the rest sits behind "Show N more replies" (opens in place, same rule again); `titleOf`, `goneText`. src/post/model.ts: `fullTime`, `stats`.
- Screen (src/screens/Thread.tsx): parents above joined by down-lines, focused post scrolled into view under the sticky header, replies as a tree with elbow connectors drawn from the avatar's centre (container "post" rows, so narrow and wide cards agree), document title = opening text of the post.
- Post card (src/post/Post.tsx): the card is now `_cv(cv({ base, variants: { look: { focus } } }))`: bigger text, full timestamp and counts row for the focused post; `Tomb` exported for the states.
- Tests: test/thread.mjs (model on recorded thread-deep, thread-notfound, thread-blocked), build.mjs asserts for the variant and the calc offsets, test/thread-browser.mjs (Chrome, built app, API stubbed; `bun run test:thread`). scripts/record-thread.mjs records the fixtures.
- cssints gaps: none blocking. `calc()` takes no token argument, so the connector offsets use raw `var(--avatar-feed)` in strings.
