// What the stored frames of the List page cannot show: the page's own track moving the viewport's offset and the rows
// with it (a notch glides 10px, a flick decays to the clamp), the clamps at both ends and the rubber band past them (its
// resistance, its 80ms hold and its return), the viewport's clip (a selected row's fill cut at the edge, not drawn above
// it), the keyboard selection easing the row into view on the same track, the selection staying in 0..29, the wheel and
// the drag leaving the selection alone (the drag never selects) and the selected row it leaves behind still declared as a
// range of its own, held pointer dragging the viewport 1:1 and its release flinging, reduced motion's hard clamp and
// instant keys, the page's first-mount entry (the root's subtree rising and fading in, once, with the layout still), the
// header and footer staying put, and the page fitting. The wide page adds the horizontal axis of the same machine: a dx
// notch gliding 10px and settling, a flick to the horizontal clamp, the horizontal bar's width and left at the start, the
// middle and the end, a 1:1 drag on that bar, both bars at once with the vertical one inset above the horizontal one, and
// the default page's frames still byte-identical (they are `test.sh`'s comparisons). Driven as the window does it: pointer
// and wheel in, then a frame.
import "./plugin.ts";

const { ui } = await import("./src/ffi.ts");
const { createFrame } = await import("./src/frame.ts");
const { createInput } = await import("./src/input.ts");
const { El, render, Txt } = await import("./src/renderer.ts");
const { rubber, setReducedMotion } = await import("./src/motion.ts");
const { List, s, size } = await import("./app/List.tsx");

ui.init(size.width, size.height);
ui.font(new URL("../vendor/fonts/Roboto-Regular.ttf", import.meta.url).pathname);

let failed = 0;
const check = (what: string, got: unknown, want: unknown) => {
  const [a, b] = [JSON.stringify(got), JSON.stringify(want)];
  if (a !== b) failed++, console.error(`FAIL ${what}: ${a}, wanted ${b}`);
};
/** Floating point from layout or a track, to the pixel. */
const fixed = (x: number) => Math.round(x * 100) / 100;

const PAGE = [16, 18, 24]; // the page token of the dark theme
const SURFACE = [36, 40, 52]; // the selected row's fill
const RING = [90, 170, 255]; // the focus ring
const MUTED = [150, 155, 170]; // the muted token: the scrollbar's thumb
const END = 658; // the content's end: 898 of rows in a 240 viewport
/** Is a colour the token, within a channel or two (the renderer's own rounding)? */
const same = (c: number[], t: number[], d = 1) => c.length === 3 && t.every((v, i) => Math.abs(c[i]! - v) <= d);
/** Is a colour strictly between two others, channel by channel (a fade's mid frame)? */
const between = (c: number[], a: number[], b: number[]) =>
  c.length === 3 &&
  c.join() !== a.join() &&
  c.join() !== b.join() &&
  c.every((v, i) => v >= Math.min(a[i]!, b[i]!) && v <= Math.max(a[i]!, b[i]!));

let dispose = () => {};
/** A fresh page, the host's frame loop over it, and the entry's 0.25s over unless `entry` asks for it running. */
function fresh(opts: { entry?: boolean; wide?: boolean } = {}) {
  dispose();
  const root = new El("root");
  const input = createInput();
  // the page's frame hook, as main.ts wires it: the page's scroll takes the wheel, the pointer's drag, and one tick a frame
  const motion: {
    onWheel?: (dx: number, dy: number) => void;
    onPointer?: (x: number, y: number, down: boolean, touch: boolean) => void;
    tick?: (dt: number) => void;
  } = {};
  dispose = render(() => List({ input, motion, wide: opts.wide }), root);
  const frame = createFrame(root, {
    onPressMiss: () => input.pressMiss(),
    onWheel: (dx, dy) => motion.onWheel?.(dx, dy),
    onPointer: (x, y, down, touch) => motion.onPointer?.(x, y, down, touch),
    tick: (dt) => motion.tick?.(dt),
  });
  let at = [-1, -1];
  const step = (down = false, touch = false) => frame(at[0]!, at[1]!, down, 1 / 60, true, touch);
  // frame 0 lays out, frame 1 is the one a page at rest shows when the caller wants to look at its first two frames
  step();
  step();
  // the entry settles in ~0.4s: 30 frames is past it, and every other block wants a page at rest
  if (!opts.entry) for (let i = 0; i < 30; i++) step();

  const find = (pred: (el: El) => boolean, from: El = root): El[] =>
    from.children.flatMap((c) => (c instanceof El ? [...(pred(c) ? [c] : []), ...find(pred, c)] : []));
  const text = (el: El): string => el.children.map((c) => (c instanceof Txt ? c.text : text(c))).join("");
  const box = (id: string) => [...(ui.bounds(Buffer.from(id)) ?? [])];
  const pixel = (x: number, y: number) => ui.pixel(Math.floor(x), Math.floor(y)).slice(0, 3);
  /** The header's readout: "Room A1 — 1 of 30". */
  const readout = () => find((el) => el.tag === "text").map(text).find((t) => / of 30$/.test(t))!;
  /** The selection the readout shows, 1-based. */
  const selected = () => Number(/— (\d+) of 30$/.exec(readout())![1]);

  return {
    input,
    box,
    pixel,
    readout,
    selected,
    step,
    /** `n` frames with nothing in: a motion's settle. */
    settle(n = 60) {
      for (let i = 0; i < n; i++) step();
    },
    /** A pointer drag on the viewport: a press at x 180 (or x, for the scrollbar's thumb), then a frame a dy with the
     *  button held, then the release. Returns the offset each held frame presented (positive down), so a test can follow
     *  the pointer exactly. `touch` marks the frames as a finger's. */
    drag(y: number, dys: number[], x = 180, touch = false) {
      at = [x, y];
      step(false, touch);
      step(true, touch);
      const held: number[] = [];
      for (const dy of dys) {
        at = [x, (y += dy)];
        step(true, touch);
        held.push(-ui.scrollOffset("list"));
      }
      step(false, touch);
      return held;
    },
    /** The same on the horizontal bar: a press at x, y, then a frame an dx with the button held, then the release.
     *  Returns the horizontal offset (positive right) each held frame presented. */
    dragX(x: number, dxs: number[], y: number) {
      at = [x, y];
      step(false);
      step(true);
      const held: number[] = [];
      for (const dx of dxs) {
        at = [(x += dx), y];
        step(true);
        held.push(-ui.scrollOffsetX("list"));
      }
      step(false);
      return held;
    },
    /** The view's top and height, the offset Clay keeps: a row's top is its own plus this. */
    view: () => box("list"),
    /** The scrollbar's thumbs, from the last frame's layout. */
    thumb: () => box("list-thumb"),
    thumbX: () => box("list-thumb-x"),
    offset: () => ui.scrollOffset("list"),
    /** The offset positive down, as the page's track says it. */
    scrolled: () => -ui.scrollOffset("list"),
    /** The horizontal offset positive right. */
    offsetX: () => ui.scrollOffsetX("list"),
    scrolledX: () => -ui.scrollOffsetX("list"),
    /** Puts the pointer at x, y and lays out a frame: `ui.bounds` and Clay's "what is under it" follow. */
    point(x: number, y: number) {
      at = [x, y];
      step();
    },
    /** One wheel event of `n` notches (positive down) and a frame: n > 1 in one frame is a burst, and the track flings. */
    notch(n = 1) {
      motion.onWheel?.(0, -n);
      step();
    },
    /** One wheel event of `n` horizontal notches (positive right) and a frame. */
    notchX(n = 1) {
      motion.onWheel?.(-n, 0);
      step();
    },
    /** `n` notches down over the viewport, each a frame and then a frame of rest as the host's scripted `--wheel` does
     *  it: a run of notches 60Hz apart is a flick and flings, a notch a rest apart is the 10px step. */
    wheel(n: number) {
      this.point(180, 160);
      for (let i = 0; i < n; i++) this.notch(1), this.step();
    },
    /** The same, up. */
    wheelUp(n: number) {
      this.point(180, 160);
      for (let i = 0; i < n; i++) this.notch(-1), this.step();
    },
    /** `n` horizontal notches to the right, each a frame and then a frame of rest (the notches' own 10px each). */
    wheelX(n: number) {
      this.point(180, 160);
      for (let i = 0; i < n; i++) this.notchX(1), this.step();
    },
    /** A key pressed and released with a frame after each. */
    tap(name: string) {
      input.down(name);
      step();
      input.up(name);
      step();
    },
    /** A row's box, from the last frame. */
    row: (i: number) => box(`row-${i}`),
  };
}

