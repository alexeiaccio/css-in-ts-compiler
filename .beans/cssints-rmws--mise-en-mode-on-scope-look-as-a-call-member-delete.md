---
# cssints-rmws
title: 'mise-en-mode on scope(): look() as a call member, delete style()/context()/method()/property()/fn() shims'
status: completed
type: task
priority: normal
created_at: 2026-10-05T10:30:02Z
updated_at: 2026-10-05T10:47:53Z
parent: cssints-easl
---

Follow-up of cssints-8ogz, after the branches plugin-scope and mise-en-mode both merged. packages/mise-en-mode moves from cssints/plugin style() to scope(): look(tokens, expression, source, overrides, { scope? }) is a call member with args ["$tokens", "<expression>", "<source>", "$overrides", { "scope?": "<selector>" }] returning themes and layers (see test/fixtures/scope-kit.ts, the look there is the same shape). Then delete from cssints/plugin what nothing uses: style(), context(), method(), property() with Engine.style/context/property and their tests (plugins.mjs, test/types/plugins.ts, fixtures plug-kit/seam-kit/member-theme-kit, bench cases); fn() stays while functions.ts builds colorMix/min/max/clamp on it (or move those to scope value members).

## Summary of Changes

- **look() on scope().** `packages/mise-en-mode/src/index.ts` is one call member, `args: ["$tokens", "<custom-ident> | <string>", "app | author | viewer", "$overrides", { "scope?": "$selector" }]`, `uses` the private layers entry `app, author, viewer`, and its build returns `themes` (one per aspect). `src/types.ts` is deleted; the types are inferred from the definition and the 8 type cases of `test/types/look.ts` fail for the same reasons (source, token set, overrides, selector). One addition to scope(): a `"$selector"` leaf (types: `ValidSelector`, the old `scope` check; build: `checkSelectorNow`), because no grammar of the twin accepts `article.post`. The declaration file needs one annotation (`ReturnType<typeof mise.export>["look"]`): the inferred type of the member exceeds what the compiler prints (TS7056).
- **CSS is byte-identical**: the output of the package test (`:where([data-mode="e"], [data-mode~="e/aspect"])` rules, layers, `@scope`) and the demo's built CSS compare equal to before. Differences are in error text only: `look(2): unexpected "mode" in "dark mode"` (was `style: ...`), `cssints: look(5).scope: selector: ...` for a bad selector (was `createGlobalTheme(): scope: ...`), `pluginName` is the scope's name.
- **Deleted**: `style()`, `context()`, `method()`, `property()`, `fn()` with `Engine.style/context/property/fn`, `Built`, `Method`, `Chain` of author.ts, `test/types/plugins.ts`, the fixtures `seam-clash-key.ts`, and the `tmp-kit` case of plugins.mjs (the identity of a scope by name and content, test/scope.mjs, replaces both). Converted instead of lost: property, value functions (typed result, string, throws, returns nothing), chain with a runtime, kernel collisions (`kernels box.core and ring.core both declare --bx-w`, the marker clash `_chip-a-b`), the definition site (`makeIcons` is a scope built from a configuration), themes of a member, globals by content, the smoke app's plugin; the type cases moved into `test/types/scope.ts`.
- **fn() decision**: deleted. Only `colorMix` was on `fn()`; it is a value member of the scope `cssints-fn` (functions.ts, built with the engine's `scope` because the typed front finds the engine after macro.ts has loaded). `min`, `max`, `clamp` were plain calls, not `fn()`, and stay; the types of all four are `types.ts`'s, unchanged. `colorMix` errors keep the label `colorMix: ...`; `pluginName` is `cssints-fn`.
- **Budgets**: bench passes. functions.ts lost its `fn()` author half and drops to 310807/322309 (was 329582/341252, re-baselined down so it guards again); plugins.ts gained a value member (`step`, two calls): 76599/87967 against 76647/86987, no re-baseline. A `<color>` value member in the bench cost 110k (the color grammar, not the member), so it stays out.
- **Not done**: the stale comment of vite.config.ts `plainCode` ("sync members on the style() helper") stays, because diff:check warns on any change of that file.
