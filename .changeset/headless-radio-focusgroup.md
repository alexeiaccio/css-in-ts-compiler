---
"@cssints/headless": minor
---

`createRadioGroup`'s roving flavor is now the platform's `focusgroup="radiogroup"` contract: the group
builds its provider from the owner's `ref`, and the browser (Chromium 150+) or
`@microsoft/focusgroup-polyfill` moves focus on both axes, wraps, and owns the item `tabindex`. Two things
stay the library's, as `shared/focusgroup.qnt` leaves them to the pattern: **selection follows focus** (the
owner's `focusin` handler checks the radio the platform landed on — a Tab entry or a click only moves the
focus state) and the **entry point**: the definition is `nomemory` with `focusgroupstart` on the checked
radio (else the first enabled one), which is where the next Tab entry lands. While focus is inside the group
the tab stop is the platform's — the focused radio — and the primitive does not re-seat it; that is what a
native engine keeps (in its focus controller) and what the polyfill renders as `tabindex=0`. A disabled radio
is opted out of the group (`focusgroup="none"`) and keeps `tabindex="-1"`, as before. The
`aria-activedescendant` flavor is unchanged: it moves a virtual focus on the group, which focusgroup does
not model.

Breaking: the group props gained `focusgroup`, `ref` and `dir`, and `RadioGroup.keyDown` is gone — the
platform moves focus. `RadioProps` no longer carries a roving `tabindex` (the platform writes `0` / `-1`);
what it carries is the author value the platform needs: `focusgroupstart` on the entry radio,
`focusgroup="none"` plus `tabindex="-1"` on a disabled one, and — only where the native engine is used —
`tabindex="0"`, because that engine navigates only items with `tabIndex > -1` and a `<div role=radio>` is
not focusable otherwise. To migrate, spread `radiogroupProps` on the owner (keeping its `ref`), `radioProps(i)`
on each radio, and delete any roving `tabindex` you bound on an item.

`radio.qnt` now models that stop instead of pinning it to the check (`radioTabindex` is `fgTabIndex`, the
entry and leave transitions are `fgEntry` / `fgStopOnLeave`), so the differential walk checks the stop the
engine keeps rather than one the widget could only fake by scripting the tabindex.
