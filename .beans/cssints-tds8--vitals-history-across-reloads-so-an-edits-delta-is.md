---
# cssints-tds8
title: 'vitals: history across reloads, so an edit''s delta is visible'
status: todo
type: feature
priority: normal
created_at: 2026-11-07T11:08:55Z
updated_at: 2026-11-07T11:08:55Z
parent: cssints-7rmb
---

One report is a snapshot; the useful question is "did it get better or worse than the last load of this page?".

Build:
- Keep the last ~20 navigations of the origin in `sessionStorage` (key `cssints-vitals:<path>`, capped, JSON, no PII): `{ at, fcp, lcp, cls, ttfb, sheetBytes, classes }`.
- Print the history row: `history  LCP 1.20 s (−180 ms), CLS 0.002 (+0.001) · 12 loads` with a sparkline of LCP and of sheet bytes, and mark the load that changed the sheet the most.
- `vitals.reset()` (and a row `history cleared`) so a noisy series can be dropped.
- Same-page SPA navigations do not create a new navigation entry: key the series by `location.pathname` and only record on load (a `pageshow`/first report), so a re-report inside one session does not pad the series.

Check: the Chromium test reloads the fixture twice with different content, then asserts two entries, a delta, and that `reset()` empties them. Keep the storage write best-effort (private mode throws).
