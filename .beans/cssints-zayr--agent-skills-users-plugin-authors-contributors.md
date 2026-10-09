---
# cssints-zayr
title: 'Agent skills: users, plugin authors, contributors'
status: completed
type: feature
priority: normal
created_at: 2026-10-09T08:45:25Z
updated_at: 2026-10-09T09:14:05Z
parent: cssints-0phg
---

Agent skills (SKILL.md format) for three audiences, grounded in docs/API.md, the plugin READMEs and what the agents learned building 18 packages today.

## Todo
- [x] decide where they live and how they install (shipped in the npm package for users and plugin authors; in the repo for contributors) — check the skills conventions of opencode, Claude Code and the skills npm/registry format
- [x] cssints-user (as `cssints`): setup, cn/cx/cv, conditions, tokens and themes, plugin packages, reading build errors
- [x] cssints-plugin-author (as `cssints-plugin`): scope(), kernels as styles, members, runtime/script/polyfills/requires, lacking(), errors, tests and test:browsers
- [x] cssints-contributor: the repo's rules (Effect, budgets, Quint/HMR, dist rebuilds, worktree agents without git stash)
- [x] each skill checked by a read-through validation instead of a fresh agent: tasks answered from the skill, its examples run through the engine (see Validation)

## Where the skills live and how they install

