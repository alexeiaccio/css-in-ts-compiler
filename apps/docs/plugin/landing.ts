// The landing page (/), made at build time like the pages of the markdown. The showcase is the compiler's own output:
// src/landing/button.ts goes through the cssints plugin on a Vite server of its own (as packages/mcp compiles a module), and the
// module it makes, its stylesheet and the error of a misspelt value are highlighted with Shiki. That is the data of landing() in
// src/landing/page.ts, a cssints module whose classes are css.cn: plugin/docs.ts writes the string this server makes of it into
// the document of "/", and the virtual module virtual:docs/landing calls landing() with the same data in the build, so the
// app renders the same string and the classes are in the build's sheet.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import cssints from "cssints/vite";
import { createHighlighter } from "shiki";
import { createServer, type ViteDevServer } from "vite";

import type { LandingData } from "../src/landing/page.ts";

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

// `use` runs while the server is up
async function withServer<T>(
  use: (server: ViteDevServer, made: Compiled) => Promise<T>,
): Promise<T> {
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
    return await use(server, {
      source: readFileSync(button, "utf8"),
      // the dev server names the runtime by a path of this machine; a build bundles it
      code: code.replace(/^(import .* from )"[^"]*";/m, '$1"cssints/browser";'),
      css: api.sheet([button]),
      error,
    });
  } finally {
    await server.close();
  }
}

export const compile = () => withServer((_, made) => Promise.resolve(made));

// `base` ends with a slash, as in plugin/docs.ts: the data of the page, and the html this server makes of it
export async function landing(base: string): Promise<{ data: LandingData; html: string }> {
  const highlighter = createHighlighter({
    themes: ["github-light", "github-dark"],
    langs: ["ts", "css", "bash"],
  });
  return withServer(async (server, c) => {
    if (!c.error) throw new Error("the misspelt colour of src/landing compiled");
    const h = await highlighter;
    const code = (text: string, lang: string) =>
      h.codeToHtml(text.trim(), {
        lang,
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: false,
      });
    const data: LandingData = {
      base,
      install: code("npm install --save-dev cssints@next", "bash"),
      source: code(c.source, "ts"),
      code: code(c.code, "ts"),
      css: code(c.css, "css"),
      error: c.error,
    };
    // the ssr environment of the plugin evaluates sites (its cn() is a node there); the client's transform is what a build ships:
    // class strings, and no import left, so the module runs from a data URL
    const { code: page } =
      (await server.environments.client.transformRequest("/src/landing/page.ts"))!;
    const { landing } = (await import(`data:text/javascript,${encodeURIComponent(page)}`)) as {
      landing: (d: LandingData) => string;
    };
    return { data, html: landing(data) };
  });
}
