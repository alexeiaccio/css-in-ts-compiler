---
"@cssints/headless": minor
---

`createDiagramFocus` makes edges from the keyboard: `c` starts a link from the active node, the arrows pick the node it
should join, Enter fires `onConnect(from, to)` and Escape forgets it, with `canConnect(from, to)` refusing a pair and the
live region announcing the link. `startConnect(id)`, `connectTo(id)` and `connectFrom()` are the same pending state for a
host's pointer drag, so both halves draw one line and say one sentence.
