---
# cssints-unkt
title: 'Grammar coverage: all mdn properties through extract, twin and types'
status: completed
type: task
priority: normal
tags:
    - wayfinder:research
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T13:43:32Z
parent: cssints-vy0o
---

## Question

Today `mdn.ts` holds the 57 properties the runner uses. What happens with every non-obsolete mdn property (~600)?

- `scripts/extract.mjs` for all properties: how many grammars and syntaxes, and the file size.
- Twin `parse`: which grammars fail, and why.
- `test/diff.ts` and `test/diff-support.ts` over all properties: agreement with Chrome, and a list of new unexplained rows grouped by cause.
- Type level: the `bench/empty.ts` baseline and per-call cost when `Props` has ~600 entries. Does a big `properties` object cost anything when unused? Measure tsc and tsgo.

Answer with numbers and a recommendation: all properties at once, or a curated set with an opt-in for the rest.

## Resolution

Findings: [docs/research/grammar-coverage.md](../docs/research/grammar-coverage.md).

- Extract, all 636 non-obsolete properties (490 standard, 107 nonstandard, 39 experimental; 15 obsolete left out): 256 syntaxes, 66.5 KB (15.5 KB gzip), against 57/143/18.6 KB today. 15 referenced types have no syntax and no primitive (url, flex, zero, resolution, …); 88 properties reach one of them.
- Twin: all 892 grammars parse. The recognizer rejects every value of animation-duration, transition-duration and font-style oblique: `Number("0s")` in a range bound is NaN. `#{2,}` breaks the types (`Dec`) and gen.ts.
- Chrome 154: twin vs Chrome agree on 84.1 % of rows (96.6 % for the 57). 2516 unexplained "twin accepts, Chrome rejects" rows (0 today): 1696 from nonstandard properties (74 `-ms-`/`-moz-` properties unknown to Chrome, with no BCD entry), 820 from standard/experimental properties, grouped by cause in the findings. Types vs twin: 27 disagreements (unit ranges, the looser `<custom-ident>`, 3× TS2589, `{2,}`).
- Types: an unused big table costs 0 instantiations (empty.ts 15055 tsc / 15228 tsgo, the same as today). 635 declared functions add ~625. 100 calls on 100 properties: ~4.2 k per call, tsc 1.18 s, tsgo 0.49 s wall. Outlier: `font-variant: "none"` costs 4.3 M instantiations and TS2589 (tsc 9 s, 1.5 GB). A one-line `[S] extends [never]` short-circuit in `AnyOrder` brings it to 51 k, and the per-property max to 249 k.

Recommendation: ship all standard and experimental properties at once (no curated set). Keep the 107 nonstandard properties out, or behind an opt-in. Fix these first: `AnyOrder` never-short-circuit, open `{A,}`, unit-aware range bounds in the twin and gen.ts, the flex/url/resolution/zero primitives, and the KNOWN rules extended to the new properties.
