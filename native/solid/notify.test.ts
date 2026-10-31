// The Sky page's fourth screen (app/Notify.tsx): the app's notifications, opened with `n` on the feed — the app has no
// notifications screen, model or fixture, so its five rows are the app's recordings hand-carried in app/notify.ts (the C
// shell's own rows, terminal/notify.c). The checks: the data's provenance, the five rows in document order with the
// ring, Tab walking the stops and wrapping at the end, Enter on a row opening its post's thread (the page's own
// `openThread` and `load`), Escape from that thread back to the list, Enter on the follow opening nothing, Escape from
// the list back to the feed's byte-identical frame, the entry and reduced motion, the a11y tree, the stored frame, and
// the two deliberate breaks.
import "./plugin.ts";

const { readFileSync } = await import("node:fs");
const { ui } = await import("./src/ffi.ts");
const { createFrame } = await import("./src/frame.ts");
const { createInput } = await import("./src/input.ts");
const { El, render, Txt } = await import("./src/renderer.ts");
const { Sky, screenOf, size, postOf, SKY_NOW } = await import("./app/Sky.tsx");
const { notificationsOf } = await import("./app/notify.ts");
const { setReducedMotion } = await import("./src/motion.ts");
const { snapshot } = await import("./a11y.ts");

/** apps/csssky's recorded getPostThread answer: what a notification's post opens. */
const FIXTURE = JSON.parse(
  readFileSync(new URL("../../apps/csssky/test/fixtures/thread.json", import.meta.url), "utf8"),
) as { thread: unknown };
const SCREEN = screenOf(FIXTURE.thread);
const ROWS = notificationsOf(postOf);

ui.init(size.width, size.height);
ui.font(new URL("../vendor/fonts/Roboto-Regular.ttf", import.meta.url).pathname);

let failed = 0;
const check = (what: string, got: unknown, want: unknown) => {
  const [a, b] = [JSON.stringify(got), JSON.stringify(want)];
  if (a !== b) failed++, console.error(`FAIL ${what}: ${a}, wanted ${b}`);
};

const ACCENT = [59, 156, 240]; // the cardOn border: the C page's ring
const near = (got: number[], want: number[], d = 2) => got.length === 3 && want.every((v, i) => Math.abs(got[i]! - v) <= d);
const r = (x: number) => Math.round(x * 100) / 100;
const around = (got: number, want: number, d = 0.5) => Math.abs(got - want) <= d;
const diffs = (a: Uint8Array, b: Uint8Array): number => {
  if (a.length !== b.length) return -1;
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
  return n;
};

let dispose = () => {};
/** A fresh page, at rest: the feed's cards' entry is over (40 frames), and `n` is the feed's key. */
function fresh(options: { theme?: string; screen?: "notifications"; mutate?: string } = {}) {
  dispose();
  const root = new El("root");
  const input = createInput();
  const motion: {
    onWheel?: (dx: number, dy: number) => void;
    onPointer?: (x: number, y: number, down: boolean, touch: boolean) => void;
    tick?: (dt: number) => void;
  } = {};
  dispose = render(
    () =>
      Sky({
        input,
        motion,
        theme: () => options.theme,
        load: () => SCREEN,
        screen: options.screen,
        mutate: options.mutate,
      }),
    root,
  );
  const frame = createFrame(root, {
    theme: options.theme,
    onPressMiss: () => input.pressMiss(),
    onPointer: (x, y, down, touch) => motion.onPointer?.(x, y, down, touch),
    onWheel: (dx, dy) => motion.onWheel?.(dx, dy),
    tick: (dt) => motion.tick?.(dt),
  });
  let at = [-1, -1];
  const step = (down = false, touch = false) => frame(at[0]!, at[1]!, down, 1 / 60, true, touch);
  step();
  // Clay keeps a clip element's offset by its id across pages: every clip starts at its top
  ui.scrollTo("sky-feed", 0);
  ui.scrollTo("sky-thread-view", 0);
  ui.scrollTo("sky-notify-view", 0);
  step();
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
    pixels: () => ui.pixels(size.width, size.height),
    /** `n`: the feed's notifications key (the page's fallback). */
    open() {
      this.tap("n");
      this.settle(40);
    },
    settle(n = 40) {
      for (let i = 0; i < n; i++) step();
    },
    point(x: number, y: number) {
      at = [x, y];
      step();
    },
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
    notch(n = 1) {
      motion.onWheel?.(0, -n);
      step();
    },
    tap(name: string) {
      input.down(name);
      step();
      input.up(name);
      step();
    },
    card: (i: number) => box(`sky-notify-card-${i}`),
    region: () => box("sky-notify"),
    head: () => box("sky-notify-head"),
    view: () => box("sky-notify-view"),
    back: () => box("sky-notify-back"),
    thumb: () => box("sky-notify-thumb"),
    thread: () => box("sky-thread"),
    offset: () => ui.scrollOffset("sky-notify-view"),
    feedOffset: () => ui.scrollOffset("sky-feed"),
    /** The rows of the a11y tree, in document order: their names (the actor and the verb). */
    rows: () => {
      const out: string[] = [];
      const walk = (n: { role: string; name?: string; children: unknown[] }) => {
        if (n.role === "article" && n.name) out.push(n.name);
        (n.children as { role: string; name?: string; children: unknown[] }[]).forEach(walk);
      };
      walk(snapshot(root) as never);
      return out;
    },
  };
}

