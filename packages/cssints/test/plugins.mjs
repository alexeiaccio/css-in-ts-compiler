// The public plugin API (cssints/plugin) end to end: typed properties, contexts with kernels, conflicts, errors that
// name the plugin and the call site, and runtime delivery for targets that lack a feature. Run: node plugins.mjs
import assert from "node:assert/strict";
import { rmSync, writeFileSync } from "node:fs";

import { Effect } from "effect";
import { build, createLogger, createServer } from "vite";

// The targets the whole file runs with: Chrome has style queries on custom properties, Firefox 128 lacks them and has @property.
process.env.BROWSERSLIST = "chrome 120, firefox 128";
const { default: cssints } = await import("../src/plugin.ts");
const { needed } = await import("../src/delivery.ts");

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

// property(): a typed passthrough, no support warning (the engine knows nothing of it)
const use = await code("plug-use.ts");
assert.match(use, /export const a = "_\w+";/, use);
assert.match(
  use,
  /export const b = "_f _\w+ _\w+";/,
  "marker, then the two custom-property classes",
);
assert.match(use, /export const c = "_f _\w+ _\w+";/, "cn(): the marker once");
const css = sheet("plug-use.ts");
assert.match(css, /\{-webkit-font-smoothing:antialiased\}/);
assert.match(css, /\{--fr-r:8px\}/);
assert.match(css, /\{--fr-p:1rem\}/, "a lone number is a spacing step");
assert.ok(css.includes("@property --fr-r"), "the kernel's @property at the top");
assert.ok(!warnings.some((w) => w.includes("font-smoothing")), warnings.join("\n"));

// runtime: the import is added for a member with a runtime; the module and the fallback CSS follow the targets
assert.ok(use.includes("virtual:cssints/runtime/frame"), use);
assert.ok(use.includes("virtual:cssints/runtime/lit"), use);
const frameRuntime = (await client.transformRequest("virtual:cssints/runtime/frame")).code;
assert.ok(frameRuntime.includes("parent-vars"), frameRuntime);
assert.ok(frameRuntime.includes(`"marker":"_f","read":"--fr-i","write":"--fr-u","watch":"--fr-t"`));
assert.ok(css.includes(":root[data-cssints-poly] ._f {"), "the fallback is in the sheet");
assert.ok(css.indexOf("@layer _.k {") < css.indexOf("data-cssints-poly"), "...in layer _.k");
const litRuntime = (await client.transformRequest("virtual:cssints/runtime/lit")).code;
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
assert.ok(!(await code("plug-lit.ts")).includes("parent-vars"));
assert.ok(
  (await code("plug-lit.ts")).includes("virtual:cssints/runtime/lit"),
  "the import is there, its content is empty",
);

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
  "-webkit-font-smoothing",
);
await fails("plug-twice.ts", /^cssints: frame\(\)\.radius\(\) is used twice$/, 3, "frame");
await fails(
  "plug-conflict.ts",
  /^cssints: frame: frame\(\) sets padding, margin, border-radius and the border: use its methods \(this style also sets padding\)$/,
  5,
  "frame",
);

// fn(): the result is inlined where the call is (a Typed OM value or a string), nothing ships
const fnUse = await code("plug-fn.ts");
assert.match(
  fnUse,
  /export const c = "color-mix\(in oklab, red, white\)";/,
  "a call of its own is its text",
);
assert.ok(!/quad|import|[^-]mix\(/.test(fnUse), "...and no call or import is left");
const fnCss = sheet("plug-fn.ts");
assert.match(fnCss, /\{color:color-mix\(in oklab, red, blue\)\}/);
assert.match(fnCss, /\{width:8px\}/, "a string result");
await fails(
  "plug-fn-bad-part.ts",
  /^mix: unexpected "solid" in "red solid", expected <color>$/,
  3,
  "mix",
);
await fails("plug-fn-throws.ts", /^cssints: boom: no luck$/, 3, "boom");
await fails(
  "plug-fn-nothing.ts",
  /^cssints: nothing\(\) computeTo must return a string or a Typed OM value$/,
  3,
  "nothing",
);
// a result that does not fit the property is that property's error, at the same site
await assert.rejects(code("plug-fn-bad-result.ts"), (e) => {
  assert.match(e.message.split("\n")[0], /^width: unexpected "color-mix\(in" in /);
  assert.equal(e.loc?.line, 5);
  return true;
});

// a kernel used through a helper module that is edited does not collide with its own old self
const fx = `${import.meta.dirname}/fixtures`;
const kit = (css) => `import { context, method } from "cssints/plugin";
export const k = context({ name: "tmp", marker: "_t", kernel: { key: "tmp@1", css: "${css}" },
  methods: { w: method({ grammar: "<length>", emit: (v) => [["--tmp-w", v]] }) } });\n`;
writeFileSync(`${fx}/tmp-kit.ts`, kit("._t{--tmp-a:1}"));
writeFileSync(
  `${fx}/tmp-helper.ts`,
  `import { k } from "./tmp-kit" with { type: "cssints" };\nexport const base = k().w("1px");\n`,
);
writeFileSync(
  `${fx}/tmp-use.ts`,
  `import { cn } from "cssints" with { type: "cssints" };\nimport { base } from "./tmp-helper" with { type: "cssints" };\nexport const a = cn(base);\n`,
);
await code("tmp-use.ts");
assert.ok(sheet("tmp-use.ts").includes("--tmp-a:1"));
writeFileSync(`${fx}/tmp-kit.ts`, kit("._t{--tmp-b:1}"));
for (const env of Object.values(server.environments)) env.moduleGraph.invalidateAll();
await code("tmp-use.ts");
assert.ok(
  sheet("tmp-use.ts").includes("--tmp-b:1"),
  "the edited kernel replaces the old one, no false collision",
);
for (const f of ["kit", "helper", "use"]) rmSync(`${fx}/tmp-${f}.ts`);
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

console.log("plugins: property, context, conflicts, errors, runtime delivery ok");
process.exit(0);
