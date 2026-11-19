---
"@cssints/headless": patch
---

`createWorkspace`'s panels actually hide: the inner tab list's controlled `value` now reads the workspace's own version signal, so `tabpanelProps(...).hidden` changes with the active tab — in 0.46.0 it never did, and every panel of a tabset stayed visible (a host had to derive `hidden` from `active()` itself).

Two options the first real host asked for:

- `initial`: where each tab starts. The dealt layout puts `ceil(n / 2)` tabs in the left tabset, which is a guess; a host that knows its layout (both tabs in the right one, a tab detached) says so instead of replaying `pick`/`drop` after mount — which also announced a move and asked for focus at load.
- `labels`: the spoken name of a tabset. The defaults name the position in the row ("Left tabset"), which is wrong for a pane whose only tabset is not on the left.
