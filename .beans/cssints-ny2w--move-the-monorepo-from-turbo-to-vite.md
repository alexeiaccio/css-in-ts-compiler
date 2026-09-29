---
# cssints-ny2w
title: Move the monorepo from turbo to Vite+
status: completed
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-29T14:36:11Z
updated_at: 2026-09-29T14:50:06Z
parent: cssints-vy0o
---

## Question

Adopt Vite+ (`vite-plus`, the `vp` CLI, 1.0.0) as in ~/github/effects-of-atmosphere, keeping bun as the package manager (Vite+ detects it from `bun.lock`).

- [x] `vp migrate` at the workspace root (or by hand where it gets things wrong; it created no root config, so lint/fmt were moved by hand): a root `vite.config.ts` from `vite-plus` holding the lint and fmt config (from `.oxlintrc`/`.oxfmtrc` if present), and tasks run through `vp run -r` instead of turbo
- [x] Remove turbo (`turbo.json`, the dependency, the managed AGENTS.md block, `.turbo` dirs) and the standalone oxlint/oxfmt/oxlint-tsgolint dependencies Vite+ replaces
- [x] Scripts: `test`, `bench`, `lint`, `fmt`, `check` through `vp`; per-package `test` scripts unchanged in behaviour (they are plain node scripts)
- [x] `apps/demo` builds with `vp build`; the plugin works unchanged
- [x] AGENTS.md and README: the commands
- [x] Record the current lint/fmt state (error counts per package) without fixing it; making it clean belongs to the TS + Effect port

## Summary of Changes

- `vp migrate --no-interactive --no-agent --no-editor --no-hooks` (local vite-plus 1.0.0; the global vp is 0.2.2 and would pin 0.2.2). Kept: `vite-plus` and the `vite` core alias as a bun catalog plus override (`vite` in cssints tests, plugin and demo now resolves to `@voidzero-dev/vite-plus-core` 1.0.0), demo scripts to `vp dev/build/preview`, demo `defineConfig` from `vite-plus`. Reverted: its rewrite of packages/plugin-icon (its tsdown config is unused, that package builds with `bun build`) and reordering of packages/cssints/package.json. It did not create a root `vite.config.ts`, so that was written by hand.
- Root `vite.config.ts`: `lint` (rules, plugins and the playwright js plugin copied verbatim from `oxlintrc.json`, plus `typeAware` and `typeCheck`) and `fmt` (from `.oxfmtrc.json`, `experimentalSortImports` is now `sortImports`, `.beans/**` ignored). Deleted `oxlintrc.json`, `.oxfmtrc.json`, `turbo.json`, the turbo, oxlint, oxfmt and oxlint-tsgolint dependencies, the AGENTS.md turbo block, the `.turbo` gitignore line (no `.turbo` dirs existed).
- Root scripts: `build` = `vp run -r build`, `dev` = `vp run -r --parallel dev`, `test` = `vp run -r --cache test`, `bench` = `vp run -r bench`, `check`, `lint`, `lint:fix`, `fmt`, `fmt:check` = `vp ...`. `lint:check` is gone, `vp check` covers it. Package scripts unchanged.
- Caching: scripts are uncached by default in vp, so `test` passes `--cache`. Second `bun run test`: css-grammar 4/4 steps hit (5.5s saved). `cssints#test` is never cached: vp reports "modified its input" (temp apps and hmr dir under test/), which is the right outcome. `bench` stays uncached, as it was under turbo.
- Demo build CSS is byte-identical to the turbo-era build (`index-CA5heLEa.css`); the JS differs only by an absolute path in a region comment.
- **The old lint config was never applied.** The file was named `oxlintrc.json` (no dot), so `oxlint` ignored it and ran its defaults (107 rules: 3 errors, 34 warnings, the 3 errors are plugin-icon syntax errors). With the config applied (`-c oxlintrc.json`, oxlint 1.56): 1191 errors, and with `--type-check`, 1443. `vp lint` gives the same 1443 with the config active. The old note "oxlint pinned to 1.56.0 (1.86 panics with tsgolint 0.12.2)" no longer applies: Vite+ 1.0.0 bundles oxlint 1.85 and tsgolint 7.0.2003, which run fine.
- `vp lint` state (0 warnings). Total 1443 = 1191 rule errors + 252 type-check errors (TS…):

  | package | total | rules | type-check |
  |---|---|---|---|
  | packages/css-grammar | 157 | 154 | 3 |
  | packages/cssints | 682 | 636 | 46 |
  | packages/plugin-icon | 310 | 241 | 69 |
  | apps/demo | 292 | 158 | 134 |
  | docs/archive | 2 | 2 | 0 |

  Top rules: no-unsafe-call 372, no-unsafe-member-access 342, no-unsafe-assignment 159, no-unsafe-argument 101, no-unsafe-return 79.
- `vp fmt --check` state, files that would change: css-grammar 25, cssints 19, apps/demo 3, docs 6, README.md 1, .beans.yml 1, .vscode/settings.json 1; plugin-icon has 3 syntax errors (`Effect.fail(new X({...}));` inside `$(`, fs.ts:28, iconify.ts:193, inline.ts:84) that make oxfmt abort. Because of them `vp check` stops at "Formatting could not start", so `vp check` does not reach lint until plugin-icon parses. Nothing was fixed.
- Quirk: inside a git worktree nested in another checkout (`.worktrees/x`), oxfmt ignores `fmt.ignorePatterns` from `vite.config.ts` (a plain copy of the tree honors them). Not an issue in a normal checkout.
- `.vscode/settings.json`: dropped the dangling `oxc.fmt.configPath` (`.oxfmtrc.json`), added `oxc.disableNestedConfig` and `oxc.fmt.disableNestedConfig`.
