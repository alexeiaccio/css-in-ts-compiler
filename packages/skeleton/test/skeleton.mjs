// @cssints/skeleton through the engine: the kernels (the box, and the clock on :root with its @property), the classes of
// the methods, the grey fallback for targets without color-mix() (in the sheet for the defaults, out of it for targets
// that all have it, no warning either way), the conflicts and the build errors. Run: node test/skeleton.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

import cssints from "cssints/vite";
import { createLogger, createServer } from "vite";

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
const failure = async (f) => {
  try {
    await code(f);
  } catch (e) {
    return e;
  }
  throw new Error(`${f} passed`);
};

const transformed = await code("use.ts");
const css = plugins[0].api.sheet([`${root}/use.ts`]);
const grey = "@supports not (color:color-mix(in oklab,red,red)){._skeleton-core{background-image:";
// the fallback covers the support warnings of color-mix(): never a warning
assert.deepEqual(warnings, []);

if (mode) {
  assert.equal(css.includes(grey), mode === "old", css);
  await server.close();
  console.log(`skeleton (${mode} targets) ok`);
  process.exit(0);
}
console.log(css);

// a member is a class string: the markers of the two kernels, then the methods
assert.match(transformed, /export const a = "_skeleton-core _skeleton-clock";/);
assert.match(transformed, /export const b = "_skeleton-core _skeleton-clock _\w+ _\w+ _\w+ _\w+ _\w+";/);
assert.ok(!transformed.includes("@cssints/skeleton"), transformed);

// the clock: one registered, inherited percentage, animated on :root while a skeleton is in the document, and only
// without a preference for reduced motion
assert.ok(
  css.includes('@property --skeleton-p{syntax:"<percentage>";inherits:true;initial-value:100%}'),
  css,
);
assert.ok(css.includes("@keyframes _skeleton-clock{from{--skeleton-p:100%}to{--skeleton-p:0%}}"), css);
assert.ok(
  css.includes(
    "@media (prefers-reduced-motion: no-preference){:root:has(._skeleton-clock){animation:_skeleton-clock 1.5s ease-in-out infinite}}",
  ),
  css,
);
// the box reads it; no skeleton runs an animation of its own
const [, box] = /\._skeleton-core\{([^}]*)\}/.exec(css) ?? [];
assert.ok(box, css);
assert.ok(!box.includes("animation"), box);
for (const d of [
  "border-radius:var(--skeleton-r, 0.25rem)",
  "background-position:var(--skeleton-p) 0",
  "background-size:300% 100%",
  "background-attachment:fixed",
  "background-image:linear-gradient(90deg, var(--skeleton-c, color-mix(in oklab, currentColor 12%, transparent)) 40%, var(--skeleton-h, color-mix(in oklab, currentColor 4%, transparent)) 50%, var(--skeleton-c, color-mix(in oklab, currentColor 12%, transparent)) 60%)",
])
  assert.ok(box.includes(d), `${d}\n${box}`);

// the methods set custom properties, under a condition too
for (const d of ["--skeleton-r:50%", "--skeleton-c:#ddd", "--skeleton-h:#eee"])
  assert.match(css, new RegExp(`\\._\\w+\\{${d}\\}`), d);
assert.match(css, /\._\w+:hover\{--skeleton-h:white\}/);

// the defaults lack color-mix() (Chrome 109): the grey fallback, after the kernel
assert.ok(css.indexOf(grey) > css.indexOf("._skeleton-core{"), css);
assert.match(transformed, /virtual:cssints\/runtime\/skeleton\.grey/);

// conflicts, derived from the kernel
let e = await failure("conflict.ts");
assert.equal(
  e.message,
  "cssints: skeleton: kernel core sets border-radius, background-image, background-size, background-position, background-attachment (this style also sets background)",
);
assert.equal(e.loc?.line, 4);
e = await failure("conflict-radius.ts");
assert.match(e.message, /kernel core sets .* \(this style also sets border-top-left-radius\)$/);
// a condition around the bare member: its kernels cannot be conditional
e = await failure("hover-bare.ts");
assert.match(e.message, /^cssints: :hover wraps _skeleton-core, the marker of kernel skeleton\.core/);
assert.equal(e.loc?.line, 4);
// the grammars of the methods, at build time
e = await failure("bad-radius.ts");
assert.equal(
  e.message,
  'skeleton.radius: unexpected "-4px" in "-4px", expected <length-percentage [0,∞]>',
);
assert.equal(e.loc?.line, 4);
e = await failure("bad-color.ts");
assert.equal(e.message, 'skeleton.color: unexpected "4px" in "4px", expected <color>');
await server.close();

// targets that all have color-mix(), and old ones: another process each, the targets are read once
for (const [m, targets] of [
  ["new", "chrome 120, firefox 128, safari 17"],
  ["old", "chrome 109"],
])
  console.log(
    execFileSync(process.execPath, [import.meta.filename, m], {
      env: { ...process.env, BROWSERSLIST: targets },
      encoding: "utf8",
    }).trim(),
  );
console.log("skeleton ok");
process.exit(0);
