---
# cssints-ow16
title: 'Importers: DTCG from Figma via tokens-studio sd-transforms and terrazzo'
status: completed
type: task
priority: low
created_at: 2026-10-08T08:55:58Z
updated_at: 2026-10-09T07:50:56Z
parent: cssints-dk1q
---

## What
The JSON token input already takes DTCG. Check what Tokens Studio / TokensBrücke exports (`$extensions`, math, aliases by name) and what sd-transforms/terrazzo normalise, and add the small normaliser if createTokens needs one.

## Sources
- https://github.com/tokens-studio/sd-transforms
- https://github.com/terrazzoapp/terrazzo
- https://github.com/meodai/token-beam
- https://github.com/tokens-bruecke/figma-plugin
- https://github.com/unpunnyfuns/swatchbook (storybook addon for DTCG)
- https://tr.designtokens.org/format/

## Todo

- [x] Get real samples: Figma native export, TokensBrücke, Tokens Studio legacy and DTCG (fixtures/importers, README with sources and licences)
- [x] Run them through createTokens / createGlobalTheme and list what fails or is misread
- [x] Decide: normaliser in cssints vs a recipe (reasoning below)
- [x] createGlobalTheme takes a per-mode DTCG file as it is (types and build)
- [x] Clear build errors for what was misread or confusing
- [x] Tokens Studio recipe through Style Dictionary + sd-transforms, checked end to end
- [x] test/importers.mjs in cssints `test`; types test in test/types/themes.ts
- [x] docs/API.md "JSON from Figma", docs/wayfinder.md entry

## Findings (2026-10-09)

- **Figma native** (Variables view, Export modes): DTCG 2025.10, one file per mode, colours `{ colorSpace: "srgb", components, alpha, hex }`, `com.figma.*` in `$extensions`, `com.figma.modeName` at the root. The default mode's file worked. Failed: the file of another mode as a theme (`color.red is not a DTCG colour`: overrides took values, not `{ $value }` leaves), and keys like `500` (the set reads them `_500`). Misread: `com.figma.type: "boolean"` became a number token. FLOAT variables are `number` tokens (no unit), `string`/`fontFamily` are errors (no token type).
- **TokensBrücke** (DTCG 2025.10 on): DTCG, collection names as top-level keys. Misread: modes in `$extensions.mode` were silently dropped (only the default kept). Its "Split modes into separate files" gives the Figma per-mode shape. Its composed colour `{ components: "{ref}", alpha }` is an error (not a DTCG colour).
- **Tokens Studio**: legacy `value`/`type` failed with a confusing "is a group or a token" error; `$themes`/`$metadata` with a generic error; its type names (`spacing`, `fontSizes`, ...) with "no token type"; math `{spacing.base} * 2` as "8px * 2 is not a <length>". Misread: `$extensions["studio.tokens"].modify` was ignored (the unmodified colour shipped).
- **terrazzo**: `tz import` needs the Figma REST API (Enterprise for variables) and writes a resolver file; v2 has no Tokens Studio reader. Not used.
- **sd-transforms**: resolves Tokens Studio math, modifiers, units, weights and aligns types (but leaves `fontSize`/`lineHeight`, SD types, not DTCG).

## Decision

(a) for the Figma path, (b) for Tokens Studio. The common path (Figma's own export, TokensBrücke split by mode) is already DTCG: the only gap was a second mode as a theme, which is a few lines in createGlobalTheme's walk (skip `$` keys, unwrap `{ $value }`, find `_500` for `500`) and in the override types. No new package. Tokens Studio differs in many places (format, types, units, math, modifiers, sets, `$themes`) and sd-transforms already handles all of them, so a normaliser in cssints would copy it: a recipe instead (Style Dictionary + sd-transforms + a six-line `cssints/dtcg` format), checked with style-dictionary 5.6 / sd-transforms 2.0 and its output tested (fixtures/importers/tokens-studio-sd.json). Everything else is a build error that names the fix.

## Summary of Changes

- `packages/cssints/src/theme.ts`: createGlobalTheme overrides take DTCG leaves `{ $value }` and skip `$type`/`$description`/`$extensions` (a per-mode file as it is); a digit key finds `_<key>`. New build errors: legacy `value`/`type`, `$themes`/`$metadata`, a Tokens Studio type (names the DTCG type), math outside `calc()`, a Tokens Studio modifier, a Figma boolean, more than one mode in `$extensions` (`mode`, `com.figma.modes`), in createTokens and (for leaves) createGlobalTheme.
- `packages/cssints/src/theme-types.ts`: `Overrides` takes `{ $value }` leaves; `CheckOverrides` skips `$` keys and maps a digit key to `_<key>`.
- Tests: `packages/cssints/test/importers.mjs` (in `test`), fixtures and sources in `test/fixtures/importers/` (README with licences), a types case in `test/types/themes.ts`.
- Docs: docs/API.md Themes "JSON from Figma" (per-mode themes, TokensBrücke, the Tokens Studio recipe, the errors), docs/wayfinder.md entry.
- No new package, so vite.config.ts needs no lint entries.

Deferred: FLOAT variables as dimensions (a `com.figma.scopes`-based guess, or an option), skipping string/boolean/fontFamily tokens instead of failing the file, TokensBrücke's composed colour (`{ components: "{ref}", alpha }` → `rgb(from … / a)`), the DTCG resolver format, a theme that omits unchanged values.
