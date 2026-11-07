// The vitals of a page, printed in the console: web vitals (FCP, LCP, CLS, INP, TTFB) with the culprit each names, long
// animation frames with the style and layout time beside the script's and the sources that made them, errors, the heap,
// the frame timeline, the stylesheets' bytes and their arrival, the sheet's growth across a dev server's edits, the cost
// of each call, and the history of the last loads. No DOM overlay and no dev server: it runs on any page, including one
// that draws to a canvas and has no elements to inspect — the browser console is the only surface such a page has.
//
//   import { observe, vitals, reset } from "@cssints/devtools/vitals";
//   observe();            // at the app's entry: long animation frames and frames need time (the five vitals read buffered)
//   vitals();             // the report, printed; `window.vitals` is the same call from the console
//
// Plain code: browser APIs in their callbacks, no Effect, no build step of its own.
import { bars, heatmap, sparkline } from "./charts.ts";
import { costs, isTable, type Costs, type TableLike } from "./cost.ts";
import { type CssStats, cssStats } from "./css.ts";
import { history, type Load, record, clear } from "./history.ts";
import { sheetTimings, type SheetTiming } from "./load.ts";
import { measure, measured } from "./metrics.ts";

export type Rating = "good" | "needs-improvement" | "poor";

/** One load of the sheet on a dev server: its size, how many classes it holds, and the file that changed. */
export interface SheetEdit {
  file: string;
  bytes: number;
  classes: number;
}

/** The script a long animation frame ran, summed by its source. */
export interface ScriptCost {
  source: string;
  ms: number;
  frames: number;
}

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
  /** the element INP is about, and its input delay, processing and presentation, in ms */
  inpTarget: string | null;
  inpPhases: { input: number; processing: number; presentation: number } | null;
  /** the long animation frames the interaction covered, and their style+layout time */
  inpFrames: { frames: number; render: number } | null;
  /** long animation frames: count, total duration, the style and layout time, the longest, and who ran them */
  loaf: {
    count: number;
    total: number;
    render: number;
    max: number;
    /** the forced style and layout time of the frame's scripts (the JS/CSS crossing) */
    forced: number;
    scripts: ScriptCost[];
    invokers: { name: string; count: number }[];
  };
  errors: number;
  heap: number | null;
  nodes: number;
  /** the sheet's growth over the dev server's edits, oldest first (empty off a dev server) */
  sheet: { edits: SheetEdit[] };
  /** the CSS files' arrival (empty when there are none) */
  loads: SheetTiming[];
  /** the sheet's cost by the call that made it: only with the devtools table (`devtools: true`) */
  cost: Costs | undefined;
  /** the last loads of this page, the current one last */
  history: Load[];
  frames: { history: number[]; p50: number; p95: number; max: number; dropped: number };
  css: CssStats;
}

interface State {
  started: number;
  loaf: {
    count: number;
    total: number;
    render: number;
    max: number;
    forced: number;
    scripts: Map<string, { ms: number; frames: number }>;
    invokers: Map<string, number>;
  };
  errors: number;
  frames: number[];
}

const state: State = {
  started: 0,
  loaf: {
    count: 0,
    total: 0,
    render: 0,
    max: 0,
    forced: 0,
    scripts: new Map(),
    invokers: new Map(),
  },
  errors: 0,
  frames: [],
};

// The entry whose fields the TypeScript DOM library may not know yet (`styleAndLayoutStart`, `scripts`).
interface ScriptTiming extends PerformanceEntry {
  sourceURL?: string;
  functionName?: string;
  invoker?: string;
  forcedStyleAndLayoutDuration?: number;
}
interface AnimationFrameEntry extends PerformanceEntry {
  styleAndLayoutStart?: number;
  scripts?: ScriptTiming[];
}

