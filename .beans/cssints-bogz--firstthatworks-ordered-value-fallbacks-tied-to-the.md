---
# cssints-bogz
title: 'firstThatWorks(): ordered value fallbacks tied to the BCD warnings'
status: in-progress
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-10-01T07:23:13Z
updated_at: 2026-10-01T07:23:29Z
parent: cssints-9js6
---

## Question

A typed `css.firstThatWorks("100dvh", "100vh")` (name open: `fallback`, `first`) usable as a part of any property: the build emits both declarations in CSS order (fallback first, the wanted value last), each part grammar-checked for the property, and the BCD support warning for the first value is silenced when the fallback value is supported by every lacking target (support.ts already knows which targets lack a value). Decide the atomic-class shape (one class with two declarations, so cn() dedupes as one), the type (a Part that carries both values, checked by Valid<P>), and what happens with tokens and var(). Fixture, type tests, bench, API.md.
