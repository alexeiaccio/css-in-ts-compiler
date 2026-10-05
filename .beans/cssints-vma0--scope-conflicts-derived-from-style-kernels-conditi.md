---
# cssints-vma0
title: 'scope(): conflicts derived from style kernels, conditions in style kernels'
status: in-progress
type: feature
created_at: 2026-10-05T11:27:20Z
updated_at: 2026-10-05T11:27:20Z
parent: cssints-easl
---

Left from cssints-8ogz: a kernel written as css.* styles does not derive its conflicts (the author writes conflicts by hand) and takes no conditions (only blockOf and css reach a style kernel). Derive the conflict props from the style kernel's declarations (with longhands, as cn() overlap does), overridable by an explicit conflicts entry; allow conditions (hover, media, container, supports, attr) inside a style kernel, rendered under the kernel's class. Tests, API.md, budgets.
