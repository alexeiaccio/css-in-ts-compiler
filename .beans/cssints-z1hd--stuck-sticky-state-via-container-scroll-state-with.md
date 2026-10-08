---
# cssints-z1hd
title: 'stuck(): sticky state via @container scroll-state() with an observer fallback'
status: completed
type: feature
priority: normal
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T14:00:20Z
parent: cssints-dk1q
---

## What
A condition-like member `stuck(styles)` that applies styles when a sticky element is stuck: `@container scroll-state(stuck: top)` natively (Chrome 133), else an IntersectionObserver on the shared parent-vars runtime that sets a data attribute.

## Sources
- https://github.com/bramus/sticky-observer

## Shape
- kernel: `container-type: scroll-state` + rule; runtime: `polyfills: ["css.at-rules.container.scroll-state"]`, parentVars-style watch.

## Todo
- [x] native rule
- [x] observer runtime
- [x] fixture

## Engine gaps

`container()` takes scroll-state queries as they are (`container("scroll-state(stuck: top)")` passes the grammar and prints `@container scroll-state(stuck: top)`): no gap there. Gaps, each worked around inside packages/stuck:

1. **A runtime cannot ship a script of its own.** `virtual:cssints/runtime/<scope>.<entry>` is `export {};` for any runtime without `parentVars` (delivery.ts `runtimeModule`), so an IntersectionObserver cannot be delivered.
   Repro: `scope("x", { "#rt": { polyfills: ["css.at-rules.container.scroll-state_queries"] }, x: { uses: ["rt"], args: [] } })`, targets `firefox 140`: the module is `export {};`.
   Workaround: the app imports `@cssints/stuck/observer` (a subpath export) once; it probes `CSS.supports` itself. The runtime entry stays, with `polyfills` only, to cover the kernel's warning.
2. **A kernel written as styles: the support warnings of its values are not covered by a runtime's `polyfills`** (only `requires` is).
   Repro: `"#core": { css: (css) => [css.containerType("scroll-state")] }`, `"#rt": { polyfills: ["css.properties.container-type.scroll-state"] }`, `uses: ["core", "rt"]`: the build still warns `container-type: "scroll-state" in "scroll-state" is not supported by ...`.
   Workaround: a raw CSS kernel (`&{position:sticky;container-type:scroll-state}`) with `requires`, and an explicit `conflicts` entry (a raw kernel derives none).
3. **A member cannot carry a `group()` marker, and `within()` reads only `_g-<name>`**, so a plugin's condition cannot key a rule on the plugin's own element (its kernel class).
   Repro: no field of a chain member or of what `build` returns adds `_g-stuck` to `sticky()`; `within(attr("data-stuck", "top", "~="), "stuck")` needs it.
   Workaround: `sticky` wraps the chain member in a Proxy whose every node is `cn(group("stuck"), node)` (src/index.ts `grouped`).
4. **A plugin cannot read the build's targets.** Nothing in `cssints/plugin` says whether a target lacks a feature.
   Workaround: `lackingOf` from `@cssints/css-grammar/support` (a dependency), so `stuck()` emits its fallback rules only when a target lacks scroll-state queries.
5. **An error thrown by a plain exported function has no location.** `stuck("middle")` throws `new Error("cssints: stuck: ...")`; the build error has the message but no `loc` (`MemberError`/`failIn` are not exported to plugins). The types reject it first.

## Summary of Changes

New package packages/stuck (@cssints/stuck):
- `sticky()`: a chain member (top/right/bottom/left, `<length-percentage>`, spacing steps) over the raw kernel `._stuck-core{position:sticky;container-type:scroll-state}` (requires scroll-state queries), with conflicts on position/container/container-type and the group marker `_g-stuck`.
- `stuck(...styles)` / `stuck(side)(...styles)`: `@container scroll-state(stuck: <side>)` for descendants, plus `:where(._g-stuck[data-stuck~="<side>"]) ._x` rules only when a browserslist target lacks the queries.
- `@cssints/stuck/observer`: the fallback, ~1.35 kB minified, no imports; one IntersectionObserver per sticky element (root shrunk by the insets + 1px), sets data-stuck; off where CSS.supports says scroll-state is there.
- Tests: test/stuck.mjs (output, native-only and lacking targets, empty runtime module, errors, observer size), test/types/stuck.ts, test/browsers.mjs (Chrome native and observer, Firefox, WebKit, with a control). README.
- Deferred: logical sides, scrollable/snapped queries, following inset changes, tall sticky elements.