// --- the page: one clip element of 240, thirty rows of 28 in a column of 30, the header and the footer outside it
{
  const p = fresh();
  const view = p.view();
  check("the viewport is 240 tall", view[3], 240);
  check("and one page wide", [view[0], view[2]], [40, 280]);
  const first = p.row(0);
  check("the first row is at the viewport's top", first[1], view[1]);
  check("a row is 28 tall", first[3], 28);
  // the window: only the rows it declares are in the tree, and the bottom spacer carries the content's real end
  check("the window declares the rows it shows and no more: row 29 is not there", p.row(29).length, 0);
  const below = p.box("list-below");
  check("the bottom spacer puts the content's end at 30 * 30 - 2", below[1]! + below[3]! - view[1]!, 898);
  check("a row is as wide as the viewport", first[2], view[2]);
  const root = p.box("Root");
  check("the page is the window wide", [root[0], root[2]], [0, size.width]);
  const foot = p.box("list-foot");
  check("and its last line and the 24px padding fit the height", foot[1]! + foot[3]! + 24 <= size.height, true);
  check("the viewport is not shrunk by the window", view[3], 240);
  check("nothing is focused at first", p.input.focus.focused(), null);
  check("and nothing is scrolled", p.offset(), 0);
}

// --- the page's first mount (src/entry.ts): the root's subtree starts 8px low and at 0 alpha and rises and fades in over
//     0.25s, once. The fourth frame is frames/list-entry.png (main.ts --settle 3); the page is a blend with its own colour
//     there and the selected row is still lighter than the page, and by rest both are their literals. Nothing in the
//     layout moves: the two fields are the renderer's group, not a re-layout
{
  const p = fresh({ entry: true });
  const view = p.view();
  const boxes = () => [p.box("Root"), view, p.row(0), p.box("list-head"), p.box("list-foot")];
  const early = boxes(); // two frames in
  const page = () => p.pixel(20, 30); // the page's own colour, left of the content's 40px padding
  const rowFill = () => p.pixel(view[0]! + 1, p.row(0)[1]! + 14); // the selected row's fill, at its left edge
  p.step();
  p.step(); // four frames in: the third and fourth of the entry's clock
  const midPage = page();
  const midRow = rowFill();
  check("four frames in, the page is a blend of its colour and the ground, not the literal", midPage.join() !== PAGE.join() && midPage.every((v, i) => v > 0 && v < PAGE[i]!), true);
  check("and the selected row is still lighter than it", midRow[0]! > midPage[0]! && midRow[1]! > midPage[1]!, true);
  check("the layout does not move during the entry", boxes(), early);
  check(
    "the frame is frames/list-entry.png",
    ui.diffPng(
      new URL("./frames/list-entry.png", import.meta.url).pathname,
      new URL("./frames/list-entry.png.actual.png", import.meta.url).pathname,
    ),
    0,
  );
  p.settle(30);
  check("by rest the page is the literal", page(), PAGE);
  check("and the selected row is its surface", rowFill(), SURFACE);
  check("with the boxes where they were", boxes(), early);
  console.log(`solid/list.test.ts: the entry four frames in: the page ${midPage.join("/")} of ${PAGE.join("/")}, the row ${midRow.join("/")} of ${SURFACE.join("/")}`);
  // reduced motion: no entry at all — the first frame is the settled one
  setReducedMotion(true);
  const r = fresh({ entry: true });
  check("reduced motion has no entry: the first frame is the literal", r.pixel(20, 30), PAGE);
  setReducedMotion(false);
}

