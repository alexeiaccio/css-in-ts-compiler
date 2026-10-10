// Stages the publishable copy of a package: dist/ (and the other entries of `files`, never `src`), README, LICENSE and the
// published manifest. scripts/pack.mjs packs the copy; scripts/release.mjs stages every package into `.publish`
// (`publishConfig.directory`), which `changeset publish` publishes.
//
// In the repo the manifest points at src/*.ts so tests, typechecks and the demo run from sources. The published manifest
// is that one with `publishConfig` laid over it (pnpm's rule: its keys replace the top-level ones, `exports` included),
// without `scripts` and `devDependencies` (of publishConfig only `access` stays), and `workspace:` ranges turned into
// `^<sibling version>`. Neither npm pack nor npm publish does any of this, and `changeset publish` calls npm for a bun
// workspace.
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";

export const root = resolve(import.meta.dirname, "..");
export const packageDirs = readdirSync(join(root, "packages"))
  .map((d) => join(root, "packages", d))
  .filter((d) => existsSync(join(d, "package.json")));
export const read = (dir) => JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
export const versions = Object.fromEntries(
  packageDirs.map((d) => read(d)).map((p) => [p.name, p.version]),
);

const unworkspace = (name, range) => {
  if (!range.startsWith("workspace:")) return range;
  const version = versions[name];
  if (!version) throw new Error(`${name}: ${range} is not a package of this repo`);
  const kind = range.slice("workspace:".length);
  return kind === "~" ? `~${version}` : kind === "*" || kind === "^" ? `^${version}` : kind;
};

// Writes the publishable copy of the package in `pkgDir` to `dest`; returns its manifest.
export function stage(pkgDir, dest) {
  const manifest = read(pkgDir);
  if (!existsSync(join(pkgDir, "dist")))
    throw new Error(`${manifest.name}: no dist/, run "bun run build" first`);
  // The package's own `prepack` (cssints copies docs/API.md into docs/): the staged manifest has no scripts to run it.
  if (manifest.scripts?.prepack)
    execFileSync("npm", ["run", "--silent", "prepack"], { cwd: pkgDir, stdio: "inherit" });

  const { publishConfig = {}, scripts: _scripts, devDependencies: _dev, ...rest } = manifest;
  const { access, directory: _directory, ...overrides } = publishConfig;
  const files = (manifest.files ?? []).filter((f) => f !== "src" && existsSync(join(pkgDir, f)));
  const published = { ...rest, ...overrides, files, ...(access && { publishConfig: { access } }) };
  for (const field of ["dependencies", "peerDependencies", "optionalDependencies"])
    for (const [name, range] of Object.entries(published[field] ?? {}))
      published[field][name] = unworkspace(name, range);

  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  for (const f of files) {
    mkdirSync(dirname(join(dest, f)), { recursive: true });
    cpSync(join(pkgDir, f), join(dest, f), { recursive: true });
  }
  // a package without a README or a LICENSE of its own takes the repository's
  for (const f of ["README.md", "LICENSE"]) {
    const from = [join(pkgDir, f), join(root, f)].find((p) => existsSync(p));
    if (from) cpSync(from, join(dest, f));
  }
  writeFileSync(join(dest, "package.json"), JSON.stringify(published, null, 2) + "\n");
  return published;
}
