---
"@cssints/headless": minor
---

`workspace`: tabs in tabsets, tabsets in a row with a floating and an edge group. The tabset half is APG Tabs (one tab list per tabset, roving focus, arrows inside a list, automatic activation); the workspace adds the delta `specs/patterns/workspace.qnt` models — a tab lives in exactly one home, a drop names its target as data (`tabset0` | `tabset1` | `tabsetF` | `float` | `edge-*`), an emptied tabset disappears unless `keepWhenEmpty`, a move is destructive, a copy keeps its source and asks the host for the duplicate, and a refused drop changes nothing and keeps the tab in hand (`reason = "none"`).

A tab leaves the window as a serialisable value (`detach` → `{ id, data }`) and comes back (`attach`); the transport is the host's. Tear-off is deliberately absent — the platform reports no release position for a drag that ends outside the window — so "open in a window" is a button, not a gesture.

The keyboard move is not a drag: `Ctrl+Alt+ArrowLeft/Right` moves the focused tab along the row, `Ctrl+Alt+ArrowUp` floats it, `Ctrl+Alt+ArrowDown` docks the floating tabset, `Delete` closes a focused tab (VS Code's Move Editor to Next/Previous Group; `Ctrl+Cmd` on macOS). Plain arrows stay the tab list's.

`canDrop(change)` is the host's veto, the `onBeforeModelChange` seam: a change it refuses lands nowhere, keeps the tab in hand and says so in the live region. Every landed change is announced in words ("Logs moved to the right tabset", "Runs closed", "Files detached").

Verified by a differential walk over `workspaceSteps` against the generated model through the bridge, and by the ported scenarios in `scenarios/patterns/workspace.spec.json` on the real DOM.

`tabs`: the focusgroup item collection now drops elements that are no longer connected, so a host that removes an item from the start of its list leaves no detached entry for the provider to focus.
