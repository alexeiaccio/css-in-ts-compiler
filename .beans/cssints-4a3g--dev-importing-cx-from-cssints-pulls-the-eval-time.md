---
# cssints-4a3g
title: 'Dev: importing cx from cssints pulls the eval-time library into the browser'
status: completed
type: bug
created_at: 2026-09-29T14:48:37Z
updated_at: 2026-09-29T14:48:37Z
parent: cssints-vy0o
---

Found during cssints-vzd9. In dev, `import { cx } from "cssints"` resolved to `src/index.mjs`, which re-exports `macro.mjs`. The browser then loaded `macro.mjs`, `support.ts` and the twin, and failed with `process is not defined`. The build was unaffected because tree-shaking removed them.

## Summary of Changes
`packages/cssints/package.json` `exports["."]` now has a `browser` condition pointing to `src/runtime.mjs`, with `default` still `src/index.mjs`. The Vite client environment resolves `browser`, and the Module Runner (ssr) resolves `default`. Checked with a dev server: every demo module imports `/packages/cssints/src/runtime.mjs`, and there are 0 macro/support/twin modules in the client graph. `bun run test`, mbt and the demo build pass.
