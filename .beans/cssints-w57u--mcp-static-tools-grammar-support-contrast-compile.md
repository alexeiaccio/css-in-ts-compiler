---
# cssints-w57u
title: 'MCP: static tools (grammar, support, contrast, compile, docs)'
status: completed
type: feature
priority: normal
created_at: 2026-10-09T08:45:25Z
updated_at: 2026-10-09T09:14:25Z
parent: cssints-0phg
---

@cssints/mcp, the tools that need no running app, on Effect's MCP server support (verify the module in packages/cssints/node_modules/effect: effect-smol has an unstable ai/McpServer).

## Todo
- [x] check a declaration (property + value) with the same twin and prose rules as the build; the message the build would give
- [x] support of a property/value for given (or the project's browserslist) targets, by BCD, as the support warnings say
- [x] contrast of two colours (WCAG 2, as check.contrast)
- [x] compile a module (file path or source) through the plugin: classes, emitted CSS, errors and warnings with locations
- [x] search docs/API.md, README and the plugin packages' READMEs; list plugin packages and their members
- [x] stdio transport, a bin, README with the config for opencode / Claude Code / Cursor
- [x] tests: each tool through an MCP client in-process

## Library

effect 4.0.0 ships `effect/ai` McpServer (Tool, Toolkit, McpServer.toolkit, layerStdio, McpProtocol v2024-11-05 to v2025-11-25): used as is, tools are `Tool.make` with Schema parameters and success schemas (MCP inputSchema/outputSchema come from them), failures a `ToolError` (Data.TaggedError, `Schema.instanceOf`) that the server turns into an `isError` result with its message. `@effect/platform-node` 4.0.0 gives NodeStdio and NodeRuntime for the bin. `@modelcontextprotocol/sdk` is a devDependency only: the test client (in-process over `Stdio.layerTest`, and the stdio e2e).

## Engine gaps

- cssints does not export the contrast maths (src/color.ts `luminance`, `ratio`): check_contrast repeats those lines on culori/fn (same modes, sRGB clip, translucent refused, ratio cut at two places); a test compiles a failing `check.contrast` and checks the build names the same ratio.
- cssints does not export `loweredOf` (src/lowered.ts): check_support gives the BCD answer and does not drop what LightningCSS lowers for the targets, as a build does (its `rule` says so; compile gives the build's warnings).
- A support warning is said once per class per process (macro.ts `fresh`), and `ctx.warn` gets a string without a location: compile remembers support warnings per class (matched by `property:value` in the module's CSS) so a second compile says them again; warnings carry the file, not line:col.
- The browserslist targets are read once per process from process.cwd() (support.ts DEFAULT, plugin.ts `targets`): check_support without a query and compile with another `root` use the targets of the server's working directory.
- There is no public way to say warnings again: compile calls the plugin's own `hotUpdate` (as after an edit) with a context of the client environment.
- docs/API.md is not in the published cssints package: installed in a project, search_docs reads the READMEs of cssints and @cssints/*, and list_plugins reads package.json descriptions and the names each README imports.

## Summary of Changes

packages/mcp, `@cssints/mcp`, bin `cssints-mcp` (src/bin.ts; publishConfig points at dist/bin.mjs from `vp pack`):
- src/server.ts: the Toolkit of six tools (descriptions for an agent, each with an example) and `layer` (McpServer.layerStdio, logs to stderr).
- src/check.ts: check_declaration on css-grammar `checkDeclaration` (twin, ranges, prose rules: the build's message); check_support on support.ts `targets`/`support`/`messageOf` (BCD keys, lacking targets, the warnings' partial_implementation rule).
- src/contrast.ts: check_contrast.
- src/compile.ts: `Compiler` service, a Vite dev server per root (middleware mode, no watcher/ws/hmr, the project's vite.config when there is one, the project's vite and cssints/vite when installed), kept for the session and closed at its end; one compile at a time; source text for a file that need not exist through a pre plugin; classes, the module's sheet (`api.sheet`), code, errors with file:line:col, warnings.
- src/docs.ts: search_docs (markdown sections outside code fences, ranked by terms matched, heading trail, excerpt) and list_plugins (the API.md table).
- bin: stdout is the protocol only (console.log of evaluated user code goes to stderr); stops when stdin closes.
- test/tools.mjs (every tool, good and bad inputs, fixtures/), test/stdio.mjs (the bin spawned, the project's browserslist from cwd, repeated warnings, a module that logs); README with opencode, Claude Code and Cursor configs.

Coordinator: add packages/mcp to AGENTS.md layout and the docs/API.md packages table if wanted. `bun run typecheck` reports 31 `unstableApiUsage` warnings (effect/ai is unstable), no errors.
