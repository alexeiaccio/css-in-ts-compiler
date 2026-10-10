// The playground: the engine in a browser worker makes what the Node engine makes. The README example, every fixture of
// packages/cssints/test/fixtures that imports only "cssints" (and its plugin modules), the fixtures of the plugin packages that run
// in a browser, and projects of several files go through the real plugin in Node (test/playground-reference.mjs, a child
// process) and through the worker in Chrome: the same sheet, the same classes, the same located error. Then the page: Monaco loads
// with the types of cssints, a hover shows a type, a type error is marked, files are added and switched, the preview renders with
// no console error, an error is marked in the editor, the hash holds all the files and gives them back. (Skipped without Chrome,
// like browser.mjs.)
//   node test/playground.mjs
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { createServer } from "vite";

import { PLUGINS, TOKEN_SETS } from "../plugin/playground.ts";
import { createHash as sha1 } from "../src/playground/shims/crypto.ts";

const root = join(import.meta.dirname, "..");
const repo = join(root, "../..");
const out = join(import.meta.dirname, "out");
const work = join(out, "playground");
mkdirSync(work, { recursive: true });

// ---------- the SHA-1 of the shim is Node's
for (const n of [0, 1, 3, 55, 56, 57, 63, 64, 65, 119, 120, 1000]) {
  const text = "a".repeat(n);
  assert.equal(
    sha1("sha1").update(text).digest("hex"),
    createHash("sha1").update(text).digest("hex"),
    `${n} bytes`,
  );
}
for (const text of ["", "ünïcode ✓ 日本語", "playground.tsx:0:0", "𝒳 emoji 😀"]) {
  assert.equal(
    sha1("sha1").update(text).digest("hex"),
    createHash("sha1").update(text).digest("hex"),
    text,
  );
}

// ---------- the cases
const readme = readFileSync(join(repo, "README.md"), "utf8");
const example = /```tsx\n(import \{ cx \} from "cssints";[\s\S]*?)\n```/.exec(readme)?.[1];
assert.ok(example, "the README has the example");
assert.equal(
  readFileSync(join(root, "src/playground/example.txt"), "utf8"),
  `${example}\n`,
  "example.txt is the README's example",
);

// fixtures that import "cssints" and the modules of the playground only
const known = `cssints(/frame|/surface|/plugin)?|@cssints/(${PLUGINS.join("|")}|tokens/(${TOKEN_SETS.join("|")}))`;
const alone = (dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(".ts"))
    .filter((f) => {
      const imports = readFileSync(join(dir, f), "utf8")
        .split("\n")
        .filter((l) => /^import /.test(l));
      return imports.every((l) => new RegExp(`from "(${known})"`).test(l));
    })
    .map((f) => ({ name: f, source: readFileSync(join(dir, f), "utf8") }));
