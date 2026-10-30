---
"@cssints/headless": minor
---

`@cssints/headless`: `createKnob`, a virtual knob after GarageBand's (spin around the centre, vertical or horizontal slide, one gesture locked per drag). It is a `role=slider` (no ARIA role exists for a dial) with `aria-valuenow` / `aria-valuetext`, keyboard steps, PageUp/PageDown, Home/End and a wheel, plus `percentOf` for the skin's rotation and a continuous `wrap` mode. There is no APG pattern, so no Quint spec: the contract is documented in the package README and `test/knob.browser.test.tsx` is its oracle.