// --- the drag: a press inside the viewport grabs the page's offset and the pointer moves it 1:1 from the press point;
//     the release hands the last frames' speed to a decay (a flick), and past an end the same rubber resists the drag
//     and lets go at the release. The drag never selects: the List's selection is the keyboard's
{
  const p = fresh();
  const view = p.view();
  const held = p.drag(160, [-10, -10, -10]);
  check("each held frame's offset is the pointer's travel from the press point", held, [10, 20, 30]);
  const released = p.scrolled();
  check("and the rows moved with it", fixed(p.row(0)[1]!), fixed(view[1]! - released));
  check("the selection did not change: the drag never selects", p.selected(), 1);
  check("the release is already the fling's: past where the finger left it", released > 30, true);
  p.step();
  const next = p.scrolled();
  check("and the frame after it keeps going the same way", next > released, true);
  p.settle(120);
  const land = p.scrolled();
  check("the fling settles inside the content, farther than the release", land > released && land < END, true);
  console.log(
    `solid/list.test.ts: the drag 30px in three frames, released at ${fixed(released)}, the next frame ${fixed(next)}, ` +
      `rest ${fixed(land)}`,
  );
  // a drag past the end is resisted by the same f(x) as the wheel's pull on the 240px viewport, and the band lets go
  const q = fresh();
  q.wheel(40);
  q.settle(120);
  const at = q.scrolled();
  check("the viewport is 400px in first", fixed(at), 400);
  const far = q.drag(160, [-100, -100, -100, -100]);
  const raw = fixed(far[far.length - 1]!);
  check("a drag past the end is resisted by rubber, not followed 1:1", raw, fixed(END + rubber(800 - END, 240)));
  check("and it is short of the raw travel", raw < 800, true);
  q.settle(120);
  check("after the release the band lets go and the viewport rests on the clamp", q.offset(), -658);
  console.log(`solid/list.test.ts: a 400px drag past the end presents ${raw} (rubber's f(142) of it), back on 658 at rest`);
  // the band at the top: a drag down from the top pulls the content out of it and the release lets go
  const t = fresh();
  const down = t.drag(160, [100, 100]);
  check("a drag past the top pulls the content down with the resistance", fixed(down[down.length - 1]!), fixed(-rubber(200, 240)));
  t.settle(120);
  check("and the band springs back to the top", t.offset(), 0);
  // a press above the viewport grabs nothing
  const a = fresh();
  a.point(180, 60);
  a.drag(60, [-40, -40]);
  a.settle(120);
  check("a press above the viewport does not drag it", a.offset(), 0);
  // the wheel still works beside the drag, and so does the keyboard
  a.wheel(2);
  a.settle();
  check("the wheel still scrolls the viewport", a.offset(), -20);
  a.tap("Tab");
  a.settle();
  check("the keyboard still focuses the list and reveals the selection from the wheel's offset", [a.selected(), a.offset()], [1, 0]);
  a.tap("ArrowDown");
  check("and a key still moves the selection", a.selected(), 2);
}

// --- the wheel: one notch is a 10px step on the track, not Clay's instant 10px — it glides, each frame after the first
//     moves less, and it settles at exactly 10px
{
  const p = fresh();
  const view = p.view();
  p.point(180, 160);
  const ys = [0];
  p.notch(1);
  ys.push(p.scrolled());
  for (let i = 0; i < 40; i++) p.step(), ys.push(p.scrolled());
  const steps = ys.map((y, i) => (i ? y - ys[i - 1]! : 0));
  check("one notch is not instant: its first frame is short of 10px", steps[1]! > 0 && steps[1]! < 10, true);
  check("one notch settles at exactly 10px", fixed(ys[ys.length - 1]!), 10);
  check("the notch's first frame is its largest step (a glide, not a jump)", fixed(steps[1]!), fixed(Math.max(...steps)));
  check("and the steps decay", steps[1]! > steps[5]! && steps[5]! > steps[20]!, true);
  check("the rows moved with it", p.row(0)[1], view[1]! - 10);
  check("the rows below it too", p.row(3)[1], view[1]! + 90 - 10);
  check("the selection did not move", p.selected(), 1);
  console.log(`solid/list.test.ts: one notch, ${steps.slice(1, 7).map((s) => s.toFixed(2)).join(" ")} … px a frame`);
  p.notch(-1);
  p.settle();
  check("a notch up comes back to the top", p.offset(), 0);
  p.wheel(2);
  p.settle();
  check("two notches a rest apart settle at 20", p.offset(), -20);
}

// --- the clamps: the top is 0 and the bottom is the last screenful
{
  const p = fresh();
  const view = p.view();
  p.wheel(200);
  p.settle(120);
  check("the offset stops at the content's end: 898 - 240", p.offset(), -658);
  check("the last row's bottom is the viewport's", p.row(29)[1]! + p.row(29)[3]!, view[1]! + view[3]!);
  p.wheelUp(200);
  p.settle(120);
  check("and at the top it is 0, not positive", p.offset(), 0);
  check("the first row back at the viewport's top", p.row(0)[1], view[1]);
}

// --- a flick: notches that arrive in one frame carry the track past its target on a decay, and it stops at the clamp in
//     a finite number of frames
{
  const p = fresh();
  p.point(180, 160);
  const ys = [0];
  p.notch(40);
  ys.push(p.scrolled());
  let frames = 0;
  for (let i = 0; i < 120; i++) {
    const before = p.scrolled();
    p.step();
    const y = p.scrolled();
    ys.push(y);
    if (y !== before) frames = i + 1;
  }
  const steps = ys.map((y, i) => (i ? y - ys[i - 1]! : 0));
  const peak = Math.max(...steps);
  check("the flick reaches the content's end", p.offset(), -658);
  check("its fastest frame is farther than any notch's 10px", peak > 10, true);
  check("and the tail has stopped", steps.slice(-10).every((s) => Math.abs(s) < 0.5), true);
  check("it comes to rest in a finite number of frames", frames > 0 && frames < 120, true);
  console.log(
    `solid/list.test.ts: forty notches, the steps ${steps.slice(1, 8).map((s) => s.toFixed(2)).join(" ")} px, ` +
      `peak ${peak.toFixed(2)}, rest after ${frames} frames`,
  );
}

// --- the rubber band at the viewport's ends: a wheel past the clamp moves the content with f(x) on the 240px viewport,
//     it holds while the notches come, and 80ms after the last one it springs back to the clamp, settling exactly on it
{
  const p = fresh();
  p.wheel(200);
  p.settle(120);
  const end = p.scrolled();
  check("the viewport is at its end first: 658", fixed(end), END);
  // four notches down, each at the end or over it: the band, at the resistance's own bound for the raw 40px
  for (let i = 0; i < 4; i++) p.notch(1);
  const banded = p.scrolled();
  check("a wheel past the end pushes the content out of it", banded > end, true);
  check("by the resistance, not by the raw 40px", banded - end < 40, true);
  check("and exactly its f(40) on the 240px viewport", fixed(banded), fixed(end + rubber(40, 240)));
  p.notch(-1);
  const back = p.scrolled();
  check("a notch the other way while banded moves it back", back < banded && back > end, true);
  // the hold: four frames (67ms) without a notch and it is still out of the end, then it lets go
  let held = 0;
  for (let i = 0; i < 4; i++) {
    p.step();
    if (p.scrolled() > end) held++;
  }
  check("the band is held for the first frames after the last notch", held, 4);
  let frames = 0;
  for (let i = 0; i < 120; i++) {
    const before = p.scrolled();
    p.step();
    if (Math.abs(p.scrolled() - before) > 0.01) frames = i + 1;
  }
  check("it springs back to the clamp, exactly", p.offset(), -658);
  check("in a finite number of frames", frames > 0 && frames < 120, true);
  console.log(
    `solid/list.test.ts: the band 4 notches past 658: ${fixed(banded)} (+${fixed(banded - end)} of 40 raw), one back to ` +
      `${fixed(back)}, held ${held} frames, at 658 after ${frames} more`,
  );
  // the same at the top: from 0, up notches pull the content the other way
  const q = fresh();
  q.point(180, 160);
  for (let i = 0; i < 4; i++) q.notch(-1);
  const up = q.scrolled();
  check("a wheel past the top pulls the content the other way", fixed(up), fixed(-rubber(40, 240)));
  q.settle(120);
  check("and it springs back to 0", q.offset(), 0);
}