// The dev server sends one of these per load of the sheet (the cssints plugin, over the HMR channel): its size, its class
// count and the file that changed. Off Vite (`import.meta.hot` missing) or off a dev server, the list stays empty and no
// row is printed.
const edits: SheetEdit[] = [];
// The devtools table, when the dev server has `devtools: true`: the sheet's classes with their call sites, for the cost row.
let table: TableLike | undefined;
if (import.meta.hot) {
  import.meta.hot.on("cssints:edits", (data: unknown) => {
    const edit = data as Partial<SheetEdit> | null;
    if (
      edit === null ||
      typeof edit !== "object" ||
      typeof edit.file !== "string" ||
      typeof edit.bytes !== "number" ||
      typeof edit.classes !== "number"
    )
      return;
    // a cold page loads the sheet more than once, and the reply to `edits:get` can repeat the broadcast: a point is a change
    const previous = edits.at(-1);
    if (
      previous &&
      previous.file === edit.file &&
      previous.bytes === edit.bytes &&
      previous.classes === edit.classes
    )
      return;
    edits.push({ file: edit.file, bytes: edit.bytes, classes: edit.classes });
    if (edits.length > 30) edits.shift();
  });
  import.meta.hot.on("cssints:devtools", (data: unknown) => {
    if (isTable(data)) table = data;
  });
  // the page's sheet loaded before this module did: ask for the measurement it already sent, and for the table
  import.meta.hot.send("cssints:edits:get", {});
  import.meta.hot.send("cssints:devtools:get", {});
}

const FRAME = 1000 / 60;
let last = 0;
let loop = 0;
let listening = false;
let running = false;
let recorded = false;

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

const source = (url: string): string => url.split("/").slice(-2).join("/").split("?")[0]!;

const read = (entry: PerformanceEntry): void => {
  const frame = entry as AnimationFrameEntry;
  state.loaf.count++;
  state.loaf.total += entry.duration;
  if (frame.styleAndLayoutStart !== undefined) {
    state.loaf.render += Math.max(0, entry.startTime + entry.duration - frame.styleAndLayoutStart);
  }
  state.loaf.max = Math.max(state.loaf.max, entry.duration);
  for (const script of frame.scripts ?? []) {
    state.loaf.forced += script.forcedStyleAndLayoutDuration ?? 0;
    if (script.invoker) {
      state.loaf.invokers.set(script.invoker, (state.loaf.invokers.get(script.invoker) ?? 0) + 1);
    }
    const where = script.sourceURL ? source(script.sourceURL) : (script.functionName ?? "");
    if (!where) continue;
    const cost = state.loaf.scripts.get(where) ?? { ms: 0, frames: 0 };
    cost.ms += script.duration ?? 0;
    cost.frames++;
    state.loaf.scripts.set(where, cost);
  }
};

const percentile = (sorted: readonly number[], p: number): number =>
  sorted.length === 0 ? 0 : sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]!;

// The classes the DOM carries now: what a call's cost row calls "used".
const carried = (): Set<string> =>
  new Set(
    Array.from(document.querySelectorAll("[class]")).flatMap((element) =>
      Array.from(element.classList),
    ),
  );

