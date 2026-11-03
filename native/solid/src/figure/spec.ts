// The figure spec, in the shape glyph-kit defines (skills/glyph-kit/reference/spec.md, MIT: the format, not its code):
// one JSON object per figure — `kind`, `title`, `intent`, `source`, `data`, `options`, `focus` — with twelve kinds here
// (`barChart`, `branchFlow`, `compare`, `contrast`, `flow`, `funnel`, `journeyMap`, `palette`, `spacingScale`,
// `stateMachine`, `tree`, `typeScale`) where the kit has thirty-four. `check` returns
// **every** problem as a sentence, in the kit's voice, because a spec is refused before a frame is declared; `parse` is
// the same check over a file's text. No dependency: plain TypeScript over JSON.
//
// The ones ported from the kit's `guard.mjs` and `render/focus.mjs`, sentence and all:
//   — numbers without a source ("These numbers need a source: where did they come from?");
//   — a funnel that grows ("Signup 6100 is more than visited 12400; a funnel never grows");
//   — a focus naming something the figure does not draw ("Focus names "M2", which isn't in the figure. Use a row label
//     or a column heading as it is drawn.");
//   — a negative bar ("Copy has a negative value (-3).") and a focus tone that is not one of the three.
// The kit's `neverGrows` says "is larger than the step before it; a funnel only loses people"; this one speaks the same
// rule with the labels and the numbers it compares, so a refusal reads as the figure's own data.
//
// branchFlow and stateMachine write their refusals in the kit's flow voice: "The path goes happened → paid, but no
// transition connects them" follows its `states` check's sentence, and the branch and state-machine sentences are ours,
// because the kit's published scripts check neither kind's data.
//
// journeyMap's range sentence is the kit's own `within` check, word for word ("Import has a feeling of 3, outside -2 to
// 2."); its empty-journey sentence and the tree's three sentences are ours, because the kit's published scripts check
// neither kind's data (its `tree` has no check at all).
//
// The four design-system kinds — `palette`, `contrast`, `spacingScale` and `typeScale` — are the half of the kit's
// `areas/systems.md` whose data is **our own tokens** (packages/tokens, apps/docs/src/tokens.json), so the figure cannot
// disagree with the design system it documents. The palette's refusal is the kit's own `colourChecks.palette` sentence,
// with its hue: "Blue 300 is lighter than 200; a scale's steps get steadily darker." The contrast, spacing and type
// sentences are ours in its voice: the kit's published scripts check only that a spacing value is not negative, and none
// of them compare a pair's ratio with its colours or a line height with its size.
//
// The contrast pair's `ratio` is a number in the data, and it is the **engine's** — packages/cssints/src/color.ts's
// `luminance`/`ratio`, which `solid/specs/from-tokens.ts` writes the spec with. `check` recomputes it here so that a
// pair typed by hand is refused before a frame is declared, through ./contrast.ts (WCAG's formula, no dependency: see
// its header for why a copy is here and how figure.test.ts holds it to the engine).

import { contrastOf, HEX, luminance, shown } from "./contrast.ts";

/** The kinds here. glyph-kit has thirty-four; these are the twelve this repository draws, and no more. */
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
  | TypeScaleSpec;

/** A tree's data as one nested root. A flat parent/child list is resolved to children by name; the check has already
 *  refused a list with no root, a missing parent or a loop, so a caller draws only a tree that can be drawn. */
export function treeRoot(data: unknown): TreeNode | undefined {
  if (isObject(data) && !Array.isArray(data)) return data as TreeNode;
  if (!Array.isArray(data)) return undefined;
  const nodes = data.filter(isObject) as unknown as TreeNode[];
  const root = nodes.find((node) => !node.parent);
  if (!root) return undefined;
  const children = new Map<string, TreeNode[]>();
  for (const node of nodes) {
    if (!node.parent) continue;
    const list = children.get(node.parent);
    if (list) list.push(node);
    else children.set(node.parent, [node]);
  }
  const build = (node: TreeNode): TreeNode => {
    const kids = children.get(node.name) ?? [];
    return kids.length ? { name: node.name, children: kids.map(build) } : { name: node.name };
  };
  return build(root);
}

