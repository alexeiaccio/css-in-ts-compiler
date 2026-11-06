// The thread screen in Chrome (playwright-core from node_modules/.bun; not in `test`: needs Chrome installed). The built app is
// served and the API is stubbed with the recorded threads (test/fixtures/thread-*.json); every image is a flat tile.
//   - the focused post is in view below the sticky header, with its parents above it, bigger, with a full timestamp and counts
//   - the connector lines run through the avatars: a vertical line at the centre of the parent's avatar, an elbow at the
//     height of the child's avatar, down-lines between parents; at three widths (the nested cards cross the 28rem breakpoint
//     of the card at 560)
//   - "Show N more replies" opens in place: the rows come, the button goes, the lines still line up
//   - not found, blocked and hidden posts are drawn as states (in the parent chain, in the replies, as the whole screen)
// SHOTS=<dir> saves a screenshot of each width.
//   node test/thread-browser.mjs
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

const outDir = "node_modules/.sky-thread-browser";
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
    body,
  });
// how many times a page asked for the home feed: a thread opened beside it, or closed, must ask again for nothing
const feeds = { calls: 0 };
async function open(width, stub, path = "/profile/someone.test/post/3focus") {
  const page = await browser.newPage({ viewport: { width, height: 800 } });
  page.on("pageerror", (e) => assert.fail(String(e)));
  await page.route(/cdn\.bsky\.app|video\.bsky\.app/, (r) =>
    r.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#8aa4c8"/></svg>',
    }),
  );
  await page.route(/getFeed/, (r) => {
    feeds.calls++;
    return json(r, fixture("home-discover-1"));
  });
  await page.route(/getPostThread/, (r) => stub(r));
  await page.goto(`${base}${path.replace(/^\//, "")}`);
  return page;
}
const serve = (name) => (r) => json(r, fixture(name));

// what the page measures: every row ([data-row]: a card or a tombstone, its own lines before it, its replies after), the card, the
// avatar, the lines (the aria-hidden spans of the row: [vertical, elbow] for a reply, [down] for a parent)
const measure = (page) =>
  page.evaluate(() => {
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.x,
        y: r.y,
        w: r.width,
        h: r.height,
        midX: r.x + r.width / 2,
        cy: r.y + r.height / 2,
      };
    };
    const cardOf = (row) =>
      row.querySelector(":scope > article")?.firstElementChild ??
      [...row.children].find((c) => c.tagName === "DIV");
    const avatarOf = (row) =>
      row.querySelector(":scope > article")?.firstElementChild.firstElementChild.firstElementChild;
    const info = [...document.querySelectorAll("main [data-row]")].map((row) => {
      const above = row.parentElement.parentElement;
      const isReply = above.matches("[data-row]");
      const avatar = avatarOf(row);
      return {
        text: row.textContent.slice(0, 30),
        focus: row.hasAttribute("data-focus"),
        card: box(cardOf(row)),
        avatar: avatar && box(avatar),
        lines: [...row.children].filter((c) => c.matches("span[aria-hidden]")).map(box),
        parentAvatar: isReply ? box(avatarOf(above)) : undefined,
        parentCard: isReply ? box(cardOf(above)) : undefined,
        siblings: isReply ? row.parentElement.children.length : 0,
        index: isReply ? [...row.parentElement.children].indexOf(row) : -1,
      };
    });
    const buttons = [...document.querySelectorAll("main button")]
      .filter((b) => /^Show \d+ more repl/.test(b.textContent))
      .map((b) => ({
        box: box(b),
        lines: [...b.parentElement.children].filter((c) => c.matches("span[aria-hidden]")).map(box),
        parentAvatar: box(avatarOf(b.parentElement.parentElement.parentElement)),
      }));
    const tombs = [...document.querySelectorAll("main [data-row] > div")]
      .filter((d) => /^(Blocked post|Post deleted or not found|Post hidden)$/.test(d.textContent))
      .map((d) => d.textContent);
    const head = document.querySelector("header").getBoundingClientRect();
    return {
      info,
      buttons,
      tombs,
      headerBottom: head.bottom,
      scrollY,
      vh: innerHeight,
      title: document.title,
    };
  });

