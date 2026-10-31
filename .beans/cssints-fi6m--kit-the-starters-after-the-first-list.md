---
# cssints-fi6m
title: 'Kit: the starters after the first list'
status: completed
type: task
priority: normal
created_at: 2026-10-31T19:39:05Z
updated_at: 2026-10-31T19:44:44Z
---

The kit's next starters after the first list of ten (bean cssints-1aku): the primitives that exist in `@cssints/headless` and have no styled starter yet.

- [x] knob (`createKnob`) — this round
- [ ] timeline (`createTimeline`)
- [ ] listbox-rearrangeable (`createListboxRearrangeable`)
- [ ] combobox (`createCombobox`)

## Knob (round one)

- Added `apps/ui/src/registry/knob/`: `Knob` over `createKnob`. The primitive owns the value, the bounds and the step, the spin and the two slides, the wheel, the arrows, Page Up / Page Down, Home / End and every `aria-*` (`role=slider`, `aria-valuenow` / `-valuemin` / `-valuemax` / `-valuetext`, the polite live region); the skin owns the label above, the size, the three-quarter SVG arc with its track tone and its value tone, the pointer at the value, the readout, the focus ring, the tokens in light and dark, and the reduced-motion rule: the arc eases after a key, a wheel or a host write and snaps while a drag is on.
- The value is read, never held: `percentOf` and the announced `aria-valuenow` / `aria-valuetext` paint the arc, the pointer and the readout, so the three cannot disagree. `format` on the primitive is the one formatter, and the readout is its `aria-valuetext`.
- Added the fixture (a Volume 0–100 with `%`, and a Pan −50..50 in steps of 5 whose centre reads "Centre") and the Chromium browser test: the dial's role, name, range, value and live region; the arc and pointer painted from the value; the arrows, Page Up / Page Down, Home / End and the clamps; a drag that moves by its distance, snaps its arc, stops on pointerup and clamps at the end; the pan's own step and word; and the focus ring Tab draws.
- Added the demo to `src/docs/demos.tsx` and the item to the registry; regenerated `r/knob.json`, `r/registry.json` and `public/llms.txt`, leaving the other `r/*.json` as committed.
- Finding: `docs/API.md` already has a `createKnob` section (unlike the carousel, feed and resizable-panels rounds), so no section was added; it matches the primitive as shipped.
- No disabled look: the primitive deliberately has no `disabled` (its doc comment says so), so the skin cannot invent one. No detent either: the pan's step of 5 is the host's, and the primitive is documented as having no snap.

Tests: `apps/ui` 422 passed (6 new for the knob), `bun run build:packages`, `bun run typecheck` (43 workspaces), `bun run build`, `theme:check`, `node packages/cssints/test/docs.mjs` and `vp fmt --check` / `vp lint` on the touched files pass.
