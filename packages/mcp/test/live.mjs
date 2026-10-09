// The live tools against running dev servers: apps/demo (cssints({ devtools: true })), the fixture app (a lazy module
// with a bad value) and one without the devtools. No browser: the tools fetch the modules themselves. Run: node test/live.mjs
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import cssints from "cssints/vite";
import { createServer } from "vite";

import { connect } from "./client.mjs";

const here = import.meta.dirname;
const demo = join(here, "../../../apps/demo");
const app = join(here, "fixtures/app");

// the demo reads @iconify-json/mdi from the working directory
process.chdir(demo);
const serve = async (options) => {
  const s = await createServer({ logLevel: "silent", server: { port: 5390 }, ...options });
  await s.listen();
  return s;
};
const servers = [
  await serve({ root: demo, configFile: join(demo, "vite.config.ts") }),
  await serve({ root: app, configFile: false, plugins: [cssints({ devtools: true })] }),
  await serve({ root: app, configFile: false, plugins: [cssints()] }),
];
const [url, appUrl, plainUrl] = servers.map((s) => s.resolvedUrls.local[0]);

const until = async (check, ms = 8000) => {
  for (const end = Date.now() + ms; Date.now() < end; await sleep(100)) if (await check()) return;
  throw new Error("timed out");
};

const client = await connect();
const call = async (name, args) => {
  const r = await client.callTool({ name, arguments: args });
  return r.isError ? { error: r.content[0].text } : r.structuredContent;
};

// ---------- module_styles: the demo's hard cases, served to nobody before the call
const inspect = await call("module_styles", { file: "src/components/Inspect.tsx", url });
assert.equal(inspect.note, undefined, inspect.error);
const at = inspect.sites.map((s) => s.location);
assert.ok(
  at.every((l) => /^src\/components\/Inspect\.tsx:\d+:\d+$/.test(l)),
  at.join(),
);
const classes = inspect.sites.flatMap((s) => s.classes);
const hover = classes.find((c) => c.conditions.includes(":hover") && c.css.includes("#dc2626"));
assert.ok(hover, JSON.stringify(classes, null, 1));
assert.equal(hover.layer, "_.b");
assert.deepEqual(hover.decls, [{ prop: "color", value: "#dc2626", important: false }]);
const md = classes.find((c) => c.conditions.includes("@media (width >= 40rem)"));
assert.match(md.css, /^@media \(width >= 40rem\)\{\._[\w-]+\{color:#2563eb\}\}$/);
assert.match(inspect.css, /#dc2626/);
// a file of the app that has no call, or is not served
assert.match((await call("module_styles", { file: "src/nope.tsx", url })).note, /no css\.\* call/);

// ---------- explain_class: several at once, an unknown one named
const both = await call("explain_class", { classes: `${hover.class} .${md.class} nope`, url });
assert.deepEqual(
  both.classes.map((c) => c.class),
  [hover.class, md.class],
);
assert.deepEqual(both.unknown, ["nope"]);
assert.match(both.classes[0].sites[0].location, /^src\/components\/Inspect\.tsx:\d+:\d+$/);
assert.ok(both.classes[0].sites[0].classes.includes(md.class), "the call made both");
// a token with its path and value: the scoped surface reads --color-surface
const surface = classes.find((c) => c.tokens.length);
assert.deepEqual(surface.tokens[0].name, "--color-surface");
assert.equal(surface.tokens[0].path, "color.surface");
// a kernel's marker: frame() of the Showcase
const showcase = await call("module_styles", { file: "src/components/Showcase.tsx", url });
const marker = showcase.sites.flatMap((s) => s.classes).find((c) => c.kind === "marker");
assert.equal(marker.plugin, "frame.core");
assert.match((await call("explain_class", { classes: "_nope", url })).error, /not a class/);

// ---------- dev_errors: the lazy module's bad value, with its call site
const errs = await call("dev_errors", { url: appUrl });
assert.equal(errs.errors.length, 1, JSON.stringify(errs));
assert.match(errs.errors[0].message, /padding: unexpected "-1rem"/);
assert.match(errs.errors[0].location, /fixtures\/bad\.ts:4:20$/);
assert.match(errs.notAvailable, /warnings/);
assert.deepEqual((await call("dev_errors", { url })).errors, []);
// the fixture app's styles, and the lazy module's good call
const pad = await call("module_styles", { file: "../button.ts", url: appUrl });
assert.match(pad.css, /padding:1rem/);
// an edit, with no browser to fetch the module again: the tool does
const edit = join(app, "edit.ts");
const before = readFileSync(edit, "utf8");
assert.match((await call("module_styles", { file: "edit.ts", url: appUrl })).css, /gap:1px/);
writeFileSync(edit, before.replace('"1px"', '"2px"'));
try {
  await until(async () =>
    /gap:2px/.test((await call("module_styles", { file: "edit.ts", url: appUrl })).css),
  );
} finally {
  writeFileSync(edit, before);
}

// ---------- what an agent is told when it cannot work
assert.match(
  (await call("explain_class", { classes: "_x", url: plainUrl })).error,
  /cssints\(\{ devtools: true \}\)/,
);
assert.match(
  (await call("explain_class", { classes: "_x", url: "http://localhost:1" })).error,
  /no Vite dev server answers/,
);

await client.close();
await Promise.all(servers.map((s) => s.close()));
console.log("live: ok");
process.exit(0);
