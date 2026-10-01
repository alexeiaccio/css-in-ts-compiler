---
# cssints-su6o
title: Implement the public plugin API
status: completed
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T11:57:32Z
updated_at: 2026-10-01T07:54:09Z
parent: cssints-9js6
blocked_by:
    - cssints-zho2
    - cssints-vcop
---

## Question

Build the contract decided in "Plugin contract: registration, naming and types" on the engine seams: `definePlugin`, `property()`, `context()`, `style()`, kernels, `conflicts`, and the runtime delivery of plugins.md §5 (the client transform adds `import "virtual:cssints/runtime/<plugin>"`, whose content `load` decides from the plugin's `runtime`, the browserslist targets and BCD). The first proof is `property("-webkit-font-smoothing", …)` as a user-defined typed property. Fixtures, type tests, bench within budget.

## Contract

Decided in "Plugin contract: registration, naming and types" (cssints-zho2, see its Resolution): no `definePlugin`; `context()`, `style()`, `property()` and `method()` in `cssints/plugin`; kernel, runtime and conflicts on the member; plugins reach user code by an attributed import, no registration; collisions of custom properties and markers across kernel keys are build errors. Write the docs/API.md "Plugins" section here.

Also here: the type-level error label generalised (`Valid<Label, G, S>`) so a grammar that is not a property gets a readable message, after the error-DX spike (cssints-kotg) is merged; `bun run bench` within budget.

From the seams (cssints-vcop): declarations of custom properties (`["--_r", v]`) are rejected by the grammar check today ("no grammar for this property"); `context()` methods emit them, so let them through (any `--*` name, value unchecked or `<declaration-value>`). Also consider the dev-only false collision when a kernel used through a helper module is edited (kernel users tracked by file).

## Todo

- [x] context() and method(): marker, kernel, runtime, conflicts, a method once, `--*` through the grammar check
- [x] style(grammar, build), property(name, grammar, emit?): `-webkit-font-smoothing` as the first proof
- [x] the error label generalised (ValidIn<Label, G, S>), the error on the bad argument kept, bench file for plugin calls with a budget
- [x] conflicts: a build error with the plugin's message and the call site
- [x] runtime delivery: the import, load decided from `lacking()`, cssints/parent-vars, the fallback CSS in _.k only then, off without @property
- [x] MemberError (Data.TaggedError) with the plugin name and the call site
- [x] docs/API.md "Plugins", type tests, seam-kit on the public helpers
- [x] the false collision of a kernel used through an edited helper module

## Summary of Changes

`cssints/plugin` (src/author.ts, types in src/author-types.ts): `context`, `method`, `style`, `property`. A style node carries `plugs` (name, marker, conflicts, runtime) next to markers and kernels; `classesOf` checks conflicts and registers runtimes. `node()` moved to lib.ts and takes a chain function (flex(), grid() and contexts share it). Custom properties pass the grammar check; `property()` names skip the engine check (the member checked the value). `Valid` gained `ValidIn<Label, G, S>`; src/parts.ts holds the call-check types for properties and plugins (budgets unchanged: users.ts +0.1%, unused.ts +1%). Runtime delivery: src/delivery.ts, `cssints/parent-vars` (browser, no imports), the client transform imports `virtual:cssints/runtime/<name>`. `MemberError` carries `pluginName` (not `plugin`: Vite overwrites that). Kernels and runtimes of a module are forgotten at its first site of an evaluation, which fixes the false collision after editing a helper module. css-grammar's dist now keeps `css.d.mts` whole (it lost `Hint`, which broke the dist declarations check of the smoke test). Tests: test/plugins.mjs, test/types/plugins.ts, bench/plugins.ts, smoke app with a plugin.
