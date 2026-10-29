// What the stored frames of the Sky page cannot show: the avatars are drawn pictures (and change with the feed), the body
// wraps, the wheel and the keys drive the feed's own motion track (a notch glides 10px, a flick decays and clamps, a
// wheel mid-flight retargets from the presented x and v), the tablist switches the feed and its cards, the News feed is
// empty, and the page fits its window. Driven as the window does it: pointer, wheel and keys in, then a frame.
import "./plugin.ts";

const { ui } = await import("./src/ffi.ts");
const { createFrame } = await import("./src/frame.ts");
const { createInput } = await import("./src/input.ts");
const { El, render, Txt } = await import("./src/renderer.ts");
const { Sky, size, ago, num } = await import("./app/Sky.tsx");
const { rubber, setReducedMotion } = await import("./src/motion.ts");

ui.init(size.width, size.height);
ui.font(new URL("../vendor/fonts/Roboto-Regular.ttf", import.meta.url).pathname);

let failed = 0;
const check = (what: string, got: unknown, want: unknown) => {
  const [a, b] = [JSON.stringify(got), JSON.stringify(want)];
  if (a !== b) failed++, console.error(`FAIL ${what}: ${a}, wanted ${b}`);
};

const PAGE = [16, 19, 22]; // the page token of the dark theme
const PANEL = [27, 32, 38]; // the card's gradient at its top (the panel token)
const PANEL_DEEP = [21, 25, 30]; // ... and at its bottom
const INK = [230, 233, 236]; // the card's name and body text
const MUTED = [139, 152, 165]; // the muted token
const HOVER = [34, 40, 49]; // a card or tab under the pointer: the hover gradient's top
const RING = [92, 176, 255]; // the feed's focus ring
const LIGHT_PANEL = [255, 255, 255]; // the light theme's card, at its top
const LIGHT_PANEL_DEEP = [240, 243, 246]; // ... and at its bottom
// a gradient's pixel is the stop interpolated at that y, so it is matched within a channel or two
const near = (got: number[], want: number[], d = 2) =>
  got.length === 3 && want.every((v, i) => Math.abs(got[i]! - v) <= d);
/** The bands a column of a card shows: runs of one luminance, and the longest of them (the dither's own measure). */
const bands = (col: number[][]) => {
  const lum = (c: number[]) => Math.round(0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!);
  let runs = 1,
    longest = 1,
    at = 1;
  for (let i = 1; i < col.length; i++) {
    if (lum(col[i]!) === lum(col[i - 1]!)) at++;
    else runs++, (longest = Math.max(longest, at)), (at = 1);
  }
  return { runs, longest: Math.max(longest, at) };
};
/** Is a colour strictly between two others, channel by channel (a fade's mid frame)? */
const between = (c: number[], a: number[], b: number[]) =>
  c.length === 3 &&
  c.join() !== a.join() &&
  c.join() !== b.join() &&
  c.every((v, i) => v >= Math.min(a[i]!, b[i]!) && v <= Math.max(a[i]!, b[i]!));
/** How far two colours are apart, their widest channel. */
const apart = (a: number[], b: number[]) => Math.max(...a.map((v, i) => Math.abs(v - b[i]!)));
/** An offset from layout, to the pixel: Clay's float32 turns 78 into 77.99998. */
const r = (x: number) => Math.round(x * 100) / 100;

let dispose = () => {};
/** The page's thread loader here: a promise that never settles. The feed's blocks click a card only to see the selection
 *  and the screen's entry, and no frame in this file may wait on a network — the thread's own states are
 *  `solid/thread.test.ts`'s, whose loader is a promise the test settles. */
const never = () => new Promise<never>(() => {});

/** A fresh page. `entry: true` leaves the cards' first-mount entry running: the frames before it are what the entry
 *  test looks at, and every other block wants a page at rest. */
function fresh(theme?: string, opts: { entry?: boolean } = {}) {
  dispose();
  const root = new El("root");
  const input = createInput();
  // the page's frame hook, as the host wires it: the wheel in, one tick a frame, the pointer for the feed's drag
  const motion: {
    onWheel?: (dx: number, dy: number) => void;
    onPointer?: (x: number, y: number, down: boolean, touch: boolean) => void;
    tick?: (dt: number) => void;
  } = {};
  const palette = theme;
  dispose = render(() => Sky({ input, motion, theme: () => palette, load: never }), root);
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
  // Clay keeps a scroll container's offset by its id across `fresh()` calls: put the feed back at its top first
  ui.scrollTo("sky-feed", 0);
  step();
  // the cards arrive staggered on mount (0.3s from the last one's 2 x 50ms start): a page at rest is 30 frames later
  if (!opts.entry) for (let i = 0; i < 40; i++) step();

  const find = (pred: (el: El) => boolean, from: El = root): El[] =>
    from.children.flatMap((c) => (c instanceof El ? [...(pred(c) ? [c] : []), ...find(pred, c)] : []));
  const text = (el: El): string => el.children.map((c) => (c instanceof Txt ? c.text : text(c))).join("");
  const texts = () => find((el) => el.tag === "text").map(text);
  const box = (id: string) => [...(ui.bounds(Buffer.from(id)) ?? [])];
  const pixel = (x: number, y: number) => ui.pixel(Math.floor(x), Math.floor(y)).slice(0, 3);

  return {
    input,
    box,
    pixel,
    texts,
    step,
    /** The first page row below a card's box: the card's drawn bottom edge is one above it (the entry lifts the whole
     *  group down into the 8px gap below, which is the page). -1 when the card is not drawn there at all. */
    below(x: number, bottom: number, n = 16) {
      for (let y = bottom; y < bottom + n; y++) if (pixel(x, y).join() === PAGE.join()) return y;
      return -1;
    },
    /** The status line: "Discover — 3 posts" or the selected card's "name — 1 of 3". */
    status: () => texts().find((s) => / — \d+ (of \d+|posts?)$/.test(s))!,
    /** Puts the pointer at x, y and lays out a frame: `ui.bounds` and Clay's "what is under it" follow. */
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
    /** A click on the middle of an element, for a tab and a card. */
    clickOn(id: string) {
      const b = box(id);
      if (!b.length) throw new Error(`no box ${id}`);
      this.click(b[0]! + b[2]! / 2, b[1]! + b[3]! / 2);
    },
    /** One wheel event of `n` notches down (negative for up), then a frame: the page's own channel, as the host. */
    notch(n = 1) {
      motion.onWheel?.(0, -n);
      step();
    },
    /** `n` notches down over the feed, one a frame as the host's --wheel does. */
    wheel(n: number) {
      this.point(180, 396);
      for (let i = 0; i < n; i++) this.notch(1);
    },
    /** Frames with no input: the track comes to rest. */
    settle(n = 60) {
      for (let i = 0; i < n; i++) step();
    },
    /** A pointer drag on the feed: a frame with the pointer there, the press, then a frame a dy with the button held.
     *  Returns the offset each held frame presented and then the release, so a test can follow the pointer exactly.
     *  `touch` marks the frames as a finger's. */
    drag(x: number, y: number, dys: number[], touch = false) {
      at = [x, y];
      step(false, touch);
      step(true, touch);
      const held: number[] = [];
      for (const dy of dys) {
        at = [x, (y += dy)];
        step(true, touch);
        held.push(-ui.scrollOffset("sky-feed"));
      }
      // the release at the last point of the drag
      step(false, touch);
      return held;
    },
    /** A key pressed and released with a frame after each. */
    tap(name: string) {
      input.down(name);
      step();
      input.up(name);
      step();
    },
    /** The Science feed: its tab is the second of the tablist. */
    science() {
      this.clickOn("sky-tabs-tab-1");
    },
    news() {
      this.clickOn("sky-tabs-tab-2");
    },
    card: (i: number) => box(`sky-card-${i}`),
    body: (i: number) => box(`sky-body-${i}`),
    avatar: (i: number) => box(`sky-avatar-${i}`),
    /** Clay's offset, negative down. */
    offset: () => ui.scrollOffset("sky-feed"),
    /** The scrollbar's thumb, from the last frame's layout. */
    thumb: () => box("sky-thumb"),
  };
}

