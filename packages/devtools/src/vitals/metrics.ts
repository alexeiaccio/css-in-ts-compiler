// The five Core Web Vitals, measured by web-vitals (Google, MIT). The library is the reference implementation, and it gets
// two parts a hand-rolled observer gets wrong: CLS is the largest *session window* of shifts, not the sum of them, and INP
// is the ~98th percentile of interactions, not the worst one. It also names the culprit — the LCP element and its render
// delay, the interaction's target with input / processing / presentation, and the long animation frames and scripts it
// covered — which is the whole of an INP report.
//
// It is the same browser APIs we would call, so it adds no data, and no metrics a browser cannot measure: CLS is Chromium
// only (layout-shift), the other four come from Chromium, Firefox and Safari. `reportAllChanges` matters here: by default
// LCP, CLS and INP are reported when the page is hidden, and a console wants the value now.
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals/attribution";

type ReportOf<T> = T extends (report: (metric: infer M) => void, ...rest: never[]) => void
  ? M
  : never;
type FCP = ReportOf<typeof onFCP>;
type LCP = ReportOf<typeof onLCP>;
type CLS = ReportOf<typeof onCLS>;
type INP = ReportOf<typeof onINP>;
type TTFB = ReportOf<typeof onTTFB>;

export interface Measured {
  fcp?: FCP | undefined;
  lcp?: LCP | undefined;
  cls?: CLS | undefined;
  inp?: INP | undefined;
  ttfb?: TTFB | undefined;
}

const state: Measured = {};
let started = false;

/** Subscribe to the five metrics, once: the latest value of each is kept as it improves. */
export const measure = (): void => {
  if (started) return;
  started = true;
  onFCP((metric) => (state.fcp = metric), { reportAllChanges: true });
  onLCP((metric) => (state.lcp = metric), { reportAllChanges: true });
  onCLS((metric) => (state.cls = metric), { reportAllChanges: true });
  onINP((metric) => (state.inp = metric), { reportAllChanges: true, durationThreshold: 16 });
  onTTFB((metric) => (state.ttfb = metric), { reportAllChanges: true });
};

// The latest metrics: call `measure()` first, and give the browser a task to deliver the buffered ones.
export const measured = (): Measured => state;
