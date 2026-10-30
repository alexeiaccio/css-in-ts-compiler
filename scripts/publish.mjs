// The publish half of `bun run release` (RELEASING.md): `changeset publish` over the packages staged into `.publish`, with a
// verifier. Two pushes in a row both run the release workflow; the second one reads the registry a few seconds after the first
// published, `changeset publish` decides it has to publish again, and npm answers `E409: Cannot publish over previously staged
// version` — a red job for a release that went out. A package whose exact version is on the registry is published, whatever
// the last publish command said, so that is the check: before the publish, to skip it, and after a failure, to tell a race
// from a real one.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const packages = readdirSync(join(root, "packages"))
  .map((dir) => join(root, "packages", dir))
  .filter((dir) => existsSync(join(dir, "package.json")))
  .map((dir) => {
    const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    return { name: manifest.name, version: manifest.version };
  });

const published = async (name, version) => {
  const id = name.replace("/", "%2F");
  const response = await fetch(`https://registry.npmjs.org/${id}/${version}`, { method: "HEAD" });
  return response.status === 200;
};

const allPublished = async () => {
  const results = await Promise.all(packages.map((p) => published(p.name, p.version)));
  return packages.filter((_, at) => results[at] === false);
};

const missing = await allPublished();
if (missing.length === 0) {
  process.stdout.write("nothing to publish: every version is on the registry\n");
  // the tags are `changeset publish`'s other job, and a run that skipped the publish may be the one that finds them missing
  execFileSync("git", ["push", "--tags"], { cwd: root, stdio: "inherit" });
  process.exit(0);
}

process.stdout.write(`publishing ${missing.length} of ${packages.length} packages\n`);
try {
  execFileSync("npx", ["changeset", "publish"], { cwd: root, stdio: "inherit" });
} catch (error) {
  const left = await allPublished();
  if (left.length > 0) {
    process.stderr.write(
      `failed to publish: ${left.map((p) => `${p.name}@${p.version}`).join(", ")}\n`,
    );
    process.exit(1);
  }
  process.stderr.write(
    "changeset publish reported a failure, but every version is on the registry: a stage of the same version from a " +
      "previous run, not a broken release\n",
  );
  execFileSync("git", ["push", "--tags"], { cwd: root, stdio: "inherit" });
}
