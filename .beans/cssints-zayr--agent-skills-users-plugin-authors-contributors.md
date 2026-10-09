---
# cssints-zayr
title: 'Agent skills: users, plugin authors, contributors'
status: in-progress
type: feature
created_at: 2026-10-09T08:45:25Z
updated_at: 2026-10-09T08:45:25Z
parent: cssints-0phg
---

Agent skills (SKILL.md format) for three audiences, grounded in docs/API.md, the plugin READMEs and what the agents learned building 18 packages today.

## Todo
- [ ] decide where they live and how they install (shipped in the npm package for users and plugin authors; in the repo for contributors) — check the skills conventions of opencode, Claude Code and the skills npm/registry format
- [ ] cssints-user: setup, cn/cx/cv, conditions, tokens and themes, plugin packages, reading build errors
- [ ] cssints-plugin-author: scope(), kernels as styles, members, runtime/script/polyfills/requires, lacking(), errors, tests and test:browsers
- [ ] cssints-contributor: the repo's rules (Effect, budgets, Quint/HMR, dist rebuilds, worktree agents without git stash)
- [ ] each skill checked by running a fresh agent on a small task with it