// The numbers, without printing: read them in a test or draw them somewhere else.
export const report = (): VitalsReport => {
  start();
  const metrics = measured();
  const payload = metrics.inp?.attribution;
  const sample = state.frames.slice(-600);
  const sorted = [...sample].sort((a, b) => a - b);
  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  const measuredSheet = edits.at(-1)?.bytes ?? null;
  const value: Omit<VitalsReport, "history"> = {
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
    inpTarget: payload?.interactionTarget ?? null,
    inpPhases: payload
      ? {
          input: payload.inputDelay,
          processing: payload.processingDuration,
          presentation: payload.presentationDelay,
        }
      : null,
    inpFrames: payload
      ? {
          frames: payload.longAnimationFrameEntries?.length ?? 0,
          render: payload.totalStyleAndLayoutDuration ?? 0,
        }
      : null,
    loaf: {
      count: state.loaf.count,
      total: state.loaf.total,
      render: state.loaf.render,
      max: state.loaf.max,
      forced: state.loaf.forced,
      scripts: [...state.loaf.scripts]
        .map(([from, cost]) => ({ source: from, ...cost }))
        .sort((a, b) => b.ms - a.ms)
        .slice(0, 3),
      invokers: [...state.loaf.invokers]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3),
    },
    errors: state.errors,
    heap: memory ? memory.usedJSHeapSize : null,
    nodes: document.getElementsByTagName("*").length,
    sheet: { edits: [...edits] },
    loads: sheetTimings(),
    cost: table ? costs(table, carried()) : undefined,
    frames: {
      history: [...state.frames],
      p50: percentile(sorted, 0.5),
      p95: percentile(sorted, 0.95),
      max: sorted.at(-1) ?? 0,
      dropped: sample.filter((ms) => ms > FRAME * 2).length,
    },
    css: cssStats(document),
  };
  // one row per page load: a report called twice is still the same load
  if (!recorded) {
    recorded = true;
    record({
      at: Date.now(),
      path: location.pathname,
      fcp: value.fcp,
      lcp: value.lcp,
      cls: value.cls,
      ttfb: value.ttfb,
      bytes: measuredSheet,
    });
  }
  return { ...value, history: history() };
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

const short = (file: string, at = 28): string => {
  const name = file.split("/").slice(-2).join("/");
  return name.length > at ? `…${name.slice(-(at - 1))}` : name;
};

// `!` needs improvement, `!!` poor: the thresholds are web-vitals' own.
const rate = (rating: Rating | undefined): string =>
  rating === "needs-improvement" ? " !" : rating === "poor" ? " !!" : "";

const at = (target: string | null, cut = 24): string =>
  target === null ? "" : ` (${target.length > cut ? `${target.slice(0, cut)}…` : target})`;

// The change of one measure between two loads of the same page, as ` (−180 ms)`.
const delta = (now: number | null, before: number | null, unit: "ms" | "b" = "ms"): string => {
  if (now === null || before === null) return "";
  const change = now - before;
  if (change === 0) return " (±0)";
  return unit === "ms"
    ? ` (${change > 0 ? "+" : "−"}${Math.round(Math.abs(change))} ms)`
    : ` (${change > 0 ? "+" : "−"}${size(Math.abs(change))})`;
};

