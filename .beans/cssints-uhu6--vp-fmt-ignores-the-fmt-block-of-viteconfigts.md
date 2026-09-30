---
# cssints-uhu6
title: vp fmt ignores the fmt block of vite.config.ts
status: todo
type: task
priority: low
tags:
    - wayfinder:task
created_at: 2026-09-30T08:50:32Z
updated_at: 2026-09-30T08:50:32Z
parent: cssints-vy0o
---

## Question

`vp fmt` formats with 2 spaces and about 100 columns, while the `fmt` block of the root `vite.config.ts` says tabs and 120 (cssints-gcho). Find why and make the config the source of truth. Prefer making the config match what runs today, so no mass reformat is needed; if tabs and 120 are wanted, reformat in a separate commit.
