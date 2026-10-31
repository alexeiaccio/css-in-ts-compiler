// The Solid host on the terminal: solid/main.ts's loop shape, over Clay in cells instead of ThorVG in pixels. Two of the
// desktop's pages run here, each **unmodified**; what is the terminal's is the host underneath them, and the lengths the
// C page re-cuts for a cell grid (terminal/page.c's and terminal/sky.c's own, through the value channel, not by
// rewriting a page):
//
//   the Sensors page          the root's padding and gap 64/40/56 px and an 8px gap -> 2 cells of padding and no gap;
//                             the Units pill's height 38 px (2.4 rows) -> 3 cells, so a border, a line of text and a
//                             border are 3 rows; the pill's focus ring is page.c's accent border while it has focus
//
//   the Sky feed              the bar's height 64 px -> 1 cell row and its 16px/20px padding and gap -> 1 cell; the status
//                             line 32 px -> 1 row; a card's 12px padding and 8px gap -> 1 cell of side padding, 0 above and
//                             below; a tab's 6px/10px padding -> 0 and a cell after its label (its label is the row). The
//                             feed's own 12px padding and 8px gap are left as the page's: the page's scroll adds the same
//                             lengths, and in cells the 12px inset is the first card's one-cell gutter and the 8px gap is
//                             the empty row the C page draws as a separator. The avatar is an image: the host skips it,
//                             because a cell has no glyph for it and its 40x40 box would be three rows of nothing the C
//                             page does not draw
//
// Run with Bun:
//
//   bun terminal/solid.ts                  live: termbox2's alternate screen, the page's frame each 16ms, q/Ctrl+C/Escape
//                                          quits; a click toggles the Units pill (the page's own onClick), Tab moves the
//                                          focus off the pill, Space/Enter press it, `t` flips the theme
//   bun terminal/solid.ts --page sky       live: the Sky feed. Tab reaches the tablist then the feed, Left/Right switch the
//                                          feed, Up/Down, PageUp/PageDown, Home/End scroll it, `j`/`k` are the C page's
//                                          Down/Up, the wheel is a notch, a click on a tab switches the feed and one on a
//                                          card opens its thread (the page's own onClick, in its loading state)
//   bun terminal/solid.ts --dump [file]    one frame headless, as plain text (cells_dump: '.' is a fill); no file: stdout
//   bun terminal/solid.ts --ansi [file]    the same frame as ANSI truecolour (SGR runs merged)
//   --keys Tab,ArrowDown                   headless: the frame, then each key with a frame after it, as main.c
//   --keys WheelDown                       the page's wheel, as a notch down (WheelUp: a notch up)
//   --click X,Y                            headless: the frame, a press over that cell with a frame, a release with a frame
//   --theme light                          the light theme (also THEME=light)
//   --cols N --rows N                      the grid (80x20 by default: the C pages' size in test.sh)
//   --bench N                              headless: N frames, printing the ms a frame and the cells as ANSI
//   --mutate scroll|tab                    a deliberately broken host, for terminal/test.sh's mutation lines: `scroll`
//                                          drops the page's offset before Clay (the feed stays at row 0), `tab` never
//                                          flushes the frame a tab switch lands on (the bar's active tab stays)
//
// What it cannot do is a cell's limit, and said in native/README.md: text is one row (a body wraps at words, but a line
// is a cell and a long word is broken nowhere), an image is a skipped box, a group's opacity and translate have no
// cells, and termbox2 reports no motion, so a hover is only where the last press was.
import "../solid/plugin.ts";
import { plugin } from "bun";
import type { Motion } from "../solid/src/entry.ts";

// The page's own module (`src/entry.ts`, `pageEntry`) writes its entry motion through `solid/src/ffi.ts`, which on this
// target is libterm: the alias is here, before the page is imported. The motion's fields (a subtree's opacity and
// translate) have no cell meaning and the binding drops them, so the page's first mount is the frame its literals make.
const binding = new URL("./term.ts", import.meta.url).pathname;
plugin({
  name: "cssints-terminal-ffi",
  setup(build) {
    build.onLoad({ filter: /\/solid\/src\/ffi\.ts$/ }, () => ({
      contents: `export * from ${JSON.stringify(binding)};`,
      loader: "ts",
    }));
  },
});

