---
# cssints-yntz
title: 'Compositions: the filterable menu, the command palette, the date picker'
status: todo
type: task
created_at: 2026-10-30T10:51:11Z
updated_at: 2026-10-30T10:51:11Z
parent: cssints-65eb
---

Patterns that are a composition, not a primitive. Base UI's "building a filterable menu", Ariakit and React Aria have working examples to measure against.

- [ ] filterable menu: menu + an input inside, aria-activedescendant, empty state, type-ahead vs filtering, Escape clears then closes
- [ ] command palette: dialog + combobox + listbox groups, a scoped hotkey, recent items
- [ ] date picker: dialog/popover + grid with aria-selected and a month spinner; needed by any calendar UI
- [ ] each one: a docs page with the composition and a browser test, no new primitive unless the composition proves otherwise
