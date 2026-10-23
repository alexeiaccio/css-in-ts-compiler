# APG static patterns — ARIA contracts

Patterns covered by `effects-of-atmosphere-3wsk`: alert, breadcrumb, landmarks, link, meter, table.

The rule for this workspace is _behaviour first_: a Quint state machine exists only where there is state that changes over time. This file holds everything else — the **static role/attribute contract** that a DOM test can assert, as a checklist, with the reason a pattern has (or has no) machine.

| Pattern    | Machine                              | Why                                                                                                         |
| ---------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| alert      | [`alert.qnt`](./alert.qnt)           | announcement-after-load, no focus theft, no auto-dismiss are all about change over time                     |
| breadcrumb | [`breadcrumb.qnt`](./breadcrumb.qnt) | `aria-current` must follow the last item as the trail changes                                               |
| link       | [`link.qnt`](./link.qnt)             | Enter activation + focus move; non-native links must stay keyboard reachable                                |
| meter      | [`meter.qnt`](./meter.qnt)           | clamping, range changes and `aria-valuetext` freshness are derived state                                    |
| landmarks  | none                                 | purely structural; no states, no events, no keyboard interaction. Correctness is a property of the DOM tree |
| table      | none                                 | "a static tabular structure … not an interactive widget"; the only dynamic bit (`aria-sort`) is data        |

Each machine's invariants (`val …` in the `.qnt`) cover its dynamic rules. The sections for those four below list only the **static** remainder the machine does not model.

---

## landmarks (no machine)

APG: <https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/> · practice: <https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/>

Keyboard interaction: not applicable (navigation among landmarks is provided by the browser / assistive technology).

Why no machine: a landmark is a role on a section of the page. There is no state to hold, no transition, and nothing to replay; a machine would only restate the DOM.

Checklist (assert on the rendered document):

- [ ] Every landmark is one of the eight roles: `banner`, `navigation`, `main`, `complementary`, `contentinfo`, `search`, `form`, `region` — either explicit `role=…` or the implied HTML element (`header`, `nav`, `main`, `aside`, `footer`, `form`, `section`).
- [ ] The page has exactly one `main` landmark.
- [ ] Top-level `banner` and `contentinfo` appear at most once each, and are not nested inside another landmark (`header`/`footer` inside `article`/`section` do not map to them).
- [ ] When the page has **more than one** landmark of the same role (e.g. two `navigation`s), each carries a distinct accessible name (`aria-labelledby` preferred when a visible label exists, otherwise `aria-label`). The name does not repeat the role ("Main navigation", not "Main navigation navigation").
- [ ] `form`, `region` and (when named) `search` landmarks have an accessible name — an unnamed `form` or `region` is not exposed as a landmark.
- [ ] A `search` landmark wraps the whole search facility (input and button), not just the input.
- [ ] All perceivable content sits inside some landmark (rule of thumb from the APG).
- [ ] Landmark count stays small — the APG rule of thumb is seven or fewer; flag the page above that.
- [ ] No landmark is hidden (`hidden`, `display: none`, `aria-hidden=true`) while its content stays reachable.

## table (no machine)

APG: <https://www.w3.org/WAI/ARIA/apg/patterns/table/> · practice: <https://www.w3.org/WAI/ARIA/apg/practices/grid-and-table-properties/>

Keyboard interaction: not applicable. Cells are not focusable or selectable; each widget inside a cell is its own tab stop. An interactive tabular widget is the **grid** pattern, a different spec.

Why no machine: a table is static structure. Sorting is the one dynamic aspect and it is plain data (`aria-sort` follows the sorted column) — if a sortable table gains real behaviour (sort cycle, focus on the header button) model that as its own sortable-table machine, not here.

Checklist:

- [ ] The container has `role=table` (or is a native `<table>`; a native element is strongly preferred and needs no role).
- [ ] Every row has `role=row` and is a DOM descendant of, or owned (`aria-owns`) by, the `table` or by an element with `role=rowgroup`.
- [ ] Every cell has exactly one of `columnheader`, `rowheader`, `cell`, and is a descendant of / owned by a `row`:
  - [ ] `columnheader` for a cell that titles its column,
  - [ ] `rowheader` for a cell that titles its row,
  - [ ] `cell` otherwise.
