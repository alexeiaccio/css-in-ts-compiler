// The idle frame: the host declares and lays out every frame, but draws and presents only when the frame's hash changed
// or a discrete input (a key, typed text, the button, a wheel notch) came in. What the stored frames cannot show: a
// page at rest costs no draws, a key draws its own frame exactly once, a wheel draws and moves the feed, a track that
// settles draws until it is at rest and then stops, and a theme flip draws once. Driven as the window loop does it, with
// `createDrawer` (solid/src/frame.ts) over the same `createFrame`.
import "./plugin.ts";

import type { Drag } from "./app/Widgets.tsx";

const { ui } = await import("./src/ffi.ts");
const { createFrame, createDrawer } = await import("./src/frame.ts");
const { createInput } = await import("./src/input.ts");
const { setReducedMotion } = await import("./src/motion.ts");
const { El, render } = await import("./src/renderer.ts");
const { Sensors } = await import("./app/Sensors.tsx");
const { Widgets } = await import("./app/Widgets.tsx");
const { Dialog, size } = await import("./app/Dialog.tsx");
const { Field } = await import("./app/Field.tsx");
const { List } = await import("./app/List.tsx");
const { Sky } = await import("./app/Sky.tsx");

ui.init(size.width, size.height);
ui.font(new URL("../vendor/fonts/Roboto-Regular.ttf", import.meta.url).pathname);

let failed = 0;
const check = (what: string, got: unknown, want: unknown) => {
  const [a, b] = [JSON.stringify(got), JSON.stringify(want)];
  if (a !== b) failed++, console.error(`FAIL ${what}: ${a}, wanted ${b}`);
};

type Page = "sensors" | "widgets" | "dialog" | "form" | "list" | "sky";
const PAGES: Page[] = ["sensors", "widgets", "dialog", "form", "list", "sky"];

let dispose = () => {};
/** A fresh page and the host's frame loop over it: `step` declares and lays out, and draws only when it has to. */
function open(which: Page, theme?: string) {
  dispose();
  const root = new El("root");
  const input = createInput();
  const motion: { onWheel?: (dx: number, dy: number) => void; tick?: (dt: number) => void } = {};
  const drag: Drag = {};
  let palette = theme;
  // as main.ts wires the page's `t`: the page's shortcut while no text field has focus
  input.fallback = (name) =>
    name === "t" && !input.editing() ? ((palette = palette ? undefined : "light"), true) : false;
  dispose = render(
    which === "sensors"
      ? Sensors
      : which === "widgets"
        ? () => Widgets({ input, drag })
        : which === "dialog"
          ? () => Dialog({ input, motion })
          : which === "form"
            ? () => Field({ input })
            : which === "list"
              ? () => List({ input })
              : () => Sky({ input, motion, theme: () => palette }),
    root,
  );
  const frame = createFrame(root, {
    get theme() {
      return palette;
    },
    onPressMiss: () => input.pressMiss(),
    onWheel: (dx, dy) => motion.onWheel?.(dx, dy),
    tick: (dt) => motion.tick?.(dt),
  });
  const draw = createDrawer(frame);
  let at: [number, number] = [-1, -1];
  const wheelOut = new Float32Array(2);
  const step = (down = false, discrete = false) => draw(at[0]!, at[1]!, down, 1 / 60, discrete);
  return {
    input,
    step,
    /** The number of draws so far: a page at rest keeps it still. */
    draws: () => ui.draws(),
    hash: () => ui.hash(),
    /** `n` frames with nothing in (the pointer stays where it was). */
    settle(n = 30) {
      for (let i = 0; i < n; i++) step();
    },
    /** A key pressed and released, and the frame it caused. */
    tap(name: string) {
      input.down(name);
      input.up(name);
      return step(false, true);
    },
    /** A wheel notch down, through the host's channel: the page's handler sees it before the frame. */
    notch() {
      ui.wheel(0, -1);
      while (ui.wheelPop(wheelOut)) motion.onWheel?.(wheelOut[0]!, wheelOut[1]!);
      return step(false, true);
    },
    /** The pointer to x, y, and a frame: the host's motion path (no discrete input). */
    point(x: number, y: number) {
      at = [x, y];
      return step();
    },
    /** The `t` key through the page's fallback, as the host's, then the frame it causes: the palette alone changed.
     *  (The key itself would force a draw; the step passes no discrete input, so this is the hash's own draw.) */
    flipTheme() {
      if (!input.fallback?.("t")) throw new Error("the theme key was not taken");
      return step();
    },
    offset: () => ui.scrollOffset("sky-feed"),
  };
}

