---
# cssints-h6qk
title: Prefer webref property grammars where mdn-data is stale
status: completed
type: task
priority: normal
tags:
    - wayfinder:research
created_at: 2026-09-29T16:34:08Z
updated_at: 2026-09-30T08:57:30Z
parent: cssints-vy0o
---

## Question

After cssints-lmru, KNOWN holds 324 rows where mdn-data is stale or wider than the spec, and the reverse direction (Chrome accepts, twin rejects) is mostly stale mdn-data grammars (`image-orientation: none`, `tab-size: 3.5`). Should extract.mjs take the webref grammar of a property when it differs from mdn-data in a way Chrome confirms? Measure what changes in diff-support (KNOWN rows, reverse rows) and in the budget.

## Resolution

Findings: [docs/research/webref-grammars.md](../docs/research/webref-grammars.md). Measured with mdn-data 2.27.1, @webref/css 8.7.5, Chrome 154.0.8037.58. The shipped grammar is unchanged; the only code is a default-off `WEBREF=all|@list.json` / `EXTRACT_OUT` switch in `scripts/extract.mjs`.

**Where webref differs (529 properties, by behaviour against Chrome):** 302 same (259 identical text, 3 cosmetic, 33 restructured/naming, 7 not in webref), 8 range only, 9 webref narrower and right, 26 webref wider and right (mdn-data stale), 5 both directions and right, 3 both and mdn-data right, 86 webref newer than Chrome, 90 mixed. Syntaxes (319): 223 identical text, 16 cosmetic, 59 different, 21 renamed or ours. The twin parses 1401 of 1403 webref grammars (two webref typos); one parameterised type exists (`if-condition`, already overridden).

**Variants** (mdn-data / 47 properties / all webref): agreement with Chrome on a common 91 767-case sample 88.60% / 90.02% / 84.60%; reverse rows (Chrome accepts, twin rejects) 2300 / 1499 / 1508; twin accepts, Chrome rejects 8164 / 7656 / 12 620; diff.ts 91.58% / 91.95% / 86.64%; KNOWN rows 'mdn-data stale or wider' 309 / 274 / 224 (unexplained 26 / 25 / 1024); types vs twin 4232/4232 in all three. Budgets: 47 properties add +0.5% to wide.ts and +0.16% to cssints users.ts; all webref goes OVER on math.ts (+13.9%), nocolor.ts (+13.5%), wide.ts (+13.3%) and users.ts (+11.2%). The 47 pass every css-grammar test; all webref breaks 7 curated cases, 2 prose-rule cases and a type probe (unresolved `<size-keyword>`, renamed types, draft syntax). 171 properties would accept syntax Chrome 154 rejects.

**Recommendation: switch per property, not everything, not stay.** Rule: take the webref grammar of p when (1) webref and mdn-data both have p, (2) its webref closure parses and resolves (no `<size-keyword>`, `<url-set>`; function types and the four native names stay mdn-data's), (3) the two grammars differ on a sample (300 values each plus mutants), (4) Chrome rejects every value only mdn-data accepts and accepts every value only webref accepts (ignoring `paint(` and CSS-wide keywords), (5) repeat on the assembled table. Today that is 47 properties (45 with the CSS-wide exemption, not re-measured). Ship it as a committed list read by extract.mjs plus a Chrome-backed dev script; re-run on any Chrome, webref or mdn-data bump. Follow-ups: drop the obsolete KNOWN entries (tab-size, transform-origin, position-area, column-rule-style), and small hand overrides for the mixed properties (image-orientation none, column-rule-width lists, zoom, outline-color).
