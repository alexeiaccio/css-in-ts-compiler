// Motion tracks: Rune's model, a spring from SwiftUI's (duration, bounce) and a decay for scroll physics. The clock is
// passed in (seconds); nothing here reads the time, so a headless frame at dt = 1/60 and a window frame at the real dt
// take the same path and a test can ask for any instant. Two classes, as Rune has them: `spatial` may overshoot, `effect`
// (colour, opacity) is clamped and critically damped even when a bounce is asked for.
//
// A spring is the analytic solution of the damped oscillator, so it is exact at any time and frame-rate independent: no
// integration, no accumulated error. `ω = 2π / duration`, `ζ = 1 - bounce`; the displacement d = x - target obeys
// d'' + 2ζω d' + ω² d = 0. A track holds one segment `{x0, v0, target, t0, spring}`; a retarget samples the presented
// (x, v) first, so position and velocity are continuous across it. The settle rule snaps exactly: within 0.5px and
// 0.5px/s of the target the value is the target and the velocity 0, which is Rune's 1/64px idea without the grid.
//
// A decay is a fling: v(t) = v0·r^t with r = 0.998 per millisecond, iOS's normal deceleration. In the script's seconds
// that is v0·e^(-kt), k = -1000·ln r ≈ 2.002, and x(t) = x0 + v0·(1 - e^(-kt))/k, so it stops at v0/k and `project()` is
// where it lands. It stops when |v| < 5px/s and snaps to the projection, the fraction of a pixel a mouse would not see.
//
// Not here: a rubber band (Rune's 0.55), a velocity-only track for a drag (a pointer's speed is the host's), reduced
// motion, and a value channel for anything but the style a page already packs (a page passes the value to ui.scrollTo or
// into its own draw; a style is a compile-time literal and cannot be animated yet).

/** A spring's parameters: the natural frequency and damping ratio, and whether its output may overshoot. */
export interface Spring {
  readonly duration: number; // seconds; ω = 2π / duration
  readonly bounce: number; // 0 critically damped, > 0 springs past the target
  readonly omega: number;
  readonly zeta: number;
  readonly clamp: boolean; // `effect`: never leaves the start..target range
}

/** The default of Rune's tracks: 0.35s, no bounce. */
export const spatial = (duration = 0.35, bounce = 0): Spring => {
  const z = Math.min(Math.max(1 - bounce, 0), 2);
  return { duration, bounce, omega: (2 * Math.PI) / Math.max(duration, 1e-3), zeta: z, clamp: false };
};

/** The effect class: critically damped (a bounce is ignored) and clamped, so an opacity or a colour cannot overshoot. */
export const effect = (duration = 0.35): Spring => ({
  duration,
  bounce: 0,
  omega: (2 * Math.PI) / Math.max(duration, 1e-3),
  zeta: 1,
  clamp: true,
});

/** Where a track is at an instant: the value, its velocity and whether it has settled (then x is exactly the target). */
export interface Sample {
  readonly x: number;
  readonly v: number;
  readonly done: boolean;
}

const EPS = 0.5; // px
const EPS_V = 0.5; // px/s

/** The displacement and velocity of a damped oscillator t seconds after (d0, v0), from rest at the target. */
function solve(spring: Spring, d0: number, v0: number, t: number): { d: number; v: number } {
  const { omega: w, zeta: z } = spring;
  const envelope = Math.exp(-z * w * t);
  if (z < 1 - 1e-4) {
    // under-damped: a decaying sinusoid
    const wd = w * Math.sqrt(1 - z * z);
    const a = d0;
    const b = (v0 + z * w * d0) / wd;
    const cos = Math.cos(wd * t);
    const sin = Math.sin(wd * t);
    return {
      d: envelope * (a * cos + b * sin),
      v: envelope * ((-z * w * a + b * wd) * cos + (-z * w * b - a * wd) * sin),
    };
  }
  if (z > 1 + 1e-4) {
    // over-damped: two real roots, both negative
    const a = w * Math.sqrt(z * z - 1);
    const r1 = -z * w + a;
    const r2 = -z * w - a;
    const c1 = (v0 - r2 * d0) / (r1 - r2);
    const c2 = d0 - c1;
    const e1 = Math.exp(r1 * t);
    const e2 = Math.exp(r2 * t);
    return { d: c1 * e1 + c2 * e2, v: r1 * c1 * e1 + r2 * c2 * e2 };
  }
  // critically damped: d = e^(-ωt)(d0 + (v0 + ω d0)t)
  const b = v0 + w * d0;
  return { d: envelope * (d0 + b * t), v: envelope * (v0 - w * b * t) };
}

/** A spring segment: it starts at (x0, v0) at t0 and runs towards `target`. */
export class Track {
  x0: number;
  v0: number;
  target: number;
  t0: number;
  spring: Spring;

  constructor(x: number, spring: Spring = spatial(), t0 = 0) {
    this.x0 = x;
    this.v0 = 0;
    this.target = x;
    this.t0 = t0;
    this.spring = spring;
  }

  /** The value and velocity at t (seconds). Settled means the value is exactly the target and the velocity 0. */
  at(t: number): Sample {
    const dt = Math.max(0, t - this.t0);
    const { d, v } = solve(this.spring, this.x0 - this.target, this.v0, dt);
    let x = this.target + d;
    let vv = v;
    if (this.spring.clamp) {
      const lo = Math.min(this.x0, this.target);
      const hi = Math.max(this.x0, this.target);
      if (x < lo || x > hi) (x = x < lo ? lo : hi), (vv = 0);
    }
    if (Math.abs(x - this.target) < EPS && Math.abs(vv) < EPS_V) return { x: this.target, v: 0, done: true };
    return { x, v: vv, done: false };
  }

  /** Starts a new segment at t from the presented (x, v), so the value and the velocity are continuous. */
  retarget(t: number, target: number, spring?: Spring): void {
    const p = this.at(t);
    this.x0 = p.x;
    this.v0 = p.v;
    this.target = target;
    this.t0 = t;
    if (spring) this.spring = spring;
  }
}

/** A track starting at x at rest, its target x. */
export const track = (x: number, spring?: Spring, t0 = 0): Track => new Track(x, spring, t0);

/** iOS's normal deceleration, r = 0.998 per millisecond, as a rate per second. */
const RATE = -Math.log(0.998) * 1000;
const STOP = 5; // px/s

/** A fling: exponential decay from (x0, v0) at t0, stopping when the velocity is below 5px/s. */
export class Decay {
  x0: number;
  v0: number;
  t0: number;

  constructor(x: number, v: number, t0 = 0) {
    this.x0 = x;
    this.v0 = v;
    this.t0 = t0;
  }

  /** Where the fling would land if it ran out: x0 + v0 / k. */
  project(): number {
    return this.x0 + this.v0 / RATE;
  }

  at(t: number): Sample {
    const dt = Math.max(0, t - this.t0);
    const v = this.v0 * Math.exp(-RATE * dt);
    if (Math.abs(this.v0) <= STOP || Math.abs(v) < STOP) return { x: this.project(), v: 0, done: true };
    return { x: this.x0 + (this.v0 * (1 - Math.exp(-RATE * dt))) / RATE, v, done: false };
  }
}

/** A fling from x moving at v px/s (positive to the right or down) at t0. */
export const decay = (x: number, v: number, t0 = 0): Decay => new Decay(x, v, t0);
