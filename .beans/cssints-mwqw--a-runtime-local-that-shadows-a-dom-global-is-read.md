---
# cssints-mwqw
title: A runtime local that shadows a DOM global is read as the global at build time
status: completed
type: bug
priority: normal
created_at: 2026-10-08T15:19:53Z
updated_at: 2026-10-08T15:39:33Z
---

Found by cssints-z8sb (apps/docs): in a component, a local signal named `open` made `ph(open() ? "x" : "list")` build without error: the build-time evaluator read `window.open` (or a global open) and picked one arm. Any site argument that refers to a runtime binding (a local of a function, a parameter, a signal) must be an error at the site (the existing 'runtime value' message), even when its name exists as a global in the evaluation environment (open, name, status, top, parent, event, length, ...).
- [x] Reproduce with a fixture (a component with a local open/name/status passed into a site).
- [x] Root cause in the evaluator (how site arguments are hoisted / how free identifiers resolve: instrument.ts, macro.ts, evaluate.ts; which globals the runner exposes).
- [x] Fix at the root: a reference to a binding that is local to the function (by scope analysis of the oxc AST) is never resolved from globals; the error names the binding and the site.
- [x] Tests (fixtures for open, name, status; a real global like Math still works), perf.mjs if the per-site path changes.

## Summary of Changes

Root cause: the evaluator (evaluate.ts, DomEvaluator) makes every happy-dom own property that Node lacks (open, name, top, parent, self, close, ...) a closure binding around each module body. A site inside a function is hoisted into `__cssints_hoisted()` at module level (instrument.ts), where the function's locals do not exist, so a free name there fell through to a happy-dom global, or to a module binding of the same name (`const n = 4; (n) => p(n)`), and the site built silently.

Fix (instrument.ts): findSites tracks the names declared by the functions and blocks around each site (parameters, let/const/class/function, loop heads, catch). A hoisted site wraps itself as `{ __site(...); let a, b; }` for the locals it names, so reading one is a temporal-dead-zone ReferenceError, never a global or a module binding. evaluate.ts maps "Cannot access 'x' before initialization" to the existing located runtime-value error.

Tests: fixtures runtime-global (open), runtime-global-block (name in a for-of), runtime-shadow (module const shadowed), runtime-globals-ok (Math, module const, a param named like a global but unused in the site), in the package.json test chain.
