---
# cssints-ge5k
title: Scope custom properties are not renamed inside keyframes() made in a kernel
status: todo
type: bug
priority: normal
created_at: 2026-10-09T07:56:37Z
updated_at: 2026-10-09T07:56:37Z
---

Found by skeleton (cssints-0k8h, repro under "## Engine gaps"): `keyframes({ from: css.vars({ "--_p": "0%" }) })` inside a kernel prints `--_p`, while the kernel itself uses `--<scope>-p`, so the two name different properties.

## Todo
- [ ] namespace `--_x` in keyframes() created in a scope's kernel styles
- [ ] skeleton's clock keyframes written through keyframes() instead of raw CSS
