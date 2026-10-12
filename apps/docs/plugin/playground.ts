// The engine in a browser worker (docs/research/playground.md). The engine files are the ones Node runs, unchanged; what they
// import from Node or Vite is answered here:
//   node:crypto, node:path, node:module, node:url, happy-dom, vite/module-runner, lightningcss, oxc-parser
//                          the shims of src/playground/shims/, for the engine files only (never for the docs' own code)
//   @cssints/css-grammar/*, cssints/plugin|frame|surface
//                          the sources, not dist/ (a worker builds from what the engine is now)
//   cssints-src/<file>     a file of packages/cssints/src, for the worker's own imports
//   virtual:playground/data  the data the engine reads from disk: mdn-data's selectors, the CSS part of @mdn/browser-compat-data
//                          cut to the browsers the support check knows, and the browserslist query of this site, resolved
//   virtual:playground/packages  the plugin packages that run in a browser: their sources (lazy, as text), what they import from outside
//   virtual:playground/types     the types the editor knows: the built .d.mts of cssints and css-grammar, the sources of those packages
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, posix } from "node:path";
import type { Plugin } from "vite";

const here = createRequire(import.meta.url);
// cssints/vite is dist/vite.mjs in an install and src/plugin.ts in the repo's development condition: two levels up either way
const cssints = dirname(dirname(here.resolve("cssints/vite")));
const fromCssints = createRequire(join(cssints, "package.json"));
const grammar = dirname(dirname(fromCssints.resolve("@cssints/css-grammar/support")));
const fromGrammar = createRequire(join(grammar, "package.json"));
const shims = join(import.meta.dirname, "../src/playground/shims");
const playground = join(import.meta.dirname, "../src/playground");

const SHIMS: Record<string, string> = {
  "node:crypto": "crypto.ts",
  "node:path": "path.ts",
  "node:module": "module.ts",
  "node:url": "url.ts",
  "happy-dom": "happy-dom.ts",
  "vite/module-runner": "module-runner.ts",
  lightningcss: "lightningcss.ts",
  "oxc-parser": "oxc-parser.ts",
};
const PACKAGES: Record<string, string> = {
  "cssints/plugin": join(cssints, "src/author.ts"),
  "cssints/frame": join(cssints, "src/frame.ts"),
  "cssints/surface": join(cssints, "src/surface.ts"),
};

// The browsers the support check maps (support.ts BCD_NAME): the rest of a support block is never read.
const BROWSERS = new Set([
  "chrome",
  "chrome_android",
  "edge",
  "firefox",
  "firefox_android",
  "safari",
  "safari_ios",
  "opera",
  "opera_android",
  "samsunginternet_android",
  "webview_android",
  "ie",
]);

// The plugin packages a browser can run: no file, no network and no Node module at build time. Left out: @cssints/fonts (reads font
// files from disk and downloads them), @cssints/icons (reads @iconify-json collections and .svg files from disk), @cssints/placeholder
// (reads images from disk, SHA-1 of file bytes, PNG and JPEG codecs for Node).
export const PLUGINS = [
  "balance",
  "fluid",
  "gradient",
  "layout",
  "masonry",
  "mise-en-mode",
  "motion",
  "ramp",
  "reset",
  "reveal",
  "rybitten",
  "skeleton",
  "squircle",
  "stuck",
];
export const TOKEN_SETS = ["open-props", "radix", "flexoki", "reasonable-colors"];
const packages = join(cssints, "..");
// The sources of those packages, as files of a virtual project: id (a path) -> file on disk, and the names a module may import -> id.
// A browser runs them as it runs a user's file (instrumented, TypeScript removed), as Node's runner runs them: they are not part of
// the docs' build, which would transform them as the docs' own modules.
const ID = "/node_modules/";
const sourceFiles: Record<string, string> = {};
const entries: Record<string, string> = {};
const collect = (name: string, dir: string, file: string) => {
  const id = `${ID}${name}/src/${file}`;
  if (Object.hasOwn(sourceFiles, id)) return;
  const path = join(dir, "src", file);
  sourceFiles[id] = path;
  for (const [, rel] of readFileSync(path, "utf8").matchAll(/from "\.\/([\w-]+\.ts)"/g))
    collect(name, dir, rel!);
};
for (const n of PLUGINS) {
  collect(`@cssints/${n}`, join(packages, n), "index.ts");
  entries[`@cssints/${n}`] = `${ID}@cssints/${n}/src/index.ts`;
}
for (const n of TOKEN_SETS) {
  collect("@cssints/tokens", join(packages, "tokens"), `${n}.ts`);
  entries[`@cssints/tokens/${n}`] = `${ID}@cssints/tokens/src/${n}.ts`;
}
// what those sources import that is not one of them: bundled with the worker, found from the package that imports it
const EXTERNALS = ["culori", "rybitten", "rybitten/cubes"];

