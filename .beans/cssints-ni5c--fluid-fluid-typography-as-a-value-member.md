---
# cssints-ni5c
title: 'fluid(): fluid typography as a value member'
status: in-progress
type: feature
priority: high
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T09:03:02Z
parent: cssints-dk1q
---

## What
A value member `fluid(min, max, { from?, to? })` that computes `clamp(min, <slope>vw + <intercept>, max)` at build time, between two viewport (or container) widths. Returns a Typed OM length so it goes only where a length goes.

## Sources
- https://matthiasott.com/notes/compressed-fluid-typography
- https://master.dev/blog/fluid-typography-with-progress/
- https://github.com/barvian/fluid-tailwind (has the WCAG 1.4.4 zoom check: fails when the value cannot reach 200% at 5x zoom)
- https://github.com/Typetura/Typetura (container-based fluid type)

## Shape
- `{ args: ["<length>", "<length>", { "from?": "<length>", "to?": "<length>" }], value }` on a scope `fluid`.
- Defaults for `from`/`to` from a token set if one is given (`$tokens`), else 20rem..80rem.
- Build error when the result fails the 1.4.4 check (fluid-tailwind's rule), with the two widths in the message.
- `cqi` variant: `fluid.container()`.

## Todo
- [ ] value member with the clamp math and Typed OM result
- [ ] 1.4.4 check as a build error
- [ ] fixture + type test
- [ ] docs/API.md section
