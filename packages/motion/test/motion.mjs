// @cssints/motion through the engine: the kernel (keyframes, defaults, reduced motion), the classes of the methods, the
// conflicts on animation* and the build errors of the grammars. Run: node test/motion.mjs
import assert from "node:assert/strict";

import cssints from "cssints/vite";
import { createLogger, createServer } from "vite";

const root = `${import.meta.dirname}/fixtures`;
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  customLogger: createLogger("warn"),
  server: { middlewareMode: true, watch: null, ws: false },
  plugins,
});
const client = server.environments.client;
const code = async (f) => (await client.transformRequest(`/${f}`)).code;
const sheet = (f) => plugins[0].api.sheet([`${root}/${f}`]);
const flat = (css) => css.replace(/\s+/g, " ").trim();
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
const out = flat(css);
console.log(css);

// a member is a class string, and no runtime is imported
assert.match(transformed, /export const fade = "_motion-core _\w+ _\w+ _\w+";/);
assert.ok(!transformed.includes("@cssints/motion"), transformed);

// the kernel: four keyframes (motion and reduced motion, in and out), once however many styles use it
const kf = [...css.matchAll(/@keyframes (kf-\w+)\{(from|to)\{([^}]*)\}\}/g)];
assert.equal(kf.length, 4, css);
const moved =
  "opacity:var(--motion-o);translate:var(--motion-x) var(--motion-y);scale:var(--motion-s);filter:blur(var(--motion-b))";
const named = (step, body) => kf.find((m) => m[2] === step && m[3] === body)?.[1];
const [enter, exit, reducedEnter, reducedExit] = [
  named("from", moved),
  named("to", moved),
  named("from", "opacity:var(--motion-o)"),
  named("to", "opacity:var(--motion-o)"),
];
assert.ok(enter && exit && reducedEnter && reducedExit, css);
// the kernel, written as styles: the names of the keyframes (which carry their rules), the defaults that reset what a
// parent motion set, and the animation that reads them
assert.ok(
  out.includes(
    `._motion-core{animation:var(--motion-n) var(--motion-d) var(--motion-e) var(--motion-l) both;--motion-in:${enter};--motion-out:${exit};--motion-ri:${reducedEnter};--motion-ro:${reducedExit};--motion-n:none;--motion-r:none;--motion-d:300ms;--motion-l:0s;--motion-e:ease-out;--motion-o:1;--motion-x:0;--motion-y:0;--motion-s:1;--motion-b:0}`,
  ),
  css,
);
// reduced motion runs the opacity-only keyframes
assert.ok(
  out.includes(
    "@media (prefers-reduced-motion: reduce){._motion-core{animation-name:var(--motion-r)}}",
  ),
  css,
);

// a preset sets custom properties only: the keyframes to run and the values to move from
const rule = (decl) => out.includes(`{${decl}}`);
for (const d of [
  "--motion-n:var(--motion-in)",
  "--motion-r:var(--motion-ri)",
  "--motion-n:var(--motion-out)",
  "--motion-r:var(--motion-ro)",
  "--motion-o:0",
  "--motion-y:25%",
  "--motion-b:5px",
  "--motion-d:500ms",
  "--motion-l:100ms",
  "--motion-e:linear",
])
  assert.ok(rule(d), `${d}\n${css}`);
// a method under a condition
assert.match(out, /@layer _\.b \{ \._\w+:hover\{--motion-d:1s\}/);

// conflicts, derived from the kernel: a style that holds motion() and an animation property
let e = await failure("conflict.ts");
assert.equal(
  e.message,
  "cssints: motion: kernel core sets animation, animation-name (this style also sets animation-duration)",
);
assert.equal(e.loc?.line, 4);

// the grammars of the methods, at build time
e = await failure("bad-duration.ts");
assert.equal(e.message, 'motion.duration: unexpected "-1s" in "-1s", expected <time [0s,∞]>');
e = await failure("bad-preset.ts");
assert.match(e.message, /^motion\.preset: unexpected "spin" in "spin", expected fade-in \| /);
assert.equal(e.loc?.line, 4);

await server.close();
console.log("motion: ok");
process.exit(0);
