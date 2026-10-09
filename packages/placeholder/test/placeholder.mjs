// @cssints/placeholder: the colour extraction on synthetic pixels, then through the engine on images this script writes
// (a PNG of four quadrants, a JPEG sky, a PNG that fades out, a WebP header, a cut PNG), and the errors at the call.
// Run: node test/placeholder.mjs
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

import cssints from "cssints/vite";
import jpeg from "jpeg-js";
import { PNG } from "pngjs";
import { createLogger, createServer } from "vite";

import { decode, downsample, gradients, thumbhash } from "../src/pixels.ts";

// the paths of the fixtures are relative to the working directory, the package
process.chdir(`${import.meta.dirname}/..`);

const image = (width, height, at) => {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) data.set(at(x, y), (y * width + x) * 4);
  return { width, height, data };
};
const hexOf = (img, i = 0) =>
  Array.from(img.data.subarray(i * 4, i * 4 + 4), (n) => n.toString(16).padStart(2, "0")).join("");

// cells average in linear light: black and white give #bcbcbc, not #808080
const bw = image(2, 1, (x) => (x ? [255, 255, 255, 255] : [0, 0, 0, 255]));
assert.equal(hexOf(downsample(bw, 1, 1)), "bcbcbcff");
// weighted by alpha: a transparent red adds no red, only transparency
const clear = image(2, 1, (x) => (x ? [0, 0, 255, 255] : [255, 0, 0, 0]));
assert.equal(hexOf(downsample(clear, 1, 1)), "0000ff80");
// a grid finer than the image repeats its pixels
assert.deepEqual(
  [0, 1, 2, 3].map((i) => hexOf(downsample(bw, 4, 1), i)),
  ["000000ff", "000000ff", "ffffffff", "ffffffff"],
);
// four quadrants: each cell of a 4 × 3 grid is one colour, brightest on top, laid out as the image is
const RED = [255, 0, 0, 255];
const BLUE = [0, 0, 255, 255];
const GREEN = [0, 128, 0, 255];
const WHITE = [255, 255, 255, 255];
const quadrants = image(40, 30, (x, y) =>
  y < 15 ? (x < 20 ? RED : BLUE) : x < 20 ? GREEN : WHITE,
);
const layers = gradients(quadrants, 4, 3).split(/, (?=radial|linear)/);
assert.equal(layers.length, 13);
assert.equal(layers[0], "radial-gradient(at 67% 100%, #ffffff, transparent 50%)");
assert.ok(layers.includes("radial-gradient(at 0 0, #ff0000, transparent 50%)"), String(layers));
assert.ok(layers.includes("radial-gradient(at 100% 0, #0000ff, transparent 50%)"), String(layers));
assert.ok(layers.includes("radial-gradient(at 0 100%, #008000, transparent 50%)"), String(layers));
// the middle row straddles the halves: its cells mix in linear light
assert.ok(layers.includes("radial-gradient(at 0 50%, #bc5c00, transparent 50%)"), String(layers));
assert.equal(layers.at(-1), "linear-gradient(#bc96bc, #bc96bc)");
// a transparent part stays transparent
const fade = image(4, 8, (_, y) => [0, 0, 0, y < 4 ? 255 : 0]);
assert.match(gradients(fade, 3, 4), /radial-gradient\(at 0 100%, #00000000, transparent 50%\)/);
// a large image is scaled to 100 px a side for ThumbHash, and the same pixels give the same URL
const big = image(400, 200, (x, y) => [x % 256, y % 256, 128, 255]);
assert.match(thumbhash(big), /^data:image\/png;base64,[A-Za-z0-9+/=]+$/);
assert.equal(thumbhash(big), thumbhash(big));
// formats by their first bytes, not the name
const text = (s) => new TextEncoder().encode(s);
assert.throws(
  () => decode(text("RIFF\0\0\0\0WEBPVP8 ")),
  /^Error: a WebP image: JPEG and PNG are read$/,
);
assert.throws(() => decode(text("\0\0\0\x1cftypavif")), /an AVIF image/);
assert.throws(() => decode(text("GIF89a")), /a GIF image/);
assert.throws(() => decode(text("<svg/>")), /not an image it knows/);

// the images of the fixtures (test/fixtures/img is ignored by git)
const png = (img) => {
  const p = new PNG({ width: img.width, height: img.height });
  p.data = Buffer.from(img.data);
  return PNG.sync.write(p);
};
mkdirSync("test/fixtures/img", { recursive: true });
writeFileSync("test/fixtures/img/split.png", png(quadrants));
writeFileSync("test/fixtures/img/fade.png", png(fade));
const sky = image(16, 24, (_, y) => [40 + y * 8, 120 + y * 5, 255, 255]);
const skyJpeg = jpeg.encode({ ...sky, data: Buffer.from(sky.data) }, 90).data;
writeFileSync("test/fixtures/img/sky.jpg", skyJpeg);
writeFileSync("test/fixtures/img/photo.webp", text("RIFF\0\0\0\0WEBPVP8 "));
writeFileSync("test/fixtures/img/broken.png", png(quadrants).subarray(0, 40));
// the JPEG decodes to what was encoded, near enough
const back = decode(skyJpeg);
assert.deepEqual([back.width, back.height], [16, 24]);
assert.ok(Math.abs(back.data[0] - 40) < 8, String(back.data[0]));

const root = `${import.meta.dirname}/fixtures`;
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  customLogger: createLogger("error"),
  server: { middlewareMode: true, watch: null, ws: false },
  plugins,
});
const client = server.environments.client;
const code = async (f) => (await client.transformRequest(`/${f}`)).code;
const sheet = (f) => plugins[0].api.sheet([`${root}/${f}`]);
const failure = async (f) => {
  try {
    await code(f);
  } catch (e) {
    return e;
  }
  throw new Error(`${f} passed`);
};

