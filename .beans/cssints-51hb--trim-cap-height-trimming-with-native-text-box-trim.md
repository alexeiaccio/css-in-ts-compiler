---
# cssints-51hb
title: 'trim(): cap-height trimming with native text-box-trim and a capsize fallback'
status: in-progress
type: feature
priority: high
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T09:03:02Z
parent: cssints-dk1q
blocked_by:
    - cssints-bvgz
---

## What
`trim()` chain (or part of the fonts scope) that trims the space above cap height and below baseline. Native `text-box: trim-both cap alphabetic` where supported (Chrome 133, Safari 18.2), else capsize's `::before/::after` negative-margin pseudo-elements computed from the font's metrics at build time.

## Sources
- https://github.com/seek-oss/capsize
- https://github.com/stormwarning/tailwindcss-capsize
- https://github.com/theMosaad/tailwindcss-capsize
- https://github.com/foliojs/fontkit

## Shape
- kernel with `requires: ["css.properties.text-box-trim"]`; fallback CSS chosen by BCD like frame()'s runtime but pure CSS (no script).
- needs the font metrics: depends on the fonts bean (fontkit) or takes `{ capHeight, ascent, descent, unitsPerEm }` explicitly.
- methods: `fontSize(<length>)`, `lineHeight(<length>|<number>)`.

## Todo
- [ ] native path + capsize fallback
- [ ] BCD switch
- [ ] fixture, Chrome check against seek-oss/capsize output
