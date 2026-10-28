// The Sky page's thread screen (app/Sky.tsx's second screen): a card's click opens that post's thread by its at-uri, asks
// the page's loader for it, and shows the loader's three states — a muted "Loading the thread…" row, then the app's own
// rows (rowsOf over the API's ThreadScreen: post rows at their depths, the tombstones' words, the "Show N more" row a cut
// branch ends in), or "The thread could not be loaded" with a Retry row. The loader is the page's prop, so every block
// here injects a promise it settles: nothing in this file makes a request. Driven as the window does it (pointer, wheel
// and keys in, then a frame): what is opened, the rows and their indents, the screen's scroll and thumb, back to exactly
// the feed it left, the one-deep history, the group's entry and exit (and reduced motion's none), the accessibility tree,
// the stored frame, and the mutations of each state.
import "./plugin.ts";

const { readFileSync } = await import("node:fs");
const { ui } = await import("./src/ffi.ts");
const { createFrame } = await import("./src/frame.ts");
const { createInput } = await import("./src/input.ts");
const { El, render, Txt } = await import("./src/renderer.ts");
const { Sky, screenOf, size } = await import("./app/Sky.tsx");
const { setReducedMotion } = await import("./src/motion.ts");
const { thumbOf } = await import("./src/vscroll.ts");
const { snapshot } = await import("./a11y.ts");
// the app's own words and its depth limit: the page's rows are the app's rowsOf, so these are the strings a row carries
const { goneText, MAX_DEPTH, moreLabel } = await import("../../apps/csssky/src/thread/model.ts");

/** apps/csssky's recorded getPostThread answer (test/fixtures/thread.json), through the page's own shaping: the screen
 *  `--offline` shows, for whichever card is pressed. Read here, never fetched. */
const FIXTURE = JSON.parse(
  readFileSync(new URL("../../apps/csssky/test/fixtures/thread.json", import.meta.url), "utf8"),
) as { thread: unknown };
const SCREEN = screenOf(FIXTURE.thread);

ui.init(size.width, size.height);
ui.font(new URL("../vendor/fonts/Roboto-Regular.ttf", import.meta.url).pathname);

let failed = 0;
const check = (what: string, got: unknown, want: unknown) => {
  const [a, b] = [JSON.stringify(got), JSON.stringify(want)];
  if (a !== b) failed++, console.error(`FAIL ${what}: ${a}, wanted ${b}`);
};

const ACCENT = [59, 156, 240]; // the focused root card's border, the accent token
const RING = [92, 176, 255]; // the clip's focus ring
const PANEL = [27, 32, 38]; // the note card's background, the panel token
const near = (got: number[], want: number[], d = 2) =>
  got.length === 3 && want.every((v, i) => Math.abs(got[i]! - v) <= d);
/** Is a colour strictly between two others, channel by channel (a group fading in over the page)? */
const between = (c: number[], a: number[], b: number[]) =>
  c.length === 3 && c.join() !== a.join() && c.join() !== b.join() && c.every((v, i) => v >= Math.min(a[i]!, b[i]!) && v <= Math.max(a[i]!, b[i]!));
/** An offset from layout, to the pixel: Clay's float32 turns 78 into 77.99998. */
const r = (x: number) => Math.round(x * 100) / 100;
/** A track settles within 0.5 of its target, and the content is measured from float32 boxes: the machine's own slack. */
const around = (got: number, want: number, d = 0.5) => Math.abs(got - want) <= d;
/** How many bytes two frames differ in: 0 is byte-identical (the RGBA of the same 360x760). */
const diffs = (a: Uint8Array, b: Uint8Array): number => {
  if (a.length !== b.length) return -1;
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
  return n;
};

/** The loader's answer lands on a promise's microtask: a macrotask flushes it before the next frame. */
const flush = () => new Promise<void>((done) => setTimeout(done, 0));

