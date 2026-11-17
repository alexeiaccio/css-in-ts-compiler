---
"@cssints/headless": minor
---

`feedback` on the primitives with physical semantics — `knob`, `slider`, `slider-multithumb`, `spinbutton`, `switch`,
`checkbox` and `checkbox-group` — a callback pair taking **named intents** (`"detent"`, `"latch"`, `"release"`,
`"limit"`), never milliseconds: `knob`/`slider`/`slider-multithumb`/`spinbutton` report a step as `detent` and a bound as
`limit`, `switch`/`checkbox` report `latch` on and `release` off. Output only, so nothing about the widget changes with it
attached: a programmatic change, the host writing `value` and a `focus` are silent, one held key or a pointer held against
the end ticks once instead of once per frame, and the platform stays out of the primitive (`navigator.vibrate` is absent
on iOS Safari) — the host decides what an intent becomes. The kit's wrappers pass it through. The four intents and the
emission rules are in the README's "Feedback" section.
