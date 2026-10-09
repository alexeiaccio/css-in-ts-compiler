// The pages of README.md and docs/API.md as virtual modules:
//   virtual:docs        the pages without their html (titles, outline, group), and load(slug): the html of one page, a chunk each
//   virtual:twoslash.css  the stylesheet of the type hovers, in a layer of its own that comes first, so the site's rules win
// Only src/index.tsx imports them: a module with css sites is also run by the build's own evaluation server (cssints), which has
// none of the project's plugins, so what it imports cannot be a virtual module (src/docs.ts hands them down by context).
// A build also writes <slug>/index.html for every page and a 404.html, so a static server finds each URL (the app is a client-side
// router over them; the links of the static copy end in a slash, which every static host serves without a redirect). Each page's document carries the page: its title, description and article are written into the shell as
// html (#prerender, visible) beside the app's own root (hidden). The app renders into its root, and when its article is ready
// (Page.tsx) drops the static copy and shows the root: one atomic swap, so nothing flashes and nothing shows twice. Without JS
// the static copy stays. The base path is Vite's `base` (DOCS_BASE, vite.config.ts); the worker gets it for the links.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { Worker } from "node:worker_threads";
import type { Plugin } from "vite";

import type { Page } from "./markdown.ts";

const root = join(import.meta.dirname, "../../..");
const sources = ["README.md", "docs/API.md"].map((f) => join(root, f));
const pageId = (i: number) => `virtual:docs/${i}`;

// The type-check of the ts blocks takes ~15 s of one thread; in a worker it does not hold up the rest of the build (cssints gives a
// module 30 s to evaluate, and counts the time it waited).
const buildPages = (base: string) =>
  // oxlint-disable-next-line promise/avoid-new -- a worker has no promise form
  new Promise<Page[]>((resolve, reject) => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { workerData: base });
    worker.once("message", resolve);
    worker.once("error", reject);
  });

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// the first paragraph or item of some length outside the code blocks, as plain text (marked has escaped it, so it is safe in an
// attribute), cut at a word; "" when there is none
const describe = (html: string) => {
  for (const m of html
    .replace(/<pre[\s\S]*?<\/pre>/g, "")
    .matchAll(/<(p|li)[^>]*>([\s\S]*?)<\/\1>/g)) {
    const text = (m[2] ?? "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length >= 40)
      return text.length > 160 ? `${text.slice(0, 160).replace(/\s\S*$/, "")}…` : text;
  }
  return "";
};

export default function docs(): Plugin {
  let pages: Promise<Page[]> | undefined;
  let base = "/";
  const get = () => (pages ??= buildPages(base));
  return {
    name: "docs",
    enforce: "pre",
    configResolved(config) {
      base = config.base;
    },
    buildStart() {
      void get();
    },
    configureServer(server) {
      void get(); // start the type-check now, not at the first request
      server.watcher.add(sources);
      server.watcher.on("change", (file) => {
        if (!sources.includes(file)) return;
        pages = undefined;
        for (const m of server.moduleGraph.idToModuleMap.values())
          if (m.id?.startsWith("\0virtual:docs")) server.moduleGraph.invalidateModule(m);
        server.ws.send({ type: "full-reload" });
      });
    },
    resolveId(id) {
      if (id.startsWith("virtual:docs") || id === "virtual:twoslash.css") return `\0${id}`;
    },
    async load(id) {
      if (id === "\0virtual:twoslash.css") {
        const css = readFileSync(
          createRequire(import.meta.url).resolve("@shikijs/twoslash/style-rich.css"),
          "utf8",
        );
        return `@layer twoslash {\n${css}\n}`;
      }
      if (!id.startsWith("\0virtual:docs")) return;
      const all = await get();
      if (id === "\0virtual:docs") {
        const meta = all.map(({ html: _, ...page }) => page);
        const loaders = all.map(
          (p, i) => `${JSON.stringify(p.slug)}: () => import("${pageId(i)}")`,
        );
        return `export const pages = ${JSON.stringify(meta)};\nexport const html = { ${loaders.join(", ")} };`;
      }
      return `export default ${JSON.stringify(all[Number(id.split("/").pop())]?.html)};`;
    },
    // after Vite's own HTML plugin has emitted index.html
    generateBundle: {
      order: "post",
      async handler(_, bundle) {
        const index = bundle["index.html"];
        if (index?.type !== "asset") return;
        const shell = String(index.source);
        const all = await get();
        // function replacers: the html has `$` in it
        const document = (page: Page) =>
          shell
            .replace(
              /<title>.*?<\/title>/,
              () => `<title>${page.slug ? `${escape(page.title)} · cssints` : "cssints"}</title>`,
            )
            .replace(/(name="description"\s+content=")[^"]*/, (all, head) =>
              describe(page.html) ? head + describe(page.html) : all,
            )
            .replace(
              '<div id="root"></div>',
              () =>
                `<div id="prerender"><h1>${page.titleHtml}</h1><div class="prose">${page.html}</div><nav aria-label="Pages"><ul>${all.map((p) => `<li><a href="${base}${p.slug && `${p.slug}/`}">${p.titleHtml}</a></li>`).join("")}</ul></nav></div><div id="root" hidden></div>`,
            );
        for (const page of all) {
          const source = document(page);
          assert(source !== shell, "the shell has no #root to prerender into");
          if (page.slug === "") index.source = source;
          else this.emitFile({ type: "asset", fileName: `${page.slug}/index.html`, source });
        }
        this.emitFile({ type: "asset", fileName: "404.html", source: shell });
      },
    },
  };
}
