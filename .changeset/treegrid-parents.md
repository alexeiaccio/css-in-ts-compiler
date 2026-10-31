---
"@cssints/headless": minor
---

`createTreegrid` takes the tree it renders: `parents` is the parent of each row in document order (`-1` for a root), and `defaultExpanded` opens rows at mount. The spec's Email Inbox tree stays the default, so `treegrid.qnt` and every existing test are unchanged; a host with its own data no longer has to fit it into the seven spec rows.
