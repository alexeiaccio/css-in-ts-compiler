// The figure spec, in the shape glyph-kit defines (skills/glyph-kit/reference/spec.md, MIT: the format, not its code):
// one JSON object per figure — `kind`, `title`, `intent`, `source`, `data`, `options`, `focus` — with sixteen kinds here
// (`barChart`, `branchFlow`, `compare`, `contrast`, `easing`, `flow`, `frameStrip`, `funnel`, `journeyMap`, `motionTiming`,
// `palette`, `spacingScale`, `stagger`, `stateMachine`, `tree`, `typeScale`) where the kit has thirty-four. `check`
// returns **every** problem as a sentence, in
// the kit's voice, because a spec is refused before a frame is declared; `parse` is the same check over a file's text.
// No dependency: plain TypeScript over JSON.
//
// What is checked **here** is the spec as a whole, whatever its kind:
//   — a spec is one object whose `kind` this repository has; the sentence an unknown one is refused with is the
//     registry's own list, alphabetical (`unknown kind "pieChart": the ones here are barChart, compare, …`);
//   — numbers without a source ("These numbers need a source: where did they come from?");
//   — `options.width`, when a kind takes one: a whole number of cells above zero;
//   — a focus naming something the figure does not draw ("Focus names "M2", which isn't in the figure. Use a row label
//     or a column heading as it is drawn."), and a tone that is not one of the three.
//
// A kind's own data rule — the funnel's "a funnel never grows", a branch's `no`, the path's transitions, the tree's one
// root, a journey's range, the palette's direction, a pair's ratio against its own colours, a scale that grows — is in
// the file that draws it, beside its layout: `./kinds/metrics.ts`, `./kinds/flows.ts`, `./kinds/structure.ts`,
// `./kinds/systems.ts` and `./kinds/motion.ts`, reached through `./registry.ts` (`./kinds.ts` is the door and loads all
// five). One file to a kind's area is what makes the next kind cheap: a layout, a check and one `register`, and no other
// kind's file is opened. So a sentence here that is about one kind's data belongs there, and a sentence about every spec
// stays here.
//
// The contrast pair's `ratio` is a number in the data, and it is the **engine's** — packages/cssints/src/color.ts's
// `luminance`/`ratio`, which `solid/specs/from-tokens.ts` writes the spec with. The contrast kind's own check recomputes
// it through ./contrast.ts (WCAG's formula, no dependency: see its header for why a copy is here and how figure.test.ts
// holds it to the engine).

// the kinds' own layouts and checks: importing the door registers every area (see the header)
import "./kinds.ts";

import { isObject, labelOf, number, rowsOf, say } from "./kinds/shared.ts";
import { checkOf, entryOf, kinds, namesOf } from "./registry.ts";

// The kinds' **types**: glyph-kit has thirty-four, and these are the twelve this repository draws, and no more. The
// runtime list is the registry's (`kinds()` in ./registry.ts, alphabetical), and figure-registry.test.ts holds this
// list, the registry and native/docs/map.md together — so a kind added here without its area file fails there.
export const KINDS = [
  "barChart",
  "branchFlow",
  "compare",
  "contrast",
  "flow",
  "funnel",
  "journeyMap",
  "palette",
  "spacingScale",
  "stateMachine",
  "tree",
  "typeScale",
  "easing",
  "frameStrip",
  "motionTiming",
  "stagger",
] as const;
export type Kind = (typeof KINDS)[number];

/** The three tones of a focus: the role the figure paints it by, never a colour. */
export const TONES = ["problem", "good", "plain"] as const;
export type Tone = (typeof TONES)[number];

/** What the figure wants a reader to look at; `on` names things as they are drawn. */
export interface Focus {
  on: string | readonly string[];
  tone?: Tone;
  say?: string;
}

export interface BarRow {
  label: string;
  value: number;
  /** The number as it should read; absent, the value is formatted (with "+" past `options.max`). */
  text?: string;
}

export interface CompareRow {
  label: string;
  a: number;
  aText?: string;
  b: number;
  bText?: string;
}

interface Base {
  title?: string;
  intent?: string;
  /** Where the numbers came from: required whenever the data holds one. */
  source?: string;
  focus?: Focus;
}

export interface BarChartSpec extends Base {
  kind: "barChart";
  data: readonly BarRow[];
  options?: { width?: number; max?: number };
}

export interface CompareSpec extends Base {
  kind: "compare";
  data: readonly CompareRow[];
  options?: { width?: number; headers?: readonly string[] };
}

export interface FlowSpec extends Base {
  kind: "flow";
  data: readonly string[];
  options?: { width?: number };
}

export interface FunnelSpec extends Base {
  kind: "funnel";
  data: readonly BarRow[];
  options?: { width?: number };
}

/** A decision's branch: the box drawn to its right, and the step (or "end") it goes to next. */
export interface Branch {
  label: string;
  /** A step's label in the same list, or "end" to finish the flow there. */
  to: string;
}

