// The Sky page's settings screen (app/Settings.tsx, the page's third screen): the gear in the bar opens it, and its three
// controls are real — the theme radio switches the page's palette, the reduced-motion switch flips the flag the page's
// tracks read, and the text-size radio re-lays the feed's cards out (their height, the feed's content and its thumb).
// Driven as the window does it (pointer and keys in, then a frame): the screen's box, its header and its three rows, the
// values' pixels and states in the accessibility tree, the thread it can be opened from, back returning to the frame it
// left, the entry and reduced motion, the stored frame, and the mutations of each control.
import "./plugin.ts";

const { readFileSync } = await import("node:fs");
const { ui } = await import("./src/ffi.ts");
const { createFrame } = await import("./src/frame.ts");
const { createInput } = await import("./src/input.ts");
const { El, render, Txt } = await import("./src/renderer.ts");
const { Sky, screenOf, size, synthetic } = await import("./app/Sky.tsx");
const { reduced, setReducedMotion } = await import("./src/motion.ts");
const { snapshot } = await import("./a11y.ts");

/** apps/csssky's recorded getPostThread answer (test/fixtures/thread.json), through the page's own shaping: the screen a
 *  thread shows offline. Read here, never fetched. */
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

const PAGE = [16, 19, 22]; // the page token of the dark theme: the bar's ground and the settings screen's
const LIGHT_PAGE = [243, 245, 247]; // ... and of the light one
const PANEL = [27, 32, 38]; // the card's (and a settings row's) panel token
const LIGHT_PANEL = [255, 255, 255]; // ... in the light theme
const ACCENT = [59, 156, 240]; // the ring and the dot of a checked radio
const near = (got: number[], want: number[], d = 2) =>
  got.length === 3 && want.every((v, i) => Math.abs(got[i]! - v) <= d);
/** Is a colour strictly between two others, channel by channel (a group fading in over the page)? */
const between = (c: number[], a: number[], b: number[]) =>
  c.length === 3 &&
  c.join() !== a.join() &&
  c.join() !== b.join() &&
  c.every((v, i) => v >= Math.min(a[i]!, b[i]!) && v <= Math.max(a[i]!, b[i]!));
/** An offset from layout, to the pixel: Clay's float32 turns 78 into 77.99998. */
const r = (x: number) => Math.round(x * 100) / 100;
/** A track settles within 0.5 of its target, and the feed's content is measured from float32 boxes: the machine's slack. */
const around = (got: number, want: number, d = 0.5) => Math.abs(got - want) <= d;
/** How many bytes two frames differ in: 0 is byte-identical (the RGBA of the same 360x760). */
const diffs = (a: Uint8Array, b: Uint8Array): number => {
  if (a.length !== b.length) return -1;
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
  return n;
};

/** A node of the a11y tree, flattened: its role, name and states. */
interface Node {
  role: string;
  name?: string;
  states: { checked?: boolean | "mixed"; selected?: boolean; disabled?: boolean };
  children: Node[];
}
const flatten = (n: Node): Node[] => [n, ...n.children.flatMap(flatten)];

let dispose = () => {};
/** A fresh page at rest. The thread's loader is the recording, answered at once: a thread is up in one frame, and no
 *  frame in this file waits on a promise. `posts` replaces Discover's three, for the feed whose content is longer than a
 *  screenful after the size switch (the height cache's own case). */
