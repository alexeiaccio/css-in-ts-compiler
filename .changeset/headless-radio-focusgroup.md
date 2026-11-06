---
"@cssints/headless": minor
---

`createRadioGroup`'s roving flavor is now the platform's `focusgroup="radiogroup"` contract: the group
builds its provider from the owner's `ref`, and the browser (Chromium 150+) or
`@microsoft/focusgroup-polyfill` moves focus on both axes, wraps, and owns the item `tabindex`. Two things
stay the library's, as `shared/focusgroup.qnt` leaves them to the pattern: **selection follows focus** (the
owner's `focusin` handler checks the radio the platform landed on — a Tab entry or a click only moves the
focus state) and the **tab stop** (the checked radio, else the first enabled one: the definition is
`nomemory` with a `focusgroupstart` marker, re-derived after every focus move, because the platform's own
stop is the focused item). A disabled radio is opted out of the group (`focusgroup="none"`) and keeps
`tabindex="-1"`, as before. The `aria-activedescendant` flavor is unchanged: it moves a virtual focus on the
group, which focusgroup does not model.

Breaking: the group props gained `focusgroup`, `ref` and `dir`, and `RadioGroup.keyDown` is gone — the
platform moves focus. `RadioProps` no longer carries a roving `tabindex` (the platform writes `0` / `-1`);
what it carries is the author value the platform needs: `focusgroupstart` on the tab-stop radio,
`focusgroup="none"` plus `tabindex="-1"` on a disabled one, and — only where the native engine is used —
`tabindex="0"`, because that engine navigates only items with `tabIndex > -1` and a `<div role=radio>` is
not focusable otherwise. To migrate, spread `radiogroupProps` on the owner (keeping its `ref`), `radioProps(i)`
on each radio, and delete any roving `tabindex` you bound on an item.
