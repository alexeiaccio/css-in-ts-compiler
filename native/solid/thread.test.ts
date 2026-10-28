// The Sky page's thread screen (app/Sky.tsx's second screen): a card's click opens its post as the focused card, the
// replies indented by depth, a tombstone, and the "Show N more replies" row a branch cut at the app's MAX_DEPTH ends in.
// Driven as the window does it (pointer, wheel and keys in, then a frame): what is opened, how far the rows indent, the
// screen's own scroll and its thumb, back to exactly the feed it left, the one-deep history, the group's entry and exit
// (and reduced motion's none), and the accessibility tree. Every number asserted is printed.
import "./plugin.ts";

const { ui } = await import("./src/ffi.ts");
const { createFrame } = await import("./src/frame.ts");
const { createInput } = await import("./src/input.ts");
const { El, render, Txt } = await import("./src/renderer.ts");
const { Sky, size } = await import("./app/Sky.tsx");
const { setReducedMotion } = await import("./src/motion.ts");
const { thumbOf } = await import("./src/vscroll.ts");
const { snapshot } = await import("./a11y.ts");
// the app's own words and its depth limit: the page imports them too, so the words are the app's by construction
const { goneText, MAX_DEPTH, moreLabel } = await import("../../apps/csssky/src/thread/model.ts");

ui.init(size.width, size.height);
ui.font(new URL("../vendor/fonts/Roboto-Regular.ttf", import.meta.url).pathname);

let failed = 0;
const check = (what: string, got: unknown, want: unknown) => {
  const [a, b] = [JSON.stringify(got), JSON.stringify(want)];
  if (a !== b) failed++, console.error(`FAIL ${what}: ${a}, wanted ${b}`);
};

const ACCENT = [59, 156, 240]; // the selected root card's border, the accent token
const RING = [92, 176, 255]; // the clip's focus ring
const near = (got: number[], want: number[], d = 2) =>
  got.length === 3 && want.every((v, i) => Math.abs(got[i]! - v) <= d);
/** Is a colour strictly between two others, channel by channel (a group fading in over the page)? */
const between = (c: number[], a: number[], b: number[]) =>
  c.length === 3 && c.join() !== a.join() && c.join() !== b.join() && c.every((v, i) => v >= Math.min(a[i]!, b[i]!) && v <= Math.max(a[i]!, b[i]!));
/** An offset from layout, to the pixel: Clay's float32 turns 78 into 77.99998. */
const r = (x: number) => Math.round(x * 100) / 100;
/** How many bytes two frames differ in: 0 is byte-identical (the RGBA of the same 360x760). */
const diffs = (a: Uint8Array, b: Uint8Array): number => {
  if (a.length !== b.length) return -1;
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
  return n;
};

let dispose = () => {};
/** A fresh page. `entry: true` leaves the feed's cards' mount entry running (sky.test.ts's blocks read those frames);
 *  every block here wants a page at rest. */
