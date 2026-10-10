// The prompt box of cssints({ devtools: true, opencode: true }) in Chrome, on fixtures/app and a fake OpenCode service: the box
// appears for a picked element (and not before, and not without the option); Enter with no service running gives the message and
// keeps the text; with a service the status goes running, then completed, shows the session id and empties the box; the service
// received the instruction and the call site of the element. Needs dist/overlay.js (`bun run build`).
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";

import cssints from "cssints/vite";
import { createServer } from "vite";

import { startFake } from "./fake-opencode.mjs";

const here = import.meta.dirname;
const modules = join(here, "../../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const { chromium } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);

const fake = await startFake();
const serve = async (port, options) => {
  const server = await createServer({
    root: join(here, "fixtures/app"),
    configFile: false,
    logLevel: "error",
    server: { port, strictPort: false },
    plugins: [cssints(options)],
  });
  await server.listen();
  return server;
};
const until = async (what, check, ms = 8000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const last = await check();
    if (last) return last;
    await sleep(100);
  }
  throw new Error(`timed out: ${what}`);
};

const browser = await chromium.launch({ channel: "chrome" });
const open = async (server) => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(server.resolvedUrls.local[0]);
  await page.locator("[data-devtools=toggle]").click();
  await page.locator("[data-devtools=panel]").waitFor();
  await until("the table", () => page.locator("text=hover an element").count());
  return { page, errors };
};
const pick = async (page) => {
  await page.hover("#p");
  await page.click("#p");
  await until("the inspection", () => page.locator("[data-devtools=classes]").count());
};

// ---------- on
{
  const server = await serve(5294, { devtools: true, opencode: true });
  const { page, errors } = await open(server);
  assert.equal(
    await page.locator("[data-devtools=ask]").count(),
    0,
    "no box before an element is picked",
  );
  await pick(page);
  const input = page.locator("[data-devtools=ask-input]");
  await input.waitFor();
  assert.equal(await page.locator("[data-devtools=ask-status]").count(), 0);

  // arrows move the caret of the box, not the selection; Shift+Enter is a new line
  await input.fill("make it bigger");
  await input.press("ArrowUp");
  assert.match(await page.locator("[data-devtools=element]").innerText(), /^p#p/);

  // no service runs
  await input.press("Enter");
  const status = page.locator("[data-devtools=ask-status]");
  await until(
    "the message",
    async () => (await status.getAttribute("data-status")) === "unavailable",
  );
  assert.match(await status.innerText(), /No OpenCode service is running/);
  assert.equal(await input.inputValue(), "make it bigger", "the text stays, nothing to retype");
  assert.equal(fake.calls.length, 0);

  // a service runs
  fake.register();
  await input.press("Enter");
  await until("completed", async () => (await status.getAttribute("data-status")) === "completed");
  assert.match(await status.innerText(), /completed · ses_fake1/);
  assert.equal(await input.inputValue(), "", "the box is empty once the session exists");
  const prompt = fake.calls.find((c) => c.path.endsWith("/prompt")).body.text;
  assert.match(prompt, /^Change the UI of the running app/);
  assert.match(prompt, /Instruction: make it bigger\n/);
  assert.match(prompt, /Element: <p#p>/);
  assert.match(prompt, /- main\.ts:5\n {2}color\("rebeccapurple"\)/);
  assert.match(prompt, /- color: rebeccapurple from \._\w+ \(_\.\w\)/);
  assert.ok(prompt.length < 4000, `${prompt.length} characters`);
  assert.ok(!prompt.includes(server.config.root), "no path of this machine but the repository");
  assert.deepEqual(errors, []);
  await page.close();
  await server.close();
}

// ---------- off (the default): the panel has no box
{
  const server = await serve(5295, { devtools: true });
  const { page, errors } = await open(server);
  await pick(page);
  assert.equal(await page.locator("[data-devtools=ask]").count(), 0);
  assert.deepEqual(errors, []);
  await page.close();
  await server.close();
}

await browser.close();
fake.close();
console.log("devtools ask box ok (chrome)");
