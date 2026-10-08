---
# cssints-mz30
title: 'Plugin runtime: CSS-only fallbacks gated on @property, and requires warning despite a fallback'
status: in-progress
type: bug
priority: normal
created_at: 2026-10-08T09:42:20Z
updated_at: 2026-10-08T10:02:47Z
---

Found by fonts trim() (cssints-51hb, repros under "## Engine gaps").

1. A runtime's fallback `css` ships only to targets that have `@property` (the parent-vars script stands on it), even when the fallback is pure CSS that needs nothing. `BROWSERSLIST="firefox 120"` gets no trim at all, and no warning.
2. A kernel's `requires` warns for targets the fallback covers, so the warning reads as if trim() were broken there.
3. A private key named like a public member (`#trim` and `trim`) resolves to the member, with a misleading error.

## Todo
- [ ] a runtime without parentVars does not need @property
- [ ] requires is satisfied by a shipped fallback (no warning, or a softer note)
- [ ] private and public keys are separate namespaces, or the clash is a clear error
