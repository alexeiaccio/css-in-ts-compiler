---
# cssints-6sib
title: Drop zone
status: in-progress
type: feature
priority: normal
created_at: 2026-10-30T10:51:11Z
updated_at: 2026-10-30T18:05:01Z
parent: cssints-65eb
---

Native file input exists in cms-admin and kocharin; there is no drag target, no progress and no error state.

- [x] drop target, click-to-pick, accept filters, multiple, disabled
- [x] error per file (onReject with a reason), announce the batch in a status region
- [ ] progress per file, cancel (deferred: the primitive has no onProgress or cancel yet)
- [x] keyboard: the same button path (a drop zone must never be drag-only)
- [ ] adopt: cms-admin image field, kocharin dashboard upload

## Summary of Changes

`createDropZone` in `packages/headless/src/dropzone.ts`, exported from `src/index.ts`:

- `inputProps` on a hidden native `<input type="file">` (`id`, `type`, `accept`, `multiple`, `disabled`, `hidden`, `onChange`), `zoneProps` (`role="group"`, `aria-label`, `aria-disabled`, the four drag handlers), `browseProps` on a real `<button type="button">` that clicks the input, `statusProps` (`role="status"`, `aria-live="polite"`).
- `dragging()` is a depth counter, so a child's `dragleave` does not clear it; `message()` is a default sentence over the last batch's counts ("2 files, 1 rejected: too large").
- Validation once per file, type then size, into `onFiles` (one batch, not called when empty) and `onReject({ file, reason })`. A dropped folder or an empty `DataTransfer` is a no-op.
- `packages/headless/test/dropzone.browser.test.tsx` (real Chromium, 9 tests); README "Drop zone", `docs/API.md` entry, `.changeset/dropzone.md` (minor).

Remaining: adoption in cms-admin / kocharin, and progress-per-file / cancel.
