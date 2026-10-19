// cssints/clay through the engine: a site becomes an object literal shaped as Clay's structs, and header() prints those
// as C initializers; then the build errors of what Clay cannot do.
// Run: node clay.mjs
import assert from "node:assert/strict";
import { rmSync, writeFileSync } from "node:fs";

import { createServer } from "vite";

import { header } from "../src/clay.ts";
import cssints from "../src/plugin.ts";

const root = `${import.meta.dirname}/fixtures`;
const server = await createServer({
  root,
  configFile: false,
  logLevel: "silent",
  resolve: { conditions: ["development", "module", "browser", "default"] },
  ssr: { resolve: { conditions: ["development", "module", "node", "default"] } },
  server: { middlewareMode: true, watch: null, ws: false },
  plugins: cssints(),
});
// a file per case: the server has no watcher, so a rewritten file would keep its first evaluation
let n = 0;
const code = async (source) => {
  const f = `.clay-bad-${n++}.ts`;
  writeFileSync(`${root}/${f}`, source);
  try {
    return (await server.environments.client.transformRequest(`/${f}`)).code;
  } finally {
    rmSync(`${root}/${f}`);
  }
};
const exportsOf = async (f) => {
  const { code } = await server.environments.client.transformRequest(`/${f}`);
  assert.ok(!code.includes("cssints/clay"), code); // nothing of the members ships
  return import(`data:text/javascript,${encodeURIComponent(code)}`);
};

const styles = { ...(await exportsOf("clay.ts")) };
assert.deepEqual(styles.pill, {
  layout: {
    sizing: {
      width: { type: "FIXED", min: 200, max: 200 },
      height: { type: "FIXED", min: 38, max: 38 },
    },
    childAlignment: { x: "CENTER", y: "CENTER" },
  },
  backgroundColor: { r: 36, g: 40, b: 52, a: 255 },
  cornerRadius: { topLeft: 19, topRight: 19, bottomRight: 19, bottomLeft: 19 },
  border: {
    color: { r: 150, g: 155, b: 170, a: 255 },
    width: { left: 1, right: 1, top: 1, bottom: 1 },
  },
});
// a column: justify-content is the y axis, align-items the x
assert.deepEqual(styles.page, {
  layout: {
    sizing: { width: { type: "GROW" }, height: { type: "PERCENT", percent: 1 } },
    padding: { left: 24, right: 24, top: 64, bottom: 0 },
    childGap: 6,
    layoutDirection: "TOP_TO_BOTTOM",
    childAlignment: { x: "CENTER", y: "TOP" },
  },
  clip: { horizontal: 1, vertical: 1 },
});
assert.deepEqual(styles.label, {
  text: {
    textColor: { r: 231, g: 127, b: 62, a: 128 },
    fontSize: 14,
    textAlignment: "CENTER",
    wrapMode: "NONE",
  },
});

const h = header(styles);
assert.match(
  h,
  /static const Clay_ElementDeclaration pill = \{ \.layout = \{ \.sizing = \{ \.width = \{ \.size = \{ \.minMax = \{ 200, 200 \} \}, \.type = CLAY__SIZING_TYPE_FIXED \}/,
);
assert.match(h, /\.percent = 1 \}, \.type = CLAY__SIZING_TYPE_PERCENT/);
assert.match(h, /\.layoutDirection = CLAY_TOP_TO_BOTTOM/);
assert.match(h, /\.childAlignment = \{ \.x = CLAY_ALIGN_X_CENTER, \.y = CLAY_ALIGN_Y_TOP \}/);
assert.ok(!h.includes("Clay_ElementDeclaration label "), h); // text only: no declaration
assert.match(
  h,
  /static const Clay_TextElementConfig label_text = \{ \.textColor = \{ \.r = 231, \.g = 127, \.b = 62, \.a = 128 \}, \.fontSize = 14, \.textAlignment = CLAY_TEXT_ALIGN_CENTER, \.wrapMode = CLAY_TEXT_WRAP_NONE \};/,
);

const fails = async (source, message) =>
  assert.rejects(
    code(`import * as css from "cssints/clay" with { type: "cssints" };\n${source}`),
    (e) => (assert.match(String(e.message), message), true),
  );
await fails(
  `export const a = css.width("10rem");`,
  /width: unexpected "10rem", expected a number of pixels/,
);
await fails(`export const a = css.p(1.5);`, /is not a whole number of pixels/);
await fails(`export const a = css.bg("blu");`, /"blu" is not a colour Clay can draw/);
await fails(
  `export const a = css.justifyContent("space-between");`,
  /expected flex-start \| start/,
);
await fails(`export const a = css.cn("x");`, /cn\(\) takes styles of cssints\/clay/);

await server.close();
console.log("clay: ok");
