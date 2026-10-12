---
# cssints-12tp
title: 'Dev only: readable class names (component, variable) next to the hashed ones'
status: completed
type: feature
created_at: 2026-10-12T14:50:49Z
updated_at: 2026-10-12T14:50:49Z
---

User (2026-10-12): in dev, add classes with the names of components and so on; easier to find an element.

Idea: where the plugin rewrites a css.cn(...) site (and cv), it already walks the AST: in dev (the dev server, not a build) it appends one readable class to the class string, built from where the site stands: the enclosing component/function (PascalCase) and the variable or property it is assigned to, e.g. const logo = css.cn(...) inside Landing gives 'Landing-logo' (a prefix so it never collides with the app's own or global classes, e.g. '.example' of the prose; only [A-Za-z0-9_-]). Elements are then found in the DOM inspector, in the devtools panel and in the prompt the panel sends ('Classes: ...' already lists every class of the element).

- [x] dev only and only with the devtools option on (a build and a dev server without devtools produce byte-identical output to today: a test); SSR in dev gets the same string as the client (no hydration mismatch)
- [x] the name: nearest enclosing function/class with a PascalCase name (or file basename at module level), plus the variable/property/JSX attribute name the call is assigned to; cut to a sane length; stable (HMR: the same site gives the same name)
- [x] it does not enter the engine's class hashes, dedupe, drops (cv/cx static strings keep working), the sheet or the table; it is only a token in the returned class string
- [x] the devtools panel shows the readable class first where it lists an element's classes; the prompt's Classes line already carries it
- [x] perf.mjs within budget (the AST context is found on the existing walk), Quint model/race tests green, tests, docs (API.md, devtools README), changeset, dist

## Summary of Changes

- `instrument()` (packages/cssints/src/instrument.ts) takes a fourth argument `named`. The plugin sets it only for the client transform of a dev server with `devtools` (`!!devtools && !build`). `findSites` then keeps the ancestors of the node it walks (a push and a pop on the walk it already does; nothing when off) and, for a `cn()` or `cv()` site, builds `cs-<owner>[-<label>]` into `Site.name`. The owner is the nearest function/class named in PascalCase (its own id or the variable it is assigned to, one `memo(...)` level through), else the file's name (`index` takes its folder's). The label is the variable, property, assignment target, class field/method, helper function that returns the call, or JSX attribute other than class/className. Parts cut to 24 and 20 characters, `[A-Za-z0-9_-]` only.
- `plugin.ts` writes it with `tagged(replacement, name)` at `writeSite`: inside the string of a `cn()`, the `base` of a `__cv({...})`, the static head of a `__cx(drops, "static", ...)`. The `sites` map, the entries, the table, the hashes and the `drops` never see it. A build, a dev server without devtools and the ssr environment (instrumented calls, no class strings) are byte-identical (test: the output with the names cut out equals the output without; two builds equal).
- Deviations: the prefix is `cs-`; an anonymous owner falls back to the file's name (there is always a file), so "no name" is only for a site that is not `cn`/`cv` (`css.p(4)`, `css.cx(...)`) and for a `cn` inside the runtime arguments of another `cn`; a site nested in an object keeps only its property (`styles.nested.deep` is `cs-page-deep`); no ordinal for two calls in one place (an ordinal would change with an unrelated edit).
- Devtools: `Inspection.names` (cascade.ts) holds the `cs-*` classes of the element that are not in the table; the panel shows them first in its bar (`data-devtools="name"`) and in the hover tag; they are not listed as "not cssints". The prompt's `Classes:` line lists them as before (prompt.ts untouched).
- Tests: packages/cssints/test/dev-names.mjs (in `test`; fixtures/dev-names), packages/devtools/test/names-browser.mjs (in `test:browsers`; Chrome). docs/API.md, the devtools README, AGENTS.md, a changeset, dist of cssints and devtools rebuilt.
- Perf: CPU time of `instrument()` per module over 200 generated modules, interleaved A/B in one process: 0.2406 ms before, 0.2402 ms after with names off, 0.2423 ms with names on (quiet machine). perf.mjs wall numbers were too noisy on the loaded machine to compare (the "instrument" column there always runs the current code).
- Quint model and race.mjs: unchanged and green; no await point moved, and a re-transform emits the same text plus the token.
