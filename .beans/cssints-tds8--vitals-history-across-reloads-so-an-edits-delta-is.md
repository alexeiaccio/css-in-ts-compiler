---
# cssints-tds8
title: 'vitals: history across reloads, so an edit''s delta is visible'
status: completed
type: feature
priority: normal
created_at: 2026-11-07T11:08:55Z
updated_at: 2026-11-07T12:30:27Z
parent: cssints-7rmb
---

One report is a snapshot; the useful question is "did it get better or worse than the last load of this page?".

Build:
- Keep the last ~20 navigations of the origin in `sessionStorage` (key `cssints-vitals:<path>`, capped, JSON, no PII): `{ at, fcp, lcp, cls, ttfb, sheetBytes, classes }`.
- Print the history row: `history  LCP 1.20 s (−180 ms), CLS 0.002 (+0.001) · 12 loads` with a sparkline of LCP and of sheet bytes, and mark the load that changed the sheet the most.
- `vitals.reset()` (and a row `history cleared`) so a noisy series can be dropped.
- Same-page SPA navigations do not create a new navigation entry: key the series by `location.pathname` and only record on load (a `pageshow`/first report), so a re-report inside one session does not pad the series.

Check: the Chromium test reloads the fixture twice with different content, then asserts two entries, a delta, and that `reset()` empties them. Keep the storage write best-effort (private mode throws).

## Outcome (2026-11-07)

`src/vitals/history.ts`: the last 20 loads of the origin in `sessionStorage` (`cssints-vitals`), validated on read, one
record per page load (a second report is the same load), `reset()` clears the series and the sheet's measurements. The row
prints `history 12 loads · LCP 1.20 s (−180 ms) (−312 B)` with a sparkline, comparing only with the previous load of the
same path. Checks: the node test (record/order/cap/broken JSON/validation/clear on a fake vault) and the Chromium test
(the first report records, a reload is the second load).
