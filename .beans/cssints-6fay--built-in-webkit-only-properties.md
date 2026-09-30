---
# cssints-6fay
title: Built-in WebKit-only properties
status: completed
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T08:13:20Z
updated_at: 2026-09-30T08:26:53Z
parent: cssints-vy0o
---

## Question

Decided in the plugin scope (cssints-rq2r): the ~5 live WebKit-only properties are a built-in list in 0.1, not a plugin. LightningCSS passes them through untouched.

- [ ] extract.mjs takes `-webkit-tap-highlight-color`, `-webkit-touch-callout`, `-webkit-box-reflect`, `-webkit-user-modify`, `-webkit-overflow-scrolling` from mdn-data verbatim, as an explicit list next to the standard selection (confirm each is still live in a current browser per BCD; drop any that is not)
- [x] Members generated (`WebkitTapHighlightColor`, ...), checked by both twins; support warnings from BCD work for them (they warn for Firefox targets)
- [x] cases.ts rows; diff.ts over them

## Summary of Changes

- `packages/css-grammar/scripts/extract.mjs`: `LIVE_NONSTANDARD` (four names) joins the standard and experimental selection; grammars come from mdn-data verbatim. `src/mdn.ts` regenerated: 533 properties (+4), the `declaration` syntax now lists them (so `supports()` and `style()` accept them); nothing else changed.
- `packages/cssints/src/members.ts` regenerated (`bun run members`, generator untouched): `WebkitTapHighlightColor`, `WebkitTouchCallout`, `WebkitBoxReflect`, `WebkitUserModify`. To redo on merge with the `jsdoc` branch.
- Kept, by BCD: `-webkit-tap-highlight-color` (Chrome 16, iOS Safari 4), `-webkit-box-reflect` (Chrome 4, Safari 4, Edge 79), `-webkit-touch-callout` (iOS Safari 2; unparsed by desktop Chrome 154 and WebKit 26.6, by design), `-webkit-user-modify` (BCD lists it as `user-modify` with a `-webkit-` prefix: Chrome 1, Safari 3, deprecated but not removed; parsed by Chrome 154 and WebKit 26.6; Firefox removed `-moz-` in 132).
- Dropped: `-webkit-overflow-scrolling`. No BCD entry, and `CSS.supports` is false in Chrome 154, WebKit 26.6 and Firefox 155.
- Support warnings: tap-highlight, touch-callout and box-reflect warn for Firefox targets (check-support.ts); touch-callout also warns for Chrome. `-webkit-user-modify` stays silent (BCD key is `user-modify`, prefixed, which the lookup does not see); not quieted further.
- Tests: 13 rows in cases.ts (both twins, types), support checks. diff.ts: generator 533 properties, all accepted by the twin; Chrome 154 agreement 16836/18415 (was 16734/18272), so the new properties add 102 of 143 agreeing; types vs twin 4264/4264. Disagreements: touch-callout 20 (Chrome has no such property), box-reflect 13+4 (Chrome's narrower image, e.g. `url("x b")`, `element()`, `cross-fade()`), tap-highlight 4 (mutants with nested `var()`/`if()`, the same as the other `<color>` properties). user-modify agrees fully.
- Demo CSS byte-identical; bench within budget.
