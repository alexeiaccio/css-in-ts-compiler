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

// floating: Clay_FloatingElementConfig field for field; unset fields stay out (Clay's zero is the default)
const floats = { ...(await exportsOf("clay-float.ts")) };
const ID_UNITS = 3516868942; // Clay__HashString("Units", 0).id, read off the real clay.h
assert.deepEqual(floats.plain, { floating: { attachTo: "PARENT" } });
assert.deepEqual(floats.menu.floating, {
  offset: { x: 4, y: -2 },
  expand: { width: 2, height: 3 },
  parentId: ID_UNITS,
  zIndex: 10,
  attachPoints: { element: "LEFT_TOP", parent: "LEFT_BOTTOM" },
  pointerCaptureMode: "PASSTHROUGH",
  attachTo: "ELEMENT_WITH_ID",
  clipTo: "ATTACHED_PARENT",
});
assert.deepEqual(floats.dialog.floating, {
  zIndex: 100,
  attachPoints: { element: "CENTER_CENTER", parent: "CENTER_CENTER" },
  attachTo: "ROOT",
});
// the second float names no parent, so it keeps the first's; an offset side it leaves out is 0
assert.deepEqual(floats.merged.floating, {
  offset: { x: 0, y: 8 },
  parentId: ID_UNITS,
  zIndex: 1,
  attachTo: "ELEMENT_WITH_ID",
});
assert.equal(floats.tip.floating, undefined);
assert.deepEqual(floats.tip[":hover"], {
  floating: { attachPoints: { element: "LEFT_TOP", parent: "CENTER_TOP" }, attachTo: "PARENT" },
});

const fh = header(floats);
const fdecl = (name) => new RegExp(`Clay_ElementDeclaration ${name} = (.*);`).exec(fh)?.[1];
assert.equal(fdecl("plain"), "{ .floating = { .attachTo = CLAY_ATTACH_TO_PARENT } }");
assert.ok(
  fdecl("menu").endsWith(
    `, .floating = { .offset = { .x = 4, .y = -2 }, .expand = { .width = 2, .height = 3 }, .parentId = ${ID_UNITS}u, .zIndex = 10, .attachPoints = { .element = CLAY_ATTACH_POINT_LEFT_TOP, .parent = CLAY_ATTACH_POINT_LEFT_BOTTOM }, .pointerCaptureMode = CLAY_POINTER_CAPTURE_MODE_PASSTHROUGH, .attachTo = CLAY_ATTACH_TO_ELEMENT_WITH_ID, .clipTo = CLAY_CLIP_TO_ATTACHED_PARENT } }`,
  ),
  fh,
);
assert.match(fdecl("dialog"), /\.attachTo = CLAY_ATTACH_TO_ROOT \}/);
assert.ok(!fdecl("dialog").includes("parentId"), fh); // the root is Clay's to name
assert.ok(!fdecl("tip").includes("floating"), fh);
assert.match(
  fdecl("tip_hover"),
  /\.floating = \{ \.attachPoints = \{ \.element = CLAY_ATTACH_POINT_LEFT_TOP, \.parent = CLAY_ATTACH_POINT_CENTER_TOP \}, \.attachTo = CLAY_ATTACH_TO_PARENT \}/,
);

// images: Clay 1.0's Clay_ImageElementConfig is `void *imageData` alone (older Clay's sourceDimensions is gone), so the
// path travels in it and the element's box is the image's own size; `contain` adds Clay's aspectRatio
const images = { ...(await exportsOf("clay-image.ts")) };
assert.deepEqual(images.glyph, {
  layout: {
    sizing: {
      width: { type: "FIXED", min: 32, max: 32 },
      height: { type: "FIXED", min: 32, max: 32 },
    },
  },
  image: { imageData: "examples/sensors/glyph.png" },
});
assert.deepEqual(images.logo.image, { imageData: "assets/logo.png" });
assert.deepEqual(images.logo.aspectRatio, { aspectRatio: 2 });
assert.deepEqual(images.logo.layout.sizing.width, { type: "GROW" }); // a later width wins, the ratio stays
assert.equal(images.glyph.aspectRatio, undefined); // fill, CSS's default: no ratio
assert.deepEqual(images.odd.image, { imageData: 'a"b\\c.png' });
// a later image that fills clears an earlier one's ratio; the last image's path wins
assert.equal(images.cleared.aspectRatio, undefined);
assert.deepEqual(images.cleared.image, { imageData: "b.png" });
assert.deepEqual(images.cleared.layout.sizing.width, { type: "FIXED", min: 8, max: 8 });

