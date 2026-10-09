// The playground: the engine in a browser worker makes what the Node engine makes. The README example and every fixture of
// packages/cssints/test/fixtures that imports only "cssints" (and its plugin modules) go through the real plugin in Node
// (test/playground-reference.mjs, a child process) and through the worker in Chrome: the same sheet, the same classes, the same
// located error. Then the page: the preview renders with no console error, an error is marked in the editor, the hash holds the
// code and gives it back. (Skipped without Chrome, like browser.mjs.)
//   node test/playground.mjs
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { createServer } from "vite";

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

const fixtures = join(repo, "packages/cssints/test/fixtures");
const alone = readdirSync(fixtures)
  .filter((f) => f.endsWith(".ts"))
  .filter((f) => {
    const imports = readFileSync(join(fixtures, f), "utf8")
      .split("\n")
      .filter((l) => /^import /.test(l));
    return imports.every((l) => /from "cssints(\/frame|\/surface|\/plugin)?"/.test(l));
  });
// What the worker cannot do: the evaluator of Node gives a module a DOM (happy-dom), a worker has none.
const DOM = new Set(["dom-side-effect.ts", "runtime-global-ok.ts", "runtime-globals-ok.ts"]);
const cases = [
  { name: "README example", source: example },
  ...alone
    .filter((f) => !DOM.has(f))
    .map((f) => ({ name: f, source: readFileSync(join(fixtures, f), "utf8") })),
  {
    name: "syntax error",
    source: 'import { p } from "cssints" with { type: "cssints" };\nconst a = p(;\n',
  },
];
assert.ok(cases.length > 100, `${cases.length} cases`);

// ---------- Node
const cwd = work;
writeFileSync(join(work, "cases.json"), JSON.stringify(cases.map((c) => c.source)));
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
  await page.goto(`${base}playground`);
  await page
    .locator("[role=status]")
    .filter({ hasText: /Compiled in/ })
    .waitFor();

  // parity: every case, in order, through the worker of the page
  const results = await page.evaluate(
    async (sources) => {
      const { start } = await import("/src/playground/client.ts");
      const engine = start();
      const all = [];
      for (const source of sources) all.push(await engine.compile(source));
      engine.stop();
      return all;
    },
    cases.map((c) => c.source),
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
        (want.message !== e.message || want.line !== e.line || want.column !== e.column)
      )
        different.push(
          `${name}: the errors differ\n  node:    ${want.line}:${want.column} ${want.message}\n  browser: ${e.line}:${e.column} ${e.message}`,
        );
    }
  });
  const failed = results.filter((r) => !r.ok).length;
  console.log(
    `playground: ${cases.length} cases, ${failed} fail in both, ${different.length} differ`,
  );
  assert.deepEqual(different, []);
  assert.ok(failed > 5 && failed < results.length - 5, "both outcomes are covered");
  const syntax = results.at(-1);
  assert.ok(!syntax.ok && syntax.errors[0].line === 2, "a syntax error is located");

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

  // an edit is compiled, marked where it fails, and kept in the hash
  const editor = page.locator(".cm-content");
  const type = async (text) => {
    await editor.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.insertText(text);
  };
  await type(
    'import { p } from "cssints" with { type: "cssints" };\nexport const a = p(4);\nexport const b = p("red");\n',
  );
  await page.waitForFunction(() => document.querySelector(".cm-lintRange-error"));
  assert.match(await page.locator("body").textContent(), /padding: unexpected .red./);
  assert.match(await page.evaluate(() => location.hash), /^#code=/);
  await type('import { p } from "cssints" with { type: "cssints" };\nexport const a = p(4);\n');
  await page
    .locator("[role=status]")
    .filter({ hasText: /Compiled in/ })
    .waitFor();
  const hash = await page.evaluate(() => location.hash);

  // a link opens with that code
  const shared = await context.newPage();
  shared.on("pageerror", (e) => problems.push(`pageerror: ${e}`));
  await shared.goto(`${base}playground${hash}`);
  await shared.locator(".cm-content").waitFor();
  assert.match(await shared.locator(".cm-content").textContent(), /export const a = p\(4\);/);
  await shared.close();

  // build-time code that never ends is cut off and the worker comes back
  await type(
    'import { p } from "cssints" with { type: "cssints" };\nwhile (true) {}\nexport const a = p(4);\n',
  );
  await page.locator("[role=status]").filter({ hasText: /error/ }).waitFor({ timeout: 40_000 });
  assert.match(await page.locator("body").textContent(), /took more than 15 seconds/);
  await type('import { p } from "cssints" with { type: "cssints" };\nexport const a = p(4);\n');
  await page
    .locator("[role=status]")
    .filter({ hasText: /Compiled in/ })
    .waitFor();

  await page.screenshot({ path: join(out, "playground.png") });
  assert.deepEqual(problems, []);
  console.log("playground: ok");
} finally {
  await browser.close();
  await server.close();
}
process.exit(0);
