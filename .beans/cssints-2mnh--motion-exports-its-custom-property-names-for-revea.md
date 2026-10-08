---
# cssints-2mnh
title: motion exports its custom property names for reveal
status: todo
type: task
priority: low
created_at: 2026-10-08T14:10:21Z
updated_at: 2026-10-08T14:10:21Z
---

Found by reveal (cssints-qhug). reveal writes motion's `--motion-*` names by hand; its test fails if motion renames them. Export them (or an `emitPreset` helper) from @cssints/motion and use them in reveal.
