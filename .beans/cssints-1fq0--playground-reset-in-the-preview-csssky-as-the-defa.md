---
# cssints-1fq0
title: 'Playground: reset in the preview, csssky as the default project, an Open in playground example on every docs page'
status: in-progress
type: feature
created_at: 2026-10-11T17:52:26Z
updated_at: 2026-10-11T17:52:26Z
---

User (2026-10-11): (1) the playground preview applies @cssints/reset too; (2) every docs page has a realistic example that opens in the playground; (3) the playground opens the csssky app by default.

- [ ] preview: @cssints/reset applied (as a real project would: reset() in the entry), visible and switchable
- [ ] default project: a csssky slice (shell, post card, feed of posts from csssky's recorded fixtures, its tokens/theme) that runs in the preview's runtime; the README example stays reachable
- [ ] per-page examples: a realistic multi-file example per docs page (README sections, API.md pages, package READMEs), each with an Open in playground link (share URL / project id), checked by a test (each example compiles in the browser engine and the Node plugin with no error)
- [ ] tests, docs
