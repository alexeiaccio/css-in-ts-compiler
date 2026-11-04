// The motion area, one file for its four kinds — their layout and their own refusals side by side, as the other areas.
//
//   motionTiming  a track's samples: a bar a sample from the start to the target, its position printed, the settle marked
//   easing        a curve a block: one dot a sample on a grid of instants across and values down, with its v=0/peak note
//   stagger       an item a row: its delay as an indent and its span as a bar, and the total under them
//   frameStrip    a frame a row: the box at its offset in cells, one row a step in time (glyph-kit's filmstrip)
//
// **The data is the solver's.** `solid/src/motion.ts` is the model this repository animates with (the Sky feed's entry and
// scroll, the Dialog's panel and menu), so a motion figure is the trajectory that model really takes: `solid/specs/
// from-motion.ts` runs the clock at 1/60 and writes the samples with `track(...).at(t)` and `decay(...).at(t)` into the
// four specs, and `solid/test.sh` regenerates them and `cmp`s. So nothing here types a position: the layout prints what
// the data holds, and the check re-runs the solver from the same parameters and refuses a sample that is not the model's
// ("frame 3 is at 50ms and 152.31px, but spatial(0.22, 0.1) from 149.88 to 163.88 is at 156.07px then").
//
// **What came from glyph-kit** (skills/glyph-kit/reference/areas/motion.md, MIT: the shape, not its code): `motionTiming`
// is its "a bar a row against a fixed duration scale", `easing` its "speed column" read as a curve, `stagger` its "an
// indent a delay and a bar a span", and `frameStrip` its **filmstrip** — a row a frame, equal slices of time, a mark at
// the box's offset ("bunched marks mean slow movement"). `easing` takes the `easingTable`'s curve and drops its table; the
// kit's other two types, `intentCard` and `transitionSpec`, are not here.
//
// **What changed, and why.** The kit's figures are drawn in characters; ours are cells a target draws as geometry, so a
// sample is a cell rather than a glyph (a dot on the easing grid, a bar's whole cell in a timing row) and the numbers stay
// text. The kit's durations are typed; ours are `motion.ts`'s own springs, in `(duration, bounce)` — a `spatial` may
// overshoot, an `effect` is clamped, a fling is a `decay` — so a figure can say "this one is slower" and be right. Two
// things the kit stamps are left out: its SAMPLE DATA line and its `label`.
//
// The two rules a cell imposes are stated where they bite: the easing grid rounds a sample to a value row (half a level at
// most), and a strip's dot snaps to the cell its offset falls in (half a cell at most).
import { decay, effect, spatial, track } from "../../motion.ts";
import {
  finish,
  isObject,
  labelOf,
  longest,
  number,
  rowsOf,
  say,
  textItem,
} from "./shared.ts";
import type { Bar, Item, Layout, LayoutLine, Paint } from "../registry.ts";
import { register } from "../registry.ts";
import type {
  EasingCurve,
  EasingSpec,
  FrameStripSpec,
  MotionClass,
  MotionTimingSpec,
  StaggerSpec,
} from "../spec.ts";

// ---- the solver, read on this side ---------------------------------------------------------------------------------

/** The solver's unit is the second and the figure's is the millisecond (a row is read in ms). */
const seconds = (ms: number): number => ms / 1000;

/** A number as the figure prints it: two places, the one the README's measured lists are written at. */
export const shownValue = (value: number): string => value.toFixed(2);

/** The class as the figure names it: `spatial(0.22, 0.1)`, `effect(0.22)`, `decay(87.03 px/s)`. */
export function motionName(motion: MotionClass): string {
  if (motion.kind === "decay") return `decay(${shownValue(motion.velocity)} px/s)`;
  if (motion.kind === "effect") return `effect(${seconds(motion.duration)})`;
  return `spatial(${seconds(motion.duration)}, ${motion.bounce})`;
}

/** The spring a class names, from `motion.ts`'s two constructors. */
const springOf = (motion: MotionClass) =>
  motion.kind === "effect" ? effect(seconds(motion.duration)) : spatial(seconds(motion.duration), motion.bounce);

/** A spring track from rest at `start` towards `target`: the same segment `retarget` makes, without the flag
 *  `retarget` consults (reduced motion is a host's, and a figure is not a frame). */
function trackOf(motion: MotionClass, start: number, target: number) {
  const t = track(start, springOf(motion));
  t.target = target;
  return t;
}

