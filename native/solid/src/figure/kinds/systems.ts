// The systems area, one file for its kinds — their layout and their own refusals side by side, because that is what the
// next kind of this area costs: a layout function, a check, one `register` at the bottom, and nothing else.
//
//   palette      a step a row, a hue a column: the marker, the step's swatch, its value and its contrast on the page
//   spacingScale a step a row: its name, a bar of value/largest (a 4px step of a 48px scale is half a cell), its pixels
//   typeScale    a size a row: its name, a bar of size/largest, size/lineHeight, and a specimen at its own size
//
// These are the half of the kit's `areas/systems.md` whose data is **our own tokens** (packages/tokens,
// apps/docs/src/tokens.json), so the figure cannot disagree with the design system it documents. They needed three
// things the layout did not have, and all three are additions to the *format*, not to one target: an item kind `swatch`
// (a step's own colour, which is the data and not a role), an item kind `marker` (the ▲ that marks the first step that
// reads as words), and a text's `size` with a line's `height` in cells (a 40px line of type is three cells tall: a cell
// is 16px, and a type scale cannot be drawn otherwise). `text.ts` draws all three in two branches — a swatch is `██` in
// its cell, a marker is `▲` — so the text half still has no kind in it.
//
// The palette's refusal is the kit's own `colourChecks.palette` sentence, with its hue ("Blue 300 is lighter than 200; a
// scale's steps get steadily darker."). The contrast, spacing and type sentences are ours in its voice: the kit's
// published scripts check only that a spacing value is not negative, and none of them compare a line height with its size.
import { contrastOf, HEX, luminance, shown, WORDS } from "../contrast.ts";
import type { Bar, Item, Layout, LayoutLine, Swatch, TextItem } from "../registry.ts";
import { CELL_HEIGHT, CELL_WIDTH, register } from "../registry.ts";
import type { PaletteSpec, SpacingSpec, TypeScaleSpec } from "../spec.ts";
import {
  barLine,
  cells,
  exactFill,
  finish,
  focusOf,
  isObject,
  longest,
  number,
  paintOf,
  rowsOf,
  say,
  textItem,
} from "./shared.ts";

/**
 * A palette: one row a step, one column a hue — glyph-kit's tonal scale. The cell is the marker (the first step of that
 * hue that reads as words on the page, 4.5 to 1), the step's swatch, its value and its contrast on the page. The contrast
 * is computed from the two colours here, with the same formula `check` refuses by, so a swatch and its number cannot
 * disagree; the swatch itself is the step's `#rrggbb`, the one colour a figure draws as itself.
 */
function palette(spec: PaletteSpec): Layout {
  const focus = focusOf(spec);
  const { hues, page = "#ffffff" } = spec.data;
  const steps: string[] = [];
  for (const hue of hues) for (const step of hue.steps) if (!steps.includes(step.name)) steps.push(step.name);
  const ratios = new Map<string, number>();
  for (const hue of hues)
    for (const step of hue.steps) ratios.set(`${hue.name}\t${step.name}`, contrastOf(step.value, page) ?? 1);
  const ratioTexts = [...ratios.values()].map((r) => shown(r));
  const stepWidth = Math.max(2, longest(steps)) + 2;
  const valueWidth = Math.max(7, longest(hues.flatMap((hue) => hue.steps.map((step) => step.value)))) + 1;
  const ratioWidth = longest(ratioTexts) + 2;
  // the marker (two cells, so the ▲ reads apart from its swatch), the swatch, a cell, the value, the ratio and the gap
  const slot = 2;
  const cell = slot + 2 + 1 + valueWidth + ratioWidth;
  const pad = (text: string, width: number) => text + " ".repeat(Math.max(0, width - cells(text)));
  const head = `${" ".repeat(stepWidth + slot)}${hues.map((hue) => pad(hue.name, cell)).join("")}`;
  const lines: LayoutLine[] = [
    { items: [textItem("fig-hues", head, cells(head), "muted", "label")] },
  ];
  const swatches: Swatch[] = [];
  const labels: Layout["labels"] = [];
  steps.forEach((stepName, row) => {
    const items: Item[] = [textItem(`fig-step-${row}`, stepName, stepWidth, paintOf(focus, stepName), "label")];
    labels.push({ textId: `fig-step-${row}`, text: stepName });
    hues.forEach((hue, h) => {
      const step = hue.steps.find((s) => s.name === stepName);
      if (!step) {
        items.push({ kind: "space", id: `fig-palette-gap-${h}-${row}`, cells: cell, paint: "ink" });
        return;
      }
      const contrast = ratios.get(`${hue.name}\t${step.name}`) ?? 1;
      // the first step of the hue that passes, in the hue's own order
      const marked = hue.steps.find((s) => (ratios.get(`${hue.name}\t${s.name}`) ?? 0) >= WORDS)?.name === step.name;
      items.push(
        marked
          ? { kind: "marker", id: `fig-marker-${h}-${row}`, cells: slot, paint: "good" }
          : textItem(`fig-marker-gap-${h}-${row}`, " ".repeat(slot), slot, "ink"),
        { kind: "swatch", id: `fig-swatch-${h}-${row}`, cells: 2, paint: "ink", value: step.value },
        textItem(`fig-swatch-value-${h}-${row}`, " ", 1, "ink"),
        textItem(`fig-value-${h}-${row}`, step.value, valueWidth, "ink", "value"),
        textItem(`fig-ratio-${h}-${row}`, shown(contrast), ratioWidth, "muted", "ratio"),
      );
      swatches.push({
        id: `fig-swatch-${h}-${row}`,
        textId: `fig-value-${h}-${row}`,
        hue: hue.name,
        step: step.name,
        value: step.value,
        contrast,
        marked,
      });
    });
    lines.push({ items });
  });
  return finish(spec, "palette", stepWidth + cell * hues.length, lines, [], labels, [], [], swatches);
}

