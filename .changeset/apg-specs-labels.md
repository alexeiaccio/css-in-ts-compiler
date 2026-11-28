---
"@cssints/apg-specs": minor
---

A third graph-layout spec: edge labels as slots. `specs/patterns/graph-layout-labels.qnt` runs the six graphs through the same
phases as `graph-layout-slots.qnt`, then `place_labels` gives each present edge's label a boundary and a track: the boundary is
the middle of the ones the edge crosses, and the track is the label's order at that boundary — the edge's right-side slot in the
next layer, ties in the pairs' model order. `LabelOnSpan`, `MiddleBoundary`, `DistinctTracks` and `TrackOrder` are the four
invariants. `src/patterns/graph-layout-labels.bridge.ts` projects the state as the pair ids per boundary in track order, and
`scenarios/patterns/graph-layout-labels.spec.json` pins the six graphs' labels. The engine's `labelsDriver` replays the same
eight scenarios under Bun and agrees with the model on all of them. The two earlier specs are untouched and regenerate
byte-identically.
