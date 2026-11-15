---
# cssints-jr2a
title: 'headless: host recipes and kit markup for the native labels'
status: completed
type: task
priority: normal
created_at: 2026-11-14T10:42:10Z
updated_at: 2026-11-15T10:45:38Z
parent: cssints-oeb0
---

## What
Cash the summary table's "native" recommendation where an app renders DOM: `details name` for accordion/disclosure
(with `::details-content` + `interpolate-size` for the animation), `<dialog showModal()>` for dialog-modal/alertdialog
(with `closedby` as enhancement), `<input type=range>`, `<meter>`, `<input type=checkbox switch>` in Safari with the
styled checkbox elsewhere. The primitives stay as the contract and the fallback.

## Todo
- [x] The recipes in the package README (or a `hosts.md`): which element each primitive's props go on, and what the
      platform then owns
- [x] One story per recipe in the kit (`apps/ui`), with the conformance test as usual
- [x] `field-sizing: content` and `:user-invalid` in the text field story (Baseline newly 2026-06-16)



## Summary of Changes

- `packages/headless/docs/hosts.md`: the recipe per pattern — element, code, what the platform owns, the gap that keeps
  the primitive. Disclosure and accordion (`details`/`summary`, `name` for exclusivity, `::details-content` +
  `interpolate-size` for the animation), dialog/alertdialog (`<dialog>` + `showModal()`, `commandfor`/`command`,
  `closedby` as enhancement, `@starting-style`), meter (`<meter>`), switch (checkbox + `role=switch` + the Safari-only
  `switch` attribute), checkbox/radio, slider (`type=range`, and the `::thumb`/`::track` gap), text fields
  (`field-sizing`, `:user-invalid`, `autocomplete`), focusgroup composites, static markup, and what stays JS.
- `packages/headless/README.md` points at it under the opening example.
- The kit: a `Native` story on `disclosure`, `accordion` (with the existing count/multiple controls driving the `name`),
  `dialog`, `meter`, `switch`; `AutoGrow` on `textarea` (`field-sizing`) and `UserInvalid` on `input` (`:user-invalid`).
  The items themselves are unchanged: they are the contract and the fallback, the stories are the platform host.
- `apps/ui/src/registry/native-hosts.browser.test.tsx`: renders each story through the loader's `render` in Chromium and
  holds it to the platform — `details` toggles and fires `toggle`, a shared `name` is exclusive while `multiple` is not,
  `showModal()` gives `:modal` + focus in and Escape returns it, the meter carries value/max/label, the switch toggles,
  `field-sizing` grows the textarea, and `:user-invalid` turns on after typing an invalid value and leaving the field.
  `apps/ui`'s suite: 64 files, 972 passed; `test:site` green.
