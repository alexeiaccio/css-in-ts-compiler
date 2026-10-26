// What the stored frames of the List page cannot show: the page's own track moving the viewport's offset and the rows
// with it (a notch glides 10px, a flick decays to the clamp), the clamps at both ends and the rubber band past them (its
// resistance, its 80ms hold and its return), the viewport's clip (a selected row's fill cut at the edge, not drawn above
// it), the keyboard selection easing the row into view on the same track, the selection staying in 0..29, the wheel and
// the drag leaving the selection alone (the drag never selects), the held pointer dragging the viewport 1:1 and its
// release flinging, reduced motion's hard clamp and instant keys, the page's first-mount entry (the root's subtree rising
// and fading in, once, with the layout still), the header and footer staying put, and the page fitting. Driven as the
// window does it: pointer and wheel in, then a frame.
import "./plugin.ts";

const { ui } = await import("./src/ffi.ts");
const { createFrame } = await import("./src/frame.ts");
const { createInput } = await import("./src/input.ts");
const { El, render, Txt } = await import("./src/renderer.ts");
const { rubber, setReducedMotion } = await import("./src/motion.ts");
const { List, size } = await import("./app/List.tsx");

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
const END = 658; // the content's end: 898 of rows in a 240 viewport

let dispose = () => {};
/** A fresh page, the host's frame loop over it, and the entry's 0.25s over unless `entry` asks for it running. */
function fresh(opts: { entry?: boolean } = {}) {
  dispose();
  const root = new El("root");
  const input = createInput();
  // the page's frame hook, as main.ts wires it: the page's scroll takes the wheel, the pointer's drag, and one tick a frame
  const motion: {
    onWheel?: (dx: number, dy: number) => void;
    onPointer?: (x: number, y: number, down: boolean) => void;
    tick?: (dt: number) => void;
  } = {};
  dispose = render(() => List({ input, motion }), root);
  const frame = createFrame(root, {
    onPressMiss: () => input.pressMiss(),
    onWheel: (dx, dy) => motion.onWheel?.(dx, dy),
    onPointer: (x, y, down) => motion.onPointer?.(x, y, down),
    tick: (dt) => motion.tick?.(dt),
  });
  let at = [-1, -1];
  const step = (down = false) => frame(at[0]!, at[1]!, down, 1 / 60);
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
    /** A pointer drag on the viewport: a press at x 180, y, then a frame a dy with the button held, then the release.
     *  Returns the offset each held frame presented (positive down), so a test can follow the pointer exactly. */
    drag(y: number, dys: number[]) {
      at = [180, y];
      step(false);
      step(true);
      const held: number[] = [];
      for (const dy of dys) {
        at = [180, (y += dy)];
        step(true);
        held.push(-ui.scrollOffset("list"));
      }
      step(false);
      return held;
    },
    /** The view's top and height, the offset Clay keeps: a row's top is its own plus this. */
    view: () => box("list"),
    offset: () => ui.scrollOffset("list"),
    /** The offset positive down, as the page's track says it. */
    scrolled: () => -ui.scrollOffset("list"),
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
  const last = p.row(29);
  check("thirty rows, the last one past the viewport: the content is 30 * 30 - 2", last[1]! + last[3]! - view[1]!, 898);
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

// --- the wheel leaves the selection alone, and a key brings it back into view
{
  const p = fresh();
  p.tap("Tab");
  for (let i = 0; i < 3; i++) p.tap("ArrowDown");
  check("the selection is 4 of 30", p.selected(), 4);
  p.wheel(20);
  p.settle();
  check("the wheel scrolled the view", p.offset(), -200);
  check("and did not touch the selection", p.selected(), 4);
  check("the selected row went out of view", p.row(3)[1]! < p.view()[1]!, true);
  p.tap("ArrowDown");
  p.settle();
  check("ArrowDown selects 5 of 30", p.selected(), 5);
  check("and eases the view up to row 5", [p.row(4)[1], p.offset()], [p.view()[1], -120]);
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

dispose();
if (failed) process.exit(1);
console.log(
  "solid/list.test.ts: the wheel moving Clay's scroll offset and the rows with it, the clamps at both ends, the clip at " +
    "the viewport's edge, the keyboard selection scrolling into view and staying in range, the wheel leaving the " +
    "selection alone, the held pointer dragging the viewport 1:1 and stopping at the release, the page's first-mount " +
    "entry (a blend four frames in, the literals at rest, the layout still), the header and footer staying put, the " +
    "focus ring, the page fitting",
);
process.exit(0);
