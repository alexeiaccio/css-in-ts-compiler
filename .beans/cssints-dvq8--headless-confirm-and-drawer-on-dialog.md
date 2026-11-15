---
# cssints-dvq8
title: 'headless: confirm and drawer on <dialog>'
status: completed
type: task
priority: normal
created_at: 2026-11-14T10:42:10Z
updated_at: 2026-11-15T13:27:12Z
parent: cssints-oeb0
---

## What
`confirm.ts` and `drawer.ts` share `overlay-shell.ts` (scroll lock, tab cycle, overlay stack). A host that renders
`<dialog>` + `showModal()` gets all three from the browser, plus focus containment and Esc. Keep `overlay-shell` only
for hosts that do not (the Clay/native class of host).

## Todo
- [x] The `<dialog>` host path for `createDialogModal` (and through it an alert dialog): `nativeProps` + `attachDialog`,
      `closedby` from the options, `cancel`/`close` back into the request state
- [x] The tests that now assert platform behaviour move to the host fixture, not the primitive — `dialog-native` and
      `drawer-native` are real `<dialog>` fixtures; the old suites stay for the element-agnostic path



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



**Drawer, done:** `createDrawer` has `nativeProps` + `attachDialog`: `showModal()` for a modal drawer (the platform owns
focus containment and return, Escape, the outside press and the scroll lock — the shell's effects return early), `show()`
for a non-modal rail (which keeps the shell's Escape and outside press, since a non-modal `dialog` has neither), and
`close()`. `closedby` is `any`/`closerequest` from `dismissable`, `none` for a non-modal rail. Five browser tests on a real
`<dialog>`; the existing drawer suite (14) and the kit's drawer (35) are untouched.

Remaining: `confirm` still owns its shell (`overlay-shell`): its promise and view shape are the host's, and moving it to
`<dialog>` is a design of its own; the kit's dialog/drawer items can render `<dialog>` now that the primitives accept it.



**Confirm, done:** createConfirm exposes the dialog modal nativeProps and attachDialog, so a host renders a dialog with
role=alertdialog and the platform owns the modal layer, the focus containment and return, Escape, the light dismiss and the
scroll lock. The primitive keeps the promise, the Cancel-first focus, the request/answer split and the invoker focus on
settle; the shell lock, stack and keydown return early when the element is a native dialog, and a platform close (Escape,
a light dismiss, close()) answers false. Five browser tests on a real dialog; the existing confirm suite (20) is
untouched. The three primitives are on dialog now; the kit items rendering it is a visual step of its own.