export type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const rowsOf = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const labelOf = (row: unknown, i: number): string => {
  const label = isObject(row) ? row.label : undefined;
  return typeof label === "string" && label ? label : `row ${i + 1}`;
};
const number = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;
/** Does the data hold a number anywhere? A spec with numbers needs a source, as the kit's guard refuses without one. */
function hasNumbers(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.some(hasNumbers);
  if (isObject(value)) return Object.values(value).some(hasNumbers);
  return false;
}
const say = (v: unknown) => (typeof v === "string" ? `"${v}"` : v === undefined ? "nothing" : JSON.stringify(v));
const widthProblem = (options: unknown): string[] => {
  const width = isObject(options) ? options.width : undefined;
  if (width === undefined) return [];
  const n = number(width);
  return n !== undefined && Number.isInteger(n) && n > 0
    ? []
    : [`options.width must be a whole number of cells above zero: it is ${say(width)}.`];
};

/** A number as the figure prints it: 12400 is "12,400", 0.077 stays "0.077". */
export function formatValue(value: number): string {
  if (!Number.isInteger(value)) return String(value);
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** The names a tree draws, in the data's order: a nested node's walk, or a flat list's own names. */
function treeNames(data: unknown): string[] {
  const names: string[] = [];
  const walk = (node: unknown) => {
    if (!isObject(node) || typeof node.name !== "string" || !node.name) return;
    names.push(node.name);
    if (Array.isArray(node.children)) for (const child of node.children) walk(child);
  };
  if (Array.isArray(data)) {
    for (const node of data) if (isObject(node) && typeof node.name === "string" && node.name) names.push(node.name);
    return names;
  }
  walk(data);
  return names;
}

/** The names a focus may point at: the row labels (or a flow's box labels), as they are drawn. */
function namesOf(kind: Kind, data: unknown, options: unknown): string[] {
  if (kind === "flow") return rowsOf(data).filter((s): s is string => typeof s === "string");
  if (kind === "tree") return treeNames(data);
  if (kind === "palette") {
    const palette = isObject(data) ? data : {};
    const names: string[] = [];
    for (const hue of rowsOf(palette.hues))
      if (isObject(hue)) {
        if (typeof hue.name === "string") names.push(hue.name);
        for (const step of rowsOf(hue.steps))
          if (isObject(step) && typeof step.name === "string") names.push(step.name);
      }
    return names;
  }
  if (kind === "spacingScale" || kind === "typeScale")
    return rowsOf(data)
      .filter(isObject)
      .map((step, i) => (typeof step.name === "string" && step.name ? step.name : `row ${i + 1}`));
  if (kind === "branchFlow") {
    const names: string[] = [];
    for (const [i, step] of rowsOf(data).entries()) {
      names.push(labelOf(step, i));
      if (isObject(step) && isObject(step.no) && typeof step.no.label === "string" && step.no.label)
        names.push(step.no.label);
    }
    return names;
  }
  if (kind === "stateMachine") {
    if (!isObject(data) || !Array.isArray(data.states)) return [];
    const states = data.states.filter((state): state is string => typeof state === "string" && state !== "");
    const path = isObject(options) && Array.isArray(options.path) ? options.path : [states[0]];
    return path.filter((state): state is string => typeof state === "string");
  }
  return rowsOf(data).map((row, i) => labelOf(row, i));
}

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

/** Bar-chart data: labels and values, no negative bar, one value above zero to scale against. */
function barProblems(data: unknown): string[] {
  const rows = rowsOf(data);
  if (!rows.length) return ['A bar chart needs its rows: [{ "label": "Design QA", "value": 42 }, ...].'];
  const out: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!isObject(row) || typeof row.label !== "string" || number(row.value) === undefined)
      out.push(`${labelOf(row, i)} needs a label and a value: a number.`);
  }
  for (const row of rows) {
    if (!isObject(row)) continue;
    const value = number(row.value);
    if (value !== undefined && value < 0) out.push(`${labelOf(row, rows.indexOf(row))} has a negative value (${value}).`);
  }
  const values = rows.map((row) => (isObject(row) ? number(row.value) : undefined));
  if (values.every((v) => v === undefined || v <= 0))
    out.push("A bar chart needs a value above zero: every row is 0 or less.");
  return out;
}

