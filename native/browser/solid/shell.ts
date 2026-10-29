// The shell both Solid pages of the browser share: the canvas, Clay in ui.wasm (browser/ui.c through ffi-browser.ts), one
// frame a requestAnimationFrame, the DOM's pointer and keyboard where the desktop's window poll has SDL's, and the object
// browser/solid-check.mjs drives (`window.__page`). A page supplies its tree and, if it takes keys, its `Input`.
//
// The loop is src/frame.ts's createDrawer: the tree is declared and laid out every iteration, and the canvas is drawn only
// when the frame hash moved or a discrete input came in (a press, a release, a wheel notch, a key) — a page at rest costs a
// layout and no pixels, as on the desktop. A press, a release, a wheel notch and a key each run their frame on the event,
// so a quick input cannot land two events inside one frame and lose one.
import "./globals.ts";

import { snapshot } from "../../solid/a11y.ts";
import type { Motion } from "../../solid/src/entry.ts";
import { createDrawer, createFrame } from "../../solid/src/frame.ts";
import type { Input } from "../../solid/src/input.ts";
import { El, render } from "../../solid/src/renderer.ts";
import { createSurface, loadFont, readCommands, readEffects } from "../draw.js";
import { bindCanvas, setMeasure, ui, wasm } from "./ffi-browser.ts";
import { attachKeys } from "./keys.ts";

/** The page's pointer callback (app/Widgets.tsx's `Drag`): the shell's `onPointer` each frame. */
export interface Drag {
  onPointer?: (x: number, y: number, down: boolean) => void;
}

/** What a page's tree gets: its root, the host's motion hook (its entry, its tracks), its own drag state and a frame. */
export interface Setup {
  readonly root: El;
  readonly motion: Motion;
  readonly drag: Drag;
  /** One frame now, with the real elapsed seconds, as the loop's next iteration would run it: a discrete input. */
  immediate(): void;
}

/** What browser/solid-check.mjs drives: the scripted frames main.ts's flags take, the frame as a dump, and its ms. */
interface Page {
  warm(n?: number): unknown;
  pointer(x: number, y: number, down: boolean): void;
  commands(): unknown;
  errors(): number;
  dump(): string;
  /** The page's tree as a screen reader would walk it (solid/a11y.ts's `snapshot`), in the page. */
  a11y(): unknown;
  bench(n?: number): number;
}

declare global {
  interface Window {
    __page: Page;
  }
}

export interface Options {
  /** The layout's size, in Clay units (each page's own `size`; the Sensors page is 360x360). */
  width: number;
  height: number;
  /** The page's focus manager: the keys go into it. A page without keys (Sensors) has none. */
  input?: Input;
  /** The page's tree: `render`ed once, before the first frame. */
  tree: (setup: Setup) => () => El;
}

/**
 * Loads the wasm and the font, renders the page's tree and starts its loop. The canvas is `#frame` (each page's html), its
 * density the device's, and it takes the DOM's focus on a press (`tabindex="0"` in the html): a canvas is not focusable
 * otherwise, and a keydown goes to the focused element. The page does not take focus on load, as a page that scrolls or
 * jumps under its reader should not.
 */
