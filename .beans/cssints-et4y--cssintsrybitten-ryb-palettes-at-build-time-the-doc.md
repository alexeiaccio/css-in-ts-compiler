---
# cssints-et4y
title: '@cssints/rybitten: RYB palettes at build time; the docs site on it, palettes in the settings'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-10T16:41:29Z
updated_at: 2026-10-10T16:57:52Z
---

Asked by the user (2026-10-10): a plugin package on RYBitten (https://rybitten.space/, npm rybitten 1.3.0, MIT, Elio Meodai: RGB<->RYB with historical gamut cubes), move the docs site's palette onto it, and let the settings switch themes from different palettes.
- [x] packages/rybitten (@cssints/rybitten), laid out like ramp/tokens (README, src/index.ts, test/rybitten.mjs, fixtures, types): build-time functions that return DTCG data for createTokens / overrides for createGlobalTheme (e.g. a hue wheel or harmony in RYB space, steps of lightness, a choice of cube/gamut), using rybitten as a dependency (pin, license notice). No runtime unless a live hue slider needs one (say).
- [ ] apps/docs: the palette (accent family and neutrals) from @cssints/rybitten; check.contrast and test/contrast.mjs still hold (over the hue range).
- [ ] Settings: a palette picker that switches whole themes: RYBitten cubes (a few named gamuts) and the sets of @cssints/tokens (Open Props, Radix, Flexoki, Reasonable Colors) mapped onto the site's semantic tokens; persisted and applied before paint like the other settings; contrast checked per palette and mode (a palette that fails is fixed or left out, say which).
- [ ] Attribution of RYBitten in the package README/LICENSE and on the site (credits).
- [ ] Tests: package tests, docs build/contrast/settings/browser tests; budgets if types grow.
