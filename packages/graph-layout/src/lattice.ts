import type { Channel } from "./route.ts";

/** A point on a lattice, or of a path through one. */
export interface LatticePoint {
  readonly x: number;
  readonly y: number;
}

/**
 * How the lattice router prices a path: the length in px, a bend, one more use of a lattice edge another route already
 * drew (`reuse`), and one crossing with such a route (`crossing`).
 */
export interface LatticeWeights {
  /** The pitch of a channel's columns, 6 px when absent. */
  readonly pitch?: number;
  /** What one bend costs in px of length, 20 when absent. */
  readonly bend?: number;
  /** What one use of an edge another route in the channel already used costs, 0 when absent. */
  readonly reuse?: number;
  /** What one crossing with a route already drawn in the channel costs, 20 when absent. */
  readonly crossing?: number;
}

/** The knobs of {@link latticeOf}: the direction set and the cost's weights. */
export interface LatticeOptions extends LatticeWeights {
  readonly directions?: 4 | 8;
}

/** One layer boundary's lattice: the columns across it, the rows the drawing shares, and the routes already drawn on it. */
export interface LatticeGrid {
  readonly columns: ReadonlyArray<number>;
  readonly rows: ReadonlyArray<number>;
  /** The cheapest path from `from` to `to`, both on the lattice, monotone in x. */
  path(from: LatticePoint, to: LatticePoint): ReadonlyArray<LatticePoint>;
  /** Records a drawn path: its edges become reused and its segments become obstacles to cross. */
  commit(points: ReadonlyArray<LatticePoint>): void;
}

const EPSILON = 1e-9;
const ROW_TOLERANCE = 1e-6;
const DEFAULT_PITCH = 6;
const DEFAULT_BEND = 20;
const DEFAULT_REUSE = 0;
const DEFAULT_CROSSING = 20;
const NONE = 4;

const orientation = (
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
): number => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);

const crosses = (
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
): boolean => {
  const one = orientation(ax, ay, bx, by, cx, cy);
  const two = orientation(ax, ay, bx, by, dx, dy);
  const three = orientation(cx, cy, dx, dy, ax, ay);
  const four = orientation(cx, cy, dx, dy, bx, by);
  return (
    ((one > EPSILON && two < -EPSILON) || (one < -EPSILON && two > EPSILON)) &&
    ((three > EPSILON && four < -EPSILON) || (three < -EPSILON && four > EPSILON))
  );
};

/**
 * The columns of a channel: the strip's two edges, and a column every `pitch` px from its start. An intersection of a column
 * with a row is a lattice node.
 *
 * @param {Channel} channel the strip the boundary leaves between two layers
 * @param {number} pitch the distance between two columns
 * @returns {ReadonlyArray<number>} the columns, ascending, `start` first and `end` last
 */
export const columnsOf = (
  channel: Channel,
  pitch: number = DEFAULT_PITCH,
): ReadonlyArray<number> => {
  const width = channel.end - channel.start;
  if (!(width > EPSILON)) return [channel.start];
  if (!(pitch > EPSILON)) return [channel.start, channel.end];
  const columns = [channel.start];
  for (let away = pitch; away < width - EPSILON; away += pitch) {
    columns.push(channel.start + away);
  }
  columns.push(channel.end);
  return columns;
};

/**
 * A lattice over one channel, and the routes drawn on it so far. The path minimises
 * `length + bends·wBend + reused·wReuse + crossings·wCross` over moves right, up, down and (with eight directions) the two
 * 45° diagonals, never left, so a path is monotone in x and crosses the boundary between its ends once.
 *
 * `reused` is the number of routes already drawn through the same lattice edge, so the k-th line through a tile pays
 * `wReuse·(k−1)`; `crossings` counts the routes already drawn in this channel whose segments the move cuts. Ties are broken by
 * column and then row, so the same graph draws the same words twice.
 *
 * @param {Channel} channel the strip, from the left layer's right borders to the right layer's left edges
 * @param {ReadonlyArray<number>} rows the drawing's rows, ascending: every slot's height and a uniform pitch
 * @param {LatticeOptions} options the direction set and the weights
 * @returns {LatticeGrid} the lattice, ready to route the channel's edges shortest first
 */
