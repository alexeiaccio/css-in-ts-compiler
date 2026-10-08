---
# cssints-rali
title: 'display: grid-lanes in the grammar'
status: completed
type: task
priority: low
created_at: 2026-10-08T14:10:21Z
updated_at: 2026-10-08T15:50:37Z
---

Found by masonry (cssints-btiz, repro `packages/masonry/test/fixtures/gap-display.ts`). mdn-data 2.27.1 lacks `grid-lanes` (BCD 8.1.3 has `css.properties.display.grid-lanes`, Safari 26.4). Add it through scripts/webref-properties.json (or the webref grammar) and regenerate; then masonry's kernel becomes styles with derived conflicts and the gap fixture's assertion flips.

## Todo
- [x] grid-lanes in display's grammar (types and twin)
- [x] masonry kernel as styles; flip the gap test

## Summary of Changes

- extract.mjs appends `grid-lanes | inline-grid-lanes` to mdn-data's `display` grammar in every mode (Chrome 154 rejects them, so neither a `PROP` override nor the webref list can carry them; both twins of the webref rule accept them, so the judge stays Chrome). `flow-tolerance` comes verbatim from webref (`AHEAD_OF_CHROME`). BCD warns for targets before Safari 26.4.
- `bun run webref` rerun: `display` now takes webref's grammar (adds `math`, which Chrome accepts); 46 properties.
- Budgets within the 10% band, not updated (nocolor +4.5%, b100 +1.5% against master).
- masonry: kernel written as styles (display, grid-template-columns, gap, columns), derived conflicts equal the old list and replace it; the `#columns` runtime polyfills `css.properties.display.grid-lanes` and keeps only the children rules under `@supports not`. gap-display fixture became a positive case (builds, warns on default targets); a column-count conflict fixture added. README and wayfinder updated.
