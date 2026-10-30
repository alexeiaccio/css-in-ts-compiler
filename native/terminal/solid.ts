// The Solid host on the terminal: solid/main.ts's loop shape, over Clay in cells instead of ThorVG in pixels. The page
// is `solid/app/Sensors.tsx` **unmodified**; what is the terminal's is the host underneath it, and the two lengths the
// C page re-cuts for a cell grid (terminal/page.c's own two, through the value channel, not by rewriting the page):
//
//   the root's padding and gap   64/40/56 px and an 8px gap -> 2 cells of padding and no gap
//   the Units pill's height      38 px (2.4 rows) -> 3 cells, so a border, a line of text and a border are 3 rows
//   the pill's focus ring        page.c's accent border while the pill has focus (Sensors.tsx has no focus prop)
//
// Run with Bun:
//
//   bun terminal/solid.ts                  live: termbox2's alternate screen, the page's frame each 16ms, q/Ctrl+C/Escape
//                                          quits; a click toggles the Units pill (the page's own onClick), Tab moves the
//                                          focus off the pill, Space/Enter press it, `t` flips the theme
//   bun terminal/solid.ts --dump [file]    one frame headless, as plain text (cells_dump: '.' is a fill); no file: stdout
//   bun terminal/solid.ts --ansi [file]    the same frame as ANSI truecolour (SGR runs merged)
//   --keys Tab,ArrowDown                   headless: the frame, then each key with a frame after it, as main.c
//   --click X,Y                            headless: the frame, a press over that cell with a frame, a release with a frame
//   --theme light                          the light theme (also THEME=light)
//   --cols N --rows N                      the grid (80x20 by default: the C Sensors page's size in test.sh)
//   --bench N                              headless: N frames, printing the ms a frame and the cells as ANSI
//
// What it cannot do is a cell's limit, and said in native/README.md: text is one row (a body does not wrap), an image is
// a box with no glyph, a float has no cells to sit over, and termbox2 reports no motion, so a hover is only where the
// last press was.
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
// headless: every frame of the run beside PREFIX, PREFIX.N.txt (the dump) and PREFIX.N.ansi: a test that checks the base
// frame, a key and the frame after it needs all three, and one Bun start is most of a run's cost
const framesOut = file("--frames-out");
// live: draw N frames with no input, then quit (a smoke check, as main.c's; 1 is a screen)
const maxFrames = Number(arg("--frames")?.[0] ?? Infinity);
const headless = dump !== undefined || ansi !== undefined || bench > 0 || framesOut !== undefined;
let theme = (arg("--theme")?.[0] ?? process.env.THEME) === "light" ? "light" : undefined;

const { term } = await import("./term.ts");
const { flush } = await import("solid-js");
const { createInput } = await import("../solid/src/input.ts");
const { El, Txt, render } = await import("../solid/src/renderer.ts");
const { FIELDS, hasStates, packText, variant } = await import("../solid/src/pack.ts");
const { Sensors } = await import("../solid/app/Sensors.tsx");
const styles = await import("../examples/sensors/styles.ts");

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
// the page's frame hook. Sensors uses no motion of its own; `pageEntry` puts the first mount on the tick (and the
// binding drops its two fields: cells do not fade or slide)
const motion: Motion = {};
const dispose = render(() => Sensors({ motion }), root);

// The page's one control, as terminal/page.c's focus is two ints: 0 the Units pill, 1 nothing (the C page's list, which
// Sensors.tsx does not have). Tab moves off the pill and there is nowhere to go, so the ring goes with it.
let focus = 0;
let units: El | undefined;

let clickable: El[] = [];
let pressed = new Set<El>();
let wasDown = false;

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
  let states: (":hover" | ":active")[] = [];
  if (id && style && hasStates(style)) states = term.over(id) ? [down ? ":active" : ":hover"] : [];
  if (el.props.id === "Units") units = el;
  if (id && (el.props.onClick || el.props.onPress)) clickable.push(el);
  const v = style ? variant(style, theme, states) : undefined;
  term.openElement(id, v?.box ?? NO_STYLE);
  for (const c of el.children) if (c instanceof El) emit(c, down);
  term.closeElement();
}

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
    const accent = variant(styles.magnitude, theme).text!;
    for (let i = 0; i < 4; i++) term.value(pill, FIELDS.BORDER + i, accent[i]!);
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
    // a press gives the pill the focus when it lands on it, and takes it away anywhere else
    focus = hit.some((el) => el.props.id === "Units") ? 0 : 1;
  } else if (!down && wasDown) {
    const hit = clickable.filter((el) => pressed.has(el) && over(el));
    pressed.clear();
    for (const el of hit) el.props.onClick?.(px, py);
  }
  wasDown = down;
  motion.tick?.(dt);
  cellStyle();
  flush();
  clickable = [];
  for (const c of root.children) if (c instanceof El) emit(c, down);
  return term.end(dt);
}

/** One key as termbox2's name (the desktop's, with Space as the parts take it). */
function press(name: string) {
  const key = name === "Space" ? " " : name;
  if (input.down(key)) return void input.up(key);
  if (key === "Tab" || key === "Shift+Tab") focus = focus === 0 ? 1 : 0;
  else if (key === "ArrowDown" || key === "ArrowUp") focus = 1;
  // the C page's Space/Enter on the focused pill: the page wires no keyboard, so the host presses its own onClick
  else if ((key === " " || key === "Enter") && focus === 0) units?.props.onClick?.();
  input.up(key);
}

const quit = (name: string) => name === "q" || name === "Ctrl+C" || name === "Escape";

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
  if (bench) {
    // the first frames are the JIT's: ten at rest, untimed, then the measured run
    for (let i = 0; i < 10; i++) frame(-1, -1, false);
    const t = performance.now();
    for (let i = 0; i < bench; i++) frame(-1, -1, false);
    const frameMs = (performance.now() - t) / bench;
    console.log(
      `terminal, ${bench} frames: ${frameMs.toFixed(3)} ms a frame (begin, declare + Solid's flush, Clay's layout, ` +
        `the commands -> cells)`,
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
