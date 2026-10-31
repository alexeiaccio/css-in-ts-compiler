---
"@cssints/headless": minor
---

`createMenu` takes the checked state as a readable pair as well as the packed number: `checked` (the checked checkbox item indices) and `choice` (the chosen radio index, `-1` for none) with `onCheckedValuesChange(checked, choice)`. The readable pair is the store and the packed `value` / `onCheckedValueChange` (unchanged for existing callers and `menu-checkable.qnt`) is its derived view, so a controlled menu can check any checkbox item, not only item 0; `value()` joins `checked()` / `choice()` as the packed accessor.
