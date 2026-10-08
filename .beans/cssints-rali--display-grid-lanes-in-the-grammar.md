---
# cssints-rali
title: 'display: grid-lanes in the grammar'
status: in-progress
type: task
priority: low
created_at: 2026-10-08T14:10:21Z
updated_at: 2026-10-08T15:42:50Z
---

Found by masonry (cssints-btiz, repro `packages/masonry/test/fixtures/gap-display.ts`). mdn-data 2.27.1 lacks `grid-lanes` (BCD 8.1.3 has `css.properties.display.grid-lanes`, Safari 26.4). Add it through scripts/webref-properties.json (or the webref grammar) and regenerate; then masonry's kernel becomes styles with derived conflicts and the gap fixture's assertion flips.

## Todo
- [x] grid-lanes in display's grammar (types and twin)
- [ ] masonry kernel as styles; flip the gap test