// --- the data: the app's five kinds over its own recordings — each row's actor, text and time the fixture post's
{
  check("five rows", ROWS.length, 5);
  check(
    "the app's five verbs, in its wording",
    ROWS.map((row) => row.verb),
    ["mentioned you", "reposted", "liked your post", "replied", "followed you"],
  );
  check(
    "the actors are the recordings' authors (displayName, else the handle)",
    ROWS.map((row) => row.actor),
    ["Erik Strub", "Titania", "Michael Warburton", "jlp2024.bsky.social", "Mina Kimes"],
  );
  check(
    "the times are the posts' createdAt, newest first, against the fixtures' capture moment",
    ROWS.map((row) => SKY_NOW - row.created),
    [0, 2433, 6986, 1890134, 1899361],
  );
  check(
    "the snippets are the posts' first lines (the Science post's is its first paragraph)",
    ROWS.map((row) => row.snippet),
    [
      "Second paper of Marco (open access) on Tc-99m is online, congrats! Good timing for the weekend.",
      "The Witch's Cat (1955) by Hilda Boswell",
      "René Magritte at work in his living room in 1964",
      "Unfortunately you ban and flag acco7nts in accurately. But, yeah, you're better than Twitter.... incredible achievement.",
      undefined,
    ],
  );
  check(
    "each row's post is the fixture's own (home-science-1 [11], home-discover-1 [23] and [20], thread.json's reply and parent)",
    ROWS.map((row) => row.uri?.split("/").pop() ?? null),
    [
      "3mwvpfejk2k2g",
      "3mwvn4tpt4s23",
      "3mwviv6b3u22w",
      "3mv6p2xyvcs2q",
      null,
    ],
  );
  check("the follow has no post: no snippet, no at-uri", [ROWS[4]!.snippet, ROWS[4]!.uri], [undefined, undefined]);
  console.log(
    `solid/notify.test.ts: the rows (newest first): ${ROWS.map((row) => `${row.actor} ${row.verb}`).join("; ")}`,
  );
}

