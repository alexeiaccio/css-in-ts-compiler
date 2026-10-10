---
# cssints-so8y
title: 'Attribution: credits for borrowed data, code and ideas in every package and on the docs site'
status: in-progress
type: task
priority: normal
created_at: 2026-10-10T16:41:29Z
updated_at: 2026-10-10T16:55:14Z
---

Asked by the user (2026-10-10): add attribution, for RYBitten and for the other plugins (Open Props and the rest).
- [x] Audit every packages/* (and apps/docs, engine) for what is borrowed: copied data (tokens sets, iconify collections, BCD/mdn-data), copied or ported code (algorithms, curves, e.g. squircle/superellipse, motion easings, placeholder hashing, masonry, balance), and ideas/designs credited by name (vite-plugin-opencode for devtools ask, StyleX/vanilla-extract patterns, Mode Contract of mise-en-mode, sublayers...). Grep docs/research and wayfinder for sources.
- [ ] Per package: a short Credits section in its README (what, from whom, license, link); where code or data is copied, the upstream license notice ships with the package (LICENSE or a THIRD_PARTY_NOTICES file listed in files; do not edit package.json beyond the files list if needed, another agent edits package metadata).
- [ ] Root README: a Credits section (dependencies of note and inspirations), which the docs site shows as a page; the site footer links it.
- [ ] Nothing copied without a compatible license: list anything unclear for the user.
