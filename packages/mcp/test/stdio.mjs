// End to end: the bin as a client launches it (a child process, JSON-RPC over stdio), one call of each kind of tool.
// stdout must carry nothing but the protocol. Run: node test/stdio.mjs
import assert from "node:assert/strict";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [`${import.meta.dirname}/../src/bin.ts`],
  cwd: `${import.meta.dirname}/fixtures`,
  stderr: "pipe",
});
let stderr = "";
transport.stderr.on("data", (d) => (stderr += d));
const client = new Client({ name: "cssints-mcp-e2e", version: "0" });
await client.connect(transport);

assert.equal(client.getServerVersion().name, "cssints");
assert.equal((await client.listTools()).tools.length, 6);
const r = await client.callTool({
  name: "check_declaration",
  arguments: { property: "padding", value: "-1rem" },
});
assert.equal(r.structuredContent.ok, false);
// the cwd is the project: its browserslist (chrome 109) and its files
const support = await client.callTool({
  name: "check_support",
  arguments: { property: "textWrap" },
});
assert.equal(support.structuredContent.targets, "chrome 109");
const compiled = await client.callTool({ name: "compile", arguments: { file: "button.ts" } });
assert.equal(compiled.structuredContent.ok, true, stderr);
assert.deepEqual(
  compiled.structuredContent.warnings.map((w) => w.message),
  [
    'text-wrap: the property in "balance" is not supported by chrome 109 (css.properties.text-wrap)',
  ],
);
// said again on the next compile, though the engine says a support warning once per class per process
const again = await client.callTool({ name: "compile", arguments: { file: "button.ts" } });
assert.deepEqual(
  again.structuredContent.warnings.map((w) => w.message),
  compiled.structuredContent.warnings.map((w) => w.message),
);
// a module that logs while it is evaluated: its output goes to stderr, the protocol survives
const logged = await client.callTool({
  name: "compile",
  arguments: {
    file: "log.ts",
    source: `import { css } from "cssints" with { type: "cssints" };\nconsole.log("hello from user code");\nexport const a = css.gap("1px");\n`,
  },
});
assert.equal(logged.structuredContent.ok, true);
assert.equal((await client.callTool({ name: "list_plugins", arguments: {} })).isError, false);

await client.close();
assert.match(stderr, /hello from user code/);
console.log("stdio: ok");
