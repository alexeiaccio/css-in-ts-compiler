// The starter kit's own smoke test: copy the template, install it, add every item of the repo's
// registry build from a local server, then run the copied conformance in one browser test run and
// type-check every file a copy landed. The live registry is added last, one item, so the published
// JSON and the CDN are still exercised.
//
// What it proves is the whole chain a reader meets — template, `components.json`, the item JSON,
// the plugin versions — for every item, not for the one the release happened to check.
//
//   node scripts/starter-smoke.mjs [--keep]
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

const root = join(import.meta.dirname, "..");
const template = join(root, "templates", "solid-vite");
const registry = join(root, "apps", "ui", "r");
const keep = process.argv.includes("--keep");
const dest = mkdtempSync(join(tmpdir(), "cssints-starter-"));

// The repo's own registry build decides what is checked: an item with a `*.browser.test.tsx`
// among its files is one whose conformance travels with it.
const index = JSON.parse(readFileSync(join(registry, "registry.json"), "utf8"));
const items = index.items.map((item) => ({
  name: item.name,
  tested: item.files.some((file) => (file.target ?? "").endsWith(".browser.test.tsx")),
  files: item.files.map((file) => file.target).filter((target) => typeof target === "string"),
}));
const tested = items.filter((item) => item.tested).map((item) => item.name);
const plain = items.filter((item) => !item.tested).map((item) => item.name);
process.stdout.write(
  `items: ${items.length} (${tested.length} with a conformance test: ${tested.join(", ")})\n`,
);

// A plain static server for `apps/ui/r`: the CLI reads the items from the same JSON the site
// deploys, so an item added in this commit is real here before the deploy has run.
const served = new Set();
const server = createServer((request, response) => {
  const name = (request.url ?? "")
    .split("?")[0]
    .replace(/^\/r\//, "")
    .replace(/\.json$/, "");
  const path = join(registry, `${name}.json`);
  if (!/^[\w-]+$/.test(name) || !existsSync(path)) {
    response.writeHead(404).end();
    return;
  }
  served.add(name);
  response.writeHead(200, { "content-type": "application/json" });
  response.end(readFileSync(path));
});
await new Promise((listening) => server.listen(0, "127.0.0.1", listening));
const { port } = server.address();
process.stdout.write(`registry: http://127.0.0.1:${port}/r/{name}.json\n`);

const run = (command, args) => {
  process.stdout.write(`\n$ ${command} ${args.join(" ")}\n`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: dest,
      stdio: "inherit",
      env: { ...process.env, VITEST: "", NODE_OPTIONS: "" },
    });
    const timeout = setTimeout(() => child.kill("SIGKILL"), 900_000);
    child.on("error", reject);
    child.on("exit", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with ${code}`));
      }
    });
  });
};

try {
  cpSync(template, dest, { recursive: true });

  // The registry items are built from this checkout's sources, which are ahead of the last release whenever a kit change
  // lands with the engine change it needs: install the workspace's own packages (CI builds their `dist` before this
  // script) so what is checked is this commit, not whichever version npm happens to serve. Tarballs, not `file:` paths:
  // npm installs a directory as a symlink, and the packages then lose their own dependency tree (a peer such as `effect`
  // is not installed for a symlink). The live-registry step at the end still exercises the published item JSON and the CDN.
  const manifestPath = join(dest, "package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const tarballs = join(dest, ".tarballs");
  mkdirSync(tarballs, { recursive: true });
  const linked = [];
  for (const field of ["dependencies", "devDependencies"]) {
    for (const name of Object.keys(manifest[field] ?? {})) {
      const dir = join(root, "packages", name.split("/").pop());
      const path = join(dir, "package.json");
      if (!existsSync(path) || JSON.parse(readFileSync(path, "utf8")).name !== name) {
        continue;
      }
      // `bun pm pack`, not `npm pack`: it rewrites a `workspace:*` dependency to the version it packs, and npm cannot
      // install a tarball that still carries the protocol.
      // bun ends its output with a size summary, npm with the filename: the `*.tgz` line is the one both agree on
      const packed = execFileSync("bun", ["pm", "pack", "--destination", tarballs], {
        cwd: dir,
        encoding: "utf8",
      })
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.endsWith(".tgz"))
        .pop();
      manifest[field][name] = `file:.tarballs/${basename(packed)}`;
      linked.push(name);
    }
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  if (linked.length > 0) {
    process.stdout.write(`from this checkout: ${linked.join(", ")}\n`);
  }

  // `--legacy-peer-deps`: a peer range somewhere in the toolchain should not decide whether the
  // template works; the test run is the evidence.
  await run("npm", ["install", "--no-audit", "--no-fund", "--legacy-peer-deps"]);

  // The local run reads the repo's build; the live URL is put back for the last item.
  const componentsPath = join(dest, "components.json");
  const components = JSON.parse(readFileSync(componentsPath, "utf8"));
  const live = components.registries["@cssints"];
  components.registries["@cssints"] = `http://127.0.0.1:${port}/r/{name}.json`;
  writeFileSync(componentsPath, `${JSON.stringify(components, null, 2)}\n`);

  await run("npx", [
    "--yes",
    "shadcn@latest",
    "add",
    ...items.map((item) => `@cssints/${item.name}`),
    "--yes",
    "--overwrite",
  ]);

  const unread = items.map((item) => item.name).filter((name) => !served.has(name));
  assert.deepEqual(
    unread,
    [],
    `the CLI did not read these items from the local registry: ${unread}`,
  );
  for (const item of items) {
    for (const target of item.files) {
      assert.ok(existsSync(join(dest, target)), `${item.name}: ${target} did not land`);
    }
  }

  // One run: every copied conformance test in a real Chromium.
  await run("npm", ["test"]);
  // The items without a test at least have to type-check; the template's own tsc (from vite-plus)
  // checks the whole `src`, so every copied file is in it.
  await run("npx", ["tsc", "--noEmit"]);

  // The published path, last: the JSON and the CDN, not a copy of the registry in this checkout.
  components.registries["@cssints"] = live;
  writeFileSync(componentsPath, `${JSON.stringify(components, null, 2)}\n`);
  await run("npx", ["--yes", "shadcn@latest", "add", "@cssints/switch", "--yes", "--overwrite"]);
  assert.ok(
    existsSync(join(dest, "src", "components", "ui", "switch.tsx")),
    "@cssints/switch did not land from the live registry",
  );

  process.stdout.write(
    `\nstarter smoke: ok — ${items.length} items, ${tested.length} conformance tests, type-checked (${plain.join(", ")} have no test)\n`,
  );
} finally {
  server.close();
  if (keep) {
    process.stdout.write(`kept ${dest}\n`);
  } else {
    rmSync(dest, { recursive: true, force: true });
  }
}