const near = (a, b, msg, tol = 1) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

// every line of the tree against the avatars and cards it should meet
function lines(m, where) {
  let verticals = 0;
  let downs = 0;
  m.info.forEach((c, i) => {
    if (c.lines.length === 2) {
      const [v, e] = c.lines;
      near(
        v.midX,
        c.parentAvatar.midX,
        `${where}: the vertical line runs through the parent's avatar (${c.text})`,
      );
      if (c.avatar)
        near(e.cy, c.avatar.cy, `${where}: the elbow is at the child's avatar (${c.text})`);
      else
        assert.ok(
          e.cy > c.card.y && e.cy < c.card.y + c.card.h,
          `${where}: the elbow meets a tombstone`,
        );
      near(e.x + e.w, c.card.x, `${where}: the elbow ends at the child's card (${c.text})`);
      near(e.x, v.x, `${where}: the elbow starts on the line`);
      if (c.index === 0)
        near(v.y, c.parentCard.y + c.parentCard.h, `${where}: the line leaves the parent's card`);
      if (c.index === c.siblings - 1)
        near(v.y + v.h, e.y + e.h, `${where}: the last line ends in its elbow`);
      verticals++;
    } else if (c.lines.length === 1) {
      const [d] = c.lines;
      const next = m.info[i + 1];
      near(d.midX, c.avatar.midX, `${where}: a parent's line is at its avatar`);
      near(d.midX, next.avatar.midX, `${where}: and at the next card's avatar`);
      near(d.y, c.card.y + c.card.h, `${where}: it starts at the card`);
      near(d.y + d.h, next.card.y, `${where}: it ends at the next card`);
      downs++;
    }
  });
  for (const b of m.buttons) {
    const [v, e] = b.lines;
    near(v.midX, b.parentAvatar.midX, `${where}: the button hangs on the parent's avatar line`);
    near(e.cy, b.box.cy, `${where}: its elbow is at the button's middle`);
    near(e.x + e.w, b.box.x, `${where}: the elbow ends at the button`);
  }
  return { verticals, downs };
}

