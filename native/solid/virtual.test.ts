// The window (src/virtual.ts) on its own and on the two scrolling pages with more data than a screen: 1,000 fixed rows
// and 200 cards of mixed height. What a stored frame cannot show: only the window's items are declared (the rest are two
// spacers), the clamp and the thumb read the whole content, a row the window left behind is declared as a range of its
// own (the segments), the keyboard's reveal works for a row outside the window, a feed is measured once and then
// virtualized (the whole column on one frame, its end exact from the next), and a frame's declare costs what the window
// holds, not what the list or the feed holds.
import "./plugin.ts";

const { ui } = await import("./src/ffi.ts");
const { createFrame } = await import("./src/frame.ts");
const { createInput } = await import("./src/input.ts");
const { El, render } = await import("./src/renderer.ts");
const { rubber, setReducedMotion } = await import("./src/motion.ts");
const { fixedWindow, measuredWindow, segments, SPACER } = await import("./src/virtual.ts");
const { List } = await import("./app/List.tsx");
const { Sky, synthetic } = await import("./app/Sky.tsx");

ui.init(360, 760);
ui.font(new URL("../vendor/fonts/Roboto-Regular.ttf", import.meta.url).pathname);

let failed = 0;
const check = (what: string, got: unknown, want: unknown) => {
  const [a, b] = [JSON.stringify(got), JSON.stringify(want)];
  if (a !== b) failed++, console.error(`FAIL ${what}: ${a}, wanted ${b}`);
};
const fixed = (x: number) => Math.round(x * 100) / 100;
const near = (got: number, want: number, d = 0.01) => Math.abs(got - want) <= d;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

// --- the fixed window: the arithmetic, the gap-compensated spacers, and the real content (all the rows, not the subset)
{
  const at = (offset: number) => fixedWindow({ offset, view: 240, count: 1000, item: 28, gap: 2, overscan: 1 });
  check("1,000 rows of 28 with a 2px gap are 29,998px of content", at(0).content, 29998);
  const top = at(0);
  check("at the top the window starts at row 0", [top.first, top.last], [0, 8]);
  check("no spacer above, and the rest of the list below", [top.above, top.below], [0, (999 - 8) * 30 - 2]);
  const mid = at(1000);
  check("1,000px down, row 33 is at the viewport's top", [mid.first, mid.last], [32, 42]);
  check("its top spacer is 32 slots less a gap", mid.above, 32 * 30 - 2);
  const end = at(29758);
  check("at the end the last row is declared", [end.first, end.last], [990, 999]);
  check("and no spacer below", [end.above, end.below], [990 * 30 - 2, 0]);
  // the spacers and the declared block are the content: 1,000 rows' worth, whatever the window shows
  const laid = (w: typeof top, visible: number) =>
    w.above + (w.above ? 2 : 0) + (visible * 28 + (visible - 1) * 2) + (w.below ? 2 : 0) + w.below;
  for (const [w, visible] of [[top, 9], [mid, 11], [end, 10]] as const)
    check(`the spacers reproduce the layout at ${w.first}`, laid(w, visible), 29998);
  // a viewport taller than the content: every row, no spacers, the content unchanged
  const fits = fixedWindow({ offset: 0, view: 1000, count: 30, item: 28, gap: 2 });
  check("a viewport that holds everything declares everything", [fits.first, fits.last, fits.above, fits.below], [0, 29, 0, 0]);
  check("and the content is still the whole list", fits.content, 898);
}

