---
# cssints-g3u1
title: Devtools overlay reports a mismatch for --surface-d on sky's post card
status: todo
type: bug
priority: normal
created_at: 2026-10-09T13:01:24Z
updated_at: 2026-10-09T13:01:24Z
---

Seen by hand in the cssints-t42q check: on apps/sky /dev/posts, picking a post card in the devtools overlay marks `--surface-d` as a mismatch (✗) against the computed style. Not investigated: the overlay's verification of a custom property set by surface() (the kernel alternates registered properties through @container style(), and the clone check may not reproduce the parent chain), or a real cascade difference.

## Todo
- [ ] reproduce on /dev/posts and in a minimal fixture (nested surfaces)
- [ ] fix the core's cascade or verification, a test in packages/devtools