// --- the app's numbers: ago() against the fixture's capture and Intl's two-significant-digit compact form
{
  check("the first Discover post is an hour old", ago(1790948585), "1h");
  check("Titania's is 40 minutes", ago(1790953138), "40m");
  check("Erik's is now", ago(1790955571), "now");
  check("David's is 7 minutes", ago(1790955129), "7m");
  check("the compact form of 310 is itself", num(310), "310");
  check("3,500 is 3.5K", num(3500), "3.5K");
  check("1,000 drops the .0", num(1000), "1K");
  check("21,327 rounds to 21K", num(21327), "21K");
  check("999,999 rounds up into 1M", num(999999), "1M");
}

// --- the page: the bar 64, the feed the rest (664), the status line 32; three cards with 8px gaps and 12px padding
{
  const p = fresh();
  check("the bar is 64 tall", p.box("sky-bar"), [0, 0, 360, 64]);
  check("the feed takes the rest of the window", p.box("sky-feed"), [0, 64, 360, 664]);
  check("the status line is the last 32", p.box("sky-status"), [0, 728, 360, 32]);
  check("the first card is 12 in from the feed and 12 below the bar", p.card(0).slice(0, 2), [12, 76]);
  check("and one card wide", p.card(0)[2], 336);
  check("a gap of 8 between cards", p.card(1)[1]! - p.card(0)[1]! - p.card(0)[3]!, 8);
  check("the first card is 190 tall", p.card(0)[3], 190);
  check("the status says Discover has three posts", p.status(), "Discover — 3 posts");
  check("nothing is focused at first", p.input.focus.focused(), null);
  check("and nothing is scrolled", p.offset(), 0);
}

// --- the feed's first mount: every card arrives 12px low and at 0 opacity, on `spatial` (the group's translate) and
//     `effect` (its opacity), each one 50ms after the one above it, 0.3s long; the layout does not move while they
//     arrive, they settle exactly on the literals, and reduced motion has them there at once
{
  const p = fresh(undefined, { entry: true });
  const bottoms = [266, 482, 700];
  /** How far each card is drawn below its box: its drawn bottom edge, less where the box ends. A card that is not drawn
   *  at all (still at 0 opacity) counts as the full 12, which is where it waits before its delay is up. */
  const offs = () =>
    bottoms.map((b) => (apart(p.pixel(180, b - 20), PAGE) <= 1 ? 12 : p.below(180, b) - b));
  check("the cards' boxes are the settled ones while they arrive", [p.card(0), p.card(1), p.card(2)].map((b) => b.slice(0, 2)), [[12, 76], [12, 274], [12, 490]]);
  check("the first frame draws no card at all: 12px low and at 0", offs(), [12, 12, 12]);
  check("... and the feed's own top is the page, where the first card will be", p.pixel(180, 80), PAGE);
  for (let i = 0; i < 6; i++) p.step();
  const mid = offs();
  check("six frames in, the cards are drawn below their boxes", mid.every((d) => d > 0), true);
  check("each card further behind the one above it: the entry is staggered", mid[0]! < mid[1]! && mid[1]! < mid[2]!, true);
  check("and none is past the 12px it starts at", mid.every((d) => d <= 12), true);
  console.log(`solid/sky.test.ts: the entry 8 frames in: card offsets ${mid.join(", ")} px of 12`);
  p.settle(30);
  check("the entry settles exactly on the boxes", offs(), [0, 0, 0]);
  check("and the first card is the gradient's literal again", near(p.pixel(180, 80), PANEL, 2), true);
  // reduced motion: no stagger and nothing to wait for — the settled frame on the first one
  setReducedMotion(true);
  const q = fresh(undefined, { entry: true });
  check("reduced motion draws the cards at rest at once", [q.below(180, 266), q.below(180, 482), q.below(180, 700)], bottoms);
  setReducedMotion(false);
}

// --- the avatars: the card's panel at the corners of the box, the author's hue inside the disc, and another author on
//     the Science feed (the pictures are drawn, not fills: transparent outside the disc, so the panel shows through)
{
  const p = fresh();
  const a = p.avatar(0);
  check("the avatar is a 40x40 box", a, [24, 88, 40, 40]);
  check("its corner is the card's panel: the disc's outside is transparent", near(p.pixel(a[0]! + 1, a[1]! + 1), PANEL), true);
  check("the disc's middle is the head, a lighter tint of the hue", near(p.pixel(a[0]! + 20, a[1]! + 20), [99, 178, 255], 1), true);
  check("and its body is michaelwarburton's hue", near(p.pixel(a[0]! + 10, a[1]! + 10), [74, 132, 214], 1), true);
  p.science();
  const e = p.avatar(0);
  check("the Science feed's first post has a box in the same place", e, [24, 88, 40, 40]);
  check("Erik's hue is the one committed for erikstrub", near(p.pixel(e[0]! + 10, e[1]! + 10), [126, 108, 200], 1), true);
  check("and not the panel", p.pixel(e[0]! + 10, e[1]! + 10).join() !== PANEL.join(), true);
}

// --- hover: the card and the tab under the pointer lighten, and neither moves. It is a 120ms fade (the next block is
//     the frames of it), so the settled colours are a handful of frames in
{
  const p = fresh();
  const card = p.card(1);
  check("a card at rest is the panel", near(p.pixel(180, 300), PANEL), true);
  p.point(180, 300);
  p.settle(20);
  check("under the pointer the card is the hover step", near(p.pixel(180, 300), HOVER, 2), true);
  check("with its box unchanged", p.card(1), card);
  const tab = p.box("sky-tabs-tab-1");
  check("a tab at rest is the page behind it", p.pixel(tab[0]! + 4, tab[1]! + 14), PAGE);
  p.point(tab[0]! + 4, tab[1]! + 14);
  p.settle(20);
  check("the tab under the pointer lightens too", p.pixel(tab[0]! + 4, tab[1]! + 14), HOVER);
}

