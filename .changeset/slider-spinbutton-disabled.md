---
"@cssints/headless": minor
"@cssints/apg-specs": minor
---

`createSlider` and `createSpinbutton` take `disabled`: a disabled slider announces `aria-disabled` on its thumb, keeps
the thumb as its tab stop and drops every key and rail press; a disabled spinbutton's field announces `aria-disabled`
and carries the native `disabled`, takes no typing or spin key, and offers neither stepper. The APG specs record it as a
deliberate extension of the patterns (no model var), so the browser tests are its oracle.
