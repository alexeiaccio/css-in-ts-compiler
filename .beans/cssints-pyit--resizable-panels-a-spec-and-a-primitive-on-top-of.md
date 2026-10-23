---
# cssints-pyit
title: 'Resizable panels: a spec and a primitive on top of the window splitter'
status: completed
type: feature
priority: normal
created_at: 2026-10-23T13:59:32Z
updated_at: 2026-10-23T14:46:14Z
---

`@cssints/apg-specs` has APG Window Splitter only (`specs/apg/windowsplitter.qnt`, `createWindowSplitter` in `@cssints/headless`): one separator between two panes, keyboard only (arrows by orientation with STEP 2, Home/End, Enter collapse/restore, F6 pane cycle), a fixed mode, request vs commit. The spec says it outright: dragging and a min-size above 0 are not modelled. A resizable panel group (react-resizable-panels-like) needs more.

Scope - a new non-APG pattern composed of window splitters, spec first:

- [x] research: react-resizable-panels, Radix/Ark splitter, APG window splitter; what is the state (sizes as % of the group), what a separator move does to its neighbours (take from the nearest pane that can give, cascade or not), collapse, persistence
- [x] spec `specs/patterns/resizable-panels.qnt` (not under apg/: it is not an APG pattern): N panes, N-1 separators, per-pane min/max, collapsible pane with collapsedSize, sizes always sum to 100, keyboard per separator as in windowsplitter, request vs commit on the whole layout
- [x] pointer drag in the spec: down on a separator, move by a delta, up; clamped by min/max; a drag never changes panes outside the separator's reach unless the cascade rule says so
- [x] add dragging and min-size to `windowsplitter.qnt` too, or say why the group spec covers it - **said why**: windowsplitter.qnt stays the APG keyboard oracle (the APG pattern text has no drag and no min-size; dragging is library policy, and its ported APG scenarios are a frozen contract). The group spec covers both: pane bounds MIN/MAX on every move, and the two-pane case is its `separator:0` pair, where a drag is clamped by both neighbours.
- [x] bridge + scenarios, spec-only tests (invariants: sum = 100, every pane within its bounds, collapsed => size = collapsedSize)
- [x] `createResizablePanels` in `@cssints/headless`: separator props (role=separator, aria-valuenow/min/max per separator, aria-controls), pane props, pointer handlers (pointer capture), controlled `sizes` + `onSizesChange`, optional storage key
- [x] browser conformance walks against the spec, including drag
- [x] docs: README section, one example

## What landed

- `packages/apg-specs/specs/patterns/resizable-panels.qnt` + generated `src/patterns/*`: the three-pane instance of the group (10% grid, sizes sum 100, MIN 10 / MAX 80, pane 0 collapsible at 0, 10% steps, NOTCH 10), 24 actions, 12 invariants (sum, bounds, prev, restore, focus, orientation, request/commit, drag-only-neighbours, drag delta bounded). Drag is snapshot + delta with the delta bounded to +/-100 (no collections, no parameterised actions: `dragNext`/`dragPrev`). Keyboard is inert while a drag runs; a host write cancels the drag; the newest pointerdown takes the drag over. Collapse hands the space to the nearest pane and cascades outward (pane 1 up to MAX, then pane 2), restore takes it back in the same order.
- `src/patterns/resizable-panels.bridge.ts`: config (`orientation`, `controlled`/`accepts`, `layout` for a controlled host write, `collapsible`, `panes`, `min`, `max`), events (`focus`/`blur`/`key`/`prop`, the `dragStart`/`dragBy`/`dragEnd`/`dragCancel` vocabulary, `hostLayout`), `value` = the [pane0, pane1, pane2] percentages, probe and walk alphabet.
- `scenarios/patterns/resizable-panels.spec.json`: 11 scenarios (initial layout, arrows and their clamp, Home/End, collapse/restore, a drag's snapshot and clamp, a drag moving only its pair, an immovable separator next to a collapsed pane, controlled hold/accept/write), replayed against the spec driver in `test/patterns/resizable-panels.test.ts` and against the DOM in the browser test. `scenarios/patterns/README.md` says what "source: spec" means.
- `packages/headless/src/resizable-panels.ts`: N panes, any bounds (`min`/`max` percent, `collapsible`/`collapsedSize`, `defaultSize`), `step`, `orientation`, `groupProps`/`paneProps`/`separatorProps`, real pointer drag (client position -> percent of the group's measured length, pointer capture, axis captured at pointerdown), controlled `sizes` + `onSizesChange` (a host echo is not treated as a write), `storageKey` (localStorage, best effort), the remembered expanded size derived from the committed layout. `createControllable` gained a `same` comparator for array values.
- `test/resizable-panels.{fixture,driver,browser.test}.tsx`: the DOM replay of the 11 scenarios, differential walks for uncontrolled / horizontal / controlled accepting / controlled holding, drag and persistence checks. The group is 600 px wide so a 10% step is 60 px whole.
- Docs: `packages/headless/README.md` "Resizable panels" (contract, a usage example, what is left to the host), the apg-specs README layout, `scenarios/patterns/README.md`, the AGENTS.md lines.

Left out on purpose: react-resizable-panels' collapse-on-drag threshold (a pane collapses on Enter or a host write, never by dragging through MIN), F6 (a Tab is enough for three panes), pane bounds in px, nested groups, and restoring a pane that was mounted already collapsed (it returns to its own `min`; there is no history to remember). Not ported to `native/headless`: the spec and bridge are there for it, the C widgets follow separately.