// --- the measured window: the cache, the same spacer arithmetic, and the measuring pass (until every height is in, the
//     whole column is declared)
{
  // all measured: 100, 300, 100 in a column of 8px gaps (the tops 0, 108, 416), a 100px window at 120
  const seen: (number | undefined)[] = [100, 300, 100];
  const w = measuredWindow({ offset: 120, view: 100, count: 3, heights: seen, gap: 8, overscan: 0 });
  check("the content is every card and every gap: 516", w.content, 516);
  check("a window of the middle card", [w.first, w.last], [1, 1]);
  check("its top spacer is the card above, less the gap", w.above, 100);
  check("and its bottom spacer is the card below, less the gap", w.below, 100);
  check("the spacers and the card are the content", w.above + 8 + 300 + 8 + w.below, 516);
  // one height missing: the whole column is declared, so the page measures it this frame, and the mean places the unseen
  // one (100 + 200 + 300 = 600 of cards, 516 of content) until then
  const hole: (number | undefined)[] = [100, undefined, 300];
  const pass = measuredWindow({ offset: 120, view: 100, count: 3, heights: hole, gap: 8, overscan: 0 });
  check("with a height unknown the whole column is declared", [pass.first, pass.last], [0, 2]);
  check("and no spacer stands in for anything", [pass.above, pass.below], [0, 0]);
  check("the content is the estimate: the mean 200 in the hole", pass.content, 616);
  // nothing measured yet: the constant fallback, and the whole column declared
  const empty = measuredWindow({ offset: 0, view: 0, count: 3, heights: [], gap: 8 });
  check("with nothing measured, 190px a card", empty.content, 3 * 190 + 2 * 8);
  check("and the first layout declares every one of them", [empty.first, empty.last], [0, 2]);
  // the measured window over 200 cards: the visible ones plus the overscan, never the feed
  const feed = Array.from({ length: 200 }, (_unused, i) => 150 + (i % 5) * 20);
  const mid = measuredWindow({ offset: 8000, view: 664, count: 200, heights: feed, gap: 8 });
  check("a feed of 200 declares at most ten cards", mid.last - mid.first + 1, 8);
  check("the content is every card and every gap", mid.content, sum(feed) + 199 * 8);
}

// --- the segments: the window's cells, an extra index outside it (a selection the scroll left behind), and the spacers
//     that keep the column the whole list's
{
  const w = fixedWindow({ offset: 1000, view: 240, count: 1000, item: 28, gap: 2, overscan: 1 });
  const plain = segments(w, { count: 1000, slot: 30, gap: 2 });
  check("without an extra index: the spacer, the window's rows, the spacer", [plain.cells[0], plain.cells.at(-1)], [SPACER.above, SPACER.below]);
  check("and its cells are the window's, framed by the two spacers", plain.cells.length, w.last - w.first + 3);
  const above = segments(w, { count: 1000, slot: 30, gap: 2, extra: 0 });
  check(
    "an extra index above the window: row 1 first (no top spacer at the top), then a spacer to the window",
    [above.cells[0], above.above, above.middle, above.below],
    [0, 0, (w.first - 1) * 30 - 2, plain.below],
  );
  const below = segments(w, { count: 1000, slot: 30, gap: 2, extra: 999 });
  check(
    "and below it: the window, a spacer, the last row, no bottom spacer",
    [below.cells.at(-1), below.middle, below.below],
    [999, (999 - w.last - 1) * 30 - 2, 0],
  );
  // the column's height is the content's, however the extra index is placed (each box plus the gaps between them)
  const laid = (s: ReturnType<typeof segments>) => {
    const heights = s.cells.map((c) => (c === SPACER.above ? s.above : c === SPACER.middle ? s.middle : c === SPACER.below ? s.below : 28));
    return sum(heights) + (heights.length - 1) * 2;
  };
  check("the segments are the whole 29,998px of content", [laid(plain), laid(above), laid(below), w.content], [29998, 29998, 29998, 29998]);
  // an extra index beside the window needs no spacer (a zero-height box would add its gap), and one inside it is no extra
  const beside = segments(w, { count: 1000, slot: 30, gap: 2, extra: w.first - 1 });
  check("an extra row adjacent to the window: no middle spacer", [beside.cells.includes(SPACER.middle), beside.middle], [false, 0]);
  check("and the column is still the content's", laid(beside), 29998);
  const inside = segments(w, { count: 1000, slot: 30, gap: 2, extra: w.first + 1 });
  check("an extra index inside the window changes nothing", inside.cells, plain.cells);
}

let dispose = () => {};
const find = (pred: (el: El) => boolean, from: El): El[] =>
  from.children.flatMap((c) => (c instanceof El ? [...(pred(c) ? [c] : []), ...find(pred, c)] : []));
const ids = (root: El, prefix: string) =>
  find((el) => typeof el.props.id === "string" && el.props.id.startsWith(prefix), root).map(
    (el) => el.props.id as string,
  );

/** The List's page, as list.test.ts drives it: the host's frame loop, the page's motion hook, the pointer where the
 *  wheel needs it. */
