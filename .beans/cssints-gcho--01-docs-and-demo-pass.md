---
# cssints-gcho
title: 0.1 docs and demo pass
status: todo
type: task
tags:
    - wayfinder:task
created_at: 2026-09-30T08:13:20Z
updated_at: 2026-09-30T08:13:20Z
parent: cssints-vy0o
---

## Question

Make the docs match the code, and the demo show every 0.1 feature.

- [ ] docs/API.md: every section matches the implementation (names, outputs, errors); remove the obsolete parts (the old Functions (WIP) / Browser Compat idea sections become short notes pointing to what exists or to the map's fog)
- [ ] A doc test: extract the TypeScript code blocks of docs/API.md into a temp project and type-check them against the workspace `cssints` types (blocks meant to fail carry a marker); wire it into `bun run test`
- [ ] README: what cssints is, install, a 20-line example, links to API.md and wayfinder.md
- [ ] apps/demo covers: property functions and short names, flex()/grid() chains, cv, cn/cx, media/container/supports and pseudo-class wrappers, tokens and style()/token.set(), createTokens/createGlobalTheme with check.contrast, typed parts and math; verified in Chrome (playwright-core) including dark mode and one breakpoint
- [ ] AGENTS.md accurate