function fresh(opts: { posts?: ReturnType<typeof synthetic> } = {}) {
  dispose();
  const root = new El("root");
  const input = createInput();
  // the page's frame hook, as the host wires it: the wheel in, one tick a frame, the pointer for the feed's drag
  const motion: {
    onWheel?: (dx: number, dy: number) => void;
    onPointer?: (x: number, y: number, down: boolean, touch: boolean) => void;
    tick?: (dt: number) => void;
  } = {};
  // the host's theme, as main.ts has it: the page's radio writes it and the frame's styles are picked by it
  let palette: string | undefined;
  dispose = render(
    () =>
      Sky({
        input,
        motion,
        theme: () => palette,
        setTheme: (t) => (palette = t),
        posts: opts.posts,
        load: () => SCREEN,
      }),
    root,
  );
  const frame = createFrame(root, {
    get theme() {
      return palette;
    },
    onPressMiss: () => input.pressMiss(),
    onPointer: (x, y, down, touch) => motion.onPointer?.(x, y, down, touch),
    onWheel: (dx, dy) => motion.onWheel?.(dx, dy),
    tick: (dt) => motion.tick?.(dt),
  });
  let at = [-1, -1];
  const step = (down = false) => frame(at[0]!, at[1]!, down, 1 / 60, true);
  step();
  // Clay keeps a clip element's offset by its id across `fresh()` calls: every screen starts at its top
  ui.scrollTo("sky-feed", 0);
  ui.scrollTo("sky-thread-view", 0);
  ui.scrollTo("sky-settings-view", 0);
  step();
  // the feed's cards arrive staggered on mount: a page at rest is 40 frames later
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
    /** Whether the settings screen's node is in the tree this frame (the presence keeps it for its exit). */
    settingsShown: () => box("sky-settings").length > 0,
    /** Whether a thread is up (its region is in the tree). */
    threadShown: () => box("sky-thread").length > 0,
    /** The status line: "Discover — 3 posts" or the selected card's "name — 1 of 3". */
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
      step();
      step(true);
      step(false);
      step(false);
    },
    clickOn(id: string) {
      const b = box(id);
      if (!b.length) throw new Error(`no box ${id}`);
      this.click(b[0]! + b[2]! / 2, b[1]! + b[3]! / 2);
    },
    /** One wheel notch down over the feed, then a frame. */
    notch() {
      motion.onWheel?.(0, -1);
      step();
    },
    settle(n = 40) {
      for (let i = 0; i < n; i++) step();
    },
    /** Tabs until the part `id` has the focus (the stops differ with the screen that is up), at most 8. */
    to(id: string) {
      for (let n = 0; n < 8 && input.focus.focused() !== id; n++) this.tap("Tab");
      return input.focus.focused();
    },
    /** A key pressed and released with a frame after each. */
    tap(name: string) {
      input.down(name);
      step();
      input.up(name);
      step();
    },
    /** The settings screen from the gear: the click, then its entry settled. */
    open() {
      this.clickOn("sky-gear");
      this.settle(40);
    },
    /** A thread from the second card, settled. */
    thread() {
      this.clickOn("sky-card-1");
      this.settle(40);
    },
    /** The pointer back on the bar's ground, where a frame at rest is nobody's hover. */
    rest() {
      this.point(180, 60);
      this.settle(40);
    },
    /** The a11y tree of the page, flattened. */
    nodes: () => flatten(snapshot(root) as never),
    /** Science, the feed whose content is taller than the viewport (its thumb is up and its end is 78px in). */
    science() {
      this.clickOn("sky-tabs-tab-1");
      this.settle(40);
    },
    card: (i: number) => box(`sky-card-${i}`),
    body: (i: number) => box(`sky-body-${i}`),
    offset: () => ui.scrollOffset("sky-feed"),
    thumb: () => box("sky-thumb"),
  };
}

