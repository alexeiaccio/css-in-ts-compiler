---
# dev
title: 'dev build: the kit''s prop idiom warns STRICT_READ_UNTRACKED 343 times, from 17 sources'
status: todo
type: task
priority: low
tags:
    - wayfinder:task
created_at: 2026-11-20T21:10:00Z
updated_at: 2026-11-20T21:10:00Z
---

The `#sink` page mounts the whole kit, so Solid's dev build speaks: 343 `STRICT_READ_UNTRACKED` (a read outside any tracking
scope — "the read got the current value once and will never update") across 17 values, plus the 4 `UNSTABLE_LIST_IDENTITY`
that are already fixed. Top sources, from one site run:

| count | value |
| --- | --- |
| 78 | `createControllable.version` |
| 51 | `createCombobox.query` |
| 51 | `createCombobox.active` |
| 42 | `createDatePicker.visible` |
| 25 | `merge` |
| 14 | `createAccordion.multipleOverride` / `collapsibleOverride` |
| 5 | `placed` |
| 3 | `createTreeview.hasFocus`, `createMenu.hostOpen` |
| 2 | `createRadioGroup.flavor` |
| 1 each | `createTreegrid.inGrid`, `createModifiers.hostModifiers`, `createListbox.focused`, `createFeed.phase`/`.active`, `name` |

All of them stack through the kit's part idiom — `merge(rest, () => ({ get "aria-expanded"() { … } }))` spread into a
component — and most name the merge object's closing brace, not a line that reads anything.

**The behaviour is live**: `apps/ui/src/registry/select/select.browser.test.tsx` asserts `aria-expanded` false then true on a
click, and passes. So this is a structural warning about where a read happens during prop materialisation, not (yet) a
user-visible bug — which is exactly why it needs one experiment, not seventeen patches.

## One experiment, then decide

1. Take `SelectTrigger` (the 78 + 102): replace `merge(rest, thunkOfGetters)` with a `createMemo` of the merged part props
   (read inside a memo's compute) or read each value in JSX at the attribute. Re-run the site and count; a drop of ~180 says
   the idiom is the cause.
2. If it is, the fix is one shape in `renderPart`/the kit's merge usage, applied where the count is large; the small ones
   (`name`, `placed`) are probably a one-time snapshot and want `untrack()` to say so.
3. Then the sink page logs no `STRICT_READ_UNTRACKED` and `apps/ui/src/registry/diagnostics.ts` can raise it to a failure
   (it already raises errors and `EFFECT_RELAY_TEAR`).

Not a bug hunt: nothing here is reported broken, and the dev build is not shipped.
