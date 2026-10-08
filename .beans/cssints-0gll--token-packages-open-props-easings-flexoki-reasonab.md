---
# cssints-0gll
title: 'Token packages: open-props, easings, flexoki, reasonable-colors, windy-radix'
status: in-progress
type: feature
priority: high
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T09:03:02Z
parent: cssints-dk1q
---

## What
Data-only token sets as `{ tokens }` entries: `@cssints/open-props` (sizes, easings, shadows, gradients, colors), easings.net as `easing.*` tokens, flexoki and reasonable-colors palettes, Radix colors (windy-radix-palette's mapping) as themeable token sets with light/dark themes.

## Sources
- https://open-props.style/
- https://github.com/ai/easings.net
- https://github.com/kepano/flexoki
- https://github.com/matthewhowell/reasonable-colors
- https://github.com/brattonross/windy-radix-palette
- https://github.com/GoogleChromeLabs/postcss-jit-props (only used tokens are emitted: we already do this per site)

## Shape
- one package each or one `@cssints/tokens-*` family; generated from upstream JSON by a script, DTCG shape, `createTokens` under the hood.
- Radix: light/dark as `createGlobalTheme`, contrast pairs through check.contrast.

## Todo
- [ ] generator script from upstream data
- [ ] open-props first, then radix
- [ ] fixture: only used tokens reach the sheet