const fixtures = join(repo, "packages/cssints/test/fixtures");
// What the worker cannot do: the evaluator of Node gives a module a DOM (happy-dom), a worker has none.
const DOM = new Set(["dom-side-effect.ts", "runtime-global-ok.ts", "runtime-globals-ok.ts"]);
const ENTRY = "playground.tsx";
const one = (name, source) => ({ name, files: { [ENTRY]: source } });
const project = (name, files) => ({ name, files });
const used = 'import { bg, cn, p } from "cssints" with { type: "cssints" };\n';
const tokens = `import { createTokens } from "cssints" with { type: "cssints" };
export const t = createTokens({
  color: { $type: "color", surface: { $value: "#ffffff" }, text: { $value: "#111111" } },
});
`;
const plugins = PLUGINS.flatMap((n) =>
  alone(join(repo, `packages/${n}/test/fixtures`)).map((f) => one(`${n}/${f.name}`, f.source)),
);
const cases = [
  one("README example", example),
  ...alone(fixtures)
    .filter((f) => !DOM.has(f.name))
    .map((f) => one(f.name, f.source)),
  ...plugins,
  ...alone(join(repo, "packages/tokens/test/fixtures")).map((f) =>
    one(`tokens/${f.name}`, f.source),
  ),
  one("syntax error", 'import { p } from "cssints" with { type: "cssints" };\nconst a = p(;\n'),
  // several files: a module of tokens, a plain module, a barrel, a directory, an error in the file that is imported
  project("two files", {
    [ENTRY]: `${used}import { t } from "./tokens.ts" with { type: "cssints" };\nexport const card = cn(p(4), bg(t.color.surface));\n`,
    "tokens.ts": tokens,
  }),
  project("a plain module and a barrel", {
    [ENTRY]: `${used}import { t, gap } from "./index.ts" with { type: "cssints" };\nexport const card = cn(p(gap), bg(t.color.text));\n`,
    "index.ts": 'export { t } from "./tokens.ts";\nexport { gap } from "./gap.ts";\n',
    "gap.ts": "export const gap = 3;\n",
    "tokens.ts": tokens,
  }),
  project("a directory and ..", {
    [ENTRY]: 'import { Card } from "./ui/card.ts";\nexport default Card;\n',
    "ui/card.ts": `${used}import { t } from "../tokens.ts" with { type: "cssints" };\nexport const Card = cn(p(2), bg(t.color.surface));\n`,
    "tokens.ts": tokens,
  }),
  project("an error in the imported file", {
    [ENTRY]: `${used}import { t } from "./tokens.ts" with { type: "cssints" };\nexport const card = cn(p(4), bg(t.color.surface));\n`,
    "tokens.ts":
      'import { p } from "cssints" with { type: "cssints" };\nexport const t = { a: p("red") };\n',
  }),
  project("a plugin in a second file", {
    [ENTRY]: 'import { size } from "./size.ts" with { type: "cssints" };\nexport const a = size;\n',
    "size.ts":
      'import { fontSize } from "cssints" with { type: "cssints" };\nimport { fluid } from "@cssints/fluid" with { type: "cssints" };\nexport const size = fontSize(fluid("1rem", "1.5rem"));\n',
  }),
];
assert.ok(cases.length > 150, `${cases.length} cases`);

// ---------- Node
const cwd = work;
writeFileSync(join(work, "cases.json"), JSON.stringify(cases.map((c) => c.files)));
const reference = JSON.parse(
  execFileSync(
    "node",
    [join(import.meta.dirname, "playground-reference.mjs"), join(work, "cases.json")],
    {
      cwd,
      encoding: "utf8",
      maxBuffer: 1 << 28,
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    },
  ),
);
rmSync(join(work, "cases.json"));
assert.equal(reference.length, cases.length);