// --- the gear: the bar's last control opens the third screen — the window under the bar, its 44px header, the three rows
//     — and the a11y tree carries the control and the tree's own roles, names and states for all three settings
{
  const p = fresh();
  const gear = p.box("sky-gear");
  check("the gear is the bar's last control, at its right end", [r(gear[0]!), gear[1], gear[2], gear[3]], [r(303.86), 18, 40, 28]);
  check("... and the tabs did not move for it", [r(p.box("sky-tabs-tab-0")[0]!), r(p.box("sky-tabs-tab-2")[0]!)], [71.89, 226.21]);
  check("nothing of the settings screen is in the tree while it is closed", p.settingsShown(), false);
  p.open();
  check("a click on the gear opens the screen", p.box("sky-settings"), [0, 64, 360, 696]);
  check("the header is its first 44", p.box("sky-settings-head"), [0, 64, 360, 44]);
  check("the word is the screen's", p.texts().includes("Settings"), true);
  const back = p.box("sky-settings-back");
  check("the back control is on the header's left, 28 tall", [back[0], r(back[1]!), back[3]], [12, 72, 28]);
  check("the rows are the clip's, 12 in, 8 apart", [[...p.box("sky-settings-row-0").slice(0, 3), r(p.box("sky-settings-row-0")[3]!)], p.box("sky-settings-row-1")[1]! - p.box("sky-settings-row-0")[1]! - p.box("sky-settings-row-0")[3]!], [[12, 120, 336, 75.58], 8]);
  check("a row is the panel token over the page", near(p.pixel(20, 140), PANEL, 1), true);
  check("the clip is the rest of the screen, and it fits (no thumb)", [p.box("sky-settings-view"), p.box("sky-settings-thumb")[3]], [[0, 108, 360, 652], 0]);
  // the Tab stops of the screen: the back control takes the focus on opening, then the theme, the switch, the size
  check("the back control has the focus on opening", p.input.focus.focused(), "sky-settings-back");
  p.tap("Tab");
  check("Tab reaches the theme group's checked radio", p.input.focus.focused(), "sky-settings-theme-radio-0");
  p.tap("Tab");
  check("then the switch", p.input.focus.focused(), "sky-settings-motion");
  p.tap("Tab");
  check("then the text size's checked radio", p.input.focus.focused(), "sky-settings-size-radio-0");
  p.tap("Tab");
  check("and then the clip", p.input.focus.focused(), "sky-settings-view");
  check("the clip wears the ring at its edge", p.pixel(1, 400), [92, 176, 255]);
  p.tap("Tab");
  check("the screen's last stop is past the clip: nothing is focused", p.input.focus.focused(), null);
  // the tree: the region, the two groups with their radios, the switch, and the covered feed pruned
  const nodes = p.nodes();
  const named = (role: string, name: string) => nodes.filter((n) => n.role === role && n.name === name);
  check("the gear is a button named Settings", named("button", "Settings").length, 1);
  check("the screen is a region named Settings", named("region", "Settings").length, 1);
  check("the theme is a radiogroup named Theme", named("radiogroup", "Theme").length, 1);
  check("its two radios are Dark and Light, the Dark one checked", named("radio", "Dark").map((n) => n.states.checked), [true]);
  check("... and Light is not", named("radio", "Light").map((n) => n.states.checked), [false]);
  check("the switch is named by its label and is off", named("switch", "Reduced motion").map((n) => n.states.checked), [false]);
  check("the text size is a radiogroup named Text size", named("radiogroup", "Text size").length, 1);
  check("its radios are Regular (checked) and Large", [named("radio", "Regular").map((n) => n.states.checked), named("radio", "Large").map((n) => n.states.checked)], [[true], [false]]);
  check("the covered feed is pruned, the bar's tablist is not", [named("tab", "Discover").length, nodes.some((n) => n.name === "Discover — 3 posts")], [1, false]);
  check("the screen's other rows are not nodes of their own (their labels name the controls)", named("group", "Theme").length, 0);
  console.log(
    `solid/settings.test.ts: the gear ${p.box("sky-gear").slice(2).map(r).join("x")} at x ${r(p.box("sky-gear")[0]!)}, the screen ` +
      `${p.box("sky-settings").slice(2).join("x")} at y ${p.box("sky-settings")[1]}, the three rows ${[0, 1, 2].map((i) => p.box(`sky-settings-row-${i}`)[3]).join("/")} tall, ` +
      `${nodes.length} a11y nodes`,
  );
}

