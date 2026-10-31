---
# cssints-fi6m
title: 'Kit: the starters after the first list'
status: completed
type: task
priority: normal
created_at: 2026-10-31T19:39:05Z
updated_at: 2026-10-31T23:20:00Z
---

The kit's next starters after the first list of ten (bean cssints-1aku): the primitives that exist in `@cssints/headless` and have no styled starter yet.

- [x] knob (`createKnob`) — this round
- [x] timeline (`createTimeline`) — this round
- [x] listbox-rearrangeable (`createRearrangeableListbox`) — round three
- [x] combobox (`createCombobox`)

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

## Reorder (round three)

- Added `apps/ui/src/registry/reorder/`: `Reorder` over `createRearrangeableListbox` — the bean and the round's brief called it `createListboxRearrangeable`, but the package exports the name the other way round. The primitive owns the option set and its two orders, the listbox's `role` / `tabindex` / `aria-multiselectable` / `aria-activedescendant`, each option's `role=option` and `aria-selected`, the focus of the list, ArrowUp / ArrowDown / Home / End, and Alt+Up / Alt+Down (its own reorder keys). The skin owns the frame (surface, border, radius, tokens in light and dark), the drag handle and the pointer drag, the position numbers, the selected / hover / lifted looks, the focus ring, the reduced-motion rules, the polite status line ("Moved Library to position 1 of 6."), `aria-posinset` / `aria-setsize` (the primitive leaves the position implicit), and `onReorder`.
- **One list of the primitive's two.** The full APG pattern is a transfer between two lists; a reorderable list is that pattern's first list on its own. The skin renders `listProps("a")` and ignores the transfer keys (Enter and Delete) because there is no second list to transfer to. A page that wants the full pattern renders `listProps("b")` beside it.
- **The drag is the skin's translation.** The primitive has no pointer gesture, so the handle makes the row the primitive's active option (`optionProps(id).onClick()`), focuses the list, and then each row the pointer passes over steps the dragged row with the primitive's own `move("up" | "down")`. The order, the announcement and `onReorder` therefore come from the primitive's array, not from a second copy of it.
- Added the fixture (six home-screen sections with a description each, the order as the page last heard it) and the Chromium browser test: the listbox's role, name and tab stop; each option's role, `aria-posinset` / `aria-setsize` and `aria-selected`; the initial order line; a drag from the third row's handle onto the first, which reorders, keeps the count at six, calls `onReorder` once and leaves the moved row active; Alt+Arrow reordering in both directions with the announcement and the focus staying in the list; Home / End; and Enter / Delete changing nothing.
- Added the demo to `src/docs/demos.tsx` (32 rem in `docs.css`) and the item to the registry; regenerated `r/reorder.json`, `r/registry.json` and `public/llms.txt`, leaving the other `r/*.json` as committed.
- Finding: `docs/API.md` had no section for the primitive at all (unlike the knob and timeline rounds), so a `createRearrangeableListbox` section was added in the neighbouring style: the signature, the two orders, single and multi selection, the controlled transfer gate, and the fact that the primitive owns the listbox ARIA but neither the position attributes nor the drag.

## Combobox (round four)

- Added `apps/ui/src/registry/combobox/`: `Combobox` over `createCombobox` with `filter: true` (the autocomplete variant). The primitive owns the corpus and the prefix filter, the open state and the selection, the active option and `aria-activedescendant`, `role="combobox"`, `aria-expanded` / `aria-controls` / `aria-autocomplete` / `aria-disabled`, the option ids and their `aria-selected`, Enter / Space / Tab / Escape, the arrows, Home / End, Page Up / Page Down, Backspace, the blur that commits, and the option click. The skin owns the anchor, the field and list surfaces on the tokens, the focus ring and placeholder tone, the popover shadow, the list's 15 rem scroll bound, the highlight painted from `aria-selected`, the empty state ("No matches"), the label, and the field's display of the chosen label.
- **The field's display is the skin's one decision.** The primitive's field text is the filter `query()`, which it clears on commit, so a raw `comboboxProps.value` would blank the field after Enter. The skin shows the query while one is typed and the selected label otherwise (`editing` is set by an input and cleared when the popup closes), and selects the label on focus so the next character replaces it. This is display only: the selection and the query are the primitive's signals.
- The option rows are read in a `createMemo` that snapshots the primitive's id, role, label, `aria-selected` and handlers, so the list rebuilds when the filter, the active option or the selection changes and the JSX holds no copy of the active index.
- Added the fixture (twelve component names, the chosen slug as the host's value, the sentence about typing and the keys) and the Chromium browser test: the field's role, name and closed state; the typing filter and its count with the first match active and painted; the arrows moving `aria-activedescendant` with the ends holding; Enter and Space committing and the field showing the label; Escape closing with the focus in the field and the label restored; the empty state; and `disabled` dropping a click, a key and an input event, with the field put back to the model's text.
- Added the demo to `src/docs/demos.tsx` (24 rem in `docs.css`) and the item to the registry; regenerated `r/combobox.json`, `r/registry.json` and `public/llms.txt`, leaving the other `r/*.json` as committed.
- Finding: `docs/API.md` already has a `createCombobox` section, so no section was added; it matches the primitive as shipped.

Tests: `apps/ui` 438 passed (7 new for the combobox), `bun run build:packages`, `bun run typecheck` (43 workspaces), `bun run build`, `theme:check`, and `vp fmt --check` / `vp lint` on the touched files pass.

## Summary of Changes

All four starters of the bean are in `apps/ui/src/registry/`: `knob` (round one), `timeline` (round two), `reorder` (round three) and now `combobox` (round four), each with its fixture, its Chromium browser test, a docs demo and a registry item. Three of the four needed no new `docs/API.md` section; the reorder round added the one for `createRearrangeableListbox`. The bean is complete.
