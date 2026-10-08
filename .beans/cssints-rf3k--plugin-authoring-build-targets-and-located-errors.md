---
# cssints-rf3k
title: 'Plugin authoring: build targets and located errors'
status: completed
type: feature
priority: low
created_at: 2026-10-08T14:10:21Z
updated_at: 2026-10-08T15:48:40Z
---

Found by stuck (cssints-z1hd, repros under "## Engine gaps").
- A plugin cannot read the build targets: stuck imports `lackingOf` from `@cssints/css-grammar/support` (a new dependency).
- `stuck("middle")` fails the build with the right message but no source location: the error is thrown where the plugin cannot raise a `MemberError` at the call.

## Todo
- [x] expose `lacking(keys)` (the targets that lack a BCD key): a free function of `cssints/plugin`, not a build context (stuck() is a plain function, no context reaches it)
- [x] errors thrown from a member's own code keep the call site
- [x] drop stuck's css-grammar dependency

## Summary of Changes

- `cssints/plugin` exports `lacking(...keys)`: the build's targets that lack one of the BCD keys (`["firefox 140"]`, `[]` when none), from css-grammar's `lackingOf` (the query and `partial_implementation` rule of the support warnings). A free function rather than a context argument: `stuck()` is a plain function of the plugin, which no member context reaches; it works in members too.
- Root cause of the unlocated error: only callbacks wrapped in `ran()` (build, value, kernel styles) became a located MemberError; a chain's `emit` was not wrapped, and a plugin's own plain function had no wrapper, so evaluate.ts `failureOf` made an EvalError with the file only. Now anything thrown while a site runs (`registry.at` set) is a MacroError at that site, and `emit` goes through `ran()` (MemberError with pluginName).
- Tests: scope.mjs throws from chain emit, call build, value, kernel styles and a helper (each loc line 3), and reads lacking(); stuck's bad-side error has loc line 5.
- stuck uses lacking(), no @cssints/css-grammar dependency; README, docs/API.md (Plugins: Errors, lacking), wayfinder.
