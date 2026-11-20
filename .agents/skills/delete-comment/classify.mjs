import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOTS = ["packages", "apps"];
const SKIP = new Set([
  "node_modules",
  "dist",
  ".publish",
  "fixtures",
  "vendor",
  "test",
  "bench",
  "scripts",
]);
const GENERATED = new Set(["members.ts", "mdn.ts", "keywords.ts", "longhands.ts", "css.ts"]);
const DIRECTIVE = [
  "oxlint-",
  "eslint-",
  "@ts-",
  "@effect-diagnostics",
  "@vitest-",
  "@jsxImportSource",
  "@__PURE__",
  "SPDX-",
  "@license",
  "@preserve",
];
const ALLOWED = ["WARNING", "SAFETY", "ponytail:"];
const EXCUSE =
  /\b(TODO|FIXME|HACK|XXX|for now|temporar\w*|works? because|workaround|good enough|until we|will be (?:fixed|replaced)|not ideal|ugly|cheat|hacky)\b/i;

const files = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!full.endsWith(".ts") && !full.endsWith(".tsx")) continue;
    if (GENERATED.has(entry) || full.includes(".generated.")) continue;
    files.push(full);
  }
};
for (const root of ROOTS) walk(root);

const allText = files.map((file) => readFileSync(file, "utf8")).join("\n");
const known = (word) => allText.includes(word);

const words = (text) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3);

const identifiers = (code) => new Set(words(code.replace(/([a-z0-9])([A-Z])/g, "$1 $2")));
const STOP = new Set([
  "that",
  "this",
  "with",
  "from",
  "into",
  "when",
  "then",
  "than",
  "they",
  "them",
  "their",
  "there",
  "which",
  "what",
  "where",
  "while",
  "have",
  "been",
  "does",
  "each",
  "only",
  "also",
  "just",
  "same",
  "like",
  "over",
  "under",
  "after",
  "before",
  "because",
  "still",
  "even",
  "else",
  "onto",
  "once",
  "every",
  "first",
  "second",
]);

const buckets = { tautology: [], excuse: [], stale: [], decision: [] };
let proseLines = 0;

for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  // a block of `//` lines is one comment: classifying a wrapped line on its own calls a sentence fragment a tautology
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].trim().startsWith("//")) continue;
    const start = index;
    const block = [];
    while (index < lines.length && lines[index].trim().startsWith("//")) {
      block.push(lines[index].trim().slice(2).trim());
      index += 1;
    }
    const text = block.join(" ").replace(/\s+/g, " ").trim();
    if (text === "" || DIRECTIVE.some((marker) => text.includes(marker))) continue;
    if (ALLOWED.some((prefix) => text.startsWith(prefix))) continue;
    proseLines += block.length;

    const next =
      lines
        .slice(index, index + 6)
        .find((candidate) => candidate.trim() !== "" && !candidate.trim().startsWith("//")) ?? "";

    const entry = { file: relative(".", file), line: start + 1, lines: block.length, text };
    if (EXCUSE.test(text)) {
      buckets.excuse.push(entry);
      continue;
    }
    const paths = [...text.matchAll(/[\w./-]+\.(?:ts|tsx|mjs|json|css|qnt)\b/g)].map((m) => m[0]);
    if (paths.some((path) => !known(path.split("/").pop()))) {
      buckets.stale.push(entry);
      continue;
    }
    const content = words(text).filter((word) => !STOP.has(word));
    const code = identifiers(next);
    if (text.length < 70 && content.length > 0 && content.every((word) => code.has(word))) {
      buckets.tautology.push(entry);
      continue;
    }
    buckets.decision.push(entry);
  }
}

for (const [name, entries] of Object.entries(buckets)) {
  console.log(`${name}: ${entries.length}`);
  for (const entry of entries.slice(0, 6))
    console.log(`  ${entry.file}:${entry.line}  ${entry.text.slice(0, 90)}`);
}
console.log(`\nprose // lines: ${proseLines} in ${files.length} files`);
const lines = (entries) => entries.reduce((sum, entry) => sum + entry.lines, 0);
console.log(
  `shed by deleting tautology + stale + excuse: ${lines(buckets.tautology) + lines(buckets.stale) + lines(buckets.excuse)}`,
);
