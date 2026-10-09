// The published package holds docs/API.md (its prepack copies it in), which @cssints/mcp's search_docs reads in a
// project. Run: node pack-docs.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const pkg = join(import.meta.dirname, "..");
const out = execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts=false"], {
  cwd: pkg,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
});
const [{ files }] = JSON.parse(out.slice(out.indexOf("[")));
assert.ok(
  files.some((f) => f.path === "docs/API.md"),
  "npm pack lists docs/API.md",
);
assert.equal(
  readFileSync(join(pkg, "docs/API.md"), "utf8"),
  readFileSync(join(pkg, "../../docs/API.md"), "utf8"),
);
console.log("pack: docs/API.md is in the package");
