---
# cssints-ny2w
title: Move the monorepo from turbo to Vite+
status: todo
type: task
tags:
    - wayfinder:task
created_at: 2026-09-29T14:36:11Z
updated_at: 2026-09-29T14:36:11Z
parent: cssints-vy0o
---

## Question

Adopt Vite+ (`vite-plus`, the `vp` CLI, 1.0.0) as in ~/github/effects-of-atmosphere, keeping bun as the package manager (Vite+ detects it from `bun.lock`).

- [ ] `vp migrate` at the workspace root (or by hand where it gets things wrong): a root `vite.config.ts` from `vite-plus` holding the lint and fmt config (from `.oxlintrc`/`.oxfmtrc` if present), and tasks run through `vp run -r` instead of turbo
- [ ] Remove turbo (`turbo.json`, the dependency, the managed AGENTS.md block, `.turbo` dirs) and the standalone oxlint/oxfmt/oxlint-tsgolint dependencies Vite+ replaces
- [ ] Scripts: `test`, `bench`, `lint`, `fmt`, `check` through `vp`; per-package `test` scripts unchanged in behaviour (they are plain node scripts)
- [ ] `apps/demo` builds with `vp build`; the plugin works unchanged
- [ ] AGENTS.md and README: the commands
- [ ] Record the current lint/fmt state (error counts per package) without fixing it; making it clean belongs to the TS + Effect port
