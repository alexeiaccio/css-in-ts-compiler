---
# cssints-gcho
title: 0.1 docs and demo pass
status: completed
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T08:13:20Z
updated_at: 2026-09-30T08:45:57Z
parent: cssints-vy0o
---

## Question

Make the docs match the code, and the demo show every 0.1 feature.

- [x] docs/API.md: every section matches the implementation (names, outputs, errors); remove the obsolete parts (the old Functions (WIP) / Browser Compat idea sections become short notes pointing to what exists or to the map's fog)
- [x] A doc test: extract the TypeScript code blocks of docs/API.md into a temp project and type-check them against the workspace `cssints` types (blocks meant to fail carry a marker); wire it into `bun run test`
- [x] README: what cssints is, install, a 20-line example, links to API.md and wayfinder.md
- [x] apps/demo covers: property functions and short names, flex()/grid() chains, cv, cn/cx, media/container/supports and pseudo-class wrappers, tokens and style()/token.set(), createTokens/createGlobalTheme with check.contrast, typed parts and math; verified in Chrome (playwright-core) including dark mode and one breakpoint
- [x] AGENTS.md accurate

## Summary of Changes

- **docs/API.md** rewritten against the code and the fixtures. Real class names and sheet output replace the made-up ones (`_fsdfssdf`), the `@layer` line has `_.k`, the `cv` example shows `_cv(cv(...))` (`cv` alone is not callable), `md`/`lg` are no longer declared twice. New: build-time arguments, top-level code limits, helper modules, typed parts and math, the `flex`/`grid`/`container` shorthand gap, an Errors section with real messages, and a short "Browser support and what 0.1 does not have" section instead of the Browser Compat idea.
- **Doc test** `packages/cssints/test/docs.mjs` (in the cssints `test` script): type-checks every `ts`/`tsx` block of API.md and README.md with tsgo; `// error` marks a line that must fail (no other line may), `ts skip` skips a block. On the old API.md it found 25 problems (JSX in `ts` fences, `md`/`lg` redeclared, `css.colorMix` that does not exist, unresolved imports).
- **README**: what it is, setup, a 20-line example with its real output, links.
- **apps/demo**: new `components/Showcase.tsx`, `helpers.ts`, more tokens and a `.compact` selector theme in `theme.ts`; 51 checks in Chrome (playwright-core, channel chrome) pass at 500, 800 and 1200 px, in dark mode (`emulateMedia`), with hover, active, focus-visible, a token set in a `style` prop.
- **AGENTS.md**: Effect examples use the beta.107 names, formatter/test sections describe what runs, docs test added, stale claims removed.
- Code limits found, not changed: see the final report.
