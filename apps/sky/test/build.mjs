// The build check, as the demo's in packages/cssints/test/sheet.mjs: one CSS file with the layer order first, the
// classes Solid compiled into its template, and none of the engine in the JavaScript.
// The working directory is the project, as in a user's build: icons() reads @iconify-json/* from it.
import assert from "node:assert/strict";

import { build } from "vite";

process.chdir(`${import.meta.dirname}/..`);
const out = await build({ root: process.cwd(), logLevel: "warn", build: { write: false } });
const files = [out].flat().flatMap((o) => o.output);
const css = files.filter((f) => f.fileName.endsWith(".css"));
assert.equal(css.length, 1);
const sheet = String(css[0].source);
assert.ok(sheet.startsWith("@layer "), sheet);
assert.match(sheet, /@container card \(width ?< ?24rem\)\{\._\w+\{flex-direction:column/);
assert.match(sheet, /\{padding:\.5rem\}/); // the cv() base
assert.match(sheet, /\._\w+\{--fr-r:1\.5rem\}/); // frame()
assert.match(sheet, /\._\w+\{--_svg:url\(/); // the icon

const js = files.find((f) => f.fileName.endsWith(".js"));
assert.match(js.code, /<main class="_\w+ _\w+ _\w+">/, "Solid kept the classes in its template");
assert.match(js.code, /_cv\(\{/, "the cv() config is class strings");
assert.ok(!/createTokens|css-grammar|toDecls/.test(js.code), "no engine code in the client");
console.log(
  `sky build: ${css[0].fileName} ${sheet.length} bytes, ${js.fileName} ${js.code.length} bytes`,
);
process.exit(0);