function fresh(theme?: string) {
  dispose();
  const root = new El("root");
  const input = createInput();
  // the page's frame hook, as the host wires it: the wheel in, one tick a frame, the pointer for the drags
  const motion: {
    onWheel?: (dx: number, dy: number) => void;
    onPointer?: (x: number, y: number, down: boolean, touch: boolean) => void;
    tick?: (dt: number) => void;
  } = {};
  dispose = render(() => Sky({ input, motion, theme: () => theme }), root);
  const frame = createFrame(root, {
    theme,
    onPressMiss: () => input.pressMiss(),
    onPointer: (x, y, down, touch) => motion.onPointer?.(x, y, down, touch),
    onWheel: (dx, dy) => motion.onWheel?.(dx, dy),
    tick: (dt) => motion.tick?.(dt),
  });
  let at = [-1, -1];
  const step = (down = false, touch = false) => frame(at[0]!, at[1]!, down, 1 / 60, true, touch);
  step();
  // Clay keeps a clip element's offset by its id across `fresh()` calls: both screens start at their tops
  ui.scrollTo("sky-feed", 0);
  ui.scrollTo("sky-thread-view", 0);
  step();
  // the feed's cards arrive staggered on mount (0.3s from the last one's start): a page at rest is 40 frames later
  for (let i = 0; i < 40; i++) step();

  const find = (pred: (el: El) => boolean, from: El = root): El[] =>
    from.children.flatMap((c) => (c instanceof El ? [...(pred(c) ? [c] : []), ...find(pred, c)] : []));
  const text = (el: El): string => el.children.map((c) => (c instanceof Txt ? c.text : text(c))).join("");
  const texts = () => find((el) => el.tag === "text").map(text);
  const box = (id: string) => [...(ui.bounds(Buffer.from(id)) ?? [])];
  const pixel = (x: number, y: number) => ui.pixel(Math.floor(x), Math.floor(y)).slice(0, 3);

  return {
    root,
    input,
    box,
    pixel,
    texts,
    step,
    /** The status line: "Discover — 3 posts" or the selected card's "name — 2 of 3". */
    status: () => texts().find((s) => / — \d+ (of \d+|posts?)$/.test(s))!,
    /** The whole frame's RGBA, for the "back is the frame it left" comparison. */
    pixels: () => ui.pixels(size.width, size.height),
    /** Puts the pointer at x, y and lays out a frame. */
    point(x: number, y: number) {
      at = [x, y];
      step();
    },
    /** A press and a release at x, y with a frame each, as the host's scripted click. */
    click(x: number, y: number) {
      at = [x, y];
      step(false);
      step(true);
      step(false);
      step(false);
    },
    clickOn(id: string) {
      const b = box(id);
      if (!b.length) throw new Error(`no box ${id}`);
      this.click(b[0]! + b[2]! / 2, b[1]! + b[3]! / 2);
    },
    /** One wheel notch down (negative for up) over the thread, then a frame. */
    notch(n = 1) {
      motion.onWheel?.(0, -n);
      step();
    },
    /** `n` notches down over the thread's clip, one a frame as the host's --wheel does. */
    wheel(n: number) {
      this.point(180, 400);
      for (let i = 0; i < n; i++) this.notch(1);
    },
    settle(n = 40) {
      for (let i = 0; i < n; i++) step();
    },
    /** A key pressed and released with a frame after each. */
    tap(name: string) {
      input.down(name);
      step();
      input.up(name);
      step();
    },
    /** The second card (Titania's post): the click selects it and opens its thread, and 40 frames settle the entry. */
    openCard() {
      this.clickOn("sky-card-1");
      this.settle(40);
    },
    /** The pointer back on that card, its hover settled: the feed's frame as the click will leave it. */
    onCard() {
      this.point(180, 378);
      this.settle(40);
    },
    card: (i: number) => box(`sky-card-${i}`),
    /** The thread's rows: the wrapper (with the indent) and the card inside it. */
    row: (i: number) => box(`sky-thread-row-${i}`),
    threadCard: (i: number) => box(`sky-thread-card-${i}`),
    /** The feed's and the thread's offsets, Clay's (negative down). */
    offset: () => ui.scrollOffset("sky-feed"),
    threadOffset: () => ui.scrollOffset("sky-thread-view"),
    threadThumb: () => box("sky-thread-thumb"),
    region: () => box("sky-thread"),
    head: () => box("sky-thread-head"),
    view: () => box("sky-thread-view"),
    back: () => box("sky-back"),
  };
}

/** The feed's frame as `openCard` leaves it: the card selected, the pointer on it, everything settled. */
function settledFeed() {
  const p = fresh();
  p.openCard();
  p.clickOn("sky-back");
  p.settle(40);
  p.onCard();
  return p;
}

// --- the data: the app's own words and depth limit (MAX_DEPTH = 3: a branch at depth 3 ends in a "Show N more replies"
//     row at 4, which is where this page's deepest row is)
{
  check("the app's depth limit is 3", MAX_DEPTH, 3);
  check("a tombstone's words are the app's", goneText.notFound, "Post deleted or not found");
  check("one reply is the singular", moreLabel(1), "Show 1 more reply");
}

