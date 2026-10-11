// Export groups (docs/research/groups.md): `cssints/<group>` imports at build time. The generated declarations and the data
// the build reads agree, a group's members work as in "cssints", and a keyword, function, unit, media feature or member
// outside the group is an error located at the call that names the group. Run: node groups.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { build, createServer } from "vite";

import { BUILDERS, FUNCTIONS, PROPS, PSEUDOS } from "../src/lib.ts";
import { groups } from "../src/groups-data.ts";
import cssints from "../src/plugin.ts";

// The declarations (what TypeScript reads) and the data (what the build reads) come from one run of scripts/groups.ts.
const tied = new Set([...Object.keys(PROPS), ...Object.keys(FUNCTIONS), ...Object.keys(PSEUDOS)]);
for (const [id, g] of Object.entries(groups)) {
  const text = readFileSync(`${import.meta.dirname}/../src/groups/${id}.ts`, "utf8");
  const declared = new Set(
    [...text.matchAll(/^export declare const (\w+):/gm)]
      .map((m) => m[1])
      .concat(
        [...text.matchAll(/^export \{ _var as var \}/gm)].length ? ["var"] : [],
        [...text.matchAll(/^export \{ keyframes \}/gm)].length ? ["keyframes"] : [],
      ),
  );
  const members = new Set(g.members.split(" "));
  for (const m of members) assert.ok(declared.has(m), `${id}: ${m} is a member but not declared`);
  for (const m of declared) assert.ok(members.has(m), `${id}: ${m} is declared but not a member`);
  assert.ok(
    [...members].every((m) => tied.has(m) || BUILDERS.has(m) || m === "positionTry"),
    id,
  );
}
assert.ok(Object.keys(groups).length > 90 && Object.hasOwn(groups, "css-grid-2"));

const root = import.meta.dirname;
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  logLevel: "warn",
  server: { middlewareMode: true, watch: null, ws: false },
  plugins,
});
const client = server.environments.client;
const sheet = (f) => plugins[0].api.sheet([`${root}/${f}`]);
const failure = async (f) => {
  try {
    await client.transformRequest(`/${f}`);
  } catch (e) {
    return e;
  }
  throw new Error(`${f} passed`);
};

// What a group has is what "cssints" has: the same declarations, the same classes.
await client.transformRequest("/fixtures/groups-ok.ts");
const css = sheet("fixtures/groups-ok.ts");
for (const rule of [
  "display:grid",
  "color:rebeccapurple",
  "width:calc(100% - 2rem)",
  "align-items:start;align-items:center",
  "gap:1rem",
  "flex-direction:column",
  ":hover{color:red}",
  "@media (width >= 40rem)",
])
  assert.ok(css.includes(rule), `${rule} missing in\n${css}`);

// Spec groups: a level has the levels of its series before it; the group of a level bans what later levels define.
await client.transformRequest("/fixtures/groups-spec.ts");
const spec = sheet("fixtures/groups-spec.ts");
assert.match(spec, /color-mix\(in oklab,red,blue\)|color-mix\(in oklab, red, blue\)/);
assert.match(spec, /grid-template-rows:subgrid/);
assert.match(spec, /display:grid-lanes/);

// Out of the group: an error at the call, naming the group.
const bad = [
  ["kw", /^cssints: display: "grid-lanes" is not in cssints\/widely-available/, 2],
  ["fn", /^cssints: color: "light-dark\(\)" is not in cssints\/widely-available/, 2],
  ["fallback", /^cssints: color: "contrast-color\(\)" is not in cssints\/widely-available/, 2],
  ["unit", /^cssints: width: "4rch" is not in cssints\/widely-available/, 2],
  ["media", /^cssints: @media: "prefers-reduced-data" is not in cssints\/widely-available/, 2],
  ["member", /^cssints: animationTimeline is not in cssints\/widely-available/, 2],
  ["chain", /^cssints: align-items: "anchor-center" is not in cssints\/widely-available/, 2],
  ["spec", /^cssints: color: "color-mix\(\)" is not in cssints\/css-color-4/, 2],
  ["mq", /^cssints: @media: "prefers-color-scheme" is not in cssints\/mediaqueries-4/, 2],
  ["discouraged", /^cssints: text-decoration-line: "blink" is not in cssints\/not-discouraged/, 2],
];
for (const [name, message, line] of bad) {
  const e = await failure(`fixtures/groups-bad-${name}.ts`);
  assert.match(e.message, message, name);
  assert.equal(e.loc?.line, line, `${name}: located at the call`);
}

// A group is build time like "cssints": without the attribute it is an error.
const e = await failure("fixtures/groups-no-attribute.ts");
assert.match(
  e.message,
  /imports build-time display from "cssints\/widely-available" without the attribute/,
);

// A production build: the import is gone from the client, the classes and the rules are in.
const built = [
  await build({
    root,
    configFile: false,
    logLevel: "silent",
    plugins: cssints(),
    build: {
      write: false,
      minify: false,
      rollupOptions: { input: `${root}/fixtures/groups-main.ts` },
    },
  }),
].flat()[0].output;
assert.ok(!built.find((f) => f.type === "chunk").code.includes("widely-available"));
assert.match(String(built.find((f) => f.fileName.endsWith(".css")).source), /display:grid/);
await assert.rejects(
  build({
    root,
    configFile: false,
    logLevel: "silent",
    plugins: cssints(),
    build: { write: false, rollupOptions: { input: `${root}/fixtures/groups-bad-kw.ts` } },
  }),
  /display: "grid-lanes" is not in cssints\/widely-available/,
);

console.log(
  `groups: ${Object.keys(groups).length} groups, declarations and data agree, members, bans and errors ok`,
);
await server.close();
process.exit(0);
