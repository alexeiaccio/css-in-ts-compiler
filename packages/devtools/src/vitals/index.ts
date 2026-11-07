// The vitals of a page, printed in the console: web vitals (FCP, LCP, CLS, INP, TTFB) with the culprit each names, long
// animation frames with the style and layout time beside the script's, errors, the heap, the frame timeline, and the
// stylesheets' own numbers (cssStats). No DOM overlay and no dev server: it runs on any page, including one that draws to
// a canvas and has no elements to inspect — the browser console is the only surface such a page has.
//
//   import { observe, vitals } from "@cssints/devtools/vitals";
//   observe();            // at the app's entry: long animation frames and frames need time (the five vitals read buffered)
//   vitals();             // the report, printed; `window.vitals` is the same call from the console
//
// Plain code: browser APIs in their callbacks, no Effect, no build step of its own.
import { bars, heatmap, sparkline } from "./charts.ts";
import { type CssStats, cssStats } from "./css.ts";
import { measure, measured } from "./metrics.ts";

export type Rating = "good" | "needs-improvement" | "poor";

export interface VitalsReport {
  /** ms since `observe()` */
  elapsed: number;
  fcp: number | null;
  lcp: number | null;
  cls: number;
  inp: number | null;
  ttfb: number | null;
  ratings: { fcp?: Rating; lcp?: Rating; cls?: Rating; inp?: Rating; ttfb?: Rating };
  /** the element web-vitals names as the largest paint */
  lcpTarget: string | null;
  /** the element of the largest layout shift */
  clsTarget: string | null;
  /** the element INP is about */
  inpTarget: string | null;
  /** the interaction's input delay, processing and presentation, in ms */
  inpPhases: { input: number; processing: number; presentation: number } | null;
  /** long animation frames: count, total duration, the style and layout time, the longest */
  loaf: { count: number; total: number; render: number; max: number };
  errors: number;
  heap: number | null;
  nodes: number;
  frames: { history: number[]; p50: number; p95: number; max: number; dropped: number };
  css: CssStats;
}

interface State {
  started: number;
  loaf: { count: number; total: number; render: number; max: number };
  errors: number;
  frames: number[];
}

const state: State = {
  started: 0,
  loaf: { count: 0, total: 0, render: 0, max: 0 },
  errors: 0,
  frames: [],
};

// The entry whose fields the TypeScript DOM library may not know yet (`styleAndLayoutStart`).
interface AnimationFrameEntry extends PerformanceEntry {
  styleAndLayoutStart?: number;
}

const FRAME = 1000 / 60;
let last = 0;
let loop = 0;
let listening = false;
let running = false;

const start = (): void => {
  if (running) return;
  running = true;
  state.started = performance.now();
  measure();
  if (!listening) {
    listening = true;
    addEventListener("error", () => state.errors++);
    addEventListener("unhandledrejection", () => state.errors++);
  }
  if ((PerformanceObserver.supportedEntryTypes ?? []).includes("long-animation-frame")) {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) read(entry);
    }).observe({ type: "long-animation-frame", buffered: true });
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

const read = (entry: PerformanceEntry): void => {
  const frame = entry as AnimationFrameEntry;
  state.loaf.count++;
  state.loaf.total += entry.duration;
  if (frame.styleAndLayoutStart !== undefined) {
    state.loaf.render += Math.max(0, entry.startTime + entry.duration - frame.styleAndLayoutStart);
  }
  state.loaf.max = Math.max(state.loaf.max, entry.duration);
};

const percentile = (sorted: readonly number[], p: number): number =>
  sorted.length === 0 ? 0 : sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]!;

// The numbers, without printing: read them in a test or draw them somewhere else.
export const report = (): VitalsReport => {
  start();
  const metrics = measured();
  const history = state.frames.slice(-600);
  const sorted = [...history].sort((a, b) => a - b);
  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  const inp = metrics.inp?.attribution;
  return {
    elapsed: performance.now() - state.started,
    fcp: metrics.fcp?.value ?? null,
    lcp: metrics.lcp?.value ?? null,
    cls: metrics.cls?.value ?? 0,
    inp: metrics.inp?.value ?? null,
    ttfb: metrics.ttfb?.value ?? null,
    ratings: {
      fcp: metrics.fcp?.rating,
      lcp: metrics.lcp?.rating,
      cls: metrics.cls?.rating,
      inp: metrics.inp?.rating,
      ttfb: metrics.ttfb?.rating,
    },
    lcpTarget: metrics.lcp?.attribution.target ?? null,
    clsTarget: metrics.cls?.attribution.largestShiftTarget ?? null,
    inpTarget: inp?.interactionTarget ?? null,
    inpPhases: inp
      ? {
          input: inp.inputDelay,
          processing: inp.processingDuration,
          presentation: inp.presentationDelay,
        }
      : null,
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

// `!` needs improvement, `!!` poor: the thresholds are web-vitals' own.
const rate = (rating: Rating | undefined): string =>
  rating === "needs-improvement" ? " !" : rating === "poor" ? " !!" : "";

const at = (target: string | null, cut = 24): string =>
  target === null ? "" : ` (${target.length > cut ? `${target.slice(0, cut)}…` : target})`;

// The report, printed as one console group: the numbers, the charts, and the lists only when they have something in them.
export const print = (value: VitalsReport): void => {
  const { css } = value;
  const frames = heatmap(value.frames.history);
  const phases = value.inpPhases
    ? ` · ${Math.round(value.inpPhases.input)}+${Math.round(value.inpPhases.processing)}+${Math.round(value.inpPhases.presentation)}`
    : "";
  console.group("cssints vitals");
  console.log(
    `${ms(value.elapsed)} · ${count(value.nodes)} nodes · ${css.sheets} sheet${css.sheets === 1 ? "" : "s"} · ${count(css.classes.length)} classes`,
  );
  console.log(
    `vitals   FCP ${ms(value.fcp)}${rate(value.ratings.fcp)} · LCP ${ms(value.lcp)}${at(value.lcpTarget)}${rate(value.ratings.lcp)} · CLS ${value.cls.toFixed(3)}${at(value.clsTarget)}${rate(value.ratings.cls)}`,
  );
  console.log(
    `         INP ${ms(value.inp)}${at(value.inpTarget)}${phases}${rate(value.ratings.inp)} · TTFB ${ms(value.ttfb)}${rate(value.ratings.ttfb)}`,
  );
  console.log(
    `frames   p50 ${ms(value.frames.p50)} · p95 ${ms(value.frames.p95)} · max ${ms(value.frames.max)} · ${value.frames.dropped} dropped  ${sparkline(value.frames.history)}`,
  );
  if (frames.cells) console.log(`         ${frames.cells}`, ...frames.styles);
  console.log(
    `main     ${value.loaf.count} long frames · ${ms(value.loaf.total)} · max ${ms(value.loaf.max)} · style+layout ${ms(value.loaf.render)} · ${value.errors} errors · heap ${value.heap === null ? "—" : size(value.heap)}`,
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
