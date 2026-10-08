---
# cssints-mwqw
title: A runtime local that shadows a DOM global is read as the global at build time
status: in-progress
type: bug
created_at: 2026-10-08T15:19:53Z
updated_at: 2026-10-08T15:19:53Z
---

Found by cssints-z8sb (apps/docs): in a component, a local signal named `open` made `ph(open() ? "x" : "list")` build without error: the build-time evaluator read `window.open` (or a global open) and picked one arm. Any site argument that refers to a runtime binding (a local of a function, a parameter, a signal) must be an error at the site (the existing 'runtime value' message), even when its name exists as a global in the evaluation environment (open, name, status, top, parent, event, length, ...).
- [ ] Reproduce with a fixture (a component with a local open/name/status passed into a site).
- [ ] Root cause in the evaluator (how site arguments are hoisted / how free identifiers resolve: instrument.ts, macro.ts, evaluate.ts; which globals the runner exposes).
- [ ] Fix at the root: a reference to a binding that is local to the function (by scope analysis of the oxc AST) is never resolved from globals; the error names the binding and the site.
- [ ] Tests (fixtures for open, name, status; a real global like Math still works), perf.mjs if the per-site path changes.
