---
# cssints-6ca5
title: Toast queue and a polite status region
status: in-progress
type: feature
priority: normal
created_at: 2026-10-30T10:51:10Z
updated_at: 2026-10-31T16:35:43Z
parent: cssints-65eb
---

createAlert is role=alert and imperative; there is no queue and no role=status anywhere.

- [x] status region: polite, one element, replaceable text (for "Link copied", "Saved")
- [x] toast stack: queue, timeout, pause on hover/focus, dismiss, max height, aria-live=polite per toast
- [x] destructive/error toasts use the alert role, not the polite one
- [x] adopt: apps/docs playground copy feedback — `apps/docs/src/playground/Playground.tsx:32` (`const copied = createStatus();`), `:128` (`copied.show("Link copied")`), `:129` (`copied.clear`), `:247` (`{...copied.statusProps}` on one `role=status` region)
- [x] adopt: the kit's toast starter is the first host of `createToast` — `apps/ui/src/registry/toast/toast.tsx` (`Toaster` renders `regionProps` in a portalled fixed stack, one `Toast` per `toasts()` spreading `toastProps(id)`), fixture, browser test and the docs demo (`apps/ui/src/docs/demos.tsx`, buttons for info, success, error, hover pause and four at once)
- [ ] adopt: kocharin dashboard save notices (another repository)

Toast and status shipped in `packages/headless/src/toast.ts` and `status.ts` (PR on `ui/toast`, changeset minor); `test/toast.browser.test.tsx` is the oracle. The playground feedback and the kit item are adopted below; the kocharin dashboard is another repository and stays open.

## Summary of Changes

- Confirmed the toast starter in `apps/ui/src/registry/toast/` (component, fixture, browser test, generated `r/toast.json` and the docs page it feeds) as the first host of `createToast`: the queue, the ceiling of three, the timeout, the hover/focus pause and the live regions are the primitive's; the starter styles the region and the rows with the kit's tokens and a close button with an accessible name.
- Added the ceiling case to the starter's browser test (four shows leave three, the oldest dropped), the success tone and the close button's `aria-label`, and moved the auto-dismiss case to a `timeout: 60` queue.
- Added a "Queue four" button to the docs demo, beside info, success, error and hover pause.
- Regenerated `apps/ui/r/*.json` from master's sources.
- Adoption evidence: `apps/docs/src/playground/Playground.tsx` uses `createStatus()` (line 32) and one `statusProps` region (line 247) for its copy feedback; the kocharin dashboard is another repository and stays open.