/** A step of a branch flow: a plain `{ label }`, or a decision with its `no` branch. */
export interface BranchStep {
  label: string;
  type?: "decision";
  no?: Branch;
}

export interface BranchFlowSpec extends Base {
  kind: "branchFlow";
  data: readonly BranchStep[];
  options?: { width?: number };
}

/** One transition: a state, the state it goes to, and the event (`on`) that takes it there. */
export interface Transition {
  from: string;
  to: string;
  on: string;
}

export interface StateMachineData {
  states: readonly string[];
  transitions: readonly Transition[];
}

export interface StateMachineSpec extends Base {
  kind: "stateMachine";
  data: StateMachineData;
  /** `path` is the walk the figure draws, one state a box; it must start at `states[0]`. */
  options?: { width?: number; path?: readonly string[] };
}

/** One stage of a journey: what people did, what they thought, and how it felt (-2 bad to 2 great, the kit's scale). */
export interface Stage {
  label: string;
  doing?: string;
  thinking?: string;
  feeling: number;
}

export interface JourneyMapSpec extends Base {
  kind: "journeyMap";
  data: readonly Stage[];
  /** `width` is the feeling bar's track, in cells. */
  options?: { width?: number };
}

/** A node of a tree: glyph-kit's nested shape, or a name and its parent's name in a flat list. */
export interface TreeNode {
  name: string;
  children?: readonly TreeNode[];
  /** The flat list's link upward: a node without one is the root. */
  parent?: string;
}

export interface TreeSpec extends Base {
  kind: "tree";
  /** glyph-kit's nested `{ name, children }`, or a parent/child list with one node above the rest. */
  data: TreeNode | readonly TreeNode[];
  options?: { width?: number };
}

/** One step of a hue: the name a scale gives it (`50`, `1`, `0`) and its colour. */
export interface PaletteStep {
  name: string;
  /** `#rrggbb`, the palette's own data — a swatch is the one thing a figure draws as itself. */
  value: string;
}

/** A hue and its steps, from the lightest to the darkest (or the other way: a scale holds one direction). */
export interface PaletteHue {
  name: string;
  steps: readonly PaletteStep[];
}

/** glyph-kit's palette: the hues, each a tonal scale, against the page they are read on. */
export interface PaletteData {
  /** The page the steps are measured on; `#ffffff` when the data does not say. */
  page?: string;
  hues: readonly PaletteHue[];
}

export interface PaletteSpec extends Base {
  kind: "palette";
  data: PaletteData;
}

/**
 * One pair of the colour roles: the text's colour, the page under it, the WCAG floor it is held to, and the ratio of the
 * two, to two places. `ratio` is the engine's number (packages/cssints/src/color.ts), written by
 * `solid/specs/from-tokens.ts`; `check` recomputes it and refuses a pair whose colours do not make it.
 */
export interface ContrastPair {
  label: string;
  fg: string;
  bg: string;
  /** 3, 4.5 or 7: WCAG's three floors (graphics, body text, AAA). */
  min: number;
  ratio: number;
}

export interface ContrastSpec extends Base {
  kind: "contrast";
  data: readonly ContrastPair[];
}

/** One step of a spacing scale: its token's name and its length in pixels. */
export interface SpacingStep {
  name: string;
  value: number;
}

export interface SpacingSpec extends Base {
  kind: "spacingScale";
  data: readonly SpacingStep[];
}

/** One step of a type scale: its token's name, its size and its line height, in pixels. */
export interface TypeStep {
  name: string;
  size: number;
  lineHeight: number;
}

export interface TypeScaleSpec extends Base {
  kind: "typeScale";
  data: readonly TypeStep[];
}

/**
 * What a motion is, in the terms `solid/src/motion.ts` takes: a spring's class and its `(duration, bounce)` in
 * milliseconds, or a fling's velocity in px/s. The spec stores milliseconds because a figure's rows are read in them;
 * the solver is handed seconds (its own unit).
 */
export type MotionClass =
  | { readonly kind: "spatial"; readonly duration: number; readonly bounce: number }
  | { readonly kind: "effect"; readonly duration: number }
  | { readonly kind: "decay"; readonly velocity: number };

/** One instant of a track: when (`ms` from its start) and where (`Track.at`'s x, in px). */
export interface MotionSample {
  readonly ms: number;
  readonly value: number;
}

/** One track of a `motionTiming` figure: its spring, its range and the samples it takes. */
export interface MotionTrack {
  readonly label: string;
  readonly start: number;
  readonly target: number;
  readonly motion: MotionClass;
  readonly samples: readonly MotionSample[];
}

export interface MotionTimingSpec extends Base {
  kind: "motionTiming";
  data: { readonly tracks: readonly MotionTrack[] };
  options?: { readonly width?: number };
}

