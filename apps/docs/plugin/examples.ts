// The result of each docs page's example (apps/docs/examples/<slug>/), made at build time, in a worker of its own because the
// engine's registry is process-global and this clears it between projects. Every project goes through the cssints plugin on one
// private Vite server (as plugin/landing.ts does): its modules are written out with their imports linked and run in Node, the
// default export is rendered to html by plugin/h.ts, and that html with the project's sheet (the reset is what the code calls)
// is a document for a sandboxed iframe (srcdoc). The document has one script: it asks the page for the display mode and puts it
// on <html> as the class the project's themes read.
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import cssints, { targets } from "cssints/vite";
import { transform } from "lightningcss";
import { createServer } from "vite";

const root = join(import.meta.dirname, "..");
const examples = join(root, "examples");
const packages = join(root, "../../packages");
const EMPTY = "export {};\n";
// csssky's slice is the playground's default project, not a page
const SKIP = new Set(["csssky"]);

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const url = (file: string) => `/${relative(root, file)}`;

const script = `addEventListener("message",(e)=>{if(e.source===parent)document.documentElement.className=e.data.mode});parent.postMessage("cssints:mode","*")`;
const page = (css: string, body: string) => `<!doctype html>
<html>
<meta charset="utf-8">
<style>${css}</style>
<div id="root">${body}</div>
<script>${script}</script>`;

// an import of a file of the project is linked to the file written beside it, the runtime of cn() and cv() to its source; the
// rest (what the sites needed at build time) has no use left in the module
const link = (code: string, h: string) =>
  `import { h, Fragment } from "${h}";\n${code.replace(
    /^import\b[^;"]*"([^"]+)";?/gm,
    (m, spec: string) =>
      spec.startsWith("/examples/")
        ? m.replace(spec, `./${basename(spec)}.mjs`)
        : /^\/@fs\/.*\/runtime\.m?[jt]s/.test(spec)
          ? m.replace(spec, pathToFileURL(spec.slice(4).replace(/\?.*/, "")).href)
          : "",
  )}`;

/**
 * Renders the example of every docs page.
 * @returns {Promise<Record<string, string>>} the `<iframe>` of each project, by its directory
 */
export async function results(): Promise<Record<string, string>> {
  const texts = new Map<string, string>();
  const plugins = cssints();
  const server = await createServer({
    root,
    configFile: false,
    logLevel: "error",
    server: { middlewareMode: true, watch: null, ws: false, hmr: false },
    optimizeDeps: { noDiscovery: true },
    // the plugin packages by their sources, as the playground has them
    resolve: {
      alias: [
        {
          find: /^@cssints\/([\w-]+)\/(runtime|observer)$/,
          replacement: `${packages}/$1/src/$2.ts`,
        },
        { find: /^@cssints\/tokens\/([\w-]+)$/, replacement: `${packages}/tokens/src/$1.ts` },
        { find: /^@cssints\/([\w-]+)$/, replacement: `${packages}/$1/src/index.ts` },
      ],
    },
    // the tsconfig of the app keeps JSX for Solid: the examples call `h`, as in the playground
    oxc: { jsx: { runtime: "classic", pragma: "h", pragmaFrag: "Fragment", development: false } },
    plugins: [
      {
        name: "examples",
        enforce: "pre",
        load: (id) => texts.get(id),
      },
      ...plugins,
    ],
  });
  const tmp = mkdtempSync(join(tmpdir(), "cssints-examples-"));
  try {
    const client = server.environments.client;
    const api = plugins.find((p) => p.name === "cssints")!.api as {
      sheet: (ids: string[]) => string;
    };
    const registry = (
      globalThis as { __cssints?: { properties: Map<string, unknown>; defs: Map<string, unknown> } }
    ).__cssints;
    const compile = async (files: string[]) => {
      registry?.properties.clear();
      registry?.defs.clear();
      return Promise.all(files.map(async (f) => (await client.transformRequest(url(f)))!.code));
    };
    // a project of its own: what the files of the one before left in the registry (kernels, themes) goes with them
    const retire = async (files: string[]) => {
      for (const f of files) texts.set(f, EMPTY);
      for (const env of Object.values(server.environments)) env.moduleGraph.invalidateAll();
      await compile(files);
    };

    const { render } = (await import(pathToFileURL(join(import.meta.dirname, "h.ts")).href)) as {
      render: (exports: Record<string, unknown>) => string;
    };
    const h = pathToFileURL(join(import.meta.dirname, "h.ts")).href;
    const out: Record<string, string> = {};
    for (const slug of readdirSync(examples).filter((d) => !SKIP.has(d) && !d.includes("."))) {
      const files = readdirSync(join(examples, slug))
        .filter((f) => /\.tsx?$/.test(f))
        .map((f) => join(examples, slug, f));
      const entry = files.find((f) => /^index\./.test(basename(f)))!;
      const dir = join(tmp, slug);
      mkdirSync(dir);
      const codes = await compile(files);
      files.forEach((f, i) => writeFileSync(join(dir, `${basename(f)}.mjs`), link(codes[i]!, h)));
      const css = api.sheet(files);
      const body = render(
        (await import(pathToFileURL(join(dir, `${basename(entry)}.mjs`)).href)) as Record<
          string,
          unknown
        >,
      );
      const sheet = transform({
        filename: "example.css",
        code: Buffer.from(
          `@layer preview;${css}@layer preview{body{margin:16px;font:16px system-ui,sans-serif}}`,
        ),
        minify: true,
        targets,
      }).code.toString();
      out[slug] =
        `<iframe title="Result" sandbox="allow-scripts" srcdoc="${esc(page(sheet, body))}"></iframe>`;
      await retire(files);
    }
    return out;
  } finally {
    await server.close();
    rmSync(tmp, { recursive: true, force: true });
  }
}
