---
# cssints-3h4g
title: Adopt createTimeline rows mode in the o11y dashboard's trace waterfall
status: scrapped
type: task
priority: normal
created_at: 2026-10-30T18:07:54Z
updated_at: 2026-11-02T10:59:26Z
parent: cssints-65eb
blocked_by:
    - cssints-t4c4
---

apps/o11y-dashboard/src/views/Traces.tsx hand-rolls div.span-row rows (offsetPct/widthPct from traces-layout.ts). Replace them with createTimeline({ rows }) from @cssints/headless: spanBar() becomes barProps, depth*14px padding becomes --depth, the selected span becomes selected + onSelect. Behavior to keep: 0.5% minimum bar width (now the primitive's floor), status color by data-status. Lives in effects-of-atmosphere, main checkout.

## Reasons for Scrapping

The work lives in effects-of-atmosphere (this repo's main checkout, `apps/o11y-dashboard`), so it is
tracked there as `1pzr` with the same behaviour to keep (0.5 % minimum bar width, status colour by
`data-status`, depth indent, selection). Keeping a todo here that can only be done in another
checkout is how it gets picked twice or never.
