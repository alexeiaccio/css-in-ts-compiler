---
"@cssints/data": minor
---

`@cssints/data`: `data()`, statistics over runtime values computed by the browser's layout — the largest, the total and the
count of a list's `--value`s, read back with `round(100cqw / 1px)` in a container query and printed by a counter. No
runtime and no state: the values stay the host's, and changing one updates the answer in the same frame. The DOM contract
and its accessibility note (the printed number is not text a screen reader sees) are in the README.
