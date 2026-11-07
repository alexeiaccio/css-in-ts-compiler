---
# cssints-jrut
title: 'vitals: INP with its element and the frames that covered it'
status: todo
type: feature
priority: normal
created_at: 2026-11-07T11:08:55Z
updated_at: 2026-11-07T11:08:55Z
parent: cssints-7rmb
---

`INP 96 ms` names the number, not the culprit. `PerformanceEventTiming` has `interactionId`, `target`, `processingStart`, `processingEnd`, so the report can name the element and find the long animation frames that overlapped the interaction.

Build:
- Keep the slowest few interactions (the INP candidate is the ~98th percentile of the session, not the max; keep both and say which).
- For each: the element (`entry.target`, described as `tag.class`/`role`/text slice), the input delay (`processingStart - startTime`), the processing time, the presentation delay (`startTime + duration - processingEnd`), and the LoAF entries whose span covers it (count + style/layout sum).
- Print: `INP     96 ms on button.primary · input 8 · work 40 · paint 48 · 2 long frames`.
- The element is the host's markup, so a class list is enough; do not resolve cssints classes here (that is the devtools table's job, ticket 5).

Check: the Chromium test clicks a button whose handler blocks for 60 ms and asserts the element, the three phases and at least one covering frame.

Note: event entries only report with `durationThreshold: 16`; keep that in the observer options or the small interactions vanish from the distribution.
