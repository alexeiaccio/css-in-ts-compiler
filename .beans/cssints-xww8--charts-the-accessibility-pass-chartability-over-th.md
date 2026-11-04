---
# cssints-xww8
title: 'charts: the accessibility pass (Chartability, over the five)'
status: todo
type: feature
priority: high
created_at: 2026-11-04T06:00:24Z
updated_at: 2026-11-04T06:00:24Z
parent: cssints-6pih
---

Frank Elavsky's Accessibility in Data Visualization (Open Visualization Academy, updated September 2025) is the framework this epic should be held to, and Chartability is its testable form. Every chart we ship is checked against it — perceivable, operable, understandable, robust — before the epic closes.

What the course asks of a chart, as checks we can run:
- The data is available without the picture: a table or a list with the numbers, and the picture is decoration over it.
- Nothing is hover-only. A keyboard user reaches the same values a pointer user does; if the reveal is a tab stop, the count is small enough to live with (a roving single stop if not).
- The chart has a name and a purpose in words (a figure and its caption, an aria-label, or a heading), and its extremes and trend can be read without decoding colours.
- Colour is never the only channel; contrast of text, marks and backgrounds holds in light and dark; the tint picker and the theme must not break it.
- Motion (a pulse, an enter animation) honours prefers-reduced-motion.
- Zoom, text size and 200%/320px reflow do not clip data; text does not truncate a value.
- Screen readers get the numbers, not "graphic": table, ol, data; no role=img around content that reads better as rows.

Known gaps in what exists now (sparkline, cssints-1wx2): the value is revealed on hover only, and there is no summary of the series in words — a keyboard user sees the line but cannot read a sample.

Done when: each of the five charts passes the checklist, the checks live in one place a new chart can copy (apps/ui/README.md or docs/API.md), and the sparkline's hover-only gap is closed with a test.
