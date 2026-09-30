---
# cssints-cmgv
title: flex, grid and container shorthand properties have no member
status: todo
type: task
tags:
    - wayfinder:grilling
created_at: 2026-09-30T08:50:32Z
updated_at: 2026-09-30T08:50:32Z
parent: cssints-vy0o
---

## Question

`flex()` and `grid()` are layout contexts and `container()` is a condition, so the `flex` (e.g. `flex: 1`), `grid` and `container` shorthand properties have no member. `flex: 1` is common. Options: `flex("1")` with arguments means the property and `flex()` without means the context; a different name; or longhands only (`flexGrow`, `flexBasis`).
