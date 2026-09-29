---
# cssints-wx85
title: How atomic CSS libraries emit and order CSS in Vite
status: todo
type: task
tags:
    - wayfinder:research
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T13:28:04Z
parent: cssints-vy0o
---

## Question

Research StyleX, vanilla-extract, Panda CSS, Tailwind v4 and UnoCSS (see `docs/research/` first; do not repeat what is there).

- One stylesheet versus per-module CSS; how duplicate atomic rules are removed across modules in dev and in build.
- How rule order and conditions (media, pseudo, nested) are made deterministic; use of `@layer`.
- Where LightningCSS (or another optimizer) runs, and on what: per module or on the final sheet.
- How HMR updates CSS without a full reload.

Answer: the options that fit our engine (virtual CSS module per file today, content-hashed classes, `@layer _.a.._.e`), with a recommendation.