// --- the clip: a selected row's fill is cut at the viewport's edge, not drawn above it
{
  const p = fresh();
  p.tap("Tab");
  check("Tab focuses the list", p.input.focus.focused(), "list");
  const view = p.view();
  p.wheel(1);
  p.settle();
  check("one notch down", p.offset(), -10);
  const row = p.row(0);
  check("the bounds are not clipped: the row's top is 10 above the viewport", row[1], view[1]! - 10);
  const inside = p.pixel(view[0]! + 20, view[1]! + 5);
  check("inside, the selected row's fill is drawn", inside, SURFACE);
  const above = p.pixel(view[0]! + 20, view[1]! - 5);
  check("above the viewport, where the row would be, the page shows through", above, PAGE);
  check("and past the viewport's bottom too", p.pixel(view[0]! + 20, view[1]! + view[3]! + 5), PAGE);
}

// --- the keyboard: every move eases the track to the offset that shows the selected row (no jump), the row is inside
//     the viewport once the animation is over, and the selection stays in 0..29
{
  const p = fresh();
  p.tap("Tab");
  const view = p.view();
  const inView = (i: number) => {
    const [rowTop, rowHeight] = [p.row(i)[1]!, p.row(i)[3]!];
    return rowTop >= view[1]! - 0.01 && rowTop + rowHeight <= view[1]! + view[3]! + 0.01;
  };
  check("the first row starts in view", inView(0), true);
  for (let i = 1; i <= 12; i++) {
    p.tap("ArrowDown");
    check(`ArrowDown ${i} selects ${i + 1} of 30`, p.selected(), i + 1);
    if (i === 8) check("the first reveal is on the track, not a jump to 28px", p.scrolled() > 0 && p.scrolled() < 28, true);
    p.settle();
    check(`and row ${i} is in the viewport after the ease`, inView(i), true);
  }
  // past the edge: the view has eased to the selected row, 12 rows less eight of them
  check("the view eased to the selected row: 148", p.offset(), -148);
  p.tap("PageDown");
  check("PageDown jumps eight: 21 of 30", p.selected(), 21);
  p.settle();
  check("and eases to it", [inView(20), p.offset()], [true, -388]);
  p.tap("End");
  check("End goes to 30 of 30", p.selected(), 30);
  p.settle();
  check("at the bottom of the content", p.offset(), -658);
  check("the last row is in view", inView(29), true);
  p.tap("ArrowDown");
  p.settle();
  check("Down at the end stays at 30 of 30", p.selected(), 30);
  check("and does not scroll further", p.offset(), -658);
  p.tap("PageUp");
  p.settle();
  check("PageUp jumps back eight", p.selected(), 22);
  p.tap("Home");
  p.settle();
  check("after a Home the first row is back at the top", [p.selected(), p.offset(), inView(0)], [1, 0, true]);
  p.tap("ArrowUp");
  p.settle();
  check("Up at the top stays at 1 of 30", p.selected(), 1);
  check("with nothing scrolled", p.offset(), 0);
}

// --- the wheel leaves the selection alone, and a key brings it back into view. The selected row the wheel left behind is
//     declared all the same — a range of its own, outside the viewport, with a spacer between it and the visible rows —
//     so its box (and its fill, ring and a11y node) exists where the arithmetic says, while the rows and the spacers the
//     window does show are exactly the ones it showed before the extra range existed
{
  const p = fresh();
  p.tap("Tab");
  for (let i = 0; i < 3; i++) p.tap("ArrowDown");
  check("the selection is 4 of 30", p.selected(), 4);
  p.wheel(20);
  p.settle();
  check("the wheel scrolled the view", p.offset(), -200);
  check("and did not touch the selection", p.selected(), 4);
  const view = p.view();
  // row 4 starts 90px into the content, and the viewport shows the content from 200px: the row is 110px above its top
  const row = p.row(3);
  check("the selected row is declared although the window left it behind", row.length, 4);
  check("at its place in the content: 3 * 30 less the 200 scrolled", fixed(row[1]! - view[1]!), -110);
  check("and above the viewport, so not one of its pixels is drawn", row[1]! + row[3]! <= view[1]!, true);
  // the column: rows 0..2 as the top spacer (row 4 is a box), the row, row 4 as the spacer between it and the window, the
  // window's rows 5..15 and the rest below — the same totals as the whole 30 rows, so nothing the viewport shows moved
  check("the window's rows 5..15 are declared where they were", [p.row(5).length, p.row(15).length, p.row(4).length], [4, 4, 0]);
  check("row 16 is past the window", p.row(16).length, 0);
  const above = p.box("list-above");
  const middle = p.box("list-mid");
  const below = p.box("list-below");
  check("the spacers are 3 slots, 1 slot and the rest, each less its gap", [above[3], middle[3], below[3]], [88, 28, 418]);
  check("the row between them is where the spacers put it", [above[1]! + above[3]! + 2, middle[1]! + middle[3]! + 2], [row[1], p.row(5)[1]]);
  check("and the content still ends at 898", fixed(below[1]! + below[3]! - view[1]! + p.scrolled()), 898);
  // a key: Down selects 5 of 30, and the reveal eases the view to it — the row is in the window again, no spacer between
  p.tap("ArrowDown");
  const mid = p.scrolled();
  check("the reveal is on the track, not a jump: 200 eases towards 120", mid > 120 && mid < 200, true);
  check("with row 5 still above the viewport's top, coming down to it", p.row(4)[1]! < view[1]!, true);
  p.settle();
  check("ArrowDown selects 5 of 30", p.selected(), 5);
  check("and eases the view up to row 5", [p.row(4)[1], p.offset()], [view[1], -120]);
  check("which is in the window now: no spacer between, no extra row", [p.box("list-mid").length, p.row(3).length], [0, 4]);
}