function listPage(count: number) {
  dispose();
  const root = new El("root");
  const input = createInput();
  const motion: {
    onWheel?: (dx: number, dy: number) => void;
    onPointer?: (x: number, y: number, down: boolean, touch: boolean) => void;
    tick?: (dt: number) => void;
  } = {};
  const stats: [number, number, number, number][] = [];
  dispose = render(() => List({ input, motion, count }), root);
  const frame = createFrame(root, {
    onPressMiss: () => input.pressMiss(),
    onWheel: (dx, dy) => motion.onWheel?.(dx, dy),
    onPointer: (x, y, down, touch) => motion.onPointer?.(x, y, down, touch),
    tick: (dt) => motion.tick?.(dt),
    stats,
  });
  const step = (render = true) => frame(180, 160, false, 1 / 60, render);
  step();
  ui.scrollTo("list", 0);
  step();
  for (let i = 0; i < 30; i++) step();
  const view = () => [...(ui.bounds(Buffer.from("list")) ?? [])];
  return {
    input,
    step,
    settle(n = 120) {
      for (let i = 0; i < n; i++) step();
    },
    /** One wheel notch a rest later: the track's own 10px, not a flick. */
    notch(n = 1) {
      motion.onWheel?.(0, -n);
      step();
      step();
    },
    tap(name: string) {
      input.down(name);
      step();
      input.up(name);
      step();
    },
    offset: () => ui.scrollOffset("list"),
    scrolled: () => -ui.scrollOffset("list"),
    view,
    box: (id: string) => [...(ui.bounds(Buffer.from(id)) ?? [])],
    row: (i: number) => [...(ui.bounds(Buffer.from(`row-${i}`)) ?? [])],
    rows: () => ids(root, "row-"),
    thumb: () => [...(ui.bounds(Buffer.from("list-thumb")) ?? [])],
    /** The declare and tick cost of `n` frames at rest, ms a frame. */
    cost(n = 300) {
      stats.length = 0;
      for (let i = 0; i < n; i++) step(false);
      return {
        declare: sum(stats.map((s) => s[1]!)) / n / 1e6,
        tick: sum(stats.map((s) => s[0]!)) / n / 1e6,
        layout: sum(stats.map((s) => s[2]!)) / n / 1e6,
        rows: ids(root, "row-").length,
      };
    },
  };
}

