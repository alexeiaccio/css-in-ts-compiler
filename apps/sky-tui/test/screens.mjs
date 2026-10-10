// The built app (dist/main.js) on OpenTUI's test renderer, against apps/sky's recorded fixtures: the feed, j/k, enter into a
// thread and esc back, tab to the next feed, a mouse over a row and a click. fetch is replaced before the bundle loads (atcute
// takes it then), so nothing reaches the network. Runs under Bun (OpenTUI's core needs it): `bun test/screens.mjs`.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const fixture = (name) =>
  JSON.parse(readFileSync(`${import.meta.dirname}/../../sky/test/fixtures/${name}.json`, "utf8"));
const discover = fixture("home-discover-1");
const science = fixture("home-science-1");
const thread = fixture("thread");

const requests = [];
globalThis.fetch = (url) => {
  const u = new URL(url);
  const method = u.pathname.replace("/xrpc/", "");
  const params = Object.fromEntries(u.searchParams);
  requests.push({ method, params });
  const body =
    method === "app.bsky.feed.getPostThread"
      ? thread
      : params.cursor
        ? { feed: [] } // one page per feed: the end
        : params.feed.endsWith("/whats-hot")
          ? discover
          : params.feed.endsWith("/for-science")
            ? science
            : { feed: [] };
  return Promise.resolve(
    new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } }),
  );
};

const { App, testRender, options } = await import("../dist/main.js");
const api = await import("../../sky/src/api.ts");

const W = 100;
const H = 40;
const setup = await testRender(App, { ...options, width: W, height: H });
const { renderer, mockInput, mockMouse, renderOnce, captureCharFrame, captureSpans } = setup;
const settle = async () => {
  for (let i = 0; i < 4; i++) {
    await renderOnce();
    await sleep(5);
  }
};
// waitForFrame counts render passes, not time: a lone ESC waits for the parser's timeout, a fetch for its promise
const until = async (pred, ms = 3000) => {
  for (const end = Date.now() + ms; Date.now() < end;) {
    await settle();
    const f = captureCharFrame();
    if (pred(f)) return f;
  }
  throw new Error(`timed out on ${pred}; last frame:\n${captureCharFrame()}`);
};
// the renderable of a row, by the id the app gives it
const row = (id) => renderer.root.findDescendantById(id);
// the colour drawn at a cell
const fgAt = (x, y) => {
  let col = 0;
  for (const span of captureSpans().lines[y].spans) {
    if (x < col + span.width) return span.fg.toInts().join(",");
    col += span.width;
  }
};
// the border colour of a card as drawn (its left edge): the accent on the selected one
const borderOf = (id) => fgAt(row(id).x, row(id).y + 1);
const bgOf = (id) => row(id).backgroundColor.toInts().join(",");