// --- `n` on the feed opens the screen: the window under the bar, its own header with the back control and the word, the
//     five cards on the page's own clip, and the feed's stop out of the Tab order
{
  const p = fresh();
  check("the feed's frame first", [p.region(), p.feedOffset()], [[], 0]);
  p.open();
  check("the screen is the window under the bar", p.region(), [0, 64, 360, 696]);
  check("the header is its first 44", p.head(), [0, 64, 360, 44]);
  check("the back control is on the header's left, 28 tall", [p.back()[0], r(p.back()[1]!), p.back()[3]], [12, 72, 28]);
  check("the title is the screen's word", p.texts().includes("Notifications"), true);
  check("the first row has the ring on opening, as the C page's list does", p.input.focus.focused(), "sky-notify-card-0");
  check("the feed's stop is out of the Tab order", p.input.focus.tabOrder().includes("sky-feed"), false);
  check(
    "the rows are the stops, in document order",
    p.input.focus.tabOrder().slice(2),
    ["sky-notify-back", "sky-notify-card-0", "sky-notify-card-1", "sky-notify-card-2", "sky-notify-card-3", "sky-notify-card-4"],
  );
  check(
    "the a11y rows are the five, named by their actor and verb",
    p.rows(),
    ROWS.map((row) => `${row.actor} ${row.verb}`),
  );
  check("the feed's offset is untouched under it", p.feedOffset(), 0);
  // the list fits: five cards in 652px, so its own machine has nowhere to go and its thumb is 0 tall
  check("nothing to scroll: the offset is its top", p.offset(), 0);
  check("... and the thumb is the machine's 0", p.box("sky-notify-thumb")[3], 0);
  p.notch(2);
  p.settle(20);
  check("a wheel notch leaves it at the top", p.offset(), 0);
  console.log(
    `solid/notify.test.ts: the screen ${JSON.stringify(p.region())}, head ${JSON.stringify(p.head())}, five cards ` +
      `${p.card(0)[3]}..${p.card(4)[3]} tall on a ${r(p.view()[3]!)} clip`,
  );
}

// --- the ring is the focused card's: the accent border (the C page's ring), one card at a time, on the row the arrows,
//     j/k, Home and End move to without leaving the list
{
  const p = fresh();
  p.open();
  // the border is drawn on the box's own left column (Clay draws it inside the box, and a cell's card is the same)
  const mid = (i: number) => p.pixel(p.card(i)[0]!, p.card(i)[1]! + p.card(i)[3]! / 2);
  const lit = mid(0), dim = mid(1);
  check("the first card's left edge is the accent border", near(mid(0), ACCENT), true);
  check("... and the second's is its own panel tone, no ring", near(mid(1), ACCENT), false);
  p.tap("ArrowDown");
  check(
    "ArrowDown moves the ring to the second row",
    [p.input.focus.focused(), near(mid(1), ACCENT), near(mid(0), ACCENT)],
    ["sky-notify-card-1", true, false],
  );
  p.tap("End");
  check("End is the last row", p.input.focus.focused(), "sky-notify-card-4");
  p.tap("Home");
  check("Home the first", p.input.focus.focused(), "sky-notify-card-0");
  p.tap("ArrowUp");
  check("ArrowUp at the top stays on the first row (the list does not wrap)", p.input.focus.focused(), "sky-notify-card-0");
  p.tap("j");
  check("j is the C page's Down", p.input.focus.focused(), "sky-notify-card-1");
  p.tap("k");
  check("k its Up", p.input.focus.focused(), "sky-notify-card-0");
  // a click on a row is its own press: the row focuses, and its post opens (the C page's press-and-release on a card)
  p.clickOn("sky-notify-card-2");
  p.settle(40);
  check("a click on a row opens its post's thread", p.thread(), [0, 64, 360, 696]);
  check("... with the row it pressed focused under it", p.input.focus.focused(), "sky-back");
  console.log(
    `solid/notify.test.ts: the ring: row 0's left edge ${lit} (the accent), row 1's ${dim} (its own tone); arrows, j/k and ` +
      `Home/End rove the list`,
  );
}

// --- Tab: the back control then the rows, in document order, and past the last row the first again (the page's fallback:
//     the manager releases the focus there, and a terminal has nowhere to hand Tab to)
{
  const p = fresh();
  p.open();
  p.tap("Shift+Tab");
  check("Shift+Tab from the first row is the back control", p.input.focus.focused(), "sky-notify-back");
  p.tap("Shift+Tab");
  check("... and from it the bar's gear (the page's own stops before the screen's)", p.input.focus.focused(), "sky-gear");
  p.tap("Tab");
  check("Tab is the back control again", p.input.focus.focused(), "sky-notify-back");
  p.tap("Tab");
  check("... and then the first row", p.input.focus.focused(), "sky-notify-card-0");
  for (let i = 1; i < 5; i++) p.tap("Tab");
  check("five Tabs walk the five rows", p.input.focus.focused(), "sky-notify-card-4");
  p.tap("Tab");
  check("past the last row the first has it again", p.input.focus.focused(), "sky-notify-card-0");
  console.log("solid/notify.test.ts: Tab: back, rows 0-4, and past the last row the first again");
}

