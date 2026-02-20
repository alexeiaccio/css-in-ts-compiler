---
# css-in-ts-compiler-iunl
title: Wire integration module into Vite plugin
status: completed
type: task
priority: normal
created_at: 2026-02-19T08:09:14Z
updated_at: 2026-02-19T08:16:10Z
---

Replace inline CSS generation in simple-plugin.ts with integration.ts module. This will add @property support, token support, and cleaner architecture.

## Summary of Changes

- Replaced inline CSS generation functions in simple-plugin.ts with integration.ts module
- Removed `generateHash` import and local `generateClassName` in favor of `registerMultiPropertyClass` from integration
- Removed `styles` Map and `cssCache` - now using the integration module's registry
- Removed inline `generateCSS`, `generatePropertiesCSS`, `generateClassCSS` functions
- Removed unused `config`, `configResolved` hook, and `parseArgs` function
- All 13 integration tests pass
