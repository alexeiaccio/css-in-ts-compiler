// The engine in a browser worker (docs/research/playground.md). The engine files are the ones Node runs, unchanged; what they
// import from Node or Vite is answered here:
//   node:crypto, node:path, node:module, node:url, happy-dom, vite/module-runner, lightningcss, oxc-parser
//                          the shims of src/playground/shims/, for the engine files only (never for the docs' own code)
//   @cssints/css-grammar/*, cssints/plugin|frame|surface
//                          the sources, not dist/ (a worker builds from what the engine is now)
//   cssints-src/<file>     a file of packages/cssints/src, for the worker's own imports
//   virtual:playground/data  the data the engine reads from disk: mdn-data's selectors, the CSS part of @mdn/browser-compat-data
//                          cut to the browsers the support check knows, and the browserslist query of this site, resolved
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
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
