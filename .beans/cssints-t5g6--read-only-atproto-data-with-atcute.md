---
# cssints-t5g6
title: Read-only atproto data with atcute
status: completed
type: task
priority: normal
tags:
    - wayfinder:research
created_at: 2026-10-02T14:20:14Z
updated_at: 2026-10-02T15:00:51Z
parent: cssints-co8y
---

## Question

What a read-only client needs from atcute and the public AppView (`https://public.api.bsky.app`) without auth: the packages (`@atcute/client`, `@atcute/bluesky` lexicon types, the richtext segmenter for facets, identity resolution of handles), which endpoints work unauthenticated today (`app.bsky.feed.getFeed` for a feed generator such as Discover, `getAuthorFeed`, `getPostThread`, `app.bsky.actor.getProfile`, `getFeedGenerator`; check `searchPosts`), pagination by cursor, the embed union (`images`, `external`, `record`, `recordWithMedia`, `video`) and CDN image URLs and thumbnails, labels that must hide or blur content, and how this sits on Solid 2's async model (async `createMemo`, `<Loading>`, `isPending`, infinite scroll).

Answer: docs/research/atproto-data.md with a short data-layer sketch in TS (typed with atcute, one function per screen), the endpoint list with what each returns, and the traps found by calling the API.

## Resolution

Answer: docs/research/atproto-data.md.

- **Packages:** `@atcute/client` 5.1.2, `@atcute/bluesky` 4.0.22 (types plus `unwrapEmbed` and `unwrapQuoteEmbed`), `@atcute/bluesky-richtext-segmenter` 3.0.2. `@atcute/bluesky-moderation` 4.2.2 is optional. `@atcute/identity-resolver` is not needed: `getProfile`, `getAuthorFeed` and `getPostThread` take a handle directly.
- **Works without auth on `public.api.bsky.app`:** `getFeed` (Discover), `getAuthorFeed` (five filters, pins), `getPostThread`, `getProfile(s)`, `getFeedGenerator(s)`, `getPosts`, `getQuotes`, `searchActors`, and the unspecced trends and popular feeds. `getTimeline` and `listNotifications` give 401; `getPreferences` gives 501.
- **`searchPosts` is a CDN 403 (HTML, no CORS) on the public host**; it answers 200 on `api.bsky.app`. Out of the first version.
- **Traps:** Discover's cursor grows until HTTP 414 (about 21 pages of 30); moderation shortens pages; network failures throw `TypeError` and `retryFetchHandler` retries only 429; 17% of Discover posts come from `!no-unauthenticated` accounts and are served anyway; atcute's moderation ignores the Bluesky mod labeler unless it is in `prefsByLabelers`; a missing thread post is 400 `NotFound`; threads are 380 KB and unsorted; a new `gallery` embed exists. Two Solid 2 rc.13 traps found: a store write in the same tick as a source change drops the derived store's re-run, and a signal write is not visible until the flush (guard with a plain variable).
- **Label rule** for a logged-out viewer is a 25-line function; on 10 822 sampled posts it agrees with `@atcute/bluesky-moderation` except where a quoted author is hidden (we hide the quote card, atcute the whole post).
- **Sketch** (data.ts and paged.ts in the doc) passes `tsc` 5.9.3 and `tsgo` strict, runs against the live API, and the paging helper runs under `solid-js@2.0.0-rc.13`.
- **Not verified:** CDN image preset sizes, the video thumbnail and the variant playlists (the CDN hosts were unreachable from my network), a real browser run, and `viewDetached`, `!hide`, `!warn` (none in the sample).