/** Where the motion is at `ms`: `Track.at`'s x, or the fling's decay. The one call the check re-runs. */
export function presentAt(motion: MotionClass, start: number, target: number, ms: number): number {
  if (motion.kind === "decay") return decay(start, motion.velocity).at(seconds(ms)).x;
  return trackOf(motion, start, target).at(seconds(ms)).x;
}

/** Where a fling lands: `decay.project()`. A spring's range ends at its target. */
export const landingOf = (motion: MotionClass, start: number, target: number): number =>
  motion.kind === "decay" ? decay(start, motion.velocity).project() : target;

// ---- the layout's own cells ----------------------------------------------------------------------------------------

const cellsOf = (line: LayoutLine): number => line.items.reduce((n, item) => n + item.cells, 0);

/** The two columns a sample row shares: the instant on the left, the value on the right. */
const timeWidth = (samples: readonly { ms: number }[]): number =>
  longest(samples.map((sample) => `${sample.ms}ms`)) + 1;

/** A gap, or nothing at all (a zero-cell item is a box Clay need not be given). */
const gap = (id: string, cells: number, paint: Paint = "ink"): Item[] =>
  cells > 0 ? [{ kind: "space", id, cells, paint }] : [];

/** A one-cell mark (a `marker` on a pixel target, `▲` in the text half) after `cells` of gap. */
const dot = (id: string, cells: number, paint: Paint): Item[] => [
  ...gap(`${id}-gap`, cells),
  { kind: "marker", id, cells: 1, paint },
];

// ---- motionTiming --------------------------------------------------------------------------------------------------

/**
 * A track's timing: its spring's name and range above, then a row a sample — the instant, a bar of the distance it has
 * covered of its travel (start -> target), the position in px — and the row the solver calls settled marked in the `good`
 * role and with the word, so the end of the motion is on the figure and not inferred from the last row.
 */
function motionTiming(spec: MotionTimingSpec): Layout {
  const width = spec.options?.width ?? 24;
  const tracks = spec.data.tracks;
  const labelWidth = Math.max(...tracks.map((tr) => timeWidth(tr.samples)));
  const textWidth = Math.max(...tracks.map((tr) => longest(tr.samples.map((sample) => shownValue(sample.value))))) + 2;
  const lines: LayoutLine[] = [];
  const bars: Bar[] = [];
  const labels: Layout["labels"] = [];
  let index = 0;
  tracks.forEach((tr, t) => {
    const head = `${tr.label} · ${motionName(tr.motion)} · ${shownValue(tr.start)} -> ${shownValue(tr.target)} px`;
    lines.push({ items: [textItem(`fig-head-${t}`, head, [...head].length, "ink")] });
    for (const sample of tr.samples) {
      const travel = tr.target - tr.start;
      const progress = travel === 0 ? 1 : (sample.value - tr.start) / travel;
      const fill = Math.round(width * Math.max(0, Math.min(1, progress)));
      const settled = sample.value === tr.target;
      const paint = settled ? "good" : "ink";
      const time = `${sample.ms}ms`;
      const text = shownValue(sample.value);
      bars.push({
        fillId: `fig-fill-${index}`,
        trackId: `fig-track-${index}`,
        textId: `fig-num-${index}`,
        label: time,
        value: Math.max(0, Math.min(1, progress)),
        max: 1,
        fill,
        track: width,
        text,
      });
      labels.push({ textId: `fig-label-${index}`, text: time });
      lines.push({
        items: [
          textItem(`fig-label-${index}`, time, labelWidth, "muted"),
          { kind: "bar", id: `fig-track-${index}`, fillId: `fig-fill-${index}`, cells: width, fill, paint },
          textItem(`fig-num-${index}`, text, textWidth, paint),
          ...(settled ? [textItem(`fig-settled-${index}`, " settled", 9, "good")] : []),
        ],
      });
      index++;
    }
    const end = tr.samples[tr.samples.length - 1];
    const note =
      end && end.value === tr.target
        ? `settled at ${end.ms}ms: ${shownValue(tr.target)} px is the target`
        : `still moving at ${end?.ms ?? 0}ms`;
    lines.push({ items: [textItem(`fig-foot-${t}`, note, Math.max(labelWidth + width + textWidth, [...note].length), "muted")] });
  });
  return finish(spec, "motionTiming", Math.max(...lines.map(cellsOf)), lines, bars, labels);
}

// ---- easing --------------------------------------------------------------------------------------------------------

