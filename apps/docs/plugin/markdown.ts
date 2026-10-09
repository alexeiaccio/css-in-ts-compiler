// README.md and docs/API.md to pages: split at the headings, highlight the code (Shiki, with twoslash hovers on the ts blocks) and
// resolve the links between the two files. Node only (the Vite plugin calls it); the browser gets the result as data.
import { readFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { rendererRich, transformerTwoslash } from "@shikijs/twoslash";
import { Marked, type Token, type Tokens } from "marked";
import { createHighlighter } from "shiki";
import ts from "typescript";

const root = join(import.meta.dirname, "../../..");
const REPO = "https://github.com/alexeiaccio/css-in-ts-compiler/blob/master/";

export interface Entry {
  id: string;
  text: string;
  /** a heading's depth, or 5 for the bold term that opens a list item */
  depth: number;
}
export interface Page {
  slug: string;
  title: string;
  titleHtml: string;
  /** the "(decided 2026-09-29, cssints-5dbi)" of a heading */
  meta: string;
  group: "Guide" | "Reference" | "Project";
  /** the headings and terms of the page, for the outline and the search */
  entries: Entry[];
  html: string;
}

const plain = (s: string) => s.replace(/`/g, "");
const slug = (s: string) =>
  plain(s)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_ -]/gu, "")
    .replace(/ /g, "-");
const pageSlug = (s: string) =>
  plain(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

type Extra = { id?: string };
type Heading = Tokens.Heading & Extra;
type Item = Tokens.ListItem & Extra;
const isHeading = (t: { type: string }): t is Heading => t.type === "heading";

// the bold term that opens a list item: "- **Import.** `with …"
const lead = (item: Tokens.ListItem) => {
  const first = item.tokens[0];
  const strong = first?.type === "text" ? (first as Tokens.Text).tokens?.[0] : undefined;
  return strong?.type === "strong"
    ? (strong as Tokens.Strong).text.replace(/[.:]$/, "")
    : undefined;
};

const files = [
  { path: "README.md", split: 2 },
  { path: "docs/API.md", split: 4 },
];
const project = new Set(["Layout", "Development", "License"]);

// DOCS_HOVERS=0 skips the type-check of the ts blocks (the part of the build that takes ~15 s) while the styles are being worked on
const hovers = process.env.DOCS_HOVERS !== "0";

// `base` is the site's base path (ends with a slash): the links between pages start with it
export async function buildPages(base = "/"): Promise<Page[]> {
  const marked = new Marked();
  const sections: { file: string; tokens: Token[] }[] = [];
  for (const { path, split } of files) {
    const tokens = marked.lexer(readFileSync(join(root, path), "utf8"));
    let current: Token[] = [];
    for (const t of tokens) {
      if (isHeading(t) && t.depth <= split && current.length) {
        sections.push({ file: path, tokens: current });
        current = [];
      }
      current.push(t);
    }
    sections.push({ file: path, tokens: current });
  }

  // the first pass: titles, slugs, the ids of headings and terms (links need all of them before anything is rendered)
  const pages = sections.map(({ file, tokens }, i) => {
    const head = tokens[0] as Heading;
    const raw = file === "docs/API.md" && head.depth === 1 ? "API reference" : head.text;
    const [, title = raw, meta = ""] =
      /^(.*?) \((decided .*|[^()]*cssints-\w{4}[^()]*)\)$/.exec(raw) ?? [];
    const seen = new Set<string>();
    const unique = (text: string) => {
      let id = slug(text);
      for (let n = 1; seen.has(id); n++) id = `${slug(text)}-${n}`;
      seen.add(id);
      return id;
    };
    head.id = unique(head.text);
    const entries: Entry[] = [];
    for (const t of tokens.slice(1)) {
      if (isHeading(t)) {
        t.id = unique(t.text);
        entries.push({ id: t.id, text: plain(t.text), depth: t.depth });
      } else if (t.type === "list")
        for (const item of t.items as Item[]) {
          const term = lead(item);
          if (term === undefined) continue;
          item.id = unique(term);
          entries.push({ id: item.id, text: plain(term), depth: 5 });
        }
    }
    const group: Page["group"] =
      file === "docs/API.md" ? "Reference" : project.has(title) ? "Project" : "Guide";
    return {
      file,
      tokens,
      page: {
        slug: i === 0 ? "" : pageSlug(title),
        title: i === 0 ? "Overview" : plain(title),
        titleHtml: marked.parseInline(title) as string,
        meta: plain(meta),
        group,
        entries,
        html: "",
      } satisfies Page,
    };
  });

  // the page that holds a heading or term, by id; a page's own heading is its top, so a link to it needs no anchor
  const owner = new Map<string, string>();
  const tops = new Set<string>();
  for (const { page, tokens } of [...pages].reverse()) {
    for (const e of page.entries) owner.set(e.id, page.slug);
    owner.set((tokens[0] as Heading).id!, page.slug);
    tops.add((tokens[0] as Heading).id!);
  }
  const apiSlug = pages.find((p) => p.file === "docs/API.md")!.page.slug;

  // [text](../README.md), [text](docs/API.md#id), [text](wayfinder.md): the pages of this site, else the file on GitHub
  const href = (file: string, target: string) => {
    if (/^https?:|^#/.test(target)) return target;
    const [path = "", hash = ""] = target.split("#");
    const repoPath = posix.normalize(posix.join(dirname(file), path));
    if (repoPath === "README.md") return base;
    if (repoPath === "docs/API.md")
      return `${base}${(hash && owner.get(hash)) || apiSlug}${hash && !tops.has(hash) ? `#${hash}` : ""}`;
    return REPO + repoPath + (hash && `#${hash}`);
  };

  const highlighter = await createHighlighter({
    themes: ["github-light", "github-dark"],
    langs: ["ts", "tsx", "css", "bash"],
  });
  // twoslash type-checks a ts block as docs.mjs does: the workspace "cssints" (customConditions: development), `prop` and a JSX
  // with any tag declared in a file of their own. The collections of the icons block are not dependencies of cssints.
  const twoslash = transformerTwoslash({
    renderer: rendererRich(),
    twoslashOptions: {
      vfsRoot: join(root, "apps/docs"),
      handbookOptions: { noErrorValidation: true },
      extraFiles: {
        "globals.d.ts": `declare const prop: boolean;
declare namespace JSX {
  interface IntrinsicElements { [tag: string]: { className?: string; style?: Record<string, string> } }
}
`,
      },
      compilerOptions: {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.Preserve,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        customConditions: ["development"],
        noEmit: true,
        allowImportingTsExtensions: true,
        verbatimModuleSyntax: true,
        strict: true,
        skipLibCheck: true,
        noUncheckedIndexedAccess: true,
        jsx: ts.JsxEmit.Preserve,
        paths: { "@iconify-json/*": [join(root, "packages/icons/node_modules/@iconify-json/*")] },
      },
    },
  });

  for (const { file, tokens, page } of pages) {
    const m = new Marked({
      renderer: {
        heading(t) {
          return `<h${t.depth} id="${(t as Heading).id}">${this.parser.parseInline(t.tokens)}</h${t.depth}>\n`;
        },
        code({ text, lang }) {
          const [language = "text", ...meta] = (lang ?? "").split(/\s+/);
          const skip = meta.includes("skip") || !/^tsx?$/.test(language);
          const out = highlighter.codeToHtml(text, {
            lang: highlighter.getLoadedLanguages().includes(language) ? language : "text",
            themes: { light: "github-light", dark: "github-dark" },
            defaultColor: false,
            meta: { __raw: skip ? "notwoslash" : "" },
            transformers: hovers ? [twoslash] : [],
          });
          // a type in an error message is named by its file: not this machine's path
          return out.replaceAll(`${root}/`, "");
        },
        link({ href: target, tokens }) {
          const to = href(file, target);
          const external = /^https?:/.test(to);
          return `<a href="${to}"${external ? ' target="_blank" rel="noreferrer"' : ""}>${this.parser.parseInline(tokens)}</a>`;
        },
        listitem(item) {
          const id = (item as Item).id;
          const body = this.parser.parse(item.tokens, !!item.loose);
          return `<li${id ? ` id="${id}"` : ""}>${body}</li>\n`;
        },
      },
    });
    page.html = m.parser(tokens.slice(1));
  }
  return pages.map((p) => p.page);
}
