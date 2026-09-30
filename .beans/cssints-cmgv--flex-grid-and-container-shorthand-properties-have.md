---
# cssints-cmgv
title: flex, grid and container shorthand properties have no member
status: completed
type: task
priority: normal
tags:
    - wayfinder:grilling
created_at: 2026-09-30T08:50:32Z
updated_at: 2026-09-30T08:55:18Z
parent: cssints-vy0o
---

## Question

`flex()` and `grid()` are layout contexts and `container()` is a condition, so the `flex` (e.g. `flex: 1`), `grid` and `container` shorthand properties have no member. `flex: 1` is common. Options: `flex("1")` with arguments means the property and `flex()` without means the context; a different name; or longhands only (`flexGrow`, `flexBasis`).

## Resolution
Option a (2026-09-30). `flex("1")` and `grid("...")` with arguments are the shorthand properties, and `flex()`/`grid()` without arguments stay the chaining contexts; the types tell them apart by overload. `container` is different: `container("sidebar")` is valid both as a query (`<container-condition>`) and as the property value (`<'container-name'>`), so there it stays the condition, and the property is written with its longhands `containerName` and `containerType`.
