---
"cssints": minor
---

`scv()`: slot variants. `scv({ slots: { base, label, icon }, variants, defaultVariants, compoundVariants })` is one
function whose result is the class string of every slot (`{ base, label, icon }`). A variant value that is a style styles
the `base` slot, a record by slot styles the slots it names; in a `compoundVariants` entry, `class` is the `base` slot and
a slot's own name styles that slot. The rules are `cv()`'s, computed per slot (a variant wins over the slot's base, a
compound over both, and an overlap without containment is a build error that names the slot). Props are typed from
`variants`, and the result is `{ [K in keyof slots]: string }`.
