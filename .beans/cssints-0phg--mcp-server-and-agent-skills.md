---
# cssints-0phg
title: MCP server and agent skills
status: completed
type: epic
priority: normal
created_at: 2026-10-09T08:45:25Z
updated_at: 2026-10-09T12:25:43Z
---

MCP server and agent skills for cssints (asked 2026-10-09). The MCP has three parts: static checks (no app), the live app (its dev server) and a browser inspector; the last two reuse the devtools overlay's class table and cascade core (cssints-cncb). Skills for three audiences: users of cssints, plugin authors, contributors to this repo.

## Summary of Changes
@cssints/mcp (stdio, effect/ai McpServer): static tools (check_declaration, check_support, check_contrast, compile, search_docs, list_plugins), live tools on a dev server with devtools: true (explain_class, module_styles, dev_errors) and a browser inspector on the devtools core (inspect_element, why_property). Skills: cssints and cssints-plugin shipped in the cssints package, cssints-contributor in .agents/skills (symlinked for Claude Code).