- [ ] The table has an accessible name: `aria-labelledby` pointing at a visible label if one exists, otherwise `aria-label`.
- [ ] If the table has a caption or description, `aria-describedby` on the table refers to it.
- [ ] Sortable table: at most one header has `aria-sort`, and its value is `ascending`, `descending` (or `other`); unsorted headers carry no `aria-sort="none"` noise unless the design needs it.
- [ ] If any rows or columns are absent from the DOM (virtualised or hidden): `aria-rowcount` / `aria-colcount` hold the **total** count (`-1` when unknown), and every row/cell present has `aria-rowindex` / `aria-colindex` with its 1-based position.
- [ ] Cells spanning several rows or columns carry `aria-rowspan` / `aria-colspan`.
- [ ] Rows or cells added through `aria-owns` are not forgotten in the owner's `aria-owns` list — owned elements are announced after the DOM descendants.
- [ ] No cell has `tabindex` or a selection state (`aria-selected`): that would make it a grid.
- [ ] Interactive content inside cells (buttons, links) is individually focusable; the cell itself is not.

---

## alert — static remainder (machine: `alert.qnt`)

APG: <https://www.w3.org/WAI/ARIA/apg/patterns/alert/> · keyboard: not applicable.

- [ ] The element carrying the message has `role=alert` (implicit `aria-live=assertive`, `aria-atomic=true`).
- [ ] The alert has no `tabindex`, and showing it never calls `focus()` — needing focus means the alertdialog pattern instead.
- [ ] For a message that must be announced, the `role=alert` container is rendered **empty first** (or the node is inserted/changed after load); content present at load time is not spoken.
- [ ] No timer removes the alert; any dismiss control is an ordinary button in the tab order.
- [ ] Machine invariants: `FocusNeverOnAlert`, `PreloadedNotAnnounced`, `LiveMessageAnnounced`, `SilentBeforeLoad`, `RoleWhenMounted`.

## breadcrumb — static remainder (machine: `breadcrumb.qnt`)

APG: <https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/> · keyboard: not applicable (ordinary links).

- [ ] The trail is inside a `navigation` landmark (`<nav>`).
- [ ] The landmark has a label via `aria-label` or `aria-labelledby` (e.g. "Breadcrumb").
- [ ] The trail is an ordered list (`<ol>`) of items, ancestors first, current page last.
- [ ] Every ancestor item is a link; the current page item is last.
- [ ] Machine invariants: `CurrentIsLastOrAbsent`, `LinkCurrentIsMarked` (`aria-current="page"` on the current-page link; optional on a non-link current item).

## link — static remainder (machine: `link.qnt`)

APG: <https://www.w3.org/WAI/ARIA/apg/patterns/link/> · keyboard: Enter executes and moves focus to the target; Shift+F10 (optional) opens the context menu.

- [ ] Prefer a native `<a href>`; it needs no role, `tabindex`, or key handler.
- [ ] A non-native element has `role=link`, `tabindex=0`, an accessible name from its content (or `aria-label`), and a click **and** Enter key handler. Space does not activate it.
- [ ] Machine invariants: `KeyboardReachable`, `FocusOnLinkImpliesFocusable`, `TargetFocusImpliesArrived`, `ArrivedImpliesActivated`.

## meter — static remainder (machine: `meter.qnt`)

APG: <https://www.w3.org/WAI/ARIA/apg/patterns/meter/> · keyboard: not applicable.

- [ ] The element has `role=meter` (or a native `<meter>`), and is not used for progress (`progressbar`) or for unbounded values.
- [ ] `aria-valuenow`, `aria-valuemin`, `aria-valuemax` are decimals with `min < max` and `min <= now <= max`.
- [ ] `aria-valuetext` is set when a bare percentage is not understandable (e.g. `50% (6 hours) remaining`).
- [ ] Visible label → `aria-labelledby` on the meter; otherwise `aria-label`.
- [ ] Machine invariants: `RangeValid`, `NowInRange`, `NowIsClampedRaw`, `TextWhenNotFriendly`, `TextNeverStale`.