// --- the extra range costs no pixel: 32 notches down (the selection still row 1) is the frame stored before it existed,
//     byte for byte, and at one scroll position with the selection above the window and with it below, the viewport is
//     the same picture (the spacers stand in for the rows between)
{
  const p = fresh();
  p.wheel(32);
  p.settle(90);
  check("the wheel is 320px down", p.offset(), -320);
  check("the selected row is declared above the window", [p.row(0).length, p.row(0)[1]! < p.view()[1]!, p.row(10).length], [4, true, 4]);
  check(
    "the frame is frames/list-wheel.png: the selection's own range moved no pixel",
    ui.diffPng(
      new URL("./frames/list-wheel.png", import.meta.url).pathname,
      new URL("./frames/list-wheel.png.actual.png", import.meta.url).pathname,
    ),
    0,
  );
  // the viewport's pixels, as the last frame drew them
  const picture = (page: ReturnType<typeof fresh>) => {
    const v = page.view();
    const out: string[] = [];
    for (let y = 0; y < v[3]!; y++) for (let x = 0; x < v[2]!; x++) out.push(ui.pixel(v[0]! + x, v[1]! + y).join());
    return out;
  };
  // 348px: 34 notches and 0.8 of one from the top (the selection 0, above the window) ...
  const a = fresh();
  a.wheel(34);
  a.notch(0.8);
  a.settle(120);
  check("the first page is at 348 with its selection above the window", [a.offset(), a.selected(), a.row(0)[1]! < a.view()[1]!], [-348, 1, true]);
  const above = picture(a);
  // ... and Tab, End, then 31 notches up (the selection 30, below it)
  const b = fresh();
  b.tap("Tab");
  b.tap("End");
  b.settle(120);
  b.wheelUp(31);
  b.settle(120);
  check("the second is at 348 with its selection below the window", [b.offset(), b.selected(), b.row(29)[1]! > b.view()[1]! + b.view()[3]!], [-348, 30, true]);
  const below = picture(b);
  check("and the two viewports are the same picture", above.filter((c, i) => c !== below[i]).length, 0);
}

// --- reduced motion: the wheel clamps hard (no band), a flick does not fly, a drag's release does not fling, and a key
//     lands on its target in the key's own frame
{
  setReducedMotion(true);
  const p = fresh();
  p.tap("Tab");
  p.wheel(200);
  p.settle(120);
  check("reduced motion puts the wheel on the clamp", p.offset(), -658);
  for (let i = 0; i < 4; i++) p.notch(1);
  check("and a notch past it moves nothing: no band", p.offset(), -658);
  p.tap("Home");
  check("a key lands at once: Home is 0 in the key's own frame", [p.selected(), p.offset()], [1, 0]);
  for (let i = 0; i < 12; i++) p.tap("ArrowDown");
  check("and twelve Downs are already at the reveal, 148", p.offset(), -148);
  check("with the selected row inside the viewport", p.row(12)[1]! >= p.view()[1]! && p.row(12)[1]! + 28 <= p.view()[1]! + 240, true);
  // a flick does not fly: two notches in one frame settle on their own 20px
  const q = fresh();
  q.point(180, 160);
  q.notch(2);
  let peak = 0;
  for (let i = 0; i < 120; i++) {
    const before = q.scrolled();
    q.step();
    peak = Math.max(peak, q.scrolled() - before);
  }
  check("a flick under reduced motion is the notches' own 20px, not a throw", fixed(q.scrolled()), 20);
  check("and no frame passes it", peak <= 20, true);
  // the scrollbar is not motion: under reduced motion it is there the frame the offset moves, with no fade, and gone
  // just as abruptly 600ms later
  const b = fresh();
  const bv = b.view();
  const strip: [number, number] = [bv[0]! + bv[2]! - 4, bv[1]! + 10];
  b.point(180, 160);
  b.notch(1);
  check("reduced motion shows the thumb at once, with no fade", same(b.pixel(strip[0], strip[1]), MUTED), true);
  b.settle(40);
  check("and drops it at once when the 600ms are up", b.pixel(strip[0], strip[1]), SURFACE);
  // a drag is still 1:1 (it is direct manipulation), and its release stops where the finger left it
  const d = fresh();
  check("reduced motion drags 1:1 too", d.drag(160, [-10, -10, -10]), [10, 20, 30]);
  d.settle(30);
  check("and the release stops the viewport where the finger left it", d.offset(), -30);
  d.drag(160, [-100, -100, -100, -100, -100, -100, -100, -100]);
  d.settle(30);
  check("a drag past the end is clamped hard, without a band", d.offset(), -658);
  setReducedMotion(false);
}

// --- the header and the footer are outside the clip element: they stay where they are
{
  const p = fresh();
  const head = p.box("list-head");
  const foot = p.box("list-foot");
  const row = p.row(2);
  p.wheel(5);
  p.settle();
  check("the header did not move", p.box("list-head"), head);
  check("and neither did the footer", p.box("list-foot"), foot);
  check("while the rows moved by the offset", p.row(2)[1], row[1]! - 50);
  check("the readout still shows the selection", p.readout(), "Room A1 — 1 of 30");
}

// --- the focus ring: the selected row's, 2px in the ring token, only while the list has the focus
{
  const p = fresh();
  const row = p.row(0);
  check("unfocused, the selected row's left edge is its fill", p.pixel(row[0]! + 1, row[1]! + 14), SURFACE);
  p.tap("Tab");
  check("focused, the row's left edge is the ring", p.pixel(row[0]! + 1, p.row(0)[1]! + 14), RING);
  check("2px in, then the fill again", p.pixel(p.row(0)[0]! + 3, p.row(0)[1]! + 14), SURFACE);
  p.tap("Escape");
  check("Escape is nobody's here: the list keeps the focus", p.input.focus.focused(), "list");
}

// --- the wheel only reaches the viewport under the pointer (Clay's container rule, kept by the page)
{
  const p = fresh();
  p.tap("Tab");
  p.wheel(2);
  p.settle();
  check("the pointer over the viewport scrolls it", p.offset(), -20);
  p.point(180, 40); // the title, above the viewport
  p.notch(2);
  p.settle();
  check("with the pointer off the viewport the same wheel scrolls nothing", p.offset(), -20);
}

