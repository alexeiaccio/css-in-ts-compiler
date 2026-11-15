---
"@cssints/headless": minor
---

Every props object a primitive returns now carries `data-part`, the name that part goes by in the primitive's own
vocabulary (`trigger`, `panel`, `option`, `menuitem`, `thumb`, `track`, `cell`, `row`, `header`, …). It is additive: no
behaviour, no new option, no ARIA, no id or focus change — the value is a styling hook, typed `string` rather than a
literal so a host or a `render` may still replace it.

The values are the de-facto vocabulary the fixtures already used (`test/*.fixture.tsx`), so a skin can attach to
`[data-part="option"]` without the host inventing class names; the fixtures' own literals are now redundant and are
gone, except where a fixture addresses one instance (`node${id}`, `cell:r,c`) and renames the part after the spread.
`TabRenameProps` is the one props object without the marker: it is the rename controller, not a set of element
attributes. `test/parts.test.ts` fails a primitive whose props type omits it, and `data-part` is documented per
primitive in `packages/headless/README.md`.