/** A loader the test drives: every ask is a promise the test settles, in the order the page made them. */
function manual() {
  const calls: { uri: string; ok: (t: unknown) => void; no: (e: Error) => void }[] = [];
  const load = (uri: string) =>
    new Promise((ok, no) => {
      calls.push({ uri, ok, no });
    });
  return { load, calls };
}

/** A node of a screen built from the fixture's own PostViews (by the author's handle): a recording is one tree, and the
 *  rows a tombstone or a cut branch make need another, so the test builds them of the recorded posts. */
type Node = any;
const views = new Map<string, unknown>();
(function walk(n: Node) {
  if (n.kind === "post") views.set(n.post.author.handle, n.post), n.replies.forEach(walk);
})(SCREEN.root);
const post = (handle: string, replies: Node[] = []): Node => ({ kind: "post", post: views.get(handle)!, replies });
const GONE: Node = { kind: "gone", why: "notFound", uri: "at://did:plc:gone/app.bsky.feed.post/3j" };
/** The recording with what it does not have: a tombstone, and a branch three replies deep, so rowsOf's cut puts a "Show N
 *  more replies" row at depth 4. It is the same posts the fixture has. */
const DEEP = {
  parents: [],
  root: post("bsky.app", [
    GONE,
    post("mdubs949.bsky.social", [post("burnercardinals.bsky.social", [post("jlp2024.bsky.social", [post("katekor.bsky.social")])])]),
  ]),
};
/** The thread the cut post's own row opens. */
const CUT = { parents: [], root: post("jlp2024.bsky.social", [post("katekor.bsky.social")]) };

let dispose = () => {};
/** A fresh page. `load` is the page's thread loader: the recording by default (the offline frame's), or the test's own
 *  promise. Every block wants a page at rest. */
