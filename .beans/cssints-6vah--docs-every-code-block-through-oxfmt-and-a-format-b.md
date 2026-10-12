---
# cssints-6vah
title: 'Docs: every code block through oxfmt, and a Format button in the playground'
status: in-progress
type: feature
created_at: 2026-10-12T16:18:30Z
updated_at: 2026-10-12T16:18:30Z
---

User (2026-10-12): all code blocks must go through oxfmt formatting; the playground gets a format button too.

- [ ] the code blocks of the docs (README.md, docs/API.md, package READMEs, apps/docs/examples projects, CHANGELOG fences) are formatted by oxfmt (embedded code in markdown) and the repo checks it (vp fmt --check or a test); the ts blocks still pass docs.mjs (a line ending in // error must still fail; fence ts skip), the README example still equals examples/install
- [ ] the playground has a Format button (and a keyboard shortcut) formatting the current file with oxfmt in the browser if a wasm build exists (check the oxc packages), else with Monaco's TypeScript formatter set to the same options (state it); css files too if cheap
- [ ] tests (playground.mjs: the button formats a messy file to the oxfmt output, undo works), docs, wayfinder paragraph
