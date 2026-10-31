---
# cssints-fi6m
title: 'Kit: the starters after the first list'
status: completed
type: task
priority: normal
created_at: 2026-10-31T19:39:05Z
updated_at: 2026-10-31T19:55:36Z
---

The kit's next starters after the first list of ten (bean cssints-1aku): the primitives that exist in `@cssints/headless` and have no styled starter yet.

- [x] knob (`createKnob`) — this round
- [x] timeline (`createTimeline`) — this round
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

## Timeline (round two)

- Added `apps/ui/src/registry/timeline/`: `Timeline` over `createTimeline({ rows })`. The primitive owns the extent and every bar's `left` / `width` percentages, each row's `aria-level` and `aria-current`, the `data-status` hook, the roving tab stop and its Arrow / Home / End / Enter / Space keys, the selection request, the `--depth` the skin indents with, and the ruler's ticks and their labels. The skin owns the frame (surface, border, radius, tokens in light and dark), the name / track / duration columns, the ruler's lines and labels, the bar's tone per status (`ok` the accent, `error` the invalid colour, `unset` the muted gray), the selected and hover looks, the focus ring, the polite status line that reads the selected span, and the reduced-motion rules. It also moves the real DOM focus to the row the primitive made its tab stop, which the primitive leaves to the host.
- The rows mode has no zoom (only the demo tree does), so the starter has none: a zoom window would be a page's own range over the same rows. The fixture follows the data shape exactly, `{ id, label, start, end, depth?, status? }`, with no invented field.
- Added the fixture (a checkout trace: root, auth and render branches, the database span nested inside auth, on a normalized 0..1 scale with `s` ticks and the root selected) and the Chromium browser test: the list's role and name, the levels, the label's `--depth` indent, the ruler's ticks against the primitive's, one bar per span at the primitive's percentages, the grandchild inside its parent's range, the status tones, the arrows / Home / End moving the focus, Enter / Space selecting and the status line following, the selected look from `aria-current`, a click moving both, and the focus ring Tab draws.
- Added the demo to `src/docs/demos.tsx` (with its 44 rem reading width in `docs.css`) and the item to the registry; regenerated `r/timeline.json`, `r/registry.json` and `public/llms.txt`, leaving the other `r/*.json` as committed.
- Finding: `docs/API.md` already has a `createTimeline` section (unlike the carousel, feed and resizable-panels rounds), so no section was added; it matches the rows mode as shipped.

Tests: `apps/ui` 427 passed (5 new for the timeline), `bun run build:packages`, `bun run typecheck` (43 workspaces), `bun run build`, `theme:check`, and `vp fmt --check` / `vp lint` on the touched files pass.