// --- a hover is a fade, not a switch: 120ms of `effect` through the four background channels and the gradient's own
//     opacity, retargeted from the presented colour, so a fast leave and re-enter never jumps; the frame at rest and the
//     settled hover are the literals
{
  const p = fresh();
  const rest = p.pixel(180, 300);
  p.point(180, 300);
  const entering: number[][] = [];
  for (let f = 0; f < 6; f++) {
    p.step();
    entering.push(p.pixel(180, 300));
  }
  p.settle(20);
  const hover = p.pixel(180, 300);
  check("the settled hover is the hover tone", near(hover, HOVER, 2), true);
  check("the third frame of the hover is between the resting colour and the hover's", between(entering[2]!, rest, hover), true);
  check("... and the colour keeps going the same way", apart(entering[4]!, rest) > apart(entering[1]!, rest), true);
  // the leave runs back down the same path, and the card rests on its gradient again
  p.point(180, 60);
  const leaving: number[][] = [];
  for (let f = 0; f < 6; f++) {
    p.step();
    leaving.push(p.pixel(180, 300));
  }
  check("the third frame of the leave is between the hover and the resting colour", between(leaving[2]!, rest, hover), true);
  p.settle(20);
  check("and the card at rest is the gradient's literal", p.pixel(180, 300).join(), rest.join());
  // a quick leave and re-enter: the track retargets from the presented colour, so no frame may jump
  const q = fresh();
  q.point(180, 300);
  q.settle(20);
  const path: number[][] = [];
  q.point(180, 60);
  for (let f = 0; f < 2; f++) {
    q.step();
    path.push(q.pixel(180, 300));
  }
  q.point(180, 300);
  for (let f = 0; f < 6; f++) {
    q.step();
    path.push(q.pixel(180, 300));
  }
  const steps = path.slice(1).map((c, i) => apart(c, path[i]!));
  check("a quick leave and re-enter never jumps (no frame over 5/255)", Math.max(...steps) <= 5, true);
  console.log(`solid/sky.test.ts: the hover's colour up ${entering.slice(0, 5).map((c) => c.join("/")).join(" ")}, a jump back in: the widest frame ${Math.max(...steps)}/255`);
}

// --- the tab's 2px underline is the tab's own border colour, so it fades: in on the tab that becomes active and out of
//     the one that was (a colour, not a slide, and the border is 2px on both, so nothing moves)
{
  const p = fresh();
  const b0 = p.box("sky-tabs-tab-0");
  const b1 = p.box("sky-tabs-tab-1");
  // the last row of the 2px bottom border, 4px in from the left edge (clear of the glyph)
  const line = (b: number[]): [number, number] => [b[0]! + 4, Math.floor(b[1]! + b[3]! - 1)];
  const [x0, y0] = line(b0);
  const [x1, y1] = line(b1);
  check("at rest the active tab's underline is the accent", p.pixel(x0, y0), [59, 156, 240]);
  check("and the tab that is not active has none: the page", p.pixel(x1, y1), PAGE);
  const box0 = p.box("sky-tabs-tab-0");
  p.clickOn("sky-tabs-tab-1");
  const midNew = p.pixel(x1, y1);
  const midOld = p.pixel(x0, y0);
  check("a mid frame of the new tab's underline is a blend of the page and the ring", between(midNew, PAGE, [92, 176, 255]), true);
  check("and the old tab's is a blend of the accent and the page", between(midOld, PAGE, [59, 156, 240]), true);
  check("the tabs keep their boxes: nothing slides", [p.box("sky-tabs-tab-0"), p.box("sky-tabs-tab-1")], [box0, b1]);
  p.settle(20);
  check("the settled underline is the ring, the clicked tab having the focus", p.pixel(x1, y1), [92, 176, 255]);
  check("and the old tab's is gone", p.pixel(x0, y0), PAGE);
  console.log(`solid/sky.test.ts: the underline's fade ${midNew.join("/")} on the way up, ${midOld.join("/")} on the way down`);
}

// --- the tab labels' colour is a text's own: a text's colour is not in its tab's box, so the page fades the text
//     itself (`FIELDS.TEXT_COLOR` on the `<text>`'s id, fields 51..54) on `effect(0.15)`, the underline's 120ms fade
//     beside it. A label that has settled writes nothing: its literal is the end it is on
{
  const p = fresh();
  const ACCENT = [59, 156, 240]; // the accent token: the active label and the underline
  /** The label's ink in the tab's box: the pixel furthest from the page among the box's inner rows — the glyph's core,
   *  not a blend of an edge, and clear of the focus ring (2px inside the box) and of the underline. */
  const ink = (i: number): number[] => {
    const b = p.box(`sky-tabs-tab-${i}`);
    const [x0, y0, x1, y1] = [b[0]! + 4, b[1]! + 4, b[0]! + b[2]! - 4, b[1]! + b[3]! - 5];
    let best = { d: -1, c: [0, 0, 0] };
    for (let y = Math.floor(y0); y < Math.floor(y1); y++)
      for (let x = Math.floor(x0); x < Math.floor(x1); x++) {
        const c = p.pixel(x, y);
        const d = Math.max(...c.map((v, i) => Math.abs(v - PAGE[i]!)));
        if (d > best.d) best = { d, c };
      }
    return best.c;
  };
  check("at rest the active tab's label is the accent", near(ink(0), ACCENT, 1), true);
  check("and the one next to it the muted token", near(ink(1), MUTED, 1), true);
  // the tablist is the page's first stop, on the active tab: an arrow switches the feed without a pointer on it, so no
  // hover colour is in the way of the label's own
  p.tap("Tab");
  check("Tab focuses the tablist on the active tab", p.input.focus.focused(), "sky-tabs-tab-0");
  p.input.down("ArrowRight");
  p.step(); // the switch: both labels retarget, this frame shows where each one was
  const up: number[][] = [ink(1)];
  const down: number[][] = [ink(0)];
  for (let f = 0; f < 4; f++) p.step(), up.push(ink(1)), down.push(ink(0));
  p.settle(20);
  const settledNew = ink(1);
  const settledOld = ink(0);
  p.input.up("ArrowRight");
  p.step();
  console.log(
    `tab labels: the new one ${up.map((c) => c.join("/")).join(" ")} -> ${settledNew.join("/")}, ` +
      `the old one ${down.map((c) => c.join("/")).join(" ")} -> ${settledOld.join("/")}`,
  );
  check("the label that became active starts where it was: the muted token", near(up[0]!, MUTED, 1), true);
  check("and the next frame is strictly between the muted token and the accent", between(up[1]!, MUTED, ACCENT), true);
  check("the colour keeps going the same way", apart(up[3]!, MUTED) > apart(up[1]!, MUTED), true);
  check("it reaches the accent, the literal its style now is", near(settledNew, ACCENT, 1), true);
  check("the label that was active fades the other way: between the accent and the muted token", between(down[1]!, ACCENT, MUTED), true);
  check("and ends on the muted token", near(settledOld, MUTED, 1), true);
  check("the tabs' boxes did not move", p.box("sky-tabs-tab-0").length, 4);
  // a quick switch back: the tracks retarget from the presented colour, so no frame leaves the two ends
  const q = fresh();
  q.tap("Tab");
  q.input.down("ArrowRight");
  for (let f = 0; f < 3; f++) q.step();
  q.input.up("ArrowRight"), q.step();
  q.input.down("ArrowLeft");
  const path: number[][] = [];
  for (let f = 0; f < 6; f++) q.step(), path.push(ink(1));
  q.input.up("ArrowLeft");
  const ends = [MUTED, ACCENT];
  check(
    "a quick switch back never leaves the two ends",
    path.every((c) => c.every((v, i) => v >= Math.min(ends[0]![i]!, ends[1]![i]!) - 1 && v <= Math.max(ends[0]![i]!, ends[1]![i]!) + 1)),
    true,
  );
  const steps = path.slice(1).map((c, i) => apart(c, path[i]!));
  check("and no frame of it jumps: the widest step is a fifth of the range at most", Math.max(...steps) <= 20, true);
  console.log(`tab labels: the quick switch back ${path.map((c) => c.join("/")).join(" ")}, the widest frame ${Math.max(...steps)}/255`);
}