const imh = header(images);
const imdecl = (name) => new RegExp(`Clay_ElementDeclaration ${name} = (.*);`).exec(imh)?.[1];
assert.equal(
  imdecl("glyph"),
  '{ .layout = { .sizing = { .width = { .size = { .minMax = { 32, 32 } }, .type = CLAY__SIZING_TYPE_FIXED }, .height = { .size = { .minMax = { 32, 32 } }, .type = CLAY__SIZING_TYPE_FIXED } } }, .image = { .imageData = (void *)"examples/sensors/glyph.png" } }',
);
assert.equal(
  imdecl("logo"),
  '{ .layout = { .sizing = { .width = { .size = { .minMax = { 0, 0 } }, .type = CLAY__SIZING_TYPE_GROW }, .height = { .size = { .minMax = { 32, 32 } }, .type = CLAY__SIZING_TYPE_FIXED } } }, .image = { .imageData = (void *)"assets/logo.png" }, .aspectRatio = { .aspectRatio = 2 } }',
);
// a quote and a backslash of the path are escaped, so the C compiles
assert.match(imdecl("odd"), /\.imageData = \(void \*\)"a\\"b\\\\c\.png" \}/);

// shadows: no Clay field (clay.h 1.0 has none), so the literal carries a sibling `shadow` the renderer draws, and
// header() drops it — the declaration keeps its layout
const shadows = { ...(await exportsOf("clay-shadow.ts")) };
const BLACK = (a) => ({ r: 0, g: 0, b: 0, a });
assert.deepEqual(shadows.plain, { shadow: { x: 0, y: 2, blur: 12, color: BLACK(102) } });
assert.deepEqual(shadows.panel, { shadow: { x: 0, y: 12, blur: 24, color: BLACK(115) } });
assert.deepEqual(shadows.card.shadow, { x: 2, y: 8, blur: 16, color: BLACK(128) });
// a state's shadow is laid over the base field by field: x, y and the colour stay, blur changes
assert.deepEqual(shadows.card[":hover"], { shadow: { x: 2, y: 8, blur: 20, color: BLACK(128) } });
assert.deepEqual(shadows.replaced.shadow, { x: 0, y: -3, blur: 4, color: BLACK(102) });
assert.deepEqual(shadows.floating, {
  layout: { sizing: { width: { type: "FIXED", min: 280, max: 280 } } },
  backgroundColor: RGB(36, 40, 52),
  cornerRadius: { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 },
  shadow: { x: 0, y: 12, blur: 24, color: BLACK(102) },
});
const sh = header(shadows);
const shdecl = (name) => new RegExp(`Clay_ElementDeclaration ${name} = (.*);`).exec(sh)?.[1];
assert.equal(
  shdecl("floating"),
  "{ .layout = { .sizing = { .width = { .size = { .minMax = { 280, 280 } }, .type = CLAY__SIZING_TYPE_FIXED } } }, .backgroundColor = { .r = 36, .g = 40, .b = 52, .a = 255 }, .cornerRadius = { .topLeft = 12, .topRight = 12, .bottomRight = 12, .bottomLeft = 12 } }",
);
assert.ok(!/shadow/i.test(sh), sh); // the style's name and every field it sets: no shadow anywhere

// backdrops: a sibling `backdrop` the renderer blurs, and header() drops it too
const backdrops = { ...(await exportsOf("clay-backdrop.ts")) };
assert.deepEqual(backdrops.plain, { backdrop: { blur: 12 } });
assert.deepEqual(backdrops.menu, { backdrop: { blur: 10 } });
assert.deepEqual(backdrops.panel, { backdrop: { blur: 18 } });
assert.deepEqual(backdrops.card, { backdrop: { blur: 6 }, ":hover": { backdrop: { blur: 16 } } });
assert.deepEqual(backdrops.floating, {
  layout: { sizing: { width: { type: "FIXED", min: 150, max: 150 } } },
  backgroundColor: { r: 23, g: 27, b: 32, a: 184 },
  cornerRadius: { topLeft: 10, topRight: 10, bottomRight: 10, bottomLeft: 10 },
  backdrop: { blur: 10 },
});
const bd = header(backdrops);
assert.ok(!/backdrop/i.test(bd), bd); // the declaration keeps its layout, not the effect

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
await fails(
  `export const a = css.float({ attach: { element: "top left" } });`,
  /float\.attach\.element: unexpected "top left", expected left top \| left center/,
);
await fails(
  `export const a = css.float({ attach: { parent: "middle" } });`,
  /float\.attach\.parent: unexpected "middle"/,
);
await fails(
  `export const a = css.float({ attach: { below: "left top" } });`,
  /float\.attach: unexpected "below", expected element \| parent/,
);
await fails(
  `export const a = css.float({ expand: { width: -4 } });`,
  /float\.expand\.width: unexpected -4, expected a number of pixels .*not negative/,
);
await fails(
  `export const a = css.float({ expand: { height: "2rem" } });`,
  /float\.expand\.height: unexpected "2rem"/,
);
await fails(
  `export const a = css.float({ offset: { x: "1em" } });`,
  /float\.offset\.x: unexpected "1em", expected a number of pixels/,
);
await fails(
  `export const a = css.float({ offset: { z: 1 } });`,
  /float\.offset: unexpected "z", expected x \| y/,
);
await fails(
  `export const a = css.float({ zIndex: 1.5 });`,
  /float\.zIndex: unexpected 1.5, expected a whole number/,
);
await fails(`export const a = css.float({ zIndex: 40000 });`, /float\.zIndex: unexpected 40000/);
await fails(
  `export const a = css.float({ capture: "no" });`,
  /float\.capture: unexpected "no", expected true \| false/,
);
await fails(
  `export const a = css.float({ clip: "attached" });`,
  /float\.clip: unexpected "attached", expected none \| parent/,
);
await fails(
  `export const a = css.float({ parent: "" });`,
  /float\.parent: unexpected "", expected the non-empty ASCII string/,
);
await fails(`export const a = css.float({ parent: "меню" });`, /float\.parent: unexpected "меню"/);
await fails(`export const a = css.float({ parent: 3 });`, /float\.parent: unexpected 3/);
await fails(
  `export const a = css.float({ root: "yes" });`,
  /float\.root: unexpected "yes", expected true \| false/,
);
await fails(
  `export const a = css.float({ parent: "a", root: true });`,
  /parent and root are two places/,
);
await fails(
  `export const a = css.float({ zindex: 1 });`,
  /float: unexpected "zindex", expected attach \| parent \| root/,
);
await fails(`export const a = css.float("left");`, /float: unexpected "left", expected \{ attach/);
await fails(
  `export const a = css.float({}, {});`,
  /float takes one object of options, got 2 values/,
);
await fails(`export const a = css.float(css.p(1));`, /float: a style is not a value/);
await fails(
  `export const a = css.float({ root: true, clip: "parent" });`,
  /clip "parent" does nothing on a float attached to the root/,
);
await fails(
  `export const a = css.cn(css.float({ clip: "parent" }), css.float({ root: true }));`,
  /clip "parent" does nothing/,
);
await fails(
  `export const a = css.image("a.png", { width: 32 });`,
  /image: unexpected .*expected the image's width and height/,
);
await fails(`export const a = css.image("a.png");`, /expected the image's width and height/);
await fails(
  `export const a = css.image("a.png", { width: 0, height: 2 });`,
  /image: unexpected 0x2, expected a positive whole number of pixels for each side/,
);
await fails(
  `export const a = css.image("a.png", { width: 1.5, height: 2 });`,
  /image\.width: 1\.5 is not a whole number of pixels/,
);
await fails(`export const a = css.image("", { width: 1, height: 1 });`, /expected the path of an image/);
await fails(`export const a = css.image(3, { width: 1, height: 1 });`, /image: unexpected 3/);
await fails(
  `export const a = css.image("a\\nb.png", { width: 1, height: 1 });`,
  /expected the path of an image/,
);
await fails(
  `export const a = css.image("a.png", { width: 1, height: 1, src: "x" });`,
  /image: unexpected "src", expected width \| height \| fit/,
);
await fails(
  `export const a = css.image("a.png", { width: 1, height: 1, fit: "cover" });`,
  /image\.fit: unexpected "cover", expected fill \| contain/,
);
await fails(
  `export const a = css.image("a.png", { width: 1, height: 1 }, 2);`,
  /image takes the path of an image and its \{ width, height, fit \}, got 3 values/,
);
await fails(`export const a = css.image();`, /image takes the path of an image .*got 0 values/);
await fails(
  `export const a = css.image(css.p(1), { width: 1, height: 1 });`,
  /image: a style is not a value/,
);
await fails(
  `export const a = css.shadow({ blur: -2 });`,
  /shadow\.blur: unexpected -2, expected a number of pixels .*not negative/,
);
await fails(`export const a = css.shadow({ blur: "4em" });`, /shadow\.blur: unexpected "4em"/);
await fails(
  `export const a = css.shadow({ x: "2em" });`,
  /shadow\.x: unexpected "2em", expected a number of pixels/,
);
await fails(
  `export const a = css.shadow({ color: "blu" });`,
  /shadow\.color: "blu" is not a colour Clay can draw/,
);
await fails(
  `export const a = css.shadow({ spread: 2 });`,
  /shadow: unexpected "spread", expected x \| y \| blur \| color/,
);
await fails(
  `export const a = css.shadow({}, {});`,
  /shadow takes one object of options, got 2 values/,
);
await fails(`export const a = css.shadow(css.p(1));`, /shadow: a style is not a value/);
await fails(
  `export const a = css.backdrop({ blur: -2 });`,
  /backdrop\.blur: unexpected -2, expected a number of pixels .*not negative/,
);
await fails(
  `export const a = css.backdrop({ blur: "4em" });`,
  /backdrop\.blur: unexpected "4em"/,
);
await fails(
  `export const a = css.backdrop({ radius: 2 });`,
  /backdrop: unexpected "radius", expected blur/,
);
await fails(
  `export const a = css.backdrop({}, {});`,
  /backdrop takes one object of options, got 2 values/,
);
await fails(`export const a = css.backdrop(2);`, /backdrop: unexpected 2, expected \{ blur \}/);
await fails(`export const a = css.backdrop(css.p(1));`, /backdrop: a style is not a value/);

await server.close();
console.log("clay: ok");
