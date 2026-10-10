// cssints/tui through the engine: a site becomes an object literal of terminal props (cells, hex colours, state overlays,
// the values each theme changes), in a dev transform and in an SSR build (a Bun app); the build errors of what a terminal
// cannot do; no class and no sheet entry. Writes the built styles to test/out/card.mjs for test/render.ts (Bun).
// Run: node --conditions=development test/tui.mjs
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

import cssints from "cssints/vite";
import { build, createServer } from "vite";

const root = `${import.meta.dirname}/fixtures`;
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  logLevel: "warn",
  server: { middlewareMode: true, watch: null, ws: false },
  plugins,
});
const code = async (f) => (await server.environments.client.transformRequest(`/${f}`)).code;
// the exported literals of a transformed module, evaluated
const exportsOf = async (f) => import(`data:text/javascript,${encodeURIComponent(await code(f))}`);

const card = await exportsOf("card.ts");
assert.deepEqual(card.button, {
  border: true,
  borderStyle: "rounded",
  borderColor: "#585b70",
  paddingTop: 0,
  paddingRight: 1,
  paddingBottom: 0,
  paddingLeft: 1,
  width: 12,
  height: 3,
  backgroundColor: "#1e1e2e",
  cursor: "pointer",
  ":hover": { backgroundColor: "#303140", borderColor: "#89b4fa" },
  ":active": { border: true, borderStyle: "double" },
  themes: {
    light: {
      backgroundColor: "#eff1f5",
      ":hover": { backgroundColor: "#f1f2f6", borderColor: "#1e66f5" },
    },
  },
  // the tokens of the colour props, for a theme of the run-time table (defineTheme)
  vars: {
    backgroundColor: "color-bg",
    ":hover": { backgroundColor: "color-hover", borderColor: "color-accent" },
  },
});
assert.deepEqual(card.label, {
  color: "#cdd6f4",
  bold: true,
  dim: false,
  underline: true,
  strikethrough: false,
  themes: { light: { color: "#4c4f69" } },
  vars: { color: "color-fg" },
});
assert.deepEqual(card.field, {
  caretShape: "bar",
  caretColor: "#f5e0dc",
  caretAnimation: "manual",
  ":focus": { backgroundColor: "#45475a" },
});
assert.deepEqual(card.layout, {
  flexDirection: "row",
  gap: 1,
  width: "50%",
  marginTop: "auto",
  marginRight: 2,
  marginBottom: "auto",
  marginLeft: 2,
  visible: false,
  zIndex: 2,
  opacity: 0.5,
});
assert.deepEqual(card.lit(), { color: "#ed7665" });
// nothing of cssints is left, and no class went to the sheet
const text = await code("card.ts");
assert.ok(!text.includes("cssints"), text);
assert.equal(plugins[0].api.sheet([`${root}/card.ts`]).includes("._"), false);

const fails = async (f, message) => {
  await assert.rejects(code(f), message);
};
await fails("bad-px.ts", /width: a terminal counts cells: write a number, not "10px"/);
await fails("bad-color.ts", /color: "currentColor" is not a colour a terminal can show/);
await fails("bad-nest.ts", /:hover wraps :focus: terminal states do not nest/);
await fails("bad-mix.ts", /cn\(\) takes styles of cssints\/tui, got "red"/);
await server.close();

// An SSR build, as a Bun app is built: the sites are replaced there too (the plugin evaluates them on its own server).
process.env.NODE_ENV = "development"; // the private server resolves cssints/tui from src (dist/ is built on master)
const out = await build({
  root,
  configFile: false,
  logLevel: "warn",
  plugins: cssints(),
  build: { ssr: "card.ts", write: false, minify: false },
});
const built = [out].flat()[0].output[0].code;
assert.ok(!built.includes("cssints"), built);
assert.match(built, /"borderStyle": "rounded"/);
mkdirSync(`${import.meta.dirname}/out`, { recursive: true });
writeFileSync(`${import.meta.dirname}/out/card.mjs`, built);

// The JSX of a component without sites stays the framework's in an SSR build (cssints-ybcm): no inert `__jsx` calls.
const app = await build({
  root,
  configFile: false,
  logLevel: "warn",
  plugins: cssints(),
  build: {
    ssr: "main.tsx",
    write: false,
    minify: false,
    rolldownOptions: { external: [/^react/] },
  },
});
const appCode = [app].flat()[0].output[0].code;
assert.ok(!appCode.includes("__jsx"), appCode);
assert.match(appCode, /"borderStyle": "rounded"/);
console.log("tui ok");
