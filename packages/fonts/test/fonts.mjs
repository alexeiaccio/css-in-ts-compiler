// @cssints/fonts through the engine: both providers, the output (@font-face globals, the fallback face, font-family, the
// trim kernel and its capsize fallback), the numbers against @capsizecss/core, the errors, a build (the font files become
// assets), native-only targets and targets below @property. The working directory is the package (set below): fontsource is read from its
// node_modules. Run: node test/fonts.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

import { createFontStack, createStyleObject } from "@capsizecss/core";
import { fromFile } from "@capsizecss/unpack/fs";
import cssints from "cssints/vite";
import { build, createLogger, createServer } from "vite";

process.chdir(`${import.meta.dirname}/..`);
const root = `${import.meta.dirname}/fixtures`;
const mode = process.argv[2];
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
const kernelWarning = warnings.some((w) =>
  w.includes("kernel fonts.native needs css.properties.text-box"),
);
const fallbackCss = css.includes("@supports not (text-box:trim-both cap alphabetic)");

if (mode) {
  // native: every target has text-box, so the capsize margins are not in the sheet; old: a target with neither text-box
  // nor @property gets them (the fallback is CSS, it stands on nothing). The runtime covers text-box: no warning.
  assert.ok(!kernelWarning, warnings.join("\n"));
  assert.equal(fallbackCss, mode === "old", css);
  assert.ok(css.includes("._fonts-native{text-box:trim-both cap alphabetic}"), css);
  await server.close();
  console.log(`fonts (${mode} targets) ok`);
  process.exit(0);
}

const [, a, b1, b2, c, d, e] =
  /a = "(_\w+)";\nexport const b = "(_\w+) (_\w+)";\nexport const c = "(_fonts-native(?: _\w+){3})";\nexport const d = "(_fonts-native(?: _\w+){3})";\nexport const e = "(_\w+)";/.exec(
    use,
  ) ?? [];
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

// trim: the native kernel once, and capsize's margins (createStyleObject) as custom properties, kept by @supports not
assert.ok(css.includes("._fonts-native{text-box:trim-both cap alphabetic}"), css);
assert.ok(
  css.includes(
    '@supports not (text-box:trim-both cap alphabetic){._fonts-native::before,._fonts-native::after{content:"";display:table}._fonts-native::before{margin-bottom:var(--fonts-t)}._fonts-native::after{margin-top:var(--fonts-b)}}',
  ),
  css,
);
const decls = (classes) => classes.split(" ").slice(1).map(rule).sort();
for (const [classes, lineHeight, leading] of [
  [c, "normal", undefined],
  [d, "1.5", 24],
]) {
  const s = createStyleObject({ fontSize: 16, leading, fontMetrics: metrics });
  assert.deepEqual(decls(classes), [
    `--fonts-b:${s["::after"].marginTop}`,
    `--fonts-t:${s["::before"].marginBottom}`,
    `line-height:${lineHeight}`,
  ]);
}
// a default target lacks text-box: the fallback is in the sheet, and it covers the kernel's requires (no warning)
assert.ok(fallbackCss && !kernelWarning, warnings.join("\n"));

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
await assert.rejects(code("bad-line-height.ts"), (err) => {
  assert.match(
    err.message.split("\n")[0],
    /^trim\(1\)\.lineHeight: unexpected "tall" in "tall", expected <number/,
  );
  assert.deepEqual({ line: err.loc?.line, column: err.loc?.column }, { line: 4, column: 17 });
  return true;
});
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

// dev: another font written over a file of the fs provider changes the CSS of the module that reads it, the module
// untouched (cssints-04u8)
const woff = (w) =>
  readFileSync(
    `node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-${w}.woff`,
  );
mkdirSync("test/fixtures/out", { recursive: true });
writeFileSync("test/fixtures/out/dev.woff", woff("700-normal"));
const devPlugins = cssints();
const devServer = await createServer({
  root,
  configFile: false,
  logLevel: "silent",
  server: { middlewareMode: true, ws: false },
  plugins: devPlugins,
});
const devSheet = async () => {
  await devServer.environments.client.transformRequest("/dev.ts");
  return devPlugins[0].api.sheet([`${root}/dev.ts`]);
};
assert.match(await devSheet(), /font-family:"Dev";font-style:normal;font-weight:700;/);
writeFileSync("test/fixtures/out/dev.woff", woff("400-italic"));
const devMod = devServer.environments.client.moduleGraph.getModuleById(`${root}/dev.ts`);
for (let i = 0; i < 100 && devMod.transformResult; i++) await sleep(50);
assert.equal(devMod.transformResult, null, "dev.ts was not invalidated");
assert.match(await devSheet(), /font-family:"Dev";font-style:italic;font-weight:400;/);
await devServer.close();

// targets that all have text-box, and one with neither text-box nor @property: another process each, the targets are
// read once
for (const [m, targets] of [
  ["native", "chrome 133, safari 18.2, firefox 154"],
  ["old", "firefox 120"],
])
  console.log(
    execFileSync(process.execPath, [import.meta.filename, m], {
      env: { ...process.env, BROWSERSLIST: targets },
      encoding: "utf8",
    }).trim(),
  );
console.log("fonts ok");
process.exit(0);
