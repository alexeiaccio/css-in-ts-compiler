---
name: cssints-contributor
description: >-
  Work on the cssints monorepo itself (the engine in packages/cssints, the type-level grammar in
  packages/css-grammar, the @cssints/* plugin packages, apps/demo, apps/csssky, apps/docs): its commands, the Effect
  rules and their plainCode exceptions, hot paths and perf.mjs, type budgets (bench/budget.mjs), the Quint model of
  HMR, the tracked dist/ folders, the docs house style (docs/API.md, docs/wayfinder.md), beans, and parallel agents in
  git worktrees. Load it before you change code, tests, benches or docs in this repository, or when you work in a
  worktree beside other agents.
---

# Contributing to cssints

`AGENTS.md` at the root is the full guide (layout, commands, code style, Effect patterns); read it first. This skill
is the short version and what agents tripped over. For the public API, the source of truth is `docs/API.md`; for the
reasons behind it, `docs/wayfinder.md` (start there). Writing styles: `packages/cssints/skills/cssints/SKILL.md`;
writing a plugin: `packages/cssints/skills/cssints-plugin/SKILL.md`.

If the cssints MCP server is configured, prefer it to answer "is this value valid / supported / what does this module
compile to" (`check_declaration`, `check_support`, `check_contrast`, `compile`, `search_docs`, `list_plugins`) before
writing a throwaway fixture; on apps/demo's dev server, `explain_class`, `module_styles`, `dev_errors`,
`inspect_element` and `why_property` answer what a running app does.

## Commands

```bash
bun install                                    # once per checkout or worktree
bun run test                                   # every package (vp run -r --cache test)
bun run typecheck                              # tsgo + effect-tsgo diagnostics per package (every diagnostic is an error)
bun run check                                  # vp check (fmt, lint, types), then typecheck
bun run bench                                  # type instantiation budgets, never cached
bun run diff:check                             # anti-slop rules on the lines added since master
cd packages/cssints && bun run test            # fixtures, maps, HMR races, the hmr app, the docs' code blocks
cd packages/cssints/test && node run.mjs fixtures/x.ts   # one fixture: its code and its CSS
cd packages/cssints/test && node docs.mjs      # type-check the ts blocks of docs/API.md and README.md
cd packages/<plugin> && bun run test && bun run typecheck   # a plugin package
cd packages/<plugin> && bun run test:browsers  # Chrome, Firefox, WebKit (needs the browsers; not in `test`)
bunx vp fmt --check <files>                    # the formatter is the judge: 2 spaces, 100 columns, double quotes
```

Plain `.ts` runs under `node` with type stripping: erasable syntax only (no enums, namespaces, parameter properties),
`.ts` import specifiers. `vp test` is vitest (only tools/ai-automation uses it); `vp run test` is the package script.

## Effect, and where code stays plain

- Engine code returns Effects: `Effect.fn("name")`, `Data.TaggedError("Tag")<{ ... }>` with the file and the offset
  of the call site (see `src/errors.ts`), `Effect.gen`, `Effect.try`, `Context.Service`. No `try/catch`, global
  `JSON`, `in`, `typeof x === "object"`, `_tag` comparisons: the `automation/*` lint rules reject them; the
  replacements are `Result.try`, `Schema.fromJsonString`, `Predicate.hasProperty`, `Match`.
- Effect is a 4.0 beta: check an API in `packages/cssints/node_modules/effect` (source, `AGENTS.md`, `ai-docs/`),
  not from memory. `Data.TaggedErrorClass` and `ServiceMap` do not exist.
- **Plain by design** (the `plainCode` list in `vite.config.ts`, a reason each): browser runtimes (`runtime.ts`,
  `parent-vars.ts`, `frame.ts`, `surface.ts`, `derived.ts`), the Typed OM values, the sync `css.*` builders and the
  class hash (`lib.ts`, `node.ts`, `functions.ts`), `scope.ts`/`scope-engine.ts`, the twin's recognizer
  (`twin-core.ts`), the plugin packages' `src/`, apps, tests, benches, scripts. A new file of that kind joins the
  list; do not add disable comments. A diagnostic that must stay is
  `// @effect-diagnostics-next-line <name>:off -- reason`.

## Hot paths and perf

The twin's lexer and recognizer, the class hash and the AST walk run per declaration or per site. A traced
`Effect.fn` costs about 4 µs a call, so per-declaration and per-site functions are `Effect.fnUntraced`, and there is
one Effect per declaration (css-grammar's `check.ts`), not one per check. After touching these paths run
`packages/cssints/test/perf.mjs` (`gen`, then `dev`/`seq`/`build`; budget: per-module cost within 10%). A/B both sides
in **one** worktree: a worktree with its own install measures about twice slower than the main checkout.

## Type budgets

`bun run bench` runs `packages/css-grammar/bench/budget.mjs` over the bench files of css-grammar and cssints
(`bench/users.ts` imports members as user code does; `--customConditions development`, so the sources are measured).
A rise above 1.1 times the budget (or an unexpected type error) fails. After a deliberate type-cost change, rewrite
`bench/budget.json`: `cd packages/css-grammar && node bench/budget.mjs --update`, and for cssints
`node ../css-grammar/bench/budget.mjs bench --update` in `packages/cssints`; put the numbers and the reason in the
commit and the wayfinder entry. Type tests are files `tsgo` checks, with
`@ts-expect-error` on what must fail (`packages/cssints/test/types/`, `packages/css-grammar/test/`).

## HMR and the Quint model

`packages/cssints/test/spec/runner.qnt` models the dev server's invalidation (ssr transforms, the runner's fetches,
`depsOf`, the client cache, the sheet) with invariants such as `servedFresh` and `sheetFresh`; `spec/race.mjs` (in
`test`) replays its counterexamples; `bun run test:mbt` replays model traces against a real server. If you move an
await point in `plugin.ts`/`evaluate.ts`, or change what invalidates a module or when the sheet is rebuilt, re-run
Quint (command in the header of `runner.qnt`) and mbt, and update the model. A change of what is printed, or of its
order, leaves the model untouched: say so in the wayfinder entry.

## Generated and tracked files

- Generated, never edited by hand: `css-grammar/src/mdn.ts`, `keywords.ts`, `functions.ts` (`bun run extract`),
  `longhands.ts` (`bun run longhands`, needs Chrome), `cssints/src/members.ts` (`bun run members`).
- `dist/` is tracked for `packages/cssints`, `css-grammar`, `icons` and `mise-en-mode` (consumed over git: the exports
  default to dist, `src` is the `development` condition). A source change there needs `bun run build` in the package
  and the rebuilt dist committed **on master**, by whoever merges; branches do not commit `dist/`.
- `packages/*/package.json` is skipped by the formatter (the order of export conditions matters: `development` first).

## Docs house style

- `docs/API.md` is the reference. Every `ts` block is type-checked by `test/docs.mjs`; a line ending in `// error`
  must fail; fence `ts skip` for output. Its code blocks are formatted by `vp fmt` (oxfmt formats embedded code in markdown): run it on the file after an edit. A behaviour change updates
  the bullet that states it, with the bean id and the date in the heading when it is a decision.
- `docs/wayfinder.md` gets one entry per decision or finding: `## What changed (cssints-xxxx, YYYY-MM-DD)` and one
  paragraph: who found it (the bean or package), the problem with a repro, what was chosen and what was weighed, the
  cost (budgets, perf, bytes), what is left. Plain, short sentences; no marketing.
- Package READMEs: the example, the CSS it prints, Rules, Browsers, Limits, then the test commands.
- Simple English everywhere; commit messages in English (`feat(scope): ...`, `docs(api): ...`, `fix(engine): ...`).

## Beans

Track all work in beans, not todo lists: `beans list --ready`, `beans show <id>`, `beans create "Title" -t task -s
in-progress`, check off todo items as you go (`--body-replace-old "- [ ] x" --body-replace-new "- [x] x"`), and at the
end add `## Summary of Changes` and set `-s completed` (only with no unchecked items). A plugin or feature bean
records what the engine lacked under `## Engine gaps`, each with a repro and the workaround. Commit the bean file with
the code.

## Parallel agents in worktrees

Other agents work at the same time in sibling worktrees on their own branches. Rules:

- **Never `git stash`.** The stash is shared by every worktree of the repository: you would take or drop another
  agent's work. Commit, or keep the change in the working tree.
- Work only in your worktree; never write into the main checkout or another worktree (an absolute path into the main
  checkout is the usual slip). Run every command with your worktree as the working directory.
- Touch only the files of your task. No `dist/` commits in a branch.
- Small atomic commits, English messages, bean files included. Do not push or merge unless asked: the coordinator
  merges one branch at a time (engine changes before the packages and apps that use them), rebuilds `dist/` on master
  and runs the whole suite.
- Lint and format in a worktree can show errors that master does not have (one known cause: in a worktree nested in
  the checkout, `.worktrees/x`, oxfmt ignores `fmt.ignorePatterns`). Do not "fix" a lint error in files outside your
  task; check it on master first. `bun run typecheck` and the tests are the reliable gates in a worktree.
- After a harness crash, do not reuse or move the worktree: a new branch in a new directory.

## A new plugin package in this repo

Lay it out as `packages/balance` (src, README, test/<name>.mjs, fixtures, types, `vite.config.ts` with `pack`), add
`packages/<name>/src/**` to `plainCode` and its fixtures to `inputs` in `vite.config.ts`, add a row to the "Plugin
packages" table of `docs/API.md` and a line to the layout of `AGENTS.md`, and record its `## Engine gaps` in its bean.
