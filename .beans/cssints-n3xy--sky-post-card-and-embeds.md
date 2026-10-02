---
# cssints-n3xy
title: 'sky: post card and embeds'
status: completed
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-10-02T15:09:09Z
updated_at: 2026-10-02T16:01:18Z
parent: cssints-co8y
blocked_by:
    - cssints-dqw8
---

## Question

The post card, the showcase of frames and surfaces. Read docs/research/atproto-data.md (data layer, moderation, paging, Solid 2 traps) and docs/research/mu-design.md (tokens, layout, licence). Show the cssints feature named here and keep apps/sky's build, HMR and type checks green; add a check for what you build (build output or a node test against a recorded API fixture, never the live API in `bun run test`).

- Avatar, display name, handle, relative time, rich text with facets (segmenter; links from `feature.uri`), counts (reply, repost, like) and their icons (Phosphor via @cssints/icons with @iconify-json/ph), the moderation rule (hide, blur with a reveal).
- Embeds: images (1 to 4, aspect ratios), gallery, external link card, quote (record, including not found, blocked, detached), quote with media, video as a poster with a play mark linking out (no HLS player).
- `frame()`: the card, the quote inside it and the media inside the quote are concentric with no hand-set radii. `surface()`: the quote is a tonal step from the card, which is one from the feed. `container()`: the card's layout depends on its own width (avatar beside or above, media grid columns), not the window.
- A fixture page or story that renders every embed kind from a recorded API sample, for development and the check.

## Summary of Changes

`apps/sky/src/post/`: `Post.tsx` (the card), `Embed.tsx` (images 1 to 4, gallery, external link card, video poster with a play mark linking to bsky.app, quote with the not found / blocked / detached / hidden tombstones, quote with media), `RichText.tsx` (atcute segmenter, links from `feature.uri`, http(s) only, mentions to `/profile/:did`), `Avatar.tsx`, `Feed.tsx` (the feed surface), `layout.ts` (the `post` container condition), `model.ts` (pure choices: embed shapes, grid variant, ratios clamped to 1:2..3:1, text parts, relative time, counts). Moderation: hide is a tombstone, `!warn` blurs the content behind a "Show anyway" button.

- `frame()`: the card (radius written once, `radius.xl`), the quote and the media in the card or in the quote have no radius of their own. Measured in Chrome: 20 / 11 / 6 px at a 360 px card, 20 / 7 / 2 px at 600 px (card, quote, media in the quote; media in the card is the quote's radius).
- `surface()`: feed `bgMuted`, card `lighten(0.04)`, quote and link card `contrast(0.03)` (OKLCH L: light 0.940 / 0.980 / 0.950, dark 0.248 / 0.288 / 0.318).
- `container("post (width >= 28rem)")`: avatar beside the text (wide) or beside the name with the text under it (narrow); images 3 are 3 columns or a banner and two, the gallery 4 or 2 columns, and a wide card pads 12 px instead of 8, so the radii follow.
- Dev page `/dev/posts` (dev server only, `?w=360` fixes the card width) from `test/fixtures/posts.json`, recorded by `scripts/record-posts.mjs` (15 real posts, one per embed kind; not found, detached and warn are the recorded posts with one field changed). Home shows the first Discover page with the card.
- Checks: `test/post.mjs` (model on recorded posts and a sweep of the Discover and author-feed fixtures, in `bun run test`), `test/build.mjs` (container, frame and surface rules, no radius on the quote/media frames, dev page not in a build), `test/posts-browser.mjs` (`bun run test:posts`, Chrome through playwright-core: radii, surface steps, layout at 360 and 600, home).
- cssints gaps, not fixed: the `ssr` environment is the engine's runner (JSX becomes a no-op there), so components cannot be rendered with `ssrLoadModule` and Solid's `renderToString`; there is no `-webkit-line-clamp` member and `lineClamp` warns for every browser, so the link card clamps with `maxHeight`; `oklch()` in a literal warns for the default targets while the same colour in a token does not.
