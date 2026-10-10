// The landing page (/) as one html string, made at build time like the pages of the markdown: plugin/docs.ts serves it as a
// virtual module and writes it into the document of "/". The showcase is the compiler's own output: src/landing/button.ts goes
// through the cssints plugin on a Vite server of its own (as packages/mcp compiles a module), and the module it makes, its
// stylesheet and the error of a misspelt value are highlighted with Shiki. Styles: src/landing.ts, global rules under .landing.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import cssints from "cssints/vite";
import { createHighlighter } from "shiki";
import { createServer } from "vite";

const root = join(import.meta.dirname, "..");
const button = join(root, "src/landing/button.ts");
const typo = join(root, "src/landing/typo.ts");
// the source of the error sample: not a file of the project, because the types would reject it too
const TYPO =
  'import * as css from "cssints" with { type: "cssints" };\n\ncss.color("rebeccapurpel");\n';

export interface Compiled {
  source: string;
  code: string;
  css: string;
  error: string;
}

export async function compile(): Promise<Compiled> {
  const plugins = cssints();
  const server = await createServer({
    root,
    configFile: false,
    logLevel: "warn",
    server: { middlewareMode: true, watch: null, ws: false, hmr: false },
    optimizeDeps: { noDiscovery: true },
    plugins: [
      {
        name: "landing-typo",
        enforce: "pre",
        resolveId: (id) => (id === "/src/landing/typo.ts" ? typo : undefined),
        load: (id) => (id === typo ? TYPO : undefined),
      },
      ...plugins,
    ],
  });
  try {
    const client = server.environments.client;
    const { code } = (await client.transformRequest("/src/landing/button.ts"))!;
    const api = plugins.find((p) => p.name === "cssints")!.api as {
      sheet: (ids: string[]) => string;
    };
    const error = await client.transformRequest("/src/landing/typo.ts").then(
      () => "",
      (e: Error) => e.message.split("\n")[0]!,
    );
    return {
      source: readFileSync(button, "utf8"),
      // the dev server names the runtime by a path of this machine; a build bundles it
      code: code.replace(/^(import .* from )"[^"]*";/m, '$1"cssints/browser";'),
      css: api.sheet([button]),
      error,
    };
  } finally {
    await server.close();
  }
}

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// `base` ends with a slash, as in plugin/docs.ts
export async function landing(base: string): Promise<string> {
  const [c, highlighter] = await Promise.all([
    compile(),
    createHighlighter({ themes: ["github-light", "github-dark"], langs: ["ts", "css", "bash"] }),
  ]);
  if (!c.error) throw new Error("the misspelt colour of src/landing compiled");
  const code = (text: string, lang: string) =>
    highlighter.codeToHtml(text.trim(), {
      lang,
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    });
  const panel = (name: string, body: string) =>
    `<figure><figcaption>${name}</figcaption>${body}</figure>`;
  const feature = (title: string, text: string, href: string, link: string, extra = "") =>
    `<li><h3>${title}</h3><p>${text}</p>${extra}<a href="${base}${href}">${link}</a></li>`;
  return `<div class="landing">
<section class="hero">
<img src="${base}logo.svg" alt="" width="96" height="96">
<h1>CSS in TypeScript, compiled away</h1>
<p class="lead">cssints turns typed style calls into atomic, content-hashed classes in one stylesheet when you build. The browser gets class names, not a styling library.</p>
<div class="install">${code("npm install --save-dev cssints", "bash")}</div>
<p class="actions"><a class="primary" href="${base}install/">Get started</a><a href="${base}playground/">Try the playground</a><a href="${base}overview/">Read the docs</a></p>
</section>
<section class="showcase" aria-labelledby="showcase">
<h2 id="showcase">What you write, what you get</h2>
<p>This is the compiler's output, made when this site was built: the file on the left went through the same plugin as your code.</p>
<div class="panels">
${panel("button.ts", code(c.source, "ts"))}
<div class="outputs">
${panel("The module in the bundle", code(c.code, "ts"))}
${panel("The stylesheet", code(c.css, "css"))}
</div>
</div>
</section>
<section class="features" aria-labelledby="features">
<h2 id="features">Why cssints</h2>
<ul>
${feature(
  "Typed values, checked twice",
  "Every value is checked against the spec grammars of mdn-data: in the editor through the types, and again in the build. A typo is an error, with the file and the line.",
  "errors/",
  "The errors you can get",
  `<pre class="error"><code>${escape(c.error)}</code></pre>`,
)}
${feature(
  "Nothing of it at runtime",
  "Each call is replaced by a class string. Only <code>cx</code> and the few lines behind <code>cv</code> ship, and they just join class names.",
  "without-runtime/",
  "Without runtime",
)}
${feature(
  "Tokens, themes, contrast",
  "Typed design tokens, themes on a class or a media query, and <code>check.contrast</code>, which fails the build when text is hard to read.",
  "tokens/",
  "Tokens and themes",
)}
${feature(
  "Plugins on one small API",
  "Fluid type, layout, fonts, reset, gradients, motion, masonry, icons and more: plugin packages that run at build time too.",
  "plugin-packages/",
  "Plugin packages",
)}
${feature(
  "Devtools and agents",
  "An overlay in the dev server shows the cascade of any element, and an MCP server lets your coding agent check a value or compile a module.",
  "cssints-devtools/",
  "The devtools",
)}
${feature(
  "A playground in the page",
  "The real engine in a web worker, over wasm builds of oxc and LightningCSS, beside Monaco with the types of cssints. Nothing to install.",
  "playground/",
  "Open the playground",
)}
</ul>
</section>
<section class="closing">
<h2>Try it on your own styles</h2>
<p class="actions"><a class="primary" href="${base}install/">Install</a><a href="${base}api-reference/">API reference</a><a href="${base}authoring-surface/">Write styles</a></p>
</section>
</div>`;
}
