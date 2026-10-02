// The home screen in Chrome (playwright-core from node_modules/.bun; Chrome is the installed channel; not in `test`): the built app
// is served and the API is stubbed with the recorded feeds (test/fixtures/home-*.json), so nothing reaches the network.
//   - the first page shows animated skeletons (a keyframes() shimmer: the background really moves), and then the posts
//   - the next page loads when the end of the list nears the viewport, not before; a 414 ends the feed with a note
//   - the tab bar sticks under the header, the indicator slides to the tab opened (a transition, caught mid-way)
//   - switching tabs keeps each tab's posts and scroll position, and asks for nothing again
//   - under prefers-reduced-motion the shimmer stands still and the indicator jumps
//   node test/home-browser.mjs     (SHOTS=<dir> also saves a screenshot of the skeletons and of the feed)
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";

import { build, preview } from "vite";

const root = join(import.meta.dirname, "..");
process.chdir(root);
const modules = join(root, "../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const { chromium } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);
const fixture = (name) => readFileSync(join(root, `test/fixtures/${name}.json`), "utf8");
const discover1 = JSON.parse(fixture("home-discover-1"));

const outDir = "node_modules/.sky-home-browser";
const config = { root, logLevel: "warn", build: { outDir, emptyOutDir: true } };
await build(config);
const server = await preview({ ...config, preview: { port: 0 } });
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch({ channel: "chrome" });

// a page of the app with the API stubbed; `held` holds every answer back until it resolves (to look at the skeletons)
async function open(context, held = Promise.resolve()) {
  const page = await context.newPage();
  const requests = []; // [feed, cursor] in the order the app asked
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !/status of 414/.test(m.text()) && errors.push(m.text()));
  await page.route(/cdn\.bsky\.app|video\.bsky\.app/, (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#8aa4c8"/></svg>',
    }),
  );
  await page.route("https://public.api.bsky.app/**", async (route) => {
    const u = new URL(route.request().url());
    const feed = u.searchParams.get("feed")?.split("/").pop();
    const cursor = u.searchParams.get("cursor");
    requests.push([feed, cursor]);
    await held;
    const headers = { "access-control-allow-origin": "*" };
    const json = (name) => route.fulfill({ contentType: "application/json", headers, body: fixture(name) });
    if (feed === "whats-hot" && !cursor) return json("home-discover-1");
    if (feed === "whats-hot" && cursor === discover1.cursor) return json("home-discover-2");
    if (feed === "for-science" && !cursor) return json("home-science-1");
    // any other page: the cursor outgrew the URL
    return route.fulfill({ status: 414, headers, contentType: "text/plain", body: "URI Too Long" });
  });
  return { page, requests, errors };
}

const asked = (requests, feed) => requests.filter(([f]) => f === feed).length;
const toBottom = (page) =>
  page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
const panel = (page, name) => page.locator(`[role=tabpanel][aria-label=${name}]`);
const count = (page, name) => panel(page, name).locator("article").count();
const sample = (page, testid) =>
  page.getByTestId(testid).first().evaluate((el) => {
    const bar = el.querySelectorAll("span")[1]; // a text line of the skeleton card
    const s = getComputedStyle(bar);
    return { name: s.animationName, pos: s.backgroundPositionX };
  });