const arg = (name: string, n = 1) => {
  const i = process.argv.indexOf(name);
  return i < 0 ? undefined : process.argv.slice(i + 1, i + 1 + n);
};
// a flag whose value is optional: `--dump` (stdout) or `--dump out.txt`
const file = (name: string) => {
  const i = process.argv.indexOf(name);
  if (i < 0) return undefined;
  const next = process.argv[i + 1];
  return next !== undefined && !next.startsWith("--") ? next : "-";
};
const dump = file("--dump");
const ansi = file("--ansi");
const keys = arg("--keys")?.[0]?.split(",");
const click = arg("--click")?.[0]?.split(",").map(Number);
const cols = Number(arg("--cols")?.[0] ?? 80);
const rows = Number(arg("--rows")?.[0] ?? 20);
const bench = Number(arg("--bench")?.[0] ?? 0);
// headless: frames with no input after the keys (and the click), so a page's own motion (the Sky feed's spring and
// fling, a tab's fade) has settled before the dump: main.ts's `--settle`
const settle = Number(arg("--settle")?.[0] ?? 0);
// headless: print the Sky feed's own scroll offset (the clip's, written by vscroll.ts) with the frame, so a test can
// compare the displacement the page moved its rows by
const showOffset = arg("--offset") !== undefined;
// the page: the desktop's names and the terminal's aliases (`main.c`: sensors, sky)
const page = arg("--page")?.[0] ?? "sensors";
const skyPage = page === "sky";
// a deliberately broken host for the test's mutation lines: `scroll` drops the page's clip offset, `tab` never flushes
// the frame a tab switch lands on, so the tree (the bar's active tab) stays as it was
const mutate = arg("--mutate")?.[0] ?? "";
// headless: every frame of the run beside PREFIX, PREFIX.N.txt (the dump) and PREFIX.N.ansi: a test that checks the base
// frame, a key and the frame after it needs all three, and one Bun start is most of a run's cost
const framesOut = file("--frames-out");
// headless: frames at rest before the input. The Sky page's window measures its cards on the first frame (a frame of
// the whole feed, as the desktop's `--warm` is for), and its card entry is 0.3s: a frame at rest is the settled one
const warm = Number(arg("--warm")?.[0] ?? (skyPage ? 60 : 0));
// live: draw N frames with no input, then quit (a smoke check, as main.c's; 1 is a screen)
const maxFrames = Number(arg("--frames")?.[0] ?? Infinity);
const headless = dump !== undefined || ansi !== undefined || bench > 0 || framesOut !== undefined;
let theme = (arg("--theme")?.[0] ?? process.env.THEME) === "light" ? "light" : undefined;

const { term } = await import("./term.ts");
const { flush } = await import("solid-js");
const { createInput } = await import("../solid/src/input.ts");
const { El, Txt, render } = await import("../solid/src/renderer.ts");
const { FIELDS, hasStates, packText, variant } = await import("../solid/src/pack.ts");
if (page !== "sensors" && !skyPage) {
  console.error(`terminal: unknown page "${page}" (sensors, sky)`);
  process.exit(2);
}
const { Sensors } = skyPage ? { Sensors: undefined } : await import("../solid/app/Sensors.tsx");
const { Sky, s: skyStyles } = skyPage ? await import("../solid/app/Sky.tsx") : { Sky: undefined, s: undefined };
const styles = skyPage ? undefined : await import("../examples/sensors/styles.ts");

// A cell is 8x16 (terminal/cells.h): the terminal's own unit, and the re-cut below is in it.
const CELL_W = 8;
const CELL_H = 16;
const WHITE_14 = packText({ textColor: { r: 255, g: 255, b: 255, a: 255 }, fontSize: 14 });
const NO_STYLE = new Float32Array(45);

const encoder = new TextEncoder();
const ids = new Map<string, Uint8Array>();
const idBytes = (id: string) => ids.get(id) ?? (ids.set(id, encoder.encode(id)), ids.get(id)!);