const transformed = await code("use.ts");
const css = sheet("use.ts");
console.log(css);
assert.ok(!transformed.includes("placeholder"), `no runtime import\n${transformed}`);
// the gradient is the one the unit check computes, as the property's value
assert.ok(css.includes(`background-image:${gradients(quadrants, 4, 3)}}`), css);
// a portrait image gets a 3 × 4 grid: the sky, lighter towards the bottom, brightest on top
assert.match(
  css,
  /background-image:radial-gradient\(at 0 100%, #[0-9a-f]{6}, transparent 50%\), radial-gradient\(at 50% 100%, /,
);
assert.ok(css.includes("radial-gradient(at 100% 67%, "), css);
// thumbhash: a PNG of at most 16 px a side, deflated
const url = /background-image:url\("data:image\/png;base64,([A-Za-z0-9+/=]+)"\)/.exec(css)?.[1];
assert.ok(url && url.length < 1000, `${url?.length}`);
const thumb = PNG.sync.read(Buffer.from(url, "base64"));
assert.ok(Math.max(thumb.width, thumb.height) <= 16, `${thumb.width}x${thumb.height}`);
// a mask: the opaque top half is black, the clear bottom half transparent
assert.ok(css.includes("mask-image:radial-gradient(at 0 0, #000000, transparent 50%)"), css);
assert.ok(css.includes("radial-gradient(at 0 100%, #00000000, transparent 50%)"), css);
// the same file content gives the same sheet, from the cache
assert.equal(sheet("use.ts"), css);

// errors, at the call
const errors = {
  "missing.ts": [
    4,
    /^cssints: placeholder: cannot read test\/fixtures\/img\/nope\.png \(paths are relative to .*\)$/,
  ],
  "webp.ts": [
    4,
    /^cssints: placeholder: test\/fixtures\/img\/photo\.webp: a WebP image: JPEG and PNG are read$/,
  ],
  "broken.ts": [4, /^cssints: placeholder: test\/fixtures\/img\/broken\.png: /],
  "bad-mode.ts": [4, /^placeholder\(2\)\.mode: unexpected "blurhash"/],
};
for (const [f, [line, message]] of Object.entries(errors)) {
  const e = await failure(f);
  assert.match(e.message.split("\n")[0], message, f);
  assert.deepEqual({ line: e.loc?.line, column: e.loc?.column }, { line, column: 17 }, f);
}
const e = await failure("bad-property.ts");
assert.match(e.message, /^color: unexpected "radial-gradient\(at"/);
assert.equal(e.loc?.line, 5);

await server.close();

// dev: an edit of the image changes the CSS of the module that reads it, the module untouched (cssints-04u8)
const devPlugins = cssints();
const dev = await createServer({
  root,
  configFile: false,
  customLogger: createLogger("error"),
  server: { middlewareMode: true, ws: false },
  plugins: devPlugins,
});
const devSheet = async () => {
  await dev.environments.client.transformRequest("/use.ts");
  return devPlugins[0].api.sheet([`${root}/use.ts`]);
};
const before = await devSheet();
const dusk = image(16, 24, (_, y) => [200, 60 + y * 4, 20, 255]);
writeFileSync(
  "test/fixtures/img/sky.jpg",
  jpeg.encode({ ...dusk, data: Buffer.from(dusk.data) }, 90).data,
);
const mod = dev.environments.client.moduleGraph.getModuleById(`${root}/use.ts`);
for (let i = 0; i < 100 && mod.transformResult; i++) await sleep(50);
assert.equal(mod.transformResult, null, "use.ts was not invalidated");
const after = await devSheet();
assert.notEqual(after, before);
// the split image did not change: its gradient stays
assert.ok(after.includes(`background-image:${gradients(quadrants, 4, 3)}}`), after);
await dev.close();
console.log("placeholder: ok");
process.exit(0);