/** The note a curve carries: where its velocity is zero, and how far it went past the target. Read from the samples. */
function noteOf(curve: EasingCurve): string {
  const settled = curve.samples.filter((sample) => sample.value === curve.target).map((sample) => sample.ms);
  const sign = Math.sign(curve.target - curve.start) || 1;
  let peak = 0;
  let peakMs = 0;
  for (const sample of curve.samples) {
    const over = (sample.value - curve.target) * sign;
    if (over > peak) (peak = over), (peakMs = sample.ms);
  }
  const rest =
    settled.length === 0
      ? `, still moving at the last sample`
      : ` and ${settled[settled.length - 1]}ms`;
  const beyond =
    peak > 0
      ? `; peak +${shownValue(peak)}px at ${peakMs}ms`
      : curve.motion.kind === "effect"
        ? "; clamped, never past the target"
        : "; never past the target";
  return `v = 0 at 0ms${rest}${beyond}`;
}

/**
 * The curve itself: one block a curve, a dot a sample on a grid whose columns are the instants (two cells a sample, so a
 * step is visible) and whose rows are the values (the top row is the highest value any curve reaches, so two curves are
 * read on one scale). The gutter is the value axis (a level's px), the block's foot its instants and its `v = 0`/peak
 * note, and the start and the end are the grid's first column and the last sample.
 */
function easing(spec: EasingSpec): Layout {
  const rows = spec.options?.rows ?? 7;
  const curves = spec.data.curves;
  const values = curves.flatMap((curve) => [curve.start, curve.target, ...curve.samples.map((s) => s.value)]);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const columns = Math.max(...curves.map((curve) => 2 * Math.max(1, curve.samples.length - 1) + 1));
  const levelsOf = (row: number): number => (hi === lo ? hi : hi - (row * (hi - lo)) / (rows - 1));
  const gutter = Math.max(4, ...Array.from({ length: rows }, (_, row) => shownValue(levelsOf(row)).length + 1));
  const levelOf = (value: number): number =>
    hi === lo ? rows - 1 : Math.round(((hi - value) / (hi - lo)) * (rows - 1));
  const lines: LayoutLine[] = [];
  const labels: Layout["labels"] = [];
  curves.forEach((curve, c) => {
    const head = `${curve.label} · ${motionName(curve.motion)} · ${shownValue(curve.start)} -> ${shownValue(curve.target)} px`;
    lines.push({ items: [textItem(`fig-head-${c}`, head, [...head].length, "ink")] });
    // a row a value level, the samples at that level in their columns: one dot a sample, two cells apart
    const levels = new Map<number, number[]>();
    curve.samples.forEach((sample, i) => {
      const level = levelOf(sample.value);
      const at = levels.get(level);
      if (at) at.push(2 * i);
      else levels.set(level, [2 * i]);
    });
    for (let row = 0; row < rows; row++) {
      // the gutter is the value axis: a level's own px, so every row reads on its own and none is blank
      const items: Item[] = [textItem(`fig-edge-${c}-${row}`, shownValue(levelsOf(row)), gutter, "muted")];
      let x = 0;
      for (const column of (levels.get(row) ?? []).sort((a, b) => a - b)) {
        items.push(...gap(`fig-gap-${c}-${row}-${column}`, column - x));
        items.push({ kind: "marker", id: `fig-dot-${c}-${row}-${column}`, cells: 1, paint: "ink" });
        x = column + 1;
      }
      items.push(...gap(`fig-pad-${c}-${row}`, columns - x));
      lines.push({ items });
    }
    // the instants under the plot: its first column and the curve's last sample
    const end = `${curve.samples[curve.samples.length - 1]?.ms ?? 0}ms`;
    lines.push({
      items: [
        ...gap(`fig-scale-gap-${c}`, gutter),
        textItem(`fig-scale-first-${c}`, "0ms", 4, "muted"),
        ...gap(`fig-scale-space-${c}`, Math.max(0, columns - 4 - [...end].length)),
        textItem(`fig-scale-last-${c}`, end, [...end].length, "muted"),
      ],
    });
    const note = noteOf(curve);
    lines.push({ items: [textItem(`fig-note-${c}`, note, Math.max(gutter + columns, [...note].length), "muted")] });
    labels.push({ textId: `fig-head-${c}`, text: curve.label });
  });
  return finish(spec, "easing", Math.max(...lines.map(cellsOf)), lines, [], labels);
}

// ---- stagger -------------------------------------------------------------------------------------------------------

