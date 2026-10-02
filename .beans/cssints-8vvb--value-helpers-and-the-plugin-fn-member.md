---
# cssints-8vvb
title: Value helpers and the plugin fn() member
status: todo
type: task
tags:
    - wayfinder:grilling
created_at: 2026-10-02T09:06:46Z
updated_at: 2026-10-02T09:06:46Z
parent: cssints-9js6
---

## Question

API.md "Functions" is unspecified: do typed value helpers (`css.colorMix("oklch", a, "30%", b)`, `css.clamp(...)`) exist next to typed string parts (`"color-mix(in oklch, ...)"` already type-checks), what do they add (tokens as arguments, Typed OM results, computeTo at build time), and is `fn()` in cssints/plugin the way plugins add them (plugins.md §4.3). Decide with the user; if yes, an implementation ticket.
