---
# cssints-5q6j
title: Partial support counts as lacking for kernels that need exact behaviour
status: completed
type: task
priority: normal
created_at: 2026-10-02T08:51:17Z
updated_at: 2026-10-02T09:13:53Z
parent: cssints-9js6
---

## Question

support.ts counts BCD `partial_implementation` as support. For relative colour that is wrong for `surface()`: Chrome 119–121 and Safari 16.4–17.6 are partial with other channel scales, so the steps come out wrong there with no warning, and the runtime ships to Safari 17 (found in cssints-vsc9). Decide whether a kernel's `requires` (or a single BCD key) can say "partial is lacking", or whether partial should be lacking everywhere, and what that does to the existing warnings (count how many change on the demo and fixtures).

## Summary of Changes

**Measured** (scratch switch, partial = lacking everywhere; BCD 8.1.3, browserslist `defaults`):
- Demo build: 2 warnings, 0 new; the surface one grew from `chrome 109` to `chrome 109-120, op_mob 80`.
- 104 fixtures: 11 warnings, 0 new; the 2 surface ones (kernel `needs` and `color: from`) grew the same way. Nothing else moved.
- 132 common declarations: 38 warnings become 47 (+9, 15 declarations changed); `last 2 versions` 120 to 122; Safari 17 only 28 to 36. The new ones are `accent-color` (no minimum contrast), `overscroll-behavior` (no effect without overflow), `content-visibility: auto` (find-in-page), `hanging-punctuation` (quote marks), `paint-order` (HTML text), `mask-mode`, `background-attachment: fixed`, `position-area.top`, `overflow-clip-margin`, `position-anchor` (initial value), plus `background-clip: text` and `mask` (Chrome 109: text and mask need the prefix, which LightningCSS adds).
- BCD itself: 186 of 4 175 css features have a partial statement; 95 gain a lacking target at defaults.

**Chosen: (b).** Everywhere (a) trades 2 correct warnings for a dozen mostly false ones on common properties (edge-case notes, or a prefix the build adds), which the user cannot act on. (c) leaves the real hole. A kernel's `requires` entry may be `{ key, exact: true }`: `lacking(key, targets, exact)` then counts a partial implementation as lacking, and the warning ends `(a partial implementation counts as lacking)`. `surface@1` uses it for `css.types.color.oklch.relative_syntax`. The plain string and the support warnings are unchanged.

**Runtime:** unchanged on purpose. `polyfills` has no exact form: Safari 17 lacks style queries, so it already gets the runtime; Chrome 119-121 has them, and the script could not repair the steps (it copies the same `oklch(from …)`). Tested both.

Tests: check-support (lacking exact, support unchanged), surface.mjs (Chrome 120 and Safari 17.4 warn, Chrome 122 and Safari 18 do not; runtime on for Safari 17.4, off for Chrome 120; negative control without exact). Docs: API.md Plugins and surface() Browsers.
