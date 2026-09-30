---
# cssints-zho2
title: 'Plugin contract: registration, naming and types'
status: completed
type: task
priority: normal
tags:
    - wayfinder:grilling
created_at: 2026-09-30T11:57:32Z
updated_at: 2026-09-30T12:22:59Z
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

## Resolution (grilled with the user, 2026-09-30)

- **How a plugin reaches user code:** an import with the attribute, no registration: `import { frame } from "cssints/frame" with { type: "cssints" }`. The engine already finds sites by the attribute, not the package. Types come from the plugin module; no augmentation of `css.*`, `bun run members` is untouched. `vite.config` does not list plugins: the engine learns kernels and runtimes from the style node at evaluation.
- **Packages:** the authoring helpers in the subpath `cssints/plugin`; `frame` and `surface` as subpaths `cssints/frame` and `cssints/surface`, written on the public helpers (they dogfood the API and share the parent-vars runtime); icons as a separate package `@cssints/icons` (iconify dependencies), replacing packages/plugin-icon.
- **No `definePlugin`.** With no registry it would do nothing. A plugin is a module that exports members built by three helpers (plus `method()` for context methods):
  - `context({ name, marker, kernel, runtime?, conflicts?, methods })`: a chaining context like `flex()`;
  - `style(grammar, build)`: a function of grammar-typed parts returning a style (icons);
  - `property(name, grammar, emit?)`: a user-defined typed property (`-webkit-font-smoothing`), passthrough by default.
  The kernel (`{ key: "name@version", css, atProperty?, requires?: BcdKey[] }`), the runtime (`{ polyfills: BcdKey[], parentVars?, css? }`) and the conflicts live on the member. Two members share a kernel by pointing at the same object; the same key with different CSS is a build error. `fn()` and `keyword` stay out of 0.2.
- **Names:** the author picks short custom-property names and markers; the engine collects the `--*` declared by each kernel and the markers, and two different kernel keys declaring the same one is a build error naming both plugins.
- **Conflicts** stay a build error (a style that holds the marker and one of the listed properties in one `cn()`).
- **Errors:** `Data.TaggedError` values carrying the plugin name and the call site, like `MacroEvalError`.
- **Not in 0.2 (YAGNI):** a switch to turn a plugin's runtime off; add it when an app loads the polyfill itself.

The docs/API.md "Plugins" section is written by the implementation ticket, when the doc test can type-check it.
