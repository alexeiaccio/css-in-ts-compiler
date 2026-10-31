---
# cssints-ac3o
title: 'reactive: computed attributes in bind() (comparisons and literals)'
status: todo
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
