// Dev with `devtools: true`: the page gets the overlay's entry, and the table comes over the HMR channel (cssints:devtools:get
// -> cssints:devtools), from the plugin's records: the sheet as load() renders it, each class's rule, plugin and sites.
// A transform of a module with sites sends cssints:devtools:stale. Without the option the plugin is not there.
import assert from "node:assert/strict";
import { on, once } from "node:events";

import { createServer } from "vite";

import cssints from "../src/plugin.ts";

assert.ok(!cssints().some((p) => p.name === "cssints:devtools"), "off unless asked for");
const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  logLevel: "warn",
  server: { port: 5287, watch: null },
  plugins: [cssints({ devtools: true })],
});
await server.listen();
const html = await server.transformIndexHtml("/", "<html><body></body></html>");
assert.match(html, /<script type="module" src="\/@id\/virtual:cssints\/devtools"><\/script>/);
const entry = await server.environments.client.transformRequest("virtual:cssints/devtools");
assert.match(entry.code, /not installed/, "cssints' own tests have no @cssints/devtools");

const ws = new WebSocket(
  `ws://localhost:${server.config.server.port}/?token=${server.config.webSocketToken}`,
  "vite-hmr",
);
const messages = on(ws, "message");
await once(ws, "open");
const next = async (event) => {
  for (;;) {
    const msg = JSON.parse((await messages.next()).value[0].data);
    if (msg.type === "custom" && msg.event === event) return msg.data;
  }
};

await server.environments.client.transformRequest("/fixtures/devtools.ts");
await next("cssints:devtools:stale");
ws.send(JSON.stringify({ type: "custom", event: "cssints:devtools:get" }));
const t = await next("cssints:devtools");

assert.deepEqual(t.layers, ["_.k", "_.a", "_.b", "_.c", "_.d", "_.e"]);
assert.match(t.sheet, /@layer _\.b \{/);
const byCss = (re) => Object.entries(t.classes).find(([, c]) => re.test(c.css));
const [hoverCls, hover] = byCss(/:hover\{color:red\}/);
assert.equal(hover.layer, "_.b");
assert.deepEqual(hover.wrap, []);
const [, md] = byCss(/\{color:blue\}/);
assert.deepEqual(md.wrap, ["@media (width >= 40rem)"]);
const [, ink] = byCss(/\{color:var\(--ink\)\}/);
assert.deepEqual(ink.tokens, ["--ink"]);
assert.equal(t.tokens["--ink"].value, "#111827");
const [, pad] = byCss(/--frame-p:/);
assert.equal(pad.plugin, "frame");
assert.deepEqual(
  { kind: t.classes["_frame-core"].kind, plugin: t.classes["_frame-core"].plugin },
  { kind: "marker", plugin: "frame.core" },
);
assert.equal(t.classes._g.kind, "group");
assert.match(byCss(/:where\(\._g:hover\)/)[1].css, /background-color:#eee/);
// the sites: `link` is line 8, its two classes come from that call
const site = t.sites[hover.sites[0]];
assert.match(site.file, /fixtures\/devtools\.ts$/);
assert.deepEqual([site.line, site.column], [8, 20]);
assert.ok(site.classes.includes(hoverCls) && site.classes.length === 2, site.classes.join());
assert.deepEqual(
  t.sites.map((s) => s.line),
  [7, 8, 9],
);

ws.close();
await server.close();
console.log("devtools server ok");
process.exit(0);
