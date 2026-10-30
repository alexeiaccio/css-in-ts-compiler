---
# cssints-qzkr
title: Scrollspy table of contents
status: todo
type: feature
created_at: 2026-10-30T10:51:11Z
updated_at: 2026-10-30T10:51:11Z
parent: cssints-65eb
---

apps/docs Page.tsx keeps a scroll listener and sets aria-current="location" by hand; no APG pattern exists.

- [ ] headings from the content or a passed list; the active one is the last passed the top
- [ ] aria-current="location" on the link, not on the heading
- [ ] a smooth-scroll hook that respects prefers-reduced-motion
- [ ] adopt in apps/docs Page.tsx