// The report, printed as one console group: the numbers, the charts, and the lists only when they have something in them.
export const print = (value: VitalsReport): void => {
  const { css } = value;
  const frames = heatmap(value.frames.history);
  const phases = value.inpPhases
    ? ` · ${Math.round(value.inpPhases.input)}+${Math.round(value.inpPhases.processing)}+${Math.round(value.inpPhases.presentation)}`
    : "";
  const covered =
    value.inpFrames && value.inpFrames.frames
      ? ` · ${value.inpFrames.frames} frame${value.inpFrames.frames === 1 ? "" : "s"}${value.inpFrames.render ? ` ${Math.round(value.inpFrames.render)} ms` : ""}`
      : "";
  console.group("cssints vitals");
  console.log(
    `${ms(value.elapsed)} · ${count(value.nodes)} nodes · ${css.sheets} sheet${css.sheets === 1 ? "" : "s"} · ${count(css.classes.length)} classes`,
  );
  console.log(
    `vitals   FCP ${ms(value.fcp)}${rate(value.ratings.fcp)} · LCP ${ms(value.lcp)}${at(value.lcpTarget)}${rate(value.ratings.lcp)} · CLS ${value.cls.toFixed(3)}${at(value.clsTarget)}${rate(value.ratings.cls)}`,
  );
  console.log(
    `         INP ${ms(value.inp)}${at(value.inpTarget)}${phases}${covered}${rate(value.ratings.inp)} · TTFB ${ms(value.ttfb)}${rate(value.ratings.ttfb)}`,
  );
  console.log(
    `frames   p50 ${ms(value.frames.p50)} · p95 ${ms(value.frames.p95)} · max ${ms(value.frames.max)} · ${value.frames.dropped} dropped  ${sparkline(value.frames.history)}`,
  );
  if (frames.cells) console.log(`         ${frames.cells}`, ...frames.styles);
  console.log(
    `main     ${value.loaf.count} long frames · ${ms(value.loaf.total)} · max ${ms(value.loaf.max)} · style+layout ${ms(value.loaf.render)} · ${value.errors} errors · heap ${value.heap === null ? "—" : size(value.heap)}`,
  );
  if (value.loaf.scripts.length || value.loaf.forced) {
    const scripts = value.loaf.scripts
      .map((script) => `${script.source} ${ms(script.ms)} · ${script.frames}`)
      .join(" · ");
    const invokers = value.loaf.invokers.map((x) => `${x.name} ${x.count}`).join(" · ");
    console.log(
      `scripts  ${scripts}${invokers ? ` — ${invokers}` : ""}${value.loaf.forced ? ` · forced layout ${ms(value.loaf.forced)}` : ""}`,
    );
  }
  const edit = value.sheet.edits.at(-1);
  if (edit) {
    const before = value.sheet.edits.at(-2);
    const change = before ? edit.bytes - before.bytes : 0;
    const growth =
      before === undefined
        ? "the first measurement"
        : change === 0
          ? "±0 B"
          : `${change > 0 ? "+" : "−"}${size(Math.abs(change))} on ${edit.file || "the page"}`;
    console.log(
      `sheet    ${size(edit.bytes)} · ${growth} · ${value.sheet.edits.length} load${value.sheet.edits.length === 1 ? "" : "s"} · ${size(Math.round(edit.bytes / Math.max(1, edit.classes)))} a class  ${sparkline(value.sheet.edits.map((e) => e.bytes))}`,
    );
  }
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
  if (value.loads.length) {
    const blocking = value.loads.filter((sheet) => sheet.blocking === true).length;
    const last = Math.max(...value.loads.map((sheet) => sheet.end));
    const top = value.loads.reduce((a, b) => (b.end - b.start > a.end - a.start ? b : a));
    console.log(
      `load     ${value.loads.length} sheet${value.loads.length === 1 ? "" : "s"} · ${blocking} render-blocking · ${ms(last)} to last · ${top.name} ${ms(top.end - top.start)}${top.bytes ? ` (${size(top.bytes)})` : ""}`,
    );
  }
  if (value.cost && value.cost.calls) {
    const top = value.cost.rows[0];
    console.log(
      `cost     ${size(value.cost.total)} over ${value.cost.calls} calls${top ? ` · ${short(top.file)}:${top.line} ${size(top.bytes)} (${top.classes} classes, ${top.used} used)` : ""}`,
    );
  }
  const series = value.history;
  if (series.length) {
    const current = series.at(-1)!;
    const previous = series.length > 1 ? series.at(-2) : undefined;
    const same = previous && previous.path === current.path ? previous : undefined;
    console.log(
      `history  ${series.length} load${series.length === 1 ? "" : "s"}${same ? ` · LCP ${ms(current.lcp)}${delta(current.lcp, same.lcp)}${delta(current.bytes, same.bytes, "b")}` : ""}  ${sparkline(series.map((load) => load.lcp ?? 0))}`,
    );
  }
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

/** Forget the history and the sheet's measurements (a fresh series, without a reload). */
export const reset = (): void => {
  clear();
  edits.length = 0;
  recorded = false;
};

export const stop = (): void => {
  cancelAnimationFrame(loop);
  loop = 0;
  last = 0;
};

// The console's way in. A page that imports this module (or the dev server's overlay) gets the same function it imports.
(globalThis as typeof globalThis & { vitals?: typeof vitals }).vitals ??= vitals;