// --- Enter on a row opens its post's thread through the page's own `openThread` (the test's recorded `load`): the thread
//     is a float over the list, the list stays declared, and Escape comes back to the row it left, the frame it had
{
  const p = fresh();
  p.open();
  const before = p.pixels();
  const row = p.card(0);
  p.tap("Enter");
  p.settle(40);
  check("Enter opens the thread over the notifications", [p.thread(), p.region()], [[0, 64, 360, 696], [0, 64, 360, 696]]);
  check("... the recorded thread's rows are drawn", p.texts().some((s) => s.startsWith("Talked to @wired.com")), true);
  check("... the thread's back control has the focus", p.input.focus.focused(), "sky-back");
  check("... the list is still under it, its rows where they were", p.card(0), row);
  check("... and its stops are out of the Tab order", p.input.focus.tabOrder().includes("sky-notify-card-0"), false);
  check(
    "... and the list is pruned from the a11y tree under it",
    JSON.stringify(snapshot(p.root) as never).includes("Notifications"),
    false,
  );
  p.tap("Escape");
  p.settle(40);
  check("Escape returns to the list, the row it left focused", [p.thread(), p.input.focus.focused()], [[], "sky-notify-card-0"]);
  check("... and the frame it had (0 bytes)", diffs(before, p.pixels()), 0);
  // Enter on the follow: no post, so no thread, and the list stays as it was
  p.tap("End");
  p.tap("Enter");
  p.settle(20);
  check("Enter on the follow opens nothing: no thread, the list still up", [p.thread(), p.region().length, p.input.focus.focused()], [[], 4, "sky-notify-card-4"]);
  console.log(`solid/notify.test.ts: a row's thread over the list (both regions declared), Escape back to the row's frame (0 bytes off); the follow opens none`);
}

// --- Escape from the list is the feed's: the offset, the selection and the frame it left, and nothing has the focus;
//     a feed tab and the back control do the same
{
  const p = fresh();
  const feed = p.pixels();
  p.open();
  const open = p.pixels();
  check("the feed's frame is not the list's", diffs(open, feed) > 0, true);
  p.tap("Escape");
  p.settle(40);
  check("Escape closes it", p.region(), []);
  check("... the feed's stop is back in the Tab order", p.input.focus.tabOrder().includes("sky-feed"), true);
  check("... and nothing has the focus, as before the key", p.input.focus.focused(), null);
  check("... and the feed's frame is the one it left (0 bytes)", diffs(feed, p.pixels()), 0);
  p.open();
  p.clickOn("sky-notify-back");
  p.settle(40);
  check("the back control closes it too", p.region(), []);
  p.open();
  p.clickOn("sky-notify-card-0");
  p.settle(40);
  check("a click on a row opens its post's thread", p.thread(), [0, 64, 360, 696]);
  p.clickOn("sky-tabs-tab-0");
  p.settle(40);
  check("a click on a bar tab closes the thread and the list", [p.region(), p.thread()], [[], []]);
  p.point(-1, -1);
  p.open();
  p.tap("Escape");
  p.settle(40);
  check("Escape again is the same feed frame (the pointer off the tab)", diffs(feed, p.pixels()), 0);
  console.log("solid/notify.test.ts: Escape, the back control and a feed tab all leave it for the feed's frame");
}

