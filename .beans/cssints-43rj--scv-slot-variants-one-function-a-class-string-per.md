---
# cssints-43rj
title: 'scv(): slot variants — one function, a class string per slot'
status: completed
type: feature
priority: normal
created_at: 2026-10-25T18:47:16Z
updated_at: 2026-10-25T19:09:43Z
---

Slot variants, the API docs/API.md defers as `scv` (docs/API.md: "Slot variants (`scv`) are not part of 0.1"). `scv({ slots: { base, label, icon }, variants, defaultVariants, compoundVariants })` returns one function; calling it gives the class string of every slot: `{ base, label, icon }`.

Semantics (tailwind-variants / cva slots, as the shape users know):
- a variant value that is a style applies to the `base` slot; a record keyed by slot applies to those slots, so one variant can style several slots;
- `compoundVariants` entries take `class` for the base slot and slot names for the others;
- a slot is styled and dropped by the same rules `cv()` has (variant wins over base, compound wins over both, overlap without containment is a build error), computed per slot;
- props are typed from `variants` exactly as `cv()`'s; the result is `{ [K in keyof slots]: string }`; an unknown slot, variant or value is a type error and a build error with the call site;
- defers: a `cv()` function as a slot value, and `scv()` in `compoundVariants`; a slot value is a css.* style (or cn/chain).

## Todo
- [x] Design the build: per-slot cv configs from one scv config, reusing cvOf/dropsOf; the site emits __scv
- [x] Runtime _scv: per-slot cv runtimes, built once, class strings
- [x] Types: ScvConfig, slot keys in variant values and compound entries, props from variants
- [x] Fixtures: slots, defaults, compounds, drops, overlap and unknown-slot errors; a runtime check
- [x] Type tests; bench; docs/API.md, wayfinder, changeset (cssints minor)


## Summary of Changes

`scv()` is implemented as one `cv()` config per slot, built by `scvOf` (macro.ts) from the scv config and run through
`cvOf`/`settled`, so the rules are `cv()`'s by construction. The site compiles to
`__scv({ base: <cv config>, label: <cv config>, ... })` with `import { _scv as __scv } from "cssints"`; `_scv`
(runtime.ts) builds each slot's `_cv` runtime once and returns `(props) => ({ slot: classes })`. Class strings only.

- `cvOf` takes the engine name for its errors (`cv()` by default, `scv() slot base:` from scv), skips a variant value an
  scv slot does not style while keeping the variant key (compounds match the props), and keeps a compound's index in
  `whens` when the slot has no style for it, so errors name the entry as written. `settled` takes that name too.
- Build errors, at the `scv()` call: an overlap per slot, a slot a record or a compound names but that is not a slot, and
  a bare style value with no slot named `base`.
- Types (types.ts): `ScvValue<S>`, `ScvConfig<S, V>`, `scv<S, V>(config) => (props?: CvProps<V>) => { [K in keyof S]: string }`;
  `scv` in `named`, in `BUILDERS` and in `group-common.ts` (every export group has it).
- Tests: `test/fixtures/scv.ts` + `test/scv.mjs` (slots, defaults, records by slot, drops per slot, compounds and their
  placeholders, booleans, a group, the top-level call, an scv in a function, four build errors with their call site),
  `test/types/scv.ts` and a `wide.scv(...)` line in `test/types/groups.ts`, four error fixtures, `bench/users.ts` (+1 972
  instantiations; no re-baseline), `docs/API.md` "scv()", README and the writing-styles skill, a wayfinder entry and a
  changeset.

Finding: `bun run typecheck` (effect-tsrs) reports no TypeScript diagnostic for `test/types/*.ts` in this worktree, for an
existing file too; the type tests were also run through tsc 5.9 and `bunx vp lint`, which check them.
