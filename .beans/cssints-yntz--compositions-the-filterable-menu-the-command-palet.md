---
# cssints-yntz
title: 'Compositions: the filterable menu, the command palette, the date picker'
status: todo
type: task
priority: normal
created_at: 2026-10-30T10:51:11Z
updated_at: 2026-10-30T10:56:07Z
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
- [ ] each one: a docs page with the composition and a browser test, no new primitive unless the composition proves otherwise

## Sources

- Base UI, "Building a filterable menu that works for everyone": https://base-ui.com/blog/building-a-filterable-menu (read via https://defuddle.md/). The decisions above are theirs; the API shape (a provider wrapper) may differ for us.
- The knob reference (cssints-nxwa): https://jherrm.github.io/knobs/ — spin, vertical and horizontal slide, one gesture locked per drag.
