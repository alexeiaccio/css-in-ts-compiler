---
"@cssints/apg-specs": patch
---

`specs/patterns/workspace.qnt`: a copy names its destination, like a drop does. `copyTab` was pinned to `tab1`, which made "duplicate" mean "put the duplicate in the right tabset" for every host; it now takes one nondet `dest` over the drop targets, records it in `copyTo`, and refuses (reason `"none"`, nothing changed) when there is no tab in hand, the tab is out of the window, or the destination is the container the tab is already in. `CopyKeepsSource` still holds for every target, and `CopyNamesItsTarget` says a landed copy recorded where it was asked to go. The copy's duplicate and the existence of a container it alone would create stay the host's (see NOT MODELLED).

The bridge's `copy` step carries the target, and `onCopy`'s payload is the recorded destination in the host's vocabulary (`tabset0`, `tabsetF`, `edge-left`, …) instead of the literal `"tabset1"`. The scenario set gains a copy into an edge target (and a refused copy onto the tab's own container).
