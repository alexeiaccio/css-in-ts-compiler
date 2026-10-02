---
# cssints-2kci
title: Consume packages written on cssints from node_modules
status: todo
type: feature
tags:
    - wayfinder:task
created_at: 2026-10-02T07:52:36Z
updated_at: 2026-10-02T07:52:36Z
parent: cssints-9js6
---

## Question

Implement the decision of "Published packages written on cssints" (cssints-0l3f): the transform and `runnerDeps` in plugin.ts stop skipping node_modules for files that carry the marker (same cheap string check as app code; files without it stay skipped), the engine excludes such packages from `optimizeDeps` (found by scanning the app's dependencies' entry files for the marker, or by `ssr.noExternal`/`optimizeDeps.exclude` from a cheap check; pick the simplest that works in dev and build), HMR does not watch node_modules. Prove it with a fixture package built by tsdown (attributes kept, `.d.ts` emitted) installed into a small app, in dev and build: classes replaced, one sheet, a token of the package used by the app and themed by the app. Extend the smoke test with a library tarball. Docs in API.md ("Publishing a library").
