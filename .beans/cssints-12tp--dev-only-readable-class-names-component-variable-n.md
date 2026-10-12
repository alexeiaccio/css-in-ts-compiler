---
# cssints-12tp
title: 'Dev only: readable class names (component, variable) next to the hashed ones'
status: in-progress
type: feature
created_at: 2026-10-12T14:50:49Z
updated_at: 2026-10-12T14:50:49Z
---

User (2026-10-12): in dev, add classes with the names of components and so on; easier to find an element.

Idea: where the plugin rewrites a css.cn(...) site (and cv), it already walks the AST: in dev (the dev server, not a build) it appends one readable class to the class string, built from where the site stands: the enclosing component/function (PascalCase) and the variable or property it is assigned to, e.g. const logo = css.cn(...) inside Landing gives 'Landing-logo' (a prefix so it never collides with the app's own or global classes, e.g. '.example' of the prose; only [A-Za-z0-9_-]). Elements are then found in the DOM inspector, in the devtools panel and in the prompt the panel sends ('Classes: ...' already lists every class of the element).

- [ ] dev only and only with the devtools option on (a build and a dev server without devtools produce byte-identical output to today: a test); SSR in dev gets the same string as the client (no hydration mismatch)
- [ ] the name: nearest enclosing function/class with a PascalCase name (or file basename at module level), plus the variable/property/JSX attribute name the call is assigned to; cut to a sane length; stable (HMR: the same site gives the same name)
- [ ] it does not enter the engine's class hashes, dedupe, drops (cv/cx static strings keep working), the sheet or the table; it is only a token in the returned class string
- [ ] the devtools panel shows the readable class first where it lists an element's classes; the prompt's Classes line already carries it
- [ ] perf.mjs within budget (the AST context is found on the existing walk), Quint model/race tests green, tests, docs (API.md, devtools README), changeset, dist
