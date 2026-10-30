---
"@cssints/headless": minor
---

`createDropZone`: a file drop target on a hidden native `<input type="file">`, with a browse button as the accessible path
(the zone is never drag-only), `accept` / `multiple` / `maxSize` validated once per file into `onFiles` and
`onReject({ file, reason })`, a depth-counted `dragging()` that a child's `dragleave` does not clear, and a
`role="status"` line the host fills with `message()` ("2 files, 1 rejected: too large"). A dropped folder or an empty
`DataTransfer` is a no-op. No APG pattern and no Quint spec: `test/dropzone.browser.test.tsx` is its oracle.