/**
 * Elements entering in sequence: an item a row, its delay an indent and its span a bar of the same scale (the cells of
 * the whole run), its range printed, the scale under the rows and the total under that. The scale is the items' own
 * latest end, so an indent that is invisible is an item that really does not wait.
 */
function stagger(spec: StaggerSpec): Layout {
  const width = spec.options?.width ?? 16;
  const items = spec.data.items;
  const done = Math.max(...items.map((item) => item.delay + item.duration));
  const perCell = done > 0 ? done / width : 1;
  const labelWidth = longest(items.map((item) => item.label)) + 1;
  const ranges = items.map((item) => `${item.delay}-${item.delay + item.duration}ms`);
  const textWidth = longest(ranges) + 1;
  const bars: Bar[] = [];
  const labels: Layout["labels"] = [];
  const lines: LayoutLine[] = items.map((item, i) => {
    const indent = Math.max(0, Math.round(item.delay / perCell));
    const span = Math.max(1, Math.round(item.duration / perCell));
    const paint = "ink";
    bars.push({
      fillId: `fig-fill-${i}`,
      trackId: `fig-track-${i}`,
      textId: `fig-num-${i}`,
      label: item.label,
      value: item.duration,
      max: item.duration,
      fill: span,
      track: span,
      text: ranges[i]!,
    });
    labels.push({ textId: `fig-label-${i}`, text: item.label });
    return {
      items: [
        textItem(`fig-label-${i}`, item.label, labelWidth, paint),
        ...gap(`fig-delay-${i}`, indent),
        { kind: "bar", id: `fig-track-${i}`, fillId: `fig-fill-${i}`, cells: span, fill: span, paint },
        textItem(`fig-num-${i}`, ranges[i]!, textWidth, paint),
      ] satisfies Item[],
    };
  });
  // the run's scale: 0 at the plot's left, its end at the plot's right
  const last = `${done}ms`;
  lines.push({
    items: [
      ...gap("fig-scale-gap", labelWidth),
      textItem("fig-scale-first", "0ms", 4, "muted"),
      ...gap("fig-scale-space", Math.max(0, width - 4 - [...last].length)),
      textItem("fig-scale-last", last, [...last].length, "muted"),
    ],
  });
  // the total, in the kit's own sentence: "5 × 200ms, delays follow ease-out. Done at 440ms."
  const steps = items.map((item) => item.delay);
  const uniform =
    items.length > 1 &&
    items[0]!.duration === items[items.length - 1]!.duration &&
    steps.every((delay, i) => i === 0 || delay - steps[i - 1]! === steps[1]! - steps[0]!);
  const total = uniform
    ? `${items.length} × ${items[0]!.duration}ms, ${steps[1]! - steps[0]!}ms apart. Done at ${done}ms.`
    : `${items.length} items, delays ${steps.join(", ")}ms, ${done}ms the last end.`;
  lines.push({ items: [textItem("fig-total", total, Math.max(...lines.map(cellsOf), [...total].length), "muted")] });
  return finish(spec, "stagger", Math.max(...lines.map(cellsOf)), lines, bars, labels);
}

// ---- frameStrip ----------------------------------------------------------------------------------------------------

/**
 * A strip of frames a step in time: a row a frame, the box at its offset in the strip's cells, the position printed. Each
 * strip is the range the motion covers — a spring's start..target, a fling's start..`project()` — so a row's dot says
 * where the box really is and two rows' dots say how fast it is going (bunched dots are a slow stretch).
 */
function frameStrip(spec: FrameStripSpec): Layout {
  const cells = spec.options?.width ?? 20;
  const strips = spec.data.strips;
  const timeWidth = longest(strips.flatMap((strip) => strip.frames.map((frame) => `${frame.ms}ms`))) + 1;
  const valueWidth = longest(strips.flatMap((strip) => strip.frames.map((frame) => shownValue(frame.value)))) + 1;
  const lines: LayoutLine[] = [];
  const labels: Layout["labels"] = [];
  strips.forEach((strip, s) => {
    const landing = landingOf(strip.motion, strip.start, strip.target ?? strip.start);
    const positions = [strip.start, landing, ...strip.frames.map((frame) => frame.value)];
    const lo = Math.min(...positions);
    const hi = Math.max(...positions);
    const head = `${strip.label} · ${motionName(strip.motion)} · ${shownValue(lo)} -> ${shownValue(hi)} px`;
    lines.push({ items: [textItem(`fig-head-${s}`, head, [...head].length, "ink")] });
    strip.frames.forEach((frame, i) => {
      const offset = hi === lo ? 0 : Math.round(((frame.value - lo) / (hi - lo)) * (cells - 1));
      const time = `${frame.ms}ms`;
      const text = shownValue(frame.value);
      labels.push({ textId: `fig-time-${s}-${i}`, text: time });
      lines.push({
        items: [
          textItem(`fig-time-${s}-${i}`, time, timeWidth, "muted"),
          ...dot(`fig-mark-${s}-${i}`, offset, "ink"),
          ...gap(`fig-after-${s}-${i}`, cells - offset),
          textItem(`fig-num-${s}-${i}`, text, valueWidth, "muted"),
        ],
      });
    });
  });
  return finish(spec, "frameStrip", Math.max(...lines.map(cellsOf)), lines, [], labels);
}

