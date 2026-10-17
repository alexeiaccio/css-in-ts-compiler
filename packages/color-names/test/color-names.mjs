// @cssints/color-names, through the engine and on its own: the generated data (one file per sector, every key of the
// list, a fresh run of the generator byte for byte), named() and the sector members as hex, the colour-word rule, a name
// in several sectors, the wrong-sector error, the unknown-name suggestion, and nearest(). Run: node test/color-names.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import cssints from "cssints/vite";
import { createLogger, createServer } from "vite";

// ---------- the generated data
const SECTORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "blue",
  "purple",
  "pink",
  "brown",
  "neutral",
];
const src = `${import.meta.dirname}/../src`;
const committed = Object.fromEntries(
  SECTORS.map((sector) => [sector, readFileSync(`${src}/${sector}.ts`, "utf8")]),
);
// a fresh run of the generator gives the committed bytes (it is deterministic, and the data is not stale)
const fresh = mkdtempSync(join(tmpdir(), "color-names-"));
execFileSync(process.execPath, [`${import.meta.dirname}/../scripts/generate.ts`, fresh]);
assert.deepEqual(readdirSync(fresh).sort(), SECTORS.map((sector) => `${sector}.ts`).sort());
for (const sector of SECTORS)
  assert.equal(readFileSync(`${fresh}/${sector}.ts`, "utf8"), committed[sector], sector);
// the key rule: letters (accents kept), digits and hyphens; the one collision of the list keeps a hyphen
const keysOf = (text) =>
  [...text.matchAll(/^ {2}(.+?): "/gm)].map(([, key]) =>
    key.startsWith('"') ? JSON.parse(key) : key,
  );
const keys = new Set();
for (const sector of SECTORS) {
  const own = keysOf(committed[sector]);
  assert.ok(own.length > 1_000, `${sector}: ${own.length}`);
  for (const key of own) {
    assert.match(key, /^[\p{L}\p{N}-]+$/u, key);
    keys.add(key);
  }
}
assert.equal(keys.size, 31_939, "every name has its key");
const sizes = Object.fromEntries(
  SECTORS.map((sector) => [sector, keysOf(committed[sector]).length]),
);
assert.deepEqual(sizes, {
  red: 3070,
  orange: 2835,
  yellow: 4179,
  green: 4607,
  cyan: 1805,
  blue: 3570,
  purple: 2269,
  pink: 1736,
  brown: 3194,
  neutral: 4828,
});
// the biggest sector is neutral, and no sector is near the flat list
assert.equal(Math.max(...Object.values(sizes)), 4828);

// ---------- nearest(), its own entry and build time only
const { nearest } = await import("../src/nearest.ts");
assert.deepEqual(nearest("#000000"), { name: "black", hex: "#000000", distance: 0 });
// the list's own API (api.color.pizza) returns the same name for this blue
const dodger = nearest("#3b82f6");
assert.equal(dodger.name, "dodger-blue");
assert.equal(dodger.hex, "#3e82fc");
assert.ok(dodger.distance > 0 && dodger.distance < 1, String(dodger.distance));
assert.equal(nearest("not a colour"), undefined);

// ---------- through the engine
const root = `${import.meta.dirname}/fixtures`;
const plugins = cssints();
const warnings = [];
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
console.log(css);
assert.ok(!transformed.includes("color-name-list"), `no data in the client\n${transformed}`);
assert.ok(!transformed.includes("nearest"), transformed);

const flat = css.replace(/\s+/g, " ");
// named() is the list's hex: #ff9300 for tangerine, #020035 for midnight-blue
assert.ok(flat.includes("color:#ff9300"), css);
assert.ok(flat.includes("background-color:#020035"), css);
// the colour word decides: ferrari red is in red() though its hue is orange
assert.ok(flat.includes("color:#ff2800"), css);
// a name in several sectors: orange red, in both
assert.ok(flat.includes("color:#fe4401"), css);
// the list's green, not the CSS keyword
assert.ok(flat.includes("color:#00ff00"), css);
// the sectors: abalone is neutral, chocolate is brown, and both are the same hex as named()
assert.ok(flat.includes("color:#f8f3f6"), css);
assert.ok(flat.includes("color:#d2691e"), css);
assert.deepEqual(warnings, []);

// a name in several sectors is taken by each of its sectors, and gives the same declaration
const several = await code("several.ts");
assert.match(several, /export const red = "(_\w+)";/);
assert.equal(
  several.match(/export const red = "(_\w+)";/)[1],
  several.match(/export const orange = "(_\w+)";/)[1],
);
assert.ok(sheet("several.ts").replace(/\s+/g, " ").includes("color:#fe4401"));

// the errors, at the call: an unknown name with the nearest key, and a name of another sector (both would be type
// errors in user code; the fixtures reach the build on purpose)
const unknown = await failure("unknown.ts");
assert.match(unknown.message, /colornames: no colour name "tangerin", did you mean tangerine\?/);
const wrong = await failure("wrong-sector.ts");
assert.match(wrong.message, /colornames: "abalone" is in neutral/);

await server.close();
console.log("color-names: ok");
process.exit(0);
