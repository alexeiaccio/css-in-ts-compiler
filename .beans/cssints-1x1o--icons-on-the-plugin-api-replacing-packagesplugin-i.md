---
# cssints-1x1o
title: Icons on the plugin API, replacing packages/plugin-icon
status: completed
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T11:57:32Z
updated_at: 2026-10-02T08:11:21Z
parent: cssints-9js6
blocked_by:
    - cssints-su6o
---

## Question

Icons as a `style` member plus a mask kernel and one `--_svg` class per icon (plugins.md §6): `icons({ provider: "iconify-json" | "fs", ... })` in a build-time helper module, names typed from `@iconify-json/*` for iconify-json and checked at build time with a suggestion for fs, mask vs background by `detectRenderMethod`, no runtime. Reuse the loaders of packages/plugin-icon and delete the rest of it (it does not load today). The iconify HTTP API and generated fs types stay later. A use in apps/demo; docs in API.md.

## Summary of Changes

`@cssints/icons` (packages/icons) replaces packages/plugin-icon (deleted; workspace, `vite.config.ts`, `.prettierignore`, README and AGENTS.md updated). It is written only on `cssints/plugin`'s `style()`.

- `icons({ provider: "iconify-json", collection })` reads `@iconify-json/<collection>/icons.json` from the working directory's node_modules; `icons({ provider: "fs", dir })` reads `<dir>/<name>.svg`. The result is called as `mdi("home")`: marker `_i` (mask kernel `icon-mask@1`, `requires: css.properties.mask-image`) or `_ic` (image kernel `icon-image@1`) by iconify's rule (body has currentColor), and one atomic `--_svg: url("data:image/svg+xml,…")` class per icon on a square view box. No runtime.
- Types: names come from a type argument, `icons<typeof import("@iconify-json/mdi/icons.json")>(…)` (icons and aliases); `string` otherwise and for fs. An unknown name is a build error at the call site with the nearest name.
- Engine: `style()` turns whatever `build` throws into a MemberError at the call site; the inner build server skips the dep scan (`optimizeDeps.noDiscovery`), which followed attributed imports into node:fs and printed warnings (and cut the demo build from 1.2 s to 0.4 s).
- Tests: packages/icons/test (fixtures, icons.mjs, types/names.ts), docs/API.md "Icons" (checked by docs.mjs through a paths entry), `bun run test:smoke` installs the icons tarball and builds with it, the demo uses `mdi("close")` and `mdi("content-save")`.