/** Funnel steps: each a label and a number, none negative, none larger than the step before it. */
function funnelProblems(data: unknown): string[] {
  const rows = rowsOf(data);
  if (!rows.length)
    return ['A funnel needs its steps: [{ "label": "visited", "value": 12400 }, ...], with the numbers going down.'];
  const out: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!isObject(row) || typeof row.label !== "string" || number(row.value) === undefined)
      out.push(`${labelOf(row, i)} needs a label and a value: a number.`);
  }
  const clean = rows.filter(isObject);
  for (let i = 0; i < clean.length; i++) {
    const value = number(clean[i]!.value);
    if (value !== undefined && value < 0)
      out.push(`${labelOf(clean[i], i)} has a negative value (${value}).`);
  }
  const first = clean.length ? number(clean[0]!.value) : undefined;
  if (first !== undefined && first <= 0)
    out.push(`A funnel needs its first step above zero: it is ${first}.`);
  for (let i = 1; i < clean.length; i++) {
    const row = clean[i]!;
    const before = clean[i - 1]!;
    const value = number(row.value);
    const prev = number(before.value);
    if (value !== undefined && prev !== undefined && value > prev)
      out.push(`${labelOf(row, i)} ${value} is more than ${labelOf(before, i - 1)} ${prev}; a funnel never grows`);
  }
  return out;
}

/** A comparison: two numbers a row, and a column that is not all zero. */
function compareProblems(data: unknown): string[] {
  const rows = rowsOf(data);
  if (!rows.length)
    return ['A comparison needs its rows: [{ "label": "build time", "a": 2.7, "b": 7.7, "aText": "2.7 s", "bText": "7.7 s" }].'];
  const out: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!isObject(row) || number(row.a) === undefined || number(row.b) === undefined)
      out.push(`${labelOf(row, i)} needs a and b: two numbers, and their texts when the unit is not the number.`);
  }
  const a = rows.map((row) => (isObject(row) ? number(row.a) : undefined));
  const b = rows.map((row) => (isObject(row) ? number(row.b) : undefined));
  if (a.every((v) => v === undefined || v <= 0)) out.push("A comparison needs a value above zero: the before column is 0 or less.");
  if (b.every((v) => v === undefined || v <= 0)) out.push("A comparison needs a value above zero: the after column is 0 or less.");
  return out;
}

/** A flow: labels in order, and the boxes with their arrows fit the width. */
function flowProblems(data: unknown, options: unknown): string[] {
  const labels = rowsOf(data);
  if (!labels.length) return ["A flow needs at least one box: its data is the labels in order."];
  const out: string[] = [];
  for (let i = 0; i < labels.length; i++) if (typeof labels[i] !== "string" || !(labels[i] as string).trim())
    out.push(`A flow's box ${i + 1} needs a label: a word or a line, not ${say(labels[i])}.`);
  const cells = labels.reduce((n, label) => n + [...String(label)].length + 2, 0);
  const total = cells + Math.max(0, labels.length - 1) * 3;
  const width = isObject(options) && number(options.width) !== undefined ? number(options.width)! : 60;
  if (total > width)
    out.push(
      `These ${labels.length} boxes need ${total} cells with their arrows; the width is ${width}. Shorten a label or ` +
        `raise options.width.`,
    );
  return out;
}