// --- the List with 1,000 rows: the top, 1,000px down and the exact end; a window of at most twelve boxes, the rows where
//     the whole list would have put them, the thumb from the real content, and the reveal of a row outside the window
{
  const p = listPage(1000);
  const view = p.view();
  check("the viewport is still 240", view[3], 240);
  check("at the top nine rows are declared, not 1,000", p.rows().length, 9);
  check("and they are the first ones", p.row(0).length, 4);
  check("the first row is at the viewport's top", p.row(0)[1], view[1]);
  const below = p.box("list-below");
  check("the bottom spacer carries the rest: the content ends at 29,998", below[1]! + below[3]! - view[1]!, 29998);

  // 1,000px down: 100 notches a rest apart (the track's own 10px each)
  for (let i = 0; i < 100; i++) p.notch(1);
  p.settle();
  check("100 notches are 1,000px", p.offset(), -1000);
  // the window is eleven rows (32..42) and the selection's own range (row 1, 1,000px above the viewport): the wheel does
  // not move the selection, and the row is declared all the same
  check("the window is eleven rows, 32..42, and the selection's row 0", p.rows().length, 12);
  check("row 0 is declared above the viewport", [p.row(0)[1]! < view[1]!, p.row(0)[1]! + 28 < view[1]!], [true, true]);
  check("and row 1, which a spacer stands in for, is not", p.row(1).length, 0);
  check("row 33 is at the viewport's top", fixed(p.row(33)[1]! - view[1]!), 990 - 1000);
  check("row 32 is the overscan above it", p.row(32).length, 4);
  check("and row 31 is not declared at all", p.row(31).length, 0);
  // the thumb: 240²/29,998 is under its 24px floor, and its travel starts 1,000/29,758 of the way down
  const height = Math.max(24, (view[3]! * view[3]!) / 29998);
  const travel = view[3]! - height;
  check("the thumb is the content's: max(24, 240²/29,998)", fixed(p.thumb()[3]!), fixed(height));
  check("and its top is 1,000/29,758 of its travel", fixed(p.thumb()[1]! - view[1]!), fixed((1000 / 29758) * travel));

  // the keyboard: Tab focuses the list and reveals row 1 (0) from 1,000px down — a row outside the window, so its place
  // is the window's arithmetic, and the offset eases back to the top
  p.tap("Tab");
  p.settle();
  check("the reveal of row 1 from 1,000px down comes back to the top", p.offset(), 0);
  check("with row 1 at the viewport's top", p.row(0)[1], view[1]);
  // and a row just outside the window: the wheel down again, then a Down — row 2's place is 30, not a bounds lookup
  for (let i = 0; i < 100; i++) p.notch(1);
  p.settle();
  p.tap("ArrowDown");
  p.settle();
  check("Down at 1,000px down reveals row 2 at 30", p.offset(), -30);
  check("with row 2 at the viewport's top", p.row(1)[1], view[1]);

  // the end: End selects row 1,000 and reveals it, 29,998 - 240, with no row beyond
  p.tap("End");
  p.settle(200);
  check("End reaches the exact end: 29,758", p.offset(), -29758);
  check("the window is ten rows at the end", p.rows().length, 10);
  check("the last row is declared, its bottom on the viewport's", p.row(999)[1]! + p.row(999)[3]!, view[1]! + view[3]!);
  check("and the row above it too", p.row(998).length, 4);
  check("while row 989 is not", p.row(989).length, 0);
  check("the thumb's bottom is the viewport's bottom", fixed(p.thumb()[1]! + p.thumb()[3]!), fixed(view[1]! + view[3]!));
  p.tap("End");
  p.settle();
  check("End at the end stays there", p.offset(), -29758);
  // the band: four notches past the end, the same f(40) of the 240px viewport, and the exact clamp again
  for (let i = 0; i < 4; i++) p.notch(1);
  check(
    "a wheel past the end pulls the band by f(40) of 240",
    fixed(p.scrolled()),
    fixed(29758 + rubber(40, 240)),
  );
  p.settle(200);
  check("and the band lets go onto the exact end", p.offset(), -29758);
  p.tap("Home");
  p.settle(200);
  check("Home comes back to 0", p.offset(), 0);
}

// --- the cost: a frame with 1,000 rows declares what the window holds, so its declare is the 30-row page's
{
  const small = listPage(30);
  const a = small.cost();
  const big = listPage(1000);
  const b = big.cost();
  console.log(
    `solid/virtual.test.ts: the List, 30 rows: declare ${a.declare.toFixed(3)} ms, tick ${a.tick.toFixed(3)}, ` +
      `layout ${a.layout.toFixed(3)}; 1,000 rows: declare ${b.declare.toFixed(3)}, tick ${b.tick.toFixed(3)}, ` +
      `layout ${b.layout.toFixed(3)}`,
  );
  check("30 rows and 1,000 rows both declare the top window's nine boxes", [a.rows, b.rows], [9, 9]);
  check(
    "1,000 rows cost a declare close to 30's: the window is what is declared",
    b.declare < Math.max(a.declare * 4, a.declare + 0.3),
    true,
  );
}

// --- the Sky with 200 cards: mixed heights, measured once in a single frame and then virtualized (the window small, the
//     content's end and the thumb exact and still), the end of the feed reached with End
type SkyPage = ReturnType<typeof skyPage>;
/** Are the declared cards in the order and 8px apart? (Their heights differ, so each card's own height is in the step.) */
const stacked = (p: SkyPage, list: number[]) =>
  list.slice(1).every((i, k) => near(p.card(i)[1]! - p.card(list[k]!)![1]! - p.card(list[k]!)![3]!, 8));

