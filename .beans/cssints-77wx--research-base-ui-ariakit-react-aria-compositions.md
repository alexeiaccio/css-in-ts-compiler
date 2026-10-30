---
# cssints-77wx
title: 'Research: Base UI, Ariakit, React Aria compositions'
status: completed
type: task
priority: normal
created_at: 2026-10-30T10:51:11Z
updated_at: 2026-10-30T13:01:49Z
parent: cssints-65eb
---

Read the three libraries' composition patterns before building the filterable menu, popover and table, and write the comparison into docs/ (cssints repo).

- [x] Base UI: render props, data-* attributes, the filterable menu blog post
- [x] Ariakit: the same primitives as compositions (combobox inside menu), focus management model
- [x] React Aria: the hooks split, collections API, and their examples site
- [x] verdict per pattern we plan: which model we copy and why; what we deliberately do not (React-only collection API, their styling story)
- [x] note where our Quint oracle adds something none of them has

## Summary of Changes

`docs/research/compositions-2026-10.md` (109 lines): one section per planned
pattern (popover, filterable menu, command palette, date picker, table,
toast/status, drawer, drop zone) with what each library does, where they differ,
the model we copy for a Solid 2 primitive that returns plain attribute objects,
what we deliberately do not take, and an open question; closing with a
pattern -> model -> open question -> bean table.

Biggest disagreements recorded: (1) Base UI's filterable menu must not be a
combobox ("a role is a promise") while Ariakit's palette and React Aria's
combobox ship exactly that; (2) focus policy is props in Base UI and Ariakit but
a documentation rule in React Aria; (3) Base UI's drawer is a JS gesture state
machine with snap points, our prior verdict (`packages/headless/docs/bottom-sheet.md`)
keeps no sheet primitive at all; (4) Base UI announces toast text handed to the
manager, React Aria announces rendered content.

Accessibility requirements are marked [TL] and tied to the TetraLogical
requirement -> Gherkin -> test model (references-2026-10.md §6, effects-of-atmosphere).
