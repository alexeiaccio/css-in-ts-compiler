// The stylesheets' own arrival: every `.css` in the resource timeline, how long it took and whether it held the paint.
// The bytes are on the sheet already; this is the other half — when they arrive, and which one delays FCP.
export interface SheetTiming {
  /** the file name (the URL's last segment) */
  name: string;
  start: number;
  /** ms from navigation start to the response's end */
  end: number;
  /** transferSize: 0 when the timing is hidden (a cross-origin sheet without Timing-Allow-Origin) */
  bytes: number;
  /** Chrome's renderBlockingStatus; a browser without it reports nothing, which is not "non-blocking" */
  blocking: boolean | null;
}

interface Timing extends PerformanceResourceTiming {
  renderBlockingStatus?: "blocking" | "non-blocking";
}

// The CSS resources of this page, in the order they started.
export const sheetTimings = (): SheetTiming[] =>
  (performance.getEntriesByType("resource") as Timing[])
    .filter((entry) => /\.css(\?|$)/.test(entry.name))
    .map((entry) => ({
      name: entry.name.split("/").at(-1)?.split("?")[0] ?? entry.name,
      start: entry.startTime,
      end: entry.responseEnd,
      bytes: entry.transferSize,
      blocking: entry.renderBlockingStatus
        ? entry.renderBlockingStatus === "blocking"
        : entry.renderBlockingStatus === "non-blocking"
          ? false
          : null,
    }))
    .sort((a, b) => a.start - b.start);
