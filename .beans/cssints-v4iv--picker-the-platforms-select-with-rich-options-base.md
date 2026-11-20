---
# cssints-v4iv
title: 'picker: the platform''s select with rich options (base-select, ::picker(select))'
status: in-progress
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-11-20T11:13:41Z
updated_at: 2026-11-20T11:13:41Z
---

Reference: https://alfy.blog/2026/10/27/a-select-should-tell-you-something.html (Ahmad Alfy, 27 Oct 2026), read 2026-11-20.

The article is about `appearance: base-select`: the popup is part of the page, so an option can hold a preview, a time, a price, a title or a badge, and the control is still the browser's (keys, type-to-jump, form value, required, role).

## Taken

- **Grammar**: `appearance: base-select` was refused (mdn-data 2.27.1's `<compat-auto>` lacks it; BCD 8.1.3 has `css.properties.appearance.base-select`, Chrome 135 / Safari 27 / Firefox 149). Fixed in `packages/css-grammar/scripts/extract.mjs` as an `EXTRA` type patch, like `display: grid-lanes`; regenerated `mdn.ts` and `keywords.ts`.
- **Member**: `css.picker(styles)` → `.k::picker(select)`. The generated element wrappers are argument-less, and a functional pseudo-element was not expressible; `select` is the only argument, so the wrapper takes none.
- **Starter** `apps/ui/src/registry/picker/`: a native `select` with `button > selectedcontent`, an option grid (`--picker-columns`), a badge column and an inline style per option for typefaces; gated on `@supports (appearance: base-select)` and `@media (hover: hover) and (pointer: fine)`, with separator spans that make the plain option read as a sentence.

## Found

A `value` bound on `<select>` while its options are still being appended leaves `selectedIndex -1` (Chrome resets the property): the controlled value is written by an effect from a ref, after the children exist. The `selectedcontent` mirror follows within two frames.

## Not taken

Nothing from the article was left out; the alternatives it weighs (a group of radios with the facts in prose) are the reason the picker exists, and the pointer gate is the article's own advice implemented as written.

## Held back (2026-11-20)

The starter's files and the `picker` registry item were written and then removed from the change: the starter smoke installs
the *published* packages, and `css.picker()` / `appearance: base-select` are not on npm until the release this changeset is in
— the copied `picker.browser.test.tsx` failed to import against the published grammar. The component, its stories and its
five browser tests are in the commit's parent if the release lands and the item is re-added (generate the registry and the
catalog again, which is all `picker` needs).
