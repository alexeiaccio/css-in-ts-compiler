// What scope() (cssints/plugin) does for plugins, end to end: typed properties, value functions, chains with kernels, conflicts,
// errors that name the scope and the call site, and runtime delivery for targets that lack a feature. Run: node plugins.mjs
import assert from "node:assert/strict";
import { Effect } from "effect";
import { build, createLogger, createServer } from "vite";

// The targets the whole file runs with: Chrome has style queries on custom properties, Firefox 128 lacks them and has @property.
process.env.BROWSERSLIST = "chrome 120, firefox 128";
const { default: cssints } = await import("../src/plugin.ts");
const { needed } = await import("../src/delivery.ts");
const { addKernel } = await import("../src/kernel.ts");
const { Registry } = await import("../src/registry.ts");

const warnings = [];
const plugins = cssints();
const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  customLogger: { ...createLogger("warn"), warn: (m) => warnings.push(m) },
  server: { middlewareMode: true, watch: null },
  plugins,
});
const client = server.environments.client;
const sheet = (f) => plugins[0].api.sheet([`${import.meta.dirname}/fixtures/${f}`]);
const code = async (f) => (await client.transformRequest(`/fixtures/${f}`)).code;

// a typed property: a typed passthrough, no support warning (the engine knows nothing of it)
const use = await code("plug-use.ts");
assert.match(use, /export const a = "_\w+";/, use);
assert.match(
  use,
  /export const b = "_frame-core _\w+ _\w+";/,
  "marker, then the two custom-property classes",
);
assert.match(use, /export const c = "_frame-core _\w+ _\w+";/, "cn(): the marker once");
const css = sheet("plug-use.ts");
assert.match(css, /\{-webkit-font-smoothing:antialiased\}/);
assert.match(css, /\{--frame-r:8px\}/);
assert.match(css, /\{--frame-p:1rem\}/, "a lone number is a spacing step");
assert.ok(css.includes("@property --frame-r"), "the kernel's @property at the top");
assert.ok(!warnings.some((w) => w.includes("font-smoothing")), warnings.join("\n"));

// runtime: the import is added for a member with a runtime; the module and the fallback CSS follow the targets
assert.ok(use.includes("virtual:cssints/runtime/frame.fallback"), use);
assert.ok(use.includes("virtual:cssints/runtime/lit.fallback"), use);
const frameRuntime = (await client.transformRequest("virtual:cssints/runtime/frame.fallback")).code;
assert.ok(frameRuntime.includes("parent-vars"), frameRuntime);
assert.ok(
  frameRuntime.includes(
    `"marker":"_frame-core","read":"--frame-i","write":"--frame-u","watch":"--frame-t"`,
  ),
);
assert.ok(css.includes(":root[data-cssints-poly] ._frame-core {"), "the fallback is in the sheet");
assert.ok(css.indexOf("@layer _.k {") < css.indexOf("data-cssints-poly"), "...in layer _.k");
const litRuntime = (await client.transformRequest("virtual:cssints/runtime/lit.fallback")).code;
assert.ok(!litRuntime.includes("parent-vars"), "every target has the feature: nothing");
assert.ok(!css.includes("--lit-fallback"), "...and no fallback CSS");
// the floor: a target without @property gets nothing from a polyfill
const runtime = { polyfills: ["css.at-rules.container.style_queries_for_custom_properties"] };
assert.equal(Effect.runSync(needed(runtime, [["firefox", "128"]])), true);
assert.equal(Effect.runSync(needed(runtime, [["firefox", "127"]])), false, "no @property");
assert.equal(
  Effect.runSync(
    needed(runtime, [
      ["firefox", "127"],
      ["safari", "17"],
    ]),
  ),
  true,
);
assert.equal(Effect.runSync(needed(runtime, [["chrome", "120"]])), false);
// fallback CSS without parentVars is no script: it stands on nothing, so a target below @property gets it
const cssOnly = { ...runtime, css: "& { --_x: 1 }" };
assert.equal(Effect.runSync(needed(cssOnly, [["firefox", "127"]])), true, "CSS only");
assert.equal(
  Effect.runSync(
    needed({ ...cssOnly, parentVars: [{ marker: "&", read: "--_a", write: "--_b" }] }, [
      ["firefox", "127"],
    ]),
  ),
  false,
  "parentVars: no @property, no runtime",
);
// a kernel's `requires` that its runtime polyfills warns only for the targets the runtime does not reach (firefox 128
// lacks style queries and has @property)
const requiresWarnings = (key, runtimes) => {
  const state = { ...globalThis.__cssints, kernels: new Map(), warnings: [], warned: new Set() };
  const kernel = { key, css: "", requires: [runtime.polyfills[0]] };
  Effect.runSync(
    addKernel(kernel, [], undefined, runtimes).pipe(Effect.provideService(Registry, state)),
  );
  return state.warnings;
};
assert.equal(requiresWarnings("t.none", []).length, 1, "no runtime: the warning");
assert.deepEqual(requiresWarnings("t.css", [cssOnly]), [], "covered by fallback CSS");
assert.deepEqual(
  requiresWarnings("t.vars", [
    { ...runtime, parentVars: [{ marker: "&", read: "--_a", write: "--_b" }] },
  ]),
  [],
  "covered by parent-vars where @property is",
);
assert.ok(!(await code("plug-lit.ts")).includes("parent-vars"));
assert.ok(
  (await code("plug-lit.ts")).includes("virtual:cssints/runtime/lit.fallback"),
  "the import is there, its content is empty",
);