try {
  // ---- normal motion ---------------------------------------------------------------------------
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      colorScheme: "light",
    });
    let release;
    const { page, requests, errors } = await open(context, new Promise((r) => (release = r)));
    await page.goto(base);

    await page.getByTestId("skeleton").first().waitFor();
    assert.equal(await page.getByTestId("skeleton").count(), 3, "three skeletons for the first page");
    const shot = (name) => process.env.SHOTS && page.screenshot({ path: join(process.env.SHOTS, `${name}.png`) });
    await shot("home-skeleton");
    const a = await sample(page, "skeleton");
    assert.match(a.name, /^kf-/, "the shimmer is the keyframes() rule");
    await sleep(300);
    const b = await sample(page, "skeleton");
    assert.notEqual(a.pos, b.pos, "the band moves");

    release();
    await panel(page, "Discover").locator("article").first().waitFor();
    assert.equal(await page.getByTestId("skeleton").count(), 0, "the skeletons are gone");
    await shot("home-feed");
    const first = await count(page, "Discover");
    assert.ok(first >= 15, `the first page is posts (${first})`);
    await sleep(400);
    assert.equal(asked(requests, "whats-hot"), 1, "the next page waits until the list's end is near");

    // the tab bar: sticky under the 52 px header, indicator under the first tab
    const geometry = () =>
      page.evaluate(() => {
        const tabs = [...document.querySelectorAll("[role=tab]")].map((t) => t.getBoundingClientRect());
        const bar = document.querySelector("[role=tablist]").getBoundingClientRect();
        const ind = document.querySelector("[data-testid=indicator]").getBoundingClientRect();
        return { tabs, bar, ind, y: scrollY };
      });
    let g = await geometry();
    assert.equal(g.tabs.length, 3);
    assert.ok(Math.abs(g.ind.left - g.tabs[0].left) < 1 && Math.abs(g.ind.width - g.tabs[0].width) < 1);
    assert.equal(
      await page.getByTestId("indicator").evaluate((e) => getComputedStyle(e).transitionDuration),
      "0.25s",
    );

    // scrolling to the end loads the second page
    await toBottom(page);
    await page.waitForFunction(
      (n) => document.querySelectorAll("[aria-label=Discover] article").length > n,
      first,
    );
    assert.deepEqual(requests.filter(([f]) => f === "whats-hot")[1], ["whats-hot", discover1.cursor]);
    assert.equal(asked(requests, "whats-hot"), 2);
    const second = await count(page, "Discover");
    assert.ok(second > first);

    await page.evaluate(() => scrollTo(0, 2500));
    await sleep(100);
    g = await geometry();
    const discoverY = g.y;
    assert.equal(discoverY, 2500);
    assert.equal(g.bar.top, 52, "the tab bar sticks under the header");

    // Science: its own first page, the scroll starts over, the indicator slides (caught half way)
    await page.getByRole("tab", { name: "Science" }).click();
    await sleep(100);
    g = await geometry();
    assert.ok(g.ind.left > g.tabs[0].left + 1 && g.ind.left < g.tabs[1].left - 1, "the indicator is on its way");
    await sleep(350);
    g = await geometry();
    assert.ok(Math.abs(g.ind.left - g.tabs[1].left) < 1, "and arrives under the second tab");
    assert.equal(await panel(page, "Discover").isVisible(), false);
    await panel(page, "Science").locator("article").first().waitFor();
    assert.equal(g.y, 0, "a tab opened for the first time starts at the top");
    await page.evaluate(() => scrollTo(0, 1500));
    await sleep(100);
    const scienceY = (await geometry()).y;
    assert.equal(scienceY, 1500);
    const sciencePosts = await count(page, "Science");

    // back to Discover: same posts, same place, nothing asked again
    await page.getByRole("tab", { name: "Discover" }).click();
    await sleep(100);
    g = await geometry();
    assert.equal(g.y, discoverY, "Discover is where it was left");
    assert.equal(await count(page, "Discover"), second, "with its two pages");
    assert.equal(asked(requests, "whats-hot"), 2);
    await page.getByRole("tab", { name: "Science" }).click();
    await sleep(100);
    g = await geometry();
    assert.equal(g.y, scienceY, "and Science too");
    assert.equal(await count(page, "Science"), sciencePosts);
    assert.equal(asked(requests, "for-science"), 1);

    // the end: Science's next page is a 414, which is the end of the feed, with a note
    await toBottom(page);
    await panel(page, "Science").getByTestId("end").waitFor();
    assert.match(await panel(page, "Science").getByTestId("end").innerText(), /That's all/);
    assert.equal(asked(requests, "for-science"), 2);
    assert.equal(await count(page, "Science"), sciencePosts, "the posts stay");
    await sleep(500);
    assert.equal(asked(requests, "for-science"), 2, "and nothing more is asked");

    assert.deepEqual(errors, []);
    await context.close();
  }

  // ---- prefers-reduced-motion ------------------------------------------------------------------
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      colorScheme: "light",
      reducedMotion: "reduce",
    });
    let release;
    const { page, errors } = await open(context, new Promise((r) => (release = r)));
    await page.goto(base);
    await page.getByTestId("skeleton").first().waitFor();
    const a = await sample(page, "skeleton");
    await sleep(300);
    const b = await sample(page, "skeleton");
    assert.equal(a.name, "none", "no shimmer");
    assert.deepEqual(a, b, "the bars stand still");
    release();
    await panel(page, "Discover").locator("article").first().waitFor();
    assert.equal(
      await page.getByTestId("indicator").evaluate((e) => getComputedStyle(e).transitionDuration),
      "0s",
    );
    await page.getByRole("tab", { name: "Science" }).click();
    await sleep(60);
    const [ind, tab] = await page.evaluate(() => [
      document.querySelector("[data-testid=indicator]").getBoundingClientRect().left,
      document.querySelectorAll("[role=tab]")[1].getBoundingClientRect().left,
    ]);
    assert.ok(Math.abs(ind - tab) < 1, "the indicator is there at once");
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log("sky home in Chrome: skeletons, paging, tabs, scroll, 414 note and reduced motion ok");
} finally {
  await browser.close();
  await server.close();
}
process.exit(0);
