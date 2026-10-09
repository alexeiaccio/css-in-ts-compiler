---
# cssints-p3d2
title: 'Engine entry points for the MCP: contrast, lowering, located warnings, targets per root, shipped docs'
status: todo
type: task
priority: low
created_at: 2026-10-09T09:15:41Z
updated_at: 2026-10-09T09:15:41Z
---

Found by @cssints/mcp (cssints-w57u, "## Engine gaps"); each is worked around inside packages/mcp.
- cssints does not export its contrast maths (src/color.ts): check_contrast repeats ~20 lines.
- loweredOf (what LightningCSS converts for older targets) is not exported, so check_support answers by raw BCD while a build drops some of those warnings.
- A support warning is said once per class per process, with no line/column; the MCP remembers warnings per class and calls the plugin's hotUpdate to repeat them.
- Browser targets are read once at process start from the cwd, not per project root.
- docs/API.md is not in the published cssints package, so search_docs in a user project reads only READMEs.

## Todo
- [ ] export contrast and loweredOf from a public entry
- [ ] warnings with a location, repeatable per build (an API, not hotUpdate)
- [ ] targets per root
- [ ] ship docs/API.md in the cssints package (or a docs subpath)