// --- the theme: the radio's pick is the page's — the bar's ground (a screen that is not the settings), the settings
//     screen's own ground and the rows turn the light palette, and back — with the accent ring on the picked one
{
  const p = fresh();
  p.open();
  const bar = () => p.pixel(180, 60);
  const screen = () => p.pixel(180, 700);
  const row = () => p.pixel(20, 140);
  check("at rest the page is the dark palette", [near(bar(), PAGE, 1), near(screen(), PAGE, 1), near(row(), PANEL, 1)], [true, true, true]);
  // the theme group is one Tab from the back control, and an arrow picks
  p.tap("Tab");
  p.tap("ArrowRight");
  p.settle(40);
  check("Light turns the page's palette: the bar's own ground", near(bar(), LIGHT_PAGE, 1), true);
  check("... the settings screen's", near(screen(), LIGHT_PAGE, 1), true);
  check("... and the rows'", near(row(), LIGHT_PANEL, 1), true);
  const nodes = p.nodes();
  check("the picked radio is the checked one: Light", [nodes.filter((n) => n.role === "radio" && n.name === "Light").map((n) => n.states.checked), nodes.filter((n) => n.role === "radio" && n.name === "Dark").map((n) => n.states.checked)], [[true], [false]]);
  check("and the ring is the accent, on the light palette's own", near(p.pixel(p.box("sky-settings-theme-radio-1")[0]! + 9, p.box("sky-settings-theme-radio-1")[1]! + 9), [17, 112, 207], 2), true);
  // back to Dark
  p.tap("ArrowLeft");
  p.settle(40);
  check("Dark turns it back", [near(bar(), PAGE, 1), near(screen(), PAGE, 1), near(row(), PANEL, 1)], [true, true, true]);
  check("and the ring is on Dark again", p.nodes().filter((n) => n.role === "radio" && n.states.checked === true).map((n) => n.name), ["Dark", "Regular"]);
  console.log(
    `solid/settings.test.ts: the theme: the bar ${bar().join("/")}, the screen ${screen().join("/")}, a row ${row().join("/")} — ` +
      `the light palette and back (${LIGHT_PAGE.join("/")} / ${LIGHT_PANEL.join("/")})`,
  );
}

// --- reduced motion: the switch calls the page's flag, and the frame after a card's click is the settled thread — the
//     entry's mid-frame is what a page without it shows
{
  const p = fresh();
  setReducedMotion(false);
  p.open();
  check("the switch starts off (the platform's flag)", p.nodes().filter((n) => n.role === "switch").map((n) => n.states.checked), [false]);
  p.clickOn("sky-settings-motion");
  check("a click on the switch turns the flag on", reduced(), true);
  check("... and the switch says so", p.nodes().filter((n) => n.role === "switch").map((n) => n.states.checked), [true]);
  // back to the feed, then a card: the frame after the click is the settled thread, not the entry's
  p.clickOn("sky-settings-back");
  p.settle(40);
  check("the screen is gone", p.settingsShown(), false);
  p.clickOn("sky-card-1");
  p.step();
  const first = p.pixels();
  p.settle(20);
  check("reduced motion's first frame after a card's click is the settled thread", diffs(first, p.pixels()), 0);
  check("... the thread's own first frame, at the card's border", near(p.pixel(12, 470), ACCENT, 2), true);
  p.clickOn("sky-back");
  p.settle(40);
  // off again: the same click is the entry's mid-frame
  p.open();
  p.clickOn("sky-settings-motion");
  check("a second click turns it off", reduced(), false);
  p.clickOn("sky-settings-back");
  p.settle(40);
  p.clickOn("sky-card-1");
  p.step();
  const mid = p.pixels();
  p.settle(20);
  check("without it the frame after the click is the entry's, not the settled screen", diffs(mid, p.pixels()) > 0, true);
  check("... and the thread is still arriving two frames in", p.box("sky-thread").length, 4);
  setReducedMotion(false);
  console.log(
    `solid/settings.test.ts: reduced motion: on, one frame after the click is the settled thread (${first.length} bytes); off, ` +
      `the same frame differs by ${diffs(mid, p.pixels())} bytes`,
  );
}