// --- the first frame draws once, and 60 frames with nothing in draw none: the hash of a settled frame is the same one
{
  const p = open("sensors");
  const first = p.draws();
  p.step();
  check("the first frame draws", p.draws() - first, 1);
  const before = p.draws();
  const hash = p.hash();
  p.settle(60);
  check("60 frames at rest draw none", p.draws() - before, 0);
  check("and the settled hash is the frame's", p.hash() === hash, true);
}

// --- every page at rest draws none, 60 frames each (Sky's cards arrive on mount: its 40 settle frames are the entry)
for (const which of PAGES) {
  const p = open(which);
  p.step();
  p.settle(which === "sky" ? 40 : 30);
  const before = p.draws();
  p.settle(60);
  check(`${which}: 60 frames at rest draw none`, p.draws() - before, 0);
}

// --- a key press draws exactly once, and the frame after it is at rest again
{
  const p = open("sky");
  p.step();
  p.settle(40);
  const before = p.draws();
  p.tap("Tab");
  check("a key press draws once", p.draws() - before, 1);
  p.settle(30);
  check("and the frames after it draw none", p.draws() - before, 1);
}

// --- a wheel notch draws, and the feed moves on that frame (Sky's own track: the first 10px of the notch)
{
  const p = open("sky");
  p.step();
  p.settle(40);
  check("the feed starts at its top", p.offset(), 0);
  const before = p.draws();
  p.notch();
  check("a wheel notch draws", p.draws() - before, 1);
  check("and the feed moved on that frame", p.offset() < 0, true);
  const glide = p.draws();
  p.settle(40);
  check("the glide draws while it moves", p.draws() - glide > 0, true);
  const rest = p.draws();
  p.settle(30);
  check("and stops when it is at rest", p.draws() - rest, 0);
}

// --- a pointer move that changes nothing draws nothing; one that starts a hover draws through the hash alone, and a
//     move inside a hover that has settled draws none again
{
  const p = open("sky");
  p.step();
  p.settle(40);
  const away = p.draws();
  p.point(355, 130); // the page beside the cards: nothing under the pointer, no style changed
  check("a move over nothing draws none", p.draws() - away, 0);
  const onto = p.draws();
  p.point(180, 130); // the first card: the hover fade starts on this frame
  check("a move that starts a hover draws", p.draws() - onto, 1);
  p.settle(20);
  const settled = p.draws();
  p.point(181, 131); // still the same card, the same style: a settled hover's move is no frame
  check("a settled hover's move draws none", p.draws() - settled, 0);
}

// --- a settled motion: the dialog opens (Tab, Enter), its panel and menu run their tracks, then it draws nothing
{
  const p = open("dialog");
  p.step();
  p.settle(10);
  const before = p.draws();
  p.tap("Tab");
  p.tap("Enter");
  const during: boolean[] = [];
  for (let i = 0; i < 40; i++) during.push(p.step());
  const stop = during.indexOf(false);
  check("the entry's tracks draw every frame until they settle", stop >= 10, true);
  check("... and then not one frame draws", during.slice(stop).every((drew) => !drew), true);
  check("40 frames after the open drew only the entry", p.draws() - before, stop + 2); // the Tab and the Enter
  console.log(`solid/idle.test.ts: the dialog's entry drew ${stop} frames, then stopped`);
}

// --- the theme flip draws once, and the frames after it are at rest in the new palette
{
  const p = open("sky");
  p.step();
  p.settle(40);
  const before = p.draws();
  p.flipTheme();
  check("the theme flip draws once", p.draws() - before, 1);
  p.settle(30);
  check("and the light page is at rest", p.draws() - before, 1);
}

// --- reduced motion: the entry lands on its target at once, so a page opened with it is at rest on its first frame
{
  setReducedMotion(true);
  const p = open("sky");
  const before = p.draws();
  p.step();
  check("reduced motion draws the mount's first frame", p.draws() - before, 1);
  const settled = p.draws();
  p.settle(60);
  check("and the cards are at rest at once", p.draws() - settled, 0);
  setReducedMotion(false);
}

if (failed) process.exit(1);
console.log("solid/idle.test.ts: idle frames draw nothing, an input draws its own frame");
process.exit(0);
