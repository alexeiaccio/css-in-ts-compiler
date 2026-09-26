---
# cssints-h9qq
title: 'Beyond grammar: browser support and prose rules'
status: completed
type: feature
priority: normal
created_at: 2026-09-26T08:26:25Z
updated_at: 2026-09-26T10:36:20Z
parent: cssints-tmv8
---

What `diff.ts` shows that no grammar can express. Chrome 154 rejects values that are valid by the grammar.

Browser support (the grammar is correct, the engine lacks the feature):
- `fit-content(10px)` on width and height
- `align-items: anchor-center`
- `text-align: match-parent`
- `text-transform: full-width | full-size-kana`
- `white-space-collapse: preserve-spaces`
- `display: run-in`, `inline-list-item`

Prose rules (in the spec text, not in the grammar):
- `transition`: `none` as the property is allowed only when the list has one item
- `font-family`: generic keywords such as `system-ui` cannot start an unquoted family name

Options: warnings from `@mdn/browser-compat-data` against a browserslist target, and a handful of hand-written post-checks for the prose rules. This needs a decision on whether cssints should warn at all.

## Decision

- Browser support: build-time WARNINGS, never errors, from `@mdn/browser-compat-data` against a browserslist target (default query `defaults`, one override at most). Report the value (property + the unsupported keyword/function) and which target browsers lack it.
- Prose rules (validity rules in spec text, not in the grammar): ERRORS, same severity as the twin's grammar errors. Start with two: `transition` (`none` only valid in a one-item list) and `font-family` (generic keyword cannot be part of an unquoted multi-word family name). A small table of rule functions, one per property; no framework.

## Checklist

- [x] deps: @mdn/browser-compat-data, browserslist in spikes/typelevel
- [x] support.ts: BCD lookup + version check
- [x] rules.ts: transition, font-family
- [x] check-support.ts self-check
- [x] Chrome report before/after script
- [x] macro.mjs integration (+ warnings surfaced)
- [x] fixture with one warning and one prose-rule error
- [x] runner fixtures, app-react build, check/diff/budget, tsc + tsgo

## Summary of Changes

- `spikes/typelevel/support.ts`: BCD lookup per declaration (property, keywords, function names; keys `css.properties.<p>[.<kw>|.<fn>_function]`, `css.types.<fn>`, `css.types.<T>.<name>` for the <type>s the property's mdn grammar reaches), checked against browserslist targets (`BROWSERSLIST` env, default `defaults`). Returns warnings with the lacking target browsers.
- `spikes/typelevel/rules.ts`: prose rules as errors: `transition` (css-transitions-1 §2.5, `none` only in a one-item list) and `font-family` (css-fonts-4 §2.1.1, no generic or CSS-wide keyword inside an unquoted family name).
- `spikes/typelevel/check-support.ts`: self-check, 17 cases both ways. `diff-support.ts`: diff.ts samples split by explanation. Of 58 "twin accepts, Chrome 154 rejects" rows, 31 are now support warnings and 12 prose-rule errors; 15 remain (BCD has no `run-in`/`inline-list-item`, BCD says Chrome supports `align-items: anchor-center`, and grammar bugs owned by the grammar work).
- Runner: `macro.mjs` `classesOf` calls `checkRules` (throws) and pushes support warnings to `registry.warnings` once per new rule; `plugin.mjs` drains them with `this.warn` after evaluation (one line). New `fixtures/beyond.ts` shows one warning and one prose-rule error. app-react builds with one warning (`cursor: pointer`, iOS Safari), bundle unchanged.
- Deps: `@mdn/browser-compat-data` 8.1.3 and `browserslist` 4.29.1, pinned, loaded with require (an ESM import of browserslist through the Module Runner left `server.close()` pending).
