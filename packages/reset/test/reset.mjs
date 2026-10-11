// @cssints/reset through the engine: where the reset lands in the sheet (below every other style), the blocks the flags
// add, and that a call prints no class. Run: node test/reset.mjs
import assert from "node:assert/strict";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

import cssints from "cssints/vite";
import { createLogger, createServer } from "vite";

import { groups } from "../../cssints/src/groups-data.ts";

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

const transformed = await code("use.ts");
const css = sheet("use.ts");
console.log(css);

// The order: `reset` is declared before the engine's layers, so it ranks below `_.k` (global(), tokens), the class
// layers and `app`, which is declared after them.
assert.ok(
  css.startsWith("@layer reset;\n@layer _.k, _.a, _.b, _.c, _.d, _.e;\n@layer app;\n"),
  css,
);
assert.match(css, /^@layer _\.k \{\n {2}body\{margin:1rem\}\n\}$/m);
assert.equal(css.match(/^@layer reset \{$/gm).length, 3, "base once (two calls), media, prose");
assert.ok(!css.includes("  @layer reset"), "not nested in _.k");

assert.ok(css.includes("*, *::before, *::after { box-sizing: border-box } * { margin: 0 }"), css);
assert.ok(css.includes(":where(img, picture, video, canvas, svg) { display: block;"), css);
assert.ok(css.includes(":not([class]) { margin-block-start: 1em }"), css);

// without flags only the base
await code("base.ts");
const base = sheet("base.ts");
assert.equal(base.match(/^@layer reset \{$/gm).length, 1, base);
assert.ok(!base.includes("max-inline-size") && !base.includes(":not([class])"), base);

// a reset prints no class and leaves no runtime import
assert.ok(!transformed.includes("@cssints/reset"), `no runtime import\n${transformed}`);

// ---- the variants: @cssints/reset/<id> for the Baseline groups of cssints (scripts/variants.ts), through the pattern export
const out = `${root}/out`;
mkdirSync(out, { recursive: true });
const sheetOf = async (name, source) => {
  writeFileSync(`${out}/${name}.ts`, source);
  await code(`out/${name}.ts`);
  return sheet(`out/${name}.ts`);
};
// the rules of the reset layer as "selector { declaration }", one per declaration
const declarations = (css) =>
  css
    .split("@layer reset {")
    .slice(1)
    .flatMap((block) =>
      [...block.split("\n}")[0].matchAll(/([^{}]+)\{([^}]*)\}/g)].flatMap(([, selector, body]) =>
        body.split(";").map((d) => `${selector.trim()} { ${d.trim()} }`),
      ),
    );
const ids = Object.entries(groups).flatMap(([id, g]) => (g.kind === "baseline" ? [id] : []));
const variants = new Map();
for (const id of ["limited-availability", ...ids.filter((id) => id !== "not-discouraged")])
  variants.set(
    id,
    declarations(
      await sheetOf(
        id.replaceAll("/", "-"),
        `import { reset } from "@cssints/reset/${id}" with { type: "cssints" };\nreset({ media: true, prose: true });\n`,
      ),
    ),
  );
console.log(`variants: ${variants.size}`);

// the full reset is limited-availability, and every variant has a subset of it
const full = declarations(css);
assert.equal(full.length, 19, "the full reset has 19 declarations");
assert.deepEqual(variants.get("limited-availability"), full);
for (const [id, kept] of variants) {
  assert.ok(
    kept.every((d) => full.includes(d)),
    id,
  );
  assert.ok(
    kept.every((d) => !d.endsWith("{  }")),
    `${id}: a rule with no declaration is gone`,
  );
}
// one module per variant, and no other
const files = readdirSync(`${import.meta.dirname}/../src/groups`, { recursive: true })
  .filter((f) => f.endsWith(".ts"))
  .map((f) => f.replace(/\.ts$/, ""));
assert.deepEqual(files.toSorted(), [...variants.keys()].toSorted());

// what is kept and dropped
const has = (id, d) => variants.get(id).includes(d);
const prefixed = "html { -webkit-text-size-adjust: none }";
for (const id of variants.keys())
  assert.ok(has(id, prefixed), `${id}: the prefixed property is not in the data`);
assert.ok(!has("widely-available", "html { text-size-adjust: none }"));
assert.ok(!has("widely-available", ":where(p) { text-wrap: pretty }"), "the rule is gone");
assert.ok(!has("widely-available", ":where(h1, h2, h3, h4, h5, h6) { text-wrap: balance }"));
assert.ok(has("newly-available", ":where(h1, h2, h3, h4, h5, h6) { text-wrap: balance }"));
assert.ok(
  has(
    "widely-available/with-downstream",
    ":where(p, h1, h2, h3, h4, h5, h6) { overflow-wrap: break-word }",
  ),
);
assert.ok(!has("baseline-2019", ":where(img, video) { block-size: auto }"), "logical sizes: 2020");
assert.ok(has("baseline-2020", ":where(img, video) { block-size: auto }"));
assert.ok(!has("baseline-2017", ":where(p, h1, h2, h3, h4, h5, h6) { overflow-wrap: break-word }"));

// not-discouraged bans nothing the reset has, so it has no subpath of its own: it would be the full reset
writeFileSync(
  `${out}/nd.ts`,
  `import { make } from "../../../src/make.ts";\nexport const reset = make("not-discouraged");\n`,
);
assert.deepEqual(
  declarations(
    await sheetOf(
      "nd-use",
      `import { reset } from "./nd.ts" with { type: "cssints" };\nreset({ media: true, prose: true });\n`,
    ),
  ),
  full,
);

// what each variant drops, as a table for the README
const dropped = new Map();
for (const [id, kept] of variants) {
  const gone = [
    ...new Set(full.filter((d) => !kept.includes(d)).map((d) => d.match(/\{ (.*) \}/)[1])),
  ];
  const key = gone.join("\n");
  dropped.set(key, [...(dropped.get(key) ?? []), id]);
}
const table = [
  "| Dropped | Variants |",
  "| --- | --- |",
  ...[...dropped].map(
    ([gone, ids]) =>
      `| ${
        gone
          ? gone
              .split("\n")
              .map((d) => `\`${d}\``)
              .join(", ")
          : "nothing"
      } | ${ids.map((id) => `\`${id}\``).join(", ")} |`,
  ),
].join("\n");
rmSync(out, { recursive: true });
const readme = `${import.meta.dirname}/../README.md`;
const marked = /(<!-- variants -->)([\s\S]*?)(<!-- \/variants -->)/;
if (process.argv.includes("--write"))
  writeFileSync(
    readme,
    readFileSync(readme, "utf8").replace(marked, (_, a, __, c) => `${a}\n\n${table}\n\n${c}`),
  );
// the formatter pads the cells: compare the cells
const cells = (t) => t.replace(/ *\| */g, "|").replace(/-{3,}/g, "---");
assert.equal(
  cells(readFileSync(readme, "utf8").match(marked)?.[2].trim() ?? ""),
  cells(table),
  `the table of README.md is stale: node test/reset.mjs --write\n${table}`,
);

await server.close();
console.log("reset: ok");
process.exit(0);
