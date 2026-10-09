# @cssints/mcp

An [MCP](https://modelcontextprotocol.io) server for [cssints](../../README.md): it lets a coding agent check its CSS the
way the build checks it, without running the app. It runs over stdio (`cssints-mcp`) and is built on `effect/ai`
`McpServer`. Logs go to stderr; stdout carries the protocol only.

## Tools

| Tool                | Answers                                                                                                                                                                  | Example                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `check_declaration` | ok, or the exact message the build gives: the property's grammar, value ranges, the prose rules of the specs                                                             | `{ "property": "padding", "value": "-1rem" }` → `padding: unexpected "-1rem" in "-1rem", expected <length-percentage [0,∞]>` |
| `check_support`     | the targets that lack a property or a feature of its value, with the BCD key, by the rule of the build's support warnings (`partial_implementation` counts as supported) | `{ "property": "textWrap", "value": "balance", "query": "chrome 109" }` → `css.properties.text-wrap`, lacking `chrome 109`   |
| `check_contrast`    | the WCAG 2.x ratio as `css.check.contrast` computes it (cut, not rounded, at two places), and whether it meets `min`                                                     | `{ "foreground": "#777", "background": "white", "min": 4.5 }` → `contrast 4.47 is below 4.5`                                 |
| `compile`           | a module through the real plugin: its class strings, the CSS it adds to the sheet, the transformed code, errors (`file:line:col` of the call) and warnings               | `{ "file": "src/Button.tsx" }`, or `{ "file": "src/Card.ts", "source": "..." }` for text that is not saved                   |
| `search_docs`       | the matching sections of docs/API.md, README.md and the plugin READMEs: file, line, heading trail, an excerpt                                                            | `{ "query": "firstThatWorks fallback" }`                                                                                     |
| `list_plugins`      | the plugin packages, their members, what each does, the README                                                                                                           | `{}`                                                                                                                         |

`check_support` without `query` reads the project's browserslist (`package.json` `"browserslist"` or `.browserslistrc`,
found from the working directory), as the plugin does. `compile` starts a Vite dev server in middleware mode for the
project root (the `root` argument, else the working directory) on its first call and reuses it: the project's
`vite.config` is loaded when it has one (its aliases, its `cssints()` options), else the plugin alone; the project's own
`vite` and `cssints` are used when installed. Each call reads the module and what it imports again.

Installed in a project, `search_docs` and `list_plugins` read the READMEs of `cssints` and `@cssints/*` in
`node_modules`; run from this repository, they read docs/API.md, README.md and every package README.

## Install

```sh
bun add -d @cssints/mcp   # or: npm i -D @cssints/mcp
```

The client starts the server in the project's directory, so the working directory is the project root.

### opencode

`opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "cssints": {
      "type": "local",
      "command": ["npx", "cssints-mcp"],
      "enabled": true
    }
  }
}
```

### Claude Code

```sh
claude mcp add cssints -- npx cssints-mcp
```

(`--scope project` writes it to `.mcp.json` for the whole team.)

### Cursor

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "cssints": {
      "command": "npx",
      "args": ["cssints-mcp"]
    }
  }
}
```

In this repository, use `node packages/mcp/src/bin.ts` as the command (Node 22.18 or later runs the TypeScript sources).

## Development

```sh
cd packages/mcp
bun run test        # test/tools.mjs: every tool through an in-process MCP client; test/stdio.mjs: the bin over stdio
bun run typecheck
```