export const latticeOf = (
  channel: Channel,
  rows: ReadonlyArray<number>,
  options: LatticeOptions = {},
): LatticeGrid => {
  const pitch = options.pitch ?? DEFAULT_PITCH;
  const wBend = options.bend ?? DEFAULT_BEND;
  const wReuse = options.reuse ?? DEFAULT_REUSE;
  const wCross = options.crossing ?? DEFAULT_CROSSING;
  const diagonal = (options.directions ?? 4) === 8;
  const columns = columnsOf(channel, pitch);
  const rowList = [...new Set(rows)].sort((one, two) => one - two);
  const columnIndex = new Map(columns.map((x, at) => [x, at]));
  const rowIndex = new Map(rowList.map((y, at) => [y, at]));
  const across = columns.length;
  const down = rowList.length;
  const nodes = across * down;
  const states = nodes * 5;

  const nearestRow = (y: number): number | undefined => {
    const exact = rowIndex.get(y);
    if (exact !== undefined) return exact;
    let low = 0;
    let high = down - 1;
    while (low <= high) {
      const middle = (low + high) >> 1;
      const value = rowList[middle] ?? 0;
      if (Math.abs(value - y) <= ROW_TOLERANCE) return middle;
      if (value < y) low = middle + 1;
      else high = middle - 1;
    }
    return undefined;
  };

  const xOf = (col: number): number => columns[col] ?? channel.start;
  const yOf = (row: number): number => rowList[row] ?? 0;

  const used = new Map<number, number>();
  const segments: Array<readonly [number, number, number, number]> = [];
  const crossed = new Map<number, number>();
  const checked = new Map<number, number>();

  const edgeKey = (one: number, two: number): number =>
    one < two ? one * nodes + two : two * nodes + one;

  const crossingsOf = (key: number, ax: number, ay: number, bx: number, by: number): number => {
    let at = checked.get(key) ?? 0;
    let count = crossed.get(key) ?? 0;
    for (; at < segments.length; at += 1) {
      const segment = segments[at];
      if (segment === undefined) continue;
      if (crosses(ax, ay, bx, by, segment[0], segment[1], segment[2], segment[3])) count += 1;
    }
    checked.set(key, at);
    crossed.set(key, count);
    return count;
  };

  const commit = (points: ReadonlyArray<LatticePoint>): void => {
    for (let at = 1; at < points.length; at += 1) {
      const from = points[at - 1];
      const to = points[at];
      if (from === undefined || to === undefined) continue;
      const colOne = columnIndex.get(from.x);
      const colTwo = columnIndex.get(to.x);
      const rowOne = nearestRow(from.y);
      const rowTwo = nearestRow(to.y);
      if (colOne === undefined || colTwo === undefined) continue;
      if (rowOne === undefined || rowTwo === undefined) continue;
      const one = colOne * down + rowOne;
      const two = colTwo * down + rowTwo;
      if (one === two) continue;
      const key = edgeKey(one, two);
      used.set(key, (used.get(key) ?? 0) + 1);
      segments.push([from.x, from.y, to.x, to.y]);
    }
  };

  const path = (from: LatticePoint, to: LatticePoint): ReadonlyArray<LatticePoint> => {
    const startCol = columnIndex.get(from.x) ?? 0;
    const goalCol = columnIndex.get(to.x) ?? across - 1;
    const startRow = nearestRow(from.y);
    const goalRow = nearestRow(to.y);
    if (startRow === undefined || goalRow === undefined) return [from, to];
    if (startCol === goalCol) {
      return from.y === to.y ? [from, to] : [from, { x: xOf(goalCol), y: yOf(goalRow) }];
    }

    const distance = new Float64Array(states).fill(Number.POSITIVE_INFINITY);
    const previous = new Int32Array(states).fill(-1);
    const heap: number[] = [];
    const scores: number[] = [];
    const start = (startCol * down + startRow) * 5 + NONE;
    const goalY = yOf(goalRow);
    const goalX = xOf(goalCol);

    const heuristic = (x: number, y: number): number => {
      const dx = Math.max(0, goalX - x);
      const dy = Math.abs(goalY - y);
      return diagonal ? Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy) : dx + dy;
    };

    const columnOf = (state: number): number => Math.floor(state / 5 / down);
    const rowOf = (state: number): number => Math.floor(state / 5) % down;

    const better = (one: number, two: number): boolean => {
      const colOne = columnOf(one);
      const colTwo = columnOf(two);
      if (colOne !== colTwo) return colOne < colTwo;
      const rowOne = rowOf(one);
      const rowTwo = rowOf(two);
      if (rowOne !== rowTwo) return rowOne < rowTwo;
      return one < two;
    };

    const push = (state: number, score: number): void => {
      heap.push(state);
      scores.push(score);
      let at = heap.length - 1;
      while (at > 0) {
        const parent = (at - 1) >> 1;
        const parentScore = scores[parent] ?? 0;
        if (
          parentScore < score ||
          (parentScore === score && !better(heap[at] ?? 0, heap[parent] ?? 0))
        )
          break;
        [heap[at], heap[parent]] = [heap[parent] ?? 0, heap[at] ?? 0];
        [scores[at], scores[parent]] = [parentScore, score];
        at = parent;
      }
    };

    const pop = (): number | undefined => {
      const top = heap[0];
      const lastState = heap.pop();
      const lastScore = scores.pop();
      if (heap.length > 0 && lastState !== undefined && lastScore !== undefined) {
        heap[0] = lastState;
        scores[0] = lastScore;
        let at = 0;
        for (;;) {
          const left = at * 2 + 1;
          const right = left + 1;
          let smallest = at;
          const smallestScore = scores[smallest] ?? 0;
          if (left < heap.length) {
            const leftScore = scores[left] ?? 0;
            if (
              leftScore < smallestScore ||
              (leftScore === smallestScore && better(heap[left] ?? 0, heap[smallest] ?? 0))
            )
              smallest = left;
          }
          if (right < heap.length) {
            const rightScore = scores[right] ?? 0;
            const bestScore = scores[smallest] ?? 0;
            if (
              rightScore < bestScore ||
              (rightScore === bestScore && better(heap[right] ?? 0, heap[smallest] ?? 0))
            )
              smallest = right;
          }
          if (smallest === at) break;
          [heap[at], heap[smallest]] = [heap[smallest] ?? 0, heap[at] ?? 0];
          [scores[at], scores[smallest]] = [scores[smallest] ?? 0, scores[at] ?? 0];
          at = smallest;
        }
      }
      return top;
    };

    distance[start] = 0;
    push(start, heuristic(xOf(startCol), yOf(startRow)));

    while (heap.length > 0) {
      const state = pop();
      if (state === undefined) break;
      const col = columnOf(state);
      const row = rowOf(state);
      const direction = state % 5;
      if (col === goalCol && row === goalRow) {
        const points: LatticePoint[] = [];
        let at = state;
        while (at !== -1) {
          points.push({ x: xOf(columnOf(at)), y: yOf(rowOf(at)) });
          at = previous[at] ?? -1;
        }
        points.reverse();
        return points;
      }
      const x = xOf(col);
      const y = yOf(row);
      const base = distance[state] ?? 0;

      const step = (nextCol: number, nextRow: number, kind: number, length: number): void => {
        const next = (nextCol * down + nextRow) * 5 + kind;
        const one = col * down + row;
        const two = nextCol * down + nextRow;
        const key = edgeKey(one, two);
        const bend = direction === NONE || direction === kind ? 0 : wBend;
        const reuse = (used.get(key) ?? 0) * wReuse;
        const cross = crossingsOf(key, x, y, xOf(nextCol), yOf(nextRow)) * wCross;
        const g = base + length + bend + reuse + cross;
        if (g >= (distance[next] ?? Number.POSITIVE_INFINITY)) return;
        distance[next] = g;
        previous[next] = state;
        push(next, g + heuristic(xOf(nextCol), yOf(nextRow)));
      };

      if (col + 1 < across) {
        step(col + 1, row, 0, xOf(col + 1) - x);
      }
      if (row > 0) {
        step(col, row - 1, 1, y - yOf(row - 1));
      }
      if (row + 1 < down) {
        step(col, row + 1, 1, yOf(row + 1) - y);
      }
      if (diagonal) {
        for (let away = 1; col + away < across; away += 1) {
          const dx = xOf(col + away) - x;
          for (const sign of [1, -1]) {
            const target = nearestRow(y + sign * dx);
            if (target === undefined) continue;
            step(col + away, target, sign > 0 ? 2 : 3, dx * Math.SQRT2);
          }
        }
      }
    }
    return [from, { x: goalX, y: goalY }];
  };

  return { columns, rows: rowList, path, commit };
};
