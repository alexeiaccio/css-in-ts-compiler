// Every tool through an MCP client in-process (client.mjs), good and bad inputs, against fixtures/. Run: node test/tools.mjs
import assert from "node:assert/strict";

import { connect } from "./client.mjs";

const fixtures = `${import.meta.dirname}/fixtures`;
const client = await connect();
const call = async (name, args) => {
  const r = await client.callTool({ name, arguments: args });
  return r.isError ? { error: r.content[0].text } : r.structuredContent;
};

// tools/list: the names, each with a description an agent can act on
const { tools } = await client.listTools();
assert.deepEqual(tools.map((t) => t.name).sort(), [
  "check_contrast",
  "check_declaration",
  "check_support",
  "compile",
  "list_plugins",
  "search_docs",
]);
for (const t of tools) assert.match(t.description, /Example:/, t.name);

// ---------- check_declaration: the build's own message
assert.deepEqual(await call("check_declaration", { property: "fontSize", value: "1rem" }), {
  ok: true,
  property: "font-size",
  value: "1rem",
});
const range = await call("check_declaration", { property: "padding", value: "-1rem" });
assert.equal(range.ok, false);
assert.equal(
  range.message,
  'padding: unexpected "-1rem" in "-1rem", expected <length-percentage [0,∞]>',
);
const prose = await call("check_declaration", {
  property: "transition",
  value: "none, opacity 1s",
});
assert.match(prose.message, /"none" is only valid when it is the only transition/);
const vendor = await call("check_declaration", { property: "WebkitLineClamp", value: "3" });
assert.equal(vendor.property, "-webkit-line-clamp");
assert.equal(vendor.ok, true);
assert.equal((await call("check_declaration", { property: "colr", value: "red" })).ok, false);
assert.match((await call("check_declaration", { property: "color" })).error, /Missing key/);

// ---------- check_support: BCD keys, the warnings' rule
const balance = await call("check_support", {
  property: "textWrap",
  value: "balance",
  query: "chrome 109",
});
assert.equal(balance.supported, false);
assert.deepEqual(
  balance.lacking.map((w) => [w.feature, w.key, w.targets]),
  [["text-wrap", "css.properties.text-wrap", "chrome 109"]],
);
assert.equal(
  balance.lacking[0].message,
  'text-wrap: the property in "balance" is not supported by chrome 109 (css.properties.text-wrap)',
);
assert.match(balance.rule, /partial_implementation counts as supported/);
const value = await call("check_support", {
  property: "display",
  value: "grid",
  query: "chrome 50, chrome 120",
});
assert.deepEqual(
  value.lacking.map((w) => [w.feature, w.key, w.targets]),
  [["grid", "css.properties.display.grid", "chrome 50"]],
);
const fine = await call("check_support", { property: "color", query: "chrome 120" });
assert.equal(fine.supported, true);
assert.equal(fine.known, true);
assert.match((await call("check_support", { property: "color", query: "bogus 1" })).error, /bogus/);

// ---------- check_contrast: the ratio cut at two places
assert.deepEqual(
  await call("check_contrast", { foreground: "#777", background: "white", min: 4.5 }),
  { ok: false, ratio: "4.47", min: 4.5, message: "contrast 4.47 is below 4.5" },
);
assert.deepEqual(await call("check_contrast", { foreground: "black", background: "#fff" }), {
  ok: true,
  ratio: "21.00",
});
assert.equal(
  (await call("check_contrast", { foreground: "oklch(20% 0 0)", background: "white", min: 7 })).ok,
  true,
);
assert.match(
  (await call("check_contrast", { foreground: "rgb(0 0 0 / 50%)", background: "white" })).message,
  /is translucent/,
);
assert.match(
  (await call("check_contrast", { foreground: "currentColor", background: "white" })).message,
  /not a colour the check can read/,
);
assert.match(
  (await call("check_contrast", { foreground: "black", background: "white", min: 30 })).error,
  /Invalid parameters/,
);

// ---------- compile: the real plugin, one server for the session
const button = await call("compile", { file: "button.ts", root: fixtures });
assert.equal(button.ok, true, JSON.stringify(button.errors));
assert.equal(button.classes.length, 3);
assert.match(button.css, /\{padding:1rem\}/);
assert.match(button.code, /export const pad = "_\w+";/);
// the fixtures' browserslist is not the server's (cwd): the warnings of the targets the plugin read at startup
assert.ok(Array.isArray(button.warnings));

const bad = await call("compile", { file: "bad.ts", root: fixtures });
assert.equal(bad.ok, false);
assert.deepEqual(
  bad.errors.map((e) => [e.message, e.line, e.column]),
  [['padding: unexpected "-1rem" in "-1rem", expected <length-percentage [0,∞]>', 4, 20]],
);
assert.equal(bad.errors[0].location, `${fixtures}/bad.ts:4:20`);

// source text under a filename that does not exist; a relative import resolves from it
const source = await call("compile", {
  file: "virtual/card.ts",
  root: fixtures,
  source: `import { css } from "cssints" with { type: "cssints" };\nimport { pad } from "../button.ts";\nexport const card = css.gap("2px");\nexport const both = [pad, card];\n`,
});
assert.equal(source.ok, true, JSON.stringify(source.errors));
assert.match(source.css, /\{gap:2px\}/);
// unsaved text of an existing file wins over the disk
const edited = await call("compile", {
  file: "bad.ts",
  root: fixtures,
  source: `import { css } from "cssints" with { type: "cssints" };\nexport const fixed = css.padding("1rem");\n`,
});
assert.equal(edited.ok, true);
// and the disk is read again on the next call
assert.equal((await call("compile", { file: "bad.ts", root: fixtures })).ok, false);
assert.match((await call("compile", { file: "nope.ts", root: fixtures })).error, /does not exist/);

// check_contrast is the build's ratio: a failing css.check.contrast names the same number
const contrast = await call("compile", { file: "contrast.ts", root: fixtures });
assert.match(contrast.errors[0].message, /contrast 4\.47 is below 4\.5: c\.fg #777 on c\.bg #fff/);
assert.equal(
  (await call("check_contrast", { foreground: "#777", background: "#fff" })).ratio,
  "4.47",
);

// ---------- search_docs, list_plugins: this repo's docs
const docs = await call("search_docs", { query: "firstThatWorks fallback", limit: 3 });
assert.equal(docs.results.length, 3);
assert.match(docs.results[0].heading, /^Fallbacks: `firstThatWorks`/);
assert.match(docs.results[0].file, /docs\/API\.md$/);
assert.match(docs.results[0].excerpt, /firstThatWorks/);
assert.ok(docs.sources.some((f) => f.endsWith("packages/fluid/README.md")));
const readme = await call("search_docs", { query: "WCAG 1.4.4 zoom" });
assert.ok(readme.results.some((r) => r.file.endsWith("packages/fluid/README.md")));
assert.deepEqual((await call("search_docs", { query: "zzzqqqxx" })).results, []);
assert.match((await call("search_docs", { query: "x", limit: 0 })).error, /Invalid parameters/);
const { plugins } = await call("list_plugins", {});
const fluid = plugins.find((p) => p.name === "@cssints/fluid");
assert.match(fluid.members, /fluid\(min, max/);
assert.match(fluid.readme, /packages\/fluid\/README\.md$/);
assert.ok(plugins.length >= 15);

await client.close();
console.log("tools: ok");
process.exit(0);
