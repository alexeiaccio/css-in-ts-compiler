---
"@cssints/headless": minor
---

`createTabs` takes `closable` and `renamable` (both off by default, so the plain tablist is unchanged), `label`, and
the requests `onClose` / `onRename`; it gains `closeProps`, `renameProps`, `editing`, and `focusAfterClose`. A close
button stays out of the tablist's tab order (`tabindex=-1`) and Delete closes the focused tab; focus lands on the tab
that slid into its place, or the previous one when the last tab closed, and the last remaining tab is never asked to
close. A double click starts an inline rename: Enter commits, Escape reverts, blur commits, and the arrows are the
input's while it runs. The primitive owns no list: it asks, the host removes or renames.
