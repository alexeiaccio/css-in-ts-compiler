# The requirement catalogue

Every component in `@cssints/headless` states what accessibility requires of it, not only what it
does. The model is [TetraLogical's Accessible Components Library](https://tetralogical.com/blog/2026/10/14/accessible-components-library/)
(v1.0.0, ISC): per component, the problem it solves, when to use it and when not, the accessibility
requirements grouped under ten themes, and an assistive-technology compatibility table.

One thing changes. TetraLogical writes each requirement as a Gherkin scenario and runs it with
Cucumber + Playwright. We already own that evidence in two cheaper forms — Quint specs and browser
tests — so a requirement here is **a row that names the artefact holding it**. A row that names
nothing is a **gap** with an open task, never a test that does not exist.

The catalogue is a docs page per component, not a lexicon record: it is reviewed in the diff beside
the code it describes, it needs no schema, and it ships to nobody (`docs/` is not in the package's
`files`).

## The ten themes

TetraLogical's split, kept as-is so a page can be compared with theirs line by line.

| Theme                                | What it asks                                                         | Usually lands in                                                     |
| ------------------------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Adaptability                         | user preferences, text scaling, reflow, orientation, contrast themes | browser test (layout), manual (contrast themes)                      |
| Animation and movement               | motion can be reduced or turned off                                  | manual, or N/A when there is no motion                               |
| Assistive technologies and semantics | roles, names, values, reading order                                  | quint (state), browser test (attributes), manual (what is announced) |
| Colour and contrast                  | 4.5:1 text, 3:1 non-text, 7:1 AAA, no colour alone                   | browser test (computed styles) or manual                             |
| Consistency and predictability       | no change of context on focus or input                               | manual                                                               |
| Images and media                     | non-text content has a text alternative                              | host obligation, manual                                              |
| Input assistance                     | errors are identified and described                                  | not applicable to a state-only primitive                             |
| Keyboard                             | every operation by keyboard, focus visible, no trap, focus order     | quint (movement), browser test (focus order, styles)                 |
| Navigation                           | labels say where the control leads                                   | manual (the name an AT announces)                                    |
| Pointer and touch                    | activation on the up event, 24×24 AA / 44×44 AAA targets             | browser test                                                         |

## The three destinations

**1. Behaviour is Quint.** Anything about state and transitions — selection, focus movement, roving
tab stop, activation mode, wrapping, disabled skipping, request vs commit, what focus does after a
change — belongs to the pattern's machine:

- `packages/apg-specs/specs/apg/<pattern>.qnt` — the model, its invariants and its event pools;
- `packages/apg-specs/src/apg/<pattern>.bridge.ts` — the vocabulary both the model and the DOM speak;
- `packages/apg-specs/test/apg/<pattern>.test.ts` — the hand-built bad states that give each
  invariant teeth;
- `packages/headless/test/<pattern>.browser.test.tsx` — the ported scenario walks (real DOM) and the
  differential walk of random steps against the model.

A row names the spec, and the scenario or spec-only test that demonstrates the requirement. If a
behaviour is in the model but no walk reaches it, the row points at the invariant and is still
covered: an invariant is checked after every step of every walk.

**2. DOM, layout and time are a browser test.** Attributes and their values, focus order, what is in
the tab order, hit area, computed contrast, focus appearance, activation on the up event, and the
no-JS fallback. Most attribute rows point at a scenario in `<pattern>.browser.test.tsx`, because a
scenario's `expect.attrs` is exactly that assertion; a requirement no scenario states gets a hand
written test in the same file (`<pattern>-<aspect>.browser.test.tsx` for a second aspect, as
`tabs-close.browser.test.tsx` does).

**3. What a screen reader says, and what cannot be automated, is manual.** An announcement, the
name an AT actually reads, reading order as the virtual cursor walks it, OS contrast themes,
Magnifier / Apple Zoom, a real high-contrast paint. Those live in the component's
assistive-technology table as a row tagged `@manual`, checked by hand.

**Order matters.** When two destinations cover a requirement, name the stronger one: a Quint
invariant beats a scenario, a scenario beats a manual row. A requirement with a test does not also
get a manual row — the manual table is only for what the machine cannot see.

## A requirement that fits none of the three

Two cases, both written down, both allowed:

- **A host obligation.** The primitive emits no elements and no CSS, so naming, styling and layout
  are the host's. Say so in the row, name the owner, and mark it `gap` if nothing in the repo proves
  the host does it. Do not write a test against a primitive that cannot carry the requirement.
- **Not applicable.** State the reason ("no motion to reduce", "no images"). N/A is a verdict, not a
  gap.

A third case is not allowed: a real requirement with no artefact and no gap task. That is a
document that lies.

## The numbers, as data

The values a requirement may cite. Every row in a component page uses one of these, never a
paraphrase.

| Constraint                     | Value                                        | Standard                 | Where it can be checked |
| ------------------------------ | -------------------------------------------- | ------------------------ | ----------------------- |
| Target size, minimum (AA)      | 24 × 24 CSS px, or 24 px with spacing        | 2.5.8                    | browser test (box)      |
| Target size, enhanced (AAA)    | 44 × 44 CSS px                               | 2.5.5                    | browser test (box)      |
| Contrast, text (AA)            | 4.5 : 1                                      | 1.4.3                    | browser test (computed) |
| Contrast, non-text / UI (AA)   | 3 : 1                                        | 1.4.11                   | browser test (computed) |
| Contrast, text (AAA)           | 7 : 1                                        | 1.4.6                    | browser test (computed) |
| Focus appearance (AAA)         | 2 px solid perimeter, 3 : 1 against adjacent | 2.4.13                   | browser test (computed) |
| Activation                     | on the **up** event, never `down`            | 2.5.2                    | browser test            |
| Motion                         | honour `prefers-reduced-motion: reduce`      | 2.3.3                    | manual                  |
| Text scaling                   | 200 % without loss                           | 1.4.4                    | browser test            |
| Reflow                         | 320 CSS px wide, no horizontal scroll        | 1.4.10                   | browser test            |
| Breakpoint for a narrow layout | 800 px (TetraLogical's tabs rule)            | component rule, not WCAG | browser test            |

## No-JS is a requirement of every component

`cssints` renders CSS-first, so the unscripted page is ours to keep, not an afterthought. Every
component page states **one** no-JS fallback, in this shape:

> Without the script: what the reader gets — normally a table of contents of in-page links followed
> by a heading and the full content of each section. The script replaces it, so nobody meets a
> control that does nothing and no content becomes unreachable.

If the fallback is not implemented, the row is a gap. The primitive cannot render it (it emits no
markup), so the fallback is a host obligation with a named owner and a browser test once a host has
one.

## The assistive-technology table

Per component, one row per combination we claim, and one tag per row:

| Tag          | Meaning                                                            |
| ------------ | ------------------------------------------------------------------ |
| `@automatic` | a Quint invariant, scenario or browser test already proves the row |
| `@manual`    | a person checked it, following the row's instructions              |

Status is one of `not run`, `no issue`, `issue`, `N/A (reason)`. **`not run` is the honest default**:
a table copied from TetraLogical would claim results we have never produced. A page that has not
been through the ATs says so, and the gap task is the run.

## Adding a component

1. Copy `tabs.md`: the problem, when to use and when not, how ours works.
2. Walk the ten themes and write a row per requirement, naming the strongest artefact that exists.
3. Every row without an artefact becomes a numbered gap task at the bottom of the page — a task, not
   a fiction.
4. Fill the AT table with `not run` and the four screen-reader rows.
5. Link the page from the package README and `docs/API.md`.

## Pages

- [tabs](./tabs.md) — the worked template.
- The other components follow as their pages are written: accordion, alert, alertdialog, breadcrumb,
  button, carousel, checkbox, checkbox-group, combobox, confirm, dialog-modal, disclosure, feed,
  field, grid, link, listbox, meter, pagination, player, popover, radio, resizable-panels,
  scrollspy, slider, slider-multithumb, spinbutton, switch, table, textbox, timeline, toast, toolbar,
  tooltip, treegrid, treeview.