/** A flow with decisions: each step a label, each decision a `no` branch that goes to a step or "end". */
function branchProblems(data: unknown): string[] {
  const steps = rowsOf(data);
  if (!steps.length)
    return ['A branch flow needs its steps: [{ "label": "read the spec" }, { "label": "check it", "type": "decision", "no": { "label": "refuse it", "to": "end" } }].'];
  const out: string[] = [];
  const names = new Set<string>();
  for (const [i, step] of steps.entries())
    if (isObject(step) && typeof step.label === "string" && step.label.trim()) names.add(step.label);
  for (const [i, step] of steps.entries()) {
    const label = labelOf(step, i);
    if (!isObject(step) || typeof step.label !== "string" || !step.label.trim()) {
      out.push(`${label} needs a label: a word or a line, not ${say(isObject(step) ? step.label : step)}.`);
      continue;
    }
    if (step.type !== undefined && step.type !== "decision")
      out.push(`${label}'s type is "decision" or left out: it is ${say(step.type)}.`);
    if (step.type !== "decision") continue;
    const no = step.no;
    if (!isObject(no) || typeof no.label !== "string" || !no.label.trim()) {
      out.push(`${label} has no "no" branch.`);
      continue;
    }
    if (typeof no.to !== "string" || !no.to.trim()) {
      out.push(`${label}'s "no" needs a "to": a step's label, or "end".`);
      continue;
    }
    if (no.to !== "end" && !names.has(no.to))
      out.push(`${label}'s "no" goes to "${no.to}", which is not a step.`);
  }
  return out;
}

/** A state machine: its states, transitions that name two of them, and a path that starts first and follows them. */
function stateProblems(data: unknown, options: unknown): string[] {
  const machine = isObject(data) ? data : {};
  const raw = Array.isArray(machine.states) ? machine.states : [];
  if (!raw.length)
    return ['A state machine needs its states: ["closed", "opening", "open", "closing"].'];
  const out: string[] = [];
  const states: string[] = [];
  for (const [i, name] of raw.entries())
    if (typeof name === "string" && name.trim()) states.push(name);
    else out.push(`State ${i + 1} needs a name: a word, not ${say(name)}.`);
  const transitions = Array.isArray(machine.transitions) ? machine.transitions : [];
  if (!transitions.length)
    out.push('A state machine needs its transitions: [{ "from": "closed", "to": "opening", "on": "open" }, ...].');
  for (const [i, t] of transitions.entries()) {
    if (!isObject(t) || typeof t.from !== "string" || typeof t.to !== "string" || typeof t.on !== "string") {
      out.push(`Transition ${i + 1} needs from, to and on: [{ "from": "closed", "to": "opening", "on": "open" }].`);
      continue;
    }
    const missing = [t.from, t.to].filter((name) => !states.includes(name));
    if (missing.length)
      out.push(
        `${t.from} goes to ${t.to} on "${t.on}", but ` +
          (missing.length === 1
            ? `"${missing[0]}" isn't one of the states.`
            : `neither "${missing[0]}" nor "${missing[1]}" is one of the states.`),
      );
  }
  const path = isObject(options) && Array.isArray(options.path) ? options.path : [states[0]];
  if (!path.length) return [...out, "A state machine's path needs at least one state: options.path is empty."];
  for (const name of path)
    if (typeof name !== "string" || !states.includes(name))
      out.push(`The path visits ${say(name)}, which isn't one of the states.`);
  const first = path[0];
  if (typeof first === "string" && states[0] !== undefined && first !== states[0])
    out.push(`The path starts at ${first}, but the machine's first state is ${states[0]}.`);
  for (let i = 1; i < path.length; i++) {
    const [from, to] = [path[i - 1], path[i]];
    if (typeof from !== "string" || typeof to !== "string") continue;
    if (!transitions.some((t) => isObject(t) && t.from === from && t.to === to))
      out.push(`The path goes ${from} → ${to}, but no transition connects them.`);
  }
  return out;
}

/**
 * A tree: glyph-kit's nested `{ name, children }`, or a flat parent/child list. Either way exactly one node is above
 * the rest, and every `parent` names a node in the list. The kit's published scripts check none of this: these
 * sentences are ours, in its voice.
 */
