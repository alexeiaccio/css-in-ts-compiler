// The stop math of an eased gradient (larsenwork/easing-coordinates): plain functions, no engine.
type Bezier = readonly [number, number, number, number];
const NAMED = new Map<string, Bezier>([
  ["linear", [0, 0, 1, 1]],
  ["ease", [0.25, 0.1, 0.25, 1]],
  ["ease-in", [0.42, 0, 1, 1]],
  ["ease-out", [0, 0, 0.58, 1]],
  ["ease-in-out", [0.42, 0, 0.58, 1]],
]);

const curve = (easing: string) => {
  const named = NAMED.get(easing);
  if (named) return named;
  const n = /^cubic-bezier\((.*)\)$/.exec(easing)?.[1]?.split(",").map(Number);
  if (n?.length === 4 && n.every(Number.isFinite)) return n as unknown as Bezier;
  throw new Error(
    `cssints: gradient(): "${easing}" is not an easing (the arguments are kind, direction, from, to, easing?, stops?)`,
  );
};

const bezier = (t: number, p1: number, p2: number) =>
  3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3;
/**
 * A share or a position as CSS text, two decimals at most (the build output is the same on every machine).
 * @param {number} n a percentage
 * @returns {string} its text
 */
export const fixed = (n: number) => String(+n.toFixed(2));

/**
 * The curve's parameter sampled evenly, as postcss-easing-gradients does.
 * @param {string} easing `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out` or `cubic-bezier(x1, y1, x2, y2)`
 * @param {number} stops the number of colour stops, both ends included
 * @returns {{ x: number, y: number }[]} per stop `x`, its position, and `y`, the share of the second colour (clamped to 0..1), both 0..1
 */
export const samples = (easing: string, stops: number) => {
  const [x1, y1, x2, y2] = curve(easing);
  return Array.from({ length: stops }, (_, i) => {
    const t = i / (stops - 1);
    return { x: bezier(t, x1, x2), y: Math.min(1, Math.max(0, bezier(t, y1, y2))) };
  });
};
