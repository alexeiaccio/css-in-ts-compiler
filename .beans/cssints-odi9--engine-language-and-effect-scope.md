---
# cssints-odi9
title: Engine language and Effect scope
status: todo
type: task
tags:
    - wayfinder:grilling
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T13:28:04Z
parent: cssints-vy0o
---

## Question

The engine is `.mjs`. AGENTS.md asks for TypeScript and Effect on every side effect, and lint reports errors in the moved code.

- Port `plugin.mjs`, `macro.mjs` and `lib.mjs` to `.ts` run by type stripping, with no build step?
- Where does Effect pay off (evaluate, file IO, errors with call-site locations), and where is it noise (the Proxy in `macro.mjs`, hot paths in the twin)?
- Is lint clean a gate for 0.1?
