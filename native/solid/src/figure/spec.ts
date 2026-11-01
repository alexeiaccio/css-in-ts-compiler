// The figure spec, in the shape glyph-kit defines (skills/glyph-kit/reference/spec.md, MIT: the format, not its code):
// one JSON object per figure — `kind`, `title`, `intent`, `source`, `data`, `options`, `focus` — with four kinds here
// (`barChart`, `compare`, `flow`, `funnel`) where the kit has thirty-four. `check` returns **every** problem as a
// sentence, in the kit's voice, because a spec is refused before a frame is declared; `parse` is the same check over a
// file's text. No dependency: plain TypeScript over JSON.
//
// The ones ported from the kit's `guard.mjs` and `render/focus.mjs`, sentence and all:
//   — numbers without a source ("These numbers need a source: where did they come from?");
//   — a funnel that grows ("Signup 6100 is more than visited 12400; a funnel never grows");
//   — a focus naming something the figure does not draw ("Focus names "M2", which isn't in the figure. Use a row label
//     or a column heading as it is drawn.");
//   — a negative bar ("Copy has a negative value (-3).") and a focus tone that is not one of the three.
// The kit's `neverGrows` says "is larger than the step before it; a funnel only loses people"; this one speaks the same
// rule with the labels and the numbers it compares, so a refusal reads as the figure's own data.

/** The kinds here. glyph-kit has thirty-four; these are the four this repository draws, and no more. */
export const KINDS = ["barChart", "compare", "flow", "funnel"] as const;
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

export type Spec = BarChartSpec | CompareSpec | FlowSpec | FunnelSpec;

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
function namesOf(kind: Kind, data: unknown): string[] {
  if (kind === "flow") return rowsOf(data).filter((s): s is string => typeof s === "string");
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
  else problems.push(...flowProblems(input.data, input.options));
  problems.push(...focusProblems(input.focus, namesOf(kind as Kind, input.data)));
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
