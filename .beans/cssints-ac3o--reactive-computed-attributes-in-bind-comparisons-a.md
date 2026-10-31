---
# cssints-ac3o
title: 'reactive: computed attributes in bind() (comparisons and literals)'
status: completed
type: feature
created_at: 2026-10-31T10:12:50Z
updated_at: 2026-10-31T10:12:50Z
---

The lab's adoption of `@cssints/reactive` (apps/lab, branch lab/reactive) found the one thing the plugin cannot say: a **computed attribute**.

`bind()` writes a state's value, so on a tab strip `aria-selected` can only be a boolean per tab (three writes per click, one boolean state each) and `aria-selected="one"` from a string state would be invalid HTML. A literal is not allowed either, so `aria-controls` cannot be written at all. `attr()` is a selector condition, not a declaration, so `when(ui.tab, "one")(attr("aria-selected", "true"))` writes nothing. Roving `tabindex` (`0` for the selected tab, `-1` for the rest) is out of reach for the same reason.

## What to add

```ts
bind({ "aria-selected": equals(ui.tab, "one"),   // "true" / "false"
       "aria-controls": "panel-one",            // a literal
       tabindex: either(equals(ui.tab, "one"), "0", "-1") })
```

- `equals(source, value)` and `either(comparison, whenTrue, whenFalse)`: comparisons, not sources. They have no storage, cannot be `set()`, and are recomputed from the nearest owner on the same flush — the rule "only sources are written" (ReactiveScript E-1) still holds, because a comparison is an equation, and the *only* place the runtime may evaluate one is a binding.
- `bind()` takes three kinds of value: a source (the state's value, today), a comparison (`"true""/"false"`), and a literal string. A literal is checked at build time (no commas or spaces) and written as is.
- Protocol: the binding segment grows a kind (`aria-selected ?tab one`, `tabindex ?tab one 0 -1`, `aria-controls =panel-one`), or a cleaner encoding if the build finds one; the runtime resolves it per element on every flush, once per owner.
- Types: `Comparable<T>`/`Comparison` branded; `equals` refuses a value not in the source's type; `either` refuses a non-comparison first argument.
- Tests: type refusals; the package test for the protocol; browser cases for the tab strip with correct `aria-selected`, `aria-controls` and roving `tabindex`; the lab's two stories lose their caveats (apps/lab/src/stories/reactive-tabs.stories.tsx, disclosure).
- Docs: README (the three kinds of binding, and why a comparison is allowed to be computed in the runtime), the protocol table, the deferred list (no arithmetic: `count > 2` needs a real derived expression and waits).

## Why not a CSS derivation

Every other derivation in the plugin is CSS (`calc(var(--reactive-count) * 2)`, `inside()`, `within()`). An attribute cannot: `attr()` reads, it does not compute, and `aria-selected`/tabs sit on the element itself. That is why this is the one comparison the runtime evaluates, and the reason it is a separate round: it is the first computation in a design that had none.

## Summary of Changes

- `packages/reactive/src/index.ts`: `Comparison<T>` and `Choice` brands, `equals(source, value)` and `either(comparison, whenTrue, whenFalse)`; `bind()` takes a source, a comparison, a choice or a literal, and a literal is a build error at the call site for a comma, a space or a leading `=`/`?`/`!`.
- Protocol: one `--reactive-binding` with a kind per pair — `aria-expanded open`, `aria-controls =panel-one`, `aria-selected ?tab one`, `tabindex ?tab one 0 -1`. The planned `!` before a choice's literals is dropped: lightningcss rejects `!` in a custom property value (a broken `!important`), so the two trailing tokens mark the choice.
- `packages/reactive/src/runtime.ts`: parses the pairs once per element (a `WeakMap`), writes a source's value, a literal, "true"/"false" for a comparison, or one of a choice's two literals; the comparison reads the nearest owner. Runtime 2.48 kB -> 2.73 kB minified (1.16 -> 1.26 kB gzipped).
- Tests: `test/reactive.mjs` (the four kinds in the emitted list and the client class list, the three literal errors), `test/types/reactive.ts` (the refusals, `Comparison`/`Choice` accepted only by `bind()`), `test/browsers.mjs` (a computed tab strip: `aria-selected`, literal `aria-controls`, roving `tabindex`, `aria-pressed`; one click, no storage, a reload keeps nothing).
- `apps/lab`: the tabs story is one string state with `equals()`/`either()`/a literal, the disclosure writes its `aria-controls`; `test/lab.mjs` asserts `aria-selected` and `tabindex` on the three tabs after a click.
- Docs: the reactive README (the four kinds, why the runtime computes, the protocol rows, the limits), the `docs/API.md` row, a wayfinder entry. Changeset `@cssints/reactive` minor.
- Verified: `node test/reactive.mjs`, all three browser engines (Chrome 156, Firefox 157, WebKit 27.2), `bun run typecheck`, `apps/lab`'s `test:browser`, `build:packages`, `docs.mjs`, lint and format, `release:check`.
