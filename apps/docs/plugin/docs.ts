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

import { landing } from "./landing.ts";
import { canvas } from "../src/playground/hyper.ts";
import { type Page, summary } from "./markdown.ts";

const root = join(import.meta.dirname, "../../..");
const sources = ["README.md", "docs/API.md", "CHANGELOG.md"].map((f) => join(root, f));
const pageId = (i: number) => `virtual:docs/${i}`;

// The type-check of the ts blocks takes ~15 s of one thread; in a worker it does not hold up the rest of the build (cssints gives a
// module 30 s to evaluate, and counts the time it waited).
const inWorker = <T>(file: string, workerData?: string) =>
  // oxlint-disable-next-line promise/avoid-new -- a worker has no promise form
  new Promise<T>((resolve, reject) => {
    const worker = new Worker(new URL(file, import.meta.url), { workerData });
    worker.once("message", resolve);
    worker.once("error", reject);
  });
// the results of the examples (plugin/examples.ts) are put where markdown.ts left their place
const buildPages = async (base: string) => {
  const [pages, frames] = await Promise.all([
    inWorker<Page[]>("./worker.ts", base),
    inWorker<Record<string, string>>("./examples-worker.ts"),
  ]);
  return pages.map((p) => ({
    ...p,
    html: p.html.replace("<!--result-->", () => frames[p.slug] ?? ""),
  }));
};

// The result frames of a page (plugin/examples.ts) are sandboxed: they cannot read the page. Each asks for the display mode and
// the canvas when it loads, and every frame is told again when the settings change the classes or the data attributes of <html>
// (`canvas` of hyper.ts: the mode, as the class its project's themes read, and the site's background, text colour and font, read
// off the page, as the playground's preview takes them). It is in the page's own chunk, not a module they share: a shared chunk
// would be listed in the entry's preload map.
const FRAMES = `if (!globalThis.__resultFrames) {
  globalThis.__resultFrames = true;
  const frames = () => document.querySelectorAll(".example iframe");
  const canvas = ${canvas.toString()};
  const tell = (w) => w?.postMessage(canvas(), "*");
  addEventListener("message", (e) => e.data === "cssints:mode" && tell(e.source));
  new MutationObserver(() => frames().forEach((f) => tell(f.contentWindow))).observe(document.documentElement, { attributes: true });
  frames().forEach((f) => tell(f.contentWindow));
}
`;

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export default function docs(): Plugin {
  let pages: Promise<Page[]> | undefined;
  let home: ReturnType<typeof landing> | undefined;
  let base = "/";
  const get = () => (pages ??= buildPages(base));
  const getHome = () => (home ??= landing(base));
  return {
    name: "docs",
    enforce: "pre",
    configResolved(config) {
      base = config.base;
    },
    buildStart() {
      void get();
      void getHome();
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
      if (id === "\0virtual:docs/landing")
        return `import { landing } from "/src/landing/page.ts";\nexport default landing(${JSON.stringify((await getHome()).data)});`;
      if (!id.startsWith("\0virtual:docs")) return;
      const all = await get();
      if (id === "\0virtual:docs") {
        const meta = all.map(({ html: _, ...page }) => page);
        const loaders = all.map(
          (p, i) => `${JSON.stringify(p.slug)}: () => import("${pageId(i)}")`,
        );
        return `export const pages = ${JSON.stringify(meta)};\nexport const html = { ${loaders.join(", ")} };\nexport const landing = () => import("virtual:docs/landing");`;
      }
      const html = all[Number(id.split("/").pop())]?.html;
      return `${html?.includes(' class="example"') ? FRAMES : ""}export default ${JSON.stringify(html)};`;
    },
    // after Vite's own HTML plugin has emitted index.html
    generateBundle: {
      order: "post",
      async handler(_, bundle) {
        const index = bundle["index.html"];
        if (index?.type !== "asset") return;
        const shell = String(index.source);
        const all = await get();
        const list = `<nav aria-label="Pages"><ul><li><a href="${base}">cssints</a></li>${all.map((p) => `<li><a href="${base}${p.slug}/">${p.titleHtml}</a></li>`).join("")}</ul></nav>`;
        // function replacers: the html has `$` in it
        const document = (page: Pick<Page, "slug" | "title" | "html">, article: string) =>
          shell
            .replace(
              /<title>.*?<\/title>/,
              () => `<title>${page.slug ? `${escape(page.title)} · cssints` : "cssints"}</title>`,
            )
            .replace(/(name="description"\s+content=")[^"]*/, (all, head) =>
              summary(page.html) ? head + summary(page.html) : all,
            )
            .replace(
              '<div id="root"></div>',
              () => `<div id="prerender">${article}${list}</div><div id="root" hidden></div>`,
            );
        const home = (await getHome()).html;
        const pagesOut = [
          { slug: "", title: "cssints", html: home, article: home },
          ...all.map((p) => ({
            ...p,
            article: `<h1>${p.titleHtml}</h1><div class="prose">${p.html}</div>`,
          })),
        ];
        for (const page of pagesOut) {
          const source = document(page, page.article);
          assert(source !== shell, "the shell has no #root to prerender into");
          if (page.slug === "") index.source = source;
          else this.emitFile({ type: "asset", fileName: `${page.slug}/index.html`, source });
        }
        this.emitFile({ type: "asset", fileName: "404.html", source: shell });
      },
    },
  };
}
