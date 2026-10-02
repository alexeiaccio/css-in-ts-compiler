// @cssints/icons through the engine: both providers, the output (a marker, a kernel, one custom property per icon) and
// the errors. The working directory is the package (set below): the collection is read from its node_modules. Run: node test/icons.mjs
import assert from "node:assert/strict";

import cssints from "cssints/vite";
import { createLogger, createServer } from "vite";

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

// iconify-json and fs: a replaced site is the marker and the class of the icon's one custom property
const use = await code("use.ts");
const [, a, b1, b2, c, d, e] =
  /a = "(_i _\w+)";\nexport const b = "(_i _\w+) (_\w+)";\nexport const c = "(_i _\w+)";\nexport const d = "(_ic _\w+)";\nexport const e = "(_i _\w+)";/.exec(
    use,
  ) ?? [];
assert.ok(a, use);
assert.equal(b1, a, "the same icon is the same class, in a cn() too");
assert.ok(new Set([a, c, d, e]).size === 4, "one class per icon");
assert.ok(!use.includes("icons") && !use.includes("defs"), "the build-time imports are gone");

const css = sheet("use.ts");
// the kernels: printed once each, in layer _.k, a mask for one-colour icons and an image for coloured ones
assert.equal(css.match(/\._i\{/g).length, 1);
assert.equal(css.match(/\._ic\{/g).length, 1);
assert.ok(css.indexOf("._i{") < css.indexOf("@layer _.a {"), "the kernels are below the classes");
assert.match(css, /\._i\{[^}]*mask:var\(--_svg\) no-repeat center\/100% 100%/);
assert.match(css, /\._ic\{[^}]*background:var\(--_svg\) no-repeat center\/100% 100%/);
// a declaration per icon: the SVG as a data URL, currentColor as black, on a square view box
const svg = (cls) =>
  new RegExp(`\\.${cls.split(" ")[1]}\\{--_svg:url\\("data:image/svg\\+xml,([^"]*)"\\)\\}`);
const star = svg(c).exec(css)?.[1];
assert.match(
  star,
  /^%3Csvg xmlns='http:\/\/www.w3.org\/2000\/svg' viewBox='0 0 24 24' width='24' height='24'%3E/,
);
assert.ok(star.includes("fill='black'") && !star.includes("currentColor"));
const logo = svg(d).exec(css)?.[1];
assert.ok(logo.includes("viewBox='0 -8 32 32'") && logo.includes("fill='%23e44'"), logo);
assert.ok(svg(a).test(css) && svg(e).test(css), "iconify-json icons, aliases resolved by iconify");
// the icon and a width of the user's: two classes
assert.ok(css.includes(`.${b2}{width:2em}`), css);
// no kernel warning: LightningCSS prefixes mask for targets with only -webkit-mask
assert.ok(!warnings.some((w) => w.includes("kernel icon-")), warnings.join("\n"));

// the errors are build errors at the call site, with the nearest name when there is one
const fails = async (f, text, loc = { line: 3, column: 17 }) =>
  assert.rejects(code(f), (err) => {
    assert.equal(err.message.split("\n")[0], text);
    assert.deepEqual({ line: err.loc?.line, column: err.loc?.column }, loc);
    assert.ok(err.id.endsWith(f));
    return true;
  });
await fails(
  "bad-iconify.ts",
  'cssints: icons: no icon "hom" in iconify-json mdi, did you mean home?',
);
await fails("bad-fs.ts", 'cssints: icons: no icon "sta" in test/fixtures/svg, did you mean star?');
await fails("bad-far.ts", 'cssints: icons: no icon "nothing-like-it" in test/fixtures/svg');
await assert.rejects(code("bad-collection.ts"), (err) => {
  assert.match(
    err.message.split("\n")[0],
    /^cssints: icons: cannot read @iconify-json\/no-such-collection\/icons.json from .*: install @iconify-json\/no-such-collection$/,
  );
  return true;
});

await server.close();
console.log("icons ok");
