---
# cssints-wiqx
title: mbt.mjs fails under bun isolated linker (itf-trace-parser gets Effect 4)
status: todo
type: bug
created_at: 2026-09-29T12:36:13Z
updated_at: 2026-09-29T12:36:13Z
parent: cssints-tmv8
---

After the move to one bun workspace (cssints-vq75), `bun run test:mbt` in packages/cssints fails with `Schema.pattern is not a function`. @firfi/itf-trace-parser has effect as an optional peer; bun's isolated linker resolves it from the hoisted fallback (effect 4.0.0-rc.118, from plugin-icon's ^4.0.0-beta.30) instead of quint-connect's effect 3.22.2. npm nested it correctly. Options: bun patch/override, try the quint-connect effect4 tag with a matching effect, or run mbt with its own npm install.