Researched 2026-10-09: the Agent Skills format (agentskills.io: a folder per skill, `SKILL.md` with YAML `name` (lowercase, hyphens, the folder's name) and `description` (up to 1024 characters, says when to load it), optional `references/` read on demand); opencode reads `.opencode/skills`, `.claude/skills` and `.agents/skills` up to the git root, and `~/.config/opencode/skills`, `~/.claude/skills`, `~/.agents/skills`; Claude Code reads `.claude/skills` and `~/.claude/skills` (and plugins' `skills/`); vercel-labs `npx skills add <source>` takes a git URL, a tree path or a local path and links the skills into each detected agent's folder (`.agents/skills` for opencode, Codex, Cursor, Gemini, Copilot; `.claude/skills` for Claude Code); antfu's `skills-npm` (a proposed convention) ships skills inside npm packages under `skills/<name>/SKILL.md`, listed in `files`, and symlinks `node_modules/*/skills/*` into the agents' folders, so the skill's version is the installed package's. The repo had no skills folder before.

Chosen:

- **`cssints` and `cssints-plugin` ship in the npm package**: `packages/cssints/skills/<name>/`, with `skills` in its `files`. They describe the API of the version installed beside them, which is the point of shipping them in the tarball (the skills-npm argument: no drift between the skill and the library). Install: `npx skills-npm` (all packages that ship skills), or `npx skills add ./node_modules/cssints/skills` (the skills CLI, any agent), or copy the folders into `.agents/skills/` / `.claude/skills/`. Before 0.1 is on npm (the packages are consumed over git), `npx skills add <repo url>/tree/master/packages/cssints/skills`.
- **`cssints-contributor` stays in the repo**: `.agents/skills/cssints-contributor/`, found by opencode and the `.agents` agents with no install; `.claude/skills` is a symlink to `../.agents/skills` for Claude Code. It is about this monorepo, so it is not in any tarball. It points at the two packaged skills by path for plugin work inside the repo.

## Validation (read-through, no fresh agent)

No agent was spawned (instruction). Instead, for each skill, small realistic tasks were answered from the skill alone, and every API the skills show was checked: the examples ran through the engine on master (temporary fixtures under `packages/cssints/test/fixtures/zz` with `node run.mjs`, and in `packages/<plugin>/test/fixtures` with a copy of the runner; both deleted), the `ts` examples type-checked with tsgo (a deliberate `width(4)` and `ring().width("red")` failed, as they must), and the frontmatter parsed as YAML with a valid `name` and a description under 1024 characters.

**cssints**
- "Add a dark mode; keep the card text readable": Tokens section + references/tokens.md give createTokens, createGlobalTheme under `media("(prefers-color-scheme: dark)")`, check.contrast. Ran: builds; `#999` on `#fff` fails with `contrast 2.84 is below 4.5: c.fg #999 on c.bg #fff, in the default values` (the message quoted in errors.md).
- "`Button({ size }) => p(size)` fails with must be known at build time": the Arguments section and errors.md point to a cv() variant / `cx(on && p(4))`. Ran: the cv example of the skill builds, with `drops` for the variant.
- "A sticky header whose title turns red when stuck; a heading balanced only on hover": plugins table + references/plugins.md give `sticky().top("0")` and `stuck(color("red"))` (ran: `_stuck-core _g-stuck _…`), and the condition rule says `hover(balance())` is an error, write `hover(textWrap("balance"))` (ran: builds, with the expected support warning).
- Every example of SKILL.md and tokens.md ran (conditions, attr, group/within, global, layers before/after, calc/clamp/colorMix/linearGradient, firstThatWorks, keyframes, style(token.set())); each plugin package example of plugins.md ran in its package (layout, motion, reveal, stuck, skeleton, balance, squircle, masonry, fluid, gradient, reset); the conflict message `layout: kernel stack-core sets display, flex-direction, gap (this style also sets display)` is real. The messages of errors.md were taken from runs (overlap, global + hover, cv variants, raw var() warning, canonical case, chains, 5 conditions).

**cssints-plugin**
- "A lines(n) member for -webkit-line-clamp that conflicts with overflow": a styles kernel (`display("-webkit-box")`, `WebkitBoxOrient`, `overflow`, `vars`) and a chain with `emit`. Ran: kernel in `_.k`, the method under `media()` in `_.b`, and `cn(lines(), overflow("auto"))` fails with `lines: kernel core sets display, -webkit-box-orient, overflow, -webkit-line-clamp (this style also sets overflow)`.
- "A script fallback for browsers without a feature": the Runtimes section (polyfills + css + script subpath, coverage, lacking()). Checked against balance/reveal/stuck sources and the test pattern of references/testing.md (from packages/balance/test).
- "`vp pack` fails with TS7056": the export-type pattern, as in balance/fluid/mise-en-mode.
- Ran: the ring example (types and build), a group: true member read by `within(attr(...), "tab")`, a raw kernel with an explicit conflicts entry, `fn()` with a label and an options object, a value member returning `CSSColorValue`, a call member returning `layers` before + `globals`, a throw located at the call, `#trim`/`trim` (`dup: #trim and trim share a name: rename one`), a marker-only member under hover (the error), `nest(":root:has(&)")`, `nest(".dark &")` and `css.keyframes` with `--_p` in a kernel (after rebasing on master: cssints-l8nq, cssints-ge5k).
- **Found**: a value member whose `value` returns a template literal is typed as that template, and `color(shade("red"))` is then a type error in the user's code although it builds (API.md says a string is opaque to the types). Annotating the result `: string` (or returning a Typed OM value) fixes it; the skill says so. Follow-up: cssints-izcy.

**cssints-contributor**
- "Add a prose rule to the twin": twin-core.ts is plain code on a hot path; run perf.mjs (A/B in one worktree), bench, typecheck, tests; css-grammar's dist is tracked and rebuilt on master.
- "Save work in progress to switch tasks in a worktree": never `git stash`, commit instead.
- "Document a new engine behaviour": the API.md bullet (type-checked blocks, `// error`, `ts skip`, tabs) and a wayfinder entry in the house format.
- Every command and path it names exists (package.json scripts, budget.mjs flags `--update` and the dir argument, runner.qnt invariants, the plainCode list, the four tracked dist folders in .gitignore).

## Summary of Changes

- `packages/cssints/skills/cssints/` (SKILL.md, references/errors.md, tokens.md, plugins.md): writing styles with cssints.
- `packages/cssints/skills/cssints-plugin/` (SKILL.md, references/table.md, testing.md): writing a plugin on `scope()`, with tests and a checklist.
- `.agents/skills/cssints-contributor/SKILL.md`: working in this monorepo; `.claude/skills` is a symlink to `../.agents/skills`.
- `packages/cssints/package.json`: `skills` in `files` (checked with `npm pack --dry-run`).
- README.md: a "For agents" section (install with `npx skills-npm` or `npx skills add ./node_modules/cssints/skills`, the MCP server).
- The branch was rebased on master to describe its `nest()` (`&` anywhere), kernel keyframes and build sheet map.
- Follow-up bug: cssints-izcy (a template-literal result of a value member fails the property's grammar in the types).
- README.md was not `vp fmt`-clean on master before this change (tabs in its code blocks, the layout table); only the new section is formatted, the rest is left as it was.