function skyPage(posts: readonly ReturnType<typeof synthetic>[number][], opts: { frames?: number } = {}) {
  dispose();
  const root = new El("root");
  const input = createInput();
  const motion: {
    onWheel?: (dx: number, dy: number) => void;
    onPointer?: (x: number, y: number, down: boolean, touch: boolean) => void;
    tick?: (dt: number) => void;
  } = {};
  const stats: [number, number, number, number][] = [];
  dispose = render(() => Sky({ input, motion, posts }), root);
  const frame = createFrame(root, {
    onPressMiss: () => input.pressMiss(),
    onWheel: (dx, dy) => motion.onWheel?.(dx, dy),
    onPointer: (x, y, down, touch) => motion.onPointer?.(x, y, down, touch),
    tick: (dt) => motion.tick?.(dt),
    stats,
  });
  const step = (render = true) => frame(180, 300, false, 1 / 60, render);
  step();
  ui.scrollTo("sky-feed", 0);
  // a page at rest is 61 frames later (the cards' entry is over); a caller counting the measuring pass asks for fewer
  for (let i = 1; i < (opts.frames ?? 62); i++) step();
  const feed = () => [...(ui.bounds(Buffer.from("sky-feed")) ?? [])];
  return {
    input,
    step,
    settle(n = 120) {
      for (let i = 0; i < n; i++) step();
    },
    tap(name: string) {
      input.down(name);
      step();
      input.up(name);
      step();
    },
    /** Two Tabs: the tablist, then the feed. */
    focusFeed() {
      this.tap("Tab");
      this.tap("Tab");
    },
    offset: () => -ui.scrollOffset("sky-feed"),
    feed,
    box: (id: string) => [...(ui.bounds(Buffer.from(id)) ?? [])],
    card: (i: number) => [...(ui.bounds(Buffer.from(`sky-card-${i}`)) ?? [])],
    cards: () => ids(root, "sky-card-").map((id) => Number(id.slice("sky-card-".length))),
    thumb: () => [...(ui.bounds(Buffer.from("sky-thumb")) ?? [])],
    stats,
    cost(n = 300) {
      stats.length = 0;
      for (let i = 0; i < n; i++) step(false);
      return {
        declare: sum(stats.map((s) => s[1]!)) / n / 1e6,
        tick: sum(stats.map((s) => s[0]!)) / n / 1e6,
        layout: sum(stats.map((s) => s[2]!)) / n / 1e6,
        cards: ids(root, "sky-card-").length,
      };
    },
  };
}

