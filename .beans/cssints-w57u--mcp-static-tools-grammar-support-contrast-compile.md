---
# cssints-w57u
title: 'MCP: static tools (grammar, support, contrast, compile, docs)'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-09T08:45:25Z
updated_at: 2026-10-09T09:03:52Z
parent: cssints-0phg
---

@cssints/mcp, the tools that need no running app, on Effect's MCP server support (verify the module in packages/cssints/node_modules/effect: effect-smol has an unstable ai/McpServer).

## Todo
- [x] check a declaration (property + value) with the same twin and prose rules as the build; the message the build would give
- [x] support of a property/value for given (or the project's browserslist) targets, by BCD, as the support warnings say
- [x] contrast of two colours (WCAG 2, as check.contrast)
- [ ] compile a module (file path or source) through the plugin: classes, emitted CSS, errors and warnings with locations
- [ ] search docs/API.md, README and the plugin packages' READMEs; list plugin packages and their members
- [ ] stdio transport, a bin, README with the config for opencode / Claude Code / Cursor
- [ ] tests: each tool through an MCP client in-process
