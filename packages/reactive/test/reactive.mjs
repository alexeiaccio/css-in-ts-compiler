// @cssints/reactive through the engine: the owner's class (kernel markers, _g-reactive and one declaration per state),
// the protocol declarations of on() and bind(), the @property rules, the conditions of inside() and when(), the runtime
// module every target imports (delivery.ts: a script with no polyfills), the build errors, and the same in an
// all-supported set of targets.
// Run: node test/reactive.mjs
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
const sheet = (...files) => flat(plugins[0].api.sheet(files.map((f) => `${root}/${f}`)));
const transformed = await code("use.ts");
const out = sheet("use.ts");
const tabs = await code("tabs.ts");
const tabsOut = sheet("tabs.ts");
// the runtime module: a script with no polyfills is the plugin's own face, so every target imports it (cssints-zrt2)
const runtime = (await client.transformRequest("virtual:cssints/runtime/reactive.run")).code;
assert.ok(runtime.includes("reactive/src/runtime.ts"), runtime);
// the module imports the runtime, and nothing of the build-time package is left
assert.match(transformed, /^import "[^"]*virtual:cssints\/runtime\/reactive\.run[^"]*";/);
assert.match(tabs, /^import "[^"]*virtual:cssints\/runtime\/reactive\.run[^"]*";/);
assert.ok(!transformed.includes("@cssints/reactive"), transformed);
assert.ok(!tabs.includes("@cssints/reactive"), tabs);
// never a support warning: the kernels stand on nothing
assert.deepEqual(warnings, []);

if (mode) {
  // the runtime is the feature, so even a target set that has every CSS feature imports it, and the protocol is the same
  assert.ok(out.includes("@property --reactive-owner"), out);
  assert.match(transformed, /"owner": "_reactive-owner _g-reactive/, transformed);
  assert.ok(tabsOut.includes("--reactive-open:true"), tabsOut);
  await server.close();
  console.log(`reactive (${mode} targets) ok`);
  process.exit(0);
}

// the owner: the kernel's marker, the group marker (which inside() reads), then one class per state value and the list
assert.match(
  transformed,
  /const ui = \{\n\t"owner": "_reactive-owner _g-reactive( _\w+){3}",\n\t"open": \{ "~source": "open" \},\n\t"tab": \{ "~source": "tab" \}\n\};/,
  transformed,
);
assert.match(
  transformed,
  /export const card = "_reactive-owner _g-reactive( _\w+){3} _\w+";/,
  transformed,
);
// one on() and one bind() on one element: their markers, and their declarations
assert.match(
  transformed,
  /export const button = "_reactive-events _reactive-binding( _\w+){2}";/,
  transformed,
);
for (const d of [
  "--reactive-owner:open,tab",
  "--reactive-open:false",
  "--reactive-tab:one",
  "--reactive-on:click toggle open",
  "--reactive-binding:aria-expanded open,data-current tab",
])
  assert.ok(out.includes(`{${d}}`), `${d}\n${out}`);
// the @property rules: each program is read from the element itself (inherits: false)
for (const name of ["binding", "on", "owner"])
  assert.ok(out.includes(`@property --reactive-${name}{syntax:"*";inherits:false}`), out);
// the kernels print their markers in _.k, once each
for (const name of ["binding", "events", "owner"])
  assert.ok(out.includes(`._reactive-${name}{}`), out);
// conditions: a descendant of the owner (within() over _g-reactive and the owner's attribute), and the element itself
assert.ok(out.includes(':where(._g-reactive[data-reactive-open="true"]) ._'), out);
assert.ok(out.includes(':where(._g-reactive[data-reactive-tab="two"]) ._'), out);
assert.match(out, /\._\w+\[data-reactive-open="true"\]\{display:block\}/, out);
// a value, a boolean a string and a number
assert.ok(tabsOut.includes("--reactive-tab:two"), tabsOut);
assert.ok(tabsOut.includes("--reactive-open:true"), tabsOut);
assert.ok(tabsOut.includes("--reactive-on:click set tab one"), tabsOut);
assert.match(
  tabs,
  /const tabs = \{\n\t"owner": "_reactive-owner _g-reactive( _\w+){3}",\n\t"tab": \{ "~source": "tab" \},\n\t"open": \{ "~source": "open" \}\n\};/,
  tabs,
);
assert.ok(!tabsOut.includes("--reactive-owner:tab,open,tab"), tabsOut);

// the field's value and several programs on one element (cssints-674d): `@value`/`@checked` in a set segment, and two
// on()s or bind()s in one cn() append instead of the later replacing the earlier
const fields = await code("fields.ts");
const fieldsOut = sheet("fields.ts");
assert.match(
  fields,
  /export const select = "_reactive-events _reactive-binding( _\w+){2}";/,
  fields,
);
assert.match(fields, /export const both = "_reactive-events _reactive-binding( _\w+){2}";/, fields);
for (const d of [
  "--reactive-on:change set tab @value",
  "--reactive-on:change set open @checked",
  "--reactive-on:click toggle open,keydown set tab two",
  "--reactive-binding:aria-current tab",
  "--reactive-binding:aria-expanded open,data-current tab",
])
  assert.ok(fieldsOut.includes(`{${d}}`), `${d}\n${fieldsOut}`);
// one atom each: the first on() alone is never a rule of its own
assert.ok(!fieldsOut.includes("{--reactive-on:click toggle open}"), fieldsOut);

// the build errors name the bad name, value, event or attribute, at the call site
const fails = async (f, text, line) =>
  assert.rejects(code(f), (e) => {
    assert.equal(e._tag, "MemberError", String(e.message));
    assert.equal(e.pluginName, "reactive");
    assert.match(e.message.split("\n")[0], text);
    assert.equal(e.loc?.line, line, `${f}: the call site`);
    return true;
  });
await fails(
  "bad-name.ts",
  /^cssints: reactive: the state name "Open" is not an ident: lowercase letters, digits and -/,
  3,
);
await fails(
  "bad-value.ts",
  /^cssints: reactive: the state "tab" is "one, two": a value has no commas and no spaces$/,
  3,
);
await fails(
  "bad-event.ts",
  /^cssints: reactive: "dblclick" is not an event reactive\(\) listens to: click, input, change, submit/,
  4,
);
await fails("bad-attribute.ts", /^cssints: reactive: "aria expanded" is not an attribute name$/, 4);
// set() checks its literal before a program is built, so the error is the library's (a MacroError), at the call site
await assert.rejects(code("bad-at.ts"), (e) => {
  assert.equal(e._tag, "MacroError");
  assert.match(
    e.message.split("\n")[0],
    /^cssints: reactive: the value of "tab" is "@value": a value has no @ \(the runtime reads @value and @checked from the field\)$/,
  );
  assert.equal(e.loc?.line, 5, "the call site");
  return true;
});
await server.close();

// the same with a target set that has every feature: the runtime still ships (the build's targets are read once per
// process, so another one)
for (const [name, targets] of [
  ["all", "chrome 146, safari 26"],
  ["old", "firefox 128"],
])
  console.log(
    execFileSync(process.execPath, [import.meta.filename, name], {
      env: { ...process.env, BROWSERSLIST: targets },
      encoding: "utf8",
    }).trim(),
  );
console.log("reactive: ok");
process.exit(0);
