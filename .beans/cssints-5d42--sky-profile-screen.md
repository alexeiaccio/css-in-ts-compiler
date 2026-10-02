---
# cssints-5d42
title: 'sky: profile screen'
status: completed
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-10-02T15:09:09Z
updated_at: 2026-10-02T16:29:00Z
parent: cssints-co8y
blocked_by:
    - cssints-n3xy
---

## Question

The profile screen at `/profile/:handle`. Read docs/research/atproto-data.md (data layer, moderation, paging, Solid 2 traps) and docs/research/mu-design.md (tokens, layout, licence). Show the cssints feature named here and keep apps/sky's build, HMR and type checks green; add a check for what you build (build output or a node test against a recorded API fixture, never the live API in `bun run test`).

- Header: banner, avatar overlapping it, display name, handle, bio as rich text, follower/following/post counts; its layout by `container()` (wide: avatar beside the name, narrow: stacked).
- Tabs Posts / Replies / Media via `getAuthorFeed` filters, with the post card and the paging helper; pinned post first.
- Not found and errors as states.

## Summary of Changes

- Profile screen at /profile/:handle (src/screens/Profile.tsx, src/profile/): banner, avatar overlapping it (reads radius.avatar), name, handle, bio as the post card's RichText, follower/following/post counts. Header layout is container("column (width < 500px)"): wide, the avatar (96 px) sits beside the name; narrow, 72 px and stacked.
- Tabs Posts / Replies / Media = getAuthorFeed filters posts_no_replies / posts_with_replies / posts_with_media, post card, createPaged, an IntersectionObserver sentinel (one per page, in src/profile/Sentinel.tsx: home's helper was not merged). Pinned post first and labelled on Posts only (api.ts asks for pins on that filter only); repost and reply lines. Not found, suspended, deactivated, hidden (!no-unauthenticated) and network errors are states with retry where it helps; document title set.
- Engine: CSS-wide keywords (inherit, initial, unset, revert, revert-layer) are a value of every property (types and twin; test in css-grammar); the Module Runner now makes JSX inert in .tsx files without cssints that a module with sites imports (test in jsx.mjs).
- Tests: test/profile.mjs (model and loaders on recorded fixtures profile-*.json), build.mjs header rules, test/profile-browser.mjs (Chrome: container breakpoint at 499/500 px, avatar radius with square-avatars, tabs, pin, sentinel, states).