// The editor's types. cssints and css-grammar: what a user's TypeScript sees (the built declarations, followed from the entries
// through their relative imports). The plugin packages: their sources, which are typed code. Paths are URIs of the same project.
const URI = "file://";
// plus an entry per export group, `cssints/widely-available`, `cssints/css-grid-2`, ... (docs/research/groups.md)
const ENTRIES = {
  cssints: "types",
  "cssints/plugin": "plugin-types",
  "cssints/frame": "frame",
  "cssints/surface": "surface",
  ...Object.fromEntries(
    readdirSync(join(cssints, "dist/groups"), { recursive: true, encoding: "utf8" })
      .filter((f) => f.endsWith(".d.mts"))
      .map((f) => [
        `cssints/${f.replace(/\.d\.mts$/, "")}`,
        `groups/${f.replace(/\.d\.mts$/, "")}`,
      ]),
  ),
};
const types = () => {
  const files: Record<string, string> = {};
  const declarations = (pkg: string, dir: string, name: string) => {
    const file = `${URI}${ID}${pkg}/dist/${name}.d.mts`;
    if (Object.hasOwn(files, file)) return;
    const text = readFileSync(join(dir, "dist", `${name}.d.mts`), "utf8");
    files[file] = text;
    for (const [, local, other] of text.matchAll(
      /(?:from|import) "(\.\.?\/[\w./-]+)\.mjs"|from "@cssints\/css-grammar\/([\w-]+)"/g,
    ))
      if (local) declarations(pkg, dir, posix.join(posix.dirname(name), local));
      else declarations("@cssints/css-grammar", grammar, other!);
  };
  Object.values(ENTRIES).forEach((name) => declarations("cssints", cssints, name));
  for (const [id, path] of Object.entries(sourceFiles))
    files[`${URI}${id}`] = readFileSync(path, "utf8");
  const paths: Record<string, string[]> = {
    "@cssints/css-grammar/*": [`${URI}${ID}@cssints/css-grammar/dist/*.d.mts`],
    ...Object.fromEntries(
      Object.entries(ENTRIES).map(([k, v]) => [k, [`${URI}${ID}cssints/dist/${v}.d.mts`]]),
    ),
    ...Object.fromEntries(Object.entries(entries).map(([k, id]) => [k, [`${URI}${id}`]])),
  };
  return { files, paths };
};

interface Node {
  __compat?: { support: Record<string, unknown> };
  [key: string]: unknown;
}
// What support.ts reads of a feature is `__compat.support`; links, specs, notes and status are cut.
const slim = (node: Node): Node => {
  const out: Node = {};
  for (const [k, v] of Object.entries(node)) {
    if (k === "__compat") {
      const support = Object.fromEntries(
        Object.entries((v as NonNullable<Node["__compat"]>).support).filter(([b]) =>
          BROWSERS.has(b),
        ),
      );
      out.__compat = { support };
    } else out[k] = slim(v as Node);
  }
  return out;
};

const data = (root: string) => {
  const bcd = fromGrammar("@mdn/browser-compat-data") as { css: Node };
  const selectors = readFileSync(fromCssints.resolve("mdn-data/css/selectors.json"), "utf8");
  const browserslist = fromGrammar("browserslist") as (
    q?: string,
    o?: { path: string },
  ) => string[];
  const parse = (json: string) => `JSON.parse(${JSON.stringify(json)})`;
  return [
    `export const selectors = ${parse(selectors)};`,
    `export const bcd = ${parse(JSON.stringify({ css: slim(bcd.css) }))};`,
    `export const targets = ${JSON.stringify(browserslist(undefined, { path: root }))};`,
  ].join("\n");
};