// --- the card's gradient (css.backgroundImage): a vertical linear gradient, 180deg, from the panel token at the top to
//     the deep one at the bottom; the same across the card, gone at its edge, and the hover overrides it whole
{
  const p = fresh();
  const card = p.card(0);
  const [x0, y0, w, h] = [card[0]!, card[1]!, card[2]!, card[3]!];
  // a column in the card's right padding: no text, no avatar; 4px in from each end so the rounded corners are out
  const column: number[][] = [];
  for (let y = y0 + 4; y < y0 + h - 4; y++) column.push(p.pixel(x0 + w - 8, y));
  const top = column[0]!,
    bottom = column[column.length - 1]!;
  check("the card's gradient runs top to bottom: its top is lighter", top[0]! >= bottom[0]! + 3, true);
  // the two ends are single pixels, each dithered by one level either way: 5/255, give or take two
  check("by 5/255 over these 182px, within the dither at each end", Math.abs(top[0]! - bottom[0]! - 5) <= 2, true);
  check("it starts at the panel token", near(top, PANEL), true);
  check("and ends at the deep one", near(bottom, PANEL_DEEP), true);
  // a row in the card's top padding, above the avatar and the name: a vertical gradient does not vary across
  const row: number[][] = [];
  for (let x = x0 + 8; x < x0 + w - 8; x++) row.push(p.pixel(x, y0 + 4));
  const across = Math.max(...row.map((c) => c[0]!)) - Math.min(...row.map((c) => c[0]!));
  check("the gradient is vertical: one row varies by the dither's two levels at most", across <= 2, true);
  // its edges: one pixel outside the card is the page, the card's own first pixel is the gradient
  const mid = y0 + Math.floor(h / 2);
  check("above the card is the page, not the gradient", p.pixel(180, y0 - 1), PAGE);
  check("left of it is the page too", p.pixel(x0 - 1, mid), PAGE);
  check("and its own left edge is the gradient", p.pixel(x0, mid).join() === PAGE.join(), false);
  check("its own top edge is the gradient", p.pixel(180, y0).join() === PAGE.join(), false);
  // the bands: the dither's own measure. A column of the card is one luminance a row; an 8-bit ramp shows 6 runs of ~30px
  // in the dark theme (12 of ~15px in the light one), and a dither breaks them into stipple, so the count rises and the
  // longest run falls. Both are printed; the threshold below is what the dither measured.
  const dark = bands(column);
  check("the dither breaks the bands: no run of one luminance is 12px or longer", dark.longest < 12, true);
  check("and the runs are many more than the six the ramp had", dark.runs > 100, true);
  console.log(
    `solid/sky.test.ts: the card's gradient down ${column.length}px: ${new Set(column.map((c) => c.join())).size} colours, ` +
      `${dark.runs} runs, the longest ${dark.longest}px`,
  );
  // the text: the body's ink is inside the box, so it takes the same one-level step. Its core is the ink token when
  // undithered, so a core pixel is at most 1/255 away from it; and the ink's mask at half the token cannot move, because
  // no pixel of the text sits at the threshold a step could cross — so the ink's box is the undithered one.
  const body = p.body(0);
  const box = (b: number[], pred: (c: number[]) => boolean) => {
    const hit: [number, number][] = [];
    for (let y = b[1]!; y < b[1]! + b[3]!; y++)
      for (let x = b[0]!; x < b[0]! + b[2]!; x++) if (pred(p.pixel(x, y))) hit.push([x, y]);
    return hit;
  };
  const ink = box(body, (c) => c[1]! >= 128);
  const peak = Math.max(...box(body, () => true).map(([x, y]) => p.pixel(x, y)[1]!));
  const flat = box(body, (c) => c[1]! === peak);
  const inkBox = [Math.min(...ink.map(([x]) => x)), Math.min(...ink.map(([, y]) => y)), Math.max(...ink.map(([x]) => x)), Math.max(...ink.map(([, y]) => y))];
  // the only pixels a one-level step can move across the mask's threshold are those at it: if none of them is on the
  // ink's edge, the mask's box is the undithered one — the edge pixels are blends 60+ levels off, nothing to flip
  const edge = box(body, (c) => c[1]! === 127 || c[1]! === 128);
  check("the body draws ink", ink.length > 100, true);
  check("its flat core is the ink token, stepped by at most 1/255", flat.every(([x, y]) => apart(p.pixel(x, y), INK) <= 1), true);
  check("the ink's edge is no blend at the mask's threshold, so its box cannot move", edge.filter(([x, y]) => x <= inkBox[0]! || x >= inkBox[2]! || y <= inkBox[1]! || y >= inkBox[3]!).length, 0);
  check("the ink lies inside the body's box", inkBox[0]! >= body[0]! && inkBox[1]! >= body[1]! && inkBox[2]! < body[0]! + body[2]! && inkBox[3]! < body[1]! + body[3]!, true);
  console.log(
    `solid/sky.test.ts: the body's ink ${ink.length}px in a ${inkBox[2]! - inkBox[0]! + 1}x${inkBox[3]! - inkBox[1]! + 1} box, ` +
      `its ${flat.length} flat pixels at most 1/255 off the token, ${edge.length} at the threshold and none on the edge`,
  );
  // the dither is the pixels' position and nothing else: a second page at rest draws the identical frame
  const q = fresh();
  const again: number[][] = [];
  for (let y = y0 + 4; y < y0 + h - 4; y++) again.push(q.pixel(x0 + w - 8, y));
  check("the dither is deterministic: the same settled frame twice is identical", again.join(), column.join());
  // the hover overrides the whole gradient: the card under the pointer starts at the hover token
  const p2 = fresh();
  const card1 = p2.card(1);
  const at = p2.pixel(180, card1[1]! + 30);
  p2.point(180, card1[1]! + 30);
  p2.settle(20);
  const hovered = p2.pixel(180, card1[1]! + 30);
  check("the hover replaces the gradient: lighter by more than 3/255", hovered[0]! >= at[0]! + 3, true);
  check("at the hover token", near(hovered, [33, 39, 48], 2), true);
}

