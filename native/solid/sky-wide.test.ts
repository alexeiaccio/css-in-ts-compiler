// The Sky page's wide form (app/Sky.tsx): the page reads its own width from the layout, and at `WIDE_AT` (720px) the
// thread opens as a second 360px column beside the feed instead of a root float over it — the same screen, the same rows,
// the same entry, declared in the row instead of floated. What this file drives, as the window does (pointer, wheel and
// frames in):
//
//   (a) the wide page is two panes: the feed's column (`sky-feed-pane`, 0,0 360x760) and the thread's (`sky-thread`,
//       360,0 360x760), and the bar, the feed and the status line are the column's own;
//   (b) the feed is scrolled before the click, and opening a thread leaves its offset and its selected card alone — the
//       offset is negative down, so the scroll back up is a notch of a spring, which settles exactly;
//   (c) the thread's rows are in the right pane: its header and clip are the column's, and every row's box starts 12px
//       inside its clip, never over the feed;
//   (d) both panes are declared and live: the thread is a region in the a11y tree, the pointer at the click's card still
//       reaches the card (nothing covers it) and each pane takes the wheel over it — the feed's column its own offset, the
//       thread's clip its rows;
//   (e) the narrow page is still the overlay: at 360 (and at 719, the frame before the turn) the thread is a root float
//       at 0,64 360x696 over the feed, its clip 652 tall, the float takes the pointer and the wheel there, and the feed's
//       offset is not written while it is up.
//
//   bun solid/sky-wide.test.ts
import "./plugin.ts";

const { readFileSync } = await import("node:fs");
const { ui } = await import("./src/ffi.ts");
const { createFrame } = await import("./src/frame.ts");
const { createInput } = await import("./src/input.ts");
const { El, render } = await import("./src/renderer.ts");
const { Sky, screenOf, size } = await import("./app/Sky.tsx");
const { snapshot } = await import("./a11y.ts");

/** apps/csssky's recorded getPostThread answer, through the page's shaping: the answer every frame here draws. */
const FIXTURE = JSON.parse(
  readFileSync(new URL("../../apps/csssky/test/fixtures/thread.json", import.meta.url), "utf8"),
) as { thread: unknown };
const SCREEN = screenOf(FIXTURE.thread);

/** The two widths: the page's own 360 and the wide page `WIDE_AT` makes. */
const WIDE = 720;
const NARROW = size.width;
const ACCENT = [59, 156, 240]; // the selected card's border, the accent token

let failed = 0;
let checks = 0;
const ok = (what: string, extra = "") => (checks++, console.log(`ok   ${what}${extra ? ` — ${extra}` : ""}`));
const bad = (what: string, why: string) => (checks++, failed++, console.error(`FAIL ${what}: ${why}`));
const check = (what: string, got: unknown, want: unknown) => {
  const [a, b] = [JSON.stringify(got), JSON.stringify(want)];
  if (a === b) ok(what, a);
  else bad(what, `${a}, wanted ${b}`);
};
const near = (got: number[], want: number[], d = 2) =>
  got.length === 3 && want.every((v, i) => Math.abs(got[i]! - v) <= d);

