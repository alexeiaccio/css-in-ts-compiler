---
# cssints-yfxf
title: Solid 2 and cssints in one Vite app
status: in-progress
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-10-02T14:20:14Z
updated_at: 2026-10-02T14:20:29Z
parent: cssints-co8y
---

## Question

cssints has only run with React. Does it work with Solid 2 RC unchanged? Build the smallest `apps/sky` skeleton: Solid 2 (`solid-js@next`, `@solidjs/web`, `@solidjs/vite-plugin`, its Oxc compiler), cssints' Vite plugin, one component using `css.*` in `class={...}`, a `cv()` with a reactive variant, a token, a `frame()`, a `container()` condition and an icon. Check: plugin order (our transform vs Solid's JSX compile, in the client and in the Module Runner's ssr environment that evaluates sites), dev server with HMR on a style edit and on a component edit, `vite build`, and type checks with tsgo and tsc 5.9 (`jsxImportSource: "@solidjs/web"`, our members in Solid's `class` attribute, which takes strings, objects and arrays in 2.0).

Answer: what works, what breaks and the fix (in the engine if it is ours, a documented setting if it is configuration), committed as the skeleton plus a test like apps/demo's build check. Engine fixes go with tests.
