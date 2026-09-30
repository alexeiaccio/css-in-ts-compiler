---
# cssints-wigi
title: 'Build-time evaluation edge cases: unreached sites, top-level _cv, runtime values'
status: in-progress
type: bug
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T08:50:32Z
updated_at: 2026-09-30T09:00:55Z
parent: cssints-vy0o
---

## Question

Found in cssints-gcho (docs/API.md documents them as limits today).

- [x] A top-level site that the module run does not reach (`false && p(4)`, a branch not taken) fails with "site N was not evaluated". Evaluate unreached sites the way sites inside functions are (`__cssints_hoisted`), so every site gets its class string whether or not it ran.
- [ ] A top-level `_cv(cv(...))` call fails at build time (`Cannot read properties of undefined (reading 'size')`), because during evaluation `cv()` is a node. Make `_cv` work on the eval-time value, or give a clear error.
- [ ] A runtime value in a css call (`p(n)` with `n` a parameter) fails with "n is not defined". Give an error that says css arguments must be known at build time and names the value and the call site; consider catching it at the type level too.
- [ ] `createGlobalTheme(t, hover, …)` type-checks: its condition should accept media and container wrappers (and selectors) only, not pseudo-class wrappers.
- [ ] Fixtures for each; docs/API.md limits updated
