---
# cssints-8vvb
title: Value helpers and the plugin fn() member
status: completed
type: task
priority: normal
tags:
    - wayfinder:grilling
created_at: 2026-10-02T09:06:46Z
updated_at: 2026-10-02T12:20:35Z
parent: cssints-9js6
---

## Question

API.md "Functions" is unspecified: do typed value helpers (`css.colorMix("oklch", a, "30%", b)`, `css.clamp(...)`) exist next to typed string parts (`"color-mix(in oklch, ...)"` already type-checks), what do they add (tokens as arguments, Typed OM results, computeTo at build time), and is `fn()` in cssints/plugin the way plugins add them (plugins.md §4.3). Decide with the user; if yes, an implementation ticket.

## Resolution (with the user, 2026-10-02)

fn() in cssints/plugin plus a few built-ins (colorMix, min, max, clamp). Implemented in cssints-obd3.
