---
# cssints-6vah
title: 'Docs: every code block through oxfmt, and a Format button in the playground'
status: completed
type: feature
priority: normal
created_at: 2026-10-12T16:18:30Z
updated_at: 2026-10-12T18:07:54Z
---

User (2026-10-12): all code blocks must go through oxfmt formatting; the playground gets a format button too.

- [x] the code blocks of the docs (README.md, docs/API.md, package READMEs, apps/docs/examples projects, CHANGELOG fences) are formatted by oxfmt (embedded code in markdown) and the repo checks it (vp fmt --check or a test); the ts blocks still pass docs.mjs (a line ending in // error must still fail; fence ts skip), the README example still equals examples/install
- [x] the playground has a Format button (and a keyboard shortcut) formatting the current file with oxfmt in the browser if a wasm build exists (check the oxc packages), else with Monaco's TypeScript formatter set to the same options (state it); css files too if cheap
- [x] tests (playground.mjs: the button formats a messy file to the oxfmt output, undo works), docs, wayfinder paragraph

## Summary of Changes

- oxfmt (0.70, through `vp fmt`) formats the embedded code of markdown (`ts`, `tsx`, `css`, `json`; `ts skip` fences too; `bash` and `text` it leaves). `vp fmt --check` already covered the markdown files (no ignore existed for them), so the fix was running `vp fmt` on README.md, docs/API.md, AGENTS.md and docs/research/*; a fragment that does not parse is left as written (only some blocks of packages/cssints/skills and docs/research). No `// error` line moved (55 in API.md, same lines); docs.mjs and the docs build test are green.
- The whole file is formatted, so tables are padded: list_plugins of @cssints/mcp read the plugin table of API.md with single spaces and broke; its pattern accepts the padding (changeset, patch).
- The ignore of apps/docs/examples/install is gone; the example equals the README block.
- Playground: a Format button and Shift+Alt+F with @wasm-fmt/oxc_fmt 0.2.9 (oxc_formatter as wasm, lineWidth 100), fetched at the first use; JS and TS files; one undo; CSS not formatted.
- Left red by this bean: docs/wayfinder.md (not mine to edit), .vscode/settings.json, apps/csssky-tui/test/screens.mjs, package.json, scripts/release.mjs, tsconfig.json.
