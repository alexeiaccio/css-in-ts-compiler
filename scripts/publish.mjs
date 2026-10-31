// The publish half of `bun run release` (RELEASING.md): `changeset publish` over the packages staged into `.publish`, with a
// verifier. Two pushes in a row both run the release workflow; the second one reads the registry a few seconds after the first
// published, `changeset publish` decides it has to publish again, and npm answers `E409: Cannot publish over previously staged
// version` — a red job for a release that went out. A package whose exact version is on the registry is published, whatever
// the last publish command said, and a version npm holds as a stage it refuses to stage twice: both mean "nothing left to do
// here", and only a failure of another kind is a broken release.
//
//   node scripts/publish.mjs            # the publish (release:publish)
//   node scripts/publish.mjs --check    # the classifier below, on fixtures, with no network
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;

// npm refuses to stage a version twice, so a package whose stage still waits for a maintainer's 2FA answers E409 and no retry
// can ever succeed. That is the publish having happened (as a stage), not a broken release.
export const stagedOnly = (output) => {
  const start = output.indexOf("Some packages failed to publish:");
  if (start === -1) return false;
  const lines = output.slice(start).split("\n").slice(1);
  let staged = 0;
  for (const line of lines) {
    const text = line.trim();
    if (text === "" || text.startsWith("🦋")) break;
    if (/^@?[\w@/.-]+@[\d.]+$/.test(text)) continue;
    if (!text.includes("previously staged version")) return false;
    staged += 1;
  }
  return staged > 0;
};

if (process.argv.includes("--check")) {
  const staged = [
    "Some packages failed to publish:",
    "@cssints/fluid@0.18.0",
    '└ E409: 409 Conflict - PUT https://registry.npmjs.org/@cssints%2ffluid - Cannot publish over previously staged version "0.18.0".',
    "@cssints/fonts@0.18.0",
    '└ E409: 409 Conflict - PUT https://registry.npmjs.org/@cssints%2ffonts - Cannot publish over previously staged version "0.18.0".',
    "🦋 Exited with code 1",
    "",
  ].join("\n");
  const other = [
    "Some packages failed to publish:",
    "@cssints/fluid@0.18.0",
    "└ E403: 403 Forbidden - You do not have permission",
    "🦋 Exited with code 1",
    "",
  ].join("\n");
  const results = {
    staged: stagedOnly(staged),
    other: stagedOnly(other),
    none: stagedOnly("boom"),
  };
  const expected = { staged: true, other: false, none: false };
  const ok = Object.keys(expected).every((k) => results[k] === expected[k]);
  process.stdout.write(`${JSON.stringify(results)}${ok ? "" : " — wrong"}\n`);
  process.exit(ok ? 0 : 1);
}

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

const missing = async () => {
  const results = await Promise.all(packages.map((p) => published(p.name, p.version)));
  return packages.filter((_, at) => results[at] === false);
};

const left = await missing();
if (left.length === 0) {
  process.stdout.write("nothing to publish: every version is on the registry\n");
  // the tags are `changeset publish`'s other job, and a run that skipped the publish may be the one that finds them missing
  execFileSync("git", ["push", "--tags"], { cwd: root, stdio: "inherit" });
  process.exit(0);
}

process.stdout.write(`publishing ${left.length} of ${packages.length} packages\n`);
// npm's own lines are the evidence a person reads in the log, so they are kept even though they are captured: a silent
// success is why a finished release once looked like a step that never ran.
let output = "";
let failed = false;
try {
  output = execFileSync("npx", ["changeset", "publish"], {
    cwd: root,
    stdio: ["inherit", "pipe", "pipe"],
    encoding: "utf8",
  });
} catch (error) {
  failed = true;
  output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
}
process.stdout.write(output);

if (!failed) {
  process.stdout.write(`published ${left.length} of ${packages.length} packages\n`);
  execFileSync("git", ["push", "--tags"], { cwd: root, stdio: "inherit" });
} else {
  const still = await missing();
  if (still.length > 0 && !stagedOnly(output)) {
    process.stderr.write(
      `failed to publish: ${still.map((p) => `${p.name}@${p.version}`).join(", ")}\n`,
    );
    process.exit(1);
  }
  process.stderr.write(
    still.length === 0
      ? "changeset publish reported a failure, but every version is on the registry: a stage of the same version from a " +
          "previous run, not a broken release\n"
      : "the remaining versions are staged on npm and wait for a maintainer's approval (2FA); npm refuses to stage them " +
          "twice, so there is nothing left for this run to do\n",
  );
  execFileSync("git", ["push", "--tags"], { cwd: root, stdio: "inherit" });
}
