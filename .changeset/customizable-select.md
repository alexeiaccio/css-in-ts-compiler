---
"cssints": minor
"@cssints/css-grammar": patch
---

The customizable select is writable. `css.picker(styles)` is `::picker(select)` — a functional pseudo-element whose only
argument is the element it belongs to, so the wrapper takes none — and the grammar accepts `appearance: base-select`
(css-ui-4: Chrome 135, Safari 27, Firefox 149), which mdn-data 2.27.1 leaves out of `<compat-auto>`. The value carries
BCD's support warning for the targets that lack it, and `::checkmark` / `::picker-icon` were already wrappers.
