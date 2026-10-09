// The sheet's source map points each class rule at the first css.* call that made it. Dev: Chrome's Styles pane shows
// that file and line beside the rule, through Vite's own CSS pipeline, with css.devSourcemap and LightningCSS. Build:
// the CSS asset's map (build.sourcemap), which bundle analysers read.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { originalPositionFor, TraceMap } from "@jridgewell/trace-mapping";
import { build, createServer } from "vite";

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

// Build: Vite writes the CSS asset with no map, so the plugin maps the final (minified) text, with build.sourcemap only.
const demo = `${import.meta.dirname}/../../../apps/demo`;
const cwd = process.cwd();
process.chdir(demo); // icons() reads @iconify-json/* from the project
const built = async (sourcemap) => {
  // the plugin from src, not the demo's config (cssints/vite there is dist)
  const out = await build({
    root: demo,
    configFile: false,
    logLevel: "error",
    plugins: [cssints()],
    css: { transformer: "lightningcss" },
    build: { cssMinify: "lightningcss", write: false, sourcemap },
  });
  const files = [out].flat().flatMap((o) => o.output);
  const css = files.find((f) => f.fileName.endsWith(".css"));
  return { css: String(css.source), map: files.find((f) => f.fileName === `${css.fileName}.map`) };
};
const on = await built(true);
const off = await built(false);
const hidden = await built("hidden");
process.chdir(cwd);
assert.equal(off.map, undefined);
assert.ok(!off.css.includes("sourceMappingURL"));
assert.ok(on.css.startsWith(off.css) && on.css.endsWith(".css.map */"), on.css.slice(-80));
assert.equal(hidden.css, off.css);
assert.equal(String(hidden.map.source), String(on.map.source));
const trace = new TraceMap(JSON.parse(String(on.map.source)));
assert.ok(
  trace.sources.some((s) => s.endsWith("src/components/Showcase.tsx")),
  trace.sources,
);
// a class rule maps to the call that made it (`padding("2rem")` in App.tsx); a token (`:root`, `@property`) maps nowhere
const rule = on.css.indexOf("{padding:2rem}");
const selector = on.css.lastIndexOf("}", rule) + 1;
const pos = originalPositionFor(trace, { line: 1, column: selector });
const src = readFileSync(resolve(demo, "dist/assets", pos.source), "utf8").split("\n")[
  pos.line - 1
];
assert.match(src.slice(pos.column), /^[\w.]+\(.*2rem/, `${pos.source}:${pos.line}: ${src}`);
assert.equal(
  originalPositionFor(trace, { line: 1, column: on.css.indexOf("@property") }).source,
  null,
);
console.log(`sheet map ok; build: ${trace.sources.length} sources`);
process.exit(0);