// --- the text size: Large is two variants of the feed card's five text styles — the cards grow, the bodies wrap at
//     another width, and the feed's content and thumb follow (Science: 742px of content at Regular)
{
  const p = fresh();
  p.open();
  const small = { card: p.card(0), body: p.body(0) };
  p.clickOn("sky-settings-size-radio-1");
  p.settle(40);
  const big = { card: p.card(0), body: p.body(0) };
  const nodes = p.nodes();
  check("Large is the checked size", nodes.filter((n) => n.role === "radio" && n.states.checked === true).map((n) => n.name), ["Dark", "Large"]);
  check("the first card is taller", big.card[3]! > small.card[3]!, true);
  check("... by the type's two steps on every line the card draws", [small.card[3], big.card[3]], [190, 222]);
  check("the body's box grows with the text (its one 20px line is two 22px ones in a card of 312)", [small.body[3], big.body[3]], [20, 44]);
  check("and the card below it sits one gap and one taller card down", [p.card(1)[1]!, p.card(2)[1]! - p.card(1)[1]! - p.card(1)[3]!], [306, 8]);
  console.log(
    `solid/settings.test.ts: the text size: the card ${small.card[3]} → ${big.card[3]} tall, the body's box ` +
      `${small.body[3]} → ${big.body[3]}, the avatar still 40x40 at ${p.box("sky-avatar-0").slice(2).join("x")}`,
  );
  // ... the feed's content and its thumb: Science's 742 at Regular is 802 at Large
  const q = fresh();
  q.science();
  check("Science at Regular: 742 of content, 78 to scroll", [r(q.thumb()[3]!), r(-q.offset())], [r(Math.max(24, (664 * 664) / 742)), 0]);
  q.open();
  q.clickOn("sky-settings-size-radio-1");
  q.settle(40);
  q.clickOn("sky-settings-back");
  q.settle(40);
  check("the feed's content followed the size: Science's cards are taller", q.thumb()[3]! < Math.max(24, (664 * 664) / 742), true);
  const content = r((664 * 664) / q.thumb()[3]!);
  check("the thumb is the machine's geometry for it", around(content, 830, 0.6), true);
  check("the tab the settings were opened from has the focus again", q.to("sky-tabs-tab-1"), "sky-tabs-tab-1");
  check("the feed's clip is a Tab stop under it", q.to("sky-feed"), "sky-feed");
  q.tap("End");
  q.settle(60);
  check("and the feed's end is the new content's: 830 - 664", around(-q.offset(), 166), true);
  console.log(`solid/settings.test.ts: the feed: Science's content 742 → ${r(content)}, the thumb ${r(q.thumb()[3]!)} tall, the end 166`);
  // back to Regular: the card's height and the feed's own frame are exactly what they were
  const s = fresh();
  s.rest();
  const before = s.pixels();
  s.open();
  s.clickOn("sky-settings-size-radio-1");
  s.settle(40);
  s.clickOn("sky-settings-size-radio-0");
  s.settle(40);
  s.clickOn("sky-settings-back");
  s.settle(40);
  s.rest();
  check("Regular after Large is the card's own height again", s.card(0)[3], 190);
  check("... and the feed's frame is byte-identical to the one before", diffs(before, s.pixels()), 0);
}

// --- the size on a feed longer than a screenful: the page drops its height cache on the frame the size changed, so the
//     window measures the whole feed again and the content — and the thumb — is the twelve cards at the new size, not the
//     heights it had a frame before
{
  const w = fresh({ posts: synthetic(12) });
  w.open();
  const at = w.box("sky-settings-size-radio-1");
  w.point(at[0]! + at[2]! / 2, at[1]! + at[3]! / 2);
  w.step();
  w.step(true);
  w.step(false); // the release: the size changes, and this frame declares the feed again (the measuring pass)
  const cards = [...Array(12).keys()].map((i) => w.card(i)[3]);
  check("the size change re-measures the whole feed: every card of the twelve is declared on that frame", cards.every((h) => h !== undefined), true);
  w.step(); // this frame's layout is the pass's: the heights are exact, and the content is their sum
  const sum = cards.reduce((a, h) => a + h!, 0) + 11 * 8 + 2 * 12; // the cards, their 8px gaps and the feed's 12px paddings
  const content = (664 * 664) / w.thumb()[3]!;
  check("the content is the twelve cards at Large, not the twelve it had a frame before", around(content, r(sum), 0.6), true);
  check("... and the Regular heights are not it", Math.abs(content - (12 * 190 + 11 * 8 + 24)) > 200, true);
  console.log(
    `solid/settings.test.ts: a feed of twelve: the cards ${cards.map((h) => r(h!)).join("/")}, their content ${r(content)} ` +
      `(the sum ${r(sum)}), against the Regular ${12 * 190 + 11 * 8 + 24}`,
  );
}

