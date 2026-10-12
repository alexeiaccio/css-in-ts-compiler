// README.md and docs/API.md to pages: split at the headings, highlight the code (Shiki, with twoslash hovers on the ts blocks) and
// resolve the links between the two files. Node only (the Vite plugin calls it); the browser gets the result as data.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { rendererRich, transformerTwoslash } from "@shikijs/twoslash";
import { Marked, type Token, type Tokens } from "marked";
import { createHighlighter } from "shiki";
import ts from "typescript";

import { exampleHash } from "../src/playground/share.ts";

const root = join(import.meta.dirname, "../../..");

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
  group: "Guide" | "Reference" | "Packages" | "Project";
  /** the headings and terms of the page, for the outline and the search */
  entries: Entry[];
  html: string;
}

// the first paragraph or item of some length outside the code blocks, as plain text (marked has escaped it, so it is safe in an
// attribute), cut at a word; "" when there is none
export const summary = (html: string) => {
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

// the README of each package is one page of its own (the plugin packages, icons, tokens, devtools, mcp)
const packages = readdirSync(join(root, "packages"))
  .filter((name) => existsSync(join(root, "packages", name, "README.md")))
  .sort();
const files = [
  { path: "README.md", split: 2 },
  { path: "docs/API.md", split: 4 },
  ...packages.map((name) => ({ path: `packages/${name}/README.md`, split: 1 })),
  { path: "CHANGELOG.md", split: 1 },
];
// the pages that have an example project (apps/docs/examples/<slug>/, test/playground.mjs lists the pages that have none)
const examples = new Set(readdirSync(join(root, "apps/docs/examples")));
// the Install page has no panel at its top: the README's example in its text is the example (a block with the link), and its
// project, the README's, is also in the playground's picker
examples.delete("install");
const installExample = readFileSync(
  join(root, "apps/docs/examples/install/index.tsx"),
  "utf8",
).trim();
const project = new Set(["Layout", "Development", "Credits", "License", "Changelog"]);

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
      file === "docs/API.md"
        ? "Reference"
        : file.startsWith("packages/")
          ? "Packages"
          : project.has(title)
            ? "Project"
            : "Guide";
    return {
      file,
      tokens,
      page: {
        slug: i === 0 ? "overview" : pageSlug(title),
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

  // [text](../README.md), [text](docs/API.md#id): the pages of this site. A link to another file of the repository is its text:
  // the repository is private, so a link to it would not open for a reader of the site.
  const href = (file: string, target: string) => {
    // a page of this site that is no doc (/playground, /tui), by its public URL: a link of the site, under its base
    const own = /^https:\/\/cssints\.dev\/([\w-]+)$/.exec(target)?.[1];
    if (own) return `${base}${own}`;
    if (/^https?:|^#/.test(target)) return target;
    const [path = "", hash = ""] = target.split("#");
    const repoPath = posix.normalize(posix.join(dirname(file), path));
    if (repoPath === "README.md") return `${base}overview`;
    const pkg = /^packages\/([^/]+)(\/README\.md)?$/.exec(repoPath)?.[1];
    const readme = pkg && pages.find((p) => p.file === `packages/${pkg}/README.md`);
    if (readme) return `${base}${readme.page.slug}${hash && `#${hash}`}`;
    if (repoPath === "docs/API.md")
      return `${base}${(hash && owner.get(hash)) || apiSlug}${hash && !tops.has(hash) ? `#${hash}` : ""}`;
    return undefined;
  };

  const highlighter = await createHighlighter({
    themes: ["github-light", "github-dark"],
    langs: ["ts", "tsx", "css", "bash"],
  });
  // The panel of a page's example: the tabs Result and Code, radio inputs that the styles of src/prose.ts read (no script), and the
  // files of the project highlighted as the blocks of the page are, the entry first, with a switcher (prose.ts has rules for six).
  // The comment is where plugin/docs.ts puts the example's result (plugin/examples.ts).
  const panel = (slug: string) => {
    const dir = join(root, "apps/docs/examples", slug);
    const names = readdirSync(dir)
      .filter((f) => /\.tsx?$/.test(f))
      .sort(
        (a, b) => Number(/^index\./.test(b)) - Number(/^index\./.test(a)) || a.localeCompare(b),
      );
    assert(names.length <= 6, `${slug}: ${names.length} files, the styles have a switcher for six`);
    const id = `ex-${slug}`;
    const code = names.map((n) =>
      highlighter.codeToHtml(readFileSync(join(dir, n), "utf8").trimEnd(), {
        lang: n.endsWith("x") ? "tsx" : "ts",
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: false,
      }),
    );
    const radios = names.map(
      (_, i) => `<input type="radio" name="${id}-file" id="${id}-f${i}"${i ? "" : " checked"}>`,
    );
    const labels = names.map((n, i) => `<label for="${id}-f${i}">${n}</label>`);
    return `<div class="example"><input type="radio" class="tab-result" name="${id}" id="${id}-result" checked><input type="radio" class="tab-code" name="${id}" id="${id}-code"><p><span><label for="${id}-result">Result</label><label for="${id}-code">Code</label></span><a href="${base}playground#${exampleHash(slug)}">Open in playground</a></p><div class="pane-result"><!--result--></div><div class="pane-code">${radios.join("")}<div>${labels.join("")}</div>${code.join("")}</div></div>`;
  };
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
          // the blocks of a package README are highlighted, not type-checked (docs.mjs checks API.md and README.md only)
          const skip =
            meta.includes("skip") || !/^tsx?$/.test(language) || file.startsWith("packages/");
          const out = highlighter.codeToHtml(text, {
            lang: highlighter.getLoadedLanguages().includes(language) ? language : "text",
            themes: { light: "github-light", dark: "github-dark" },
            defaultColor: false,
            meta: { __raw: skip ? "notwoslash" : "" },
            transformers: hovers ? [twoslash] : [],
          });
          // a type in an error message is named by its file: not this machine's path
          const html = out.replaceAll(`${root}/`, "");
          // the README's example is the project of the playground's picker: on the Install page the block, with its hovers, is the example
          return page.slug === "install" && text.trim() === installExample
            ? `<div class="example code-only"><p><span><label>Code</label></span><a href="${base}playground#${exampleHash("install")}">Open in playground</a></p>${html}</div>\n`
            : html;
        },
        link({ href: target, tokens }) {
          const to = href(file, target);
          if (to === undefined) return this.parser.parseInline(tokens);
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
    if (examples.has(page.slug)) page.html = `${panel(page.slug)}\n${page.html}`;
  }
  // The API reference's own page is its introduction: an index of the reference pages follows it, each with its first lines
  // and the terms it covers, so the page says what is where.
  const api = pages.find((p) => p.page.slug === apiSlug)!.page;
  const items = pages
    .filter((p) => p.page.group === "Reference" && p.page !== api)
    .map(({ page }) => {
      const terms = page.entries
        .slice(0, 8)
        .map(
          (e) =>
            `<a href="${base}${page.slug}#${e.id}">${e.text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</a>`,
        )
        .join(", ");
      return `<li><p><a href="${base}${page.slug}"><strong>${page.titleHtml}</strong></a>. ${summary(page.html)}</p>${terms && `<p>${terms}${page.entries.length > 8 ? ", …" : ""}</p>`}</li>`;
    });
  api.html += `<h2 id="contents">Contents</h2>\n<ul>${items.join("\n")}</ul>\n`;
  api.entries.push({ id: "contents", text: "Contents", depth: 2 });
  return pages.map((p) => p.page);
}
