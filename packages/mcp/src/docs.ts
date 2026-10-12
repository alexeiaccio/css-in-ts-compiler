// search_docs and list_plugins: the docs as markdown sections. Run from this repo, they read docs/API.md, README.md and
// every package README; installed in a project, the same from its node_modules: cssints/docs/API.md (copied into the
// package when it is packed), cssints/README.md and the READMEs of @cssints/*.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { Effect, Option, Schema } from "effect";

import { ToolError } from "./check.ts";

const REPO = resolve(import.meta.dirname, "../../..");
const inRepo = existsSync(join(REPO, "docs/API.md")) && existsSync(join(REPO, "packages/cssints"));

const readmes = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir)
        .map((d) => join(dir, d, "README.md"))
        .filter((f) => existsSync(f))
    : [];

// The files search_docs reads: those of this repository, else those installed under `root`.
export const files = (root: string, repo = inRepo): string[] =>
  repo
    ? [join(REPO, "docs/API.md"), join(REPO, "README.md"), ...readmes(join(REPO, "packages"))]
    : [
        join(root, "node_modules/cssints/docs/API.md"),
        join(root, "node_modules/cssints/README.md"),
        ...readmes(join(root, "node_modules/@cssints")),
      ].filter((f) => existsSync(f));

const read = (file: string) =>
  Effect.try({
    try: () => readFileSync(file, "utf8"),
    catch: (e) => new ToolError({ message: `cannot read ${file}: ${String(e)}` }),
  });

interface Section {
  file: string;
  line: number;
  heading: string;
  path: string;
  text: string;
}

interface Reading {
  fenced: boolean;
  current?: Section;
}

// Sections by heading, outside code fences; `path` is the trail of headings above.
const sectionsOf = (file: string, text: string) => {
  const out: Section[] = [];
  const trail: string[] = [];
  const at: Reading = { fenced: false };
  text.split("\n").forEach((l, i) => {
    if (/^\s*(```|~~~)/.test(l)) at.fenced = !at.fenced;
    const h = at.fenced ? null : /^(#{1,6})\s+(.*)/.exec(l);
    if (h) {
      trail.length = h[1]!.length - 1;
      trail[h[1]!.length - 1] = h[2]!;
      at.current = {
        file,
        line: i + 1,
        heading: h[2]!,
        path: trail.filter(Boolean).join(" > "),
        text: "",
      };
      out.push(at.current);
    } else if (at.current) at.current.text += `${l}\n`;
  });
  return out;
};

const count = (hay: string, term: string) => hay.split(term).length - 1;

const excerpt = (text: string, terms: string[]) => {
  const flat = text.replace(/\s+/g, " ").trim();
  const lower = flat.toLowerCase();
  const found = terms.flatMap((t) => (lower.includes(t) ? [lower.indexOf(t)] : []));
  const at = found.length ? Math.min(...found) : 0;
  const start = Math.max(0, at - 100);
  return `${start ? "…" : ""}${flat.slice(start, start + 320)}${start + 320 < flat.length ? "…" : ""}`;
};

export const searchDocs = Effect.fn("mcp.searchDocs")(function* (
  query: string,
  limit: number | undefined,
) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const sections: Section[] = [];
  for (const f of files(process.cwd())) sections.push(...sectionsOf(f, yield* read(f)));
  const ranked = sections
    .flatMap((s) => {
      const heading = s.path.toLowerCase();
      const body = s.text.toLowerCase();
      const matched = terms.filter((t) => heading.includes(t) || body.includes(t)).length;
      const score = terms.reduce((n, t) => n + count(body, t) + 5 * count(heading, t), 0);
      return matched ? [{ s, matched, score }] : [];
    })
    .sort((a, b) => b.matched - a.matched || b.score - a.score);
  return {
    sources: files(process.cwd()),
    results: ranked.slice(0, limit ?? 5).map(({ s }) => ({
      file: s.file,
      line: s.line,
      heading: s.heading,
      path: s.path,
      excerpt: excerpt(s.text, terms),
    })),
  };
});

const decodeManifest = Schema.decodeUnknownOption(
  Schema.fromJsonString(Schema.Struct({ description: Schema.optional(Schema.String) })),
);

const ROW = /^\| \[`(@cssints\/[\w-]+)`\]\(([^)]+)\) +\| (.*?) +\| (.*?) +\|$/;

export const listPlugins = Effect.fn("mcp.listPlugins")(function* () {
  if (inRepo) {
    const api = yield* read(join(REPO, "docs/API.md"));
    return {
      source: join(REPO, "docs/API.md"),
      plugins: api.split("\n").flatMap((l) => {
        const m = ROW.exec(l);
        return m
          ? [
              {
                name: m[1]!,
                members: m[3]!,
                description: m[4]!,
                readme: resolve(REPO, "docs", m[2]!),
              },
            ]
          : [];
      }),
    };
  }
  // installed: each @cssints package's description, and the names its README imports from it
  const dir = join(process.cwd(), "node_modules/@cssints");
  const plugins = [];
  for (const d of existsSync(dir) ? readdirSync(dir) : []) {
    const manifest = join(dir, d, "package.json");
    const readme = join(dir, d, "README.md");
    if (!existsSync(manifest) || !existsSync(readme)) continue;
    const name = `@cssints/${d}`;
    const description = Option.getOrUndefined(decodeManifest(yield* read(manifest)))?.description;
    const text = yield* read(readme);
    const members = [...text.matchAll(/import \{([^}]+)\} from "([^"]+)"/g)]
      .filter((m) => m[2] === name || m[2]!.startsWith(`${name}/`))
      .flatMap((m) => m[1]!.split(",").map((n) => n.trim()))
      .filter(Boolean);
    plugins.push({
      name,
      members: [...new Set(members)].join(", "),
      description: description ?? "",
      readme,
    });
  }
  return { source: dir, plugins };
});
