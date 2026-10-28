// Compiles a starter's skin, authored on cssints (`src/registry/<name>/<name>.ts`), into the plain
// stylesheet the registry item ships (`src/registry/<name>/<name>.css`).
//
// Why the split: the cssints plugin evaluates its helpers at build time, so a component that imports
// them cannot run in a browser test runner — and every copy ships the conformance test it must pass.
// The skin is therefore compiled here, once, and what a reader copies is ordinary CSS with the
// selectors this repository writes. `--check` fails when a generated sheet is stale, which is what CI
// runs: the same rule the Quint artifacts have.
//
//   node scripts/component-css.ts          (write)
//   node scripts/component-css.ts --check  (fail on drift)
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import cssints from "cssints/vite";
import { build } from "vite";

const root = new URL("..", import.meta.url).pathname;

/** Every starter whose sheet is generated; a new skin adds its directory name here. */
const NAMES = ["switch", "disclosure", "button", "checkbox", "radio", "tabs", "accordion"] as const;

const check = process.argv.includes("--check");
const tmp = join(root, ".component-css");

// The engine puts every rule in a layer so a look can be ordered against the engine's own; a copied
// sheet is on its own, in a project that knows no `_` layers, and an unlayered rule of the user's
// would beat every one of ours. So the layer wrappers come off and the order the engine sorted the
// rules into (by layer, then condition) is kept as plain source order.
const unwrapLayers = (sheet: string): string => {
  const statement = /^@layer [^{;]+;\s*$/gm;
  const open = /^@layer [^{]+{\s*$/gm;
  let out = sheet.replace(statement, "");

  // a balanced unwrap: `@layer _.b {` … its matching `}`
  for (let match = open.exec(out); match !== null; match = open.exec(out)) {
    const start = match.index;
    const bodyStart = start + match[0].length;
    let depth = 1;
    let at = bodyStart;
    while (at < out.length && depth > 0) {
      if (out[at] === "{") {
        depth += 1;
      } else if (out[at] === "}") {
        depth -= 1;
      }
      at += 1;
    }
    const body = out.slice(bodyStart, at - 1);
    out = `${out.slice(0, start)}${body.trimEnd()}${out.slice(at)}`;
    open.lastIndex = 0;
  }
  return out
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        // Vite's own marker lines, and the engine's per-member classes: every `cn()` also registers a
        // hashed class, and this sheet is written against `ui-*` selectors, so those rules are dead.
        !line.startsWith("/*$vite$") && !line.startsWith("._"),
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const compile = async (name: string): Promise<string> => {
  mkdirSync(tmp, { recursive: true });
  const entry = join(tmp, `${name}.ts`);
  writeFileSync(
    entry,
    `import "virtual:cssints.css";\nimport "../src/registry/${name}/${name}.ts";\n`,
  );

  const result = await build({
    root,
    configFile: false,
    logLevel: "error",
    plugins: [cssints()],
    build: {
      write: false,
      minify: false,
      // one entry, one sheet: the item ships the sheet of its own skin and nothing else
      cssCodeSplit: false,
      rollupOptions: {
        input: entry,
        output: { entryFileNames: "[name].js", assetFileNames: "[name][extname]" },
      },
    },
  });

  // `build()` may hand back a watcher; a one-shot build is what this script asks for
  if (!Array.isArray(result) && !("output" in result)) {
    throw new Error(`${name}: the build returned a watcher`);
  }
  const outputs = Array.isArray(result) ? result.flatMap((one) => one.output) : result.output;
  const asset = outputs.find((out) => out.type === "asset" && out.fileName.endsWith(".css"));
  if (asset === undefined || asset.type !== "asset") {
    throw new Error(`${name}: the build emitted no stylesheet`);
  }
  const source = asset.source;
  const body = unwrapLayers(
    typeof source === "string" ? source : new TextDecoder().decode(source),
  );
  if (body === "") {
    throw new Error(`${name}: the skin emitted no rules`);
  }
  return [
    `/* Generated from ${name}.ts by scripts/component-css.ts. Do not edit. */`,
    ...(body.includes("Apache-2.0") ? [] : []),
    body,
    "",
  ].join("\n");
};

let stale = 0;
for (const name of NAMES) {
  const file = join(root, "src", "registry", name, `${name}.css`);
  const sheet = await compile(name);
  if (check) {
    const current = existsSync(file) ? readFileSync(file, "utf8") : "";
    if (current !== sheet) {
      process.stderr.write(`${name}.css is stale; run node scripts/component-css.ts\n`);
      stale += 1;
    }
    continue;
  }
  writeFileSync(file, sheet);
  process.stdout.write(`${name}.css\n`);
}

rmSync(tmp, { recursive: true, force: true });
if (stale > 0) {
  process.exit(1);
}
if (check) {
  process.stdout.write("component sheets are current\n");
}
