---
# cssints-vkrl
title: 'Workspace: tabsets inside splits, a drag with reasons'
status: completed
type: feature
priority: normal
created_at: 2026-11-19T16:51:49Z
updated_at: 2026-11-19T16:51:53Z
---

The spec (slice 1) is done in PR #222; the primitive, the registry item and the console are the open slices.

## What and why

`react-resizable-panels` 4.18→4.24 grew a `Workspace`: tabs live in **tabsets**, tabsets live in **splits**, and a drag moves a tab between them — with a **reason** on every model change, a **drop target as data**, and `onBeforeModelChange` to veto a change the user made. Same idea as our canvas, one layer up: the model owns the arrangement, the host owns the pixels.

## Slice 1 — the spec and its oracle (PR #222)

`packages/apg-specs/specs/patterns/workspace.qnt` (896 lines) + `src/patterns/workspace.bridge.ts` + `test/patterns/workspace.test.ts` (27 tests, 12,738 states explored).

Fixed instance: four tabs, two docked tabsets in a row, one floating tabset, one edge tabset an edge drop creates, and two exits (`out` = detached and serialisable, `closed` = gone). Six homes per tab, so "in two at once" is unrepresentable.

**The model takes the target, it does not compute it from pixels** — `target` is a var (`tab0 | tab1 | tabF | edge-* | float | out | closed`) and the geometry → target mapping is host code, the same precedent as `patterns/resizable-panels.qnt`.

Research trail (in the header): flexlayout-react 0.10 (`enableDeleteWhenEmpty`), dockview (`floatingGroups`, `activeGroup`), VS Code editor groups (`closeEmptyGroups`), react-resizable-panels 4.22 (tear-off deprecated — browsers report no release position outside the window, so a tab leaves as a value and the transport is the host's), and HTML dnd (no target model in `dragover`).

**Veto without a `controlled` pair**: `reason = "none"` *is* the refusal — a drop the model will not apply changes nothing and leaves the tab in hand, so there is no layout prop to write back (dropzone's precedent; the layout is the primitive's, the host persists it).

Invariants (15, mutation-tested): `EachTabHasOneHome`, `NoEmptyContainer`, `ActiveIsAMember`, `ActiveIsAlwaysSet`, `HomeContainerExists`, `EdgeSideKnown`, `CopyKeepsSource`, `RefusalKeepsTheTabs`, plus `MoveTouchesOneTab`, `CloseTouchesOneTab`, `TransferTouchesOneTab`, `CollapseMovesNoTab`, `FloatShowsTheTabset`, `DockEndsTheFloat`.

The per-tab payload is a sink key: `IGNORED_CONFIG_KEYS` gained `tabs` — one entry, no bridge-by-bridge edit, which is exactly what the ignored-keys list was built for.

## Next slices

2. `packages/headless/src/workspace.ts`: tablist/tab/tabpanel semantics per tabset (compose `tabs.ts`), roving focus, and a keyboard move that is not a drag (a drag-only feature is not shippable here), `detach`/`attach`.
3. Registry item `@cssints/workspace`: a console-like starter with the drop indicator and the floating set.
4. Console dogfooding (effects-of-atmosphere `apps/dev-console`): run logs as a tab beside the board.