// --- open: a click on the second card opens its post's thread under the same bar — the header (Back, Thread), the root as
//     the focused card (Titania, with her body and the accent border), the replies at their depths, the tombstone and the
//     "Show 1 more reply" row
{
  const p = fresh();
  const card = p.card(1);
  p.openCard();
  check("the screen is the window under the bar: 64 + 696", p.region(), [0, 64, 360, 696]);
  check("the header is its first 44", p.head(), [0, 64, 360, 44]);
  check("the clip element is the rest (696 - 44)", p.view(), [0, 108, 360, 652]);
  check("the bar stayed put", p.box("sky-bar"), [0, 0, 360, 64]);
  check("the back control is on the header's left, 28 tall", [p.back()[0], r(p.back()[1]!), p.back()[3]], [12, 72, 28]);
  check("the title is the screen's word", p.texts().includes("Thread"), true);
  // the root: the clicked card's post, in the app's focused-post visual (the accent border, the card's hover gradient)
  const root = p.threadCard(0);
  check("the root card is the clicked post", [root[0], root[1], root[2]], [12, 120, 336]);
  check("the root card is 208 tall (Titania's body, one line, and the wrapped media line)", root[3], 208);
  check("the root card has the accent border", near(p.pixel(root[0]!, root[1]! + 100), ACCENT, 2), true);
  check("its name is drawn in the ink token", p.texts().includes("Titania"), true);
  check("its body is the card's", p.texts().includes("The Witch's Cat (1955) by Hilda Boswell"), true);
  check("its counts are the app's", p.texts().includes("3 replies · 27 reposts · 128 likes"), true);
  // the replies: the wrapper is the full width and the card is indented by 16px a depth (the app's marginLeft a level)
  const rows = [0, 1, 2, 3, 4, 5].map((i) => p.row(i));
  const cards = [0, 1, 2, 3, 4, 5].map((i) => p.threadCard(i));
  check("six rows: the root, four replies and the more row", rows.length, 6);
  check(
    "every row's wrapper is the clip's content width",
    rows.map((b) => [b[0], b[2]]),
    [
      [12, 336],
      [12, 336],
      [12, 336],
      [12, 336],
      [12, 336],
      [12, 336],
    ],
  );
  check("the root's card starts at the clip's left padding", cards[0]!.slice(0, 2), [12, 120]);
  check(
    "the replies indent by depth: 16, 32, 32 and 48px (the app's marginLeft, a level)",
    [cards[1]![0], cards[2]![0], cards[3]![0], cards[4]![0]],
    [28, 44, 44, 60],
  );
  check("and the more row sits one level in from the cut branch: 64px", cards[5]![0], 76);
  check("the reply cards are narrower by the indent", [cards[1]![2], cards[2]![2], cards[4]![2], cards[5]![2]], [320, 304, 288, 272]);
  check(
    "the rows are stacked with the clip's 8px gap",
    [rows[1]![1]! - rows[0]![1]! - rows[0]![3]!, rows[2]![1]! - rows[1]![1]! - rows[1]![3]!],
    [8, 8],
  );
  // the replies' posts (the recorded fixture's) and the tombstone
  check("the first reply is the recorded fixture's jlp2024 (no display name: the handle is the name)", p.texts().includes("jlp2024.bsky.social"), true);
  check("the tombstone's row is the app's words", p.texts().includes(goneText.notFound), true);
  check("the tombstone is a 44px card", cards[2]![3], 44);
  check("the cut branch's reply and its row", [p.texts().includes("Mdubs949"), p.texts().includes("*men's sports")], [true, true]);
  check("the more row's label is the app's, for the one reply behind the cut", p.texts().includes("Show 1 more reply"), true);
  check("the screen is where the click left it: top of the thread", p.threadOffset(), 0);
  check("the feed's offset is untouched under it", p.offset(), 0);
  check("the status line still names the selected post (it is the feed's, hidden)", p.status(), "Titania — 2 of 3");
  check("the card keeps its box under the screen", p.card(1), card);
  console.log(
    `solid/thread.test.ts: the root ${root[2]}x${root[3]} at ${root[0]},${root[1]}, the replies at x ` +
      `${cards.slice(1).map((b) => b[0]).join(", ")} (depths 1, 2, 2, 3, 4), the content 900px in the clip's 652`,
  );
}

