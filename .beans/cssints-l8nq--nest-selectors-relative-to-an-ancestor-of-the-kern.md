---
# cssints-l8nq
title: nest() selectors relative to an ancestor of the kernel's element
status: in-progress
type: feature
priority: low
created_at: 2026-10-09T07:56:10Z
updated_at: 2026-10-09T08:31:13Z
---

Found by skeleton (cssints-0k8h): `css.nest(":root:has(&)")` is rejected because a nest() selector must start with `&` and a combinator, so skeleton's `:root` clock is a raw kernel.

## Todo
- [ ] allow `&` elsewhere in the selector (`:root:has(&)`, `.x &`), types and build
- [ ] skeleton's clock as a styles kernel
