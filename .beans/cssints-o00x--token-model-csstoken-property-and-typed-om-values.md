---
# cssints-o00x
title: 'Token model: css.token, @property and Typed OM values'
status: completed
type: task
priority: normal
tags:
    - wayfinder:grilling
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T14:29:55Z
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

## Resolution
Written up in `docs/API.md`, section "Tokens".
- A token is a Typed OM value whose `toString()` is `var(--name)`, so it fits typed parts.
- There is a `token.<type>` for every `@property` syntax type, and the initial value is checked against that type's grammar.
- A named token (a string or `{ var, inherit }`) can be set. An unnamed one gets a `--_<hash>` of the file and site, is private, and `set` on it is a type error. `inherits` defaults to true.
- The sheet gets one `@property` per token, at the top and outside the layers.
- `style()` and `token.set()` are build-time with static values. Dynamic values use plain `style`. A typed runtime setter is fog.
Follow-up: research on constraints and math in design tokens.
