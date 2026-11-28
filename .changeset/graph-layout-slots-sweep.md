---
"@cssints/graph-layout": minor
---

Slots, long edges as dummies, and crossing minimization. `orderSlots` (the renamed `orderNodes`) makes phase 3 the spec's:
per layer, its nodes in model order and a dummy for each long edge crossing it, named `a>d@1`; `layout` now returns `slots`
beside `layers` and `ranks`, and parallel edges are one line. `minimizeCrossings` runs barycentre sweeps and a greedy switch
over those slots and returns the result only if it has fewer crossings, so composing it never costs one; `crossings` counts
crossing pairs per layer boundary.

Over 1000 random graphs of up to 80 nodes the model order crosses 85 388 times and the sweep leaves 23 681 (72% fewer, 585
graphs improved); a layout costs 7.6 µs and the sweep 329 µs on average, 6 ms at p99. The engine also replays the slots spec's
scenarios and walks its generated model in Chromium, which is where the dummies are compared against elk-rs' own drawing.