// ---------- Chrome
const modules = join(repo, "node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const { chromium } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);
const browser = await chromium.launch({ channel: "chrome" }).catch((e) => {
  console.log(`playground: skipped, Chrome did not start (${String(e).split("\n")[0]})`);
  process.exit(0);
});
process.env.DOCS_HOVERS = "0";
const server = await createServer({ root, logLevel: "error", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls.local[0];
const problems = [];

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  context.setDefaultTimeout(120_000);
  const page = await context.newPage();
  page.on("pageerror", (e) => problems.push(`pageerror: ${e}`));
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`console: ${m.text()}`);
  });
  page.on("response", (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
  const compiled = () =>
    page
      .locator("[role=status]")
      .filter({ hasText: /Compiled in/ })
      .waitFor();
  // `Types: ok · 340 ms`: the open file, checked by the TypeScript worker of Monaco with the types of cssints
  const types = (re) => page.locator("[data-types]").filter({ hasText: re }).waitFor();
  const t0 = Date.now();
  await page.goto(`${base}playground`);
  await compiled();
  await page.locator(".monaco-editor").waitFor();
  await types(/Types: ok/);
  console.log(
    `playground: Monaco and the first type check of the README example, ${Date.now() - t0} ms from the navigation (${(await page.locator("[data-types]").textContent()).trim()})`,
  );

  // parity: every case, in order, through the worker of the page
  const results = await page.evaluate(
    async (sources) => {
      const { start } = await import("/src/playground/client.ts");
      const engine = start();
      const all = [];
      for (const files of sources) all.push(await engine.compile(files));
      engine.stop();
      return all;
    },
    cases.map((c) => c.files),
  );
  const different = [];
  results.forEach((got, i) => {
    const want = reference[i];
    const name = cases[i].name;
    if (want.ok !== got.ok)
      return different.push(
        `${name}: node ${want.ok ? "compiled" : `failed: ${want.message}`}; browser ${got.ok ? "compiled" : `failed: ${got.errors[0]?.message}`}`,
      );
    if (want.ok) {
      if (want.css !== got.css)
        different.push(
          `${name}: the sheets differ\n--- node\n${want.css}\n--- browser\n${got.css}`,
        );
      else if (want.classes.join() !== got.classes.join())
        different.push(`${name}: the classes differ`);
      else if (want.warnings.join("\n") !== got.warnings.join("\n"))
        different.push(`${name}: the warnings differ\n${want.warnings}\n---\n${got.warnings}`);
    } else {
      const e = got.errors[0];
      // a syntax error is the parser's: Node's is Vite's, with its own words
      if (
        name !== "syntax error" &&
        (want.message !== e.message ||
          want.line !== e.line ||
          want.column !== e.column ||
          (want.file && want.file !== e.file))
      )
        different.push(
          `${name}: the errors differ\n  node:    ${want.file} ${want.line}:${want.column} ${want.message}\n  browser: ${e.file} ${e.line}:${e.column} ${e.message}`,
        );
    }
  });
  if (process.env.PG_VERBOSE)
    results.forEach((r, i) =>
      console.log(r.ok ? "ok  " : "fail", cases[i].name, r.ok ? "" : r.errors[0].message),
    );
  const failed = results.filter((r) => !r.ok).length;
  console.log(
    `playground: ${cases.length} cases, ${failed} fail in both, ${different.length} differ`,
  );
  assert.deepEqual(different, []);
  assert.ok(failed > 5 && failed < results.length - 5, "both outcomes are covered");
  const syntax = results[cases.findIndex((c) => c.name === "syntax error")];
  assert.ok(!syntax.ok && syntax.errors[0].line === 2, "a syntax error is located");

  // what the playground cannot run is said at the import, in the file that has it
  const refused = await page.evaluate(async () => {
    const { start } = await import("/src/playground/client.ts");
    const engine = start();
    const r = await engine.compile({
      "playground.tsx": 'import { fonts } from "@cssints/fonts";\nimport "./nope.ts";\n',
    });
    engine.stop();
    return r;
  });
  assert.ok(!refused.ok);
  assert.deepEqual(
    refused.errors.map((e) => [e.file, e.line, e.message.replace(/ the modules are.*/, "")]),
    [
      ["playground.tsx", 1, '"@cssints/fonts" is not available in the playground:'],
      ["playground.tsx", 2, 'cannot find "./nope.ts" among the files: playground.tsx'],
    ],
  );

  // the page: the preview of the README example
  const frame = page.frameLocator("iframe[title=Preview]");
  const save = frame.getByRole("button", { name: "Save" });
  await save.waitFor();
  const style = await save.evaluate((el) => {
    const c = getComputedStyle(el);
    return { color: c.color, background: c.backgroundColor, padding: c.paddingTop };
  });
  assert.equal(style.color, "rgb(255, 255, 255)");
  assert.equal(style.background, "rgb(37, 99, 235)"); // bg(accent): #2563eb
  assert.equal(style.padding, "8px"); // p(2)
  const sheet = await frame
    .locator("style")
    .evaluateAll((els) => els.map((e) => e.textContent).join("\n"));
  assert.match(sheet, /@layer _\.k, _\.a/);

  // the tabs hold the same text as the compile: the CSS, and the module with its sites replaced
  await page.getByRole("tab", { name: "CSS", exact: true }).click();
  assert.equal(
    (await page.locator("[role=tabpanel] pre").textContent()).trim(),
    reference[0].css.trim(),
  );
  await page.getByRole("tab", { name: "Module" }).click();
  assert.match(await page.locator("[role=tabpanel] pre").textContent(), /cx\("_\w+ _\w+ _\w+"/);
  await page.getByRole("tab", { name: "Shipped CSS" }).click();
  assert.match(await page.locator("[role=tabpanel] pre").textContent(), /@layer _\.k/);

  // a hover shows a type: `cv` with the variants of this file, from the types of cssints
  // (`const button = cv({`: the 13px monospace of the editor puts `cv` at about 125 px)
  await page
    .locator(".view-line")
    .filter({ hasText: /const\sbutton\s=\scv/ })
    .hover({ position: { x: 125, y: 8 } });
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".monaco-hover")].some((h) =>
      /\(alias\) cv<.*wide.*CvConfig/.test(h.textContent),
    ),
  );

  // an edit is compiled, marked where it fails, and kept in the hash
  // the edit, and the end of the build it starts (the hash is written after each one)
  const type = async (text) => {
    const before = await page.evaluate(() => location.hash);
    await page.locator(".monaco-editor .view-lines").click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.insertText(text);
    await page.waitForFunction((h) => location.hash !== h, before, { timeout: 40_000 });
  };
  await type(
    'import { p } from "cssints" with { type: "cssints" };\nexport const a = p(4);\nexport const b = p("red");\n',
  );
  // a type error, from the types of cssints (Monaco's TypeScript), and the build's own error (the engine), at the same place
  await types(/Types: 1 error/);
  await page.waitForFunction(() => document.querySelector(".squiggly-error"));
  assert.match(await page.locator("body").textContent(), /padding: unexpected .red./);
  assert.match(await page.evaluate(() => location.hash), /^#files=/);
  await type('import { p } from "cssints" with { type: "cssints" };\nexport const a = p(4);\n');
  await compiled();
  await types(/Types: ok/);

  // the files: add one, type in it, switch between them, import across them (types and build)
  await page.getByRole("button", { name: "Add a file" }).click();
  await page.getByRole("textbox", { name: "File name" }).fill("tokens.ts");
  await page.keyboard.press("Enter");
  await page.getByRole("tab", { name: "tokens.ts" }).waitFor();
  await type(tokens);
  await page.getByRole("tab", { name: ENTRY }).click();
  await type(
    `${used}import { t } from "./tokens.ts" with { type: "cssints" };\nexport const card = cn(p(4), bg(t.color.surface));\nexport default () => <div className={card}>hello</div>;\n`,
  );
  await compiled();
  await types(/Types: ok/);
  await page
    .locator(".monaco-editor .view-lines")
    .filter({ hasText: /from\s"\.\/tokens\.ts"/ })
    .waitFor();
  await page.getByRole("tab", { name: "Preview" }).click();
  const two = page.frameLocator("iframe[title=Preview]").getByText("hello");
  await two.waitFor();
  assert.equal(
    await two.evaluate((el) => getComputedStyle(el).backgroundColor),
    "rgb(255, 255, 255)",
  );
  await page.getByRole("tab", { name: "tokens.ts" }).click();
  await page
    .locator(".monaco-editor .view-lines")
    .filter({ hasText: /createTokens/ })
    .waitFor();
  await page.getByRole("tab", { name: "Module" }).click();
  assert.match(
    await page.locator("[role=tabpanel] pre").textContent(),
    /"surface":"var\(--color-surface\)"/,
  );
  await page.getByRole("tab", { name: "Preview" }).click();
  // a name that tokens.ts does not export: the types see it across the files
  await page.getByRole("tab", { name: ENTRY }).click();
  await type(
    `${used}import { nope } from "./tokens.ts" with { type: "cssints" };\nexport const a = p(4);\n`,
  );
  await types(/Types: 1 error/);
  // a plugin package: its types and its build
  await type(
    'import { fontSize } from "cssints" with { type: "cssints" };\nimport { fluid } from "@cssints/fluid" with { type: "cssints" };\nexport const a = fontSize(fluid("1rem", "1.5rem"));\n',
  );
  await compiled();
  await types(/Types: ok/);
  assert.match(await page.locator("body").textContent(), /Compiled in/);
  await page.getByRole("tab", { name: "CSS", exact: true }).click();
  assert.match(await page.locator("[role=tabpanel] pre").textContent(), /clamp\(1rem, /);
  await type(
    'import { fontSize } from "cssints" with { type: "cssints" };\nimport { fluid } from "@cssints/fluid" with { type: "cssints" };\nexport const a = fontSize(fluid("1rem", "red"));\n',
  );
  await types(/Types: 1 error/);
  await type(
    `${used}import { t } from "./tokens.ts" with { type: "cssints" };\nexport const card = cn(p(4), bg(t.color.surface));\nexport default () => <div className={card}>hello</div>;\n`,
  );
  await compiled();
  // rename (double-click) and delete a file
  await page.getByRole("button", { name: "Add a file" }).click();
  await page.getByRole("textbox", { name: "File name" }).fill("extra");
  await page.keyboard.press("Enter");
  await page.getByRole("tab", { name: "extra.ts" }).dblclick();
  await page.getByRole("textbox", { name: "Rename extra.ts" }).fill("other.ts");
  await page.keyboard.press("Enter");
  await page.getByRole("tab", { name: "other.ts" }).waitFor();
  assert.equal(await page.getByRole("tab", { name: "extra.ts" }).count(), 0);
  await page.getByRole("button", { name: "Delete other.ts" }).click();
  assert.equal(await page.getByRole("tab", { name: "other.ts" }).count(), 0);
  await page.getByRole("tab", { name: ENTRY }).click();
  await compiled();
  const hash = await page.evaluate(() => location.hash);

  // a link opens with all the files
  const shared = await context.newPage();
  shared.on("pageerror", (e) => problems.push(`pageerror: ${e}`));
  await shared.goto(`${base}playground${hash}`);
  await shared.getByRole("tab", { name: "tokens.ts" }).waitFor();
  await shared.getByRole("tab", { name: ENTRY }).waitFor();
  await shared.frameLocator("iframe[title=Preview]").getByText("hello").waitFor();
  await shared
    .locator(".monaco-editor .view-lines")
    .filter({ hasText: /from\s"\.\/tokens\.ts"/ })
    .waitFor();
  await shared.close();
  // and the link of the first version, `#code=<the file>`, still does
  const old = await context.newPage();
  const bytes = await page.evaluate(async () => {
    const out = new Blob(["export const a = 1;\n"])
      .stream()
      .pipeThrough(new CompressionStream("deflate-raw"));
    return btoa(String.fromCharCode(...new Uint8Array(await new Response(out).arrayBuffer())))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  });
  await old.goto(`${base}playground#code=${bytes}`);
  await old.locator(".monaco-editor .view-lines").getByText("export").waitFor();
  await old.close();

  // build-time code that never ends is cut off and the worker comes back
  await page.getByRole("tab", { name: ENTRY }).click();
  await type(
    'import { p } from "cssints" with { type: "cssints" };\nwhile (true) {}\nexport const a = p(4);\n',
  );
  await page.locator("[role=status]").filter({ hasText: /error/ }).waitFor({ timeout: 40_000 });
  assert.match(await page.locator("body").textContent(), /took more than 15 seconds/);
  await type('import { p } from "cssints" with { type: "cssints" };\nexport const a = p(4);\n');
  await compiled();

  await page.screenshot({ path: join(out, "playground.png") });
  assert.deepEqual(problems, []);
  console.log("playground: ok");
} finally {
  await browser.close();
  await server.close();
}
process.exit(0);