// a runtime with a script of its own: it stands on nothing, so it reaches a target below @property too; the module imports
// it when a target lacks a polyfilled feature, and two entries with one script are one module in the browser
assert.equal(
  Effect.runSync(needed({ ...runtime, script: "x" }, [["firefox", "127"]])),
  true,
  "a script reaches every target",
);
assert.deepEqual(requiresWarnings("t.script", [{ ...runtime, script: "x" }]), [], "covered");
const scriptUse = await code("plug-script-use.ts");
for (const n of ["ps.a", "ps.b", "ps.c"])
  assert.ok(scriptUse.includes(`virtual:cssints/runtime/${n}`), scriptUse);
const scriptModule = async (n) =>
  (await client.transformRequest(`virtual:cssints/runtime/${n}`)).code;
const [sa, sb, sc] = [
  await scriptModule("ps.a"),
  await scriptModule("ps.b"),
  await scriptModule("ps.c"),
];
assert.equal(sa, 'import "/fixtures/plug-script-run.js";\n', sa);
assert.equal(sb, sa, "one script, one import: the browser runs it once");
assert.equal(sc, "export {};", "every target has the feature: nothing ships");

// errors name the plugin and the call site
const fails = async (f, text, line, plugin) =>
  assert.rejects(code(f), (e) => {
    assert.equal(e._tag, "MemberError");
    assert.equal(e.pluginName, plugin);
    assert.match(e.message.split("\n")[0], text);
    assert.equal(e.loc?.line, line, `${f}: the call site`);
    assert.ok(e.id.endsWith(f));
    return true;
  });
await fails(
  "plug-bad-value.ts",
  /^frame\.radius: unexpected "red" in "red", expected </,
  4,
  "frame",
);
await fails(
  "plug-bad-property.ts",
  /^-webkit-font-smoothing: unexpected "bold" in "bold", expected /,
  3,
  "pk",
);
await fails("plug-twice.ts", /^cssints: frame\(\)\.radius\(\) is used twice$/, 3, "frame");
await fails(
  "plug-conflict.ts",
  /^cssints: frame: frame\(\) sets padding, margin, border-radius and the border: use its methods \(this style also sets padding\)$/,
  5,
  "frame",
);

