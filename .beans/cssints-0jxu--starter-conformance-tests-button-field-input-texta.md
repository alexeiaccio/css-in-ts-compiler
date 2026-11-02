---
# cssints-0jxu
title: 'Starter conformance tests: button, field, input, textarea, treeview'
status: completed
type: task
priority: normal
created_at: 2026-11-02T11:18:53Z
updated_at: 2026-11-02T11:38:29Z
---

Add the copy-carried conformance test for five styled starters in apps/ui (branch ui/tests-c): the fixture, the driver where the walk needs one, and the browser test, each runnable from a flat src/components/ui/ copy. The tested flags are flipped centrally afterwards.

- [x] button: styled fixture, driver copy, the ported scenarios + differential walk, and the look
- [x] treeview: styled fixture, driver copy, the ported scenarios + differential walk, and the look
- [x] field: the Field + Input ARIA, the error, the disabled look and render
- [x] input: the control inside the field wiring, props, disabled, value, render
- [x] textarea: the same wiring as an input, rows/wrap/resize, invalid, disabled, render
- [x] verify: per-item vitest, the full apps/ui suite, typecheck, fmt, lint, release:check

## Summary of Changes

Five starters now ship a conformance test, each runnable from the flat `src/components/ui/` copy:

- **button**: `button.fixture.tsx` (styled `Button`, `tone`/`size`/`render`), `button-driver.ts` (byte copy of
  `packages/headless/test/dom-driver.ts`), `button.browser.test.tsx` (the three ported scenario files, the 10
  differential configs, its `DIVERGENCES` with reasons, plus one part, the tone and size paint, the disabled paint, and
  `render` keeping the state live). 27 passed, 41 skipped alone.
- **treeview**: `treeview.fixture.tsx`, `treeview-driver.ts` (byte copy of the generic driver: the `Mounted` type, and the
  devDependencies the copied walk needs), `treeview.browser.test.tsx` (the APG scenarios, 8 differential configs, the
  `DIVERGENCES`, and the skin: the parts, the `aria-level` indent, the `aria-expanded` chevron, the selected fill, hidden
  rows not painted, the DOM focus following the roving tabindex). 44 passed, 3 skipped alone.
- **field**: `field.browser.test.tsx`: `Field` + `Input` — the label names the control, the hint and the error are the
  described-by ids, `aria-invalid` follows the error (and the invalid border with it), a disabled control keeps its look and
  leaves the tab order, `Field.Control render` replaces the part and its `invalid` accessor stays live. 4 passed.
- **input**: `input.browser.test.tsx`: the control inside the field's wiring (from `createField`), the props, the value, the
  invalid border, the disabled look and tab order, `render`. 7 passed.
- **textarea**: `textarea.browser.test.tsx`: the same wiring as a wired `<input>` (compared attribute by attribute), rows,
  wrap, resize, the invalid border, the disabled look and tab order, `render`, the value. 7 passed.

Two state hooks the tests exposed were unreachable and are fixed in the items' own sources: `Input`/`Textarea` now paint
`:disabled` as well as `aria-disabled` (a plain input carries only the native attribute), and `Treeview` marks the row with
`group()` (the marker the chevron's `within()` reads) and paints `[hidden]` as `display: none` (its own `display: flex` was
overriding the UA rule, so a closed parent's rows were painted).

Verified: per-item vitest in Chromium, `bun run test` (the differential walks time out under the machine's load, untouched
items included; every file of this change passes alone), `bun run typecheck`, `vp fmt --check`, `vp lint`, and
`bun run release:check` at the root.

Copy note: `input.browser.test.tsx` and `textarea.browser.test.tsx` wire the control with `createField`
(`@cssints/headless`, a base dependency), because neither item's `with` list ships `field/field.tsx`; mounting the kit's
`Field` there would need `field/field.tsx` (and `input/input.tsx` beside it) added to those `with` lists when the `tested`
flags are flipped.