// --- the light theme's card is the same gradient, white to the light deep token: top-lighter there too (not inverted)
{
  const p = fresh("light");
  const card = p.card(0);
  const [x0, y0, w, h] = [card[0]!, card[1]!, card[2]!, card[3]!];
  const column: number[][] = [];
  for (let y = y0 + 4; y < y0 + h - 4; y++) column.push(p.pixel(x0 + w - 8, y));
  const [top, bottom] = [column[0]!, column[column.length - 1]!];
  check("the light card starts at white", near(top, LIGHT_PANEL, 1), true);
  check("and ends at the light deep token", near(bottom, LIGHT_PANEL_DEEP, 1), true);
  check("lighter at its top by at least 3/255", top[0]! >= bottom[0]! + 3, true);
  check("the page around it is the light one", p.pixel(180, y0 - 1), [243, 245, 247]);
  // ... and the same measure of the bands: 12 runs of ~15px undithered, stipple after the dither
  const light = bands(column);
  check("the light card's bands are stipple too: no run of one luminance is 12px or longer", light.longest < 12, true);
  check("with many more runs than the twelve", light.runs > 100, true);
  console.log(
    `solid/sky.test.ts: the light card's gradient down ${column.length}px: ` +
      `${new Set(column.map((c) => c.join())).size} colours, ${light.runs} runs, the longest ${light.longest}px`,
  );
}

// --- the text wraps: the body of Erik's long post is four 20px lines, and Titania's long media line makes her card
//     taller than Michael's one-line one
{
  const p = fresh();
  check("alexjungle's body wraps to two lines", p.body(2)[3], 40);
  check("Titania's card carries a wrapped media line", p.card(1)[3]! > p.card(0)[3]!, true);
  check("one 18px media line more", p.card(1)[3]! - p.card(0)[3]!, 18);
  p.science();
  check("Erik's body is four lines of 20", p.body(0), [24, 182, 312, 80]);
  check("which is two lines at least", p.body(0)[3]! >= 2 * 20, true);
  check("David's body is three lines", p.body(1)[3], 60);
}

// --- the wheel: one notch is a 10px step on a track — it glides, the first frame moves most and each frame after moves
//     less — and the bar and status stay put
{
  const p = fresh();
  p.science();
  const bar = p.box("sky-bar");
  const status = p.box("sky-status");
  const first = p.card(0);
  p.point(180, 400);
  const ys = [0];
  p.notch(1);
  ys.push(-p.offset());
  for (let i = 0; i < 40; i++) {
    p.step();
    ys.push(-p.offset());
  }
  const steps = ys.map((y, i) => (i ? y - ys[i - 1]! : 0));
  check("one notch settles at exactly 10px", r(ys[ys.length - 1]!), 10);
  check("the notch's first frame is its largest step (a glide, not a jump)", r(steps[1]!), r(Math.max(...steps)));
  check("and the steps decay", steps[1]! > steps[11]! && steps[11]! > steps[31]!, true);
  check("the first card ends 10px up", r(p.card(0)[1]!), r(first[1]! - 10));
  check("the bar did not move", p.box("sky-bar"), bar);
  check("nor did the status line", p.box("sky-status"), status);
  console.log(`solid/sky.test.ts: one notch, ${steps.slice(1, 7).map((s) => s.toFixed(2)).join(" ")} … px a frame`);
}

// --- a flick: eight notches one a frame keep going after the last one, faster than any notch, and stop at the clamped
//     end in a finite number of frames; the stored frame is that resting frame
{
  const p = fresh();
  p.science();
  p.point(180, 396);
  const ys = [0];
  for (let i = 0; i < 8; i++) {
    p.notch(1);
    ys.push(-p.offset());
  }
  let frames = 0;
  // 90 frames, not 60: the feed stops after ~20, and the scrollbar then holds 0.6s and fades out in 0.15s (the stored
  // frame is the one at rest, no thumb on it)
  for (let i = 0; i < 90; i++) {
    const before = -p.offset();
    p.step();
    const y = -p.offset();
    ys.push(y);
    if (y !== before) frames = i + 1;
  }
  const steps = ys.map((y, i) => (i ? y - ys[i - 1]! : 0));
  const peak = Math.max(...steps);
  check("the flick reaches the clamped end", r(p.offset()), -78);
  check("its fastest frame is past the first notch's step", peak > steps[1]!, true);
  check("and the tail has stopped", steps.slice(-10).every((s) => Math.abs(s) < 0.5), true);
  check("it comes to rest in a finite number of frames", frames < 60, true);
  console.log(
    `solid/sky.test.ts: eight notches, the steps ${steps.slice(1, 8).map((s) => s.toFixed(2)).join(" ")} px, ` +
      `peak ${peak.toFixed(2)}, then ${steps.slice(8, 14).map((s) => s.toFixed(2)).join(" ")} … rest after ${frames} frames`,
  );
  // the same state as test.sh's stored frame (the pointer on the feed's middle): the frame after the fling is that frame
  check(
    "the settled frame is frames/sky-scrolled.png",
    ui.diffPng(
      new URL("./frames/sky-scrolled.png", import.meta.url).pathname,
      new URL("./frames/sky-scrolled.png.actual.png", import.meta.url).pathname,
    ),
    0,
  );
}

// --- the rubber band at the feed's ends: a wheel past the clamp moves the content with an end's resistance
//     (f(x) = (1 - 1/(x·c/d + 1))·d, c = 0.55, d the viewport's 664), it holds while the notches come, and 80ms after
//     the last one it springs back to the clamp (spatial(0.35, 0.1)), settling exactly on it. A notch the other way
//     moves it back; reduced motion has no band at all.
{
  const p = fresh();
  p.science();
  p.wheel(8);
  p.settle(60);
  const end = -p.offset();
  check("the feed is at its end first: 78", r(end), 78);
  // four notches down, each one at the end or over it: the band, at the resistance's own bound for the raw 40px
  for (let i = 0; i < 4; i++) p.notch(1);
  const banded = -p.offset();
  check("a wheel past the end pushes the content out of it", banded > end, true);
  check("by the resistance, not by the raw 40px", banded - end < 40, true);
  check("and exactly its f(40) on the 664px viewport", r(banded), r(end + rubber(40, 664)));
  check("... 21.3px of the raw 40 past the end", Math.abs(banded - end - 21.3) < 0.1, true);
  // a notch up while banded comes back towards the end
  p.notch(-1);
  const back = -p.offset();
  check("a notch the other way while banded moves it back", back < banded && back > end, true);
  // the hold: four frames (67ms) without a notch and it is still out of the end, then it lets go
  let held = 0;
  for (let i = 0; i < 4; i++) {
    p.step();
    if (-p.offset() > end) held++;
  }
  check("the band is held for the first frames after the last notch", held, 4);
  let frames = 0;
  for (let i = 0; i < 60; i++) {
    const before = -p.offset();
    p.step();
    if (Math.abs(-p.offset() - before) > 0.01) frames = i + 1;
  }
  check("it springs back to the clamp, exactly", r(p.offset()), -78);
  check("in a finite number of frames", frames > 0 && frames < 60, true);
  console.log(`solid/sky.test.ts: the band 4 notches past 78: ${r(banded)} (+${r(banded - end)} of 40 raw), one up to ${r(back)}, held ${held} frames, back at 78 after ${frames} more`);
  // a fling into the end is a scroll, not a pull: it stops at the clamp (the frame of the last notch is a glide, so it
  // does not jump into the band)
  const q = fresh();
  q.science();
  q.point(180, 396);
  const ys = [0];
  for (let i = 0; i < 8; i++) {
    q.notch(1);
    ys.push(-q.offset());
  }
  const steps = ys.map((y, i) => (i ? y - ys[i - 1]! : 0));
  check("a flick into the end never jumps into the band", Math.max(...steps) < 20, true);
  q.settle(60);
  check("and it rests on the clamp", r(q.offset()), -78);
  // reduced motion: no band, a hard clamp
  setReducedMotion(true);
  const b = fresh();
  b.science();
  b.wheel(8);
  b.settle(20);
  for (let i = 0; i < 4; i++) b.notch(1);
  check("reduced motion clamps hard: no band", r(b.offset()), -78);
  setReducedMotion(false);
}

