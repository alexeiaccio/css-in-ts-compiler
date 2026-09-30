---
# cssints-wigi
title: 'Build-time evaluation edge cases: unreached sites, top-level _cv, runtime values'
status: completed
type: bug
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T08:50:32Z
updated_at: 2026-09-30T09:18:58Z
parent: cssints-vy0o
---

## Question

Found in cssints-gcho (docs/API.md documents them as limits today).

- [x] A top-level site that the module run does not reach (`false && p(4)`, a branch not taken) fails with "site N was not evaluated". Evaluate unreached sites the way sites inside functions are (`__cssints_hoisted`), so every site gets its class string whether or not it ran.
- [x] A top-level `_cv(cv(...))` call fails at build time (`Cannot read properties of undefined (reading 'size')`), because during evaluation `cv()` is a node. Make `_cv` work on the eval-time value, or give a clear error.
- [x] A runtime value in a css call (`p(n)` with `n` a parameter) fails with "n is not defined". Give an error that says css arguments must be known at build time and names the value and the call site; consider catching it at the type level too.
  Type level: tried and dropped. Rejecting a non-literal `string`/`number` in `Prop` (types.ts) cost +0.4% of the users.ts budget (726225 vs 723626 tsc), but it rejects legitimate code: a helper module of the attribute takes parameters (`apps/demo/src/helpers.ts`, `stack(n)`) and `space.md` typed `number` in the hmr app. The types cannot tell a helper parameter from a component prop, so the build error is the check.
- [x] `createGlobalTheme(t, hover, …)` type-checks: its condition should accept media and container wrappers (and selectors) only, not pseudo-class wrappers.
- [x] Fixtures for each; docs/API.md limits updated

## Summary of Changes

- Unreached top-level sites: instrument.ts also puts each top-level site in `__cssints_hoisted`, guarded by `__unseen(file, n)` (macro.ts), so a site the load did not reach (`false && p(4)`, an untaken branch, a ternary arm) is evaluated after load, like a site in a function. Its arguments may use module bindings, not locals of the branch. Fixture `unreached.ts`.
- Top-level `_cv(cv(...))`: the eval-time `cssints` (index.ts) exports a tolerant `_cv` (macro.ts) that turns the `cv()` node into class strings and calls the runtime `_cv`. runtime.ts is unchanged. Fixture `cv-top.ts`.
- Runtime values: evaluate.ts turns a ReferenceError raised while a site's arguments run into a MacroError "css arguments must be known at build time: n is not defined where the call is evaluated (a parameter, a prop or state). Use cx(on && p(4)), a cv variant, or a token in a style prop", located at the call (line 3, column 34 in `runtime-arg.ts`). Type-level rejection of a non-literal string or number was measured (+0.4% of users.ts) and dropped: it rejects attributed helper modules that take parameters (apps/demo helpers.ts) and the hmr app.
- createGlobalTheme: `media()` and `container()` return `QueryWrap` (a branded `Wrap`); the condition parameter is `QueryWrap | string`, so `hover` and `supports()` are type errors. The build error stays. Type tests in test/types/themes.ts.
- docs/API.md limits updated.