// --- the scrollbar: a 4px thumb 2px in from the viewport's right edge, as tall as a screenful of the content is of it
//     (max(24, 240²/898)) and at offset/(898-240) of its travel; only when the content is taller than the viewport
{
  const p = fresh();
  const view = p.view();
  const content = 898; // the rows' own end, the page's `maxScroll` plus the viewport
  const height = Math.max(24, (view[3]! * view[3]!) / content);
  const travel = view[3]! - height;
  const top = p.thumb();
  check("the thumb is 4px wide, 2px in from the viewport's right edge", [top[0], top[2], top[0]! + top[2]!], [view[0]! + view[2]! - 6, 4, view[0]! + view[2]! - 2]);
  check("its height is max(24, 240²/898): a screenful of the content", fixed(top[3]!), fixed(height));
  check("at the top it starts at the viewport's top", fixed(top[1]!), fixed(view[1]!));
  // a middle: 33 notches a rest apart are 330px of the 658 the viewport can scroll
  p.wheel(33);
  p.settle(120);
  check("33 notches are 330 of 658", fixed(p.scrolled()), 330);
  check("halfway, the thumb's top is halfway down its travel", fixed(p.thumb()[1]! - view[1]!), fixed((330 / END) * travel));
  // the end: the thumb's bottom is the viewport's bottom
  p.wheel(200);
  p.settle(120);
  check("the viewport is at its end", p.offset(), -658);
  check("and the thumb's bottom is the viewport's bottom", fixed(p.thumb()[1]! + p.thumb()[3]!), fixed(view[1]! + view[3]!));
  console.log(
    `solid/list.test.ts: the thumb ${p.thumb().slice(0, 2).map((v) => fixed(v!)).join(",")} 4x${fixed(height)} px, ` +
      `the travel ${fixed(travel)}: its top 0 at the top, ${fixed((330 / END) * travel)} at 330, ${fixed(travel)} at 658`,
  );
}

// --- the fade: the thumb is not drawn at rest (it is a colour fade on its own background), comes in over ~10 frames on
//     the frame the offset starts to move, and goes out 600ms after the track settles
{
  const p = fresh();
  const view = p.view();
  // 10px into the viewport, on the thumb's strip: the selected row's fill at rest
  const at: [number, number] = [view[0]! + view[2]! - 4, view[1]! + 10];
  const seen = () => p.pixel(at[0], at[1]);
  check("at rest the thumb is not drawn: the selected row shows through", seen(), SURFACE);
  p.point(180, 160);
  p.notch(1);
  const fade: number[][] = [];
  for (let i = 0; i < 8; i++) p.step(), fade.push(seen());
  check("a notch brings it in: a mid frame is between the row and the muted token", fade.some((c) => between(c, SURFACE, MUTED)), true);
  p.settle(6);
  check("and it settles on the muted token", same(seen(), MUTED), true);
  // the hold: the offset stops ~18 frames in, so this is still inside the 600ms after it
  p.settle(40);
  check("it stays up while the 600ms of rest runs", same(seen(), MUTED), true);
  const out: number[][] = [];
  for (let i = 0; i < 24; i++) p.step(), out.push(seen());
  check("then it fades out: a frame between the muted token and the row", out.some((c) => between(c, MUTED, SURFACE)), true);
  check("and once it is out the row is the row again", seen(), SURFACE);
  console.log(
    `solid/list.test.ts: the thumb's fade in ${fade.slice(0, 4).map((c) => c.join("/")).join(" ")}, ` +
      `out ${out.slice(0, 4).map((c) => c.join("/")).join(" ")}`,
  );
}

// --- the drag on the thumb: a press on it (only while it is visible) grabs it, and the pointer's travel in y moves the
//     thumb by the same distance — the offset's whole range over the thumb's travel, not the content's 1:1 — and clamps
//     at both ends, no band and no fling. At rest, with no thumb drawn, the same press is the page's.
{
  const p = fresh();
  const view = p.view();
  const content = 898;
  const height = Math.max(24, (view[3]! * view[3]!) / content);
  const travel = view[3]! - height;
  const per = END / travel; // px of offset a px of the thumb's travel is
  p.point(180, 160);
  p.wheel(3); // 30px, settled (notches a rest apart: no fling)
  p.settle(24);
  check("the thumb is up before the press", same(p.pixel(view[0]! + view[2]! - 4, p.thumb()[1]! + 10), MUTED), true);
  const from = p.scrolled();
  const mid = p.thumb()[1]! + height / 2;
  const held = p.drag(mid, [10, 10], 316);
  const close = (got: number, want: number) => Math.abs(got - want) < 0.1;
  check(
    "10px of the pointer moves the thumb 10px, and the offset by the content's whole range over its travel",
    held.every((y, i) => close(y - from, (i + 1) * 10 * per)),
    true,
  );
  check("... which is much more than the content's own 1:1 drag would move it", 10 * per > 20, true);
  check("the thumb moved with the pointer, by the same 20px", fixed(p.thumb()[1]! - (mid - height / 2)), fixed(20));
  p.settle(30);
  check("the release stops it: a scrollbar's drag does not fling", p.scrolled(), held[held.length - 1]!);
  // the ends: past the thumb's travel the offset clamps on the content, and past the top it clamps on 0
  const q = fresh();
  q.point(180, 160);
  q.wheel(2);
  q.settle(24);
  q.drag(q.thumb()[1]! + height / 2, [travel + 200], 316);
  check("a drag past the thumb's travel stops on the content's end", q.offset(), -658);
  q.drag(q.thumb()[1]! + height / 2, [-travel - 200], 316);
  check("and the other way on the top", q.offset(), 0);
  // at rest there is no thumb to grab: the press is the viewport's own drag
  const r = fresh();
  check("at rest the strip has no thumb on it", r.pixel(view[0]! + view[2]! - 4, view[1]! + 10), SURFACE);
  check("so a press there drags the viewport 1:1", r.drag(view[1]! + 50, [-10], 316), [10]);
}