// --- the drag (direct manipulation): a press inside the feed grabs the offset and the pointer moves it 1:1 from the
//     press point, with no animation in between; past an end `rubber` resists it as the wheel is resisted; the release
//     flings on the speed of the last frames and settles, or lets the band go at an end; a press that travelled is not a
//     click on the card under it; reduced motion stops at the release
{
  const p = fresh();
  p.science();
  p.point(180, 300);
  // five held frames, 2px up each: the offset is the pointer's own travel from the press point, frame for frame
  const dys = [-2, -2, -2, -2, -2];
  const held = p.drag(180, 300, dys);
  const travelled = dys.map((_, i) => -dys.slice(0, i + 1).reduce((a, b) => a + b, 0));
  check("each held frame's offset is the pointer's travel from the press point", held, travelled);
  const released = -p.offset();
  check("the release frame is already the fling's, a step on from where the finger left it", released > 10 && released < 13, true);
  p.step();
  const next = -p.offset();
  check("the frame after the release keeps moving the same way", next > released, true);
  p.settle(150);
  const land = -p.offset();
  check("and the fling settles inside the content, farther than the release", land > released && land < 78, true);
  check("at a deterministic place: the speed of the last five frames, projected", r(land), 54.95);
  console.log(
    `solid/sky.test.ts: the drag 10px in five frames, released at ${r(released)}, the next frame ${r(next)}, rest ${r(land)}`,
  );
  // a drag past the end is resisted by the same f(x) as the wheel's pull on the 664px viewport
  const q = fresh();
  q.science();
  q.point(180, 300);
  const far = q.drag(180, 300, [-9, -9, -9, -9, -9, -9, -9, -9, -9, -9, -9, -9, -9, -9, -9, -9, -9]); // 153px up
  const raw = r(far[far.length - 1]!);
  check("a drag past the end is resisted by rubber, not followed 1:1", raw, r(78 + rubber(153 - 78, 664)));
  check("and it is short of the raw travel", raw < 153, true);
  q.step();
  q.settle(60);
  check("after the release the band lets go and the feed rests on the clamp", r(q.offset()), -78);
  console.log(`solid/sky.test.ts: a 153px drag past the end presents ${raw} (rubber's f(75) of it), back on 78 at rest`);
  // a drag that travelled is not a click on the card it started on; one that did not is
  const c = fresh();
  const card = c.card(1);
  c.drag(card[0]! + 100, card[1]! + 40, [-30]);
  check("a drag does not select the card under it", c.status(), "Discover — 3 posts");
  c.settle(60);
  check("the drag left the feed at its end: Discover's content is shorter than the viewport", r(c.offset()), 0);
  c.clickOn("sky-card-1");
  check("a click without movement still selects", c.status(), "Titania — 2 of 3");
  // a press outside the feed grabs nothing: the bar keeps its own press and the feed stays where it is
  const b = fresh();
  b.science();
  b.drag(300, 20, [-10, -10, -10]);
  check("a press on the bar does not drag the feed", r(b.offset()), 0);
  // reduced motion: the drag is still 1:1 (it is direct manipulation), and the release flings nothing: the offset stops
  // where the finger left it, clamped
  setReducedMotion(true);
  const rm = fresh();
  rm.science();
  rm.point(180, 300);
  const rmHeld = rm.drag(180, 300, [-10, -10, -10, -10, -10]);
  check("reduced motion drags 1:1 too", rmHeld, [10, 20, 30, 40, 50]);
  check("and the release stops the feed where the finger left it", r(rm.offset()), -50);
  rm.settle(60);
  check("with no fling after it", r(rm.offset()), -50);
  rm.drag(180, 300, [-10, -10, -10, -10, -10, -10, -10, -10]);
  check("a drag past the end is clamped hard, without a band", r(rm.offset()), -78);
  setReducedMotion(false);
}

// --- a second wheel mid-flight: it retargets from the presented (x, v), so no frame jumps, and it bends the throw back
//     by its notch (two notches fling towards 74; one notch up mid-decay lands at 64 instead)
{
  const p = fresh();
  p.science();
  p.point(180, 396);
  p.notch(1);
  p.notch(1); // two notches: the release is a decay, mid-flight
  p.settle(3);
  const y0 = -p.offset();
  p.step();
  const before = -p.offset();
  const prevStep = before - y0;
  check("mid-flight, the feed is moving", Math.abs(prevStep) > 0.5, true);
  const ys = [before];
  p.notch(-1); // one notch up: the throw's landing drops by 10px, from 74 to 64
  ys.push(-p.offset());
  for (let i = 0; i < 60; i++) {
    p.step();
    ys.push(-p.offset());
  }
  const steps = ys.map((y, i) => (i ? y - ys[i - 1]! : 0));
  let worst = 0;
  for (let i = 2; i < steps.length; i++) worst = Math.max(worst, Math.abs(steps[i]!) - Math.abs(steps[i - 1]!));
  check("no frame's step exceeds the previous one by more than the notch (10px)", Math.round(worst * 100) / 100 <= 10, true);
  check("and it turns the throw back: the rest is 64, ten px above the 74 it was heading to", r(ys[ys.length - 1]!), 64.05);
  console.log(
    `solid/sky.test.ts: the up-notch at ${before.toFixed(2)}px mid-decay, worst step ${worst.toFixed(2)}px, rest 64px`,
  );
}

