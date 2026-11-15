---
# cssints-dvq8
title: 'headless: confirm and drawer on <dialog>'
status: todo
type: task
priority: normal
created_at: 2026-11-14T10:42:10Z
updated_at: 2026-11-15T11:14:37Z
parent: cssints-oeb0
---

## What
`confirm.ts` and `drawer.ts` share `overlay-shell.ts` (scroll lock, tab cycle, overlay stack). A host that renders
`<dialog>` + `showModal()` gets all three from the browser, plus focus containment and Esc. Keep `overlay-shell` only
for hosts that do not (the Clay/native class of host).

## Todo
- [x] The `<dialog>` host path for `createDialogModal` (and through it an alert dialog): `nativeProps` + `attachDialog`,
      `closedby` from the options, `cancel`/`close` back into the request state
- [ ] The tests that now assert platform behaviour move to the host fixture, not the primitive



## Progress

`createDialogModal` has the native host path: `nativeProps` (role, `aria-labelledby`/`describedby`, `closedby` derived from
`dismissable`/`keyboardDismissDisabled`, `onCancel`, `onClose`) and `attachDialog(element)`, which follows `open()` with
`showModal()` / `show()` (`modal: false`) / `close()`. The platform owns the top layer, the backdrop, focus containment
and return, Escape and the scroll lock; a controlled host that refuses a request never shows the dialog.
`test/dialog-native.browser.test.tsx` (5 tests: modal + focus + Escape return, the Cancel path and `closedby`, `none`
leaving Escape inert, a refusing host, non-modal) plus the existing dialog-modal and alertdialog suites (71) pass.

Remaining: `confirm` and `drawer` still use `overlay-shell` (tab cycle, scroll lock, overlay stack) — the same host path
can replace it, but their tests assert the shell's behaviour, so they move to a host fixture first (the bean's second
todo). The kit's dialog/drawer items can then render `<dialog>`.
