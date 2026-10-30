---
# cssints-nxwa
title: Knob / dial for round interfaces
status: todo
type: feature
created_at: 2026-10-30T10:51:11Z
updated_at: 2026-10-30T10:51:11Z
parent: cssints-65eb
---

Reference: jherrm.github.io/knobs (GarageBand's virtual knob). Needed for round interfaces, not for the current ataas surfaces.

- [ ] one primitive: value, min/max, step, wrap (continuous) or clamped, keyboard (arrows, PageUp/Down, Home/End, a text entry mode)
- [ ] pointer: spin (angle around the centre, precision falls with distance), vertical slide (sliders mode), horizontal slide; one gesture locked per drag from the pointerdown side
- [ ] wheel/trackpad support
- [ ] ARIA: role=slider semantics, aria-valuenow/min/max/text, a live value, and an accessible alternative (a number field) since a dial is never the only way
- [ ] a Quint spec for the gesture state machine (idle -> spin|vslide|hslide -> commit) and scenario walks, like slider
