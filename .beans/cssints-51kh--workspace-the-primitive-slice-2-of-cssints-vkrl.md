---
# cssints-51kh
title: 'workspace: the primitive (slice 2 of cssints-vkrl)'
status: completed
type: task
priority: normal
created_at: 2026-11-19T17:13:07Z
updated_at: 2026-11-19T18:19:06Z
parent: cssints-vkrl
---

packages/headless/src/workspace.ts: tabsets inside one window, composed on tabs.ts, with a keyboard move that is not a drag, detach/attach and a live region. Verified by a differential walk over workspaceSteps against patterns/workspace.qnt, plus browser tests for the parts the model does not hold. Changeset: @cssints/headless minor.

## Todo
- [x] read the bridge, the spec and the canvas/resizable-panels walk
- [x] packages/headless/src/workspace.ts + index export
- [x] test/workspace.fixture.tsx, workspace.driver.ts, workspace.browser.test.tsx
- [x] changeset
- [x] checks: headless, apg-specs, typecheck, lint, fmt


## Summary of Changes

`packages/headless/src/workspace.ts` (new, exported from `index.ts`): `createWorkspace` — tabs in four tabsets (two docked, one floating, one edge), each a `createTabs` list with the local index being the tab's index in the host list (so a tab keeps its key, element and id when it changes tabset). Model ops: `pick`, `drop(target)`, `cancel`, `close`, `copy`, `detach`, `attach`, `dock`, `collapse`, `keyDown`; accessors `home`, `tabsIn`, `active`, `tabsetOpen`, `side`, `collapsed`, `picked`, `reason`, `announcement`, `hovered`, `focusRequested`; prop bags with `data-part` for the group, each tabset, each tab list, each tab, the panel, the floating box, the indicator and the live region. `canDrop` is the veto: a refused change lands nowhere, says `reason = "none"` and keeps the tab in hand.

Keyboard: `Ctrl+Alt+ArrowLeft/Right` moves along the row, `Up` floats, `Down` docks, `Delete` closes (`Ctrl+Cmd` accepted); plain arrows stay the platform focusgroup's. Every landed change is announced in words.

`packages/headless/src/tabs.ts`: the focusgroup item collection drops disconnected elements — a host that removes an item from the start of its list left a detached entry the provider could focus.

Tests: a DOM driver + fixture replaying `workspaceSteps` through the bridge (differential walk, `value` included), the 11 ported scenarios on real DOM and on the model, plus browser tests for the chord, the plain arrows, `Delete`, the live region, the `canDrop` refusal, `detach`/`attach`, `data-part` on every bag, and the empty tabset leaving no tab stop. 33 tests; headless 1492 passed, apg-specs 1057 passed.

Found in slice 1, reported not fixed: the spec's `copyTab` pins the copy's destination to tab1, so the primitive's `copy` asks the host to duplicate into the right tabset and `onCopy`'s payload is always `"tabset1"`; and `attach`/`close`/`detach` name the tab in hand in the model, while the primitive takes an id (a superset the walk does not exercise).


## Follow-up: the oracle's copy target (PR #225, review)

Slice 1 pinned a copy's destination to `tab1` (`target' = "tab1"`), and the primitive followed it literally, so `copy` always duplicated into the right tabset. Fixed in the oracle, not in the primitive:

- `specs/patterns/workspace.qnt`: `copyTab` takes a nondet `dest` over the drop targets, records it in a new `copyTo` var, and refuses (reason `"none"`, nothing changes) with no tab in hand, a tab that is out of the window, or the tab's own container. `CopyKeepsSource` still holds for every target; `CopyNamesItsTarget` is new. The header's research trail now says why a copy names its destination (VS Code's Copy Editor into Group N; flexlayout/dockview add a tab to a named group). Regenerated the model and scaffolding.
- `workspace.bridge.ts`: the `copy` step carries the target; `onCopy`'s payload is the recorded destination in the host's vocabulary (`tabset0`, `tabsetF`, `edge-left`), not the literal `"tabset1"`. The alphabet gains three copy steps (right tabset, floating, edge) so a pinned payload fails the walk — mutation-checked: pinning it back to `"tabset1"` fails both walks at `events.onCopy` `[[1,"edge-left"]]` vs `[[1,"tabset1"]]`.
- `createWorkspace`'s `copy(id, target)` takes a drop target; a refused target returns `false` and leaves `reason = "none"`. The announcement names the destination (`Logs duplicated to the floating tabset`, `Runs duplicated to the left edge tabset`).
- Scenarios: `copy-keeps-the-source` copies into the float, and a new `copy-into-an-edge-target` lands an edge copy and refuses the tab's own container. Browser test: a copy into the float and into an edge, plus the payload it fires; and `Delete` under a `canDrop` that refuses `"close"` announces "Files cannot be closed" (handled key, tab intact) instead of doing nothing silently.
