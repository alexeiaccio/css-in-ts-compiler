---
# cssints-o8sk
title: 'Report to Sonda: its Vite plugin drops CSS assets'
status: scrapped
type: task
priority: low
created_at: 2026-10-09T08:56:14Z
updated_at: 2026-10-09T12:31:23Z
---

Found by cssints-vxfr: Sonda 0.14.0's Vite plugin passes only JS chunks to its report (writeBundle gives CSS files no entrypoints), so a CSS file is dropped even with a source map. Fed directly to Sonda's Report class, the demo's sheet splits by module. Report upstream (filipsobol/sonda) with that repro.

## Reasons for Scrapping
Not wanted by the user (2026-10-09): cssints does not need Sonda; the build sheet's source map stays for any analyser that reads CSS maps.
