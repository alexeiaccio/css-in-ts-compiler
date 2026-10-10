// The built app (dist/main.js) on OpenTUI's test renderer, against apps/sky's recorded fixtures: the feed, j/k, enter into a
// thread and esc back, tab to the next feed, a mouse over a row and a click. fetch is replaced before the bundle loads (atcute
// takes it then), so nothing reaches the network; then the system theme from a fake terminal's palette. Runs under Bun (OpenTUI's core needs it): `bun test/screens.mjs`.
import assert from "node:assert/strict";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import { Readable } from "node:stream";
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

const { App, followSystemTheme, system, testRender, options } = await import("../dist/main.js");
const api = await import("../../sky/src/api.ts");

// A fake terminal: stdin is a TTY, and each OSC 4, 10 and 11 query the renderer writes is answered from `colours`.
const stdin = Object.assign(new Readable({ read() {} }), { isTTY: true, setRawMode: () => {} });
const GRUVBOX = {
  fg: "#ebdbb2",
  bg: "#282828",
  ansi: "#282828 #cc241d #98971a #d79921 #458588 #b16286 #689d6a #a89984 #928374 #fb4934 #b8bb26 #fabd2f #83a598 #d3869b #8ec07c #ebdbb2".split(
    " ",
  ),
};
const LATTE = {
  fg: "#4c4f69",
  bg: "#eff1f5",
  ansi: "#5c5f77 #d20f39 #40a02b #df8e1d #1e66f5 #ea76cb #179299 #acb0be #6c6f85 #d20f39 #40a02b #df8e1d #1e66f5 #ea76cb #179299 #bcc0cc".split(
    " ",
  ),
};
let colours = GRUVBOX;
const answer = (n) => {
  const c = n === "10" ? colours.fg : n === "11" ? colours.bg : colours.ansi[Number(n.slice(2))];
  return c ? `\x1b]${n};rgb:${c.slice(1, 3)}/${c.slice(3, 5)}/${c.slice(5, 7)}\x07` : "";
};

const W = 100;
const H = 40;
const setup = await testRender(App, { ...options, width: W, height: H, stdin });
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
  await mockInput.typeText("t");
  await settle();
  assert.notEqual(bgOf("post-1-0"), dark, "t switches the theme");
  assert.equal(bgOf("post-1-0"), "255,255,255,255", "the light card");
  await mockInput.typeText("t");
  await settle();
  assert.equal(bgOf("post-1-0"), dark, "t again: the dark theme");

  // ---- the system theme, from the fake terminal's palette -----------------------------------
  const writeOut = renderer.writeOut.bind(renderer);
  renderer.writeOut = (chunk, ...rest) => {
    // oxlint-disable-next-line no-control-regex
    const replies = [...String(chunk).matchAll(/\x1b\](10|11|4;\d+);\?/g)].map((m) => answer(m[1]));
    if (replies.length) setTimeout(() => stdin.emit("data", Buffer.from(replies.join(""))), 1);
    return writeOut(chunk, ...rest);
  };
  const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)).join(",");
  await followSystemTheme(renderer, system, { wait: 3000 });
  await settle();
  let solved = system.solve(colours).values;
  assert.equal(
    bgOf("post-1-0"),
    `${rgb(solved["color-card"])},255`,
    "the card from the terminal's bg",
  );
  assert.equal(
    renderer.root.getChildren()[0].backgroundColor.toInts().slice(0, 3).join(","),
    rgb(solved["color-bg"]),
    "the screen is the terminal's background",
  );
  // the selected card's border: Gruvbox's blue, made to stand out 3:1 on the panels
  const selected = () =>
    renderer.root
      .findDescendantById("post-1-0")
      .parent.getChildren()
      .find((r) => r.focused).id;
  assert.equal(borderOf(selected()), `${rgb(solved["color-accent"])},255`, "the accent from blue");
  // the terminal turns light: a mode 2031 notification, OpenTUI asks OSC 10/11 again, then the palette
  colours = LATTE;
  const changed = once(renderer, "palette");
  stdin.emit("data", Buffer.from("\x1b[?997;2n"));
  await sleep(20);
  stdin.emit("data", Buffer.from(answer("10") + answer("11")));
  await changed;
  await settle();
  solved = system.solve(colours).values;
  assert.equal(system.solve(colours).appearance, "light");
  assert.equal(
    bgOf("post-1-0"),
    `${rgb(solved["color-card"])},255`,
    "rebuilt for the light palette",
  );
  assert.equal(borderOf(selected()), `${rgb(solved["color-accent"])},255`);
} finally {
  renderer.destroy();
}
console.log("sky-tui screens: feed, j/k, thread, tabs, mouse, theme and system theme ok");
process.exit(0);