/** One curve of an `easing` figure: a spring reaching the same target, sampled. */
export interface EasingCurve {
  readonly label: string;
  readonly start: number;
  readonly target: number;
  readonly motion: MotionClass;
  readonly samples: readonly MotionSample[];
}

export interface EasingSpec extends Base {
  kind: "easing";
  data: { readonly curves: readonly EasingCurve[] };
  options?: { readonly width?: number; readonly rows?: number };
}

/** One element of a stagger: the delay before it starts and how long it takes, in ms. */
export interface StaggerItem {
  readonly label: string;
  readonly delay: number;
  readonly duration: number;
}

export interface StaggerSpec extends Base {
  kind: "stagger";
  data: { readonly items: readonly StaggerItem[] };
  options?: { readonly width?: number };
}

/** One frame of a strip: the instant and the box's position, in px. */
export interface StripFrame {
  readonly ms: number;
  readonly value: number;
}

/** One strip of a `frameStrip` figure: the motion and the frames it is shown at. A spring's range ends at `target`; a
 *  fling's at `decay(...).project()`, which is why `target` is absent for one. */
export interface FrameStrip {
  readonly label: string;
  readonly start: number;
  readonly target?: number;
  readonly motion: MotionClass;
  readonly frames: readonly StripFrame[];
}

export interface FrameStripSpec extends Base {
  kind: "frameStrip";
  data: { readonly strips: readonly FrameStrip[] };
  options?: { readonly width?: number };
}

export type Spec =
  | BarChartSpec
  | BranchFlowSpec
  | CompareSpec
  | ContrastSpec
  | FlowSpec
  | FunnelSpec
  | JourneyMapSpec
  | PaletteSpec
  | SpacingSpec
  | StateMachineSpec
  | TreeSpec
  | TypeScaleSpec
  | EasingSpec
  | FrameStripSpec
  | MotionTimingSpec
  | StaggerSpec;

/** Does the data hold a number anywhere? A spec with numbers needs a source, as the kit's guard refuses without one. */
function hasNumbers(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.some(hasNumbers);
  if (isObject(value)) return Object.values(value).some(hasNumbers);
  return false;
}
const widthProblem = (options: unknown): string[] => {
  const width = isObject(options) ? options.width : undefined;
  if (width === undefined) return [];
  const n = number(width);
  return n !== undefined && Number.isInteger(n) && n > 0
    ? []
    : [`options.width must be a whole number of cells above zero: it is ${say(width)}.`];
};

/** The kit's focus checks: `on` is required, a tone is one of three, and every name is drawn. */
function focusProblems(focus: unknown, names: readonly string[]): string[] {
  if (focus === undefined || focus === null) return [];
  if (!isObject(focus)) return ['Write focus as { "on": ["a label or heading"], "tone": "problem", "say": "what to see" }.'];
  const raw = focus.on;
  const on =
    typeof raw === "string" ? [raw] : Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  const out: string[] = [];
  if (!on.length) out.push('Focus needs "on": the row labels or column headings to look at, as they are drawn.');
  if (focus.tone !== undefined && !(TONES as readonly unknown[]).includes(focus.tone))
    out.push(`Focus tone is problem, good or plain, not ${say(focus.tone)}.`);
  const missing = on.filter((name) => !names.includes(name));
  if (missing.length)
    out.push(
      `Focus names ${missing.map((m) => `"${m}"`).join(", ")}, which ${missing.length === 1 ? "isn't" : "aren't"} in ` +
        `the figure. Use a row label or a column heading as it is drawn.`,
    );
  return out;
}

/**
 * Every problem with a spec, in plain sentences: the kind, the numbers' source, the kind's own data rule (which its area
 * file checks), and the focus's names. An empty array is a figure that can be drawn.
 */
export function check(input: unknown): string[] {
  if (!isObject(input))
    return ['A spec is one JSON object: kind, data, and a source when there are numbers on the figure.'];
  const kind = input.kind;
  if (typeof kind !== "string" || !entryOf(kind))
    return [`unknown kind ${say(kind)}: the ones here are ${kinds().join(", ")}.`];
  const problems: string[] = [];
  if (hasNumbers(input.data) && !String(input.source ?? "").trim())
    problems.push("These numbers need a source: where did they come from?");
  problems.push(...widthProblem(input.options));
  problems.push(...checkOf(kind, input.data, input.options));
  // a kind's own names when the data's row labels are not what a focus may point at; its rows otherwise
  const names = namesOf(kind, input.data, input.options) ?? rowsOf(input.data).map((row, i) => labelOf(row, i));
  problems.push(...focusProblems(input.focus, names));
  return problems;
}

/** A spec file's text as a checked spec, or the sentences that refuse it. */
export function parse(text: string): { spec?: Spec; problems: string[] } {
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch (error) {
    return { problems: [`This spec is not JSON: ${error instanceof Error ? error.message : String(error)}`] };
  }
  const problems = check(input);
  return problems.length ? { problems } : { spec: input as unknown as Spec, problems };
}