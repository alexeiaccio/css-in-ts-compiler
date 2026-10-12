// The OpenCode box of cssints({ devtools: true, opencode: true }) in Chrome, on fixtures/app and a fake OpenCode service:
//   the box (title "OpenCode", the input, the status line) is there with nothing picked, and not without the option;
//   it is pinned: at the panel's bottom edge in a left or right dock, at its right edge (to the right of the inspection) in a
//   top or bottom dock, in the detached window by the window's shape (wider than tall: the right edge), while the inspection
//   overflows and scrolls;
//   without a service the status line says how to connect; a service started after the panel opened shows on focus, with
//   its address; a prompt with nothing picked is the instruction and the page; the session id shows after the send;
//   the line says `no session attached` or `attached session <id>` (the full id in the title) as /cssints-devtools sets it;
//   a service that goes away shows on the failed send. Screenshots of the right and bottom docks go to test/out/.
// Needs dist/overlay.js (`bun run build`).
import assert from "node:assert/strict";
import { mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";

import { attach, serverId } from "cssints/devtools-link";
import cssints from "cssints/vite";
import { createServer } from "vite";

import { startFake } from "./fake-opencode.mjs";

const here = import.meta.dirname;
const modules = join(here, "../../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const { chromium } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);
const out = join(here, "out");
mkdirSync(out, { recursive: true });

const repo = join(here, "../../.."); // the repository of the fixture app: where /cssints-devtools keeps its files
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
const open = async (server, dock = "right") => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 300 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // a short page and panel (200 px): the inspection overflows it
  await page.addInitScript(
    (v) => localStorage.setItem("cssints-devtools:dock", JSON.stringify(v)),
    { dock, w: 440, h: 200 },
  );
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
const box = (page, name) => page.locator(`[data-devtools=${name}]`).boundingBox();
const near = (a, b, what) => assert.ok(Math.abs(a - b) <= 2, `${what}: ${a} vs ${b}`);

// the ask box against the panel and the inspection, in the layout `side` (right edge) or the bottom edge
const pinned = async (page, side, what) => {
  const [panel, body, ask, bar] = await Promise.all(
    ["panel", "body", "ask", "bar"].map((n) => box(page, n)),
  );
  const scrolls = await page
    .locator("[data-devtools=body]")
    .evaluate((el) => el.scrollHeight > el.clientHeight);
  assert.ok(scrolls, `${what}: the inspection overflows`);
  assert.equal(
    await page.locator("[data-devtools=ask]").getAttribute("data-layout"),
    side ? "side" : "bottom",
  );
  near(bar.y, panel.y, `${what}: the bar is at the panel's top`);
  if (side) {
    near(ask.x + ask.width, panel.x + panel.width, `${what}: right edge`);
    assert.ok(ask.x >= body.x + body.width - 1, `${what}: right of the inspection`);
    assert.ok(ask.height >= panel.height - 4, `${what}: the whole height of the panel`);
  } else {
    near(ask.y + ask.height, panel.y + panel.height, `${what}: bottom edge`);
    assert.ok(ask.y >= body.y + body.height - 1, `${what}: under the inspection`);
    near(ask.width, panel.width, `${what}: the whole width of the panel`);
  }
  assert.ok(bar.height > 0 && ask.height > 0, `${what}: the bar and the box are visible`);
};
const shot = (page, name) =>
  page.screenshot({ path: join(out, `ask-${name}.png`), animations: "disabled" });
const DOCKS = { right: false, left: false, top: true, bottom: true };

// ---------- pinned, with nothing connected
{
  const server = await serve(5296, { devtools: true, opencode: true });
  const { page, errors } = await open(server);
  await page.locator("[data-devtools=ask]").waitFor();
  // pinned in every dock, with the inspection overflowing
  await pick(page);
  for (const [dock, side] of Object.entries(DOCKS)) {
    await page.locator(`[data-devtools=dock][data-dock=${dock}]`).click();
    await until(`dock ${dock}`, async () => (await box(page, "panel"))?.height);
    await pinned(page, side, dock);
    if (dock === "right" || dock === "bottom") await shot(page, `${dock}-not-connected`);
  }

  // the detached window follows its own shape
  const [win] = await Promise.all([
    page.waitForEvent("popup"),
    page.locator("[data-devtools=detach]").click(),
  ]);
  await win.locator("[data-devtools=panel]").waitFor();
  const shape = async (width, height) => {
    await win.setViewportSize({ width, height });
    await until(
      "the layout",
      async () =>
        (await win.locator("[data-devtools=ask]").getAttribute("data-layout")) ===
        (width > height ? "side" : "bottom"),
    );
    const [panel, ask] = await Promise.all(["panel", "ask"].map((n) => box(win, n)));
    if (width > height)
      near(ask.x + ask.width, panel.x + panel.width, `window ${width}: right edge`);
    else near(ask.y + ask.height, panel.y + panel.height, `window ${width}: bottom edge`);
    assert.ok(ask.height > 0 && ask.y + ask.height <= height + 1, "the box is in the window");
  };
  await shape(520, 400);
  await shape(900, 300);
  await win.close();
  await until("docked again", async () => (await box(page, "panel")) !== null);

  assert.deepEqual(errors, []);
  await page.close();
  await server.close();
}

// ---------- on
{
  const server = await serve(5294, { devtools: true, opencode: true });
  const { page, errors } = await open(server);
  const status = page.locator("[data-devtools=ask-status]");
  const input = page.locator("[data-devtools=ask-input]");
  const link = (state) =>
    until(`link ${state}`, async () => (await status.getAttribute("data-link")) === state);

  // nothing picked: the box is there, with its title and how to connect
  await page.locator("[data-devtools=ask]").waitFor();
  assert.equal(await page.locator("[data-devtools=ask-title]").textContent(), "OpenCode");
  await link("disconnected");
  assert.match(await page.locator("[data-devtools=ask-link]").innerText(), /not connected/);
  const how = await status.innerText();
  assert.match(how, /Not connected\. Start OpenCode \(or run `opencode serve --service`\)/);
  assert.match(how, /run \/cssints-devtools in a session to attach it to this server/);
  assert.match(how, /finds OpenCode by itself/);
  assert.match(how, /a prompt opens a new one in \/\S+/);
  assert.match(how, /@opencode\/client must be in the devDependencies/);

  // a service started now is found on focus, with no reload
  fake.register();
  await input.focus();
  await link("connected");
  assert.match(await page.locator("[data-devtools=ask-link]").innerText(), /^\s*connected/);
  assert.match(
    await status.innerText(),
    /^connected to http:\/\/127\.0\.0\.1:\d+ · no session attached: a prompt starts a new one$/,
  );
  assert.equal(
    fake.calls.filter((c) => c.path.includes("session")).length,
    0,
    "no session by the probe",
  );

  // nothing picked is not nothing to ask: the instruction and the page
  await input.fill("make the page darker");
  await input.press("Enter");
  const state = page.locator("[data-devtools=ask-state]");
  await until("completed", async () => (await status.getAttribute("data-status")) === "completed");
  assert.match(await state.innerText(), /completed/);
  const session = page.locator("[data-devtools=ask-session]");
  assert.equal(await session.innerText(), "no session attached: a prompt starts a new one");
  assert.equal(await session.getAttribute("title"), null);
  assert.equal(await input.inputValue(), "", "the box is empty once the session exists");
  const first = fake.calls.find((c) => c.path.endsWith("/prompt")).body.text;
  assert.match(first, /^Change the UI of the running app/);
  assert.match(first, /Instruction: make the page darker\n/);
  assert.match(first, new RegExp(`Page: ${server.resolvedUrls.local[0]}`));
  assert.ok(!first.includes("Element:"), "no element in it");

  // /cssints-devtools attaches a session (a file): the next probe, on focus, shows it, truncated, the full id in the title
  const id = serverId(repo, server.config.root);
  for (const [attached, shown] of [
    ["ses_attached", "attached session ses_attached"],
    ["ses_0123456789abcdefghij", "attached session ses_0123456789…"],
  ]) {
    attach(repo, id, attached);
    await input.blur();
    await input.focus();
    await until(
      `attached ${attached}`,
      async () => (await session.getAttribute("title")) === attached,
    );
    assert.equal(await session.innerText(), shown);
  }
  attach(repo, id);
  await input.blur();
  await input.focus();
  await until("detached", async () => (await session.getAttribute("title")) === null);
  assert.equal(await session.innerText(), "no session attached: a prompt starts a new one");

  // an element picked: as before
  await pick(page);
  await input.fill("make it bigger");
  await input.press("ArrowUp"); // arrows move the caret of the box, not the selection
  assert.match(await page.locator("[data-devtools=element]").innerText(), /^p#p/);
  fake.calls.length = 0;
  await input.press("Enter");
  await until(
    "completed again",
    async () =>
      (await state.innerText()).includes("completed") &&
      fake.calls.some((c) => c.path.endsWith("/prompt")),
  );
  const prompt = fake.calls.find((c) => c.path.endsWith("/prompt")).body.text;
  assert.match(prompt, /^Change the UI of the running app/);
  assert.match(prompt, /Instruction: make it bigger\n/);
  assert.match(prompt, /Element: <p#p>/);
  assert.match(prompt, /- main\.ts:5\n {2}color\("rebeccapurple"\)/);
  assert.match(prompt, /- color: rebeccapurple from \._\w+ \(_\.\w\)/);
  assert.ok(prompt.length < 4000, `${prompt.length} characters`);
  assert.ok(!prompt.includes(server.config.root), "no path of this machine but the repository");
  assert.equal(await input.inputValue(), "");

  // connected, with a session
  for (const dock of ["right", "bottom"]) {
    await page.locator(`[data-devtools=dock][data-dock=${dock}]`).click();
    await until(`dock ${dock}`, async () => (await box(page, "panel"))?.height);
    await pinned(page, DOCKS[dock], `${dock} connected`);
    await shot(page, `${dock}-connected`);
  }

  // the service goes away: a failed send says so and keeps the text
  fake.unregister();
  await input.fill("one more");
  await input.press("Enter");
  await link("disconnected");
  assert.match(await status.innerText(), /^Not connected\. Start OpenCode/);
  assert.equal(await input.inputValue(), "one more", "the text stays, nothing to retype");

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
