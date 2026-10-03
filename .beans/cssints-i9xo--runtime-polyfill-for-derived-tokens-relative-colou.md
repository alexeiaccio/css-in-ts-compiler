---
# cssints-i9xo
title: Runtime polyfill for derived tokens (relative colour) on the plugin runtime
status: completed
type: feature
priority: normal
created_at: 2026-10-03T11:54:30Z
updated_at: 2026-10-03T12:37:17Z
parent: cssints-co8y
blocked_by:
    - cssints-33pa
---

## Question

Asked by the user (2026-10-03) after cssints-33pa: older targets get the static default of a derived token whose live value holds `var()` (`oklch(from …)`, `oklch(L C var(--hue-accent))`, `lab(from color(from … srgb-linear …) …)` for onAccent, `color-mix()` with a token), so sky's hue slider does nothing there. Make it live with a runtime polyfill delivered by the plugin runtime contract (cssints-su6o: `polyfills: BcdKey[]`, `virtual:cssints/runtime/<name>`, included only when a target lacks the feature and has @property; the same `needed()` decision and `lacking()` with `exact` where the feature is partial).

- **Shape:** decide whether this is a member-level runtime (a `property()`/`context()`-like plugin package, e.g. `cssints/derived`) or a token-level runtime the engine attaches when a token set has derived values with `var()`; the user asked "as a plugin?", so prefer the plugin contract if it fits, and say why if it does not.
- **Runtime:** a small browser module (no imports, no Effect, like parent-vars.ts) that knows each such token's template and refs (serialised by the build, only for the tokens the app uses), reads the inputs' computed values on `:root` (and under the theme classes and media themes), evaluates the colour functions the templates use (oklch/lab/srgb-linear conversions, relative-colour channel maths with calc/clamp, color-mix in oklab/srgb), and writes the results as custom properties; it re-runs when an input changes (a MutationObserver on `<html>` style/class, a matchMedia listener for prefers-color-scheme). Keep the supported subset explicit; a template outside it stays at its static fallback, with a build warning naming the token.
- **Size and cost:** report min+gzip and the time per update; the slider fires many inputs a second.
- **Prove it** in the old browser cssints-33pa used: the slider moves the accent and onAccent flips as in Chrome 154 (compare the computed colours at a few hues against Chrome's), and modern targets ship nothing (`export {};`).

## Todo

- [x] shape: engine-registered token-level runtime on the plugin delivery (virtual:cssints/runtime/derived, needed()), not a member plugin
- [x] src/derived.ts: colour evaluator + runtime (no imports), cssints/derived export
- [x] src/derived-data.ts: standIn (subset check, build warning, registration) and the :root --_derived data rule in the sheet
- [x] unit tests against culori (derived-runtime.mjs), token-fallback.mjs for the data, sky build.mjs
- [x] Chromium 109 vs Chrome 154 in apps/sky/test/old-browser.mjs
- [x] docs/API.md
- [x] final checks and summary

## Summary of Changes

**Shape.** Not a member plugin: tokens are not members, so there is no site for a `runtime` to hang on, and a `derived()` call the app must write would only repeat what the engine knows. The engine registers the runtime itself when createTokens or createGlobalTheme finds a derived colour that a target cannot parse (`standIn`, src/derived-data.ts), and delivers it on the plugin delivery: `virtual:cssints/runtime/derived`, `export {};` unless `needed()` (a target lacks a feature the literals need, has @property). The client modules that use such a token import it (the module that declares tokens is usually not in the client).

**Data.** One custom property on :root in layer _.k (`--_derived`, JSON): probe literals, the default theme's templates, per theme its condition and templates (0 where a theme sets a literal). Only the tokens and themes the sheet uses (renderSheet, so no build-timing problem).

**Runtime.** src/derived.ts (`cssints/derived`, no imports): evaluator (hex, rgb(), oklch, oklab, lab, color(srgb|srgb-linear), color-mix in srgb/srgb-linear/oklab/lab, relative colour with calc/clamp/min/max/var) and the observer on <html> attributes plus matchMedia of the themes; results as inline rgb() custom properties on <html>; idle where every probe literal parses. Outside the subset: static default and a build warning naming the token. 7.2 kB min, 3.1 kB gzip; 10 us of JS per slider input; Chromium 109: 1.1 ms per input against 0.5 ms for the style recalculation alone.

**Proof.** apps/sky/test/old-browser.mjs: Chromium 109 within 1/255 of the pixels of Chrome 154 for the four steps, onAccent and the background at hues 0, 90, -90, 180, -180 in light, dim, dark and system (also when the scheme flips), onAccent white/black like Chrome at five accent lightnesses; Chrome writes nothing on <html>. test/derived-runtime.mjs against culori, token-fallback.mjs for the data, the warning and modern targets, sky build.mjs. Sky built for chrome 154 and demo: byte-identical JS and CSS to master. Sky CSS 29.58 -> 31.43 kB with the default targets. docs/API.md.