let dispose = () => {};
/** A fresh page at `width`x760, at rest: the loader answers the recording at once, so no frame waits on a promise. */
function fresh(width: number) {
  dispose();
  ui.init(width, size.height);
  ui.font(new URL("../vendor/fonts/Roboto-Regular.ttf", import.meta.url).pathname);
  const root = new El("root");
  const input = createInput();
  const motion: {
    onWheel?: (dx: number, dy: number) => void;
    onPointer?: (x: number, y: number, down: boolean, touch: boolean) => void;
    tick?: (dt: number) => void;
  } = {};
  dispose = render(() => Sky({ input, motion, load: () => SCREEN }), root);
  const frame = createFrame(root, {
    onPressMiss: () => input.pressMiss(),
    onPointer: (x, y, down, touch) => motion.onPointer?.(x, y, down, touch),
    onWheel: (dx, dy) => motion.onWheel?.(dx, dy),
    tick: (dt) => motion.tick?.(dt),
  });
  let at = [-1, -1];
  const step = (down = false) => frame(at[0]!, at[1]!, down, 1 / 60, true);
  step();
  // Clay keeps a clip element's offset by its id, and this file takes the page apart twice: both screens start at their
  // tops, and the offset test scrolls the feed itself
  ui.scrollTo("sky-feed", 0);
  ui.scrollTo("sky-thread-view", 0);
  step();
  for (let i = 0; i < 40; i++) step(); // the cards' mount entry is over

  const box = (id: string) => [...(ui.bounds(Buffer.from(id)) ?? [])];
  /** The a11y tree's nodes: what a screen reader is given (a box with no role is not a node). */
  const nodes = () => {
    const walk = (n: { role: string; name?: string; children: unknown[] }): { role: string; name?: string }[] => [
      { role: n.role, name: n.name },
      ...(n.children as { role: string; name?: string; children: unknown[] }[]).flatMap(walk),
    ];
    return walk(snapshot(root) as never);
  };

  return {
    root,
    input,
    box,
    nodes,
    step,
    /** Puts the pointer at x, y and lays out a frame. */
    point(x: number, y: number) {
      at = [x, y];
      step();
    },
    /** One wheel notch (`-1` down, `+1` up) at the pointer, then the frame it lands on. */
    notch(dy = -1) {
      motion.onWheel?.(0, dy);
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
    settle(n = 40) {
      for (let i = 0; i < n; i++) step();
    },
    /** Is the pointer over that element in the last layout? The thread's float captures it narrow; the columns do not. */
    over: (id: string) => ui.over(Buffer.from(id)),
    /** The Science tab, whose feed is 742px of content in the 664px viewport: the only one with somewhere to scroll. */
    science() {
      this.clickOn("sky-tabs-tab-1");
      this.settle(40);
    },
    /** Eight notches down, a frame apart, then at rest: the stored `sky-scrolled.png`'s 78px. */
    scroll() {
      for (let i = 0; i < 8; i++) motion.onWheel?.(0, -1), step();
      this.settle(90);
    },
    offset: () => ui.scrollOffset("sky-feed"),
    threadOffset: () => ui.scrollOffset("sky-thread-view"),
    card: (i: number) => box(`sky-card-${i}`),
    row: (i: number) => box(`sky-thread-row-${i}`),
    threadCard: (i: number) => box(`sky-thread-card-${i}`),
    region: () => box("sky-thread"),
    head: () => box("sky-thread-head"),
    view: () => box("sky-thread-view"),
    /** The status line's words: the selected card's "name — 2 of 3". */
    status: () => {
      const texts: string[] = [];
      const walk = (el: El) => {
        for (const child of el.children) {
          if (child instanceof El) {
            if (child.tag === "text") texts.push(child.children.map((c) => ("text" in c ? c.text : "")).join(""));
            else walk(child);
          }
        }
      };
      walk(root);
      return texts.find((s) => / — \d+ (of \d+|posts?)$/.test(s))!;
    },
    pixel: (x: number, y: number) => ui.pixel(Math.floor(x), Math.floor(y)).slice(0, 3),
  };
}

// --- (a) the wide page is two columns: the feed's pane is the left 360 of 720, and its bar, feed and status line are the
//     column's own; no thread is up, so the right column is the page's ground
{
  const p = fresh(WIDE);
  check("the page is the wide one", p.box("Root"), [0, 0, WIDE, size.height]);
  check("the feed's pane is the left column", p.box("sky-feed-pane"), [0, 0, 360, size.height]);
  check("the bar, the feed and the status line are inside it", [p.box("sky-bar"), p.box("sky-feed"), p.box("sky-status")], [
    [0, 0, 360, 64],
    [0, 64, 360, 664],
    [0, 728, 360, 32],
  ]);
  check("no thread is up: the second column is the page's ground", p.region(), []);
}

// --- (b) the feed first: Science, eight notches down, its second card selected. The feed's offset and its selected card
//     survive the thread's opening on the wide page, as they do on the narrow one
{
  const p = fresh(WIDE);
  p.science();
  p.scroll();
  check("the feed is 78px down and its second card is where the scroll put it", [p.offset(), p.card(1)], [-78, [12, 256, 336, 204]]);
  // the card's body, not its middle: a wide card's middle is its author row, which opens the profile
  p.clickOn("sky-body-1");
  p.settle(40);
  // (c) the thread is the right column: 360px wide, the page's own height, beside the feed and not over it
  check("the thread is the page's second column", p.region(), [360, 0, 360, size.height]);
  const pane = p.box("sky-feed-pane");
  const thread = p.region();
  check(
    "the two panes do not overlap: the feed's right edge is the thread's left, at the page's top",
    [pane[0]! + pane[2]!, thread[0]!, pane[1]!, thread[1]!],
    [360, 360, 0, 0],
  );
  check("the thread's header is its top 44px, its clip the rest", [p.head(), p.view()], [
    [360, 0, 360, 44],
    [360, 44, 360, 716],
  ]);
  check("the feed's offset is the one the click left", p.offset(), -78);
  check("... and its selected card has not moved", p.card(1), [12, 256, 336, 204]);
  check("... and it is still the selection: the status line's words", p.status(), "David Blanchflower BSc — 2 of 3");
  check("... and the card still wears the accent border", near(p.pixel(12, 300), ACCENT), true);
  // the rows are the right column's: the clip's 12px padding inside 360, and no row crosses into the feed
  const rows = [...Array(10).keys()].map((i) => p.row(i));
  check(
    "the thread's ten rows are inside its clip",
    rows.every((b) => b[0]! >= 360 + 12 && b[0]! + b[2]! <= 720 && b[1]! >= 44),
    true,
  );
  check("the root row is the first: 12px into the clip, 336 wide", p.row(0), [372, 56, 336, 280]);
  // (d) both panes are on screen and live: the a11y tree has the thread's region, and the pointer at the card the click
  // left it on still reaches the card — the thread is beside the feed, not over it
  check(
    "both panes are declared: the thread is a region named by its post",
    p.nodes().some((n) => n.role === "region" && n.name === "Thread — @bsky.app"),
    true,
  );
  check("the feed's card is still under the pointer, nothing covers it", [p.over("sky-card-1"), p.over("sky-thread")], [true, false]);
  // ... and each pane keeps its own wheel: the feed's column scrolls under the pointer, the thread's clip its own rows
  const feedBefore = Math.abs(p.offset());
  p.point(180, 200);
  p.notch(1); // one notch is a spring, which settles exactly: a burst is a flick and its decay has a long tail
  p.settle(40);
  check("the wheel over the feed's column is the feed's, thread and all", Math.abs(p.offset()) < feedBefore, true);
  const threadAt = p.threadOffset();
  const feedAfter = p.offset();
  p.point(540, 300);
  for (let i = 0; i < 2; i++) p.notch(-1);
  p.settle(90);
  check(
    "the wheel over the thread's clip is the thread's, the feed's offset alone",
    [p.threadOffset() < threadAt, Math.abs(p.offset() - feedAfter) < 0.5],
    [true, true],
  );
}

// --- (e) below the page's own width the thread is the root float it always was: 0,64 360x696 over the feed, its clip 652
//     tall, the rows at x 12 — and the covered feed pruned from the a11y tree
for (const width of [NARROW, WIDE - 1]) {
  const p = fresh(width);
  check(`at ${width}px the pane is the whole page`, p.box("sky-feed-pane"), [0, 0, width, size.height]);
  p.clickOn("sky-body-1");
  p.settle(40);
  check(`at ${width}px the thread is the float over the content area`, p.region(), [0, 64, width, 696]);
  check(`... its header and clip`, [p.head(), p.view()], [
    [0, 64, width, 44],
    [0, 108, width, 652],
  ]);
  check(`... its rows start at the clip's own left edge`, p.row(0)[0], 12);
  check(
    `... and the float covers the feed: the pointer is the thread's, not the card's`,
    [p.over("sky-thread"), p.over("sky-card-1")],
    [true, false],
  );
  // ... and the wheel there is the thread's, not the feed's under it
  p.point(180, 300);
  for (let i = 0; i < 2; i++) p.notch(-1);
  p.settle(90);
  check(
    `... the wheel the thread's, the feed's offset not written`,
    [p.threadOffset() < 0, p.offset() === 0],
    [true, true],
  );
}

console.log(
  `solid/sky-wide.test.ts: the thread beside the feed from ${WIDE}px (the feed's pane and the thread's, its offset and ` +
    `selection kept), the float below it; ${checks} checks, ${failed} failed`,
);
if (failed) process.exit(1);
