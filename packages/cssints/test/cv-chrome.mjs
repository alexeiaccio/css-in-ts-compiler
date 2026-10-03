// cv() in Chrome: the classes `_cv` returns, with the sheet the plugin builds for fixtures/cv-cascade.ts, read with
// getComputedStyle. Not in `test` (needs Chrome installed). Run: node cv-chrome.mjs
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { createServer } from "vite";

const modules = join(import.meta.dirname, "../../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const { chromium } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);
const { default: cssints } = await import("../src/plugin.ts");
const { _cv } = await import("../src/runtime.ts");

const plugins = cssints();
const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  logLevel: "silent",
  server: { middlewareMode: true, watch: null },
  plugins,
});
const out = (await server.environments.client.transformRequest("/fixtures/cv-cascade.ts")).code;
const css = await plugins[0].api.sheet([`${import.meta.dirname}/fixtures/cv-cascade.ts`]);
await server.close();
const cvIn = (n) =>
  _cv(new Function(`return ${new RegExp(`export const ${n} = _cv\\((\\{[\\s\\S]*?\\n\\})\\);`).exec(out)[1]}`)());

const cases = [
  ["same", {}, { color: "rgb(255, 0, 0)" }],
  ["same", { tone: "blue" }, { color: "rgb(0, 0, 255)" }],
  ["covers", {}, { paddingLeft: "8px" }],
  ["covers", { size: "lg" }, { paddingLeft: "16px", paddingRight: "16px" }],
  ["inside", {}, { borderBottomColor: "rgb(255, 0, 0)" }],
  ["inside", { active: "yes" }, { borderBottomColor: "rgb(0, 0, 255)", borderTopColor: "rgb(255, 0, 0)" }],
  ["layered", { tone: "blue" }, { color: "rgb(255, 0, 0)" }],
];
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
await page.setContent(
  `<style>${css}</style>${cases.map(([n, p], i) => `<div id="e${i}" class="${cvIn(n)(p)}">x</div>`).join("")}`,
);
for (const [i, [n, p, want]] of cases.entries()) {
  const got = await page.$eval(`#e${i}`, (el, keys) => {
    const s = getComputedStyle(el);
    return Object.fromEntries(keys.map((k) => [k, s[k]]));
  }, Object.keys(want));
  assert.deepEqual(got, want, `${n} ${JSON.stringify(p)}`);
}
await browser.close();
console.log("cv chrome ok");
