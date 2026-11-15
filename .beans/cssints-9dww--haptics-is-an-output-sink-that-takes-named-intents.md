---
# cssints-9dww
title: Haptics is an output sink that takes named intents, not a primitive
status: todo
type: task
created_at: 2026-11-15T07:32:52Z
updated_at: 2026-11-15T07:32:52Z
---

The question was whether haptics is a headless primitive or something separate. It is **separate**, for three reasons that are about our shape, not taste:

1. **It is output, not state.** Nothing about a detent being felt changes what the widget is. Our specs model behaviour (`pointer.qnt`, `view-transition.qnt`); a vibration has no forbidden state. Putting it in a primitive would be state we do not model.
2. **It breaks the package's one rule.** `@cssints/headless` takes options in and returns props out, with no ambient state. A `<Haptics>` provider/context is exactly ambient state — the React-shaped answer that every primitive here was written to avoid. `prefs` is the `Partial<Prefs>` injection away from that, and haptics belongs in that same conversation.
3. **The platform is thin.** `navigator.vibrate` is missing entirely on iOS Safari and inert where a tab is not visible; only some Android and desktop Chrome expose it. A primitive that promises a haptic would lie on half the targets.

**Shape**: a callback on the options of the handful of primitives with physical semantics — knob, slider, slider-multithumb, spinbutton, switch, checkbox, mode-dial-like parts — typed as **named intents**, never milliseconds:\n\n`feedback?: { haptic?: (intent: HapticIntent) => void; sound?: (intent: SoundIntent) => void }`\n\nwith `HapticIntent = 'detent' | 'latch' | 'release' | 'limit'` (a string union is the whole contract; no platform type leaks into `headless`). The host decides what 'detent' is — `navigator.vibrate(8)`, a click sample, nothing at all — and `prefs` keeps the user's off switch next to the existing `motion`/`announce`. Tests assert the intent list, which is deterministic; the pattern and the sound are the skin's or the app's.

**Separately, if it earns its keep**: `@cssints/feedback` — the module that maps intents to `navigator.vibrate` patterns and to WebAudio clicks, with the capability check in one place. Do not build it until a second host asks: a dev console that beeps at every toggle is the failure mode.
