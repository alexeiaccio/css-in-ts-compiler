---
# cssints-6ca5
title: Toast queue and a polite status region
status: in-progress
type: feature
priority: normal
created_at: 2026-10-30T10:51:10Z
updated_at: 2026-10-30T14:57:50Z
parent: cssints-65eb
---

createAlert is role=alert and imperative; there is no queue and no role=status anywhere.

- [x] status region: polite, one element, replaceable text (for "Link copied", "Saved")
- [x] toast stack: queue, timeout, pause on hover/focus, dismiss, max height, aria-live=polite per toast
- [x] destructive/error toasts use the alert role, not the polite one
- [ ] adopt: apps/docs playground copy feedback, kocharin dashboard save notices

Toast and status shipped in `packages/headless/src/toast.ts` and `status.ts` (PR on `ui/toast`, changeset minor); `test/toast.browser.test.tsx` is the oracle. Still open: adopting it in the docs playground copy feedback and the kocharin dashboard save notices.
