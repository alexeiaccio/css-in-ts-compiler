// A dev server: a module edited so that it no longer imports cssints loses its rules, kernels, globals, layers, themes and
// checks, and gets them back when the import returns. Run: node dev-drop.mjs
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

process.env.BROWSERSLIST = "chrome 130, firefox 130, safari 18";
const { createLogger, createServer } = await import("vite");
const { default: cssints } = await import("../src/plugin.ts");

const root = import.meta.dirname;
const server = await createServer({
  root,
  configFile: false,
  customLogger: createLogger("error"),
  server: { middlewareMode: true, watch: null },
  plugins: cssints(),
});
const client = server.environments.client;
const state = globalThis.__cssints;
const tmp = mkdtempSync(join(root, ".tmp-drop-"));
const file = join(tmp, "styles.ts");
const SHEET = "\0virtual:cssints.css";

const withStyles = `import * as css from "cssints" with { type: "cssints" };
import { look } from "../fixtures/seam-look.ts" with { type: "cssints" };
export const a = css.p(2);
export const dark = look("dark", "app", { "--drop-bg": "#000" });
css.layers("app", "viewer");
const t = css.createTokens({ drop: { $type: "color", fg: { $value: "#ffffff" }, bg: { $value: "#000000" } } });
css.createGlobalTheme(t, ".drop", { drop: { bg: "#111111" } }, { layer: "app" });
css.check.contrast(t.drop.fg, t.drop.bg, { min: 4.5 });
`;
const without = `export const a = "plain";\n`;

const edit = async (text) => {
  writeFileSync(file, text);
  server.watcher.emit("change", file);
  await sleep(300);
  await client.transformRequest(`/${tmp.split("/").pop()}/styles.ts`);
  const sheet = await client.transformRequest(SHEET);
  return JSON.parse(sheet.code.match(/const __vite__css = (".*")/)[1]);
};
const holds = (css) => ({
  rule: css.includes("padding"),
  global: css.includes("--drop-bg"),
  layer: css.includes("@layer app"),
  theme: css.includes(".drop"),
});
const mine = (m) => [...m.values()].some((e) => e.at?.file === file || e.file === file);

try {
  let css = await edit(withStyles);
  assert.deepEqual(holds(css), { rule: true, global: true, layer: true, theme: true }, css);
  assert.ok(mine(state.themed) && mine(state.checks), "the module's themes and checks are known");

  css = await edit(without);
  assert.deepEqual(holds(css), { rule: false, global: false, layer: false, theme: false }, css);
  assert.ok(!mine(state.themed) && !mine(state.checks), "its themes and checks are forgotten");
  for (const entries of [state.kernels, state.runtimes, state.globals, state.layers])
    for (const e of entries.values()) assert.ok(!e.users.has(file), "no entry lists it as a user");

  css = await edit(withStyles);
  assert.deepEqual(holds(css), { rule: true, global: true, layer: true, theme: true }, css);
} finally {
  rmSync(tmp, { recursive: true, force: true });
  await server.close();
}
console.log("dev drop: a module that loses its cssints import loses its rules, and gets them back ok");
process.exit(0);
