---
"@cssints/graph-layout": patch
---

Self loops are laid out and drawn. A loop is not a way to another layer: `assignLayers` no longer counts it as an edge into its
own node (before, a graph with a loop on a source put that node on layer 1 and left layer 0 empty), and the slots and crossings
never see it. `layout` of a graph with loops now equals the layout of the same graph without them, and `route` draws each loop
as a bracket on its node's right border.
