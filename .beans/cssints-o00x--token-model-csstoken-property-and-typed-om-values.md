---
# cssints-o00x
title: 'Token model: css.token, @property and Typed OM values'
status: todo
type: task
tags:
    - wayfinder:grilling
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T13:28:04Z
parent: cssints-vy0o
blocked_by:
    - cssints-5dbi
---

## Question

API.md: `css.token.color("blue", { var: "color-primary", inherit: true })` emits `@property` and serializes to `var(--color-primary)`; `css.token.set(blue, "red")` goes into a `style` prop; `css.style(...)`.

- Is a token a Typed OM value (`CSSStyleValue<"color">` whose `toString()` is `var(--x)`), so it already fits typed parts?
- Where is `@property` emitted, and how are the names hashed when `var` is not given?
- Which token types exist (the `syntax` of `@property` is a subset of CSS types)?
- How does `css.style()` (an inline style object) fit a compiler that replaces calls with class names?