// --- back: the control, Escape and a click on the bar's tab return to the feed's exact frame; the screen was opened
//     from a thread, it returns to that thread (the history is one step) and the thread's stops come back with it
{
  const p = fresh();
  p.rest();
  const before = p.pixels();
  p.open();
  check("the settings took the focus while the feed's stop is disabled", p.input.focus.focused(), "sky-settings-back");
  p.tap("Tab");
  p.tap("Tab");
  p.tap("Tab");
  check("... and the settings' own stops are the page's", p.input.focus.focused(), "sky-settings-size-radio-0");
  p.clickOn("sky-settings-back");
  p.settle(40);
  check("the node is gone", p.settingsShown(), false);
  check("and nothing has the focus, as before the click", p.input.focus.focused(), null);
  check("the feed is the feed it left", [p.offset(), p.status()], [0, "Discover — 3 posts"]);
  p.rest();
  check("back is the frame the gear's click left: byte-identical", diffs(before, p.pixels()), 0);
  console.log(`solid/settings.test.ts: back: "${p.status()}", the offset ${p.offset()}, the frame ${diffs(before, p.pixels())} bytes off`);
  // Escape, from the screen's last stop and from nothing at all (a press on its background blurs)
  p.open();
  p.tap("Escape");
  p.settle(40);
  check("Escape returns to the feed", p.settingsShown(), false);
  p.rest();
  check("... and its frame is the one before the click", diffs(before, p.pixels()), 0);
  p.open();
  p.click(250, 86); // the header's empty end: a press that misses blurs, so nothing of its controls has the focus
  check("a press on the screen's background leaves no focus", p.input.focus.focused(), null);
  p.tap("Escape");
  p.settle(40);
  check("Escape with nothing focused is the screen's too", p.settingsShown(), false);
  // a click on the bar's active tab closes the screen as well (the tab stays the feed's)
  p.open();
  p.clickOn("sky-tabs-tab-0");
  p.settle(40);
  check("a click on the active tab closes the settings screen", p.settingsShown(), false);
  p.rest();
  check("... and the frame is still the one before", diffs(before, p.pixels()), 0);
  // a thread under it: the gear is the bar's, so the screen opens over a thread and its back returns to that thread
  const q = fresh();
  q.thread();
  q.rest();
  const thread = q.pixels();
  check("a thread is up", [q.threadShown(), q.status()], [true, "Titania — 2 of 3"]);
  q.open();
  check("the settings screen opens over the thread", [q.threadShown(), q.settingsShown()], [true, true]);
  check("... the thread's node is still declared under the float", q.box("sky-thread"), [0, 64, 360, 696]);
  const nodes = q.nodes();
  check("... and it is out of the a11y tree while the settings screen is up", nodes.filter((n) => n.role === "region").map((n) => n.name), ["Settings"]);
  q.clickOn("sky-settings-back");
  q.settle(40);
  check("the settings' back is the thread's, not the feed's", [q.settingsShown(), q.threadShown(), q.status()], [false, true, "Titania — 2 of 3"]);
  q.rest();
  check("... the thread's own frame again (byte-identical)", diffs(thread, q.pixels()), 0);
  // the thread's stops are the page's again, and the focus the screen's opening pushed is the thread's back control
  check("the focus the screen's opening pushed is the thread's back again", q.input.focus.focused(), "sky-back");
  q.tap("Tab");
  check("... and the thread's clip its next stop", q.input.focus.focused(), "sky-thread-view");
  q.clickOn("sky-back");
  q.settle(40);
  check("and the thread's own back returns to the feed", [q.threadShown(), q.settingsShown()], [false, false]);
}