// --- the wide layout (`wide`, `--wide`): the same 240px viewport and 28px rows, 900px wide, so the page gets the
//     machine's horizontal axis: a dx notch glides 10px and settles, a flick decays to the horizontal clamp, and the rows
//     move left with it while the vertical offset stays where it was
{
  const p = fresh({ wide: true });
  const view = p.view();
  const maxX = s.WIDE - view[2]!; // 900 - 280
  check("the wide page keeps the viewport's 280 x 240", [view[2], view[3]], [280, 240]);
  check("a row is 900 wide: wider than the viewport, narrower than nothing", p.row(0)[2], s.WIDE);
  check("and still 28 tall: the widths are a layout matter only", p.row(0)[3], 28);
  check("the wide row's second column is declared past the viewport", p.row(0)[0]! + p.row(0)[2]! > view[0]! + view[2]!, true);
  check("nothing is scrolled sideways at first", p.offsetX(), 0);
  check("and the horizontal clamp is the row less the viewport: 620", maxX, 620);
  const below = p.box("list-below");
  check("the vertical window still ends the content at 30 * 30 - 2", below[1]! + below[3]! - view[1]!, 898);
  p.point(180, 160);
  const xs = [0];
  p.notchX(1);
  xs.push(p.scrolledX());
  for (let i = 0; i < 40; i++) p.step(), xs.push(p.scrolledX());
  const steps = xs.map((x, i) => (i ? x - xs[i - 1]! : 0));
  check("one horizontal notch is not instant: its first frame is short of 10px", steps[1]! > 0 && steps[1]! < 10, true);
  check("one horizontal notch settles at exactly 10px", fixed(xs[xs.length - 1]!), 10);
  check("its first frame is its largest step (a glide, not a jump)", fixed(steps[1]!), fixed(Math.max(...steps)));
  check("and the steps decay", steps[1]! > steps[5]! && steps[5]! > steps[20]!, true);
  check("the rows moved left with it", fixed(p.row(0)[0]!), fixed(view[0]! - 10));
  check("and the vertical offset did not move", p.offset(), 0);
  console.log(
    `solid/list.test.ts: one horizontal notch, ${steps.slice(1, 7).map((x) => x.toFixed(2)).join(" ")} … px a frame`,
  );
  // a flick: 40 notches in one frame carry the track past the notch and to the horizontal clamp, in finite frames
  const q = fresh({ wide: true });
  q.point(180, 160);
  const ys = [0];
  q.notchX(40);
  ys.push(q.scrolledX());
  let frames = 0;
  for (let i = 0; i < 120; i++) {
    const before = q.scrolledX();
    q.step();
    const y = q.scrolledX();
    ys.push(y);
    if (y !== before) frames = i + 1;
  }
  const fsteps = ys.map((y, i) => (i ? y - ys[i - 1]! : 0));
  const peak = Math.max(...fsteps);
  check("the horizontal flick reaches the content's end: 900 - 280", q.offsetX(), -maxX);
  check("its fastest frame is farther than any notch's 10px", peak > 10, true);
  check("and its tail has stopped", fsteps.slice(-10).every((x) => Math.abs(x) < 0.5), true);
  check("it comes to rest in a finite number of frames", frames > 0 && frames < 120, true);
  check("the row's right edge is the viewport's right edge at the end", fixed(q.row(0)[0]! + q.row(0)[2]!), fixed(view[0]! + view[2]!));
  console.log(
    `solid/list.test.ts: forty horizontal notches, the steps ${fsteps.slice(1, 8).map((x) => x.toFixed(2)).join(" ")} px, ` +
      `peak ${peak.toFixed(2)}, rest on ${fixed(q.scrolledX())} after ${frames} frames`,
  );
  // the vertical axis of the same page is untouched by the horizontal one
  const v = fresh({ wide: true });
  v.wheel(2);
  v.settle();
  check("the vertical wheel still scrolls a wide page by 20", v.offset(), -20);
  check("and leaves the horizontal offset alone", v.offsetX(), 0);
  v.wheelX(3);
  v.settle();
  check("three horizontal notches are 30, beside the 20", [v.offsetX(), v.offset()], [-30, -20]);
  setReducedMotion(true);
  const r = fresh({ wide: true });
  r.point(180, 160);
  r.notchX(1);
  check("reduced motion puts a horizontal notch on its 10px at once, no glide", r.offsetX(), -10);
  setReducedMotion(false);
}

// --- the horizontal thumb: the same geometry turned (4px tall, width max(24, view²/content), its left the offset's place
//     of its travel), 2px in from the viewport's bottom edge, only when the content is wider than the viewport
{
  const p = fresh({ wide: true });
  const view = p.view();
  const content = s.WIDE; // 900
  const maxX = content - view[2]!; // 620
  const width = Math.max(24, (view[2]! * view[2]!) / content);
  const travel = view[2]! - width;
  const start = p.thumbX();
  check("the horizontal thumb is 4px tall, 2px in from the viewport's bottom edge", [start[1], start[3]], [view[1]! + view[3]! - 6, 4]);
  check("its width is max(24, 280²/900): a screenful of the content", fixed(start[2]!), fixed(width));
  check("at the start it begins at the viewport's left edge", [start[0], fixed(start[2]!)], [view[0], fixed(width)]);
  // a middle: 33 notches a rest apart are 330px of the 620 the viewport can scroll
  p.wheelX(33);
  p.settle(120);
  check("33 horizontal notches are 330 of 620", fixed(p.scrolledX()), 330);
  check("a third of the way, the thumb's left is the offset's place of its travel", fixed(p.thumbX()[0]! - view[0]!), fixed((330 / maxX) * travel));
  // the end: the thumb's right edge is the viewport's right edge
  p.wheelX(200);
  p.settle(120);
  check("the viewport is at its horizontal end", p.offsetX(), -maxX);
  check("and the thumb's right edge is the viewport's right edge", fixed(p.thumbX()[0]! + p.thumbX()[2]!), fixed(view[0]! + view[2]!));
  console.log(
    `solid/list.test.ts: the horizontal thumb ${p.thumbX().slice(0, 2).map((v) => fixed(v!)).join(",")} ` +
      `${fixed(width)}x4 px, the travel ${fixed(travel)}: its left 0 at the start, ${fixed((330 / maxX) * travel)} at 330, ` +
      `${fixed(travel)} at 620`,
  );
  // the default page has no horizontal bar at all
  const d = fresh();
  check("the default page declares no horizontal thumb", d.thumbX().length, 0);
  check("and its horizontal clamp is 0", d.offsetX(), 0);
}

