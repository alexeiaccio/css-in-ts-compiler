# @cssints/headless

## 0.12.0

No changes in this release.

## 0.11.0

No changes in this release.

## 0.10.0

### Minor Changes

- c6d1cdc: `@cssints/headless`: `createField` and `createConfirm`, found in two apps. `errorProps` is `role="alert"` while the error is shown (the hint is not); `createField({ describedby })` takes an id or a list of ids the host owns and appends them to `aria-describedby` after the hint and the error, for one form-level error that belongs to two controls; `id`, `required` and the other options accept `undefined`, so a getter over an optional prop typechecks under `exactOptionalPropertyTypes`. `createConfirm` gets the dialog shell it needed: Tab and Shift+Tab cycle inside the dialog, `overflow: hidden` on the document element while open (counted, restored on close), Escape from the document so it works with the focus outside, and the last confirm opened takes Escape and Tab when several are open. The default labels stay English: a translating host passes `confirmLabel` and `cancelLabel`.

## 0.9.0

### Minor Changes

- 42f7313: `@cssints/headless`: `createField`, the ARIA contract of a form field (`controlProps`, `labelProps`, `hintProps`, `errorProps`: ids that are stable, `aria-describedby` listing the hint and then the error while they are shown, `aria-invalid` only when invalid, `required` with `aria-required`, nothing that points at a hidden id), and `createConfirm`, a promise-based `confirm({ title, description?, confirmLabel?, cancelLabel?, destructive? })` over `createDialogModal({ role: "alertdialog" })`: `true` on confirm, `false` on cancel, Escape or the backdrop, focus on the cancel button and back to the invoker, one request at a time (a second one rejects with `ConfirmPendingError`). Neither has an APG pattern, so neither has a Quint spec.

## 0.8.0

No changes in this release.

## 0.7.0

No changes in this release.

## 0.6.1

No changes in this release.

## 0.6.0

### Minor Changes

- `@cssints/headless`: `createResizablePanels`, a group of N panes and N-1 separators — percent sizes that always sum to 100, per-pane min/max, collapsible panes, arrows and Home/End as pair moves, Enter to collapse and restore, a pointer drag that re-solves from the pointerdown snapshot, controlled `sizes` + `onSizesChange`, and a `storageKey`. `@cssints/apg-specs`: `specs/patterns/resizable-panels.qnt` (not an APG pattern: a group of window splitters), its generated model, the bridge with the drag vocabulary, 11 scenarios under `scenarios/patterns/`, and the `patterns/` exports.

## 0.5.2

No changes in this release.

## 0.5.1

### Patch Changes

- 7dae24c: `@cssints/headless`, first release: headless APG widgets on Solid 2 (state and DOM attribute objects, no styling), each conformance-checked in Chromium against its Quint spec and the ported scenarios.
