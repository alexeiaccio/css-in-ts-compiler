---
# cssints-7rot
title: 'Token types: resolution, url, image; typed-part sentinels for integer, angle, time, custom-ident'
status: todo
type: task
tags:
    - wayfinder:task
created_at: 2026-09-29T16:45:34Z
updated_at: 2026-09-29T16:45:34Z
parent: cssints-vy0o
blocked_by:
    - cssints-gcuz
---

## Question

Follow-up of cssints-79xr, now that cssints-lmru added the `url` and `resolution` primitives. Blocked by the <color> work, which also edits css.ts.

- [ ] `token.resolution`, `token.url`, `token.image` in css-grammar/src/token.ts (TOKEN_TYPES) and cssints/src/token.ts, with Chrome accepting a sample `initial-value` for each
- [ ] css.ts `PrimitiveMap`: the sentinels `⟨integer⟩`, `⟨angle⟩`, `⟨time⟩`, `⟨custom-ident⟩` (and `⟨resolution⟩`, `⟨url⟩`, `⟨image⟩` as needed) so that tokens of those types fit typed parts at the type level; `test/types/tokens.ts` covers them
- [ ] Budget unchanged for unused sentinels