// --- the thread scrolls on its own machine: a notch over it moves it 10px, its thumb comes up (the machine's geometry),
//     the keys scroll it from its clip's focus, and the feed's offset does not move at all
{
  const p = fresh();
  p.openCard();
  const view = p.view()[3]!;
  const content = 900; // 12 (the clip's top padding) + the rows' block + 8px gaps + 12 (its bottom padding)
  check("the clip's height is the 652 the header leaves", view, 652);
  check("at the top its thumb is at the clip's top", r(p.threadThumb()[1]! - p.view()[1]!), 0);
  check("... the machine's height for 900 in 652", r(p.threadThumb()[3]!), r((view * view) / content));
  check("in the feed's 4px, 2px in from the right edge", [p.threadThumb()[0], p.threadThumb()[2]], [354, 4]);
  p.wheel(1);
  p.settle(40);
  const offset = -p.threadOffset();
  check("one notch settles at exactly 10px", r(offset), 10);
  check("the feed's offset is untouched while the thread scrolls", p.offset(), 0);
  const t = thumbOf(content, view, offset)!;
  check(
    "the thumb is the machine's geometry for the offset",
    [r(p.threadThumb()[1]! - p.view()[1]!), r(p.threadThumb()[3]!)],
    [r(t.top), r(t.height)],
  );
  check("its height never drops below 24", t.height >= 24, true);
  // the keys: the clip is the screen's second stop, after the back control
  check("the back control has the focus on opening", p.input.focus.focused(), "sky-back");
  p.tap("Tab");
  check("Tab reaches the thread's clip", p.input.focus.focused(), "sky-thread-view");
  check("the clip wears the ring at its edge", p.pixel(1, 400), RING);
  p.tap("End");
  p.settle(40);
  check("End reaches the thread's end: 900 - 652", r(-p.threadOffset()), 248);
  check(
    "the thumb's bottom is the clip's bottom there",
    [r(p.threadThumb()[1]! + p.threadThumb()[3]!), r(p.view()[1]! + p.view()[3]!)],
    [760, 760],
  );
  p.tap("Home");
  p.settle(40);
  check("Home brings it back to the top", r(p.threadOffset()), 0);
  p.tap("PageDown");
  p.settle(40);
  check("PageDown a viewport (652) clamps at the end", r(-p.threadOffset()), 248);
  p.tap("ArrowUp");
  p.settle(40);
  check("Up is 40px from the end", r(-p.threadOffset()), 208);
  console.log(
    `solid/thread.test.ts: the thread's content 900 in 652, its thumb ${r(p.threadThumb()[3]!)} tall and ` +
      `${r(view - p.threadThumb()[3]!)} of travel; one notch 10, End 248, PageDown 248, Up 208; the feed still at ${p.offset()}`,
  );
}

// --- back: the control and Escape return to the feed with the offset and the selected card it had, and its frame is the
//     frame before the click once the exit is over (0.3s of the group sliding back down and fading out)
{
  const p = settledFeed();
  const before = p.pixels();
  const offset = p.offset();
  const selection = p.status();
  p.openCard();
  check("the thread took the focus while the feed's stop is disabled", p.input.focus.focused(), "sky-back");
  check("but the feed's offset is the one it had", p.offset(), offset);
  p.clickOn("sky-back");
  p.settle(40);
  check("the feed's offset is the one it left", p.offset(), offset);
  check("the selected card is the one it left", p.status(), selection);
  check("nothing has the focus any more, as before the click", p.input.focus.focused(), null);
  check("the thread's node has gone", p.region(), []);
  p.onCard();
  check("the feed's frame is byte-identical to the one before the click", diffs(before, p.pixels()) === 0, true);
  console.log(`solid/thread.test.ts: back: offset ${p.offset()}, "${p.status()}", the frame ${diffs(before, p.pixels())} bytes off`);
  // Escape does the same, and it moves no pointer at all: the frame is the one the click left
  p.openCard();
  p.tap("Escape");
  p.settle(40);
  check("Escape returns to the feed too", [p.region(), p.offset(), p.status()], [[], offset, selection]);
  check("and the frame is the same one again", diffs(before, p.pixels()), 0);
  // a click on the bar's active tab returns to the feed as well
  p.openCard();
  p.clickOn("sky-tabs-tab-0");
  p.settle(40);
  check("a click on the active tab returns to the feed", [p.region(), p.status()], [[], selection]);
  p.onCard();
  check("... and its frame is still the one before the click", diffs(before, p.pixels()), 0);
}