const root = new El("root");
const input = createInput();
// `t` is the page's shortcut, and the host's: as solid/main.ts, while no text field has focus
input.fallback = (name) => (name === "t" ? ((theme = theme ? undefined : "light"), true) : false);
// the page's frame hook. The Sky page puts its wheel, its pointer and its tick on it; Sensors uses no motion of its own,
// and `pageEntry` (which this target drops into the binding) puts the first mount on the tick.
const motion: Motion = {};
const dispose = skyPage
  ? render(
      () =>
        Sky!({
          input,
          motion,
          theme: () => theme,
          // the settings screen's theme radio writes the host's own `theme`: its frame's getter is what every style's
          // variant is picked by, so the palette follows the page
          setTheme: (next) => (theme = next),
          // the thread's loader: no network in the host. A card's click opens the screen's loading state, and nothing
          // settles it (the terminal has no thread screen of its own yet)
          load: () => new Promise<never>(() => {}),
        }),
      root,
    )
  : render(() => Sensors!({ motion }), root);

// The page's one control, as terminal/page.c's focus is two ints: 0 the Units pill, 1 nothing (the C page's list, which
// Sensors.tsx does not have). Tab moves off the pill and there is nowhere to go, so the ring goes with it.
let focus = 0;
let units: El | undefined;

let clickable: El[] = [];
let pressed = new Set<El>();
let wasDown = false;
// a mutation (`--mutate tab`): the tree is not flushed after the key that switches the feed
let frozen = false;

const over = (el: El) => (el.props.id ? term.over(idBytes(el.props.id)) : false);

const encoded = new WeakMap<El, { str: string; bytes: Uint8Array }>();
/** The text of a `text` element as UTF-8, encoded again only when it changed. */
function bytesOf(el: El): Uint8Array {
  let str = "";
  for (const c of el.children) if (c instanceof Txt) str += c.text;
  let cached = encoded.get(el);
  if (!cached || cached.str !== str) encoded.set(el, (cached = { str, bytes: encoder.encode(str) }));
  return cached.bytes;
}

/** One element of the page's tree, declared to Clay in order: the same walk as solid/src/frame.ts, without the effects a
 *  cell cannot show (an image, a shadow, a backdrop, a gradient). */
function emit(el: El, down: boolean) {
  const style = el.props.style;
  if (el.tag === "text") {
    const tid = el.props.id ? idBytes(el.props.id) : undefined;
    term.text(tid, bytesOf(el), (style && variant(style, theme).text) || WHITE_14);
    return;
  }
  const id = el.props.id ? idBytes(el.props.id) : undefined;
  let states: (":hover" | ":focus" | ":active")[] = [];
  if (id && style && hasStates(style)) states = term.over(id) ? [down ? ":active" : ":hover"] : [];
  // the page's focus is a prop (the tablist's and the feed's): a cell draws the `:focus` border as the box characters
  // of the element's own box (the Sky page's ring), where the C pages hand-cut one
  if (el.props.focused) states.push(":focus");
  if (el.props.id === "Units") units = el;
  if (id && (el.props.onClick || el.props.onPress)) clickable.push(el);
  const v = style ? variant(style, theme, states) : undefined;
  // an image is a box with no glyph: the Sky cards' avatars are pictures, and a cell page has none, so the host skips
  // the element rather than spending its 40x40 box (three rows of nothing) on the grid
  if (v?.image) return;
  term.openElement(id, v?.box ?? NO_STYLE);
  for (const c of el.children) if (c instanceof El) emit(c, down);
  term.closeElement();
}

/** A cell length write: one field of the style of an element, for this frame only. */
const put = (id: string, field: number, v: number) => term.value(idBytes(id), field, v);
/** A FIXED axis (Clay's 3) on its min and max: a height that is exactly h pixels, so a row of text, a border and a row
 *  of text are three rows. */
const fixedHeight = (id: string, h: number) => (put(id, FIELDS.HEIGHT, 3), put(id, FIELDS.HEIGHT + 1, h), put(id, FIELDS.HEIGHT + 2, h));

