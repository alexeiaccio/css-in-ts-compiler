---
# cssints-avlz
title: 'Playground: Monaco with TypeScript types, several files, the plugin packages'
status: in-progress
type: feature
created_at: 2026-10-10T11:29:02Z
updated_at: 2026-10-10T11:29:02Z
---

Follow-up of cssints-4v2z (asked 2026-10-10).
- [ ] Monaco editor with the TypeScript language service in a worker and the cssints types loaded (the types of "cssints", cssints/frame, cssints/surface and the plugin packages as extra libs, from their built .d.mts or src, decided at build time): hovers, completions, the type errors of css.* calls as in the editor. Measure the cost: download size, time to first diagnostics on the README example, and whether the type-level grammar is usable in the browser worker (if a full check takes seconds, say so and how it is mitigated: diagnostics debounced, only the open file).
- [ ] Several files: a file list (add, rename, delete), relative imports between them with the attribute (`import { t } from "./tokens.ts" with { type: "cssints" }`), one entry, the module runner resolving them; the URL hash carries all files (compressed).
- [ ] Plugin packages in the module table: @cssints/icons (an iconify collection small enough, or a stub set), mise-en-mode, fluid, layout, motion, tokens and the others that run without Node; say which do not and why. Types for them in Monaco.
- [ ] Parity test extended (a multi-file case, a plugin case), the Chrome check (Monaco loads, a hover shows a type, a type error appears, files switch), sizes before/after; the docs entry does not grow.
