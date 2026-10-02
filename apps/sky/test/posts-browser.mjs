// The dev page in Chrome (not in `test`: needs Chrome installed, like packages/cssints `test:browsers`): every embed kind from
// the recorded posts at card widths 360 and 600, the computed radii of card -> quote -> image (concentric), the surface steps
// (feed -> card -> quote) as OKLCH lightness, and the layout the card's own width picks.
// SHOTS=<dir> also saves a screenshot of each width.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { createServer } from "vite";

const root = join(import.meta.dirname, "..");
const modules = join(root, "../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const { chromium } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);

const server = await createServer({ root, logLevel: "warn", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch({ channel: "chrome" });
const out = {};
const runs = [
  [360, "light"],
  [600, "light"],
  [600, "dark"],
];
try {
  for (const [w, scheme] of runs) {
    const key = `${w}-${scheme}`;
    const page = await browser.newPage({
      viewport: { width: 1000, height: 900 },
      colorScheme: scheme,
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    // offline and deterministic: every image of the CDN is a flat tile (the layout is what is measured, not the pictures)
    await page.route(/cdn\.bsky\.app|video\.bsky\.app/, (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#8aa4c8"/></svg>',
      }),
    );
    await page.goto(`${base}dev/posts?w=${w}`);
    await page.locator("[data-sample=quoteImages] article").waitFor();
    await page.waitForFunction(() => document.querySelectorAll("[data-sample]").length === 18);
    const r = await page.evaluate(() => {
      // a surface's computed colour is oklch(L C h): the lightness is the first number
      const L = (c) => +c.match(/oklch\(([\d.]+)/)[1];
      const bg = (el) => getComputedStyle(el).backgroundColor;
      const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
      const sample = (name) => document.querySelector(`[data-sample=${name}]`);
      const card = (name) => sample(name).querySelector("article").firstElementChild;
      const q = card("quoteImages");
      const quote = [...q.querySelectorAll("._f")].find(
        (e) => cs(e, "border-top-width") === "1px" && e.querySelector("a"),
      );
      const inner = quote.querySelector("._f"); // the media frame inside the quote
      const feed = sample("quoteImages").parentElement;
      const mediaBox = (name) =>
        sample(name).querySelector("article a[target=_blank] > img").closest("a").parentElement;
      return {
        width: Math.round(q.getBoundingClientRect().width),
        radius: {
          card: cs(q, "border-radius"),
          cardMedia: cs(mediaBox("images2"), "border-radius"),
          quote: cs(quote, "border-radius"),
          quoteMedia: cs(inner, "border-radius"),
        },
        padding: { card: cs(q, "padding-top"), quote: cs(quote, "padding-top") },
        lightness: {
          feed: L(bg(feed)),
          card: L(bg(q)),
          quote: L(bg(quote)),
          external: L(bg(sample("external").querySelector("article a[href^=http]"))),
        },
        layout: {
          avatarRow: cs(q.firstElementChild, "grid-row"),
          bodyColumn: cs(q.children[2], "grid-column"),
          images3Columns: cs(mediaBox("images3"), "grid-template-columns").split(" ").length,
          images4Columns: cs(mediaBox("images4"), "grid-template-columns").split(" ").length,
          galleryColumns: cs(mediaBox("gallery"), "grid-template-columns").split(" ").length,
        },
        samples: [...document.querySelectorAll("[data-sample]")].map((e) => e.dataset.sample),
        blurFilter: cs(sample("blurred").querySelector("[inert]"), "filter"),
        hidden: sample("hidden").textContent,
        notFound: sample("quoteNotFound").textContent.includes("Post not found"),
        detached: sample("quoteDetached").textContent.includes("removed this post"),
        blocked: sample("quoteBlocked").textContent.includes("Blocked post"),
        playMarks: ["video", "gif", "quoteVideo"].map(
          (n) => !!sample(n).querySelector("a[href^='https://bsky.app'] span span"),
        ),
        links: [...sample("external").querySelectorAll("a[href^=http]")].map((a) => a.href),
      };
    });
    if (process.env.SHOTS)
      for (const name of [
        "images3",
        "gallery",
        "external",
        "video",
        "quoteImages",
        "quoteExternal",
        "blurred",
      ])
        await page
          .locator(`[data-sample=${name}]`)
          .screenshot({ path: `${process.env.SHOTS}/${name}-${key}.png` });
    out[key] = { ...r, errors };
    await page.close();
  }
  // the home screen: the recorded Discover page through the real data layer (moderation drops the opted-out accounts)
  const home = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  await home.route(/cdn\.bsky\.app|video\.bsky\.app/, (r) => r.abort());
  await home.route(/public\.api\.bsky\.app\/xrpc\/app\.bsky\.feed\.getFeed/, (r) =>
    r.fulfill({
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: readFileSync(join(root, "test/fixtures/discover.json"), "utf8"),
    }),
  );
  await home.goto(base);
  await home.waitForFunction(() => document.querySelector("article"));
  out.home = await home.locator("article").count();
  out.homeHidden = await home.getByText("Post hidden").count();
} finally {
  await browser.close();
  await server.close();
}
console.log(JSON.stringify(out, null, 1));
assert.ok(out.home >= 20 && out.home <= 30, `Discover shows its posts: ${out.home}`);
assert.equal(out.homeHidden, 0, "a hidden post is dropped from a feed, not drawn");
const px = (v) => parseFloat(v);
for (const [w, scheme] of runs) {
  const key = `${w}-${scheme}`;
  const r = out[key];
  assert.deepEqual(
    r.errors.filter((e) => !/ERR_|Failed to load resource/.test(e)),
    [],
    `console errors at ${key}`,
  );
  assert.equal(r.width, w, "the card is as wide as asked");
  assert.equal(r.samples.length, 18);
  assert.equal(r.hidden.trim(), "Post hidden");
  assert.ok(r.notFound && r.detached && r.blocked);
  assert.deepEqual(r.playMarks, [true, false, true], "a play mark on video, none on a gif");
  assert.match(r.blurFilter, /blur/);

  // frame(): card -> quote -> media are concentric, from one radius written once (the card's 20px)
  const { card, quote, quoteMedia, cardMedia } = Object.fromEntries(
    Object.entries(r.radius).map(([k, v]) => [k, px(v)]),
  );
  const pad = (k) => px(r.padding[k]);
  assert.equal(card, 20);
  assert.equal(quote, card - pad("card") - 1, "the quote: the card's inner radius");
  assert.equal(cardMedia, quote, "media in the card: the same inner radius");
  assert.equal(
    quoteMedia,
    Math.max(0, quote - pad("quote") - 1),
    "media in the quote: the quote's inner radius",
  );

  // surface(): the card is one step above the feed, the quote one step from the card (away from it)
  const { feed, card: c, quote: q, external } = r.lightness;
  assert.ok(Math.abs(c - feed - 0.04) < 0.005, `card above feed: ${feed} -> ${c}`);
  assert.ok(Math.abs(Math.abs(q - c) - 0.03) < 0.005, `quote a step from the card: ${c} -> ${q}`);
  assert.equal(external, q, "the link card is a step from the card as well");
  assert.equal(q > c, scheme === "dark", "contrast() darkens a light card and lightens a dark one");

  // container(): the same posts, laid out by the card's own width
  const wide = w >= 448;
  assert.equal(r.layout.avatarRow, wide ? "1 / span 2" : "1", "avatar beside the text or above it");
  assert.equal(r.layout.bodyColumn, wide ? "2" : "1 / -1");
  assert.deepEqual(
    [r.layout.images3Columns, r.layout.images4Columns, r.layout.galleryColumns],
    wide ? [3, 2, 4] : [2, 2, 2],
  );
}
process.exit(0);