/** The terminal's re-cut of the page's lengths, and the ring the page's focus would draw: terminal/page.c's own numbers,
 *  through the value channel, so the page's styles.ts stays the desktop's. */
function cellStyle() {
  const page = idBytes("Root");
  const pill = idBytes("Units");
  term.value(page, FIELDS.PADDING + 0, 2 * CELL_W);
  term.value(page, FIELDS.PADDING + 1, 2 * CELL_W);
  term.value(page, FIELDS.PADDING + 2, 2 * CELL_H);
  term.value(page, FIELDS.PADDING + 3, 2 * CELL_H);
  term.value(page, FIELDS.GAP, 0);
  // 3: CLAY__SIZING_TYPE_FIXED, then the min and the max (solid/src/pack.ts's axis)
  term.value(pill, FIELDS.HEIGHT + 0, 3);
  term.value(pill, FIELDS.HEIGHT + 1, 3 * CELL_H);
  term.value(pill, FIELDS.HEIGHT + 2, 3 * CELL_H);
  // the ring is page.c's `magnitude_text` border, resolved in the theme that is on
  if (focus === 0) {
    const accent = variant(styles!.magnitude, theme).text!;
    for (let i = 0; i < 4; i++) term.value(pill, FIELDS.BORDER + i, accent[i]!);
  }
}

/**
 * The Sky feed's re-cut, terminal/sky.c's own numbers through the value channel: the bar one row, its padding and gap one
 * cell, a tab's padding zero (its label is the row); the status line one row and one cell in; a card one cell of side
 * padding and no sub-cell vertical padding or gap, so the card's lines are rows. The feed's own 12px padding and 8px gap
 * are **not** re-cut: the page's scroll arithmetic adds the same 12px paddings and 8px gaps (its PAD/GAP), so a host that
 * zeroed them would make the page's content end larger than Clay's and the clip would stop the scroll short of the page's
 * own end — and in cells the 12px inset lands the first card on row 1, the 8px gap is the empty row between cards that the
 * C page draws as its separator. The C page cuts the same lengths by hand; the page's pixels are only touched here.
 */
function skyStyle() {
  fixedHeight("sky-bar", CELL_H);
  put("sky-bar", FIELDS.PADDING, CELL_W);
  put("sky-bar", FIELDS.PADDING + 1, CELL_W);
  put("sky-bar", FIELDS.GAP, CELL_W);
  // the tablist's 2px gap is a sub-cell, so each tab carries a cell of right padding (its own label apart from the next)
  // A tab's 2px underline (its own bottom border) is the whole of a one-row tab's row, and drawing it overwrites the
  // label. A cell's active tab is its label's colour, and the bar's focus is the C bar's active tab: the accent fill and
  // an on-accent label, which is the one focus look a one-row control can carry without eating its glyphs.
  const focusId = input.focus.focused();
  const focusedTab = focusId?.startsWith("sky-tabs-tab-") ? Number(focusId.slice("sky-tabs-tab-".length)) : -1;
  const accent = skyStyles ? variant(skyStyles.tabTextOn, theme).text : undefined;
  for (let i = 0; i < 3; i++) {
    put(`sky-tabs-tab-${i}`, FIELDS.PADDING, 0);
    put(`sky-tabs-tab-${i}`, FIELDS.PADDING + 1, CELL_W); // one cell between one tab's label and the next
    put(`sky-tabs-tab-${i}`, FIELDS.PADDING + 2, 0);
    put(`sky-tabs-tab-${i}`, FIELDS.PADDING + 3, 0);
    // the border widths are the four before the border colour (pack.ts's packBox: 22..25, then 26..29)
    for (let f = FIELDS.BORDER - 4; f < FIELDS.BORDER; f++) put(`sky-tabs-tab-${i}`, f, 0);
    if (i === focusedTab && accent) {
      for (let k = 0; k < 3; k++) put(`sky-tabs-tab-${i}`, FIELDS.BACKGROUND + k, accent[k]!);
      put(`sky-tabs-tab-${i}`, FIELDS.BACKGROUND_ALPHA, 255);
      for (let k = 0; k < 4; k++) put(`sky-tabs-label-${i}`, FIELDS.TEXT_COLOR + k, 255);
    }
  }
  fixedHeight("sky-status", CELL_H);
  put("sky-status", FIELDS.PADDING, CELL_W);
  put("sky-status", FIELDS.PADDING + 1, CELL_W);
  // the cards are declared by the page's window; the ids are its own (`sky-card-${i}`), and a value for one that is not
  // declared this frame is stored and applied when it is
  for (let i = 0; i < 12; i++) {
    put(`sky-card-${i}`, FIELDS.PADDING, CELL_W);
    put(`sky-card-${i}`, FIELDS.PADDING + 1, CELL_W);
    put(`sky-card-${i}`, FIELDS.PADDING + 2, 0);
    put(`sky-card-${i}`, FIELDS.PADDING + 3, 0);
    put(`sky-card-${i}`, FIELDS.GAP, 0);
  }
}

