---
# cssints-i9xo
title: Runtime polyfill for derived tokens (relative colour) on the plugin runtime
status: todo
type: feature
priority: normal
created_at: 2026-10-03T11:54:30Z
updated_at: 2026-10-03T11:54:30Z
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