// --- the entry: the screen comes in as one group — 12px low and at 0 opacity, on the page's card entry's tracks — so
//     the frames between are blends of the feed and the screen, and the layout never moves
{
  const p = fresh();
  p.rest();
  // a pixel of the screen's own header, between the back control and the word, over the feed's first card
  const at: [number, number] = [75, 86];
  const feed = p.pixel(at[0], at[1]);
  p.clickOn("sky-gear");
  check("the screen's first frame is declared", p.box("sky-settings"), [0, 64, 360, 696]);
  const entry = p.pixel(at[0], at[1]);
  check(
    "and draws nothing of itself: the feed's pixel is still there",
    Math.max(...entry.map((v, i) => Math.abs(v - feed[i]!))) <= 2,
    true,
  );
  const boxes = p.box("sky-settings");
  p.step();
  p.step();
  const mid = p.pixel(at[0], at[1]);
  check("two frames in, the header is a blend of the feed's pixel and the page", between(mid, feed, PAGE), true);
  check("and the screen's box has not moved (a group transform moves no layout)", p.box("sky-settings"), boxes);
  check("nor has the card under it", p.card(0), [12, 76, 336, 190]);
  p.settle(40);
  check("at rest the header is the page's literal", near(p.pixel(at[0], at[1]), PAGE, 1), true);
  console.log(`solid/settings.test.ts: the entry: the feed's ${feed.join("/")} → ${mid.join("/")} at two frames → the page`);
  // reduced motion: the first frame is the settled screen
  setReducedMotion(true);
  const q = fresh();
  q.rest();
  q.clickOn("sky-gear");
  const first = q.pixels();
  q.settle(20);
  check("reduced motion's first frame is the settled screen (nothing moves after it)", diffs(first, q.pixels()), 0);
  setReducedMotion(false);
  // ... and the exit unmounts at once
  setReducedMotion(true);
  q.clickOn("sky-settings-back");
  q.step();
  check("the exit is the falling edge: the node is out on the same frame", q.settingsShown(), false);
  setReducedMotion(false);
}

// --- the stored frames: this page at rest after the gear's click is frames/sky-settings.png, the light theme with Light
//     picked is frames/sky-settings-light.png, Large is frames/sky-settings-large.png, and the entry's is -mid
{
  const p = fresh();
  p.open();
  check(
    "the settled screen is frames/sky-settings.png",
    ui.diffPng(
      new URL("./frames/sky-settings.png", import.meta.url).pathname,
      new URL("./frames/sky-settings.png.actual.png", import.meta.url).pathname,
    ),
    0,
  );
  const stored = ui.png(new URL("./frames/sky-settings.png", import.meta.url).pathname)?.pixels;
  check("... byte for byte", diffs(stored ?? new Uint8Array(), p.pixels()), 0);
}

// --- the mutations, as asserts: what a control that did not reach its state would change
{
  // the theme not reaching a screen: the bar is a screen of its own — a pick that only recoloured the settings screen
  // leaves the bar's ground dark, and fails this
  const p = fresh();
  p.open();
  p.tap("Tab");
  p.tap("ArrowRight");
  p.settle(40);
  const bar = p.pixel(180, 60);
  check("the theme reached the bar, not only the settings screen", near(bar, LIGHT_PAGE, 1), true);
  check("... and the settings screen", near(p.pixel(180, 700), LIGHT_PAGE, 1), true);
  // the switch not calling the flag: the page's own `reduced()` is what the tracks read
  const q = fresh();
  q.open();
  q.clickOn("sky-settings-motion");
  check("the switch is the page's flag (a switch that only drew its own state leaves it false)", reduced(), true);
  setReducedMotion(false);
  // the text size not relaying out the feed: the card's own height is what the window measures
  const s = fresh();
  const card = s.card(0);
  s.open();
  s.clickOn("sky-settings-size-radio-1");
  s.settle(40);
  check("the size is the cards' (a variant that only recoloured the text leaves the card 190)", s.card(0)[3]! > card[3]!, true);
  check("... and the cards below it moved with it", s.card(1)[1], 306);
  console.log(
    `solid/settings.test.ts: the mutations: the bar's ground ${bar.join("/")} (the theme), the flag ${reduced()} ` +
      `(the switch), the card ${card[3]} → ${s.card(0)[3]} and the card below it at y ${s.card(1)[1]} (the size)`,
  );
}

dispose();
if (failed) process.exit(1);
console.log(
  "solid/settings.test.ts: the gear in the bar and the page's third screen — its box, header, clip and three rows, the " +
    "theme radio switching the whole palette (the bar's ground, the screen's, a row's) and the ring with it, the reduced-" +
    "motion switch and the settled frame one click after a card, the text size (the card's height, the body's box, the " +
    "feed's content and thumb and its end), back / Escape / the tab returning to the feed's exact frame, the screen over " +
    "a thread and back to that thread, the entry and reduced motion's own, the stored frame, and the mutations",
);
process.exit(0);