/** One frame: the pointer and its edges, the page's motion, the re-cut, the tree, Clay, the cells. Returns the command
 *  count. */
function frame(px: number, py: number, down: boolean, dt = 1 / 60): number {
  term.begin(px, py, down, dt);
  if (down && !wasDown) {
    const hit = clickable.filter(over);
    pressed = new Set(hit);
    for (const el of hit) el.props.onPress?.(px, py);
    // a press gives the pill the focus when it lands on it, and takes it away anywhere else (the Sensors page's own
    // focus; the Sky page's is the headless manager's, through `input`)
    if (!skyPage) focus = hit.some((el) => el.props.id === "Units") ? 0 : 1;
  } else if (!down && wasDown) {
    const hit = clickable.filter((el) => pressed.has(el) && over(el));
    pressed.clear();
    for (const el of hit) el.props.onClick?.(px, py);
  }
  wasDown = down;
  // the page's own pointer (the Sky feed's drag, the List's): after the events, before the tick, as src/frame.ts
  motion.onPointer?.(px, py, down);
  motion.tick?.(dt);
  // a mutation for terminal/test.sh: the page's offset never reaches Clay's clip, so the feed stays at row 0
  if (mutate === "scroll" && skyPage) term.scrollTo("sky-feed", 0);
  if (skyPage) skyStyle();
  else cellStyle();
  // ... and the tab switch that never re-renders: the tree is not flushed after the key, so the bar's active tab stays
  if (!frozen) flush();
  clickable = [];
  for (const c of root.children) if (c instanceof El) emit(c, down);
  return term.end(dt);
}

/** One key as termbox2's name (the desktop's, with Space as the parts take it). */
function press(name: string) {
  if (skyPage) {
    // the page's own keys: the wheel is one notch of its machine (as `--keys WheelDown`), `j`/`k` are the C page's
    // Down/Up, and everything else is the name the page's parts and focus manager already take
    if (name === "WheelDown" || name === "WheelUp") return void motion.onWheel?.(0, name === "WheelDown" ? -1 : 1);
    const key = name === "Space" ? " " : name === "j" ? "ArrowDown" : name === "k" ? "ArrowUp" : name;
    if (mutate === "tab" && /^(ArrowLeft|ArrowRight|[1-3])$/.test(key)) frozen = true;
    if (input.down(key)) input.up(key);
    return;
  }
  const key = name === "Space" ? " " : name;
  if (input.down(key)) return void input.up(key);
  if (key === "Tab" || key === "Shift+Tab") focus = focus === 0 ? 1 : 0;
  else if (key === "ArrowDown" || key === "ArrowUp") focus = 1;
  // the C page's Space/Enter on the focused pill: the page wires no keyboard, so the host presses its own onClick
  else if ((key === " " || key === "Enter") && focus === 0) units?.props.onClick?.();
  input.up(key);
}

// the host's quit: `q` and Ctrl+C everywhere; Escape is the Sensors host's too, but on the Sky page it is the page's
// back (a thread's back, as the C feed's esc), so the page gets it
const quit = (name: string) => name === "q" || name === "Ctrl+C" || (!skyPage && name === "Escape");

