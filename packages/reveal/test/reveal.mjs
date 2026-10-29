// @cssints/reveal through the engine: the kernels (motion's keyframes on a view timeline for reveal(), on animation
// triggers for appear(), reduced motion), the classes of the methods, the fallback CSS by targets (default, all native,
// Firefox only, triggers native), the runtime modules, the conflicts on animation* and the build errors of the grammars.
// Run: node test/reveal.mjs
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
const appearTransformed = await code("appear.ts");
const appearOut = flat(plugins[0].api.sheet([`${root}/appear.ts`]));
const fallback =
  "@supports not (animation-timeline:view()){[data-reveal] ._reveal-core:not([data-reveal-in]){animation-play-state:paused}}";
const appearFallback =
  "@supports not (animation-trigger:none){[data-reveal] ._reveal-enter:not([data-reveal-in]){animation-play-state:paused}}";
// the runtime modules import the script when a target lacks the feature (the default targets have Firefox), else nothing
const runtime = (await client.transformRequest("virtual:cssints/runtime/reveal.io")).code;
const appearRuntime = (await client.transformRequest("virtual:cssints/runtime/reveal.io-appear"))
  .code;
// the default targets (the package's browserslist) have Firefox: both scripts; a target set without the feature keeps it
const timelineNeeds = mode === undefined || mode === "old";
assert.equal(runtime.includes("reveal/src/runtime.ts"), timelineNeeds, `${mode}: ${runtime}`);
assert.equal(
  appearRuntime.includes("reveal/src/runtime.ts"),
  mode !== "new",
  `${mode}: ${appearRuntime}`,
);
if (!timelineNeeds) assert.equal(runtime, "export {};", `${mode}: ${runtime}`);
if (mode === "new") assert.equal(appearRuntime, "export {};", `${mode}: ${appearRuntime}`);
// the fallbacks cover the kernels' declarations everywhere: never a support warning
assert.deepEqual(warnings, []);

if (mode) {
  // native: every target has scroll-driven animations, no fallback CSS; old: Firefox lacks them, the fallback is in
  assert.equal(out.includes(fallback), mode === "old", out);
  assert.ok(out.includes("animation-timeline:view()"), out);
  assert.ok(out.includes("animation-range:var(--reveal-g)"), out);
  // the triggers are native only with Chrome 146/Edge 146/Opera 130 targets; another target keeps the fallback in
  assert.equal(appearOut.includes(appearFallback), mode !== "new", appearOut);
  assert.ok(
    appearOut.includes("timeline-trigger:--reveal-t view() var(--reveal-enter-g)"),
    appearOut,
  );
  assert.ok(appearOut.includes("animation-trigger:--reveal-t"), appearOut);
  assert.ok(appearOut.includes("trigger-scope:--reveal-t"), appearOut);
  await server.close();
  console.log(`reveal (${mode} targets) ok`);
  process.exit(0);
}

// a member is the class of its kernel and those of its methods; the client module imports the runtime module
assert.match(transformed, /export const fade = "_reveal-core";/);
assert.match(transformed, /export const slide = "_reveal-core _\w+ _\w+ _\w+ _\w+ _\w+";/);
assert.match(transformed, /^import "[^"]*virtual:cssints\/runtime\/reveal\.io[^"]*";/);
assert.ok(!transformed.includes("@cssints/reveal"), transformed);
assert.match(appearTransformed, /export const fade = "_reveal-enter";/);
assert.match(
  appearTransformed,
  /export const slide = "_reveal-enter _\w+ _\w+ _\w+ _\w+ _\w+ _\w+ _\w+";/,
);
assert.match(appearTransformed, /^import "[^"]*virtual:cssints\/runtime\/reveal\.io-appear[^"]*";/);
assert.ok(!appearTransformed.includes("@cssints/reveal"), appearTransformed);

