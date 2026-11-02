// The figure spec, in the shape glyph-kit defines (skills/glyph-kit/reference/spec.md, MIT: the format, not its code):
// one JSON object per figure — `kind`, `title`, `intent`, `source`, `data`, `options`, `focus` — with six kinds here
// (`barChart`, `branchFlow`, `compare`, `flow`, `funnel`, `stateMachine`) where the kit has thirty-four. `check` returns
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

/** The kinds here. glyph-kit has thirty-four; these are the six this repository draws, and no more. */
export const KINDS = ["barChart", "branchFlow", "compare", "flow", "funnel", "stateMachine"] as const;
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

export type Spec = BarChartSpec | BranchFlowSpec | CompareSpec | FlowSpec | FunnelSpec | StateMachineSpec;

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

/** The names a focus may point at: the row labels (or a flow's box labels), as they are drawn. */
function namesOf(kind: Kind, data: unknown, options: unknown): string[] {
  if (kind === "flow") return rowsOf(data).filter((s): s is string => typeof s === "string");
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