if (headless) {
  if (term.open(cols, rows) !== 0) {
    console.error("terminal: Clay or the grid did not start");
    process.exit(2);
  }
  // every frame of the run, beside the commands: PREFIX.N.txt is the dump and PREFIX.N.ansi the truecolour, N from 0
  let frameNo = 0;
  const keep = () => {
    if (framesOut === undefined || framesOut === "-") return;
    term.dump(`${framesOut}.${frameNo}.txt`);
    term.ansi(`${framesOut}.${frameNo}.ansi`);
  };
  // the page at rest: the Sky window's measuring frame and its card entry are over before the run's first frame
  for (let i = 0; i < warm; i++) frame(-1, -1, false);
  frame(-1, -1, false);
  keep();
  frameNo++;
  for (const key of keys ?? []) {
    press(key);
    frame(-1, -1, false);
    keep();
    frameNo++;
  }
  if (click) {
    const [x, y] = [click[0]!, click[1]!];
    for (const down of [false, true, false]) {
      frame(x, y, down);
      keep();
      frameNo++;
    }
  }
  // the motion at rest: after the keys and the click, a page with a track needs frames after the input, not one
  for (let i = 0; i < settle; i++) frame(-1, -1, false);
  if (bench) {
    // the first frames are the JIT's: ten at rest, untimed, then the measured run
    for (let i = 0; i < 10; i++) frame(-1, -1, false);
    const t = performance.now();
    let commands = 0;
    for (let i = 0; i < bench; i++) commands = frame(-1, -1, false);
    const frameMs = (performance.now() - t) / bench;
    console.log(
      `terminal, ${bench} frames: ${frameMs.toFixed(3)} ms a frame (${cols * rows} cells, ${commands} commands: begin, ` +
        `declare + Solid's flush, Clay's layout, the commands -> cells)`,
    );
    const path = `${process.env.TMPDIR ?? "/tmp"}/cssints-terminal-bench.ansi`;
    const t2 = performance.now();
    for (let i = 0; i < bench; i++) term.ansi(path);
    const ansiMs = (performance.now() - t2) / bench;
    const bytes = await Bun.file(path).text();
    console.log(
      `terminal, the same frame as ANSI: ${ansiMs.toFixed(3)} ms (cells -> SGR runs, ${bytes.length} bytes, file write ` +
        `included)`,
    );
  }
  if (dump !== undefined) term.dump(dump);
  if (ansi !== undefined) term.ansi(ansi);
  if (showOffset && skyPage) {
    const o = term.scrollOffset("sky-feed");
    console.log(`offset ${o} px (${(o / CELL_H).toFixed(2)} rows)`);
  }
  const status = term.errors() ? 1 : 0;
  dispose();
  term.close();
  process.exit(status);
}

// live: termbox2's own size, a frame each poll (16ms), the terminal's keys and its mouse in cells
const rv = term.open(0, 0);
if (rv !== 0) {
  console.error("termbox2: needs a terminal (use --dump or --ansi)");
  process.exit(2);
}
const keyBuf = new Uint8Array(64);
const pointer = new Float32Array(3);
const decoder = new TextDecoder();
let px = -1;
let py = -1;
let down = false;
let last = performance.now();
let frames = 0;
for (;;) {
  const status = term.poll(keyBuf, pointer);
  if (status === 3) break;
  if (status === 2) term.resize();
  else if (status === 1) {
    if (pointer[0]! >= 0) {
      px = pointer[0]!;
      py = pointer[1]!;
      down = pointer[2] !== 0;
    }
    const name = decoder.decode(keyBuf).split("\0")[0]!;
    if (name && quit(name)) break;
    if (name) press(name);
  }
  const now = performance.now();
  frame(px, py, down, Math.min((now - last) / 1000, 0.05));
  term.present();
  last = now;
  if (++frames >= maxFrames) break;
}
if (maxFrames !== Infinity) console.log(`terminal: ${frames} frames, ${term.size().join("x")}`);
dispose();
term.close();
process.exit(term.errors() ? 1 : 0);
