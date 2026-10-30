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
  /** An element's box from the last frame's layout (`ui.bounds`): the List's rows and thumb, the field's caret. */
  bounds(id: string): number[] | undefined;
  /** A clip element's scroll offset, positive down (`ui.scrollOffset`; Clay's is negative down): the List's viewport's. */
  offset(id: string): number;
  /** Whether the last frame's pointer was a finger's (`src/frame.ts`'s `touch`): true after a touch, false after the
   *  mouse. */
  touch(): boolean;
  /** The finger's events the canvas has taken (`pointerdown`/`move`/`up`/`cancel` with `pointerType: "touch"`): a check
   *  waits on it, so it knows the renderer dispatched the event it sent. */
  touches(): number;
  /** The frames the drawer drew and the shell painted (`ui.draws`, `ui.presents`): the dev panel's counters. */
  draws(): number;
  presents(): number;
  /** The last frame's hash (`ui.hash`), as hex: the frame is the same when it is the same. */
  hash(): string;
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
  /** The frame loop's own array (`View.stats`), for the dev page's panel: the four phases of every frame. */
  stats?: [number, number, number, number][];
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
    // the pointer goes to both hooks: the Widgets slider's drag and the page's own (the List's viewport), with the
    // finger's flag, which the shell keeps for `window.__page.touch`
    onPointer: (x, y, down, finger) => {
      touch = finger;
      drag.onPointer?.(x, y, down);
      motion.onPointer?.(x, y, down, finger);
    },
    // a press that no element with `onPress` was under: a click on empty space blurs, as a browser's does
    onPressMiss: () => options.input?.pressMiss(),
    onWheel: (dx, dy) => motion.onWheel?.(dx, dy),
    tick: (dt) => motion.tick?.(dt),
    stats: options.stats,
  });
  const draw = createDrawer(frame, options.stats);

  // the pointer, as the layout's pixels: the canvas is drawn at W x H CSS pixels, so the only mapping is the element's box
  let px = -1;
  let py = -1;
  let down = false;
  // the flag the frame's pointer carries (src/frame.ts's `touch`): the mouse's events clear it, a touch's set it, and
  // `window.__page.touch` reports what the last frame got
  let touch = false;
  // how many of a finger's events the canvas has taken, `window.__page.touches`: a check waits for the renderer to have
  // dispatched the one it sent, instead of guessing a time
  let touches = 0;
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
    touch = false;
    canvas.focus();
    immediate();
  });
  canvas.addEventListener("mouseup", (event) => {
    [px, py] = at(event);
    down = false;
    touch = false;
    immediate();
  });
  canvas.addEventListener("mouseleave", () => {
    px = py = -1;
    down = false;
    touch = false;
  });
  // A finger is the same pointer with the frame's `touch` flag: the pointer events a touchscreen sends, at the same
  // mapping, down while the finger is on the canvas and up where it lifts. The flag is what a page's machine reads to
  // start a drag with no click threshold (src/vscroll.ts); the mouse's path above is its own and stays `touch = false`.
  // `touch-action: none` takes the browser's pan and zoom off the canvas — with it a finger's drag is the page's, without
  // it the browser scrolls the document and sends a pointercancel — and the compatibility mouse events a tap would also
  // send are cancelled here, so one tap is one press and one release. The pointer is captured on a press, so a finger
  // that leaves the canvas mid-drag still lifts on it.
  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") return;
    event.preventDefault();
    [px, py] = at(event);
    down = true;
    touch = true;
    touches++;
    canvas.setPointerCapture(event.pointerId);
    canvas.focus();
    immediate();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") [px, py] = at(event), (touch = true), touches++;
  });
  canvas.addEventListener("pointerup", (event) => {
    if (event.pointerType !== "touch") return;
    [px, py] = at(event);
    down = false;
    touch = true;
    touches++;
    immediate();
  });
  // the browser took the gesture back (a system edge swipe): it ends where the finger last was, as a release
  canvas.addEventListener("pointercancel", (event) => {
    if (event.pointerType !== "touch") return;
    down = false;
    touch = true;
    touches++;
    immediate();
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
    ui.present(); // the desktop's window present: what the dev panel's `presents` counts
  }

  /** One iteration of the desktop's window loop: the wheel, then the frame; the canvas is drawn when the drawer drew. */
  function step(dt: number, discrete = false): boolean {
    pumpWheel();
    const painted = draw(px, py, down, dt, discrete, touch);
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

  // the ids `bounds` encodes: Clay holds the pointer it hashed, so an id's bytes are made once and kept
  const bound = new Map<string, Uint8Array>();

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
    /** The last frame's pointer was a finger's: what a touch event set and a mouse event clears. */
    touch: () => touch,
    /** The finger's events the canvas has taken: `touch()` is the frame's, this is the listener's. */
    touches: () => touches,
    /** A clip element's offset, positive down. */
    offset: (id: string) => -ui.scrollOffset(id),
    commands: () => readCommands(wasm),
    errors: () => ui.errors(),
    /** The last frame as desktop/clay_dump.c's JSON (browser/ui.c's `dump`), read out of the memory. */
    dump() {
      const length = wasm.dump();
      return new TextDecoder().decode(new Uint8Array(wasm.memory.buffer, wasm.dump_ptr(), length));
    },
    a11y: () => snapshot(root),
    /** A box of the last frame's layout, as [x, y, w, h] (the element's own, clipped or not), or undefined for an id the
     *  page did not declare. The bytes are made once an id, as every id is. */
    bounds(id: string) {
      const box = ui.bounds(bound.get(id) ?? (bound.set(id, new TextEncoder().encode(id)), bound.get(id)!));
      return box === undefined ? undefined : [...box];
    },
    /** The drawer's draws and the shell's paints, the two counters the dev panel prints. */
    draws: () => ui.draws(),
    presents: () => ui.presents(),
    /** The last frame's hash (a string: a bigint does not cross the page's edge): the same value, the same pixels. */
    hash: () => ui.hash().toString(16),
    /** Ms a frame: the tree declared, Clay's layout, the commands read out, Canvas2D's raster and one readback. */
    bench(n = 100) {
      const t0 = performance.now();
      for (let i = 0; i < n; i++) {
        frame(px, py, down, 1 / 60, false, touch);
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