// --- the keys: Down and Up 40, PageDown a viewport (clamped), Home and End to the ends, all on the same track (the
//     offset eases to the target instead of jumping)
{
  const p = fresh();
  p.science();
  check("the clicked tab has the focus", p.input.focus.focused(), "sky-tabs-tab-1");
  p.tap("Tab");
  check("the next Tab reaches the feed", p.input.focus.focused(), "sky-feed");
  check("the feed wears the ring at its edge", p.pixel(1, 400), RING);
  check("2px in, its own background", p.pixel(3, 400), PAGE);
  p.tap("ArrowDown");
  check("Down has not jumped to 40", r(p.offset()) > -40 && r(p.offset()) < 0, true);
  p.settle();
  check("Down settles at 40", r(p.offset()), -40);
  p.tap("ArrowUp");
  p.settle();
  check("Up comes back", r(p.offset()), 0);
  p.tap("ArrowDown");
  p.settle();
  p.tap("ArrowDown");
  p.settle();
  check("two Downs clamp at the content (742 - 664): -78", r(p.offset()), -78);
  p.tap("Home");
  check("Home moves with a track, not a jump", r(p.offset()) > -78 && r(p.offset()) < 0, true);
  p.settle();
  check("and reaches the top", r(p.offset()), 0);
  p.tap("End");
  p.settle();
  check("End goes to the last screenful: 742 - 664", r(p.offset()), -78);
  p.tap("PageDown");
  p.settle();
  check("PageDown at the end does not pass it", r(p.offset()), -78);
  p.tap("PageUp");
  p.settle();
  check("PageUp a viewport (664) reaches the top from the end", r(p.offset()), 0);
  p.tap("Home");
  p.settle();
  check("and Home puts it back", r(p.offset()), 0);
}

// --- the tabs: clicking one switches the feed, and the News feed is the app's empty case
{
  const p = fresh();
  p.science();
  check("Science is not Discover any more", p.texts().includes("Second paper of Marco (open access) on Tc-99m is online, congrats! Good timing for the weekend.\n\nwww.sciencedirect.com/science/arti..."), true);
  check("its status names the feed", p.status(), "Science — 3 posts");
  p.news();
  check("News has no first card", p.box("sky-card-0"), []);
  check("no avatar either", p.box("sky-avatar-0"), []);
  const empty = p.box("sky-empty");
  check("the empty feed fills the viewport's content box", empty, [12, 76, 336, 640]);
  const muted: [number, number][] = [];
  for (let y = empty[1]!; y < empty[1]! + empty[3]!; y++)
    for (let x = empty[0]!; x < empty[0]! + empty[2]!; x++)
      if (p.pixel(x, y).join() === MUTED.join()) muted.push([x, y]);
  check("the app's own line is drawn in the muted token", muted.length > 0, true);
  const xs = muted.map(([x]) => x);
  check("centred in the feed: the line's middle is near x 180", Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - 180) < 4, true);
  check("the status says the feed is empty", p.status(), "News — 0 posts");
  const b0 = p.box("sky-tabs-tab-0");
  const b2 = p.box("sky-tabs-tab-2");
  check("the bar still holds the three tabs", [b0[0], b2[0]! + b2[2]!].map((v) => Math.round(v! * 100) / 100), [71.89, 283.86]);
  p.clickOn("sky-tabs-tab-0");
  check("and Discover comes back", p.card(0).length, 4);
}

// --- a click on a card selects it and opens its thread: the same frame records the selection (the status line names it)
//     and starts the thread's entry, whose first frame is the group at 0 opacity — so this frame still shows the feed
//     through it; back on the feed, the card is the selected one
{
  const p = fresh();
  const card = p.card(1);
  p.clickOn("sky-card-1");
  check("the status names the selected post", p.status(), "Titania — 2 of 3");
  check("the card keeps its box", p.card(1), card);
  check("the click opened the thread over the feed", p.box("sky-thread").length, 4);
  check("the selected card has the accent border (the first frame of the screen is transparent)", near(p.pixel(card[0]!, card[1]! + 100), [59, 156, 240], 1), true);
  check("and the hover gradient it was clicked under", near(p.pixel(180, 300), HOVER, 2), true);
  check("a click on the background keeps it too", (p.point(180, 60), p.status()), "Titania — 2 of 3");
  p.tap("Escape");
  p.settle(40);
  check("and back on the feed it is still the selected card", [p.status(), near(p.pixel(card[0]!, card[1]! + 100), [59, 156, 240], 1)], ["Titania — 2 of 3", true]);
  p.news();
  check("and another feed's status has no selection", p.status(), "News — 0 posts");
}

// --- the page fits: the bar, the feed and the status line inside 360x760, the feed's bottom above it, and Discover's
//     cards (the only feed whose content is shorter than the viewport) inside too
{
  const p = fresh();
  const ids = ["Root", "sky-bar", "sky-feed", "sky-status"];
  for (let i = 0; i < 3; i++) ids.push(`sky-card-${i}`, `sky-avatar-${i}`, `sky-body-${i}`);
  for (const id of ids) {
    const b = p.box(id);
    check(`${id} is inside the window`, b.length === 4 && b[0]! >= 0 && b[1]! >= 0 && b[0]! + b[2]! <= 360 && b[1]! + b[3]! <= 760, true);
  }
  check("the feed ends above the window", p.box("sky-feed")[1]! + p.box("sky-feed")[3]! < 760, true);
  p.science();
  check("the bar, feed and status stay in the window on Science", [p.box("sky-bar"), p.box("sky-feed"), p.box("sky-status")], [[0, 0, 360, 64], [0, 64, 360, 664], [0, 728, 360, 32]]);
  check("the feed is the page's colour", p.pixel(180, 70), PAGE);
}

// --- the scrollbar: a 4px thumb 2px in from the feed's right edge, and none at all when the feed fits (Discover's three
//     short posts). On Science the content is 742 in a 664 viewport: the thumb is 664²/742 tall and travels the rest of
//     the viewport, from the feed's top at 0 to its bottom at the content's end (78)
{
  const p = fresh();
  check("Discover's three posts fit the feed: no thumb (height 0)", [p.box("sky-thumb")[0], p.box("sky-thumb")[3]], [354, 0]);
  p.science();
  const feed = p.box("sky-feed");
  const content = 742;
  const height = Math.max(24, (feed[3]! * feed[3]!) / content);
  const travel = feed[3]! - height;
  const top = p.thumb();
  check("the thumb is 4px wide, 2px in from the feed's right edge", [top[0], top[2], top[0]! + top[2]!], [feed[0]! + feed[2]! - 6, 4, feed[0]! + feed[2]! - 2]);
  check("its height is max(24, 664²/742)", r(top[3]!), r(height));
  check("at the top it starts at the feed's top", r(top[1]!), r(feed[1]!));
  p.point(180, 396);
  p.notch(1);
  p.settle();
  check("one notch moves it by 10 of its 69.8px of travel", r(p.thumb()[1]! - feed[1]!), r((10 / 78) * travel));
  p.wheel(200);
  p.settle(120);
  check("at the end the thumb's bottom is the feed's bottom", [r(p.offset()), r(p.thumb()[1]! + p.thumb()[3]!)], [-78, r(feed[1]! + feed[3]!)]);
  console.log(
    `solid/sky.test.ts: Science's thumb ${p.thumb().slice(0, 2).map(r).join(",")} 4x${r(height)} px, its travel ${r(travel)}: ` +
      `top 0 at the top, ${r((10 / 78) * travel)} at 10, ${r(travel)} at 78`,
  );
}