// ---- the refusals --------------------------------------------------------------------------------------------------

/** The rounding a sample is written at (two places), and the slack a comparison allows for it: 0.01 px. */
const EPS = 0.011;

/** The name a refusal speaks: the data's own label, or the row's place. */
const nameOf = (row: unknown, i: number): string =>
  isObject(row) && typeof row.label === "string" && row.label ? row.label : labelOf(row, i);

/** A motion class's own numbers: a spring's duration and bounce, a fling's velocity. */
function motionProblems(where: string, motion: unknown): string[] {
  if (!isObject(motion))
    return [
      `${where} needs its motion: { "kind": "spatial", "duration": 200, "bounce": 0 } — or "effect"'s duration, or a ` +
        `fling's { "kind": "decay", "velocity": 87.03 }.`,
    ];
  if (motion.kind === "decay") {
    const velocity = number(motion.velocity);
    return velocity === undefined || velocity === 0
      ? [`${where} has a fling of ${say(motion.velocity)} px/s: a fling needs a velocity.`]
      : [];
  }
  if (motion.kind !== "spatial" && motion.kind !== "effect")
    return [`${where}'s motion is spatial, effect or decay, not ${say(motion.kind)}.`];
  const out: string[] = [];
  const duration = number(motion.duration);
  if (duration === undefined || duration <= 0)
    out.push(
      `${where} has a duration of ${say(motion.duration)}ms: a spring's duration is above zero (ω = 2π / duration).`,
    );
  if (motion.kind === "spatial") {
    const bounce = number(motion.bounce);
    if (bounce === undefined || bounce < 0 || bounce > 1)
      out.push(`${where} has a bounce of ${say(motion.bounce)}: a bounce is between 0 and 1 (ζ = 1 - bounce).`);
  }
  return out;
}

/** A sample list's rule: two numbers a sample, and the instants go forward. */
function sampleProblems(where: string, samples: unknown): string[] {
  const list = rowsOf(samples);
  if (!list.length) return [`${where} needs its samples: [{ "ms": 0, "value": 149.88 }, ...], one a frame it was taken at.`];
  const out: string[] = [];
  let previous = -Infinity;
  list.forEach((sample, i) => {
    const ms = isObject(sample) ? number(sample.ms) : undefined;
    const value = isObject(sample) ? number(sample.value) : undefined;
    if (ms === undefined || value === undefined) {
      out.push(`${where}'s sample ${i + 1} needs ms and value: two numbers.`);
      return;
    }
    if (ms <= previous)
      out.push(
        `${where}'s sample ${i + 1} is at ${ms}ms, after sample ${i}'s ${previous}ms; a track's samples go forward in time.`,
      );
    previous = ms;
  });
  return out;
}

/** A timing figure: tracks of samples, each a spring's, and each ending where its track settles. */
function motionTimingProblems(data: unknown): string[] {
  const tracks = isObject(data) ? rowsOf(data.tracks) : [];
  if (!tracks.length)
    return [
      'A motion timing needs its tracks: [{ "label": "the panel, out", "start": 163.88, "target": 177.88, ' +
        '"motion": { "kind": "spatial", "duration": 200, "bounce": 0 }, "samples": [{ "ms": 0, "value": 163.88 }] }].',
    ];
  const out: string[] = [];
  tracks.forEach((row, i) => {
    const where = nameOf(row, i);
    if (!isObject(row) || number(row.start) === undefined || number(row.target) === undefined) {
      out.push(`${where} needs its start and its target: where the track begins and where it is going, in px.`);
      return;
    }
    out.push(...motionProblems(where, row.motion), ...sampleProblems(where, row.samples));
  });
  return out;
}

