---
"@cssints/headless": minor
---

`@cssints/headless`: `createToast`, a toast queue (one live region per toast, `role=alert` for the error tone and `role=status` otherwise, a 5000 ms timeout that pauses on hover and focus and resumes with the time left, `max` that drops the oldest, `dismiss`/`dismissAll`, and a `role=region` landmark), and `createStatus`, one polite `role=status` region whose text is replaced. No APG pattern exists for either, so the browser test is the oracle; the toast's own text is the announcement (the host renders the `title` and `description` given to `show`), and F6 into the region stays the host's handler (hotkeys are a separate bean).