// motion's keyframes, reused: the `in` one and its reduced-motion twin (opacity only), named in the kernels' vars
const enter = /@keyframes (kf-\w+)\{from\{opacity:var\(--motion-o\);translate:/.exec(out)?.[1];
const reduced = /@keyframes (kf-\w+)\{from\{opacity:var\(--motion-o\)\}\}/.exec(out)?.[1];
assert.ok(enter && reduced, out);
// the timeline: after the `animation` shorthand, which resets it (a kernel prints a shorthand before its longhands)
const core = /\._reveal-core\{([^}]*)\}/.exec(out)?.[1]?.split(";") ?? [];
assert.equal(core[0], "animation:var(--reveal-k) var(--reveal-d) var(--reveal-e) both", out);
assert.deepEqual(
  core.slice(1).toSorted(),
  [
    "--motion-b:0",
    "--motion-o:0",
    "--motion-s:1",
    "--motion-x:0",
    "--motion-y:0",
    "--reveal-d:300ms",
    "--reveal-e:ease-out",
    "--reveal-g:entry 0% cover 40%",
    `--reveal-k:${enter}`,
    `--reveal-rk:${reduced}`,
    "animation-range:var(--reveal-g)",
    "animation-timeline:view()",
  ],
  out,
);
assert.ok(
  out.includes(
    "@media (prefers-reduced-motion: reduce){._reveal-core{animation-name:var(--reveal-rk)}}",
  ),
  out,
);
// the default targets have Firefox: the fallback CSS is in the sheet
assert.ok(out.includes(fallback), out);

// appear: motion's keyframes too (one rule each, as reveal() names them), time-based, on a trigger named by the kernel;
// the `animation` shorthand first (it resets animation-trigger), then the trigger
assert.equal(appearOut.match(/@keyframes /g)?.length, 2, appearOut);
const played = /--reveal-enter-k:(kf-\w+)/.exec(appearOut)?.[1];
const reducedPlayed = /--reveal-enter-rk:(kf-\w+)/.exec(appearOut)?.[1];
assert.ok(played && reducedPlayed, appearOut);
assert.equal(played, enter, "motion's `in` keyframes, the rule reveal() names");
assert.equal(reducedPlayed, reduced, "motion's reduced-motion keyframes");
const kernel = /\._reveal-enter\{([^}]*)\}/.exec(appearOut)?.[1]?.split(";") ?? [];
assert.equal(
  kernel[0],
  "animation:var(--reveal-enter-k) var(--reveal-enter-d) var(--reveal-enter-e) both",
  appearOut,
);
assert.ok(
  kernel.indexOf(
    "animation:var(--reveal-enter-k) var(--reveal-enter-d) var(--reveal-enter-e) both",
  ) < kernel.indexOf("animation-trigger:--reveal-t var(--reveal-enter) var(--reveal-leave)"),
  appearOut,
);
assert.deepEqual(
  kernel.slice(1).toSorted(),
  [
    "--motion-b:0",
    "--motion-o:0",
    "--motion-s:1",
    "--motion-x:0",
    "--motion-y:0",
    "--reveal-enter-d:300ms",
    "--reveal-enter-e:ease-out",
    "--reveal-enter-g:entry 100% exit 0%",
    `--reveal-enter-k:${played}`,
    `--reveal-enter-rk:${reducedPlayed}`,
    "--reveal-enter:play-once",
    "--reveal-leave:none",
    "animation-trigger:--reveal-t var(--reveal-enter) var(--reveal-leave)",
    "timeline-trigger:--reveal-t view() var(--reveal-enter-g)",
    "trigger-scope:--reveal-t",
  ],
  appearOut,
);
assert.ok(
  appearOut.includes(
    "@media (prefers-reduced-motion: reduce){._reveal-enter{animation-name:var(--reveal-enter-rk)}}",
  ),
  appearOut,
);
assert.ok(appearOut.includes(appearFallback), appearOut);

// motion(), reveal() and appear() in one module: the same keyframes and motion's custom properties, shared by scopes
const mixed = await code("motion.ts");
assert.match(mixed, /export const m = "_motion-core( _\w+)+";/, mixed);
assert.match(mixed, /export const r = "_reveal-core";/, mixed);
assert.match(mixed, /export const a = "_reveal-enter";/, mixed);
const mixedCss = flat(plugins[0].api.sheet([`${root}/motion.ts`]));
// motion names four (in, out, and their reduced twins); the other two members add none of their own
assert.equal(mixedCss.match(/@keyframes /g)?.length, 4, mixedCss);
for (const k of ["._motion-core{", "._reveal-core{", "._reveal-enter{"])
  assert.ok(mixedCss.includes(k), `${k}\n${mixedCss}`);

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
// appear: its range/duration/easing are the kernel's, `inOut()` the trigger's actions
for (const d of [
  "--motion-o:0",
  "--motion-y:25%",
  "--motion-b:5px",
  "--reveal-enter-g:entry 50% exit 0%",
  "--reveal-enter-d:600ms",
  "--reveal-enter-e:linear",
  "--reveal-enter:play-forwards",
  "--reveal-leave:play-backwards",
])
  assert.ok(appearOut.includes(`{${d}}`), `${d}\n${appearOut}`);
assert.match(appearOut, /@layer _\.b \{ \._\w+:hover\{--reveal-enter-d:1s\}/);

// conflicts, derived from the kernel: a style that holds reveal()/appear() and an animation property
let e = await failure("conflict.ts");
assert.equal(
  e.message,
  "cssints: reveal: kernel core sets animation, animation-timeline, animation-range, animation-name (this style also sets animation-duration)",
);
assert.equal(e.loc?.line, 4);
e = await failure("appear-conflict.ts");
assert.match(
  e.message,
  /^cssints: reveal: kernel enter sets animation, timeline-trigger, animation-trigger, trigger-scope, animation-name \(this style also sets animation-duration\)$/,
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
e = await failure("bad-appear-preset.ts");
assert.match(
  e.message,
  /^appear\.preset: unexpected "fade-out" in "fade-out", expected fade-in \| /,
);
assert.equal(e.loc?.line, 4);
e = await failure("bad-appear-range.ts");
assert.match(e.message, /^appear\.range: unexpected "sideways" in "entry 0% sideways"/);
await server.close();

// targets that all have scroll-driven animations or triggers, and Firefox alone: another process each, the targets are
// read once
for (const [m, targets] of [
  ["native", "chrome 120, safari 26"],
  ["old", "firefox 128"],
  ["triggers", "chrome 146, safari 26"],
  ["new", "chrome 146"],
])
  console.log(
    execFileSync(process.execPath, [import.meta.filename, m], {
      env: { ...process.env, BROWSERSLIST: targets },
      encoding: "utf8",
    }).trim(),
  );
console.log("reveal: ok");
process.exit(0);