/**
 * A spacing scale: a step a row — its name, a bar of `value/largest`, its pixels. A cell is 8px and the track is the
 * largest step, so the scale maps to cells at its own length: a 4px step of a 48px scale is **half a cell** (`▌` in the
 * text half, 4px of fill on the pixel targets), not "one cell", and every step's fill is exactly its value's.
 */
function spacingScale(spec: SpacingSpec): Layout {
  const focus = focusOf(spec);
  const steps = spec.data;
  const largest = Math.max(...steps.map((step) => step.value));
  const track = Math.max(1, Math.ceil(largest / CELL_WIDTH));
  const labelWidth = longest(steps.map((step) => step.name)) + 1;
  const texts = steps.map((step) => `${step.value}px`);
  const textWidth = longest(texts) + 1;
  const note = `A cell is ${CELL_WIDTH}px: the track is the largest step, ${largest}px.`;
  const width = Math.max(labelWidth + track + textWidth, cells(note));
  const bars: Bar[] = [];
  const labels: Layout["labels"] = [];
  const lines = steps.map((step, i) => {
    const fill = exactFill(step.value, largest, track);
    bars.push({
      fillId: `fig-fill-${i}`,
      trackId: `fig-track-${i}`,
      textId: `fig-num-${i}`,
      label: step.name,
      value: step.value,
      max: largest,
      fill,
      track,
      text: texts[i]!,
    });
    labels.push({ textId: `fig-label-${i}`, text: step.name });
    return barLine(i, step.name, fill, track, texts[i]!, textWidth, labelWidth, paintOf(focus, step.name));
  });
  lines.push({ items: [textItem("fig-note", note, cells(note), "muted", "note")] });
  return finish(spec, "spacingScale", width, lines, bars, labels);
}

/**
 * A type scale: a size a row — its name, a bar of `size/largest`, `size/lineHeight`, and a specimen `Aa` at the size
 * itself. A 40px line is three cells tall (a cell is 16px), so this is the one kind whose rows differ in height: the
 * layout says so in `height`, the page writes it through the value channel, and the terminal draws the row's cells with
 * the text in the first of them. The cell figure cannot draw type at its size — a cell has one size — so it prints the
 * numbers and draws the proportional bar; the specimen's `size` is what a pixel target honours.
 */
function typeScale(spec: TypeScaleSpec): Layout {
  const focus = focusOf(spec);
  const steps = [...spec.data].sort((a, b) => b.size - a.size);
  const largest = steps[0]?.size ?? 1;
  const track = 14;
  const labelWidth = longest(steps.map((step) => step.name)) + 1;
  const numbers = steps.map((step) => `${step.size}/${step.lineHeight}`);
  const numberWidth = longest(numbers) + 1;
  // two glyphs of about 0.7em: enough cells that a 40px "Aa" is not cut by the next item
  const specimenWidth = Math.max(2, ...steps.map((step) => Math.ceil((step.size * 1.4) / CELL_WIDTH))) + 1;
  const width = labelWidth + track + numberWidth + specimenWidth;
  const bars: Bar[] = [];
  const labels: Layout["labels"] = [];
  const lines = steps.map((step, i) => {
    const fill = exactFill(step.size, largest, track);
    bars.push({
      fillId: `fig-fill-${i}`,
      trackId: `fig-track-${i}`,
      textId: `fig-num-${i}`,
      label: step.name,
      value: step.size,
      max: largest,
      fill,
      track,
      text: numbers[i]!,
    });
    labels.push({ textId: `fig-label-${i}`, text: step.name });
    const specimen: TextItem = {
      ...textItem(`fig-type-${i}`, "Aa", specimenWidth, paintOf(focus, step.name), "value"),
      size: step.size,
    };
    const line: LayoutLine = {
      items: [
        textItem(`fig-label-${i}`, step.name, labelWidth, paintOf(focus, step.name)),
        { kind: "bar", id: `fig-track-${i}`, fillId: `fig-fill-${i}`, cells: track, fill, paint: paintOf(focus, step.name) },
        textItem(`fig-num-${i}`, numbers[i]!, numberWidth, "muted", "ratio"),
        { kind: "space", id: `fig-type-gap-${i}`, cells: 1, paint: "ink" },
        specimen,
      ],
      height: Math.max(1, Math.ceil(step.lineHeight / CELL_HEIGHT)),
    };
    return line;
  });
  return finish(spec, "typeScale", width, lines, bars, labels);
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

/** A palette's names are its hues and their steps; a scale's are its steps' names. */
function paletteNames(data: unknown): string[] {
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

function stepNames(data: unknown): string[] {
  return rowsOf(data)
    .filter(isObject)
    .map((step, i) => (typeof step.name === "string" && step.name ? step.name : `row ${i + 1}`));
}

register("palette", { layout: palette, check: paletteProblems, names: paletteNames });
register("spacingScale", { layout: spacingScale, check: spacingProblems, names: stepNames });
register("typeScale", { layout: typeScale, check: typeProblems, names: stepNames });