const out = {};
try {
  for (const width of [1000, 560, 390]) {
    const page = await open(width, serve("thread-deep"));
    await page.locator("[data-focus] article").waitFor();
    await page.waitForFunction(() => document.querySelectorAll("main article").length > 3);
    // the page has scrolled to the post: it sits one gap under the header
    await page.waitForFunction(
      () =>
        Math.abs(
          document.querySelector("[data-focus]").getBoundingClientRect().top -
            document.querySelector("header").getBoundingClientRect().bottom -
            8,
        ) < 1,
    );
    const m = await measure(page);
    const focus = m.info.find((c) => c.focus);
    const where = `${width}px`;

    // the focused post is in view, under the header, with the parents above it (the page was scrolled to it)
    assert.ok(m.scrollY > 0, `${where}: the page scrolled to the post`);
    assert.ok(
      focus.card.y >= m.headerBottom - 1,
      `${where}: not under the header: ${focus.card.y} vs ${m.headerBottom}`,
    );
    near(focus.card.y - m.headerBottom, 8, `${where}: the post sits one gap under the header`);
    assert.ok(focus.card.y + 40 < m.vh, `${where}: the focused post starts inside the window`);
    const above = m.info.filter((c) => c.card.y < focus.card.y);
    assert.equal(above.length, 2, `${where}: two parents above`);
    assert.ok(
      above.every((c) => c.card.y + c.card.h <= m.headerBottom + 1 || c.card.y < m.headerBottom),
      `${where}: the parents are scrolled past`,
    );

    // the focused card: bigger text, full timestamp, counts
    const look = await page.evaluate(() => {
      const f = document.querySelector("[data-focus]");
      const other = [...document.querySelectorAll("main article")].find(
        (a) => !a.closest("[data-focus]"),
      );
      return {
        focusSize: parseFloat(getComputedStyle(f.querySelector("p")).fontSize),
        otherSize: parseFloat(getComputedStyle(other.querySelector("p") ?? other).fontSize),
        text: f.textContent,
      };
    });
    assert.ok(
      look.focusSize > look.otherSize,
      `${where}: bigger text ${look.focusSize} vs ${look.otherSize}`,
    );
    assert.match(look.text, /\w+ \d{1,2}, \d{4} at \d{1,2}:\d{2}/, "the full timestamp");
    assert.match(look.text, /\d+ (likes?|replies|reply|reposts?|quotes?)/, "the counts row");
    assert.ok(
      m.title.endsWith(" · sky") && m.title.length > 8 && !m.title.startsWith("Post ·"),
      `title: ${m.title}`,
    );

    // the lines
    const first = lines(m, where);
    assert.ok(first.verticals >= 5, `${where}: the tree has lines: ${first.verticals}`);
    assert.equal(first.downs, 2, `${where}: a line under each parent`);
    assert.ok(m.buttons.length >= 1, `${where}: a deep branch is collapsed`);
    assert.equal(m.tombs.length, 1, `${where}: the recorded hidden reply is a tombstone`);

    if (process.env.SHOTS) {
      await page.screenshot({ path: `${process.env.SHOTS}/thread-${width}.png` });
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: `${process.env.SHOTS}/thread-top-${width}.png` });
      await page.evaluate((y) => scrollTo(0, y), m.scrollY);
    }

    // show more: in place
    const rowsBefore = m.info.length;
    const n = await page.evaluate(() => {
      const b = [...document.querySelectorAll("main button")].find((x) =>
        /^Show \d+ more repl/.test(x.textContent),
      );
      b.click();
      return Number(/\d+/.exec(b.textContent)[0]);
    });
    await page.waitForFunction(
      (want) => document.querySelectorAll("main [data-row]").length === want,
      rowsBefore + n,
    );
    const after = await measure(page);
    assert.equal(after.info.length, rowsBefore + n, `${where}: the ${n} replies came in place`);
    const second = lines(after, `${where} after`);
    assert.ok(second.verticals > first.verticals);
    out[where] = { lines: first.verticals, opened: n, buttonsLeft: after.buttons.length };

    await page.close();
  }

  // ---- 1280: a thread opened from the feed sits beside it, and the feed keeps its place ----------------------------
  {
    feeds.calls = 0;
    const page = await open(1280, serve("thread-deep"), "/");
    await page.waitForFunction(() => document.querySelector("[role=tabpanel] article"));
    await page.evaluate(() => scrollTo(0, 1200));
    await page.waitForFunction(() => scrollY === 1200);

    // the card at the top of the window, and the thread's link in it (a click in the page, so nothing scrolls)
    const card = () =>
      page.evaluate(() => {
        const cards = [...document.querySelectorAll("[role=tabpanel] article")];
        const c = cards.find((el) => el.getBoundingClientRect().top > 60);
        const link = c.querySelector("a[href*='/post/']");
        return {
          text: c.textContent.slice(0, 40),
          y: c.getBoundingClientRect().top,
          href: link.getAttribute("href"),
        };
      });
    const before = await card();
    const asked = feeds.calls;

    const href = await page.evaluate(() => {
      const cards = [...document.querySelectorAll("[role=tabpanel] article")];
      const c = cards.find((el) => el.getBoundingClientRect().top > 60);
      const link = c.querySelector("a[href*='/post/']");
      link.click();
      return link.getAttribute("href");
    });
    await page.locator('[data-pane="detail"] [data-focus] article').waitFor();

    const m = await page.evaluate(() => {
      const rect = (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      };
      const feed = document.querySelector('[data-pane="feed"]');
      const detail = document.querySelector('[data-pane="detail"]');
      const cards = [...feed.querySelectorAll("article")];
      const c = cards.find((el) => el.getBoundingClientRect().top > 60);
      return {
        feed: {
          ...rect(feed),
          scroll: feed.scrollTop,
          cards: cards.length,
          display: getComputedStyle(feed).display,
        },
        detail: {
          ...rect(detail),
          scroll: detail.scrollTop,
          rows: detail.querySelectorAll("[data-row]").length,
        },
        headerBottom: detail.querySelector("header").getBoundingClientRect().bottom,
        focusTop: detail.querySelector("[data-focus]").getBoundingClientRect().top,
        rail: document.querySelector("aside") !== null,
        win: scrollY,
        title: document.title,
        active: document.activeElement?.tagName,
        top: c && { text: c.textContent.slice(0, 40), y: c.getBoundingClientRect().top },
      };
    });
    assert.equal(m.feed.display, "block", "1280: the feed is drawn");
    assert.ok(m.feed.cards > 10, `1280: the feed keeps its cards (${m.feed.cards})`);
    near(m.detail.x, m.feed.x + m.feed.w, "1280: the thread is beside the feed", 2);
    assert.equal(m.feed.h, 800, "1280: the feed is the window's height");
    assert.equal(m.detail.h, 800, "1280: so is the thread's pane");
    assert.equal(m.feed.scroll, 1200, `1280: the feed is where it was left (${m.feed.scroll})`);
    near(m.top.y, before.y, "1280: the same card at the same place");
    assert.equal(m.top.text, before.text, "1280: the same card");
    assert.equal(m.win, 0, "1280: the window does not scroll: the panes do");
    assert.ok(m.detail.rows > 3, `1280: the thread's rows are there (${m.detail.rows})`);
    assert.ok(
      m.focusTop >= m.headerBottom - 1 && Math.abs(m.focusTop - m.headerBottom - 8) < 1,
      `1280: the post is in view in its pane (${m.focusTop} vs ${m.headerBottom})`,
    );
    assert.equal(m.rail, false, "1280: the rail yields to the thread");
    assert.equal(m.active, "H1", "1280: the focus moved into the thread");
    assert.ok(
      m.title.endsWith(" · sky") && !m.title.startsWith("Post ·"),
      `1280: title ${m.title}`,
    );
    assert.equal(feeds.calls, asked, "1280: opening the thread asked for no page again");

    // Escape is the back button: the feed's offset, the rail and the focus on the card that opened the thread
    await page.keyboard.press("Escape");
    await page.waitForURL(base);
    await page.waitForFunction(() => scrollY === 1200);
    const back = await page.evaluate((href) => {
      const aside = document.querySelector("aside");
      return {
        rail: !!aside && getComputedStyle(aside).display !== "none",
        active: document.activeElement?.matches(`main a[href="${href}"]`) ?? false,
        y: scrollY,
        split: document.querySelector("main").hasAttribute("data-split"),
      };
    }, href);
    assert.equal(back.rail, true, "Escape: the rail is back");
    assert.equal(back.split, false, "Escape: the panes are one column again");
    assert.equal(back.y, 1200, "Escape: the feed is where it was left");
    assert.equal(back.active, true, "Escape: the focus is back on the card's link");
    assert.equal(feeds.calls, asked, "Escape: and nothing was asked again");

    // the browser's back button does the same
    await page.evaluate(() => {
      const cards = [...document.querySelectorAll("[role=tabpanel] article")];
      const c = cards.find((el) => el.getBoundingClientRect().top > 60);
      c.querySelector("a[href*='/post/']").click();
    });
    await page.locator('[data-pane="detail"] [data-focus] article').waitFor();
    assert.equal(
      await page.evaluate(() => !!document.querySelector("aside")),
      false,
      "back: no rail",
    );
    await page.goBack();
    await page.waitForFunction(() => scrollY === 1200);
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.querySelector("aside")).display !== "none",
      ),
      true,
      "back: the rail is back",
    );
    assert.equal(feeds.calls, asked, "back: the feed was kept mounted");
    await page.close();
  }

  // ---- the deep link at 1280: the same two panes, the feed loaded beside the post --------------------------------
  {
    feeds.calls = 0;
    const page = await open(1280, serve("thread-deep"));
    await page.locator('[data-pane="detail"] [data-focus] article').waitFor();
    await page.waitForFunction(() => document.querySelector('[data-pane="feed"] article'));
    const m = await page.evaluate(() => ({
      feed: document.querySelectorAll('[data-pane="feed"] article').length,
      rows: document.querySelectorAll('[data-pane="detail"] [data-row]').length,
      rail: document.querySelector("aside") !== null,
      split: document.querySelector("main").hasAttribute("data-split"),
      title: document.title,
      active: document.activeElement?.tagName,
    }));
    assert.ok(m.feed > 10, `deep 1280: the feed beside the post (${m.feed})`);
    assert.ok(m.rows > 3, `deep 1280: the thread's rows (${m.rows})`);
    assert.equal(m.rail, false, "deep 1280: no rail");
    assert.equal(m.split, true, "deep 1280: two panes");
    assert.ok(
      m.title.endsWith(" · sky") && !m.title.startsWith("Post ·"),
      `deep 1280: title ${m.title}`,
    );
    assert.equal(m.active, "H1", "deep 1280: the focus moved into the thread");
    await page.close();
  }

  // states
  {
    // a parent that is gone, above the focused post
    const page = await open(1000, serve("thread-notfound"));
    await page.locator("[data-focus] article").waitFor();
    const m = await measure(page);
    assert.deepEqual(m.tombs, ["Post deleted or not found"]);
    assert.equal(await page.getByText("Post deleted or not found").count(), 1);
    out.parentGone = true;
    await page.close();
  }
  {
    // a blocked parent; the recorded post itself is by an account that opted out of logged-out views, so it is hidden
    const page = await open(1000, serve("thread-blocked"));
    await page.locator("[data-focus]").waitFor();
    assert.equal(await page.getByText("Blocked post").count(), 1);
    assert.equal(await page.getByText("Post hidden").count(), 1);
    assert.equal(await page.title(), "Post hidden · sky");
    await page.close();
  }
  {
    const page = await open(1000, (r) =>
      json(r, JSON.stringify({ error: "NotFound", message: "Post not found: at://x" }), 400),
    );
    await page.getByText("Post deleted or not found").waitFor();
    assert.equal(
      await page.getByRole("button", { name: "Retry" }).count(),
      0,
      "a state, not a failure",
    );
    assert.equal(await page.title(), "Post deleted or not found · sky");
    await page.close();
  }
  {
    const page = await open(1000, (r) =>
      json(r, JSON.stringify({ error: "InternalServerError", message: "boom" }), 500),
    );
    await page.getByRole("button", { name: "Retry" }).waitFor();
    await page.close();
  }
  {
    // the whole post is blocked, and a reply that is blocked
    const raw = JSON.parse(fixture("thread-deep"));
    raw.thread.replies.unshift({
      $type: "app.bsky.feed.defs#blockedPost",
      uri: "at://did:plc:x/app.bsky.feed.post/b",
      blocked: true,
    });
    raw.thread.replies.push({
      $type: "app.bsky.feed.defs#notFoundPost",
      uri: "at://did:plc:x/app.bsky.feed.post/n",
      notFound: true,
    });
    const page = await open(1000, (r) => json(r, JSON.stringify(raw)));
    await page.locator("[data-focus] article").waitFor();
    await page.waitForFunction(() => document.querySelectorAll("main article").length > 3);
    const m = await measure(page);
    assert.deepEqual(m.tombs.toSorted(), [
      "Blocked post",
      "Post deleted or not found",
      "Post hidden",
    ]);
    const order = await page.evaluate(() =>
      [...document.querySelector("[data-focus]").parentElement.children]
        .map((r) => r.textContent)
        .slice(-3),
    );
    assert.deepEqual(
      order,
      ["Blocked post", "Post hidden", "Post deleted or not found"],
      "tombstones at the end",
    );
    lines(m, "tombstones");
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}
console.log(JSON.stringify(out));
console.log("sky thread browser: view, lines, show more and states ok");
process.exit(0);
