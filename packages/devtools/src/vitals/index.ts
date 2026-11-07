// The vitals of a page, printed in the console: web vitals (FCP, LCP, CLS, INP, TTFB), the main thread (long tasks and
// long animation frames with the style and layout time beside the script's), errors, the heap, the frame timeline, and the
// stylesheets' own numbers (cssStats). No DOM overlay and no dev server: it runs on any page, including one that draws to
// a canvas and has no elements to inspect — the browser console is the only surface such a page has.
//
//   import { observe, vitals } from "@cssints/devtools/vitals";
//   observe();            // at the app's entry: FCP, LCP and CLS are read from the buffer either way, frames need time
//   vitals();             // the report, printed; `window.vitals` is the same call from the console
//
// Plain code: browser APIs in their callbacks, no Effect, no build step of its own.
import { bars, heatmap, sparkline } from "./charts.ts";
import { type CssStats, cssStats } from "./css.ts";

export interface VitalsReport {
  /** ms since `observe()` */
  elapsed: number;
  fcp: number | null;
  lcp: number | null;
  cls: number;
  inp: number | null;
  ttfb: number | null;
  tasks: { count: number; total: number; max: number };
  /** long animation frames: `render` is the style and layout time, `max` the longest frame */
  loaf: { count: number; render: number; max: number };
  errors: number;
  heap: number | null;
  nodes: number;
  frames: { history: number[]; p50: number; p95: number; max: number; dropped: number };
  css: CssStats;
}

interface State {
  started: number;
  fcp: number | null;
  lcp: number | null;
  cls: number;
  inp: number | null;
  tasks: { count: number; total: number; max: number };
  loaf: { count: number; render: number; max: number };
  errors: number;
  frames: number[];
}

const state: State = {
  started: 0,
  fcp: null,
  lcp: null,
  cls: 0,
  inp: null,
  tasks: { count: 0, total: 0, max: 0 },
  loaf: { count: 0, render: 0, max: 0 },
  errors: 0,
  frames: [],
};

// The entries whose fields the TypeScript DOM library may not know yet (`interactionId`, the long animation frame).
interface EventEntry extends PerformanceEntry {
  interactionId?: number;
}
interface AnimationFrameEntry extends PerformanceEntry {
  styleAndLayoutStart?: number;
}
interface LayoutShiftEntry extends PerformanceEntry {
  value?: number;
  hadRecentInput?: boolean;
}
interface PaintEntry extends PerformanceEntry {
  name: string;
}

const FRAME = 1000 / 60;
const observers: { type: string; observer: PerformanceObserver }[] = [];
let last = 0;
let loop = 0;
let listening = false;
let running = false;

const start = (): void => {
  if (running) return;
  running = true;
  state.started = performance.now();
  const supported = PerformanceObserver.supportedEntryTypes ?? [];
  const watch = (type: string, buffered = true): void => {
    if (!supported.includes(type)) return;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) read(type, entry);
    });
    observer.observe({ type, buffered } as PerformanceObserverInit);
    observers.push({ type, observer });
  };
  watch("paint");
  watch("largest-contentful-paint");
  watch("layout-shift");
  watch("longtask");
  watch("event");
  watch("long-animation-frame");
  if (!listening) {
    listening = true;
    addEventListener("error", () => state.errors++);
    addEventListener("unhandledrejection", () => state.errors++);
  }
  const tick = (now: number): void => {
    // a tab that was hidden for seconds is not a dropped frame: only the frames the loop actually saw
    if (last && now - last < 1000) state.frames.push(now - last);
    if (state.frames.length > 1800) state.frames.splice(0, state.frames.length - 1800);
    last = now;
    loop = requestAnimationFrame(tick);
  };
  loop = requestAnimationFrame(tick);
};

const read = (type: string, entry: PerformanceEntry): void => {
  if (type === "paint") {
    if ((entry as PaintEntry).name === "first-contentful-paint") state.fcp = entry.startTime;
  } else if (type === "largest-contentful-paint") {
    state.lcp = entry.startTime;
  } else if (type === "layout-shift") {
    const shift = entry as LayoutShiftEntry;
    if (!shift.hadRecentInput) state.cls += shift.value ?? 0;
  } else if (type === "longtask") {
    state.tasks.count++;
    state.tasks.total += entry.duration;
    state.tasks.max = Math.max(state.tasks.max, entry.duration);
  } else if (type === "event") {
    const event = entry as EventEntry;
    if (event.interactionId) state.inp = Math.max(state.inp ?? 0, entry.duration);
  } else if (type === "long-animation-frame") {
    const frame = entry as AnimationFrameEntry;
    state.loaf.count++;
    if (frame.styleAndLayoutStart !== undefined) {
      state.loaf.render += Math.max(
        0,
        entry.startTime + entry.duration - frame.styleAndLayoutStart,
      );
    }
    state.loaf.max = Math.max(state.loaf.max, entry.duration);
  }
};

const percentile = (sorted: readonly number[], p: number): number =>
  sorted.length === 0 ? 0 : sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]!;

