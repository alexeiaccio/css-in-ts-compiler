// docs/API.md and README.md: every ts and tsx code block is type-checked against the workspace "cssints" types.
//   - a block fenced `ts skip` or `tsx skip` is not checked (output, or code that shows another tool);
//   - a line that ends with `// error` must have a type error, and no other line may have one.
// Each block is its own module in test/.tmp-docs; `prop` is the one name the blocks use without declaring it.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const here = import.meta.dirname;
const tmp = join(here, ".tmp-docs");
const docs = ["../../../docs/API.md", "../../../README.md"];

const blocks = [];
for (const doc of docs) {
  const text = readFileSync(join(here, doc), "utf8");
  for (const m of text.matchAll(/^```(tsx?)([^\n]*)\n([\s\S]*?)^```$/gm)) {
    if (m[2].trim() === "skip") continue;
    const line = text.slice(0, m.index).split("\n").length + 1;
    blocks.push({ name: `${doc.split("/").pop()}-${line}`, ext: m[1], line, code: m[3] });
  }
}
assert.ok(blocks.length > 10, `found ${blocks.length} blocks`);

rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp);
writeFileSync(
  join(tmp, "globals.d.ts"),
  `declare const prop: boolean;
declare module "*.css"; // what vite/client gives
declare namespace JSX {
  interface IntrinsicElements {
    [tag: string]: { className?: string; style?: Record<string, string> };
  }
}
`,
);
writeFileSync(
  join(tmp, "tsconfig.json"),
  JSON.stringify({
    extends: "../../tsconfig.json",
    compilerOptions: {
      jsx: "preserve",
      noEmit: true,
      types: [],
      lib: ["ES2023", "DOM"],
      // the icons package and its collection: not dependencies of cssints, so found by path
      paths: {
        "@cssints/icons": ["../../../icons/src/types.ts"],
        "@iconify-json/*": ["../../../icons/node_modules/@iconify-json/*"],
      },
    },
    include: ["*.ts", "*.tsx"],
  }),
);
for (const b of blocks) writeFileSync(join(tmp, `${b.name}.${b.ext}`), `${b.code}\nexport {};\n`);

const tsgo = join(here, "../../../node_modules/.bin/tsgo");
const run = spawnSync(tsgo, ["-p", join(tmp, "tsconfig.json"), "--pretty", "false"], {
  encoding: "utf8",
});
rmSync(tmp, { recursive: true, force: true });
if (run.error) throw run.error;

// file(line,col): error TSnnnn: message
const errors = new Map();
for (const m of run.stdout.matchAll(/^(\S+?)\.tsx?\((\d+),\d+\): error (TS\d+): (.*)$/gm)) {
  const key = `${m[1].split("/").pop()}:${m[2]}`;
  errors.set(key, [...(errors.get(key) ?? []), `${m[3]} ${m[4]}`]);
}
const unparsed = run.stdout
  .split("\n")
  .filter((l) => /error TS/.test(l) && !/^\S+?\.tsx?\(\d+,\d+\)/.test(l));

const problems = [];
for (const l of unparsed) problems.push(l);
for (const b of blocks) {
  const lines = b.code.split("\n");
  lines.forEach((text, i) => {
    const got = errors.get(`${b.name}:${i + 1}`);
    errors.delete(`${b.name}:${i + 1}`);
    const want = /\/\/ error\b/.test(text);
    const at = `${b.name.replace(/-\d+$/, "")}:${b.line + i}`;
    if (want && !got) problems.push(`${at}: marked // error, but it type-checks: ${text.trim()}`);
    if (!want && got) problems.push(`${at}: ${got.join("; ")}\n    ${text.trim()}`);
  });
}
for (const [key, got] of errors) problems.push(`${key}: ${got.join("; ")}`);

if (problems.length) {
  console.error(`docs: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`docs: ${blocks.length} code blocks type-check`);