// --- the fade: at rest the feed's padding shows (no thumb), a notch brings it in over ~10 frames, and it goes out 600ms
//     after the track settles
{
  const p = fresh();
  p.science();
  const feed = p.box("sky-feed");
  const at: [number, number] = [feed[0]! + feed[2]! - 4, feed[1]! + 12];
  const seen = () => p.pixel(at[0], at[1]);
  check("at rest the thumb is not drawn: the feed's padding shows", seen(), PAGE);
  p.point(180, 396);
  p.notch(1);
  const fade: number[][] = [];
  for (let i = 0; i < 8; i++) p.step(), fade.push(seen());
  check("a notch brings it in: a mid frame is between the page and the muted token", fade.some((c) => between(c, PAGE, MUTED)), true);
  p.settle(6);
  check("and it settles on the muted token", near(seen(), MUTED, 1), true);
  p.settle(40);
  check("it stays up while the 600ms of rest runs", near(seen(), MUTED, 1), true);
  const out: number[][] = [];
  for (let i = 0; i < 24; i++) p.step(), out.push(seen());
  check("then it fades out: a frame between the muted token and the page", out.some((c) => between(c, MUTED, PAGE)), true);
  check("and once it is out the page is the page again", seen(), PAGE);
  console.log(
    `solid/sky.test.ts: the thumb's fade in ${fade.slice(0, 4).map((c) => c.join("/")).join(" ")}, ` +
      `out ${out.slice(0, 4).map((c) => c.join("/")).join(" ")}`,
  );
}

// --- the thumb drags the feed: a press on it (while it is visible) grabs it, and the pointer's travel moves the thumb by
//     the same distance — the whole 78px of the content's range over its 69.8px of travel — not the feed's 1:1, and it
//     clamps at both ends
{
  const p = fresh();
  p.science();
  const feed = p.box("sky-feed");
  const content = 742;
  const height = Math.max(24, (feed[3]! * feed[3]!) / content);
  const travel = feed[3]! - height;
  const per = 78 / travel;
  // a key, not a notch: a key's seek starts from rest and settles on its target (a notch carries a velocity into the next
  // one and overshoots), and the thumb is up while the 600ms of rest after it run
  p.tap("Tab");
  p.tap("ArrowDown");
  p.settle(30);
  check("a Down has scrolled 40", r(-p.offset()), 40);
  check("the thumb is up before the press", near(p.pixel(feed[0]! + feed[2]! - 4, p.thumb()[1]! + 12), MUTED, 1), true);
  const from = -p.offset();
  const mid = p.thumb()[1]! + height / 2;
  const held = p.drag(356, mid, [10, 10]);
  check(
    "10px of the pointer moves the thumb 10px, and the offset by the content's range over its travel",
    held.every((y, i) => Math.abs(y - from - (i + 1) * 10 * per) < 0.1),
    true,
  );
  check("... not the feed's own 1:1 drag", Math.abs(held[1]! - from) > 20, true);
  check("the thumb moved with the pointer, by about the same 20px", Math.abs(p.thumb()[1]! - (mid - height / 2) - 20) < 1.5, true);
  p.settle(30);
  check("the release stops it: no fling on a scrollbar", -p.offset(), held[held.length - 1]!);
  // the ends
  p.drag(356, p.thumb()[1]! + height / 2, [travel + 100]);
  check("a drag past the thumb's travel stops on the content's end", p.offset(), -78);
  p.drag(356, p.thumb()[1]! + height / 2, [-travel - 100]);
  check("and the other way on the top", p.offset(), 0);
}

// --- a finger is a pointer: the host's flag reaches the page, a 2px finger drag is already a drag (no 4px mouse slop) so
//     the release is not a card's click, while a 2px mouse drag and a finger's tap that never moves both click
{
  const p = fresh();
  const card = p.card(0);
  const [x, y] = [180, card[1]! + 40];
  p.drag(x, y, [-2]);
  check("a mouse's 2px drag is a click: the card is selected", p.status(), "Michael Warburton — 1 of 3");
  const q = fresh();
  q.drag(x, y, [-2], true);
  check("a finger's 2px drag is not: the status is the feed's", q.status(), "Discover — 3 posts");
  check("... but the feed did move with it", q.offset() < 0, true);
  const t = fresh();
  t.drag(x, y, [-2], true); // a finger's 2px up: the feed scrolls 2px, so the release is still a drag
  const u = fresh();
  u.drag(x, y, [], true);
  check("a finger's tap that never moves still clicks", u.status(), "Michael Warburton — 1 of 3");
}

// --- the author's row is the profile's press and the card's is still the thread's; a closed profile adds no Tab stop
//     (its own screen is solid/profile.test.ts's)
{
  const p = fresh();
  check("a page with the profile closed has the bar's tab and the feed as its stops", p.input.focus.tabOrder(), ["sky-tabs-tab-0", "sky-feed"]);
  check("the author's row has a box of its own in the card", [p.box("sky-author-1")[2], p.box("sky-author-1")[3]], [312, 38]);
  p.clickOn("sky-author-1");
  p.settle(40);
  check("a press on it opens the profile over the feed", p.box("sky-profile"), [0, 64, 360, 696]);
  check("... and not the post's thread", p.box("sky-thread"), []);
  check("the feed's card stays unselected (the profile is a navigation, not a selection)", p.status(), "Discover — 3 posts");
  p.tap("Escape");
  p.settle(40);
  check("Escape closes it: the feed is back", p.box("sky-profile"), []);
}

dispose();
if (failed) process.exit(1);
console.log(
  "solid/sky.test.ts: ago() and the compact numbers, the bar/feed/status layout, the six drawn avatars (the panel at the " +
    "corner, the author's hue in the disc) and their change with the feed, the card's vertical gradient (top to bottom, " +
    "constant across, gone at its edge, the hover's own), the cards' staggered entry (12px low and at 0 opacity, a layout " +
    "that does not move, the literals at rest, reduced motion), the hover's 120ms fade and its leave (a mid colour " +
    "between the two ends, no jump on a quick in and out), the tab's underline fading in and out and its label's own " +
    "colour fading with it (a text's fields, by its id; a quick switch back inside the two ends), the body and media " +
    "wrapping, the wheel's 10px notch on a track with decaying steps and the bar still, a flick to the clamped end and " +
    "its stored frame, a wheel mid-flight turning without a jump, the rubber band at an end (the resistance's f(40), a " +
    "notch back, the 80ms hold, the exact clamp, reduced motion), the pointer's drag of the feed (the offset frame for " +
    "frame from the press point, the resistance past an end, the fling's projected landing, a drag that is not a click, " +
    "a press outside the feed that grabs nothing, and reduced motion's 1:1 drag with no fling), the keyboard scrolling " +
    "the same track (Down/Up 40, " +
    "PageDown a viewport, Home/End), the tabs switching the feed and the empty News case, a card click recording the " +
    "selection, the author's row opening the profile (its own screen is solid/profile.test.ts's), the page fitting",
);
process.exit(0);
