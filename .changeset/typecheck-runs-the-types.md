---
"cssints": patch
"@cssints/headless": patch
---

The workspace's `typecheck` now checks the types it claims to. `scripts/typecheck.mjs` runs `effect-tsrs diagnostics` with `--type-check`, so ordinary TypeScript diagnostics are reported instead of only the Effect rules — no package passed the flag, so none of them was ever type-checked.

The fallout was one interface and two assertions: `DialogModalOptions`' optional members accept `undefined` explicitly (a host forwarding a value now compiles under `exactOptionalPropertyTypes`), and two tooltip assertions compare `hidden` to `true` instead of handing `string | boolean` to `waitFor`.
