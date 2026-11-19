---
# cssints-oafz
title: 'catalog: the starters as data, and a screen an agent can name (A2UI 1.0)'
status: completed
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-11-19T16:13:08Z
updated_at: 2026-11-19T16:13:08Z
---

Reference: https://developers.googleblog.com/a2ui-10-build-delightful-fast-reliable-agentic-experiences/ and the protocol (specification/v1_0/docs/a2ui_protocol.md in google/a2ui), read 2026-11-19.

A2UI 1.0 is an open protocol for generative UI: four messages (createSurface, updateComponents, updateDataModel, deleteSurface) on an ordered transport, a per-app catalog of components and functions as JSON Schema, a data model components bind to by reference, typed function calls, native themes, renderers for six platforms.

## Taken (no protocol)

- `/catalog.json` (`apps/ui/scripts/catalog.ts`, run by `bun run build`): every item, its story ids, each story's own JSON args and the args it declares (args + argTypes). `#catalog` shows the same JSON; `llms.txt` states the contract.
- A screen: `#screen={blocks:[{starter:bars,args:{…}}]}` drawn by the catalog's own stories (`apps/ui/src/docs/surface.ts`, `screen-page.tsx`). Closed by construction: an unknown starter, an unknown story or an undeclared arg refuses the whole screen and lists the names that would have worked.

## Rejected

- The wire protocol: streaming, data binding, actions and function calls are for a hosted agent driving someone else's app. Here the agent writes `.tsx` and the plugin compiles it — grammar, tokens, contrast, layers checked at build time, stronger than a schema-validated tree, and no renderer SDK to publish.
- JSON Schema generated from the TS props: a project (unions, render props, generics, JSX children); the catalog publishes what it honestly knows and points at the `tsx` and the MCP server.
- Streaming/partial surfaces: one document, one screen.
