// The Sensors page in the browser, on the desktop's own modules: src/renderer.ts (the Solid universal renderer),
// src/frame.ts (one frame: pointer in, events, flush, the tree declared to Clay) and app/Sensors.tsx, unmodified. Clay
// runs in ui.wasm (browser/ui.c) through browser/solid/ffi-browser.ts; the commands it lays out are drawn by
// browser/draw.js, the same file the no-JS page draws with.
//
// The loop is src/frame.ts's createDrawer: the tree is declared and laid out every iteration, and the canvas is drawn
// only when the frame hash moved or a discrete input came in (a press or release, a wheel notch) — a page at rest costs
// a layout and no pixels, as on the desktop. The window's poll is the DOM's: mouse move/down/up and the wheel.
import "./globals.ts";

import { Sensors } from "../../solid/app/Sensors.tsx";
import type { Motion } from "../../solid/src/entry.ts";
import { createDrawer, createFrame } from "../../solid/src/frame.ts";
import { El, render } from "../../solid/src/renderer.ts";
import { H, W, createSurface, loadFont, readCommands } from "../draw.js";
import { bindCanvas, setMeasure, ui, wasm } from "./ffi-browser.ts";

const canvas = document.getElementById("frame") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const dpr = Math.max(1, window.devicePixelRatio || 1);
canvas.width = W * dpr;
canvas.height = H * dpr;
const surface = createSurface(ctx, { width: W, height: H, dpr });
setMeasure((ptr, len, fontId, size) => surface.measure(wasm, ptr, len, fontId, size));
bindCanvas(ctx, dpr);

// the font the frame is measured and drawn with: a FontFace is in document.fonts once it is loaded, and Clay's measure
// callback is Canvas2D's, so the layout is this font's metrics
await loadFont("../../vendor/fonts/Roboto-Regular.ttf");
if (ui.init(W, H)) throw new Error(`ui_init(${W}, ${H}) failed`);

// the page and the frame, as solid/main.ts wires them (its window loop): the page's motion hook is the only one Sensors
// takes, and it is where its first-mount entry ticks
const root = new El("root");
const motion: Motion = {};
render(() => Sensors({ motion }), root);
const frame = createFrame(root, {
  onPointer: (x, y, down, touch) => motion.onPointer?.(x, y, down, touch),
  onWheel: (dx, dy) => motion.onWheel?.(dx, dy),
  tick: (dt) => motion.tick?.(dt),
});
const draw = createDrawer(frame);

// the pointer, as the layout's pixels: the canvas is drawn at W x H CSS pixels, so the only mapping is the element's box
let px = -1, py = -1, down = false;
const at = (e: MouseEvent): [number, number] => {
  const box = canvas.getBoundingClientRect();
  return [((e.clientX - box.left) * W) / box.width, ((e.clientY - box.top) * H) / box.height];
};
canvas.addEventListener("mousemove", (e) => {
  [px, py] = at(e);
});
// a press and a release are discrete inputs: the frame runs on the event, not on the next tick, so a quick click cannot
// land two events inside one frame and lose the press (the desktop's loop runs a frame after every poll)
canvas.addEventListener("mousedown", (e) => {
  [px, py] = at(e), (down = true), immediate();
});
canvas.addEventListener("mouseup", (e) => {
  [px, py] = at(e), (down = false), immediate();
});
canvas.addEventListener("mouseleave", () => {
  px = py = -1, down = false;
});
// SDL's wheel is ±1 a notch, positive away from the user (a wheel up); a browser's delta is pixels, positive a wheel
// down. One event is one notch, with the sign turned round (nothing on this page scrolls, the Sensors page has no clip
// element, but the same wheel goes to Clay's containers when a page keeps its own scrolling).
canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    ui.wheel(-Math.sign(e.deltaX), -Math.sign(e.deltaY));
  },
  { passive: false },
);

/** One frame now, with the real elapsed seconds, as the loop's next iteration would run it. */
function immediate(): void {
  if (!running) return;
  const now = performance.now();
  step(Math.min((now - last) / 1000, 0.1), true);
  last = now;
}

const wheelOut = new Float32Array(2);
const pumpWheel = () => {
  let had = false;
  while (ui.wheelPop(wheelOut)) had = true, motion.onWheel?.(wheelOut[0]!, wheelOut[1]!);
  return had;
};

/** One iteration of the desktop's window loop: the wheel, then the frame; the canvas is drawn when the drawer drew. */
function step(dt: number, discrete = false): boolean {
  pumpWheel();
  const painted = draw(px, py, down, dt, discrete);
  if (painted) surface.draw(readCommands(wasm));
  return painted;
}

// the window loop: a browser's tick is requestAnimationFrame, and its dt is the real elapsed seconds (the first frame
// gets 1/60, as a headless one does)
let last = performance.now();
let running = true;
function tick(): void {
  if (!running) return;
  const now = performance.now();
  step(Math.min((now - last) / 1000, 0.1));
  last = now;
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/** What browser/solid-check.mjs drives: the scripted frames solid/main.ts's flags take, the frame as a dump, and its
 *  ms. Functions, so nothing can hold a stale command list. */
interface Page {
  warm(n?: number): unknown;
  pointer(x: number, y: number, down: boolean): void;
  commands(): unknown;
  errors(): number;
  dump(): string;
  bench(n?: number): number;
}

declare global {
  interface Window {
    __page: Page;
  }
}

// for browser/solid-check.mjs: the same scripted frames main.ts --png/--click take, the last frame's commands and dump,
// and the frame's ms. `warm` is dump.ts's `--warm 30` (31 frames at 1/60), so the page's first-mount entry is over
window.__page = {
  /** N frames at rest at 1/60s with the pointer where it is (the page's entry settles over ~21). */
  warm(n = 31) {
    for (let i = 0; i < n; i++) step(1 / 60);
    return readCommands(wasm);
  },
  /** The point and the button of the next frames (no frame runs: the loop's next one, or `warm`). */
  pointer(x: number, y: number, isDown: boolean) {
    px = x, py = y, down = isDown;
  },
  commands: () => readCommands(wasm),
  errors: () => ui.errors(),
  /** The last frame as desktop/clay_dump.c's JSON (browser/ui.c's `dump`), read out of the memory. */
  dump() {
    const length = wasm.dump();
    return new TextDecoder().decode(new Uint8Array(wasm.memory.buffer, wasm.dump_ptr(), length));
  },
  /** Ms a frame: the tree declared, Clay's layout, the commands read out, Canvas2D's raster and one readback. */
  bench(n = 100) {
    const t0 = performance.now();
    for (let i = 0; i < n; i++) {
      frame(px, py, down, 1 / 60, false);
      surface.draw(readCommands(wasm));
      ctx.getImageData(0, 0, 1, 1); // a readback, so the raster is done, not just queued
    }
    return (performance.now() - t0) / n;
  },
};

const ms = document.getElementById("ms");
if (ms) ms.textContent = `${window.__page.bench(20).toFixed(2)} ms a frame`;
