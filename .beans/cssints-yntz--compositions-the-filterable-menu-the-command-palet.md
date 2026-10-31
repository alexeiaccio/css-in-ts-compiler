---
# cssints-yntz
title: 'Compositions: the filterable menu, the command palette, the date picker'
status: completed
type: task
priority: normal
created_at: 2026-10-30T10:51:11Z
updated_at: 2026-10-31T11:41:07Z
parent: cssints-65eb
---

Patterns that are a composition, not a primitive. Base UI's "building a filterable menu", Ariakit and React Aria have working examples to measure against.

- [ ] filterable menu, per Base UI's "Building a filterable menu that works for everyone" (Jenna Smith, 2026-10-14):
  - [ ] the container is a dialog with a search field and a menu, not a combobox: choosing an item runs a command, it does not complete the field ("a role is a promise"); no aria-autocomplete, no aria-haspopup on the field; the trigger says aria-haspopup="dialog"
  - [ ] the field is input[type=text][role=searchbox], not type=search (no browser clear button to undo); a separate Clear part, deliberately out of the tab order
  - [ ] focus stays in the field and aria-activedescendant names the highlighted item; Down on the last item and Up on the first return the highlight to the field, with data-highlighted on the field so sighted users see it
  - [ ] Home/End: menu semantics (first/last item) only while the field is empty and an item is highlighted; the caret moves otherwise
  - [ ] submenus: a keyboard enter focuses the submenu field at once; hover shows the submenu but leaves focus until the pointer is inside it
  - [ ] Tab leaves the menu (no focus trap); Enter runs the highlighted item
  - [ ] IME composition must not filter mid-composition
  - [ ] opt-in as a wrapper (Base UI's FilterProvider) so the trigger can announce the dialog before the field mounts and non-filtering menus ship nothing
  - [ ] groups, an empty state ("No actions found") and a count announcement
  - [ ] the bugs the article found in plain menus are ours to check too: a group label announced twice, Shift+Tab out of the trigger dropping focus on the body, a submenu left open on focus return (VoiceOver), an open submenu trigger that does not toggle under TalkBack
- [ ] command palette: dialog + combobox + listbox groups, a scoped hotkey, recent items
- [ ] date picker: dialog/popover + grid with aria-selected and a month spinner; needed by any calendar UI
- [x] each one: a README section + a docs/API.md entry (the site has no per-pattern pages) and a browser test; no new primitive was added

## Sources

- Base UI, "Building a filterable menu that works for everyone": https://base-ui.com/blog/building-a-filterable-menu (read via https://defuddle.md/). The decisions above are theirs; the API shape (a provider wrapper) may differ for us.
- The knob reference (cssints-nxwa): https://jherrm.github.io/knobs/ — spin, vertical and horizontal slide, one gesture locked per drag.

## Notes

- [x] command palette: shipped in PR #92 (`createCommandPalette`: dialog + searchbox + listbox, `packages/headless/src/command-palette.ts`, 9 browser tests, docs and a minor changeset).
- [ ] filterable menu and date picker: left for later PRs on the same research (the palette is the first composition).

## Summary of Changes

All three compositions shipped on the existing primitives; no new primitive was needed.

- **Command palette** (0.20.0, PR #92): `createCommandPalette` — dialog + `input[type=text][role=searchbox]` + listbox, `aria-activedescendant`, groups, empty state, one count announcement, `mod+k` through `createHotkeys`.
- **Filterable menu** (0.25.0, PR #105): `createFilterableMenu` — a dialog with a search field and a menu, not a combobox (no `aria-autocomplete`, no `aria-haspopup` on the field, no `aria-expanded`); `aria-haspopup="dialog"` on the trigger before the field exists; highlight returns to the field at the ends with `data-highlighted`; Home/End are menu semantics only while the query is empty; submenus with their own field, hover shows without stealing focus, Enter enters at once, Escape/Backspace pops a level; Tab closes and leaves; IME holds the query until `compositionend`; group labels `aria-hidden` (the double announcement the article found).
- **Date picker** (0.25.0, PR #106): `createDatePicker` — `createPopover` + `createGrid` month, day numbers as `Date.UTC(y, m, d) / 86_400_000` (no locale arithmetic, `today` injectable), six real weeks painted so every cell can hold the roving focus, `aria-selected`/`aria-current="date"`, `min`/`max` disabling, PageUp/PageDown month, Shift+PageUp/Down year, Enter selects and closes. A segmented text field stays a host composition of `createField` + `createSpinbutton` over the same day numbers.

The four AT bugs the Base UI article found (group label twice, Shift+Tab out of the trigger, a submenu left open on focus return, TalkBack toggle) are manual AT checks; the ones that are DOM behaviour are covered by the browser tests above, the rest belongs in the requirement catalogue.

- [x] filterable menu: shipped in PR #105 (`createFilterableMenu`, `packages/headless/src/filterable-menu.ts`, 12 browser tests, README + docs/API entries, minor changeset). The manual AT checks in the bugs sub-box (VoiceOver/TalkBack/NVDA) are still open: they need real screen readers, not Chromium.