// The numbers, without printing: read them in a test or draw them somewhere else.
export const report = (): VitalsReport => {
  start();
  // The buffered entries are queued into the observers when they observe, and delivered on a later task: a cold call
  // (the console, a test) reads them out now instead of one report late.
  for (const { type, observer } of observers)
    for (const entry of observer.takeRecords()) read(type, entry);
  const history = state.frames.slice(-600);
  const sorted = [...history].sort((a, b) => a - b);
  const navigation = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  // paint entries are not buffered by the observer: read the timeline itself when the observer was late
  const paint = performance
    .getEntriesByType("paint")
    .find((entry) => entry.name === "first-contentful-paint");
  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  return {
    elapsed: performance.now() - state.started,
    fcp: state.fcp ?? paint?.startTime ?? null,
    lcp: state.lcp,
    cls: state.cls,
    inp: state.inp,
    ttfb: navigation ? navigation.responseStart : null,
    tasks: { ...state.tasks },
    loaf: { ...state.loaf },
    errors: state.errors,
    heap: memory ? memory.usedJSHeapSize : null,
    nodes: document.getElementsByTagName("*").length,
    frames: {
      history: [...state.frames],
      p50: percentile(sorted, 0.5),
      p95: percentile(sorted, 0.95),
      max: sorted.at(-1) ?? 0,
      dropped: history.filter((ms) => ms > FRAME * 2).length,
    },
    css: cssStats(document),
  };
};

const ms = (value: number | null): string =>
  value === null
    ? "—"
    : value >= 1000
      ? `${(value / 1000).toFixed(2)} s`
      : `${value >= 100 ? Math.round(value) : value.toFixed(1)} ms`;

const size = (bytes: number): string =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : bytes >= 1024
      ? `${(bytes / 1024).toFixed(1)} kB`
      : `${bytes} B`;

const count = (value: number): string => value.toLocaleString("en-US").replace(/,/g, " ");

const list = (names: readonly string[], at = 8): string =>
  names.length <= at ? names.join(" ") : `${names.slice(0, at).join(" ")} +${names.length - at}`;

const share = (part: number, whole: number): string =>
  whole === 0 ? "0%" : `${Math.round((part / whole) * 100)}%`;

// The report, printed as one console group: the numbers, the charts, and the lists only when they have something in them.
export const print = (value: VitalsReport): void => {
  const { css } = value;
  const frames = heatmap(value.frames.history);
  console.group("cssints vitals");
  console.log(
    `%c${ms(value.elapsed)}%c · ${count(value.nodes)} nodes · ${css.sheets} sheets · ${count(css.classes.length)} classes`,
    "font-weight:bold",
    "color:inherit",
  );
  console.log(
    `vitals   FCP ${ms(value.fcp)} · LCP ${ms(value.lcp)} · CLS ${value.cls.toFixed(3)} · INP ${ms(value.inp)} · TTFB ${ms(value.ttfb)}`,
  );
  console.log(
    `frames   p50 ${ms(value.frames.p50)} · p95 ${ms(value.frames.p95)} · max ${ms(value.frames.max)} · ${value.frames.dropped} dropped  ${sparkline(value.frames.history)}`,
  );
  if (frames.cells) console.log(`         ${frames.cells}`, ...frames.styles);
  console.log(
    `main     ${value.tasks.count} long tasks · ${ms(value.tasks.total)} · max ${ms(value.tasks.max)} · style+layout ${ms(value.loaf.render)} · ${value.errors} errors · heap ${value.heap === null ? "—" : size(value.heap)}`,
  );
  console.log(
    `CSS      ${size(css.bytes)} · ${count(css.rules)} rules · ${count(css.declarations)} decls · ${css.blocked} blocked · specificity ${css.specificity.join(",")} (${css.worst || "—"})`,
  );
  for (const line of bars(
    css.layerBytes
      .slice(0, 5)
      .map((x) => ({ label: x.layer, value: x.bytes, text: size(x.bytes) })),
  ))
    console.log(`layer    ${line}`);
  console.log(
    `tokens   ${css.colours.length} colours · ${css.fonts.length} fonts · ${css.important} !important · custom props ${css.custom.declared.length} declared / ${css.custom.used.length} used / ${css.custom.orphaned.length} orphaned · keyframes ${css.keyframes.declared.length} / ${css.keyframes.unused.length} unused`,
  );
  console.log(
    `coverage ${css.unused.length} / ${css.classes.length} classes unused (${share(css.unused.length, css.classes.length)})${css.unused.length ? `  ${list(css.unused)}` : ""}`,
  );
  if (css.custom.orphaned.length) console.log(`orphaned ${list(css.custom.orphaned)}`);
  if (css.custom.missing.length) console.log(`undeclared ${list(css.custom.missing)}`);
  console.groupEnd();
};

// The report, printed. `window.vitals()` is the same from the console; import `observe` at the app's entry to have frames.
export const vitals = (): VitalsReport => {
  const value = report();
  print(value);
  return value;
};

export const observe = (): void => start();

export const stop = (): void => {
  cancelAnimationFrame(loop);
  loop = 0;
  last = 0;
};

// The console's way in. A page that imports this module (or the dev server's overlay) gets the same function it imports.
(globalThis as typeof globalThis & { vitals?: typeof vitals }).vitals ??= vitals;
