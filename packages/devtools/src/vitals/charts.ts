// Text charts for a console: a sparkline, a heatmap row and bars, in the characters and `%c` styles a console prints.
// Plain code, no DOM and no Effect, so the shapes can be tested by themselves (test/vitals.mjs).
const LEVELS = "▁▂▃▄▅▆▇█";

// The last `width` values as one line, each scaled to the eight levels (`▁` the lowest, `█` the highest).
export const sparkline = (values: readonly number[], width = 48): string => {
  const sample = values.slice(-width);
  if (sample.length === 0) return "";
  const min = Math.min(...sample);
  const max = Math.max(...sample);
  return sample
    .map(
      (v) => LEVELS[max === min ? 4 : Math.round(((v - min) / (max - min)) * (LEVELS.length - 1))],
    )
    .join("");
};

/** The four budgets of a frame, in ms: a cell is green under one frame, then amber, orange and red. */
const BUDGETS = [16.7, 33.4, 50] as const;
const COLOURS = ["#2da44e", "#bf8700", "#bc4c00", "#cf222e"] as const;
const level = (ms: number): number => {
  const i = BUDGETS.findIndex((budget) => ms <= budget);
  return i === -1 ? COLOURS.length - 1 : i;
};

// The last `width` values as a row of coloured cells, each the worst value of its bucket: a frame timeline, so a janky
// second is one red stretch rather than one spike. `cells` is a console format string (one `%c` a cell); print it with
// `styles` as the arguments.
export const heatmap = (
  values: readonly number[],
  width = 48,
): { cells: string; styles: string[] } => {
  const n = Math.min(width, values.length);
  const sample = values.slice(-n);
  const size = sample.length / n;
  const styles: string[] = [];
  let cells = "";
  for (let i = 0; i < n; i++) {
    const worst = Math.max(
      ...sample.slice(
        Math.floor(i * size),
        Math.max(Math.floor(i * size) + 1, Math.floor((i + 1) * size)),
      ),
    );
    cells += "%c  ";
    styles.push(`background:${COLOURS[level(worst)]};border-radius:1px`);
  }
  return { cells, styles };
};

// One line per item, its value a bar of at most `width` characters (`█`), and a text at the end.
export const bars = (
  items: readonly { label: string; value: number; text?: string }[],
  width = 20,
): string[] => {
  const max = Math.max(1, ...items.map((item) => item.value));
  return items.map((item) => {
    const n = Math.max(1, Math.round((item.value / max) * width));
    return `${item.label.padEnd(10)}${"█".repeat(n).padEnd(width)} ${item.text ?? item.value}`;
  });
};
