---
# cssints-43rj
title: 'scv(): slot variants — one function, a class string per slot'
status: in-progress
type: feature
created_at: 2026-10-25T18:47:16Z
updated_at: 2026-10-25T18:47:16Z
---

Slot variants, the API docs/API.md defers as `scv` (docs/API.md: "Slot variants (`scv`) are not part of 0.1"). `scv({ slots: { base, label, icon }, variants, defaultVariants, compoundVariants })` returns one function; calling it gives the class string of every slot: `{ base, label, icon }`.

Semantics (tailwind-variants / cva slots, as the shape users know):
- a variant value that is a style applies to the `base` slot; a record keyed by slot applies to those slots, so one variant can style several slots;
- `compoundVariants` entries take `class` for the base slot and slot names for the others;
- a slot is styled and dropped by the same rules `cv()` has (variant wins over base, compound wins over both, overlap without containment is a build error), computed per slot;
- props are typed from `variants` exactly as `cv()`'s; the result is `{ [K in keyof slots]: string }`; an unknown slot, variant or value is a type error and a build error with the call site;
- defers: a `cv()` function as a slot value, and `scv()` in `compoundVariants`; a slot value is a css.* style (or cn/chain).

## Todo
- [ ] Design the build: per-slot cv configs from one scv config, reusing cvOf/dropsOf; the site emits __scv
- [ ] Runtime _scv: per-slot cv runtimes, built once, class strings
- [ ] Types: ScvConfig, slot keys in variant values and compound entries, props from variants
- [ ] Fixtures: slots, defaults, compounds, drops, overlap and unknown-slot errors; a runtime check
- [ ] Type tests; bench; docs/API.md, wayfinder, changeset (cssints minor)
