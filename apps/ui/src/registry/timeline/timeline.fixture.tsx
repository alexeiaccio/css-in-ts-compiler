import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import type { TimelineRows, TimelineSpan } from "@cssints/headless";
import { createSignal } from "solid-js";

import { Timeline, type TimelineProps } from "./timeline.tsx";

/**
 * One checkout request as a trace: the root, the work it did in two branches, and the nested database call inside the
 * auth branch. The numbers are the request's own fraction of time, 0 to 1, so the bars read as shares of the whole.
 */
export const TIMELINE_SPANS: ReadonlyArray<TimelineSpan> = [
  { id: "request", label: "GET /checkout", start: 0, end: 1, depth: 0, status: "ok" },
  {
    id: "auth",
    label: "auth: verify session",
    start: 0.03,
    end: 0.26,
    depth: 1,
    status: "ok",
  },
  { id: "db", label: "db: SELECT cart", start: 0.08, end: 0.22, depth: 2, status: "error" },
  {
    id: "render",
    label: "render: checkout page",
    start: 0.55,
    end: 0.97,
    depth: 1,
    status: "unset",
  },
];

/** The trace is normalized: 1 is the whole request, so the ruler reads seconds of it. */
export const TIMELINE_UNIT = "s" as const;

/** The list's accessible name: the request this trace belongs to. */
export const TIMELINE_LABEL = "Checkout request";

/** The one sentence the demo says about its keys. */
export const TIMELINE_HINT =
  "Keys: ↑ and ↓ move between spans, Home and End jump to the ends, and Enter or Space selects one — the status line repeats the span and its share of the request.";

/** The span the demo starts with: the root, so the status line has a value before anyone clicks. */
export const TIMELINE_SELECTED = "request";

export interface TimelineExampleProps {
  readonly class?: string | undefined;
  /** The primitive, for a test or a page that reads it. */
  readonly onReady?: TimelineProps["onReady"];
}

/**
 * The starter in ordinary use: a trace with one nested span, the selected root painted, the ruler over the whole extent
 * and a sentence about the keys. A page copies this and swaps `TIMELINE_SPANS` for its own trace.
 */
export const TimelineExample = (props: TimelineExampleProps): JSX.Element => {
  const [selected, setSelected] = createSignal<string>(TIMELINE_SELECTED);
  return (
    <Timeline
      class={props.class}
      spans={TIMELINE_SPANS}
      unit={TIMELINE_UNIT}
      label={TIMELINE_LABEL}
      selected={selected()}
      onSelect={setSelected}
      hint={TIMELINE_HINT}
      onReady={props.onReady}
    />
  );
};

/** What a mounted demo hands the test: where it lives, the primitive, and a teardown. */
export interface MountedTimeline {
  readonly root: HTMLElement;
  readonly api: TimelineRows;
  readonly dispose: () => void;
}

/** The demo's width, so the track has the same room in every test run. */
const DEMO_WIDTH = 640;

/** Mounts the styled trace at a 640 px frame. The primitive owns the layout, the cursor and the selection. */
export const mountTimeline = (): MountedTimeline => {
  const root = document.createElement("div");
  root.style.width = `${DEMO_WIDTH}px`;
  document.body.append(root);
  let api: TimelineRows | undefined;
  const dispose = render(
    () => (
      <TimelineExample
        onReady={(timeline) => {
          api = timeline;
        }}
      />
    ),
    root,
  );
  if (api === undefined) {
    throw new Error("timeline fixture: the primitive did not mount");
  }
  return {
    root,
    api,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
