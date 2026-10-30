---
# cssints-3h4g
title: Adopt createTimeline rows mode in the o11y dashboard's trace waterfall
status: todo
type: task
priority: normal
created_at: 2026-10-30T18:07:54Z
updated_at: 2026-10-30T18:07:57Z
parent: cssints-65eb
blocked_by:
    - cssints-t4c4
---

apps/o11y-dashboard/src/views/Traces.tsx hand-rolls div.span-row rows (offsetPct/widthPct from traces-layout.ts). Replace them with createTimeline({ rows }) from @cssints/headless: spanBar() becomes barProps, depth*14px padding becomes --depth, the selected span becomes selected + onSelect. Behavior to keep: 0.5% minimum bar width (now the primitive's floor), status color by data-status. Lives in effects-of-atmosphere, main checkout.
