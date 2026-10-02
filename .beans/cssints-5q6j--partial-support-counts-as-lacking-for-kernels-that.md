---
# cssints-5q6j
title: Partial support counts as lacking for kernels that need exact behaviour
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T08:51:17Z
updated_at: 2026-10-02T09:06:46Z
parent: cssints-9js6
---

## Question

support.ts counts BCD `partial_implementation` as support. For relative colour that is wrong for `surface()`: Chrome 119–121 and Safari 16.4–17.6 are partial with other channel scales, so the steps come out wrong there with no warning, and the runtime ships to Safari 17 (found in cssints-vsc9). Decide whether a kernel's `requires` (or a single BCD key) can say "partial is lacking", or whether partial should be lacking everywhere, and what that does to the existing warnings (count how many change on the demo and fixtures).
