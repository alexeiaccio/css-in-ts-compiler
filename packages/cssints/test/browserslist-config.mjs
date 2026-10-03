// The targets come from the standard browserslist config of process.cwd() (package.json "browserslist", .browserslistrc,
// the env sections), BROWSERSLIST overrides it, `defaults` when nothing is configured; the exported `cssTarget` and the
// support warnings read the same one. Each case is a child process that changes into a temp app: the targets are read
// once per process. Run: node browserslist-config.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const plugin = pathToFileURL(join(import.meta.dirname, "../src/plugin.ts")).href;
const probe = (dir) => `
process.chdir(${JSON.stringify(dir)});
const { cssTarget } = await import(${JSON.stringify(plugin)});
const { supportOf } = await import("@cssints/css-grammar/support");
const w = supportOf("color", "oklch(0.5 0.1 20)")[0];
console.log("PROBE " + JSON.stringify({ cssTarget, lacking: w?.lacking ?? [] }));
`;

const dirs = [];
const app = (files) => {
  const dir = mkdtempSync(join(tmpdir(), "cssints-browserslist-"));
  dirs.push(dir);
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  return dir;
};
const run = (dir, env = {}) => {
  const { BROWSERSLIST: _b, BROWSERSLIST_ENV: _e, NODE_ENV: _n, ...rest } = process.env;
  const out = execFileSync(process.execPath, ["--input-type=module", "--eval", probe(dir)], {
    cwd: join(import.meta.dirname, ".."), // resolves the workspace packages
    env: { ...rest, ...env },
    encoding: "utf8",
  });
  return JSON.parse(
    out
      .split("\n")
      .find((l) => l.startsWith("PROBE "))
      .slice(6),
  );
};

try {
  const field = app({
    "package.json": JSON.stringify({ name: "a", browserslist: ["chrome 100", "safari 15.2"] }),
  });
  assert.deepEqual(run(field), {
    cssTarget: ["chrome100", "safari15.2"],
    lacking: ["chrome 100", "safari 15.2"],
  });
  // BROWSERSLIST still overrides it
  assert.deepEqual(run(field, { BROWSERSLIST: "chrome 130" }), {
    cssTarget: ["chrome130"],
    lacking: [],
  });

  // the sections: BROWSERSLIST_ENV, else NODE_ENV, else production
  const sections = app({
    "package.json": JSON.stringify({
      name: "b",
      browserslist: { production: ["chrome 100"], development: ["chrome 130"] },
    }),
  });
  assert.deepEqual(run(sections).cssTarget, ["chrome100"]);
  assert.deepEqual(run(sections, { NODE_ENV: "development" }).cssTarget, ["chrome130"]);
  assert.deepEqual(run(sections, { BROWSERSLIST_ENV: "development" }), {
    cssTarget: ["chrome130"],
    lacking: [],
  });

  const rc = app({
    "package.json": JSON.stringify({ name: "c" }),
    ".browserslistrc": "# the old ones\nfirefox 100\n",
  });
  assert.deepEqual(run(rc), { cssTarget: ["firefox100"], lacking: ["firefox 100"] });

  // nothing configured: `defaults`
  const bare = app({ "package.json": JSON.stringify({ name: "d" }) });
  assert.deepEqual(run(bare), run(bare, { BROWSERSLIST: "defaults" }));
} finally {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
}

console.log(
  "browserslist-config: package.json, .browserslistrc, env sections, BROWSERSLIST, defaults",
);
