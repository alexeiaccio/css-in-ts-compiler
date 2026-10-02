---
# cssints-n3xy
title: 'sky: post card and embeds'
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

The post card, the showcase of frames and surfaces. Read docs/research/atproto-data.md (data layer, moderation, paging, Solid 2 traps) and docs/research/mu-design.md (tokens, layout, licence). Show the cssints feature named here and keep apps/sky's build, HMR and type checks green; add a check for what you build (build output or a node test against a recorded API fixture, never the live API in `bun run test`).

- Avatar, display name, handle, relative time, rich text with facets (segmenter; links from `feature.uri`), counts (reply, repost, like) and their icons (Phosphor via @cssints/icons with @iconify-json/ph), the moderation rule (hide, blur with a reveal).
- Embeds: images (1 to 4, aspect ratios), gallery, external link card, quote (record, including not found, blocked, detached), quote with media, video as a poster with a play mark linking out (no HLS player).
- `frame()`: the card, the quote inside it and the media inside the quote are concentric with no hand-set radii. `surface()`: the quote is a tonal step from the card, which is one from the feed. `container()`: the card's layout depends on its own width (avatar beside or above, media grid columns), not the window.
- A fixture page or story that renders every embed kind from a recorded API sample, for development and the check.
