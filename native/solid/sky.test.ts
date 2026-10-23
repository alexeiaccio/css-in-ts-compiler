// What the stored frames of the Sky page cannot show: the avatars are drawn pictures (and change with the feed), the body
// wraps, the wheel and the keys move Clay's scroll offset, the tablist switches the feed and its cards, the News feed is
// empty, and the page fits its window. Driven as the window does it: pointer, wheel and keys in, then a frame.
import "./plugin.ts";

const { ui } = await import("./src/ffi.ts");
const { createFrame } = await import("./src/frame.ts");
const { createInput } = await import("./src/input.ts");
const { El, render, Txt } = await import("./src/renderer.ts");
const { Sky, size, ago, num } = await import("./app/Sky.tsx");

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
const MUTED = [139, 152, 165]; // the muted token
const HOVER = [34, 40, 49]; // a card or tab under the pointer: the hover gradient's top
const RING = [92, 176, 255]; // the feed's focus ring
const LIGHT_PANEL = [255, 255, 255]; // the light theme's card, at its top
const LIGHT_PANEL_DEEP = [240, 243, 246]; // ... and at its bottom
// a gradient's pixel is the stop interpolated at that y, so it is matched within a channel or two
const near = (got: number[], want: number[], d = 2) =>
  got.length === 3 && want.every((v, i) => Math.abs(got[i]! - v) <= d);