{
  const posts = synthetic(200);
  const p = skyPage(posts);
  const feed = p.feed();
  check("the feed is still the phone's 664", feed[3], 664);
  check("at the top the window is at most ten cards", p.cards().length <= 10, true);
  check("and it starts at the first card", p.cards()[0], 0);
  const first = p.cards();
  const heights = first.map((i) => p.card(i)[3]!);
  check("the cards' heights differ: the feed is not a list", new Set(heights).size > 1, true);
  check("with an 8px gap between declared cards", stacked(p, first), true);
  const top = first.map((i) => p.card(i)[1]! - feed[1]!);
  console.log(`solid/virtual.test.ts: 200 cards, the top window ${first.join(",")} at y ${top.map(fixed).join(",")} of 664`);

  // the measuring pass: no card's height is known on the first frame, so the whole feed is declared (200 cards, one
  // frame) and the frame after it has every height — from then on the content, the end and the thumb are exact and do not
  // move as cards are seen again. The fallback is only the estimate those first frames read
  const mount = skyPage(posts, { frames: 1 });
  check("the first frame declares the whole feed: nothing is measured yet", mount.cards().length, 200);
  const declare = mount.stats[0]![1]! / 1e6;
  console.log(`solid/virtual.test.ts: the measuring pass declares 200 cards on one frame: ${declare.toFixed(3)} ms`);
  const pass = skyPage(posts, { frames: 2 });
  check("the frame after it is the window again: measure once, then virtualize", pass.cards().length <= 10, true);
  /** The feed's real content height, from the last frame's boxes: its last block's bottom, plus the 12px under it, in the
   *  content's own coordinates (the bounds are drawn ones, so the offset is added back). */
  const contentOf = (page: SkyPage, last = -1) => {
    const f = page.feed();
    const b = last < 0 ? page.box("sky-below") : page.card(last);
    return b[1]! - f[1]! + b[3]! + page.offset() + 12;
  };
  const content0 = contentOf(pass);
  const thumb0 = pass.thumb()[3]!;
  console.log(`solid/virtual.test.ts: the feed's content is ${fixed(content0)} on the pass's frame, its thumb ${fixed(thumb0)}`);
  // to the end: every card measured and seen, and the end is the one the pass's frame already had
  const e = skyPage(posts, { frames: 2 });
  e.focusFeed();
  e.tap("End");
  e.settle(200);
  check("End lands on the content's end", fixed(e.offset()), fixed(content0 - e.feed()[3]!));
  check("and the last card's bottom is that content's end", fixed(contentOf(e, 199)), fixed(content0));
  check(
    "the thumb is the same height: max(24, view²/content)",
    fixed(thumb0),
    fixed(Math.max(24, (e.feed()[3]! * e.feed()[3]!) / content0)),
  );

  // 20 PageDowns: a jump into the middle of the feed, on the keys' own frame (reduced motion)
  setReducedMotion(true);
  const q = skyPage(posts);
  q.focusFeed();
  for (let i = 0; i < 20; i++) q.tap("PageDown");
  const jumped = q.offset();
  check("twenty viewports down: 13,280", jumped, 13280);
  const seen = q.cards();
  check("the window there is at most ten cards", seen.length <= 10, true);
  check("none of them was ever declared at the top", seen.every((i) => !first.includes(i)), true);
  const onScreen = seen.filter((i) => {
    const b = q.card(i);
    return b.length === 4 && b[1]! + b[3]! > q.feed()[1]! && b[1]! < q.feed()[1]! + q.feed()[3]!;
  });
  check("the cards at the place the keys jumped to are on the screen", onScreen.length >= 3, true);
  const shown = seen.map((i) => q.card(i)[3]!);
  check("their heights are a card's, not zero", shown.every((h) => h > 100 && h < 400), true);
  q.settle(6);
  check("and the window is the same one once they are drawn: every height is known", q.cards(), seen);
  check("with the same 8px gaps at the real heights", stacked(q, seen), true);
  setReducedMotion(false);

  // the end: End, and the last card is shown at the bottom padding, the thumb on the feed's bottom
  const r = skyPage(posts);
  r.focusFeed();
  r.tap("End");
  r.settle(200);
  const end = r.offset();
  const endCards = r.cards();
  check("End reaches the content's end", end > 0, true);
  check("the last card is declared there", endCards.includes(199), true);
  check(
    "and its bottom is the feed's bottom, less the 12px padding",
    fixed(r.card(199)[1]! + r.card(199)[3]! - r.feed()[1]!),
    664 - 12,
  );
  check("the window at the end is at most ten cards", endCards.length <= 10, true);
  const thumb = r.thumb();
  check("the thumb's bottom is the feed's bottom", fixed(thumb[1]! + thumb[3]!), 760 - 32);
  check(
    "and its height is the content's: 664²/(end + 664)",
    fixed(thumb[3]!),
    fixed(Math.max(24, (r.feed()[3]! * r.feed()[3]!) / (end + r.feed()[3]!))),
  );
  console.log(
    `solid/virtual.test.ts: 200 cards, End at ${fixed(end)}, the last card's bottom ` +
      `${fixed(r.card(199)[1]! + r.card(199)[3]! - r.feed()[1]!)} of the 664, ` +
      `the window ${endCards.length} cards, the thumb ${fixed(thumb[3]!)} tall`,
  );

  // the cost: 200 cards declare what 3 do, within a small factor
  const few = skyPage(posts.slice(0, 3));
  const a = few.cost();
  const many = skyPage(posts);
  const b = many.cost();
  console.log(
    `solid/virtual.test.ts: the Sky, 3 cards: declare ${a.declare.toFixed(3)} ms, tick ${a.tick.toFixed(3)}, ` +
      `layout ${a.layout.toFixed(3)}; 200 cards: declare ${b.declare.toFixed(3)}, tick ${b.tick.toFixed(3)}, ` +
      `layout ${b.layout.toFixed(3)}`,
  );
  check("3 cards declare three boxes and 200 declare six", [a.cards, b.cards], [3, 6]);
  check("200 cards cost a declare close to 3's", b.declare < Math.max(a.declare * 6, a.declare + 0.3), true);
}

dispose();
if (failed) process.exit(1);
console.log(
  "solid/virtual.test.ts: the fixed and the measured window (the arithmetic, the spacers are the content), the segments " +
    "(a selection's own range outside the window, and the column still the whole list's), 1,000 rows at the top, 1,000px " +
    "down and the exact end (nine to eleven declared boxes plus the selection's, the rows in their places, the thumb " +
    "from 29,998), the reveal of a row outside the window, 200 cards of mixed height (one measuring frame that declares " +
    "them all, then a small window, the content's end and the thumb exact and still), and a frame's declare cost that " +
    "follows the window, not the data",
);
process.exit(0);
