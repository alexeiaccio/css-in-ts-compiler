// @cssints/data: statistics over runtime values, computed by the browser's layout (the dCSS idea, noscript.ing/compute
// and github.com/noscripting/dCSS). `data()` is one call member of cssints/plugin `scope()` with no arguments and no
// class: it prints a small global rig, once per sheet however many times it is called. A figure says which statistic it
// wants with `data-data` (`max`, `sum` or `count`); the browser lays out the values as widths, and a container query
// reads the resulting width back as a number that a counter prints. No runtime, no state.
import { scope } from "cssints/plugin";

// The figure is a grid of one auto column, sized by its content; the measuring list is a zero-height list of items whose
// widths are the values. `overflow: clip` keeps the printed answer from widening the figure.
const BASE =
  "[data-data] { display: inline-grid; grid-template-columns: auto; width: max-content; overflow: clip } " +
  "[data-data] > ul { margin: 0; padding: 0; list-style: none; height: 0 }";

// max: a grid of one implicit column, so the column is as wide as its widest item.
const MAX =
  '[data-data="max"] > ul { display: grid } ' +
  '[data-data="max"] > ul > li { width: calc(var(--value) * 1px); height: 0 }';

// sum: a hug-width flex row, so the row is as wide as all items together.
const SUM =
  '[data-data="sum"] > ul { display: flex; width: max-content } ' +
  '[data-data="sum"] > ul > li { flex: none; width: calc(var(--value) * 1px); height: 0 }';

// count: a hug-width flex row of 1px items, so the row's length is the number of items.
const COUNT =
  '[data-data="count"] > ul { display: flex; width: max-content } ' +
  '[data-data="count"] > ul > li { width: 1px; height: 0 }';

// The reader is a size container: its inline size is computed as if it were empty, so it takes the column width that the
// measuring list set, and a round of 100cqw (a length) over 1px (a length) is that width as a number. The counter prints
// it, and it matches the three statistics only: a figure whose `data-data` the rig does not know prints nothing.
// `counter-reset` takes the integer the round gives.
const READ =
  "[data-read] { display: block; container-type: inline-size } " +
  "[data-read] > * { --data-result: round(100cqw / 1px) } " +
  '[data-data="max"] [data-read] output::after, [data-data="sum"] [data-read] output::after, [data-data="count"] [data-read] output::after { counter-reset: out var(--data-result); content: counter(out) }';

// A rule is a global, identified by its text: the three rigs print once per sheet, however many times `data()` runs.
const RULES: readonly string[] = [BASE, MAX, SUM, COUNT, READ];

const dataScope = scope("data", {
  data: { args: [] },
}).build({
  data: () => ({ globals: RULES.map((css) => ({ css })) }),
});

// named through the scope, as mise-en-mode's look: the inferred type is too long to print (TS7056)
type Members = ReturnType<typeof dataScope.export>;
const members: Members = dataScope.export();

/**
 * `data()`: prints the rig that computes `max`, `sum` or `count` of the `--value`s of a `<li>` list by layout and prints
 * the answer with a counter. The figure picks the statistic with `data-data`; the answer reaches what lives inside
 * `[data-read]` (CSS cannot hand a number to a sibling). No arguments, no class; call it at a module's top level. See
 * the README for the DOM contract and the accessibility note.
 */
export const data: Members["data"] = members.data;
