---
# cssints-zho2
title: 'Plugin contract: registration, naming and types'
status: todo
type: task
priority: normal
tags:
    - wayfinder:grilling
created_at: 2026-09-30T11:57:32Z
updated_at: 2026-09-30T11:57:41Z
parent: cssints-9js6
---

## Question

docs/research/plugins.md §4 sketches `definePlugin({ name, members, kernels, runtime, conflicts })`. Before it is built, decide with the user:

- **How a plugin reaches user code.** Registered in `vite.config.ts` (`cssints({ plugins: [frame()] })`) and merged into `css.*` by type augmentation, or imported from the plugin package with `with { type: "cssints" }` (`import { frame } from "@cssints/frame" with { type: "cssints" }`), or both. What the types see in each case, and what `bun run members` does.
- **Packages.** Where `definePlugin` lives (`cssints/plugin` subpath or `@cssints/plugin`), and whether `frame`, `surface` and icons are built into `cssints` or separate packages.
- **Members for 0.2:** `property`, `context`, `style` (research), their exact signatures, and whether `conflicts` stays a plugin field.
- **Names.** Custom-property prefixes per plugin (collisions zeroed radii in the prototype), marker classes, kernel keys `name@version`.
- **Errors.** Tagged errors carrying plugin name and call site.

Answer: the decided contract in docs/API.md (a "Plugins" section, type-checked by the doc test) and the resolution here.
