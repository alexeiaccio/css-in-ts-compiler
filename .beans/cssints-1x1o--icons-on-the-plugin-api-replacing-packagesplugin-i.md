---
# cssints-1x1o
title: Icons on the plugin API, replacing packages/plugin-icon
status: todo
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T11:57:32Z
updated_at: 2026-09-30T11:57:41Z
parent: cssints-9js6
blocked_by:
    - cssints-su6o
---

## Question

Icons as a `style` member plus a mask kernel and one `--_svg` class per icon (plugins.md §6): `icons({ provider: "iconify-json" | "fs", ... })` in a build-time helper module, names typed from `@iconify-json/*` for iconify-json and checked at build time with a suggestion for fs, mask vs background by `detectRenderMethod`, no runtime. Reuse the loaders of packages/plugin-icon and delete the rest of it (it does not load today). The iconify HTTP API and generated fs types stay later. A use in apps/demo; docs in API.md.
