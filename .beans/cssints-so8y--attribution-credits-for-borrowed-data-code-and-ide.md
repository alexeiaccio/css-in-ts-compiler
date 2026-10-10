---
# cssints-so8y
title: 'Attribution: credits for borrowed data, code and ideas in every package and on the docs site'
status: completed
type: task
priority: normal
created_at: 2026-10-10T16:41:29Z
updated_at: 2026-10-10T18:13:27Z
---

Asked by the user (2026-10-10): add attribution, for RYBitten and for the other plugins (Open Props and the rest).
- [x] Audit every packages/* (and apps/docs, engine) for what is borrowed: copied data (tokens sets, iconify collections, BCD/mdn-data), copied or ported code (algorithms, curves, e.g. squircle/superellipse, motion easings, placeholder hashing, masonry, balance), and ideas/designs credited by name (vite-plugin-opencode for devtools ask, StyleX/vanilla-extract patterns, Mode Contract of mise-en-mode, sublayers...). Grep docs/research and wayfinder for sources.
- [ ] Per package: a short Credits section in its README (what, from whom, license, link); where code or data is copied, the upstream license notice ships with the package (LICENSE or a THIRD_PARTY_NOTICES file listed in files; do not edit package.json beyond the files list if needed, another agent edits package metadata).
- [ ] Root README: a Credits section (dependencies of note and inspirations), which the docs site shows as a page; the site footer links it.
- [x] Nothing copied without a compatible license: list anything unclear for the user.

## Summary of Changes

Audit (copied, ported or inspired; license):

- Copied data, notice shipped: @cssints/tokens (Open Props, Radix, Flexoki, Reasonable Colors; MIT; already in its README), @cssints/css-grammar (mdn-data CC0 syntax strings, @webref/css MIT numeric ranges; new THIRD_PARTY_NOTICES.md, added to files), @cssints/fonts (Capsize latin weights and Arial/Times/Courier metrics; MIT SEEK; notice in the README Credits), tools/ai-automation/vendor (anti-slop MIT; LICENSE and UPSTREAM.md existed), apps/sky (Mu and alf values MIT, Inter OFL, Phosphor MIT; new NOTICE.md).
- Inspired only, no code copied: balance, fluid, gradient, layout, masonry, motion, placeholder, ramp, reset, reveal, skeleton, squircle, stuck, icons, mise-en-mode, devtools (vite-plugin-opencode), mcp, tui. Each README has a Credits section.
- Root README: Credits (data and code that ships, ideas and designs, built on); the docs site lists it as a page of the Project group (plugin/markdown.ts) and links it from a footer in Shell.tsx.

Unclear: see the final report (Mise en Mode license, Mu fork copyright line, the resets of Comeau and Lazaroff, cssints package without a notice file, Every Layout).