function fresh(theme?: string, load: (uri: string) => unknown = () => SCREEN) {
  dispose();
  const root = new El("root");
  const input = createInput();
  // the page's frame hook, as the host wires it: the wheel in, one tick a frame, the pointer for the drags
  const motion: {
    onWheel?: (dx: number, dy: number) => void;
    onPointer?: (x: number, y: number, down: boolean, touch: boolean) => void;
    tick?: (dt: number) => void;
  } = {};
  dispose = render(() => Sky({ input, motion, theme: () => theme, load: load as never }), root);
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
  const text = (el: El): string => el.children.map((c) => (c instanceof Txt ? c.text : text(c as El))).join("");
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

// --- the data: the app's own depth limit and words, and the recording through the page's shaping — the parents above the
//     post, the root, and the replies in the app's order (topFirst: most likes, then the earliest)
{
  check("the app's depth limit is 3", MAX_DEPTH, 3);
  check("a tombstone's words are the app's", goneText.notFound, "Post deleted or not found");
  check("one reply is the singular", moreLabel(1), "Show 1 more reply");
  check("the recording's parents are above the post", SCREEN.parents.length, 1);
  check("... the nearest last: Mina Kimes, whose reply the post is", SCREEN.parents[0]!.kind === "post" ? SCREEN.parents[0]!.post.author.handle : "", "minakimes.bsky.social");
  check("the root is the post the recording is about", SCREEN.root.kind === "post" ? SCREEN.root.post.author.handle : "", "bsky.app");
  const replies = SCREEN.root.kind === "post" ? SCREEN.root.replies : [];
  check("the replies are sorted most-liked first", replies.map((n) => (n.kind === "post" ? n.post.likeCount : -1)), [226, 4, 0, 0, 0, 0, 0]);
  check(
    "then the earliest, the late one last",
    replies.map((n) => (n.kind === "post" ? n.post.author.handle : "")),
    [
      "minakimes.bsky.social",
      "mdubs949.bsky.social",
      "jlp2024.bsky.social",
      "davideaversa.it",
      "katekor.bsky.social",
      "juanita2024.bsky.social",
      "rmar124.bsky.social",
    ],
  );
}

// --- open: a click on the second card opens the screen at once in its **loading** state — the header and one muted row —
//     and the answer it carries lands in the app's rows: ten of them (the parent, the root, seven replies and the one
//     reply below the root), the root the focused card, the replies indented by depth
{
  const m = manual();
  const p = fresh(undefined, m.load);
  p.clickOn("sky-card-1");
  check("the loader was asked for the clicked card's post, by its at-uri", m.calls.map((c) => c.uri), ["at://did:plc:p32pqknh5qh7yjpylmzlgnqo/app.bsky.feed.post/3mwvn4tpt4s23"]);
  check("the screen is the window under the bar", p.region(), [0, 64, 360, 696]);
  check("the header is its first 44", p.head(), [0, 64, 360, 44]);
  check("the clip element is the rest (696 - 44)", p.view(), [0, 108, 360, 652]);
  check("the bar stayed put", p.box("sky-bar"), [0, 0, 360, 64]);
  check("the back control is on the header's left, 28 tall", [p.back()[0], r(p.back()[1]!), p.back()[3]], [12, 72, 28]);
  check("the title is the screen's word", p.texts().includes("Thread"), true);
  p.settle(40); // the entry over: the loading state at rest
  check("the pending screen draws one row: the loading line", [p.texts().includes("Loading the thread…"), p.texts().includes("Bluesky")], [true, false]);
  const note = p.threadCard(0);
  check("it is the tombstone card, the clip's full width", note, [12, 120, 336, 44]);
  check("its box is the panel token over the page", near(p.pixel(20, 130), PANEL, 1), true);
  check("and nothing of a thread is on the screen", p.row(1), []);
  const loading = p.pixels();

  m.calls[0]!.ok(SCREEN);
  await flush();
  p.step();
  check("the answer replaces the loading row: the app's rows", p.texts().includes("Loading the thread…"), false);
  check("ten rows: the parent, the root, seven replies and Ryan under Mdubs949", [...Array(11).keys()].map((i) => p.row(i).length), [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 0]);
  check("the loader was asked once", m.calls.length, 1);
  p.settle(40);
  // the rows' boxes and their indents: the parent and the root at the clip's padding, a reply 16px a level
  const cards = [...Array(10).keys()].map((i) => p.threadCard(i));
  check("every row's wrapper is the clip's content width", cards.map((b) => b[2]), [336, 336, 320, 320, 304, 320, 320, 320, 320, 320]);
  check(
    "the parent and the root at x 12, the replies at 16px a depth: 28 (1), 44 (2)",
    cards.map((b) => b[0]),
    [12, 12, 28, 28, 44, 28, 28, 28, 28, 28],
  );
  check("the parent is Mina Kimes' post (its body and its link line), the root Bluesky's, the focused card", [p.threadCard(0)[3], p.threadCard(1)[3]], [280, 136]);
  check("the root card has the accent border", near(p.pixel(12, 470), ACCENT, 2), true);
  check("the parent's card has not (it is not the screen's post)", near(p.pixel(12, 200), ACCENT, 2), false);
  check("the rows are stacked with the clip's 8px gap", [p.row(1)[1]! - p.row(0)[1]! - p.row(0)[3]!, p.row(2)[1]! - p.row(1)[1]! - p.row(1)[3]!], [8, 8]);
  // the app's own text: the authors, the counts, the parent's media as the terminal's line
  check(
    "the authors are the recording's",
    ["Mina Kimes", "Bluesky", "Mdubs949", "Ryan", "jlp2024.bsky.social", "Davide Aversa 🎃", "Katie Korth", "Juanita", "rmar124.bsky.social"].every((n) => p.texts().includes(n)),
    true,
  );
  check("the counts are the API's, in the app's words", p.texts().includes("9 replies · 16 reposts · 326 likes"), true);
  check("the parent's embed is the terminal's media line", p.texts().includes("[link: Want to Get Off Your Phone? Mina Kimes Suggests Having a Baby - wired.com]"), true);
  check("the root's time is the record's, against the fixtures' capture moment", p.texts().includes("@bsky.app · Sep 10"), true);
  check("the screen is where the click left it: top of the thread", p.threadOffset(), 0);
  check("the feed's offset is untouched under it", p.offset(), 0);
  check("the status line still names the selected post (it is the feed's, hidden)", p.status(), "Titania — 2 of 3");
  check("the frame at rest is not the loading frame (the mutation: a state that drew on)", diffs(loading, p.pixels()) > 0, true);
  console.log(
    `solid/thread.test.ts: the loading row ${JSON.stringify(note)} then the answer: the parent ${cards[0]![3]} tall, the root ` +
      `${cards[1]![3]}, the replies at x ${cards.slice(2).map((b) => b[0]).join(", ")} (depths 1, 1, 2, 1, 1, 1, 1, 1), the content ` +
      `${1758}px in the clip's 652`,
  );
}

// --- the error state, and the retry: a rejected answer leaves the note and its Retry row, the old rows are not up behind
//     it, and the retry asks the loader again — the second answer lands as the rows
{
  const m = manual();
  const p = fresh(undefined, m.load);
  p.clickOn("sky-card-1");
  m.calls[0]!.no(new Error("getPostThread: HTTP 502"));
  await flush();
  p.step();
  p.settle(40);
  check("a rejected answer is the error state's two rows", [...Array(3).keys()].map((i) => p.row(i).length), [4, 4, 0]);
  check("the note is the page's line, a note card", [p.texts().includes("The thread could not be loaded"), p.threadCard(0)[3]], [true, 44]);
  check("... and the retry is a button row under it", [p.texts().includes("Retry"), p.threadCard(1)], [true, [12, 172, 336, 36]]);
  check("nothing of a thread is up (a stale answer would have drawn it)", p.texts().includes("Bluesky"), false);
  // the retry: the same uri, the second ask, and the answer lands
  p.clickOn("sky-thread-card-1");
  check("the retry asked the loader again, for the same post", m.calls.map((c) => c.uri), [
    "at://did:plc:p32pqknh5qh7yjpylmzlgnqo/app.bsky.feed.post/3mwvn4tpt4s23",
    "at://did:plc:p32pqknh5qh7yjpylmzlgnqo/app.bsky.feed.post/3mwvn4tpt4s23",
  ]);
  check("the second ask is pending: the loading row again", p.texts().includes("Loading the thread…"), true);
  m.calls[1]!.ok(SCREEN);
  await flush();
  p.settle(40);
  check("the retry's answer is the rows", [p.texts().includes("The thread could not be loaded"), p.texts().includes("Bluesky")], [false, true]);
  console.log(`solid/thread.test.ts: the error state: the note at y 120, Retry at 172, then the retry's own answer (${m.calls.length} asks)`);
}

// --- the tombstone and the cut: a screen with a tombstone and a branch three replies deep draws rowsOf's note row and its
//     "Show 1 more reply" row at depth 4, whose press opens the cut post's own thread; back returns to the parent screen
//     without asking the loader a third time, and a pending answer that back overtook is dropped
{
  const m = manual();
  const p = fresh(undefined, m.load);
  p.clickOn("sky-card-1");
  m.calls[0]!.ok(DEEP);
  await flush();
  p.settle(40);
  check("six rows: the root, the tombstone, the reply, its two, and the more row", [...Array(7).keys()].map((i) => p.row(i).length), [4, 4, 4, 4, 4, 4, 0]);
  const cards = [...Array(6).keys()].map((i) => p.threadCard(i));
  check("the indents: 12 (the root), 28, 28, 44, 60 and the more row at 76", cards.map((b) => b[0]), [12, 28, 28, 44, 60, 76]);
  check("the tombstone is the app's words", p.texts().includes(goneText.notFound), true);
  check("the more row is moreLabel's, for the one reply behind the cut", p.texts().includes("Show 1 more reply"), true);
  check("and the depth-3 post is the app's, not cut yet", p.texts().includes("jlp2024.bsky.social"), true);
  // it opens the cut post's thread: a second ask, for that post's uri. The row is below the clip, so the thread scrolls
  // to its end first (the wheel over the clip, as the window's does)
  p.wheel(40);
  p.settle(40);
  p.clickOn("sky-thread-card-5");
  check("the more row asked for the post the branch was cut at", m.calls.length, 2);
  check("... its own at-uri", m.calls[1]!.uri, "at://did:plc:wkumwl6bgqrq47xn7g3tbxfk/app.bsky.feed.post/3mv6p2xyvcs2q");
  m.calls[1]!.ok(CUT);
  await flush();
  p.settle(40);
  check("the cut post's thread is the screen now: two rows", [...Array(3).keys()].map((i) => p.row(i).length), [4, 4, 0]);
  check("... its root, and Katie's reply", [p.texts().includes("jlp2024.bsky.social"), p.texts().includes("Katie Korth")], [true, true]);
  // back: the parent screen as it was, from the page's snapshot (no third ask)
  p.clickOn("sky-back");
  p.settle(40);
  check("back returns to the thread it came from, not the feed", p.region(), [0, 64, 360, 696]);
  check("... its six rows again", p.threadCard(5).length, 4);
  check("... and no third ask", m.calls.length, 2);
  check("... at its own top (a fresh machine)", p.threadOffset(), 0);
  p.clickOn("sky-back");
  p.settle(40);
  check("and that thread's back is the feed's", p.region(), []);
  // a pending answer that back overtook: the screen closes and the answer lands nowhere
  const q = fresh(undefined, m.load);
  const was = m.calls.length;
  q.clickOn("sky-card-1");
  q.clickOn("sky-back");
  q.settle(40);
  m.calls[was]!.ok(SCREEN);
  await flush();
  q.settle(20);
  check("an answer that back overtook does not reopen the screen", q.region(), []);
  console.log(
    `solid/thread.test.ts: the cut: the note at depth 1, the more row at x ${cards[5]![0]}, its press asked ` +
      `${m.calls[1]!.uri.split("/").pop()}, and back was the parent's frame with ${m.calls.length} asks`,
  );
}

// --- the thread scrolls on its own machine: a notch over it moves it 10px, its thumb comes up (the machine's geometry),
//     the keys scroll it from its clip's focus, and the feed's offset does not move at all
{
  const p = fresh();
  p.openCard();
  const view = p.view()[3]!;
  const content = 1758; // the clip's two 12px paddings around the ten rows and their gaps (the last row's bottom + PAD)
  check("the clip's height is the 652 the header leaves", view, 652);
  check("at the top its thumb is at the clip's top", r(p.threadThumb()[1]! - p.view()[1]!), 0);
  check("... the machine's height for 1758 in 652", r(p.threadThumb()[3]!), r((view * view) / content));
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
  check("End reaches the thread's end: 1758 - 652", around(-p.threadOffset(), 1106), true);
  check(
    "the thumb's bottom is the clip's bottom there",
    around(p.threadThumb()[1]! + p.threadThumb()[3]!, p.view()[1]! + p.view()[3]!, 0.5),
    true,
  );
  p.tap("Home");
  p.settle(40);
  check("Home brings it back to the top", around(p.threadOffset(), 0), true);
  p.tap("PageDown");
  p.settle(40);
  check("PageDown a viewport: 652 of the 1758 (the thread is longer than one page)", around(-p.threadOffset(), 652), true);
  p.tap("PageDown");
  p.settle(40);
  check("a second PageDown clamps at the end", around(-p.threadOffset(), 1106), true);
  p.tap("ArrowUp");
  p.settle(40);
  check("Up is 40px from the end", around(-p.threadOffset(), 1066), true);
  console.log(
    `solid/thread.test.ts: the thread's content ${content} in 652, its thumb ${r(p.threadThumb()[3]!)} tall and ` +
      `${r(view - p.threadThumb()[3]!)} of travel; one notch 10, End 1106, a page 652, Up 1066; the feed still at ${p.offset()}`,
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

// --- reduced motion: no entry (the first frame of the screen is the settled one) and no exit (it unmounts at once)
{
  setReducedMotion(true);
  const p = fresh();
  p.clickOn("sky-card-1");
  p.step(); // the frame the screen is declared on: the entry would be here
  const first = p.pixels();
  p.settle(20);
  check("reduced motion's first frame is the settled thread (nothing moves after it)", diffs(first, p.pixels()), 0);
  check("... drawn at its literal: the root card's accent border", near(p.pixel(12, 470), ACCENT, 2), true);
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
  const feed = p.pixel(12, 520); // the feed's third card at the root's left border (the selected one is above it): where the accent border will be
  p.clickOn("sky-card-1");
  // the mount frame: declared, and drawn at the entry — 12px low and transparent, so the feed shows through it
  check("the screen's first frame is declared", p.region(), [0, 64, 360, 696]);
  const entry = p.pixel(12, 520);
  check(
    "and draws nothing of itself: the feed's pixel is still there",
    Math.max(...entry.map((v, i) => Math.abs(v - feed[i]!))) <= 2,
    true,
  );
  const boxes = p.region();
  p.settle(2);
  const mid = p.pixel(12, 520);
  check("two frames in, the border is a blend between the feed's pixel and the accent", between(mid, feed, ACCENT), true);
  check("and the screen's box has not moved (a group transform moves no layout)", p.region(), boxes);
  check("nor has the card under it", p.card(1), card);
  p.settle(40);
  check("at rest the root's border is the accent's literal", near(p.pixel(12, 470), ACCENT, 2), true);
  console.log(`solid/thread.test.ts: the entry: the feed's ${feed.join("/")} → ${mid.join("/")} at two frames → the accent`);
}

// --- the a11y tree: the thread is a region named by the post's author, the back control a button named "Back", the root
//     and every reply an article named by the author, the tombstone a note, and the "Show N more" row a button — and the
//     loading and error states' own notes
{
  const m = manual();
  const p = fresh(undefined, m.load);
  p.clickOn("sky-card-1");
  m.calls[0]!.ok(DEEP);
  await flush();
  p.settle(40);
  const nodes = (() => {
    const walk = (n: { role: string; name?: string; children: unknown[] }): { role: string; name?: string }[] => [
      { role: n.role, name: n.name },
      ...(n.children as { role: string; name?: string; children: unknown[] }[]).flatMap(walk),
    ];
    return walk(snapshot(p.root) as never);
  })();
  check("the back control is a button named Back", nodes.some((n) => n.role === "button" && n.name === "Back"), true);
  check(
    "the thread is a region named by the post's author",
    nodes.some((n) => n.role === "region" && n.name === "Thread — @bsky.app"),
    true,
  );
  check(
    "the root and each reply are articles named by their author",
    ["Bluesky", "Mdubs949", "Ryan", "jlp2024.bsky.social"].every((name) => nodes.some((n) => n.role === "article" && n.name === name)),
    true,
  );
  check("the tombstone is a note with the app's words", nodes.some((n) => n.role === "note" && n.name === goneText.notFound), true);
  check("the more row is a button named by its label", nodes.some((n) => n.role === "button" && n.name === "Show 1 more reply"), true);
  check("the tablist is still the page's first stop", nodes.some((n) => n.role === "tab" && n.name === "Discover"), true);
  console.log(
    `solid/thread.test.ts: ${nodes.length} nodes: ${nodes.filter((n) => n.name).map((n) => `${n.role} "${n.name}"`).join(", ")}`,
  );
  // the loader's states are in the tree too: a note while it waits, a note and a button when it fails
  const q = manual();
  const r2 = fresh(undefined, q.load);
  r2.clickOn("sky-card-1");
  r2.settle(40);
  const loading = snapshot(r2.root) as never;
  check("the loading state is a note named by its line", JSON.stringify(loading).includes("Loading the thread…"), true);
  q.calls[0]!.no(new Error("offline"));
  await flush();
  r2.settle(40);
  const error = JSON.stringify(snapshot(r2.root) as never);
  check("the error state is a note and a button named Retry", [error.includes("The thread could not be loaded"), error.includes("Retry")], [true, true]);
}

// --- the stored frames: this page at rest after the click is frames/sky-thread.png, and the recording is what it shows —
//     the fixture-loaded page is that frame byte for byte (no request, no clock)
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
  const stored = ui.png(new URL("./frames/sky-thread.png", import.meta.url).pathname)?.pixels;
  check("the recorded fixture reproduces it byte for byte", diffs(stored ?? new Uint8Array(), p.pixels()), 0);
}

// --- the mutations, as asserts: what a state that never landed, and an error path that kept the old rows, would change
{
  // a loader that answers at once (the offline frame's) never shows the loading row: that row and its frame belong to the
  // pending promise, not to the mount. Both frames are measured, so the check is the state's, not the loader's speed.
  const m0 = manual();
  const q0 = fresh(undefined, m0.load);
  q0.clickOn("sky-card-1");
  q0.settle(40);
  const pending = q0.pixels();
  check("the pending frame is the loading row", q0.texts().includes("Loading the thread…"), true);
  m0.calls[0]!.ok(SCREEN);
  await flush();
  q0.settle(40);
  const p = fresh();
  p.clickOn("sky-card-1");
  p.step();
  check("a loader that answers at once draws the rows on its first frame, no loading row", p.texts().includes("Loading the thread…"), false);
  check("... and its frame is not the pending state's", diffs(p.pixels(), pending) > 0, true);
  // the error path does not keep the rows it had: a thread that loaded, then a press whose answer rejects, is the error
  // state — not the thread that was up before it
  const m = manual();
  const q = fresh(undefined, m.load);
  q.clickOn("sky-card-1");
  m.calls[0]!.ok(DEEP);
  await flush();
  q.settle(40);
  check("the first screen is the thread (its root is drawn)", q.texts().includes("Bluesky"), true);
  q.wheel(40);
  q.settle(40);
  q.clickOn("sky-thread-card-5");
  m.calls[1]!.no(new Error("offline"));
  await flush();
  q.settle(40);
  check("the frame after a reject is the error's, not the thread that was up", [q.texts().includes("Bluesky"), q.texts().includes("The thread could not be loaded")], [false, true]);
  check("... two rows, the note and the retry", [...Array(3).keys()].map((i) => q.row(i).length), [4, 4, 0]);
  const rejected = q.threadCard(0)[3];
  // and the indent is the wrapper's left padding: dropping it would put every reply's card at the clip's left edge (12)
  const r1 = fresh();
  r1.openCard();
  check("a depth-1 reply's box is its depth's indent in from the clip (drop the wrapper's padding and it is 12)", r1.threadCard(2)![0], 28);
  check("and a depth-2 one's is 44", r1.threadCard(4)![0], 44);
  console.log(`solid/thread.test.ts: the mutations: the loading row's own frame, the reject's ${rejected}px note, the depth-1 reply at x ${r1.threadCard(2)![0]}`);
}

dispose();
if (failed) process.exit(1);
console.log(
  "solid/thread.test.ts: the app's screen through rowsOf (the parents, the root, the sorted replies), a card's click " +
    "opening the loader's loading state and then the rows, the error state and its retry, a tombstone and the more row a " +
    "cut branch ends in, the history and a dropped late answer, the thread's own scroll and thumb, the keys scrolling its " +
    "clip, back / Escape / the tab returning to the feed's exact frame and offset, reduced motion's no entry and no exit, " +
    "the group's entry, the a11y tree of all three states, the stored frame (the recording reproduces it byte for byte), " +
    "and the mutations",
);
process.exit(0);
