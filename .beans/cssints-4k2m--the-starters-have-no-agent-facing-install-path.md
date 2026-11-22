---
# cssints-4k2m
title: 'the starters have no agent-facing install path'
status: todo
type: feature
priority: low
created_at: 2026-11-22T21:00:00Z
updated_at: 2026-11-22T21:00:00Z
---

Solid Bits (solid-bits.dev, the subject of the wayfinder entry of 2026-11-22) ships an MCP server and a "copy for AI"
menu beside its shadcn-style registry: an agent can find a component and put it in a project without the reader copying
files. Our registry is the same shape — `apps/ui/public/r/registry.json` plus one `r/<name>.json` per starter, with the
component, its kit files, its test and the config — but nothing an agent can call exposes it. `@cssints/mcp` can answer
`check_declaration`, `search_docs` and `list_plugins`; it cannot say which starters exist or add one.

The surface to add, when it is wanted, is small: a `list_starters` tool over `r/registry.json` (name, title,
description, dependencies, whether it ships a conformance test), and an `add_starter` that writes an item's files into
`src/components/ui/` with the same flattening `scripts/registry-json.ts` already applies. The JSON is generated, so the
tool reads one committed file; the copy's imports are relative and flat by construction, so the write is mechanical.

Constraints: a starter may only use published npm API (the starter smoke installs the published packages), and an item
that needs a newer engine than the registry is held back until that version is published — an agent tool has to say so
rather than produce a copy that does not build.

Done when: `list_starters` answers from the committed registry, `add_starter` puts an item and its `with` files into a
fresh template, the template's tests pass (the smoke's own commands), and the tool has a test on `packages/mcp`'s
in-process client.
