// @cssints/reveal through the engine: the kernels (motion's keyframes on a view timeline, reduced motion), the classes of
// the methods, the fallback CSS by targets (default, all native, Firefox only), the runtime module, the conflicts on
// animation* and the build errors of the grammars. Run: node test/reveal.mjs
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
const out = flat(plugins[0].api.sheet([`${root}/use.ts`]));
const fallback =
  "@supports not (animation-timeline:view()){[data-reveal] ._reveal-core:not([data-reveal-in]){animation-play-state:paused}}";
// the runtime module imports the script when a target lacks the timeline (the default targets have Firefox), else nothing
const runtime = (await client.transformRequest("virtual:cssints/runtime/reveal.io")).code;
assert.equal(
  runtime.includes("reveal/src/runtime.ts"),
  mode !== "native",
  `${mode}: ${runtime}`,
);
if (mode === "native") assert.equal(runtime, "export {};");
// the fallback covers the kernel's requires everywhere: never a support warning
assert.deepEqual(warnings, []);

if (mode) {
  // native: every target has scroll-driven animations, no fallback CSS; old: Firefox lacks them, the fallback is in
  assert.equal(out.includes(fallback), mode === "old", out);
  assert.ok(out.includes("._reveal-view._reveal-view{animation-timeline:view()"), out);
  await server.close();
  console.log(`reveal (${mode} targets) ok`);
  process.exit(0);
}

// a member is the classes of its two kernels and of its methods; the client module imports the runtime module
assert.match(transformed, /export const fade = "_reveal-core _reveal-view";/);
assert.match(
  transformed,
  /export const slide = "_reveal-core _reveal-view _\w+ _\w+ _\w+ _\w+ _\w+";/,
);
assert.match(transformed, /^import "[^"]*virtual:cssints\/runtime\/reveal\.io[^"]*";/);
assert.ok(!transformed.includes("@cssints/reveal"), transformed);

// motion's keyframes, reused: the `in` one and its reduced-motion twin (opacity only), named in the kernel's vars
const enter = /@keyframes (kf-\w+)\{from\{opacity:var\(--motion-o\);translate:/.exec(out)?.[1];
const reduced = /@keyframes (kf-\w+)\{from\{opacity:var\(--motion-o\)\}\}/.exec(out)?.[1];
assert.ok(enter && reduced, out);
assert.ok(
  out.includes(
    `._reveal-core{animation:var(--reveal-k) var(--reveal-d) var(--reveal-e) both;--reveal-k:${enter};--reveal-rk:${reduced};--reveal-d:300ms;--reveal-e:ease-out;--reveal-g:entry 0% cover 40%;--motion-o:0;--motion-x:0;--motion-y:0;--motion-s:1;--motion-b:0}`,
  ),
  out,
);
assert.ok(
  out.includes(
    "@media (prefers-reduced-motion: reduce){._reveal-core{animation-name:var(--reveal-rk)}}",
  ),
  out,
);
// the timeline beats the `animation` shorthand (which resets it) by specificity, whatever the order of the kernels
assert.ok(
  out.includes(
    "._reveal-view._reveal-view{animation-timeline:view();animation-range:var(--reveal-g)}",
  ),
  out,
);
// the default targets have Firefox: the fallback CSS is in the sheet
assert.ok(out.includes(fallback), out);

// a preset sets motion's custom properties; the other methods the kernel's
for (const d of [
  "--motion-o:0",
  "--motion-y:25%",
  "--motion-b:5px",
  "--reveal-g:entry 0% entry 100%",
  "--reveal-d:500ms",
  "--reveal-e:linear",
])
  assert.ok(out.includes(`{${d}}`), `${d}\n${out}`);
assert.match(out, /@layer _\.b \{ \._\w+:hover\{--reveal-d:1s\}/);

// conflicts, derived from the kernel: a style that holds reveal() and an animation property
let e = await failure("conflict.ts");
assert.equal(
  e.message,
  "cssints: reveal: kernel core sets animation, animation-name (this style also sets animation-duration)",
);
assert.equal(e.loc?.line, 4);

// the grammars of the methods, at build time
e = await failure("bad-preset.ts");
assert.match(
  e.message,
  /^reveal\.preset: unexpected "fade-out" in "fade-out", expected fade-in \| /,
);
assert.equal(e.loc?.line, 4);
e = await failure("bad-range.ts");
assert.match(e.message, /^reveal\.range: unexpected "sideways" in "entry 0% sideways"/);
await server.close();

// targets that all have scroll-driven animations, and Firefox alone: another process each, the targets are read once
for (const [m, targets] of [
  ["native", "chrome 120, safari 26"],
  ["old", "firefox 128"],
])
  console.log(
    execFileSync(process.execPath, [import.meta.filename, m], {
      env: { ...process.env, BROWSERSLIST: targets },
      encoding: "utf8",
    }).trim(),
  );
console.log("reveal: ok");
process.exit(0);
