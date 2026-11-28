export const TOLERANCE = 1e-9;

export const segmentsOf = (points) =>
  points.slice(1).map((to, index) => {
    const from = points[index];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const horizontal = dy === 0;
    const vertical = dx === 0;
    const diagonal = Math.abs(Math.abs(dx) - Math.abs(dy)) < TOLERANCE;
    return {
      from,
      to,
      dx,
      dy,
      horizontal,
      vertical,
      diagonal,
      kind: horizontal ? "H" : vertical ? "V" : diagonal ? "D" : "?",
    };
  });

export const bendsOf = (segments) =>
  segments.slice(1).filter((segment, index) => segment.kind !== segments[index].kind).length;

const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

const within = (a, b, c) =>
  c.x > Math.min(a.x, b.x) &&
  c.x < Math.max(a.x, b.x) &&
  c.y > Math.min(a.y, b.y) &&
  c.y < Math.max(a.y, b.y);

export const crossingOf = (one, two) => {
  const d1 = cross(one.from, one.to, two.from);
  const d2 = cross(one.from, one.to, two.to);
  const d3 = cross(two.from, two.to, one.from);
  const d4 = cross(two.from, two.to, one.to);
  if (d1 === 0 || d2 === 0 || d3 === 0 || d4 === 0) {
    if (d1 === 0 && within(one.from, one.to, two.from)) return true;
    if (d2 === 0 && within(one.from, one.to, two.to)) return true;
    if (d3 === 0 && within(two.from, two.to, one.from)) return true;
    if (d4 === 0 && within(two.from, two.to, one.to)) return true;
    return false;
  }
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
};

export const overlapsOf = (one, two) => {
  if (one.kind !== two.kind) return 0;
  if (one.horizontal && one.from.y === two.from.y) {
    return (
      Math.min(Math.max(one.from.x, one.to.x), Math.max(two.from.x, two.to.x)) -
      Math.max(Math.min(one.from.x, one.to.x), Math.min(two.from.x, two.to.x))
    );
  }
  if (one.vertical && one.from.x === two.from.x) {
    return (
      Math.min(Math.max(one.from.y, one.to.y), Math.max(two.from.y, two.to.y)) -
      Math.max(Math.min(one.from.y, one.to.y), Math.min(two.from.y, two.to.y))
    );
  }
  if (one.diagonal && two.diagonal) {
    const up = (segment) => segment.dy > 0;
    if (up(one) !== up(two)) return 0;
    const line = (segment) =>
      up(segment) ? segment.from.x - segment.from.y : segment.from.x + segment.from.y;
    if (Math.abs(line(one) - line(two)) > TOLERANCE) return 0;
    return (
      Math.min(Math.max(one.from.x, one.to.x), Math.max(two.from.x, two.to.x)) -
      Math.max(Math.min(one.from.x, one.to.x), Math.min(two.from.x, two.to.x))
    );
  }
  return 0;
};

export const throughBox = (segment, box) => {
  const inset = TOLERANCE;
  const left = box.x + inset;
  const right = box.x + box.width - inset;
  const top = box.y + inset;
  const bottom = box.y + box.height - inset;
  if (right <= left || bottom <= top) return false;
  let low = 0;
  let high = 1;
  const clip = (start, delta, minimum, maximum) => {
    if (delta === 0) return start >= minimum && start <= maximum;
    const one = (minimum - start) / delta;
    const two = (maximum - start) / delta;
    low = Math.max(low, Math.min(one, two));
    high = Math.min(high, Math.max(one, two));
    return low < high;
  };
  if (!clip(segment.from.x, segment.dx, left, right)) return false;
  if (!clip(segment.from.y, segment.dy, top, bottom)) return false;
  return low < high;
};

export const spansChannel = (segment, channel) =>
  Math.max(segment.from.x, segment.to.x) > channel.start &&
  Math.min(segment.from.x, segment.to.x) < channel.end;

export const bordersOf = (points, rect) => {
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;
  const hits = [];
  for (const segment of segmentsOf(points)) {
    const { from, to } = segment;
    if (segment.horizontal) {
      for (const x of [rect.x, right]) {
        const low = Math.min(from.x, to.x);
        const high = Math.max(from.x, to.x);
        if (low < x && x < high && from.y > rect.y && from.y < bottom) {
          hits.push(`${x},${from.y}`);
        }
      }
    } else if (segment.vertical) {
      for (const y of [rect.y, bottom]) {
        const low = Math.min(from.y, to.y);
        const high = Math.max(from.y, to.y);
        if (low < y && y < high && from.x > rect.x && from.x < right) {
          hits.push(`${from.x},${y}`);
        }
      }
    }
  }
  return hits;
};
