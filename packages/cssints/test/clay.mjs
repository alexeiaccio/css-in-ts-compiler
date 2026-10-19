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

// states, tokens, a theme, fonts
const themed = { ...(await exportsOf("clay-themed.ts")) };
const RGB = (r, g, b) => ({ r, g, b, a: 255 });
assert.deepEqual(themed.font, { fonts: ["Roboto", "Mono"] });
// a state's overlay: the fields it sets, at their values over the base (all four sides of a padding; a border colour
// with the base's width); justify-content is y in a column
assert.deepEqual(themed.button[":hover"], {
  layout: { padding: { left: 4, right: 4, top: 8, bottom: 4 } },
  border: { color: RGB(255, 0, 0), width: { left: 0, right: 0, top: 0, bottom: 0 } },
});
assert.deepEqual(themed.button[":active"], {
  layout: { childAlignment: { y: "CENTER" } },
  backgroundColor: RGB(255, 255, 255),
});
assert.deepEqual(themed.button.backgroundColor, RGB(36, 40, 52)); // a token at its own value
// a theme: the colours it changes, in the base and in each state
assert.deepEqual(themed.button.themes, {
  light: { backgroundColor: RGB(240, 240, 245), ":active": { backgroundColor: RGB(0, 0, 0) } },
});
assert.deepEqual(themed.label, {
  text: { textColor: RGB(255, 255, 255), fontId: 1, fontSize: 14 },
  themes: { light: { text: { textColor: RGB(0, 0, 0) } } },
});
assert.deepEqual(themed.plain.clip, { horizontal: 0, vertical: 0 });

const th = header(themed);
assert.ok(!/\bt\b =/.test(th), th); // the tokens are no declaration
assert.match(th, /enum \{ font_Roboto = 0, font_Mono = 1 \};/);
const decl = (name) => new RegExp(`Clay_ElementDeclaration ${name} = (.*);`).exec(th)?.[1];
// a state is the whole declaration: the base's width and padding sides are in it
assert.match(
  decl("button_hover"),
  /\.minMax = \{ 200, 200 \}.*\.top = 8.*\.border = \{ \.color = \{ \.r = 255/,
);
assert.match(
  decl("button_active"),
  /\.childAlignment = \{ \.y = CLAY_ALIGN_Y_CENTER \}.*\.r = 255, \.g = 255/,
);
// a theme: every style again, its states too
assert.match(decl("button_light"), /\.backgroundColor = \{ \.r = 240, \.g = 240, \.b = 245/);
assert.match(
  decl("button_hover_light"),
  /\.r = 240, \.g = 240.*\.top = 8|\.top = 8.*\.r = 240, \.g = 240/,
);
assert.match(decl("button_active_light"), /\.backgroundColor = \{ \.r = 0, \.g = 0, \.b = 0/);
assert.match(
  th,
  /Clay_TextElementConfig label_text_light = \{ \.textColor = \{ \.r = 0, \.g = 0, \.b = 0, \.a = 255 \}, \.fontId = 1/,
);
assert.ok(decl("plain_light"), th); // a style with no token has the theme's name too
// a module with no theme has no themed names
assert.ok(!h.includes("_light"), h);

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
await fails(
  `export const a = css.hover(css.active(css.bg("red")));`,
  /:hover wraps :active: Clay states do not nest/,
);
const WEB = `import * as web from "cssints" with { type: "cssints" };\nexport const w = web.createTokens({ paper: { $type: "color", $value: "red" } });\n`;
const CLAY = `export const t = css.createTokens({ ink: { $type: "color", $value: "red" } });\n`;
await fails(
  `${WEB}css.createGlobalTheme(w, "light", { paper: "blue" });`,
  /these are web tokens of "cssints": a theme of "cssints\/clay" takes the tokens of its own createTokens/,
);
await fails(
  `${WEB}${CLAY}web.createGlobalTheme(t, ".light", { ink: "blue" });`,
  /these are Clay tokens of "cssints\/clay": theme them with the createGlobalTheme of "cssints\/clay"/,
);
await fails(
  `${WEB}export const a = css.bg(w.paper);`,
  /--paper is no token of the createTokens of cssints\/clay/,
);
await fails(
  `${CLAY}css.createGlobalTheme(t, ".light", { ink: "blue" });`,
  /a name that is a C identifier.*got the name "\.light"/,
);
await fails(
  `export const t = css.createTokens({ gap: { $type: "dimension", $value: "4px" } });\nexport const a = css.bg(t.gap);`,
  /bg: gap is a length token, not a colour/,
);
await fails(
  `export const f = css.fonts("Roboto", "Roboto");`,
  /fonts\(\): "Roboto" is there twice/,
);
await fails(`export const f = css.fonts("Roboto Mono");`, /each a C identifier, got "Roboto Mono"/);
await fails(`export const f = css.fonts();`, /got nothing/);

await server.close();
console.log("clay: ok");