try {
  // ---- the feed --------------------------------------------------------------------------------
  const shown = discover.feed.filter((i) => api.postVerdict(i.post) !== "hide");
  const first = shown[0].post;
  const firstName = first.author.displayName || first.author.handle;
  let frame = await until((f) => f.includes(firstName));
  assert.ok(frame.includes("Discover") && frame.includes("Science") && frame.includes("News"));
  assert.ok(frame.includes(`@${first.author.handle}`));
  assert.ok(frame.includes("j/k move"), "the footer");
  assert.equal(requests[0].method, "app.bsky.feed.getFeed");
  assert.equal(requests[0].params.feed, api.DISCOVER);
  // the first lines of the first card, as drawn (the time is relative, so cut before it)
  const lines = frame.split("\n");
  assert.match(lines[0], /sky\s+1 Discover\s+2 Science\s+3 News/);
  assert.match(lines[1], /^╭─+╮/, "a rounded card");
  assert.ok(lines[2].startsWith(`│ ${firstName}`) || lines[3].startsWith(`│ ${firstName}`));

  // ---- j/k move the selection ----------------------------------------------------------------
  const selectedBorder = borderOf("post-0-0");
  assert.equal(selectedBorder, "59,156,240,255", "the accent border");
  assert.notEqual(selectedBorder, borderOf("post-0-1"), "the first card is selected");
  await mockInput.typeText("j");
  await settle();
  assert.equal(borderOf("post-0-1"), selectedBorder, "j selects the next card");
  assert.notEqual(borderOf("post-0-0"), selectedBorder);
  assert.ok(row("post-0-1").focused && !row("post-0-0").focused, "the selected card has the focus");
  await mockInput.typeText("jjk");
  await settle();
  assert.equal(borderOf("post-0-2"), selectedBorder, "j, j, k: the third card");
  const third = row("post-0-2");
  assert.ok(third.y >= 0 && third.y + third.height <= H, "the selected card is in view");
  for (let i = 0; i < 8; i++) await mockInput.typeText("j");
  await settle();
  const tenth = row("post-0-10");
  assert.equal(borderOf("post-0-10"), selectedBorder);
  assert.ok(tenth.y >= 0 && tenth.y + tenth.height <= H, "the list scrolled to keep it in view");

  // ---- enter opens the thread, esc goes back -------------------------------------------------
  const before = requests.length;
  mockInput.pressEnter();
  const rootPost = thread.thread.post;
  frame = await until((f) => f.includes("Thread"));
  const req = requests.slice(before).find((r) => r.method === "app.bsky.feed.getPostThread");
  const opened = shown[10].post;
  assert.equal(
    req.params.uri,
    `at://${opened.author.did}/app.bsky.feed.post/${opened.uri.split("/").pop()}`,
    "the thread of the selected post",
  );
  frame = await until((f) => f.includes(`@${rootPost.author.handle}`));
  const parent = thread.thread.parent.post;
  assert.ok(frame.includes(parent.author.displayName || parent.author.handle), "the parent");
  const likes = rootPost.likeCount;
  assert.ok(frame.includes(`${likes.toLocaleString("en")} like`), "the focused post's counts");
  assert.equal(borderOf("row-1"), selectedBorder, "the thread's own post is selected");
  await mockInput.typeText("j");
  await settle();
  assert.equal(borderOf("row-2"), selectedBorder, "j moves to the first reply");
  mockInput.pressEscape();
  frame = await until((f) => f.includes("1 Discover"));
  await settle();
  assert.equal(borderOf("post-0-10"), selectedBorder, "back home, the selection kept");

  // ---- tab switches the feed -----------------------------------------------------------------
  mockInput.pressTab();
  const shownScience = science.feed.filter((i) => api.postVerdict(i.post) !== "hide");
  const sci = shownScience[0].post;
  frame = await until((f) => f.includes(`@${sci.author.handle}`));
  assert.equal(
    requests.at(-1).params.feed,
    "at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science",
  );
  assert.ok(row("post-1-0") && !row("post-0-0"), "the Science feed replaced Discover");

  // ---- the mouse: over highlights a row, a click opens it ------------------------------------
  await settle();
  const card = row("post-1-1");
  const plain = bgOf("post-1-1");
  const pointers = [];
  const setPointer = renderer.setMousePointer.bind(renderer);
  renderer.setMousePointer = (style) => (pointers.push(style), setPointer(style));
  await mockMouse.moveTo(card.x + 3, card.y + 1);
  await settle();
  assert.notEqual(bgOf("post-1-1"), plain, "the row under the pointer is highlighted");
  assert.equal(pointers.at(-1), "pointer", "the pointer cursor over a clickable row");
  assert.equal(bgOf("post-1-0"), plain, "the others are not");
  await mockMouse.moveTo(W - 1, H - 1);
  await settle();
  assert.equal(bgOf("post-1-1"), plain, "out: the highlight goes");
  assert.equal(pointers.at(-1), "default");

  // the wheel scrolls the list
  const top = row("post-1-0").y;
  await mockMouse.scroll(10, 10, "down");
  await settle();
  assert.ok(row("post-1-0").y < top, "the wheel scrolls");

  // a click on the first card whose top line is in view opens its thread
  const c = [0, 1, 2, 3, 4].map((i) => row(`post-1-${i}`)).find((r) => r.y >= 1 && r.y < H - 4);
  const clicked = shownScience[Number(c.id.split("-").pop())].post;
  await mockMouse.click(c.x + 3, c.y + 1);
  frame = await until((f) => f.includes("Thread"));
  assert.equal(
    requests.at(-1).params.uri,
    `at://${clicked.author.did}/app.bsky.feed.post/${clicked.uri.split("/").pop()}`,
    "the clicked post's thread",
  );
  mockInput.pressEscape();
  await until((f) => f.includes("1 Discover"));

  // ---- the theme -----------------------------------------------------------------------------
  const dark = bgOf("post-1-0");
  assert.equal(fgAt(1, 0), "59,156,240,255", "the title, a <span> with use()");
  await mockInput.typeText("t");
  await settle();
  assert.notEqual(bgOf("post-1-0"), dark, "t switches the theme");
  assert.equal(bgOf("post-1-0"), "255,255,255,255", "the light card");
  assert.equal(fgAt(1, 0), "17,112,207,255", "the title's light accent");
  await mockInput.typeText("t");
  await settle();
  assert.equal(bgOf("post-1-0"), dark, "t again: the dark theme");
  assert.equal(fgAt(1, 0), "59,156,240,255");
} finally {
  renderer.destroy();
}
console.log("sky-tui screens: feed, j/k, thread, tabs, mouse and theme ok");
process.exit(0);
