---
"@cssints/mcp": patch
---

`@cssints/mcp`'s `vite` dependency goes from `^1.4.0` to `^8.3.0`: the Vite+ core package dropped its own versioning and now
follows Vite's majors (`@voidzero-dev/vite-plus-core@8.3.8000`), so the old range no longer matched any published core.
