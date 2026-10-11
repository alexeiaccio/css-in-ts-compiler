---
# cssints-4e9f
title: 'cx folded into cn: runtime arguments compile to a hidden __cx with build-time drops'
status: completed
type: feature
created_at: 2026-10-11T09:18:35Z
updated_at: 2026-10-11T09:18:35Z
---

User (2026-10-11): hide cx() inside cn(), as _cv is inside cv().

Design (agreed): cn(...) arguments known at build time merge as today; arguments that depend on runtime (`on && p(4)`, `props.class`, state, ternaries) go to a hidden runtime `__cx(...)` the plugin imports (like `__cv`); the css calls inside them still compile to classes. Conflicts with conditional styles are resolved at build time: a conditional part that sets the same property as the static part drops those static classes while it is active (as cv's drops). A style whose own argument is runtime (`p(n)`) stays a build error. `cx` is no longer exported: importing it is a build error with a migration message (as _cv). Rewrite docs/API.md, README, demo, sky, docs site, plugin packages, skills, mcp, tests.

- [x] plugin/macro: split cn args into static and runtime, emit __cx with drops
- [x] runtime.ts: _cx (cx + drops), browser export
- [x] cx removed from the public API with a migration error
- [x] every use rewritten; docs and skills
- [x] tests: fixtures, type tests, docs.mjs, apps

## Summary of Changes

- **Detection (instrument.ts).** A `cn(...)` call (`cn` imported from "cssints", or `css.cn` / `ns.cn`) is split per argument. An argument is runtime when it names a local of the functions and blocks around the call (the set the hoisted site already keeps in the dead zone: a parameter, a prop, a signal), is a string or template literal, or is a call of something that is not a `css.*` member (`button({ size })`, a cv result); a spread is judged by what it spreads. The rest is static. With no runtime argument the call stays one site, as before. With one, the site becomes a group: the static arguments are evaluated together (`__group`, macro.ts), and the `css.*` sites inside the runtime arguments are sites of their own, as `cx(on && p(4))` had. A style whose own argument is runtime (`p(n)`) is such an inner site and fails with the old message.
- **Drops (lib.ts `dropsOf`, macro.ts `groupOf`).** After the inner sites, the group compares every declaration of the merged static part and of each inner site, by source position: the later one that covers the property of an earlier one under the same conditions drops its class (`[class, "classes"]` pairs); overlap without containment is a build error. Static-after-conditional works too (`cn(on && p(4), p(2))` is always `p(2)`). Opaque strings are only appended.
- **Client code (writeSite, runtimeImport).** `cn(S1, R1, S2, R2)` becomes `__cx(drops, "static classes", R1', R2')`; the plugin adds `import { _cx as __cx }` (and `_cv as __cv`) itself. The playground's own transform (apps/docs compile.ts) uses the same two helpers.
- **Runtime.** `cx` is replaced by `_cx(drops, ...parts)` (runtime.ts, also exported from index.ts for an ssr build). min / min+gzip: 470 / 332 B before (cx and _cv), 595 / 372 B after.
- **cx gone.** `import { cx } from "cssints"` (with or without the attribute) is a build error with a migration message; `cx` is not exported by the types or by index.ts. The SVG property of that name is `css.cx(...)`.
- **Types.** `cn` has two overloads: styles only gives `Style` (so `cv` bases still reject runtime strings), anything of `ClassValue` gives `string`. `bun run bench`: all rows ok; users.ts 960498 against budget 919954 is not from this (the same with the cn call removed); no budget file changed.
- **eval-time cn** skips `false`, null, undefined and 0, so `dev && p(4)` with a build-time `dev` works.
- **Rewritten:** cssints tests, fixtures, bench, skills, API.md (runtime section: one function), README, AGENTS.md, demo, sky (Post, Embed), docs site (example.txt, playground test, landing text), devtools overlay (own `cx` helper became `cn`), layout and masonry READMEs, docs/research. placeholder's local variable `cx` renamed. dist of cssints and the devtools overlay rebuilt.
- **Tests.** fixtures cn-runtime, cn-static, cn-runtime-arg, cn-runtime-overlap, cx-gone, cx-gone-attr; test/cn-runtime.mjs (runs the emitted code on the real runtime); runtime.mjs for `_cx`; type tests; docs.mjs; sheet-map expects the `cn(` that holds a rule. Green: cssints test, root test, typecheck, lint 0/0, fmt for the files touched, diff:check, bench, docs.mjs, apps/docs, apps/sky (+ test:posts, test:thread), devtools.
- **Known limits.** A style held in a variable inside a runtime argument (`on && blurred`) is opaque: appended, never settled. The sheet map of a rule made inside a static `cn(...)` points at the `cn(` call, no longer at the single property call.
