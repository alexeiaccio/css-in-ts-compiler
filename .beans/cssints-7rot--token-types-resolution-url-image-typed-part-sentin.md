---
# cssints-7rot
title: 'Token types: resolution, url, image; typed-part sentinels for integer, angle, time, custom-ident'
status: completed
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-29T16:45:34Z
updated_at: 2026-09-29T17:33:11Z
parent: cssints-vy0o
blocked_by:
    - cssints-gcuz
    - cssints-91im
    - cssints-7qqw
---

## Question

Follow-up of cssints-79xr, now that cssints-lmru added the `url` and `resolution` primitives. Blocked by the <color> work, which also edits css.ts.

- [x] `token.resolution`, `token.url`, `token.image` in css-grammar/src/token.ts (TOKEN_TYPES; cssints/src/token.ts builds `token.*` from that table and needed no change), with Chrome accepting a sample `initial-value` for each
- [x] css.ts `PrimitiveMap`: the sentinels `⟨integer⟩`, `⟨angle⟩`, `⟨time⟩`, `⟨custom-ident⟩` (and `⟨resolution⟩`, `⟨url⟩`, `⟨image⟩` as needed) so that tokens of those types fit typed parts at the type level; `test/types/tokens.ts` covers them
- [x] Budget: not exactly unchanged, but ~0. Unused sentinels cost +15 instantiations (tsc, 0.1%) on `empty.ts`, all of it the `⟨url⟩` branch of `UrlRest` (literals in `PrimitiveMap` cost nothing measurable); cssints `unused.ts` +51, `users.ts` +96. Budgets updated (cssints `unused.ts` was 1.3k stale before).

## Summary of Changes

- `token.resolution`, `token.url`, `token.image` added to `TOKEN_TYPES` (css-grammar/src/token.ts); cssints/src/token.ts builds `token.*` from the table, so nothing else changed there. Probes: `1dppx`, `url(x)`, `linear-gradient(red, blue)` (a gradient, so an image token in a `<url>`-only position fails at build time too). Chrome (`CSS.registerProperty` and a real stylesheet served over http) accepts `@property` for all eight new-or-follow-up types; `<image>` already accepted `url()` in types and twin.
- css.ts: sentinels `⟨integer⟩` (fits `<integer>` and `<number>`), `⟨angle⟩`, `⟨time⟩`, `⟨resolution⟩` in `PrimitiveMap`; `⟨custom-ident⟩` handled in `Consume`; `⟨url⟩` in `UrlRest`, so it fits `<url>` and, through the grammar, `<image>`; `⟨image⟩` already worked through the named-syntax branch. `NotIdentStart` now includes `⟨…`, so no sentinel but its own fits `<custom-ident>` or `<ident>` (before, a length or colour token fitted `animationName`).
- Tests: test/types/tokens.ts (positive and negative cases per type), fixtures tokens-types.ts and token-image-as-url.ts, tokens.mjs (`@property` output per type, image-as-url error located). docs/API.md "Tokens" lists the new types and the two exceptions.
- Budget: +15 tsc / +15 tsgo on `empty.ts`, cssints `unused.ts` +51/+51, `users.ts` +96/+116; budget.json files updated.
