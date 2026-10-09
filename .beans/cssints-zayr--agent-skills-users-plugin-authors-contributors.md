---
# cssints-zayr
title: 'Agent skills: users, plugin authors, contributors'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-09T08:45:25Z
updated_at: 2026-10-09T09:04:41Z
parent: cssints-0phg
---

Agent skills (SKILL.md format) for three audiences, grounded in docs/API.md, the plugin READMEs and what the agents learned building 18 packages today.

## Todo
- [x] decide where they live and how they install (shipped in the npm package for users and plugin authors; in the repo for contributors) — check the skills conventions of opencode, Claude Code and the skills npm/registry format
- [x] cssints-user (as `cssints`): setup, cn/cx/cv, conditions, tokens and themes, plugin packages, reading build errors
- [x] cssints-plugin-author (as `cssints-plugin`): scope(), kernels as styles, members, runtime/script/polyfills/requires, lacking(), errors, tests and test:browsers
- [ ] cssints-contributor: the repo's rules (Effect, budgets, Quint/HMR, dist rebuilds, worktree agents without git stash)
- [ ] each skill checked by running a fresh agent on a small task with it

## Where the skills live and how they install

Researched 2026-10-09: the Agent Skills format (agentskills.io: a folder per skill, `SKILL.md` with YAML `name` (lowercase, hyphens, the folder's name) and `description` (up to 1024 characters, says when to load it), optional `references/` read on demand); opencode reads `.opencode/skills`, `.claude/skills` and `.agents/skills` up to the git root, and `~/.config/opencode/skills`, `~/.claude/skills`, `~/.agents/skills`; Claude Code reads `.claude/skills` and `~/.claude/skills` (and plugins' `skills/`); vercel-labs `npx skills add <source>` takes a git URL, a tree path or a local path and links the skills into each detected agent's folder (`.agents/skills` for opencode, Codex, Cursor, Gemini, Copilot; `.claude/skills` for Claude Code); antfu's `skills-npm` (a proposed convention) ships skills inside npm packages under `skills/<name>/SKILL.md`, listed in `files`, and symlinks `node_modules/*/skills/*` into the agents' folders, so the skill's version is the installed package's. The repo had no skills folder before.

Chosen:

- **`cssints` and `cssints-plugin` ship in the npm package**: `packages/cssints/skills/<name>/`, with `skills` in its `files`. They describe the API of the version installed beside them, which is the point of shipping them in the tarball (the skills-npm argument: no drift between the skill and the library). Install: `npx skills-npm` (all packages that ship skills), or `npx skills add ./node_modules/cssints/skills` (the skills CLI, any agent), or copy the folders into `.agents/skills/` / `.claude/skills/`. Before 0.1 is on npm (the packages are consumed over git), `npx skills add <repo url>/tree/master/packages/cssints/skills`.
- **`cssints-contributor` stays in the repo**: `.agents/skills/cssints-contributor/`, found by opencode and the `.agents` agents with no install; `.claude/skills` is a symlink to `../.agents/skills` for Claude Code. It is about this monorepo, so it is not in any tarball. It points at the two packaged skills by path for plugin work inside the repo.
