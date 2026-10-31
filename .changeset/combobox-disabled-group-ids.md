---
"@cssints/headless": minor
"@cssints/apg-specs": minor
---

`createCombobox` takes `disabled`: the combobox and its trigger announce `aria-disabled`, the combobox keeps its tab
stop, and a key, a click, a typeahead character, a filter input and an option click change nothing, so no popup opens;
`setOpen` / `setValue` stay host requests. The spec records it as a deliberate extension (no model var), so
`combobox.browser.test.tsx` is its oracle. `createCheckboxGroup`'s children take `<base>-0`..`-2` instead of `"0"`,
`"1"`, `"2"`, so two groups on one page no longer share ids.
