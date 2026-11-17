---
# cssints-utz4
title: 'A scratch probe is committed on master: packages/devtools/probe.tmp.mjs'
status: todo
type: task
priority: low
created_at: 2026-11-17T08:14:16Z
updated_at: 2026-11-17T08:14:16Z
---

Found while working on the X-ray: `packages/devtools/probe.tmp.mjs` is committed (it arrived in `142d873f`), and it is exactly what its name says — a temporary happy-dom probe used while debugging, not part of the package.

**Fix**: delete it, and check whether anything imports it (nothing should); if the probe is still useful, keep it out of git under a path a `.gitignore` covers. A scratch file in a published package's tree is the kind of thing `knip` would flag if it were configured for this package.
