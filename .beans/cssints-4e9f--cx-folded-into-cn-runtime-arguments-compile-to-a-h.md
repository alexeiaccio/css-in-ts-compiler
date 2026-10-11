---
# cssints-4e9f
title: 'cx folded into cn: runtime arguments compile to a hidden __cx with build-time drops'
status: in-progress
type: feature
created_at: 2026-10-11T09:18:35Z
updated_at: 2026-10-11T09:18:35Z
---

User (2026-10-11): hide cx() inside cn(), as _cv is inside cv().

Design (agreed): cn(...) arguments known at build time merge as today; arguments that depend on runtime (`on && p(4)`, `props.class`, state, ternaries) go to a hidden runtime `__cx(...)` the plugin imports (like `__cv`); the css calls inside them still compile to classes. Conflicts with conditional styles are resolved at build time: a conditional part that sets the same property as the static part drops those static classes while it is active (as cv's drops). A style whose own argument is runtime (`p(n)`) stays a build error. `cx` is no longer exported: importing it is a build error with a migration message (as _cv). Rewrite docs/API.md, README, demo, sky, docs site, plugin packages, skills, mcp, tests.

- [ ] plugin/macro: split cn args into static and runtime, emit __cx with drops
- [ ] runtime.ts: _cx (cx + drops), browser export
- [ ] cx removed from the public API with a migration error
- [ ] every use rewritten; docs and skills
- [ ] tests: fixtures, type tests, docs.mjs, apps
