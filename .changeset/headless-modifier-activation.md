---
"@cssints/headless": minor
---

`createModifiers`' `itemProps` no longer carries `aria-haspopup="menu"`. What activating a unit opens is the host's: a menu
says `aria-haspopup="menu"`, and a panel of its own — the kit's starter, with the span as checkboxes and the input column as
radios — is a disclosure, which says `aria-expanded` and `aria-controls`. A disclosure that claims to be a menu is a
promise it cannot keep, and the primitive cannot know which one the host builds.
