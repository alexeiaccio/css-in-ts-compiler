// @cssints/fonts through the engine: both providers, the output (@font-face globals, the fallback face, font-family), the
// numbers against @capsizecss/core, the errors, and a build (the font files become assets). The working directory is the package (set below): fontsource is read from its
// node_modules. Run: node test/fonts.mjs
import assert from "node:assert/strict";

import { createFontStack } from "@capsizecss/core";
import { fromFile } from "@capsizecss/unpack/fs";
import cssints from "cssints/vite";
import { build, createLogger, createServer } from "vite";

process.chdir(`${import.meta.dirname}/..`);
const root = `${import.meta.dirname}/fixtures`;
const warnings = [];
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  customLogger: { ...createLogger("warn"), warn: (m) => warnings.push(m) },
  server: { middlewareMode: true, watch: null, ws: false },
  plugins,
});
const client = server.environments.client;
const code = async (f) => (await client.transformRequest(`/${f}`)).code;
const sheet = (f) => plugins[0].api.sheet([`${root}/${f}`]);

const use = await code("use.ts");
const css = sheet("use.ts");
assert.deepEqual(warnings, [], "@font-face needs nothing a target lacks");
const [, a, b1, b2, e] =
  /a = "(_\w+)";\nexport const b = "(_\w+) (_\w+)";\nexport const e = "(_\w+)";/.exec(use) ?? [];
assert.ok(a, use);
assert.equal(b1, a, "the same family is the same class, in a cn() too");
assert.ok(!/from "/.test(use), "the build-time imports are gone");

const rule = (cls) => new RegExp(`\\.${cls}\\{([^}]*)\\}`).exec(css)?.[1];
assert.equal(
  rule(a),
  'font-family:"Atkinson Hyperlegible", "Atkinson Hyperlegible Fallback", sans-serif',
);
assert.equal(rule(b2), "color:red");
assert.equal(rule(e), 'font-family:"Brand", "Brand Fallback", serif');

// fontsource: a face per weight and subset, with its unicode-range, the files of the installed package
const faces = [...css.matchAll(/@font-face\{font-family:"Atkinson Hyperlegible";([^}]*)\}/g)].map(
  (m) => m[1],
);
assert.equal(faces.length, 4, css);
for (const [w, subset] of [
  [400, "latin"],
  [400, "latin-ext"],
  [700, "latin"],
  [700, "latin-ext"],
])
  assert.ok(
    faces.some((f) =>
      new RegExp(
        `^font-style:normal;font-weight:${w};font-display:swap;src:url\\("/[^"]*/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-${subset}-${w}-normal\\.woff2"\\) format\\("woff2"\\);unicode-range:U\\+`,
      ).test(f),
    ),
    `${w} ${subset}\n${faces.join("\n")}`,
  );
// fs: weight and style read from the file, the format from its extension, no unicode-range
assert.match(
  css,
  /@font-face\{font-family:"Brand";font-style:italic;font-weight:700;font-display:swap;src:url\("\/[^"]*\/atkinson-hyperlegible-latin-700-italic\.woff"\) format\("woff"\)\}/,
);

// the fallback face is capsize's (fontaine's formula), from the metrics capsize unpacks from the same file
const file =
  "node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2";
const metrics = await fromFile(file);
const arial = {
  familyName: "Arial",
  capHeight: 1467,
  ascent: 1854,
  descent: -434,
  lineGap: 67,
  unitsPerEm: 2048,
  xWidthAvg: 913,
};
const theirs = Object.fromEntries(
  [
    ...createFontStack([metrics, arial]).fontFaces.matchAll(
      /([a-z-]+-(?:override|adjust)): ([^;]+);/g,
    ),
  ].map((m) => [m[1], m[2]]),
);
assert.equal(Object.keys(theirs).length, 4);
const fallback = /@font-face\{font-family:"Atkinson Hyperlegible Fallback";([^}]*)\}/.exec(
  css,
)?.[1];
assert.ok(fallback?.startsWith('src:local("Arial"),local("Arimo"),local("Liberation Sans");'), css);
for (const [k, v] of Object.entries(theirs))
  assert.ok(fallback.includes(`${k}:${v}`), `${k}: ${v}\n${fallback}`);
assert.match(
  css,
  /@font-face\{font-family:"Brand Fallback";src:local\("Times New Roman"\),local\("Tinos"\),local\("Liberation Serif"\);size-adjust:/,
);
assert.equal(
  css.match(/@font-face/g).length,
  7,
  "a global is one rule however many sites carry it",
);

// in dev the files are served from where they are
const dev = (await client.transformRequest("virtual:cssints.css")).code;
assert.match(dev, /url\(\\"\/@fs\/[^"]*atkinson-hyperlegible-latin-400-normal\.woff2\\"\)/);

// the errors: at the definition (the module that calls font()), or at the call
const fails = async (f, text) =>
  assert.rejects(code(f), (err) => {
    assert.match(err.message.split("\n")[0], text);
    return true;
  });
await fails(
  "bad-weight.ts",
  /^cssints: fonts: @fontsource\/atkinson-hyperlegible has no weight 300 \(it has 400, 700\)$/,
);
await fails(
  "bad-package.ts",
  /^cssints: fonts: cannot read @fontsource\/no-such-font from .*: install @fontsource\/no-such-font$/,
);
await fails("bad-file.ts", /^cssints: fonts: cannot read .*test\/fixtures\/no-such\.woff2$/);
await server.close();

// a build: the font files are assets, the urls point at them
const out = await build({
  root,
  configFile: false,
  logLevel: "silent",
  plugins: cssints(),
  build: { write: false, rollupOptions: { input: `${root}/main.js` } },
});
const files = [out].flat().flatMap((o) => o.output);
const built = String(files.find((f) => f.fileName.endsWith(".css")).source);
const assets = files.filter((f) => /\.woff2?$/.test(f.fileName)).map((f) => f.fileName);
assert.equal(assets.length, 5, assets.join("\n"));
for (const asset of assets) assert.ok(built.includes(`url(/${asset})`), `${asset}\n${built}`);

console.log("fonts ok");
process.exit(0);