function treeProblems(data: unknown): string[] {
  const out: string[] = [];
  if (Array.isArray(data)) {
    if (!data.length) return ["A tree needs its root: a node with a name and no parent."];
    const nodes = data.filter(isObject);
    const names = new Set<string>();
    for (const [i, node] of data.entries()) {
      if (!isObject(node) || typeof node.name !== "string" || !node.name.trim()) {
        out.push(`Node ${i + 1} needs a name: a word, not ${say(isObject(node) ? node.name : node)}.`);
        continue;
      }
      names.add(node.name);
    }
    const roots = nodes.filter((node) => typeof node.name === "string" && node.name && !node.parent);
    if (!roots.length) out.push("A tree needs one root: every node names a parent, so none is above them.");
    else if (roots.length > 1)
      out.push(`A tree needs one root, but ${roots.map((node) => String(node.name)).join(", ")} have no parent.`);
    for (const node of nodes) {
      if (typeof node.name !== "string" || !node.name.trim()) continue;
      const parent = node.parent;
      if (parent === undefined || parent === null || parent === "") continue;
      if (typeof parent !== "string" || !names.has(parent))
        out.push(`${node.name} names ${say(parent)} as its parent, but there is no node named ${say(parent)}.`);
    }
    const root = roots.length === 1 ? roots[0]! : undefined;
    if (root && out.length === 0) {
      const reached = new Set<string>();
      const walk = (node: Json) => {
        if (typeof node.name !== "string" || reached.has(node.name)) return;
        reached.add(node.name);
        for (const child of nodes) if (child.parent === node.name) walk(child);
      };
      walk(root);
      const lost = [...names].filter((name) => !reached.has(name));
      if (lost.length) out.push(`${lost[0]} is not under the root ${String(root.name)}: its parents form a loop.`);
    }
    return out;
  }
  if (!isObject(data)) return ['A tree needs its root: { "name": "Settings", "children": [...] }, or a parent/child list.'];
  const walk = (node: unknown, parent: string | undefined) => {
    if (!isObject(node) || typeof node.name !== "string" || !node.name.trim()) {
      out.push(
        parent === undefined
          ? "A tree needs its root: the outermost node has no name."
          : `${parent}'s child needs a name: a word, not ${say(isObject(node) ? node.name : node)}.`,
      );
      return;
    }
    if (node.children !== undefined && !Array.isArray(node.children)) {
      out.push(`${node.name}'s children need a list: it is ${say(node.children)}.`);
      return;
    }
    for (const child of node.children ?? []) walk(child, node.name);
  };
  walk(data, undefined);
  return out;
}

/** A journey: a label and a feeling a stage, and the feeling inside the kit's -2 to 2 scale. */
function journeyProblems(data: unknown): string[] {
  const stages = rowsOf(data);
  if (!stages.length)
    return ['A journey needs its stages: [{ "label": "Discover", "feeling": 1 }, ...], each with the feeling it had.'];
  const out: string[] = [];
  const feelings: (number | undefined)[] = [];
  for (const [i, stage] of stages.entries()) {
    const feeling = isObject(stage) ? number(stage.feeling) : undefined;
    feelings.push(feeling);
    if (!isObject(stage) || typeof stage.label !== "string" || !stage.label.trim() || feeling === undefined)
      out.push(`${labelOf(stage, i)} needs a label and a feeling: a number from -2 to 2.`);
  }
  for (const [i, feeling] of feelings.entries())
    if (feeling !== undefined && (feeling < -2 || feeling > 2))
      out.push(`${labelOf(stages[i], i)} has a feeling of ${feeling}, outside -2 to 2.`);
  return out;
}

/**
 * A palette: hues of named steps whose colours are `#rrggbb`, each hue one direction — steadily darker or steadily
 * lighter — and one name a step. The kit's own `coloursChecks.palette`, sentence and all, with the hue in front of the
 * step: "Blue 300 is lighter than 200; a scale's steps get steadily darker."
 */
