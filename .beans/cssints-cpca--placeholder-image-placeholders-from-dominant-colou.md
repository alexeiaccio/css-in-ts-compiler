---
# cssints-cpca
title: 'placeholder(): image placeholders from dominant colours at build time'
status: in-progress
type: feature
priority: low
created_at: 2026-10-08T08:55:58Z
updated_at: 2026-10-09T07:26:30Z
parent: cssints-dk1q
---

## What
`placeholder("src/hero.jpg")` reads the image at build time and emits a CSS gradient (or thumbhash data URL) as a `<image>`, like icons' fs provider.

## Sources
- https://github.com/ascorbic/unpic-placeholder
- https://github.com/evanw/thumbhash
- https://github.com/Namide/extract-colors
- https://github.com/Vibrant-Colors/node-vibrant

## Todo
- [ ] fs provider, sharp or jimp for pixels
- [ ] gradient + thumbhash modes
- [ ] fixture
