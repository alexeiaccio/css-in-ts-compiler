// The profile screen in Chrome (playwright-core from node_modules/.bun; not in `test`: needs Chrome installed). The built app is
// served and the API is stubbed with the recorded responses (test/fixtures/profile-*.json), so nothing reaches the network.
//   - the header's layout switches at the column's container breakpoint (500 px): avatar beside the name or above it
//   - the avatar's radius is radius.avatar: round, then square with the setting, also when the class is toggled live
//   - the tabs ask for their filters (the pin on Posts only), the pinned post is first and labelled, reposts and replies too
//   - the sentinel at the end of the list loads the next page; not found, suspended, deactivated and network errors are states
// SHOTS=<dir> also saves screenshots.   node test/profile-browser.mjs
/* oxlint-disable playwright/no-nth-methods -- the first card, the first tab: the order is what is asserted */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
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
const tabs = {
  posts_no_replies: JSON.parse(fixture("profile-posts")),
  posts_with_replies: JSON.parse(fixture("profile-replies")),
  posts_with_media: JSON.parse(fixture("profile-media")),
};
const head = fixture("profile-head");

const outDir = "node_modules/.sky-browser";
const config = { root, logLevel: "warn", build: { outDir, emptyOutDir: true } };
await build(config);
const server = await preview({ ...config, preview: { port: 0 } });
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch({ channel: "chrome" });

