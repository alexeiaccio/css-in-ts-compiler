---
# cssints-6ca5
title: Toast queue and a polite status region
status: todo
type: feature
created_at: 2026-10-30T10:51:10Z
updated_at: 2026-10-30T10:51:10Z
parent: cssints-65eb
---

createAlert is role=alert and imperative; there is no queue and no role=status anywhere.

- [ ] status region: polite, one element, replaceable text (for "Link copied", "Saved")
- [ ] toast stack: queue, timeout, pause on hover/focus, dismiss, max height, aria-live=polite per toast
- [ ] destructive/error toasts use the alert role, not the polite one
- [ ] adopt: apps/docs playground copy feedback, kocharin dashboard save notices