// --- the horizontal thumb's drag: a press on it (only while it is visible) moves the content by the whole range over the
//     bar's travel (not 1:1 on the content), clamps at both ends, and its release does not fling
{
  const p = fresh({ wide: true });
  const view = p.view();
  const content = s.WIDE;
  const maxX = content - view[2]!;
  const width = Math.max(24, (view[2]! * view[2]!) / content);
  const travel = view[2]! - width;
  const per = maxX / travel; // px of offset a px of the bar's travel is
  p.point(180, 160);
  p.wheelX(3); // 30px, settled
  p.settle(24);
  const bar = p.thumbX();
  check("the horizontal thumb is up before the press", same(p.pixel(bar[0]! + 10, bar[1]! + 2), MUTED), true);
  const from = p.scrolledX();
  const mid = bar[0]! + width / 2;
  const held = p.dragX(mid, [10, 10], bar[1]! + 2);
  const close = (got: number, want: number) => Math.abs(got - want) < 0.1;
  check(
    "10px of the pointer moves the horizontal thumb 10px, and the offset by the content's range over its travel",
    held.every((x, i) => close(x - from, (i + 1) * 10 * per)),
    true,
  );
  check("... which is much more than the content's own 1:1 drag would move it", 10 * per > 20, true);
  check("the thumb moved with the pointer, by the same 20px", fixed(p.thumbX()[0]! - bar[0]!), fixed(20));
  p.settle(30);
  check("the release stops it: a scrollbar's drag does not fling", p.scrolledX(), held[held.length - 1]!);
  console.log(
    `solid/list.test.ts: a 20px drag on the horizontal bar at 30: ${held.map((x) => fixed(x)).join(", ")} ` +
      `(${fixed(per)} of offset a px), the bar ${fixed(p.thumbX()[0]! - bar[0]!)}px right`,
  );
  // the ends: past the bar's travel the offset clamps on the content, and past the start it clamps on 0
  const q = fresh({ wide: true });
  q.point(180, 160);
  q.wheelX(2);
  q.settle(24);
  q.dragX(q.thumbX()[0]! + width / 2, [travel + 200], q.thumbX()[1]! + 2);
  check("a drag past the bar's travel stops on the content's horizontal end", q.offsetX(), -maxX);
  q.dragX(q.thumbX()[0]! + width / 2, [-travel - 200], q.thumbX()[1]! + 2);
  check("and the other way on the start", q.offsetX(), 0);
  // at rest there is no bar to grab: the press is the viewport's own drag (vertical)
  const r = fresh({ wide: true });
  check("at rest the horizontal strip has no thumb on it", r.pixel(view[0]! + 10, r.thumbX()[1]! + 2), PAGE);
  check("so a press there drags the viewport 1:1 vertically", r.drag(r.thumbX()[1]! + 2, [-10], 60), [10]);
}

// --- both bars at once: one fade for the machine, so a vertical notch shows the horizontal bar too; the vertical thumb's
//     travel ends at the horizontal bar's top (6px off the viewport's bottom), so the two never overlap
{
  const p = fresh({ wide: true });
  const view = p.view();
  const content = s.WIDE;
  const width = Math.max(24, (view[2]! * view[2]!) / content);
  const height = Math.max(24, (view[3]! * view[3]!) / 898);
  const travelY = view[3]! - 6 - height;
  const barY = p.thumb();
  const barX = p.thumbX();
  check("both bars are declared, and they do not overlap at rest", barY[1]! + barY[3]! <= barX[1]! + 0.01, true);
  check("the vertical thumb's travel is 240 - 6 - 64.14", fixed(travelY), 169.86);
  p.point(180, 160);
  p.notch(1); // vertical only, and the fade is the machine's: both bars come up
  p.settle(12);
  check("a vertical notch shows the horizontal bar too (one fade, not two)", same(p.pixel(barX[0]! + 10, barX[1]! + 2), MUTED), true);
  check("and the vertical bar", same(p.pixel(barY[0]! + 1, barY[1]! + 10), MUTED), true);
  p.wheel(200);
  p.settle(120);
  check("the vertical viewport is at its end", p.offset(), -658);
  check("its thumb's bottom is 6px above the viewport's bottom: the horizontal bar's top", fixed(p.thumb()[1]! + p.thumb()[3]!), fixed(view[1]! + view[3]! - 6));
  check("so the two bars do not overlap", p.thumb()[1]! + p.thumb()[3]! <= p.thumbX()[1]! + 0.01, true);
  check("and vertically at the end, sideways nothing moved", p.offsetX(), 0);
  p.wheelX(200);
  p.settle(120);
  check("with both ends reached: 658 down and 620 right", [p.offset(), p.offsetX()], [-658, -620]);
  check("the horizontal thumb's right edge is the viewport's", fixed(p.thumbX()[0]! + p.thumbX()[2]!), fixed(view[0]! + view[2]!));
  console.log(
    `solid/list.test.ts: both bars: the vertical ${fixed(view[1]! + view[3]! - 6 - barY[1]!)}px of travel to its top, ` +
      `the horizontal ${fixed(barX[0]! - view[0]!)}px of left, ${fixed(width)} wide, no overlap`,
  );
}

// --- a finger is a pointer too: the host passes SDL's flag through, and a touch drag has no 4px slop (it starts at
//     once), while a 2px touch whose pointer never moves is still a click. The List's drag is direct either way.
{
  const p = fresh();
  check("a touch drag is 1:1 like the mouse's", p.drag(160, [-10, -10, -10], 180, true), [10, 20, 30]);
  p.settle(120);
  check("and its release lands inside the content", p.scrolled() > 30 && p.scrolled() < END, true);
  // 2px of travel: a mouse's is inside the click slop (no speed, no fling), a finger's is a drag, and its release flings
  const m = fresh();
  m.drag(160, [-2]);
  m.settle(120);
  const mouse = m.scrolled();
  const f = fresh();
  f.drag(160, [-2], 180, true);
  f.settle(120);
  const finger = f.scrolled();
  check("a mouse's 2px is a click: the offset stops at 2", fixed(mouse), 2);
  check("a finger's 2px is a drag: the offset flies past it", finger > mouse + 10, true);
  console.log(`solid/list.test.ts: 2px of travel: a mouse rests at ${fixed(mouse)}, a finger flings to ${fixed(finger)}`);
}

dispose();
if (failed) process.exit(1);
console.log(
  "solid/list.test.ts: the wheel moving Clay's scroll offset and the rows with it, the clamps at both ends, the clip at " +
    "the viewport's edge, the keyboard selection scrolling into view and staying in range, the wheel leaving the " +
    "selection alone and the row it left behind declared outside the viewport (its own range, the stored frame still " +
    "byte-identical), the held pointer dragging the viewport 1:1 and stopping at the release, the page's first-mount " +
    "entry (a blend four frames in, the literals at rest, the layout still), the header and footer staying put, the " +
    "focus ring, the page fitting, and the wide page's horizontal axis (a notch and a flick on the same track, the " +
    "horizontal thumb's geometry and 1:1 drag, both bars at once without overlap)",
);
process.exit(0);