const json = (route, body, status = 200) =>
  route.fulfill({
    status,
    contentType: "application/json",
    headers: { "access-control-allow-origin": "*" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

// A page whose API is the fixtures; `requests` records every call. A second page of any tab is the replies fixture with no cursor.
async function open(path, { viewport = { width: 1000, height: 900 }, settings, errors = [] } = {}) {
  const context = await browser.newContext({ viewport, colorScheme: "light" });
  const page = await context.newPage();
  const requests = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  if (settings)
    await page.addInitScript(
      (s) => localStorage.setItem("sky.settings", s),
      JSON.stringify(settings),
    );
  await page.route(/cdn\.bsky\.app|video\.bsky\.app/, (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200"><rect width="600" height="200" fill="#8aa4c8"/></svg>',
    }),
  );
  await page.route(/public\.api\.bsky\.app\/xrpc\//, (route) => {
    const u = new URL(route.request().url());
    const method = u.pathname.replace("/xrpc/app.bsky.", "");
    const params = Object.fromEntries(u.searchParams);
    requests.push({ method, params });
    if (method === "actor.getProfile") {
      switch (params.actor) {
        case "gone.test":
          return json(route, { error: "InvalidRequest", message: "Profile not found" }, 400);
        case "banned.test":
          return json(
            route,
            { error: "AccountTakedown", message: "Account has been suspended" },
            400,
          );
        case "asleep.test":
          return json(
            route,
            { error: "AccountDeactivated", message: "Account is deactivated" },
            400,
          );
        case "down.test":
          return route.abort("connectionrefused");
        default:
          return json(route, head);
      }
    }
    const feed = params.cursor ? tabs.posts_with_replies : tabs[params.filter];
    return json(route, params.cursor ? { ...feed, cursor: undefined } : feed);
  });
  await page.goto(`${base}${path}`);
  return { page, requests, close: () => context.close() };
}

// The geometry and style the header's layout is read from.
const measure = (page) =>
  page.evaluate(() => {
    const rect = (el) => el.getBoundingClientRect();
    const avatar = document.querySelector("[data-profile-avatar]");
    const row = avatar.parentElement;
    const ident = row.querySelector("h2").parentElement;
    const banner = row.previousElementSibling;
    const cs = getComputedStyle;
    return {
      direction: cs(row).flexDirection,
      avatar: {
        w: rect(avatar).width,
        top: rect(avatar).top,
        bottom: rect(avatar).bottom,
        right: rect(avatar).right,
      },
      banner: { top: rect(banner).top, bottom: rect(banner).bottom, w: rect(banner).width },
      ident: { left: rect(ident).left, top: rect(ident).top },
      radius: cs(avatar).borderTopLeftRadius,
      column: rect(document.querySelector("main")).width,
    };
  });

const out = {};
try {
  const errors = [];
  // ---- the layout follows the column's width -------------------------------------------------
  for (const width of [499, 500, 1000]) {
    const { page, close } = await open("profile/bsky.app", {
      viewport: { width, height: 900 },
      errors,
    });
    await page.locator("h2").first().waitFor();
    out[`layout${width}`] = await measure(page);
    if (process.env.SHOTS)
      await page.screenshot({ path: `${process.env.SHOTS}/profile-${width}.png` });
    await close();
  }
  for (const [width, wide] of [
    [499, false],
    [500, true],
    [1000, true],
  ]) {
    const m = out[`layout${width}`];
    assert.ok(
      Math.abs(m.column - Math.min(width, 600)) <= 2,
      `${width}: the column is ${m.column}`,
    );
    assert.equal(m.direction, wide ? "row" : "column", `${width}: header layout`);
    assert.equal(m.avatar.w, wide ? 96 : 72, `${width}: avatar size`);
    assert.ok(
      m.avatar.top < m.banner.bottom && m.avatar.bottom > m.banner.bottom,
      `${width}: the avatar overlaps the banner`,
    );
    if (wide)
      assert.ok(
        m.ident.left >= m.avatar.right && m.ident.top < m.avatar.bottom,
        "name beside the avatar",
      );
    else assert.ok(m.ident.top >= m.avatar.bottom, "name under the avatar");
  }

  // ---- the avatar's radius is radius.avatar ---------------------------------------------------
  {
    const round = await open("profile/bsky.app", { errors });
    await round.page.locator("[data-profile-avatar]").waitFor();
    out.round = (await measure(round.page)).radius;
    // the flag is a class on <html>: toggled live, the avatar follows
    await round.page.evaluate(() => document.documentElement.classList.add("square-avatars"));
    out.squareLive = (await measure(round.page)).radius;
    await round.close();
    const square = await open("profile/bsky.app", { settings: { squareAvatars: true }, errors });
    await square.page.locator("[data-profile-avatar]").waitFor();
    out.square = (await measure(square.page)).radius;
    await square.close();
    assert.equal(out.round, "999px");
    assert.equal(out.squareLive, "8px");
    assert.equal(out.square, "8px", "the stored setting reaches the profile avatar");
  }

  // ---- tabs, the pin, the title, paging ---------------------------------------------------------
  {
    const { page, requests, close } = await open("profile/bsky.app", { errors });
    const cards = page.locator("article");
    await cards.first().waitFor();
    const feedCalls = () => requests.filter((r) => r.method === "feed.getAuthorFeed");
    out.title = await page.title();
    assert.equal(out.title, "Bluesky (@bsky.app) · sky");
    assert.match(await page.locator("header:has([data-profile-avatar]) h2").innerText(), /Bluesky/);
    const counts = await page.locator("header:has([data-profile-avatar])").innerText();
    assert.match(counts, /35M\s+followers/);
    assert.match(counts, /\b15\s+following/);
    assert.match(counts, /865\s+posts/);
    assert.match(counts, /support@bsky\.app/, "the e-mail address stays plain text");
    assert.equal(
      await page.locator("header:has([data-profile-avatar]) a[href^='/profile/']").count(),
      0,
      "no mention in this bio",
    );

    assert.deepEqual(
      [feedCalls()[0].params.filter, feedCalls()[0].params.includePins],
      ["posts_no_replies", "true"],
    );
    const first = page.locator("article").first().locator("xpath=..");
    assert.match(await first.innerText(), /^Pinned/, "the pinned post is first, with its label");
    assert.ok((await cards.count()) >= 9);
    out.reposts = await page.getByText(/^Reposted by /).count();
    assert.ok(out.reposts >= 1, "a repost says so");
    assert.equal(await page.getByRole("tab", { selected: true }).innerText(), "Posts");

    const underline = (name) =>
      page.getByRole("tab", { name }).evaluate((el) => getComputedStyle(el).borderBottomColor);
    assert.notEqual(await underline("Posts"), "rgba(0, 0, 0, 0)", "the selected tab is underlined");
    assert.equal(await underline("Media"), "rgba(0, 0, 0, 0)");

    await page.getByRole("tab", { name: "Replies" }).click();
    await page
      .getByText(/^Replying to @/)
      .first()
      .waitFor();
    assert.equal(feedCalls().at(-1).params.filter, "posts_with_replies");
    assert.equal(feedCalls().at(-1).params.includePins, "false", "no pin on Replies");
    assert.equal(await page.getByText("Pinned", { exact: true }).count(), 0);
    assert.equal(await page.getByRole("tab", { selected: true }).innerText(), "Replies");

    await page.getByRole("tab", { name: "Media" }).click();
    await page.waitForFunction(() => document.title.includes("Bluesky"));
    await page.waitForFunction(
      (n) => document.querySelectorAll("article").length === n,
      tabs.posts_with_media.feed.length,
    );
    assert.equal(feedCalls().at(-1).params.filter, "posts_with_media");
    assert.equal(
      (await page.getByText(/^Replying to @/).count()) > 0,
      tabs.posts_with_media.feed.some((i) => i.reply),
    );

    // the sentinel: the Media tab has a cursor; the box is under the cards, scrolling brings the next page
    const before = await cards.count();
    const calls = feedCalls().length;
    await page.locator("[data-after]").scrollIntoViewIfNeeded();
    await page.waitForFunction((n) => document.querySelectorAll("article").length > n, before);
    assert.equal(feedCalls().length, calls + 1, "one request for the next page");
    assert.equal(feedCalls().at(-1).params.cursor, tabs.posts_with_media.cursor);
    assert.equal(
      await page.locator("[data-after]").count(),
      0,
      "the last page has no cursor: no sentinel",
    );
    out.pages = [before, await cards.count()];
    await close();
  }

  // ---- states --------------------------------------------------------------------------------
  const states = {
    "gone.test": ["notFound", "Profile not found", "There is no account named @gone.test."],
    "banned.test": ["suspended", "Account suspended", "@banned.test has been suspended."],
    "asleep.test": [
      "deactivated",
      "Account deactivated",
      "@asleep.test has deactivated their account.",
    ],
  };
  for (const [handle, [kind, title, text]] of Object.entries(states)) {
    const { page, close } = await open(`profile/${handle}`, { errors });
    const state = page.locator(`[data-state=${kind}]`);
    await state.waitFor();
    assert.equal(await state.locator("h2").innerText(), title);
    assert.equal(await state.locator("p").innerText(), text);
    assert.equal(
      await state.locator("button").count(),
      0,
      "no retry: asking again gives the same answer",
    );
    assert.equal(await page.title(), `${title} · sky`);
    assert.equal(await page.locator("article").count(), 0);
    await close();
  }
  {
    // a network error is retryable: the retry reaches the profile once the network is back
    const { page, requests, close } = await open("profile/down.test", { errors: [] });
    const state = page.locator("[data-state=failed]");
    await state.waitFor({ timeout: 15000 });
    assert.equal(await state.locator("h2").innerText(), "Could not load the profile");
    assert.ok(requests.filter((r) => r.method === "actor.getProfile").length >= 3, "retried first");
    await page.unroute(/public\.api\.bsky\.app\/xrpc\//);
    await page.route(/public\.api\.bsky\.app\/xrpc\//, (route) => {
      const u = new URL(route.request().url());
      return u.pathname.endsWith("getProfile")
        ? json(route, head)
        : json(route, tabs.posts_no_replies);
    });
    await state.getByRole("button", { name: "Try again" }).click();
    await page.locator("article").first().waitFor();
    assert.equal(await page.locator("[data-state]").count(), 0);
    await close();
  }
  assert.deepEqual(
    errors.filter((e) => !/ERR_|Failed to load resource|status of 400/.test(e)),
    [],
    "no console errors",
  );
} finally {
  await browser.close();
  await server.close();
}
console.log(JSON.stringify(out, null, 1));
process.exit(0);
