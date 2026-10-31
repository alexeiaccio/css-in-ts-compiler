---
"@cssints/headless": minor
---

`createFilterableMenu`: the filterable menu as a composition of `createDialogModal`, `createTextInput` and `createStatus` — a dialog whose trigger says `aria-haspopup="dialog"`, a `searchbox` field with no combobox affordances, and a filtered `role=menu` with groups, an empty state, one polite count, submenu levels, the arrow loop back to the field, the Home/End rule, the IME guard, and Tab/Escape leaving in Base UI's order. The host renders the groups, the submenu geometry and mounts the dialog only while open.