// --- the history is one deep: a "Show N more replies" row opens the cut post's own thread, and its back returns to the
//     thread it came from (not the feed); that thread's back is the feed's
{
  const p = fresh();
  p.openCard();
  const first = p.region();
  p.wheel(40);
  p.settle(40);
  check("the thread is at its end, where the more row shows", r(-p.threadOffset()), 248);
  const more = p.threadCard(5);
  check("the more row's card is in view at the end", more[1]! + more[3]! <= p.view()[1]! + p.view()[3]!, true);
  p.clickOn("sky-thread-card-5");
  p.settle(40);
  check("the deeper thread is the same screen", p.region(), first);
  check("its root is the cut post: 1 reply, 4 likes", p.texts().includes("1 replies · 0 reposts · 4 likes"), true);
  check("... and its one reply is the fixture's Ryan", p.texts().includes("Ryan"), true);
  check("it has the root and that one reply", [p.threadCard(0)[2], p.threadCard(1)[0], p.threadCard(1)[2]], [336, 28, 320]);
  check("and no more row (the reply has no replies in the data)", p.threadCard(2), []);
  check("the deeper thread starts at its own top", p.threadOffset(), 0);
  const deeper = p.texts().includes("1 replies · 0 reposts · 4 likes");
  p.clickOn("sky-back");
  p.settle(40);
  check("back returns to the thread it came from, not the feed", p.region(), first);
  check("... at its own top (a fresh machine)", p.threadOffset(), 0);
  check("... with the first thread's six rows again", p.threadCard(5).length, 4);
  check("... and its root is Titania's post", p.threadCard(0)[2], 336);
  p.clickOn("sky-back");
  p.settle(40);
  check("and that thread's back is the feed's", p.region(), []);
  console.log(
    `solid/thread.test.ts: the more row at y ${more[1]} opens the cut post's thread (Mdubs949's counts: ${deeper}), ` +
      `whose back is the first thread's and whose back is the feed's`,
  );
}

// --- reduced motion: no entry (the first frame of the screen is the settled one) and no exit (it unmounts at once)
{
  setReducedMotion(true);
  const p = fresh();
  p.clickOn("sky-card-1");
  p.step(); // the frame the screen is declared on: the entry would be here
  const first = p.pixels();
  p.settle(20);
  check("reduced motion's first frame is the settled thread (nothing moves after it)", diffs(first, p.pixels()), 0);
  check("... drawn at its literal: the root card's accent border", near(p.pixel(12, 220), ACCENT, 2), true);
  check(
    "and the very frame a page with motion reaches (the stored sky-thread.png)",
    diffs((ui.png(new URL("./frames/sky-thread.png", import.meta.url).pathname)?.pixels ?? new Uint8Array()), first),
    0,
  );
  // no exit either: back unmounts on the falling edge of the click
  p.clickOn("sky-back");
  p.step();
  check("the exit is the falling edge: the feed is back on the same frame", p.region(), []);
  p.onCard();
  const feed = p.pixels();
  p.clickOn("sky-card-1");
  p.clickOn("sky-back");
  p.step();
  p.onCard();
  check("and its frame is the one before the click", diffs(feed, p.pixels()), 0);
  setReducedMotion(false);
  console.log(`solid/thread.test.ts: reduced motion: the entry's 0 frames, the exit's 0, the settled thread ${first.length} bytes`);
}

// --- the entry: the screen comes in as one group — 12px low and at 0 opacity — on the page's card entry's tracks, so the
//     frames between are blends of the page and the screen, and the layout never moves
{
  const p = fresh();
  const card = p.card(1);
  p.onCard();
  const feed = p.pixel(12, 220); // the feed's first card's left edge: where the root's accent border will be
  p.clickOn("sky-card-1");
  // the mount frame: declared, and drawn at the entry — 12px low and transparent, so the feed shows through it
  check("the screen's first frame is declared", p.region(), [0, 64, 360, 696]);
  const entry = p.pixel(12, 220);
  check(
    "and draws nothing of itself: the feed's pixel is still there",
    Math.max(...entry.map((v, i) => Math.abs(v - feed[i]!))) <= 2,
    true,
  );
  const boxes = p.region();
  p.settle(2);
  const mid = p.pixel(12, 220);
  check("two frames in, the border is a blend between the feed's pixel and the accent", between(mid, feed, ACCENT), true);
  check("and the screen's box has not moved (a group transform moves no layout)", p.region(), boxes);
  check("nor has the card under it", p.card(1), card);
  p.settle(40);
  check("at rest the root's border is the accent's literal", near(p.pixel(12, 220), ACCENT, 2), true);
  console.log(`solid/thread.test.ts: the entry: the feed's ${feed.join("/")} → ${mid.join("/")} at two frames → the accent`);
}

