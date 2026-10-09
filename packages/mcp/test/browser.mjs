// inspect_element and why_property on apps/demo's dev server in Chromium (playwright-core), on cases of
// packages/devtools/test/browsers.mjs: hover and a media query in one layer, @container, an unlayered user rule (✗).
// Needs a Chromium: npx playwright-core install chromium. Run: node test/browser.mjs
import assert from "node:assert/strict";
import { join } from "node:path";

import { createServer } from "vite";

import { connect } from "./client.mjs";

const demo = join(import.meta.dirname, "../../../apps/demo");
// the demo reads @iconify-json/mdi from the working directory
process.chdir(demo);
const server = await createServer({
  root: demo,
  configFile: join(demo, "vite.config.ts"),
  logLevel: "silent",
  server: { port: 5391 },
});
await server.listen();
const url = server.resolvedUrls.local[0];

const client = await connect();
const call = async (name, args) => {
  const r = await client.callTool({ name, arguments: { url, ...args } });
  return r.isError ? { error: r.content[0].text } : r.structuredContent;
};
const prop = (r, name) => r.properties.find((p) => p.property === name);

// hover and a media query in one layer, at 1280 px: hovered, the hover wins by specificity
const hm = "[data-case=hover-md]";
let r = await call("inspect_element", { selector: hm, hover: true });
assert.equal(r.error, undefined, r.error);
assert.match(r.element, /^a\[data-case="hover-md"\]$/);
let color = prop(r, "color");
assert.match(color.winner.selector, /:hover$/);
assert.equal(color.winner.layer, "_.b");
assert.match(color.winner.site, /^src\/components\/Inspect\.tsx:\d+:\d+$/);
assert.deepEqual(
  color.verification.map((v) => [v.check, v.computed]),
  [["✓", "rgb(220, 38, 38)"]],
);
assert.equal(color.overridden.length, 1);
assert.match(color.overridden[0].beatenBy, /^specificity \(0,2,0\) over \(0,1,0\)$/);
assert.match(r.groups[0].site, /^src\/components\/Inspect\.tsx:\d+:\d+$/);
// not hovered: the query wins, the hover is listed with the state that fails
r = await call("inspect_element", { selector: hm });
color = prop(r, "color");
assert.equal(color.winner.declaration, "color: #2563eb");
assert.deepEqual(color.winner.conditions, ["@media (width >= 40rem)"]);
assert.deepEqual(
  color.inactive.map((i) => i.failing),
  [[":hover"]],
);
assert.equal(color.verification[0].check, "✓");
// a narrow viewport: neither applies
const narrow = await call("why_property", { selector: hm, property: "color", width: 400 });
assert.equal(narrow.winner, undefined);
assert.match(narrow.note, /applies now/);
assert.deepEqual(
  narrow.inactive.map((i) => i.conditions.filter((c) => !c.holds).map((c) => c.text)).sort(),
  [[":hover"], ["@media (width >= 40rem)"]],
);

// @container: one class in a narrow and a wide box
const box = async (which) =>
  call("why_property", {
    selector: `[data-box=${which}] p`,
    property: "backgroundColor",
    width: 1280,
  });
const wide = await box("wide");
assert.equal(wide.winner.declaration, "background-color: #dbeafe");
assert.equal(wide.verification.check, "✓");
assert.ok(
  wide.inactive.some((i) => i.conditions.some((c) => /@container card/.test(c.text) && !c.holds)),
);
assert.equal((await box("narrow")).winner.declaration, "background-color: #fee2e2");

// an unlayered rule of the user beats the class: ✗, with the reason
const u = await call("why_property", { selector: "[data-case=unlayered]", property: "color" });
assert.equal(u.computed, "rgb(22, 163, 74)");
assert.equal(u.verification.check, "✗");
assert.match(
  u.verification.reason,
  /\.mine \{ color: .* in src\/components\/inspect\.css .*outside every layer/,
);

// a property no cssints rule sets; an element that is not there
const none = await call("why_property", { selector: hm, property: "z-index" });
assert.match(none.note, /no cssints rule sets z-index/);
assert.match((await call("inspect_element", { selector: "[data-case=nope]" })).error, /no element/);

await client.close();
await server.close();
console.log("browser: ok");
process.exit(0);
