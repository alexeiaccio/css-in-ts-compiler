// The dev server in Chrome (playwright-core from node_modules/.bun; not in `test`: needs Chrome installed). Solid's dev build
// reports misuse as a console message or a thrown error that the production build used in the builds of the other browser
// tests drops (SETTLED_CLEANUP_UNOWNED: a cleanup returned by onSettled under no owner). Every route is opened with the API stubbed
// with the recorded fixtures; a page error, a console error or a SETTLED_CLEANUP_UNOWNED message fails the run.
//   node test/dev-browser.mjs
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
const fixture = (name) => readFileSync(join(root, `test/fixtures/${name}.json`), "utf8");

const server = await createServer({ root, logLevel: "error", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch({ channel: "chrome" });

try {
  const page = await (await browser.newContext()).newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push(String(e)));
  page.on(
    "console",
    (m) =>
      (m.type() === "error" || /SETTLED_CLEANUP_UNOWNED/.test(m.text())) && problems.push(m.text()),
  );
  await page.route(/cdn\.bsky\.app|video\.bsky\.app/, (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: "<svg xmlns='http://www.w3.org/2000/svg'/>",
    }),
  );
  await page.route("https://public.api.bsky.app/**", (route) => {
    const { pathname } = new URL(route.request().url());
    const name = pathname.endsWith("getAuthorFeed")
      ? "profile-posts"
      : pathname.endsWith("getProfile")
        ? "profile-head"
        : pathname.endsWith("getFeed")
          ? "home-discover-1"
          : "thread";
    return route.fulfill({
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: fixture(name),
    });
  });
  // the list screens end in a sentinel once a page with a cursor has landed
  for (const [path, sentinel] of [
    ["", "[role=tabpanel] article"],
    ["profile/x.test", "[data-after]"],
    ["profile/x.test/post/abc", "[data-row]"],
    ["settings", "main, body"],
    ["dev/posts", "article"],
  ]) {
    await page.goto(base + path);
    await page.waitForFunction((s) => document.querySelector(s), sentinel);
    await sleep(500); // the effects run after the page is on screen
  }
  assert.deepEqual(problems, []);
} finally {
  await browser.close();
  await server.close();
}
console.log("dev-browser: no page error, console error or SETTLED_CLEANUP_UNOWNED on any route ok");
process.exit(0);
