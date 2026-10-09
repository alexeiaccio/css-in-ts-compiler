---
# cssints-l8nq
title: nest() selectors relative to an ancestor of the kernel's element
status: completed
type: feature
priority: low
created_at: 2026-10-09T07:56:10Z
updated_at: 2026-10-09T08:40:21Z
---

Found by skeleton (cssints-0k8h): `css.nest(":root:has(&)")` is rejected because a nest() selector must start with `&` and a combinator, so skeleton's `:root` clock is a raw kernel.

## Todo
- [x] allow `&` elsewhere in the selector (`:root:has(&)`, `.x &`), types and build
- [x] skeleton's clock as a styles kernel

## Summary of Changes

nest() takes one complex selector with at least one `&` anywhere; the selector built so far stands for `&` (in :is() when it holds a combinator), so a condition around nest() reaches the element and one inside the subject. Subject rule: `&` in the last compound outside parentheses (`.x &`, `&.on`) is the element and counts for derived conflicts and the cssints-life overlap check; otherwise (`& > *`, `:root:has(&)`) not (Cond.own). A list or no `&` is an error; NestSelector checks for an `&`. skeleton's clock is a styles kernel: media(no-preference)(nest(':root:has(&)')(animation(keyframes(...), ...))); only @property stays a string in atProperty (no member for it). Browsers green in Chrome, Firefox, WebKit.