let dispose = () => {};
function fresh(theme?: string) {
  dispose();
  const root = new El("root");
  const input = createInput();
  dispose = render(() => Sky({ input }), root);
  const frame = createFrame(root, { theme, onPressMiss: () => input.pressMiss() });
  let at = [-1, -1];
  const step = (down = false) => frame(at[0]!, at[1]!, down, 1 / 60);
  step();
  // Clay keeps a scroll container's offset by its id across `fresh()` calls: put the feed back at its top first
  ui.scrollTo("sky-feed", 0);
  step();

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
    /** `n` wheel notches down over the feed (the pointer goes onto it first: Clay scrolls under the pointer). */
    wheel(n: number) {
      this.point(180, 400);
      ui.wheel(0, -n);
      step();
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
    offset: () => ui.scrollOffset("sky-feed"),
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

// --- the avatars: the card's panel at the corners of the box, the author's hue inside the disc, and another author on
//     the Science feed (the pictures are drawn, not fills: transparent outside the disc, so the panel shows through)
{
  const p = fresh();
  const a = p.avatar(0);
  check("the avatar is a 40x40 box", a, [24, 88, 40, 40]);
  check("its corner is the card's panel: the disc's outside is transparent", near(p.pixel(a[0]! + 1, a[1]! + 1), PANEL), true);
  check("the disc's middle is the head, a lighter tint of the hue", p.pixel(a[0]! + 20, a[1]! + 20), [99, 178, 255]);
  check("and its body is michaelwarburton's hue", p.pixel(a[0]! + 10, a[1]! + 10), [74, 132, 214]);
  p.science();
  const e = p.avatar(0);
  check("the Science feed's first post has a box in the same place", e, [24, 88, 40, 40]);
  check("Erik's hue is the one committed for erikstrub", p.pixel(e[0]! + 10, e[1]! + 10), [126, 108, 200]);
  check("and not the panel", p.pixel(e[0]! + 10, e[1]! + 10).join() !== PANEL.join(), true);
}

// --- hover: the card and the tab under the pointer lighten, and neither moves
{
  const p = fresh();
  const card = p.card(1);
  check("a card at rest is the panel", near(p.pixel(180, 300), PANEL), true);
  p.point(180, 300);
  check("under the pointer the card is the hover step", near(p.pixel(180, 300), HOVER, 2), true);
  check("with its box unchanged", p.card(1), card);
  const tab = p.box("sky-tabs-tab-1");
  check("a tab at rest is the page behind it", p.pixel(tab[0]! + 4, tab[1]! + 14), PAGE);
  p.point(tab[0]! + 4, tab[1]! + 14);
  check("the tab under the pointer lightens too", p.pixel(tab[0]! + 4, tab[1]! + 14), HOVER);
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
  check("by 5/255 over these 182px", top[0]! - bottom[0]!, 5);
  check("it starts at the panel token", near(top, PANEL), true);
  check("and ends at the deep one", near(bottom, PANEL_DEEP), true);
  // a row in the card's top padding, above the avatar and the name: a vertical gradient does not vary across
  const row: number[][] = [];
  for (let x = x0 + 8; x < x0 + w - 8; x++) row.push(p.pixel(x, y0 + 4));
  const across = Math.max(...row.map((c) => c[0]!)) - Math.min(...row.map((c) => c[0]!));
  check("the gradient is vertical: one row varies by at most 1/255", across <= 1, true);
  // its edges: one pixel outside the card is the page, the card's own first pixel is the gradient
  const mid = y0 + Math.floor(h / 2);
  check("above the card is the page, not the gradient", p.pixel(180, y0 - 1), PAGE);
  check("left of it is the page too", p.pixel(x0 - 1, mid), PAGE);
  check("and its own left edge is the gradient", p.pixel(x0, mid).join() === PAGE.join(), false);
  check("its own top edge is the gradient", p.pixel(180, y0).join() === PAGE.join(), false);
  // the bands: how many runs of one luminance a vertical scan of a 190px card shows (this is where a dither step would
  // come in; none is built, and the count is reported)
  const lum = (c: number[]) => Math.round(0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!);
  let runs = 1;
  for (let i = 1; i < column.length; i++) if (lum(column[i]!) !== lum(column[i - 1]!)) runs++;
  check("the bands are runs of one luminance down the card", runs >= 2, true);
  console.log(
    `solid/sky.test.ts: the card's gradient down ${column.length}px: ${new Set(column.map((c) => c.join())).size} colours, ` +
      `${runs} bands of ${(column.length / runs).toFixed(1)}px on average`,
  );
  // the hover overrides the whole gradient: the card under the pointer starts at the hover token
  const card1 = p.card(1);
  const at = p.pixel(180, card1[1]! + 30);
  p.point(180, card1[1]! + 30);
  const hovered = p.pixel(180, card1[1]! + 30);
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

// --- the wheel: Clay moves the feed under the pointer 10px a notch, and the bar and status stay put
{
  const p = fresh();
  p.science();
  const bar = p.box("sky-bar");
  const status = p.box("sky-status");
  const first = p.card(0);
  p.wheel(1);
  check("one notch scrolls the feed to -10", p.offset(), -10);
  check("and lifts the first card by exactly 10", p.card(0)[1], first[1]! - 10);
  check("the bar did not move", p.box("sky-bar"), bar);
  check("nor did the status line", p.box("sky-status"), status);
  check("the cards below moved with it", p.card(1)[1], first[1]! + first[3]! + 8 - 10);
}

// --- the keys: Down and Up 40, PageDown a viewport (clamped), Home and End to the ends, through ui.scroll_to
{
  const p = fresh();
  p.science();
  check("the clicked tab has the focus", p.input.focus.focused(), "sky-tabs-tab-1");
  p.tap("Tab");
  check("the next Tab reaches the feed", p.input.focus.focused(), "sky-feed");
  check("the feed wears the ring at its edge", p.pixel(1, 400), RING);
  check("2px in, its own background", p.pixel(3, 400), PAGE);
  p.tap("ArrowDown");
  check("Down scrolls the feed by 40", p.offset(), -40);
  p.tap("ArrowUp");
  check("Up comes back", p.offset(), 0);
  p.tap("ArrowDown");
  p.tap("ArrowDown");
  check("two Downs clamp at the content (742 - 664): -78", p.offset(), -78);
  p.tap("Home");
  check("Home returns to the top", p.offset(), 0);
  p.tap("End");
  check("End goes to the last screenful: 742 - 664", p.offset(), -78);
  p.tap("PageDown");
  check("PageDown at the end does not pass it", p.offset(), -78);
  p.tap("PageUp");
  check("PageUp a viewport (664) reaches the top from the end", p.offset(), 0);
  p.tap("Home");
  check("and Home puts it back", p.offset(), 0);
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

// --- a click selects a card: the signal only records it, and the status line names it
{
  const p = fresh();
  const card = p.card(1);
  p.clickOn("sky-card-1");
  check("the status names the selected post", p.status(), "Titania — 2 of 3");
  check("the card keeps its box", p.card(1), card);
  check("the selected card has the accent border", p.pixel(card[0]!, card[1]! + 100), [59, 156, 240]);
  check("and the hover gradient it was clicked under", near(p.pixel(180, 300), HOVER, 2), true);
  check("a click on the background keeps it too", (p.point(180, 60), p.status()), "Titania — 2 of 3");
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

dispose();
if (failed) process.exit(1);
console.log(
  "solid/sky.test.ts: ago() and the compact numbers, the bar/feed/status layout, the six drawn avatars (the panel at the " +
    "corner, the author's hue in the disc) and their change with the feed, the card's vertical gradient (top to bottom, " +
    "constant across, gone at its edge, the hover's own), the body and media wrapping, the wheel moving Clay's offset " +
    "10px a notch with the bar still, the keyboard scrolling (Down/Up 40, PageDown a viewport, Home/End), the tabs " +
    "switching the feed and the empty News case, a card click recording the selection, the page fitting",
);
process.exit(0);