function paletteProblems(data: unknown): string[] {
  const palette = isObject(data) ? data : {};
  const hues = rowsOf(palette.hues).filter(isObject);
  if (!hues.length)
    return ['A palette needs its hues: [{ "name": "Blue", "steps": [{ "name": "50", "value": "#eef3ff" }] }].'];
  const out: string[] = [];
  const page = palette.page ?? "#ffffff";
  if (!HEX.test(String(page))) out.push(`Write the page colour as a hex value like #ffffff, not ${say(page)}.`);
  for (const [h, hue] of hues.entries()) {
    const name = typeof hue.name === "string" && hue.name ? hue.name : `hue ${h + 1}`;
    const steps = rowsOf(hue.steps);
    if (!steps.length) {
      out.push(`${name} has no steps: a hue is a list of { "name": "50", "value": "#eef3ff" }.`);
      continue;
    }
    const named = new Set<string>();
    const lengths: { name: string; l: number }[] = [];
    for (const [i, step] of steps.entries()) {
      if (!isObject(step) || typeof step.name !== "string" || !step.name) {
        out.push(`${name}'s step ${i + 1} needs a name: the step's place in the scale, like "50".`);
        continue;
      }
      if (named.has(step.name)) out.push(`${name} has two steps named ${step.name}: a step's name is its row.`);
      named.add(step.name);
      if (!HEX.test(String(step.value))) {
        out.push(`${name} ${step.name}: write the colour as a hex value like #1f4fd6, not ${say(step.value)}.`);
        continue;
      }
      lengths.push({ name: step.name, l: luminance(step.value)! });
    }
    // the kit's direction rule: the hue's own endpoints say which way its scale runs, and every step follows it
    const first = lengths[0];
    const last = lengths[lengths.length - 1];
    const direction = first && last ? Math.sign(last.l - first.l) : 0;
    const breakAt = direction
      ? lengths.findIndex((s, i) => i > 0 && s.l !== lengths[i - 1]!.l && Math.sign(s.l - lengths[i - 1]!.l) !== direction)
      : -1;
    if (breakAt > 0) {
      const step = lengths[breakAt]!;
      const before = lengths[breakAt - 1]!;
      out.push(
        `${name} ${step.name} is ${direction < 0 ? "lighter" : "darker"} than ${before.name}; a scale's steps get ` +
          `steadily ${direction < 0 ? "darker" : "lighter"}.`,
      );
    }
  }
  return out;
}

/** The kit's `within` for WCAG's own three floors: a pair held to any other number is not a check anyone can pass. */
const FLOORS = [3, 4.5, 7] as const;

/**
 * A contrast check: pairs of a text colour and its page, each with WCAG's floor and the ratio of the two. The ratio must
 * be the ratio the colours make — that is the one thing this kind exists to keep honest: a pair typed with another colour
 * keeps its old number, and is refused here ("link on bgSubtle says 4.51:1, but #1971c2 on #f8f9fa makes 4.12:1.").
 */
function contrastProblems(data: unknown): string[] {
  const pairs = rowsOf(data);
  if (!pairs.length)
    return ['A contrast check needs its pairs: [{ "label": "ink on paper", "fg": "#080808", "bg": "#fbfbf8", "min": 4.5, "ratio": 19.36 }].'];
  const out: string[] = [];
  for (const [i, pair] of pairs.entries()) {
    if (!isObject(pair) || typeof pair.label !== "string" || !pair.label.trim()) {
      out.push(`Pair ${i + 1} needs a label: what the pair is for, like "ink on paper".`);
      continue;
    }
    const label = pair.label;
    for (const [field, value] of [["fg", pair.fg], ["bg", pair.bg]] as const)
      if (!HEX.test(String(value)))
        out.push(`${label}'s ${field} is a hex value like #080808, not ${say(value)}.`);
    const min = number(pair.min);
    if (min === undefined) out.push(`${label} needs a min: 3, 4.5 or 7, WCAG's three floors.`);
    else if (!(FLOORS as readonly number[]).includes(min))
      out.push(`${label}'s min is ${min}: a minimum is 3, 4.5 or 7, WCAG's three floors.`);
    const ratio = number(pair.ratio);
    if (ratio === undefined) {
      out.push(`${label} needs its ratio: the number of ${say(pair.fg)} on ${say(pair.bg)}, to two places.`);
      continue;
    }
    const own = contrastOf(pair.fg, pair.bg);
    if (own !== undefined && Math.abs(own - ratio) > 0.005)
      out.push(`${label} says ${shown(ratio)}:1, but ${pair.fg} on ${pair.bg} makes ${shown(own)}:1.`);
  }
  return out;
}

