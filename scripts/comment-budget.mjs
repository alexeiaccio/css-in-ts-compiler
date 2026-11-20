import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOTS = ["packages", "apps"];
const SKIP = new Set([
  "node_modules",
  "dist",
  ".publish",
  ".vitest",
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
const BUDGET = "comment-budget.json";

const files = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.tsx?$/.test(full) || GENERATED.has(entry) || full.includes(".generated.")) continue;
    files.push(full);
  }
};
for (const root of ROOTS) walk(root);

// A prose comment is a `//` block that is not a directive, a licence, a WARNING/SAFETY marker or the shortcut marker; TSDoc
// is API documentation and is not counted. The unit is the line, because the budget is a line budget.
const counts = new Map();
for (const file of files) {
  let prose = 0;
  let inBlock = false;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("/**")) inBlock = true;
    if (inBlock) {
      if (trimmed.includes("*/")) inBlock = false;
      continue;
    }
    if (!trimmed.startsWith("//")) continue;
    const text = trimmed.slice(2).trim();
    if (text === "") continue;
    if (DIRECTIVE.some((marker) => text.includes(marker))) continue;
    if (ALLOWED.some((prefix) => text.startsWith(prefix))) continue;
    prose += 1;
  }
  if (prose === 0) continue;
  const [scope, name] = relative(".", file).split("/");
  const key = `${scope}/${name}`;
  counts.set(key, (counts.get(key) ?? 0) + prose);
}

const sorted = [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
if (process.argv.includes("--json")) {
  console.log(JSON.stringify(Object.fromEntries(sorted), null, 2));
  process.exit(0);
}

if (process.argv.includes("--update")) {
  writeFileSync(BUDGET, `${JSON.stringify(Object.fromEntries(sorted), null, 2)}\n`);
  console.log(
    `wrote ${BUDGET}: ${sorted.length} packages, ${[...counts.values()].reduce((a, b) => a + b, 0)} lines`,
  );
  process.exit(0);
}

let budget;
try {
  budget = JSON.parse(readFileSync(BUDGET, "utf8"));
} catch {
  console.error(`${BUDGET} is missing: run "node scripts/comment-budget.mjs --update"`);
  process.exit(2);
}

const problems = [];
for (const [key, count] of sorted) {
  const allowed = budget[key];
  if (allowed === undefined) {
    problems.push(`${key}: ${count} prose comment lines, no budget — add it with --update`);
    continue;
  }
  if (count > allowed) {
    problems.push(
      `${key}: ${count} prose comment lines, budget ${allowed} — delete ${count - allowed}`,
    );
  }
  if (count < allowed) {
    problems.push(
      `${key}: budget says ${allowed} and it has ${count} — lower the entry (a budget only shrinks)`,
    );
  }
}
for (const key of Object.keys(budget)) {
  if (!counts.has(key))
    problems.push(`${key}: budget ${budget[key]}, no prose comments left — remove the entry`);
}

if (problems.length) {
  console.error("Comment budget\n");
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(`\n${problems.length} problem(s). The budget is a ratchet: it only goes down.`);
  process.exit(1);
}
console.log(
  `comment budget ok: ${[...counts.values()].reduce((a, b) => a + b, 0)} prose lines across ${sorted.length} packages`,
);
