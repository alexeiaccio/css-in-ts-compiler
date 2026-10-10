// The /tui page in Chrome on the dev server (playwright-core from node_modules/.bun; skipped when Chrome is not installed):
// ghostty-web draws sky's feed from the recorded fixtures, read back as cells from its buffer; j moves the focus (the
// border of the selected card turns to the accent); tab and enter/esc; the mouse over a card (its hover background);
// a change of the display settings (palette, mode) recolours the cells through the system theme. A page error, a
// console error or a failed request fails the run. Run: node test/tui.mjs
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";

import { createServer } from "vite";

const root = join(import.meta.dirname, "..");
const modules = join(root, "../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const { chromium } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);
const browser = await chromium.launch({ channel: "chrome" }).catch((e) => {
  console.log(`docs tui: skipped, Chrome did not start (${String(e).split("\n")[0]})`);
  process.exit(0);
});
process.env.DOCS_HOVERS = "0";
const server = await createServer({ root, logLevel: "error", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls.local[0];
const problems = [];

// the screen as text, and a cell's colours as #rrggbb (ghostty-web's buffer: RGB packed in a number)
const screen = (page) =>
  page.evaluate(() => {
    const term = document.querySelector("[data-terminal]").terminal;
    const buf = term.buffer.active;
    return Array.from({ length: term.rows }, (_, y) => buf.getLine(y).translateToString(true));
  });
const cell = (page, x, y) =>
  page.evaluate(
    ([x, y]) => {
      const c = document
        .querySelector("[data-terminal]")
        .terminal.buffer.active.getLine(y)
        .getCell(x);
      const hex = (n) => `#${n.toString(16).padStart(6, "0")}`;
      return { ch: c.getChars(), fg: hex(c.getFgColor()), bg: hex(c.getBgColor()) };
    },
    [x, y],
  );
// the row and column of the first cell that holds `ch` at or below row `from`
const find = async (page, ch, from = 0) => {
  const lines = await screen(page);
  for (let y = from; y < lines.length; y++) {
    const x = lines[y].indexOf(ch);
    if (x >= 0) return { x, y };
  }
  return undefined;
};
const until = async (page, test, what) => {
  for (let i = 0; i < 100; i++) {
    assert.deepEqual(problems, [], what);
    if (await test()) return;
    await sleep(100);
  }
  assert.fail(`${what}:\n${(await screen(page)).join("\n")}`);
};

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  context.setDefaultTimeout(180_000);
  const page = await context.newPage();
  page.on("pageerror", (e) => problems.push(String(e)));
  page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
  page.on("response", (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
  page.on("request", (r) => {
    if (r.url().includes("bsky")) problems.push(`a request to the network: ${r.url()}`);
  });
  await page.goto(`${base}tui`);
  await page.locator("[data-terminal] canvas").waitFor({ timeout: 60_000 });
  assert.equal(await page.title(), "TUI · cssints");

  // the feed: the tabs and a post of the recorded Discover page
  const discover = JSON.parse(
    readFileSync(join(root, "../sky/test/fixtures/home-discover-1.json"), "utf8"),
  );
  const first = discover.feed[0].post.author;
  const name = (first.displayName || first.handle).slice(0, 12);
  await until(
    page,
    async () => (await screen(page)).some((l) => l.includes(name)),
    `the first post (${name})`,
  );
  const lines = await screen(page);
  assert.match(lines[0], /sky\s+1 Discover\s+2 Science\s+3 News/, lines[0]);

  // the selected card's border is the accent, the next one's is the border colour; j swaps them
  const corner = async (n) => {
    let at = { x: 0, y: 0 };
    for (let i = 0; i <= n; i++) at = await find(page, "╭", at.y + (i ? 1 : 0));
    return cell(page, at.x, at.y);
  };
  const [a0, b0] = [await corner(0), await corner(1)];
  assert.notEqual(a0.fg, b0.fg, "the focused card has a border of its own colour");
  await page.locator("[data-terminal]").click({ position: { x: 5, y: 5 } }); // focus, on the bar
  await page.keyboard.press("j");
  await until(page, async () => (await corner(1)).fg === a0.fg, "j: the second card is focused");
  assert.equal((await corner(0)).fg, b0.fg, "the first is not");
  await page.keyboard.press("k");
  await until(page, async () => (await corner(0)).fg === a0.fg, "k: back");

  // tab: the Science feed
  const science = JSON.parse(
    readFileSync(join(root, "../sky/test/fixtures/home-science-1.json"), "utf8"),
  ).feed[0].post.author;
  await page.keyboard.press("Tab");
  const sname = (science.displayName || science.handle).slice(0, 12);
  await until(page, async () => (await screen(page)).some((l) => l.includes(sname)), "tab");
  await page.keyboard.press("Shift+Tab");
  await until(page, async () => (await screen(page)).some((l) => l.includes(name)), "shift-tab");

  // enter: the post on its own (the thread screen), esc: back
  await page.keyboard.press("Enter");
  await until(page, async () => (await screen(page))[0].includes("Thread"), "enter: the thread");
  await page.keyboard.press("Escape");
  await until(page, async () => (await screen(page))[0].includes("Discover"), "esc: the feed");

  // the mouse: over the second card, its background is the hover one, and the pointer is a hand
  const box = await page.locator("[data-terminal] canvas").boundingBox();
  const metrics = await page.evaluate(() =>
    document.querySelector("[data-terminal]").terminal.renderer.getMetrics(),
  );
  const second = await find(page, "╭", (await find(page, "╰")).y + 1);
  const inside = { x: second.x + 3, y: second.y + 1 };
  const before = await cell(page, inside.x, inside.y);
  await page.mouse.move(
    box.x + (inside.x + 0.5) * metrics.width,
    box.y + (inside.y + 0.5) * metrics.height,
  );
  await until(
    page,
    async () => (await cell(page, inside.x, inside.y)).bg !== before.bg,
    "hover: the card's background",
  );
  assert.equal(
    await page.locator("[data-terminal] canvas").evaluate((c) => c.style.cursor),
    "pointer",
  );
  await page.mouse.move(box.x + box.width + 50, box.y - 50);
  await until(
    page,
    async () => (await cell(page, inside.x, inside.y)).bg === before.bg,
    "the mouse leaves",
  );

  // the display settings, through the panel: the dark mode, another palette, then the light mode, each recolours the
  // screen through the system theme (the replies to its queries come from the site's colours)
  const bg = async () => (await cell(page, 0, 3)).bg;
  const setting = async (name, value) => {
    await page.click("button[aria-label='Display settings']");
    await page.check(`#settings input[name=${name}][value=${value}]`);
    await page.keyboard.press("Escape");
  };
  const light0 = await bg();
  await setting("mode", "dark");
  await until(page, async () => (await bg()) !== light0, "dark mode recolours the screen");
  const dark = await bg();
  await setting("palette", "flexoki");
  await until(page, async () => (await bg()) !== dark, "the palette recolours the screen");
  const flexoki = await bg();
  await setting("mode", "light");
  await until(page, async () => (await bg()) !== flexoki, "light mode recolours the screen");
  const light = await bg();
  const lum = (hex) => [1, 3, 5].reduce((s, i) => s + Number.parseInt(hex.slice(i, i + 2), 16), 0);
  assert.ok(lum(light) > lum(flexoki), `light ${light} is lighter than dark ${flexoki}`);
  // the terminal's background is the site's: the app's surface is placed on it
  const site = await page.evaluate(
    () => getComputedStyle(document.documentElement).backgroundColor,
  );
  console.log(`docs tui: site ${site}, screen ${light}`);

  assert.deepEqual(problems, []);
  console.log("docs tui ok");
} finally {
  await browser.close();
  await server.close();
}
