---
"@cssints/headless": patch
---

A controlled prop is answered in the same flush. `createRadioGroup` and `createMenu` snapshot the host's `value` / `open`
in a memo instead of a signal written by an effect: the effect's write was derived state one flush late (Solid's
`EFFECT_RELAY_TEAR`), so anything derived from the checked value or the open state — a skin's class, a projection — could
paint a frame behind the prop that moved.
