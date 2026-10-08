---
# cssints-mz30
title: 'Plugin runtime: CSS-only fallbacks gated on @property, and requires warning despite a fallback'
status: completed
type: bug
priority: normal
created_at: 2026-10-08T09:42:20Z
updated_at: 2026-10-08T11:06:01Z
---

Found by fonts trim() (cssints-51hb, repros under "## Engine gaps").

1. A runtime's fallback `css` ships only to targets that have `@property` (the parent-vars script stands on it), even when the fallback is pure CSS that needs nothing. `BROWSERSLIST="firefox 120"` gets no trim at all, and no warning.
2. A kernel's `requires` warns for targets the fallback covers, so the warning reads as if trim() were broken there.
3. A private key named like a public member (`#trim` and `trim`) resolves to the member, with a misleading error.

## Todo
- [x] a runtime without parentVars does not need @property
- [x] requires is satisfied by a shipped fallback (no warning, or a softer note)
- [x] private and public keys are separate namespaces, or the clash is a clear error

## Summary of Changes

- delivery.ts: `unreached()` is the set of targets a runtime cannot reach. A runtime of `css` only (no `parentVars`) stands on nothing; a `parentVars` runtime and the derived-token runtime keep the `@property` floor, so frame() and surface() are unchanged. `needed()` reads it.
- kernel.ts / macro.ts: `addKernel` gets the runtimes of the style; a `requires` key that one of them polyfills warns only for the targets that runtime does not reach.
- scope-engine.ts / scope.ts: `#x` beside `x` is a build error and a type error (`#trim and trim share a name: rename one`), not two namespaces.
- @cssints/fonts: no warning, the capsize fallback reaches firefox 120 (tested), README limit removed; the kernel stays `#native`.
- docs/API.md Plugins, docs/wayfinder.md entry.
