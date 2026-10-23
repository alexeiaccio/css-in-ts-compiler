// The release dry run, and the first half of `bun run release`: stages every package into its `.publish` directory
// (scripts/stage.mjs) and checks what `changeset publish` would send to npm. Never publishes. cwd: the repository,
// every package built (`bun run build:packages`).
//   node scripts/release.mjs             stage and check every package
//   node scripts/release.mjs --install   also install all the tarballs into a fresh project and start the MCP bin
// Checks per package: the staged manifest has no `private`, no `workspace:` and no `development` condition; the license,
// the repository (exactly the URL of the trusted publisher) and the access are set; every file that `exports` and `bin`
// name exists; a sibling's range is met by the sibling's version; the tarball holds only dist/, docs/, skills/,
// README, LICENSE, THIRD_PARTY_NOTICES.md and package.json (and src/core when `files` names it), never a test or a fixture. Over the whole
// repository: the tracked dist/ folders equal a fresh build.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import semver from "semver";

import { packageDirs, read, root, stage, versions } from "./stage.mjs";

const REPOSITORY = "git+https://github.com/alexeiaccio/css-in-ts-compiler.git";
const problems = [];

const targets = (value) =>
  typeof value === "string"
    ? [value]
    : value && typeof value === "object"
      ? Object.values(value).flatMap(targets)
      : [];
const exists = (dir, target) => {
  if (!target.includes("*")) return existsSync(join(dir, target));
  const [head, tail] = target.split("*");
  const folder = join(dir, head.slice(0, head.lastIndexOf("/") + 1));
  const name = head.slice(head.lastIndexOf("/") + 1);
  return (
    existsSync(folder) && readdirSync(folder).some((f) => f.startsWith(name) && f.endsWith(tail))
  );
};
const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });

// Workspace packages that stay out of npm: the test oracle of the widgets has no dist/ and no publishConfig.
const unpublished = new Set(["@cssints/apg-specs"]);

const staged = [];
for (const dir of packageDirs) {
  const repo = read(dir);
  const bad = (what) => problems.push(`${repo.name}: ${what}`);
  if (unpublished.has(repo.name)) {
    if (!repo.private) bad("must stay private: it is not published");
    continue;
  }
  const dest = join(dir, repo.publishConfig?.directory ?? ".publish");
  if (repo.publishConfig?.directory !== ".publish")
    bad('publishConfig.directory must be ".publish" (changeset publish sends that directory)');
  if (repo.private) bad("private: changeset publish skips the package");
  if (!repo.scripts?.prepublishOnly) bad("no prepublishOnly guard against a plain npm publish");
  const published = stage(dir, dest);

  if (/workspace:|catalog:/.test(JSON.stringify(published)))
    bad("a workspace: or catalog: range is left");
  if (JSON.stringify(published).includes('"development"'))
    bad('the "development" export condition is left');
  if (published.version !== repo.version) bad("version differs");
  if (published.license !== "MIT") bad("license is not MIT");
  if (
    published.repository?.url !== REPOSITORY ||
    published.repository?.directory !== `packages/${dir.split("/").pop()}`
  )
    bad(`repository must be ${REPOSITORY} with the directory of the package`);
  if (published.homepage !== "https://cssints.dev") bad("homepage");
  if (published.publishConfig?.access !== "public") bad("publishConfig.access is not public");
  for (const t of [...targets(published.exports), ...targets(published.bin)])
    if (!exists(dest, t)) bad(`${String(t)} is named by exports or bin and is not in the package`);
  for (const field of ["dependencies", "peerDependencies", "optionalDependencies"])
    for (const [name, range] of Object.entries(published[field] ?? {}))
      if (versions[name] && !semver.satisfies(versions[name], range))
        bad(`${field}.${name} ${String(range)} is not met by ${name}@${String(versions[name])}`);

  const [{ files, size }] = JSON.parse(run("npm", ["pack", "--dry-run", "--json"], dest));
  const paths = files.map((f) => f.path);
  const allowed =
    /^(package\.json|README\.md|LICENSE|THIRD_PARTY_NOTICES\.md|(dist|docs|skills)\/.+)$/;
  for (const p of paths) {
    if (/^src\/core\//.test(p) && published.files.includes("src/core")) continue;
    if (!allowed.test(p)) bad(`${p} does not belong in the tarball`);
    else if (/\.ts$/.test(p) && !/\.d\.[cm]?ts$/.test(p)) bad(`${p}: TypeScript source`);
  }
  for (const f of ["README.md", "LICENSE"]) if (!paths.includes(f)) bad(`no ${f}`);
  console.log(
    `${published.name}@${published.version}  ${paths.length} files, ${(size / 1024).toFixed(0)} kB`,
  );
  staged.push({ published, dest });
}

const stale = run("git", ["status", "--porcelain", "--", ":(glob)packages/*/dist/**"], root).trim();
if (stale)
  problems.push(
    `the tracked dist/ differs from a fresh build (bun run build:packages, then commit the change on master):\n${stale}`,
  );

if (!problems.length && process.argv.includes("--install")) {
  // The tarballs install together into a project of their own; the siblings are not on the registry yet, so each
  // name is overridden by its tarball. The MCP server is started and must answer `initialize`.
  const work = mkdtempSync(join(tmpdir(), "cssints-release-"));
  mkdirSync(join(work, "tarballs"));
  const dependencies = {};
  for (const { published, dest } of staged) {
    const file = JSON.parse(
      run("npm", ["pack", "--json", "--pack-destination", join(work, "tarballs")], dest),
    )[0].filename;
    dependencies[published.name] = `file:./tarballs/${file.replace(/^.*\//, "")}`;
  }
  writeFileSync(
    join(work, "package.json"),
    JSON.stringify(
      { name: "release-check", private: true, dependencies, overrides: dependencies },
      null,
      2,
    ),
  );
  run("npm", ["install", "--no-audit", "--no-fund"], work);
  for (const { published } of staged) {
    const installed = join(work, "node_modules", published.name);
    for (const t of [...targets(published.exports), ...targets(published.bin)])
      if (!exists(installed, t))
        problems.push(`${published.name}: ${String(t)} is missing after npm install`);
  }
  const initialize = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "release-check", version: "0" },
    },
  });
  const { stdout: answer } = spawnSync(join(work, "node_modules/.bin/cssints-mcp"), [], {
    cwd: work,
    input: `${initialize}\n`,
    timeout: 30000,
    encoding: "utf8",
  });
  if (!answer.includes('"result"'))
    problems.push(`cssints-mcp did not answer initialize: ${answer}`);
  else console.log("install: all tarballs install together, cssints-mcp answers initialize");
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("\nrelease check passed: nothing was published");
