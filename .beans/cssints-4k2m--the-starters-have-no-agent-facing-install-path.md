---
# cssints-4k2m
title: 'the starters have no agent-facing install path'
status: completed
type: feature
priority: low
created_at: 2026-11-22T21:00:00Z
updated_at: 2026-11-27T20:10:00Z
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

**Done 2026-11-27.** `list_starters` and `add_starter` are in `packages/mcp/src/starters.ts` and in the toolkit. Both
read the registry through one place: a directory that holds `registry.json` and `<name>.json` (this checkout's
`apps/ui/public/r` by default) or an http(s) base (the site, `https://ui.cssints.dev/r`, when the checkout is absent),
over `effect/http`'s `HttpClient`. `list_starters` reads one committed file; `add_starter` resolves `registryDependencies`
transitively, refuses to replace a file that differs unless `force`, and answers the install commands, the test files and,
in a checkout, a warning when the project's `cssints` is not the version the items were generated from — the tarball
problem the smoke works around by rewriting dependency specs.

What the tool deliberately does not do is install: it answers `npm install …` / `npm install -D …` instead of running
them, because the version a consumer wants is theirs to choose and a checkout wants its own tarballs. That was found the
hard way: the first run of the real template failed on `Cannot find module '@cssints/mise-en-mode'` — the item needs it,
the template does not list it, and only the shadcn CLI installs the item's dependencies for you.

Verified on a fresh copy of `templates/solid-vite`: `add_starter({ names: ["select"] })` wrote 24 files (select, button,
theme and the shared kit files), the item's `npm install` commands installed the workspace's tarballs,
`select.browser.test.tsx` passed in Chromium (9 tests), a second call wrote nothing, and the warning was gone once the
versions matched. `test/tools.mjs` covers the same path offline — the repo registry, a temp project, the relative imports
of every written file resolving inside the written set, the second call, the refusal and `force`, and the same registry
over a local http server.