// --- the a11y tree: the thread is a region named by the root's author, the back control a button named "Back", the root
//     and every reply an article named by the author, the tombstone a note, and the "Show N more" row a button
{
  const p = fresh();
  p.openCard();
  const tree = snapshot(p.root);
  const walk = (n: { role: string; name?: string; children: unknown[] }): { role: string; name?: string }[] => [
    { role: n.role, name: n.name },
    ...(n.children as { role: string; name?: string; children: unknown[] }[]).flatMap(walk),
  ];
  const nodes = walk(tree as never);
  check("the back control is a button named Back", nodes.some((n) => n.role === "button" && n.name === "Back"), true);
  check(
    "the thread is a region named by the root's author",
    nodes.some((n) => n.role === "region" && n.name === "Thread — @titaniasrealm.bsky.social"),
    true,
  );
  check(
    "the root and each reply are articles named by their author",
    ["Titania", "jlp2024.bsky.social", "Katie Korth", "Mdubs949"].every((name) => nodes.some((n) => n.role === "article" && n.name === name)),
    true,
  );
  check("the tombstone is a note with the app's words", nodes.some((n) => n.role === "note" && n.name === goneText.notFound), true);
  check("the more row is a button named by its label", nodes.some((n) => n.role === "button" && n.name === "Show 1 more reply"), true);
  check("the tablist is still the page's first stop", nodes.some((n) => n.role === "tab" && n.name === "Discover"), true);
  console.log(
    `solid/thread.test.ts: ${nodes.length} nodes: ${nodes.filter((n) => n.name).map((n) => `${n.role} "${n.name}"`).join(", ")}`,
  );
}

// --- the stored frames: this page at rest after the click is frames/sky-thread.png
{
  const p = fresh();
  p.openCard();
  check(
    "the settled thread is frames/sky-thread.png",
    ui.diffPng(
      new URL("./frames/sky-thread.png", import.meta.url).pathname,
      new URL("./frames/sky-thread.png.actual.png", import.meta.url).pathname,
    ),
    0,
  );
}

// --- the mutations, as asserts: what a dropped indent and a shared scroll machine would change
{
  // the indent is the wrapper's left padding: dropping it would put every reply's card at the clip's left edge (12), where
  // the root's is, instead of 16px a level
  const p = fresh();
  p.openCard();
  const indent = p.threadCard(1)![0];
  check("a reply's box is its depth's indent in from the clip (drop the wrapper's padding and it is 12)", indent, 28);
  // one machine for both screens: reusing the thread's offset for the feed would move the feed after back and its frame
  // would differ from the one before the click. Science is the feed that can move (742 of content in 664); Discover's three
  // posts fit, so a wrong offset would clamp to 0 there and prove nothing.
  const q = fresh();
  q.clickOn("sky-tabs-tab-1");
  q.settle(40);
  q.openCard();
  q.clickOn("sky-back");
  q.settle(40);
  q.onCard();
  const before = q.pixels();
  const feedOffset = q.offset();
  q.openCard();
  q.wheel(40);
  q.settle(40);
  const threadEnd = -q.threadOffset();
  check("the thread was scrolled to its end before back (past the feed's own 78)", threadEnd > 78, true);
  q.clickOn("sky-back");
  q.settle(40);
  q.onCard();
  check(
    `the feed's offset after back is its own (${feedOffset}; a thread offset reused for it would be ${r(threadEnd)})`,
    q.offset(),
    feedOffset,
  );
  const off = diffs(before, q.pixels());
  check("the feed's frame after back differs in 0 bytes (a reused offset would scroll the feed to its end)", off, 0);
  console.log(`solid/thread.test.ts: the mutations: the depth-1 reply at x ${indent}, the thread's ${r(threadEnd)} reuse → the feed's frame ${off} bytes off`);
}

dispose();
if (failed) process.exit(1);
console.log(
  "solid/thread.test.ts: the app's words and depth limit, a card's click opening the thread (the header, the root as the " +
    "focused card, the replies' 16px-a-depth indent, the tombstone, the more row), the thread's own scroll and thumb, " +
    "the keys scrolling its clip, back / Escape / the tab returning to the feed's exact frame and offset, the one-deep " +
    "history of a more row, reduced motion's no entry and no exit, the group's entry, the a11y tree, the stored frame, " +
    "and the indent and shared-offset mutations",
);
process.exit(0);
