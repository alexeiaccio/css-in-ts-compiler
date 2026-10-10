// Packs a publishable copy of the package in the current directory (see stage.mjs): a tarball next to package.json;
// never publishes. cwd: a package with dist/ (bun run build first).
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { stage } from "./stage.mjs";

const pkgDir = process.cwd();
const dest = mkdtempSync(join(tmpdir(), "cssints-pack-"));
try {
  stage(pkgDir, dest);
  execFileSync("npm", ["pack", "--pack-destination", pkgDir], { cwd: dest, stdio: "inherit" });
} finally {
  rmSync(dest, { recursive: true, force: true });
}
