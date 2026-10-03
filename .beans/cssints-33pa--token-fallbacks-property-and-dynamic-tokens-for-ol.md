---
# cssints-33pa
title: 'Token fallbacks: @property and dynamic tokens for older targets'
status: completed
type: feature
priority: normal
created_at: 2026-10-03T11:05:54Z
updated_at: 2026-10-03T11:55:49Z
parent: cssints-co8y
blocked_by:
    - cssints-fxzg
    - cssints-eaob
---

## Question

Decided with the user (2026-10-03). LightningCSS lowers literals in properties and in `:root` custom properties, but not `@property initial-value` and not `oklch(from var(--x) …)`.
1. A plain token lives only in `@property initial-value` today, so a target that cannot parse its value (oklch() in chrome 109) drops the rule and the token is missing entirely. Fix: when a target lacks the value, write the initial-value in the form LightningCSS would fall back to (transform `x{color:value}` with the targets and take the first declaration, or culori), and also emit `:root{--x:value}` so LightningCSS adds the wide-gamut value under `@supports`. Check that a browser with the feature still gets the original value (computed style).
2. A derived token whose live value holds `var()` (relative colour from a hue, `surface()`'s inputs) cannot be lowered: emit its flattened default (the literal we already compute for initial-value, lowered as above) in `:root`, and the live value under `@supports (color: oklch(from red l c h))` (or the feature the value needs). Older browsers get the static default theme (sky: Mu pink, no working hue slider); themes override the same way.
3. Prove it in a real old Chrome (a Chromium build around 109 by revision through playwright-core, or the oldest obtainable; say which): sky renders its colours (not transparent/initial) at the default hue, and the frame/surface runtime decision still holds. Update the demo/sky build checks and API.md.

## Summary of Changes

**Engine.** `checkSyntaxFx` (token.ts) now returns what LightningCSS lowers a token value to (lowered.ts `fallbackOf`, the first declaration of `:root{--x:value}` for the union of the lacking targets, cached) when it lowers every feature that warns; that value is the `@property` initial-value, and the warning goes away. Plain token (`token.<type>()`, createTokens leaf): `:root{--x:value}` (`:where(*)` if it does not inherit) so LightningCSS adds the wide value under `@supports`. Derived token and theme value with `var()`: lowered literal as the default, the live value after it under `@supports (<prop>:<literal>)`; the test is the flattened literal itself, so the feature it needs is exact and no BCD-to-test table exists. Alias (`var(--x)` only) stays live. No target lacks the value: nothing is written, demo and sky are byte-identical with `BROWSERSLIST=chrome 154`.

**Proof.** apps/sky/test/old-browser.mjs (not in `test`, `bun run test:old-browser`): Chromium 109.0.5414.46 (playwright-core 1.29.2, build 1041, runs on macOS 15 arm64) shows Mu pink, bg and text in light and dark; the slider moves nothing; Chrome 154.0.8037.93 stays oklch() and follows the slider. Control: the same script against the engine before the change fails (`rgba(0, 0, 0, 0)`). Firefox was not needed.

**Tests.** test/token-fallback.mjs + fixtures/token-fallback.ts (old and modern targets), token-support.mjs (only token.set() warns), derived.mjs on modern targets, sky build.mjs asserts. docs/API.md.

**Warnings** (default targets): demo 4 -> 4 (class rule color-mix with var(), cursor, kernel: none are tokens), sky 28 -> 2 (kernel, cursor). Sky CSS 27.97 -> 29.58 kB.