/** A spacing scale: named steps in pixels, from the smallest to the largest — a scale that does not grow is not a scale. */
function spacingProblems(data: unknown): string[] {
  const steps = rowsOf(data);
  if (!steps.length)
    return ['A spacing scale needs its steps: [{ "name": "space-1", "value": 4 }, ...], in pixels, smallest first.'];
  const out: string[] = [];
  const clean: { name: string; value: number }[] = [];
  for (const [i, step] of steps.entries()) {
    const value = isObject(step) ? number(step.value) : undefined;
    if (!isObject(step) || typeof step.name !== "string" || !step.name || value === undefined) {
      out.push(`${isObject(step) && typeof step.name === "string" && step.name ? step.name : `Step ${i + 1}`} needs a name and a value: a length in pixels.`);
      continue;
    }
    if (value <= 0) out.push(`${step.name} has a value of ${value}px: a step is above zero.`);
    clean.push({ name: step.name, value });
  }
  for (let i = 1; i < clean.length; i++) {
    const step = clean[i]!;
    const before = clean[i - 1]!;
    if (step.value < before.value)
      out.push(`${step.name} is ${step.value}px, less than ${before.name}'s ${before.value}px before it; a spacing scale grows.`);
  }
  return out;
}

/** A type scale: named sizes with their line heights, no size under 8 px, no line height under its size. */
function typeProblems(data: unknown): string[] {
  const steps = rowsOf(data);
  if (!steps.length)
    return ['A type scale needs its sizes: [{ "name": "body", "size": 16, "lineHeight": 24 }, ...], in pixels.'];
  const out: string[] = [];
  for (const [i, step] of steps.entries()) {
    const size = isObject(step) ? number(step.size) : undefined;
    const lineHeight = isObject(step) ? number(step.lineHeight) : undefined;
    if (!isObject(step) || typeof step.name !== "string" || !step.name || size === undefined || lineHeight === undefined) {
      out.push(`${isObject(step) && typeof step.name === "string" && step.name ? step.name : `Step ${i + 1}`} needs a name, a size and a line height: pixels, like { "name": "body", "size": 16, "lineHeight": 24 }.`);
      continue;
    }
    if (size < 8) out.push(`${step.name} is ${size}px: a size under 8px is unreadable.`);
    if (lineHeight < size) out.push(`${step.name} is ${size}/${lineHeight}: a line height under its size (${size}) crowds the lines.`);
  }
  return out;
}

/**
 * Every problem with a spec, in plain sentences: the kind, the numbers' source, the kind's own data rule, and the
 * focus's names. An empty array is a figure that can be drawn.
 */
export function check(input: unknown): string[] {
  if (!isObject(input))
    return ['A spec is one JSON object: kind, data, and a source when there are numbers on the figure.'];
  const kind = input.kind;
  if (typeof kind !== "string" || !(KINDS as readonly string[]).includes(kind))
    return [`unknown kind ${say(kind)}: the ones here are ${KINDS.join(", ")}.`];
  const problems: string[] = [];
  if (hasNumbers(input.data) && !String(input.source ?? "").trim())
    problems.push("These numbers need a source: where did they come from?");
  problems.push(...widthProblem(input.options));
  if (kind === "barChart") {
    problems.push(...barProblems(input.data));
    const max = isObject(input.options) ? number(input.options.max) : undefined;
    if (max !== undefined && max <= 0) problems.push(`options.max must be above zero: it is ${max}.`);
  } else if (kind === "funnel") problems.push(...funnelProblems(input.data));
  else if (kind === "compare") problems.push(...compareProblems(input.data));
  else if (kind === "branchFlow") problems.push(...branchProblems(input.data));
  else if (kind === "stateMachine") problems.push(...stateProblems(input.data, input.options));
  else if (kind === "journeyMap") problems.push(...journeyProblems(input.data));
  else if (kind === "tree") problems.push(...treeProblems(input.data));
  else if (kind === "palette") problems.push(...paletteProblems(input.data));
  else if (kind === "contrast") problems.push(...contrastProblems(input.data));
  else if (kind === "spacingScale") problems.push(...spacingProblems(input.data));
  else if (kind === "typeScale") problems.push(...typeProblems(input.data));
  else problems.push(...flowProblems(input.data, input.options));
  problems.push(...focusProblems(input.focus, namesOf(kind as Kind, input.data, input.options)));
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