/** An easing figure: the same, and every curve ends where it is going. */
function easingProblems(data: unknown): string[] {
  const curves = isObject(data) ? rowsOf(data.curves) : [];
  if (!curves.length)
    return [
      'An easing figure needs its curves: [{ "label": "spatial(0.22, 0.1)", "start": 149.88, "target": 163.88, ' +
        '"motion": { "kind": "spatial", "duration": 220, "bounce": 0.1 }, "samples": [{ "ms": 0, "value": 149.88 }] }].',
    ];
  const out: string[] = [];
  curves.forEach((row, i) => {
    const where = nameOf(row, i);
    if (!isObject(row) || number(row.start) === undefined || number(row.target) === undefined) {
      out.push(`${where} needs its start and its target: where the curve begins and where it is going, in px.`);
      return;
    }
    out.push(...motionProblems(where, row.motion), ...sampleProblems(where, row.samples));
    const samples = rowsOf(row.samples);
    const end = samples[samples.length - 1];
    const value = isObject(end) ? number(end.value) : undefined;
    const target = number(row.target)!;
    if (value !== undefined && Math.abs(value - target) > EPS)
      out.push(
        `${where} ends at ${shownValue(value)}px, not its target ${shownValue(target)}px; a curve ends where it is going.`,
      );
  });
  return out;
}

/** A stagger: a delay and a duration a row, the delay never negative and the span above zero. */
function staggerProblems(data: unknown): string[] {
  const items = isObject(data) ? rowsOf(data.items) : [];
  if (!items.length)
    return ['A stagger needs its items: [{ "label": "card 1", "delay": 0, "duration": 300 }, ...], one an element.'];
  const out: string[] = [];
  items.forEach((row, i) => {
    const where = nameOf(row, i);
    const delay = isObject(row) ? number(row.delay) : undefined;
    const duration = isObject(row) ? number(row.duration) : undefined;
    if (delay === undefined || duration === undefined) {
      out.push(`${where} needs a delay and a duration: two numbers of ms.`);
      return;
    }
    if (delay < 0) out.push(`${where} has a delay of ${delay}ms: a delay is zero or more.`);
    if (duration <= 0) out.push(`${where} has a duration of ${duration}ms: an item's span is above zero.`);
  });
  return out;
}

/** A strip: the frames must be the solver's, re-run from the strip's own class and range. */
function frameStripProblems(data: unknown): string[] {
  const strips = isObject(data) ? rowsOf(data.strips) : [];
  if (!strips.length)
    return [
      'A frame strip needs its strips: [{ "label": "the panel\'s drop", "start": 149.88, "target": 163.88, ' +
        '"motion": { "kind": "spatial", "duration": 220, "bounce": 0.1 }, "frames": [{ "ms": 0, "value": 149.88 }] }].',
    ];
  const out: string[] = [];
  strips.forEach((row, i) => {
    const where = nameOf(row, i);
    if (!isObject(row) || number(row.start) === undefined) {
      out.push(`${where} needs its start: where the box is at 0ms.`);
      return;
    }
    const problems = motionProblems(where, row.motion);
    out.push(...problems);
    if (problems.length) return;
    const motion = row.motion as MotionClass;
    const start = number(row.start)!;
    const target = number(row.target) ?? start;
    const landing = landingOf(motion, start, target);
    const frames = rowsOf(row.frames);
    if (!frames.length) {
      out.push(`${where} needs its frames: [{ "ms": 0, "value": 149.88 }, ...], one a step in time.`);
      return;
    }
    frames.forEach((frame, n) => {
      const at = isObject(frame) ? number(frame.ms) : undefined;
      const value = isObject(frame) ? number(frame.value) : undefined;
      if (at === undefined || value === undefined) {
        out.push(`${where}'s frame ${n + 1} needs ms and value: two numbers.`);
        return;
      }
      const want = presentAt(motion, start, target, at);
      if (Math.abs(want - value) > EPS)
        out.push(
          `${where}'s frame ${n + 1} is at ${at}ms and ${shownValue(value)}px, but ${motionName(motion)} from ` +
            `${shownValue(start)} to ${shownValue(landing)} is at ${shownValue(want)}px then.`,
        );
    });
  });
  return out;
}

register("motionTiming", { layout: motionTiming, check: motionTimingProblems });
register("easing", { layout: easing, check: easingProblems });
register("stagger", { layout: stagger, check: staggerProblems });
register("frameStrip", { layout: frameStrip, check: frameStripProblems });
