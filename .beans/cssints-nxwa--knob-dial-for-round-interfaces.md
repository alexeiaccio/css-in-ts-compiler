---
# cssints-nxwa
title: Knob / dial for round interfaces
status: completed
type: feature
priority: normal
created_at: 2026-10-30T10:51:11Z
updated_at: 2026-10-30T18:33:36Z
parent: cssints-65eb
---

Reference: jherrm.github.io/knobs (GarageBand's virtual knob). Needed for round interfaces, not for the current ataas surfaces.

- [x] one primitive: value, min/max, step, wrap (continuous) or clamped, keyboard (arrows, PageUp/Down, Home/End; no text entry: a createSpinbutton sits next to it)
- [x] pointer: spin (angle around the centre, precision falls with distance), vertical slide, horizontal slide; one gesture locked per drag from the first movement
- [x] wheel/trackpad support
- [x] ARIA: role=slider semantics, aria-valuenow/min/max/text, a live value, and an accessible alternative (a number field) since a dial is never the only way
- [x] no Quint spec: a dial is not an APG pattern, so as with panzoom and dropzone test/knob.browser.test.tsx (real Chromium) is the oracle; a patterns/knob.qnt gesture machine can come with the first host that needs one

## Summary of Changes

- packages/headless/src/knob.ts: createKnob (value, min/max/step, defaultValue, controlled value, wrap, gesture, labels, format, id, onValueChange) returning value, setValue, percentOf, stepBy, knobProps (role=slider, aria value set, key/pointer/wheel handlers) and valueProps (role=status, aria-live=polite).
- Gestures: one mode locked on the first movement past 6 px (straight axis = slide, anything else = spin); the grabbed side sets the turn direction; spin is finer farther from the centre; wheel steps once per event; wrap is continuous.
- test/knob.browser.test.tsx: 11 tests in real Chromium (semantics, label/format, keyboard and clamps, custom range, controlled hold, spin direction, vertical lock, horizontal sides, wheel, wrap, percentOf).
- Exported from src/index.ts; README section Knob; docs/API.md entry; .changeset/knob.md (minor).
- No APG pattern or ARIA dial role exists, so role=slider plus a live value, and the README states a numeric field must sit next to the dial.
