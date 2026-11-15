---
# cssints-su2g
title: 'pointer-timeline: runtime polyfill (class B)'
status: completed
type: task
created_at: 2026-10-17T10:21:20Z
updated_at: 2026-11-15T00:00:00Z
---

Research: docs/research/unshipped-specs.md (2026-10-17, cssints-sh52). Ranked 7, class B. No BCD key; needs a script like @cssints/balance and the own-BCD-key table from cssints-6ctt.

- [x] park until gradient-2d proves the runtime delivery of an own-key polyfill; then decide — lifted: `mesh-gradient()` has no BCD key either and gradient-2d ships a runtime for it

## Checked against the engine (2026-10-17)

No overlap: nothing in the engine, the members or docs/API.md names \`pointer-timeline\`. It is in @webref/css 8.7.5 (pointer-animations-1) and Chrome 155 rejects it in CSS.supports; BCD has no key, so it needs the own-key table of cssints-6ctt first. Stays parked.

## Done (2026-11-15)

Shipped as `pointer().axis("x" | "y")` in `@cssints/reveal` (wayfinder, same date). The own-key table turned out not to be
needed: the member emits no unsupported CSS, so the runtime entry declares `polyfills: []` — "every target gets the script" —
and the feature needs no BCD key to warn on. The native `pointer-timeline` is not written at all (no engine has it, and the
grammar has no key): the kernel is `transform-origin` plus a marker class, and `runtime.ts` writes the element's own `scale`
from the pointer's position.

The one bug worth recording: the scrub shrinks the element, so the pointer leaves the painted box almost immediately and the
first version moved once and stopped. The runtime measures the *layout* box (`offsetWidth`/`offsetHeight`) from the fixed edge
the origin sits on and keeps the last scrubbed element while the pointer is inside it.

Checks: `test/reveal.mjs` (sheet, axis, conflict, and the script delivered for every target), `test/browsers.mjs` in real
Chrome (the fractions across and down, past the painted edge, at the layout edge, and held on leave), typecheck, fmt, lint.
Left: the native form when an engine ships it (a kernel change and an `AHEAD_OF_CHROME` entry), a headless pointer value, and
touch gestures.