// a value member: the result is inlined where the call is (a Typed OM value or a string), nothing ships
const fnUse = await code("plug-fn.ts");
assert.match(
  fnUse,
  /export const c = "color-mix\(in oklab, red, white\)";/,
  "a call of its own is its text",
);
assert.ok(!/quad|import|[^-]mix\(/.test(fnUse), "...and no call or import is left");
// plug-kit.ts imports CSSColorValue from "cssints" plainly: fine at build time, an error in a module the client gets
await assert.rejects(code("plug-kit.ts"), /imports build-time CSSColorValue from "cssints" without/);
const fnCss = sheet("plug-fn.ts");
assert.match(fnCss, /\{color:color-mix\(in oklab, red, blue\)\}/);
assert.match(fnCss, /\{width:8px\}/, "a string result");
await fails(
  "plug-fn-bad-part.ts",
  /^mix: unexpected "solid" in "red solid", expected <color>$/,
  3,
  "pk",
);
await fails("plug-fn-throws.ts", /^cssints: boom: no luck$/, 3, "pk");
await fails(
  "plug-fn-nothing.ts",
  /^cssints: nothing\(\) value must return a string or a Typed OM value$/,
  3,
  "pk",
);
// a result that does not fit the property is that property's error, at the same site
await assert.rejects(code("plug-fn-bad-result.ts"), (e) => {
  assert.match(e.message.split("\n")[0], /^width: unexpected "color-mix\(in" in /);
  assert.equal(e.loc?.line, 5);
  return true;
});

// the css functions (a generated list, css-grammar functions.ts): tokens, numbers and strings as parts; nothing of a call ships
const bi = await code("fn-builtins.ts");
assert.ok(!bi.includes("colorMix") && !bi.includes("clamp"), "nothing of them ships");
const biCss = sheet("fn-builtins.ts");
for (const rule of [
  "color:color-mix(in oklab, var(--color-accent), black 15%)",
  "color:color-mix(in oklch longer hue, red 30%, var(--color-accent))",
  "max-width:min(48rem, 100%)",
  "padding:clamp(var(--space-md), 2vw, 2rem)",
  "opacity:clamp(0, 0.5, 1)",
  "width:max(var(--space-md), 10vw)",
  "width:calc(var(--space-md) * 2)",
  "gap:calc(var(--space-md) + var(--space-sm) / 2)",
  "color:light-dark(white, var(--color-bg))",
  "color:oklch(0.7 0.1 200 / 0.5)",
  "background-image:linear-gradient(to right, var(--color-accent), red 50%, blue)",
  "padding:var(--space-sm, 4px)",
  "transform:translate(var(--space-md), 0) rotate(10deg)",
  "transition-timing-function:cubic-bezier(0.1, 0.7, 1, 0.1)",
  "color:rgb(255, 0, 0)",
  'background-image:url("a.png")',
  "width:calc(min(var(--space-md), 50%) - 1rem)",
])
  assert.ok(biCss.includes(`{${rule}}`), `${rule}\n${biCss}`);
// a bad call is the twin's error, at the call: the same message as for a declaration
const failsAt = (f, text, line) =>
  assert.rejects(code(f), (e) => {
    assert.match(e.message.split("\n")[0], text);
    assert.equal(e.loc?.line, line, `${f}: the call site`);
    return true;
  });
await failsAt(
  "fn-builtins-bad-colors.ts",
  /^light-dark\(\): unexpected end in "light-dark\(white\)"/,
  3,
);
await failsAt(
  "fn-builtins-bad-token.ts",
  /^color-mix\(\): unexpected "1px" in "color-mix\(in oklab, 1px, red\)"/,
  5,
);
await failsAt("fn-builtins-bad-share.ts", /^color-mix\(\): unexpected "120%" in /, 3);
await failsAt(
  "fn-builtins-bad-arity.ts",
  /^color-mix\(\): unexpected end in "color-mix\(in oklab, red, 50%, blue\)"/,
  3,
);
await failsAt(
  "fn-builtins-bad-math.ts",
  /^min\(\): unexpected "min\(1rem" .*\(min\(\) cannot take length and time\)$/,
  5,
);
await failsAt("fn-builtins-bad-clamp.ts", /clamp\(\) takes 3 arguments/, 5);
// a token is checked as a literal of its type: length + time is an error through two tokens
await failsAt(
  "fn-math-bad-token.ts",
  /^calc\(\): unexpected "calc\(1px" in "calc\(1px \+ 1s\)" \(cannot add length and time\) \("calc\(var\(--space-md\) \+ var\(--time-fast\)\)" is checked as /,
  8,
);

// var(): a token with a fallback of its type; a raw var(--token) in a string warns with the token to use, one of no token is an error
warnings.length = 0;
await code("var-use.ts");
const varCss = sheet("var-use.ts");
assert.ok(varCss.includes("{padding:var(--space-sm, 4px)}"), varCss);
assert.ok(varCss.includes("{padding:var(--space-sm)}"), varCss);
assert.ok(
  warnings.some((w) =>
    w.includes('padding: "var(--space-sm)" is the token space.sm: pass the token itself'),
  ),
  warnings.join("\n"),
);
assert.ok(
  warnings.some((w) => w.includes('margin: "var(--space-sm)"')),
  warnings.join("\n"),
);
assert.equal(
  warnings.filter((w) => w.includes("var(--space-sm)")).length,
  2,
  "the token itself never warns",
);
await failsAt(
  "var-bad-fallback.ts",
  /^var\(--space-sm\) fallback: unexpected "red" in "red", expected <length>/,
  5,
);

await server.close();

// the build: a runtime for a feature a target lacks is in the output, one nobody lacks is not
const bundle = async (entry) => {
  const out = await build({
    root: `${import.meta.dirname}/fixtures`,
    configFile: false,
    logLevel: "silent",
    plugins: cssints(),
    build: {
      write: false,
      minify: false,
      lib: { entry, formats: ["es"], fileName: "app" },
    },
  });
  const files = [out].flat().flatMap((o) => o.output);
  const text = (ext) =>
    files
      .filter((f) => f.fileName.endsWith(ext))
      .map((f) => String(f.code ?? f.source))
      .join("\n");
  return { js: text(".js"), css: text(".css") };
};
const both = await bundle("plug-app.ts");
assert.ok(both.js.includes("data-cssints-poly"), "the shared engine is bundled");
assert.ok(both.js.includes("transitionrun"));
assert.ok(both.css.includes("data-cssints-poly"), both.css);
assert.ok(!both.css.includes("--lit-fallback"), "no fallback for the feature every target has");
const only = await bundle("plug-app-lit.ts");
assert.ok(!only.js.includes("data-cssints-poly"), "no runtime when no target lacks the feature");
assert.ok(!only.css.includes("--lit-fallback") && !only.css.includes("data-cssints-poly"));
assert.match(only.css, /--lit-c:\s*blue/);

console.log("plugins: property, value members, conflicts, errors, runtime delivery ok");
process.exit(0);
