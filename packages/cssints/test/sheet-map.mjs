// Dev: the sheet's source map points each class rule at the first css.* call that made it (Chrome's Styles pane shows
// that file and line beside the rule). Through Vite's own CSS pipeline, with css.devSourcemap and LightningCSS.
import assert from "node:assert/strict";

import { originalPositionFor, TraceMap } from "@jridgewell/trace-mapping";
import { createServer } from "vite";

import cssints from "../src/plugin.ts";

const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  logLevel: "warn",
  server: { middlewareMode: true, watch: null },
  css: { devSourcemap: true, transformer: "lightningcss" },
  plugins: [cssints()],
});
const client = server.environments.client;
await client.transformRequest("/fixtures/risk5.ts");
const { code } = await client.transformRequest("virtual:cssints.css");
const css = JSON.parse(code.match(/const __vite__css = (".*")/)[1]);
const map = JSON.parse(
  Buffer.from(
    css.match(/sourceMappingURL=data:application\/json;base64,(\S+)/)[1],
    "base64",
  ).toString(),
);
const lines = css.split("\n");
// the rule's selector: the line above its declaration once LightningCSS has printed the sheet
const at = (decl) => {
  const line = lines.findIndex((l, i) => lines[i + 1]?.includes(decl) || l.startsWith(decl)) + 1;
  assert.ok(line, `${decl} is in the sheet`);
  const column = lines[line - 1].search(/\S/);
  return originalPositionFor(new TraceMap(map), { line, column });
};
// css.p(4) first appears in `const pad = css.p(4);` (line 4), css.m(2) in `cx(css.p(4), on && css.m(2))` (line 8)
for (const [decl, line, column] of [
  ["padding: 1rem", 4, 12],
  ["margin: .5rem", 8, 59],
]) {
  const pos = at(decl);
  assert.match(pos.source ?? "", /fixtures\/risk5\.ts$/, `${decl}: ${JSON.stringify(pos)}`);
  assert.deepEqual([pos.line, pos.column], [line, column], decl);
}
// a line with no class (the layer statement) maps nowhere
assert.equal(at("@layer _.k").source, null);
await server.close();
console.log("sheet map ok");
process.exit(0);
