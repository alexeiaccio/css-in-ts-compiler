---
"@cssints/headless": patch
---

`createMenu`'s polyfill path owns the block-axis movement and the roving tab stop: `ArrowUp` / `ArrowDown` / `Home` / `End` change the primitive's own focus by the transitions the spec models, and the row carrying `tabindex="0"` follows that state instead of the DOM focus. The provider used to move focus with `focus()` and report it back through `onFocus`, which a page that is not the focused one delivers a task late — late enough to rewind the menu to a row from an earlier step, and the differential walk saw it as a real divergence. The native engine is untouched: there the provider still owns both.