const inEngine = (importer: string | undefined) =>
  !!importer &&
  [join(cssints, "src"), join(grammar, "src"), playground].some((d) => importer.startsWith(d));

export default function playgroundPlugin(): Plugin {
  let root = process.cwd();
  return {
    name: "docs:playground",
    enforce: "pre",
    config() {
      // the wasm bindings find their .wasm and their worker by `new URL(..., import.meta.url)`: not through the optimizer
      return {
        optimizeDeps: {
          // found late otherwise (a dynamic import of a virtual module), and a late dependency reloads the page
          include: [
            "cssints > culori",
            "cssints > culori/fn",
            "@cssints/rybitten > rybitten",
            "@wasm-fmt/oxc_fmt/web",
          ],
          exclude: [
            "@oxc-parser/binding-wasm32-wasi",
            "@oxc-transform/binding-wasm32-wasi",
            "lightningcss-wasm",
          ],
        },
        // a worker bundle has its own plugins, not these
        worker: { format: "es", plugins: () => [playgroundPlugin()] },
      };
    },
    configResolved(config) {
      root = config.root;
    },
    resolveId(id, importer) {
      if (id.startsWith("virtual:playground/")) return `\0${id}`;
      if (id.startsWith("cssints-module:"))
        return `${sourceFiles[id.slice("cssints-module:".length)]}?raw`;
      if (id.startsWith("cssints-external:")) {
        const name = id.slice("cssints-external:".length);
        const from = name.startsWith("rybitten")
          ? join(packages, "rybitten/src/index.ts")
          : join(cssints, "src/color.ts");
        return this.resolve(name, from, { skipSelf: true });
      }
      if (id.startsWith("cssints-src/"))
        return join(cssints, "src", id.slice("cssints-src/".length));
      if (!inEngine(importer)) return undefined;
      const shim = SHIMS[id];
      if (shim) return join(shims, shim);
      if (id.startsWith("@cssints/css-grammar/"))
        return join(grammar, "src", `${id.slice("@cssints/css-grammar/".length)}.ts`);
      return PACKAGES[id];
    },
    load(id) {
      if (id === "\0virtual:playground/data") return data(root);
      if (id === "\0virtual:playground/packages")
        return [
          `export const entries = ${JSON.stringify(entries)};`,
          `export const sources = {${Object.keys(sourceFiles)
            .map(
              (k) =>
                `${JSON.stringify(k)}: () => import(${JSON.stringify(`cssints-module:${k}`)}).then((m) => m.default)`,
            )
            .join(",")}};`,
          `export const externals = {${EXTERNALS.map((n) => `${JSON.stringify(n)}: () => import(${JSON.stringify(`cssints-external:${n}`)})`).join(",")}};`,
        ].join("\n");
      if (id === "\0virtual:playground/types")
        return Object.entries(types())
          .map(([k, v]) => `export const ${k} = ${JSON.stringify(v)};`)
          .join("\n");
    },
    // /playground has a document of its own, as every page has (plugin/docs.ts), so a static host finds it. This plugin is listed
    // before docs(): its post hook runs first and sees the shell, before the overview is written into it.
    generateBundle: {
      order: "post",
      handler(_, bundle) {
        const index = bundle["index.html"];
        if (index?.type !== "asset") return;
        const source = String(index.source)
          .replace(/<title>.*?<\/title>/, () => "<title>Playground · cssints</title>")
          .replace(
            '<div id="root"></div>',
            () =>
              '<div id="root"></div><noscript>The playground runs the cssints engine in your browser and needs JavaScript.</noscript>',
          )
          .replace(
            /(name="description"\s+content=")[^"]*/,
            (_all, head: string) =>
              `${head}Run the cssints engine in your browser: edit a module, read its CSS and see it rendered.`,
          );
        this.emitFile({ type: "asset", fileName: "playground/index.html", source });
      },
    },
  };
}
