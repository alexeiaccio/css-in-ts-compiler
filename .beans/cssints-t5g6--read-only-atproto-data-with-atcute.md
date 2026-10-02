---
# cssints-t5g6
title: Read-only atproto data with atcute
status: todo
type: task
tags:
    - wayfinder:research
created_at: 2026-10-02T14:20:14Z
updated_at: 2026-10-02T14:20:14Z
parent: cssints-co8y
---

## Question

What a read-only client needs from atcute and the public AppView (`https://public.api.bsky.app`) without auth: the packages (`@atcute/client`, `@atcute/bluesky` lexicon types, the richtext segmenter for facets, identity resolution of handles), which endpoints work unauthenticated today (`app.bsky.feed.getFeed` for a feed generator such as Discover, `getAuthorFeed`, `getPostThread`, `app.bsky.actor.getProfile`, `getFeedGenerator`; check `searchPosts`), pagination by cursor, the embed union (`images`, `external`, `record`, `recordWithMedia`, `video`) and CDN image URLs and thumbnails, labels that must hide or blur content, and how this sits on Solid 2's async model (async `createMemo`, `<Loading>`, `isPending`, infinite scroll).

Answer: docs/research/atproto-data.md with a short data-layer sketch in TS (typed with atcute, one function per screen), the endpoint list with what each returns, and the traps found by calling the API.
