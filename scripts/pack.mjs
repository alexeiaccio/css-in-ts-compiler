// Stages a publishable copy of the package in the current directory and runs `npm pack` on it (a tarball next to
// package.json; never publishes). cwd: a package with dist/ (bun run build first).
//
// In the repo the manifest points at src/*.ts so tests, typechecks and the demo run from sources. The published manifest
// is that one with `publishConfig` laid over it (pnpm's rule: its keys replace the top-level ones, `exports` included),
// without `private`, `scripts` and `devDependencies` (of publishConfig only `access` stays), and `workspace:*` turned into `^<sibling version>`.
// npm does not apply publishConfig.exports itself, so a plain `npm pack` here would ship a manifest without dist.
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const pkgDir = process.cwd();
const manifest = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
if (!existsSync(join(pkgDir, "dist")))
  throw new Error(`${manifest.name}: no dist/, run "bun run build" first`);

const siblings = Object.fromEntries(
  readdirSync(resolve(pkgDir, ".."))
    .filter((d) => existsSync(resolve(pkgDir, "..", d, "package.json")))
    .map((d) => JSON.parse(readFileSync(resolve(pkgDir, "..", d, "package.json"), "utf8")))
    .map((p) => [p.name, p.version]),
);
const {
  publishConfig = {},
  private: _private,
  scripts: _scripts,
  devDependencies: _dev,
  ...rest
} = manifest;
const { access, ...overrides } = publishConfig;
const published = { ...rest, ...overrides, ...(access && { publishConfig: { access } }) };
for (const [name, range] of Object.entries(published.dependencies ?? {}))
  if (range.startsWith("workspace:")) published.dependencies[name] = `^${siblings[name]}`;

const stage = mkdtempSync(join(tmpdir(), "cssints-pack-"));
try {
  cpSync(join(pkgDir, "dist"), join(stage, "dist"), { recursive: true });
  for (const f of ["README.md", "LICENSE"])
    if (existsSync(join(pkgDir, f))) cpSync(join(pkgDir, f), join(stage, f));
  writeFileSync(join(stage, "package.json"), JSON.stringify(published, null, 2) + "\n");
  execFileSync("npm", ["pack", "--pack-destination", pkgDir], { cwd: stage, stdio: "inherit" });
} finally {
  rmSync(stage, { recursive: true, force: true });
}
