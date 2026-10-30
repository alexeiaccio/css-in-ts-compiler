---
# cssints-3by9
title: Pagination
status: todo
type: task
created_at: 2026-10-30T10:51:10Z
updated_at: 2026-10-30T10:51:10Z
parent: cssints-65eb
---

The last of TetraLogical's eight components we do not have (accordion, breadcrumb, dialog, disclosure, tabs are here).

- [ ] nav with aria-label, list of page links, aria-current="page" on the current one, previous/next with disabled ends
- [ ] the "of many" reading: the count is announced once, not per link
- [ ] target size >= 24x24 (AA) and 44x44 (AAA), from the TetraLogical numbers
- [ ] docs site: replace the hand-rolled prev/next in apps/docs Page.tsx
- [ ] browser test + one scenario walk if it has state (it has none: current page is the host's)
