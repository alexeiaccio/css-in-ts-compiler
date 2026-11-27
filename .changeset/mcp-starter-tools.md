---
"@cssints/mcp": minor
---

Two tools over the starter kit. `list_starters` answers from the registry behind ui.cssints.dev — each item's name,
title, what it is, its npm dependencies, the starters its files import, the files it writes and the conformance test it
brings — and `add_starter` writes one into a project: its files, the starters they need, and their shared theme,
tokens, sheet and browser-test config, then the `npm install` commands and the tests to run. The files, paths and
contents are the ones `npx shadcn add @cssints/<name>` writes from the same registry; the tool needs no npx and no
prompt. A file that exists with a different content is refused unless `force`, so an edited `theme.ts` survives, and in a
checkout the answer warns when the project's `cssints` is not the one the items were generated from.