export async function mountPage(options: Options): Promise<void> {
  const { width, height } = options;
  const canvas = document.getElementById("frame") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const surface = createSurface(ctx, { width, height, dpr });
  setMeasure((ptr, len, fontId, size) => surface.measure(wasm, ptr, len, fontId, size));
  bindCanvas(ctx, dpr);

  // the font the frame is measured and drawn with: a FontFace is in document.fonts once it is loaded, and Clay's measure
  // callback is Canvas2D's, so the layout is this font's metrics
  await loadFont("../../vendor/fonts/Roboto-Regular.ttf");
  if (ui.init(width, height)) throw new Error(`ui_init(${width}, ${height}) failed`);

  const root = new El("root");
  const motion: Motion = {};
  const drag: Drag = {};
  const setup: Setup = { root, motion, drag, immediate: () => immediate() };
  render(options.tree(setup), root);
  const frame = createFrame(root, {
    // the pointer goes to both hooks: the Widgets slider's drag and the page's own (the List's viewport)
    onPointer: (x, y, down, touch) => {
      drag.onPointer?.(x, y, down);
      motion.onPointer?.(x, y, down, touch);
    },
    // a press that no element with `onPress` was under: a click on empty space blurs, as a browser's does
    onPressMiss: () => options.input?.pressMiss(),
    onWheel: (dx, dy) => motion.onWheel?.(dx, dy),
    tick: (dt) => motion.tick?.(dt),
  });
  const draw = createDrawer(frame);

  // the pointer, as the layout's pixels: the canvas is drawn at W x H CSS pixels, so the only mapping is the element's box
  let px = -1;
  let py = -1;
  let down = false;
  const at = (event: MouseEvent): [number, number] => {
    const box = canvas.getBoundingClientRect();
    return [((event.clientX - box.left) * width) / box.width, ((event.clientY - box.top) * height) / box.height];
  };
  canvas.addEventListener("mousemove", (event) => {
    [px, py] = at(event);
  });
  // a press and a release are discrete inputs, and the press gives the canvas the DOM's focus, so the keys reach it
  canvas.addEventListener("mousedown", (event) => {
    [px, py] = at(event);
    down = true;
    canvas.focus();
    immediate();
  });
  canvas.addEventListener("mouseup", (event) => {
    [px, py] = at(event);
    down = false;
    immediate();
  });
  canvas.addEventListener("mouseleave", () => {
    px = py = -1;
    down = false;
  });
  // SDL's wheel y is positive away from the user, and a browser's deltaY is positive scrolling down the page: the same
  // sign. `ui.wheel` feeds Clay's containers and the page's own channel; the loop drains it before the frame, as the
  // desktop's window loop does with ui.wheelPop
  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      ui.wheel(event.deltaX, event.deltaY);
    },
    { passive: false },
  );

  // the keyboard, when the page has one: the canvas has the DOM's focus (the press above), so its own keydown/keyup are
  // the page's; a key goes into the page's Input and then its frame runs, as main.ts's loop pops a key before the frame
  if (options.input) attachKeys(canvas, options.input, () => immediate());

  /** One frame now, as the loop's next iteration would run it. */
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

  /** One frame's commands and the renderer's tables beside them (a page with no effect has empty ones). */
  function paint(): void {
    surface.draw(readCommands(wasm), readEffects(wasm));
  }

  /** One iteration of the desktop's window loop: the wheel, then the frame; the canvas is drawn when the drawer drew. */
  function step(dt: number, discrete = false): boolean {
    pumpWheel();
    const painted = draw(px, py, down, dt, discrete);
    if (painted) paint();
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

  // for browser/solid-check.mjs: the same scripted frames main.ts --png/--click take, the last frame's commands, dump and
  // a11y tree, and the frame's ms. `warm` is dump.ts's `--warm 30` (31 frames at 1/60), so a page's first-mount entry is
  // over. Functions, so nothing can hold a stale command list.
  window.__page = {
    /** N frames at rest at 1/60s with the pointer where it is (a page's entry settles over ~21). */
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
    a11y: () => snapshot(root),
    /** Ms a frame: the tree declared, Clay's layout, the commands read out, Canvas2D's raster and one readback. */
    bench(n = 100) {
      const t0 = performance.now();
      for (let i = 0; i < n; i++) {
        frame(px, py, down, 1 / 60, false);
        paint();
        ctx.getImageData(0, 0, 1, 1); // a readback, so the raster is done, not just queued
      }
      return (performance.now() - t0) / n;
    },
  };

  // a page a person opens prints its ms; `?bench=0` takes the auto bench (twenty frames) out of the way, for a check
  // whose frames have to start at the first one
  const ms = document.getElementById("ms");
  if (ms && new URLSearchParams(location.search).get("bench") !== "0") ms.textContent = `${window.__page.bench(20).toFixed(2)} ms a frame`;
}
