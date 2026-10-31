---
"@cssints/headless": minor
---

The feedback that adopting 0.20.0 produced, in one release.

**Lists that arrive later.** `createListbox`'s `items`, `createTable`'s `rows`, `createRadioGroup`'s `values` and `createTimeline`'s rows now take a getter (`() => list()`) and read it at attribute-read time, so an async fetch no longer forces the host to rebuild the widget and lose the active option, the selection and the roving tab stop. `listbox.items` is a getter over the live list; a `defaultValue` chosen before the items arrived now survives them.

**Host-owned values.** `createRadioGroup` takes `value: () => checked()`, so `undefined` can be a real controlled state ("nothing checked") instead of meaning "uncontrolled"; its `radioProps` carries `type="button"`, so a radio rendered as a `<button>` no longer submits the form. `createStatus` and `createAlert` take `from: () => text`, and read the host's signal directly instead of asking for an effect that mirrors it into `show()`.

**Host-named ids.** `createTabs` takes `tabId(index)` and `panelId(index)`, and `aria-controls` / `aria-labelledby` follow them: a console whose panels are `#traces`, `#logs`, `#metrics` no longer re-implements the two attributes.

**Drop zone.** `maxFiles` caps one batch (a new `"count"` reject reason), `labels.labelledby` names the zone by the host's own visible heading, and `formatMessage` returns the announcement in the host's language from the same counts.

**Timeline.** Rows mode reports `focusedId()`, the row that holds the roving tab stop.

`test/props-later.browser.test.tsx` is the regression net for all of it.