// --- the entry: the screen comes in as one group — 12px low and 0 opacity — on the page's card entry's tracks, and the
//     layout moves not at all; reduced motion has no entry and no exit
{
  const p = fresh();
  p.tap("n");
  check("the screen's first frame is declared", p.region(), [0, 64, 360, 696]);
  const boxes = p.region();
  const feed = p.pixel(180, 300);
  p.settle(2);
  check("two frames in, its pixels are between the feed's and the page's", p.pixel(180, 300).join() !== feed.join(), true);
  check("and its box has not moved (a group transform moves no layout)", p.region(), boxes);
  p.settle(40);
  const storedPath = new URL("./frames/notify-initial.png", import.meta.url).pathname;
  check(
    "at rest it is frames/notify-initial.png",
    ui.diffPng(storedPath, new URL("./frames/notify-initial.png.actual.png", import.meta.url).pathname),
    0,
  );
  const stored = ui.png(storedPath)?.pixels ?? new Uint8Array();
  check("... byte for byte", diffs(stored, p.pixels()), 0);
  // the light theme is the page's own light palette under the same screen
  const l = fresh({ theme: "light" });
  l.open();
  check(
    "the light screen's first card border is the light ring",
    near(l.pixel(l.card(0)[0]!, l.card(0)[1]! + l.card(0)[3]! / 2), [11, 98, 189], 16),
    true,
  );
  setReducedMotion(true);
  const q = fresh({ screen: "notifications" });
  q.step();
  const first = q.pixels();
  q.settle(20);
  check("reduced motion's first frame is the settled screen (nothing moves after it)", diffs(first, q.pixels()), 0);
  check("... the stored frame", diffs(stored, first), 0);
  setReducedMotion(false);
  console.log("solid/notify.test.ts: the entry: a group 12px low and transparent, the box still; reduced motion's 0 frames");
}

// --- the a11y tree: the screen is a region named Notifications, the back control a button, the five rows articles named
//     by their actor and verb, and the covered feed is pruned
{
  const p = fresh();
  p.open();
  const nodes = (() => {
    const walk = (n: { role: string; name?: string; children: unknown[] }): { role: string; name?: string }[] => [
      { role: n.role, name: n.name },
      ...(n.children as { role: string; name?: string; children: unknown[] }[]).flatMap(walk),
    ];
    return walk(snapshot(p.root) as never);
  })();
  check("the screen is a region named Notifications", nodes.some((n) => n.role === "region" && n.name === "Notifications"), true);
  check("the back control is a button named Back", nodes.some((n) => n.role === "button" && n.name === "Back"), true);
  check(
    "the five rows are articles named by their actor and verb",
    ROWS.every((row) => nodes.some((n) => n.role === "article" && n.name === `${row.actor} ${row.verb}`)),
    true,
  );
  check("the feed's own cards are not nodes of the tree (they have no role)", nodes.some((n) => n.name === "Titania"), false);
  console.log(`solid/notify.test.ts: ${nodes.length} nodes: ${nodes.filter((n) => n.name).map((n) => `${n.role} "${n.name}"`).join(", ")}`);
}

// --- the two deliberate breaks, as asserts: the verbs swapped (the frame is not the stored one) and the rows never
//     registered as stops (Tab does not reach one)
{
  const p = fresh({ mutate: "verbs" });
  p.open();
  check("the verbs' break draws one wrong verb on every row", [p.texts().filter((s) => s.includes("liked your post")).length, p.texts().includes("Titania reposted")], [5, false]);
  check(
    "... and the frame is not the stored one",
    ui.diffPng(
      new URL("./frames/notify-initial.png", import.meta.url).pathname,
      new URL("./frames/notify-initial.png.actual.png", import.meta.url).pathname,
    ) > 0,
    true,
  );
  const q = fresh({ mutate: "rows" });
  q.open();
  q.tap("Tab");
  check("the rows' break has no row as a Tab stop", [q.input.focus.focused(), q.input.focus.tabOrder().some((id) => id.startsWith("sky-notify-card-"))], ["sky-tabs-tab-0", false]);
  console.log("solid/notify.test.ts: the breaks: five wrong verbs (the stored frame fails), the rows out of the Tab order");
}

dispose();
if (failed) process.exit(1);
console.log(
  "solid/notify.test.ts: the app's five notifications as the page's fourth screen — the recordings' actors, texts and " +
    "times under the app's verbs, `n` on the feed, the rows in document order with the ring, Tab and its wrap, Enter on " +
    "a post's thread and on a follow's nothing, Escape and the back control and a tab back to the feed's frame, the " +
    "entry and reduced motion, the a11y tree, the stored frame, and the two breaks",
);
process.exit(0);
