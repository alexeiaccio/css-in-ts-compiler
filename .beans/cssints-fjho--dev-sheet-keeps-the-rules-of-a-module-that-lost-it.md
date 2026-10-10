---
# cssints-fjho
title: Dev sheet keeps the rules of a module that lost its last cssints import
status: in-progress
type: bug
priority: normal
created_at: 2026-10-09T15:37:29Z
updated_at: 2026-10-10T11:29:02Z
---

Found by cssints-4v2z: on a dev server, a module edited so that it no longer imports cssints keeps its old rules in the sheet: plugin.ts returns early for a file without the attribute and never clears its usedBy / forgets its kernels, globals and themes. Fix in the early return (forget the file as a re-run does), a test in the HMR suite (test/hmr or plugin-seams.mjs style), and the Quint model if the HMR states change.
