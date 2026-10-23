---
# cssints-pyit
title: 'Resizable panels: a spec and a primitive on top of the window splitter'
status: todo
type: feature
priority: normal
created_at: 2026-10-23T13:59:32Z
updated_at: 2026-10-23T13:59:32Z
---

`@cssints/apg-specs` has APG Window Splitter only (`specs/apg/windowsplitter.qnt`, `createWindowSplitter` in `@cssints/headless`): one separator between two panes, keyboard only (arrows by orientation with STEP 2, Home/End, Enter collapse/restore, F6 pane cycle), a fixed mode, request vs commit. The spec says it outright: dragging and a min-size above 0 are not modelled. A resizable panel group (react-resizable-panels-like) needs more.

Scope - a new non-APG pattern composed of window splitters, spec first:

- [ ] research: react-resizable-panels, Radix/Ark splitter, APG window splitter; what is the state (sizes as % of the group), what a separator move does to its neighbours (take from the nearest pane that can give, cascade or not), collapse, persistence
- [ ] spec `specs/patterns/resizable-panels.qnt` (or under apg/ with a note that it is not an APG pattern): N panes, N-1 separators, per-pane min/max, collapsible pane with collapsedSize, sizes always sum to 100, keyboard per separator as in windowsplitter, request vs commit on the whole layout
- [ ] pointer drag in the spec: down on a separator, move by a delta, up; clamped by min/max; a drag never changes panes outside the separator's reach unless the cascade rule says so
- [ ] add dragging and min-size to `windowsplitter.qnt` too, or say why the group spec covers it
- [ ] bridge + scenarios, spec-only tests (invariants: sum = 100, every pane within its bounds, collapsed => size = collapsedSize)
- [ ] `createResizablePanels` in `@cssints/headless`: separator props (role=separator, aria-valuenow/min/max per separator, aria-controls), pane props, pointer handlers (pointer capture), controlled `sizes` + `onSizesChange`, optional storage key
- [ ] browser conformance walks against the spec, including drag
- [ ] docs: README section, one example
