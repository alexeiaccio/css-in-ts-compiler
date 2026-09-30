---
# cssints-su6o
title: Implement the public plugin API
status: todo
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T11:57:32Z
updated_at: 2026-09-30T12:23:09Z
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
