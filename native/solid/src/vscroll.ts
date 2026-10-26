// A page's own vertical scroll: one motion track (src/motion.ts) owns the offset and the page writes it into Clay's clip
// element every frame, instead of letting Clay's scroll containers move it (`ui.autoScroll(false)`). The wheel accumulates
// 10px notches for the next tick, a burst flings, a press inside the viewport drags it 1:1 (and a press that travels past
// 4px is not a click), and a release hands the speed of the last frames to a decay. Past an end the same `rubber` resists
// wheel and drag, and the band lets go 80ms after the last notch (or at once on a key) and springs back to the clamp.
//
// Sky's feed and the List's viewport are this machine. What stays with a page is where its content ends (its own last box,
// its own padding), its keys, and what a key reveals: Sky moves the offset by 40px a Down, the List moves the selection a
// row and then asks the track for the offset that shows it (the reveal, measured from the content's own place, so it works
// while the track is still travelling). The wheel's 10px, the drag's 1:1 and the band's f(x) are the same on both.
import { ui } from "./ffi.ts";
import { decay, reduced, rubber, spatial, track, type Decay, type Sample, type Spring } from "./motion.ts";

const SPRING = spatial(); // a retarget: 0.35s, no bounce
const BAND_BACK = spatial(0.35, 0.1); // the band lets go with a light bounce, and settles exactly on the clamp
const BAND_HOLD = 0.08; // seconds without a notch before the band lets go
const DRAG_SLOP = 4; // px of travel: past it the press was a drag, and the element under it is not clicked on release
const FLING_FRAMES = 5; // the last frames' positions the release's speed is estimated from
const FLING_MIN = 1 / 120; // s: a span shorter than this is one frame's jitter, not a speed
const BAND_EPS = 0.01; // px: less past an end than this is the clamp's own float noise, not a band

/** A page's scroll over the clip element `id`: the wheel, a drag, a band and a fling on one track. */
export interface Scroll {
  /** The clock the track is given (seconds); a page's other motion can share it, so one frame is one instant. */
  readonly now: number;
  /** The wheel: 10px a notch, accumulated for the next tick (positive down). A horizontal delta moves nothing. */
  wheel(dx: number, dy: number): void;
  /** The page's `onPress` landed inside the viewport: the next pointer call grabs the offset. */
  press(): void;
  /** The host's pointer once a frame: a press inside the viewport grabs the offset, a held pointer drags it, a release
   *  hands it to the fling (or to the band at an end). A press elsewhere leaves it alone. */
  pointer(x: number, y: number, down: boolean): void;
  /** A key's target: retargets the track (animated; at once under reduced motion), clamped, and drops the band and any
   *  fling. */
  seek(to: number): void;
  /** One tick: the wheel and a key retarget, the band lets go, the fling clamps, and the offset goes to Clay. */
  tick(dt: number): void;
  /** Where the track is going, positive down and clamped: what a key's reveal measures from. */
  target(): number;
  /** The pointer holds the offset, and the press travelled past the click threshold (so it is not a click). */
  readonly held: boolean;
  readonly dragged: boolean;
}

/**
 * The scroll of the clip element `id`. `max` is the page's content end this frame, positive down (0 when it fits): the
 * page computes it from its own last box and the viewport, so no rule of it lives here.
 */
export function scroll(id: string, max: () => number): Scroll {
  let anim = track(0, SPRING);
  let fling: Decay | null = null;
  let clock = 0; // seconds, the clock the track and a page's other motion are given
  let notches = 0; // the wheel's notches since the last tick, positive down (a notch is 10px)
  let notchDir = 0; // the last notch's direction: a fling only continues that way
  let burst = 0; // how many notches have come without a tick between them: one notch is a step, two are a flick
  let chasing = false; // the last tick had a notch, so this one decides whether a fling follows
  let target = 0; // where the track is going: the wheel's, clamped, plus the rubber band at an end
  let want = 0; // the wheel's own target before the clamp: past an end it feeds the band
  let band = 0; // raw px past an end (positive past the bottom, negative past the top): 0 is not over-scrolled
  let idle = 0; // seconds since the last notch, for the band's hold
  let maxWas = -1; // the content's clamp last frame: a changed one is a shorter page, and is clamped hard
  let keyed = false;
  // The drag is direct manipulation: a press inside the viewport grabs it, and while the pointer holds it the offset is
  // the press point's offset less the pointer's own travel — no track between them, so a drag lags nothing. Past an end
  // the same `rubber` resists it as the wheel's pull. A press that travels past DRAG_SLOP is a drag and not a click.
  let held = false; // the pointer holds the offset
  let pressed = false; // a press landed inside the viewport (the page's `onPress`), and this frame grabs it
  let dragX = 0; // the offset the pointer presents while it holds the page
  let grabFrom = 0; // the offset when it grabbed, and ...
  let grabX = 0;
  let grabY = 0; // ... the pointer's x and y there: the drag is 1:1 from this pair
  let dragMoved = false; // the press passed DRAG_SLOP: the element under it is not clicked on release
  let trail: { t: number; x: number }[] = []; // the last frames' (clock, offset) while held

  const clamp = (y: number, m: number) => Math.min(Math.max(y, 0), m);

  /** The viewport's height: the rubber band's `d`. */
  const height = () => ui.bounds(Buffer.from(id))?.[3] ?? 0;

  /** Where the wheel's own target sits: clamped to the content, and past an end the band's resistance (`rubber` in
   *  motion.ts, Rune's f(x) = (1 - 1/(x·c/d + 1))·d, c = 0.55). Sets `band` to the raw overscroll it was given. */
  const place = (w: number, m: number): number => {
    const c = clamp(w, m);
    band = reduced() ? 0 : w - c; // reduced motion has no band: the wheel is clamped hard
    return band ? c + Math.sign(band) * rubber(Math.abs(band), height()) : c;
  };

  /** Where the scroll is at t: the drag that holds it, the fling while one runs, the spring otherwise. */
  const presented = (t: number): Sample =>
    held ? { x: dragX, v: 0, done: false } : fling ? fling.at(t) : anim.at(t);

  /** Starts a segment at t from a presented (x, v), so position and velocity are continuous across a retarget. */
  const restart = (p: { x: number; v: number }, t: number, to: number, s: Spring = SPRING) => {
    anim = track(p.x, s, t);
    anim.v0 = p.v;
    anim.retarget(t, to, s); // samples the (x, v) above and starts the new segment from it
    fling = null;
  };

  /** The wheel: 10px a notch, accumulated for the next tick (positive down). */
  const wheel = (_dx: number, dy: number) => {
    if (held) return; // the finger is the offset's: a wheel under it is not a scroll
    const n = -dy;
    if (n) (notches += n), (notchDir = Math.sign(n));
  };

  /** The speed the last frames carry at the release, px/s positive down: the last `FLING_FRAMES` samples' offsets over
   *  their span. A span under `FLING_MIN` is one frame's jitter and not a speed (Rune's rule: no single-sample spikes). */
  const speed = (): number => {
    const last = trail[trail.length - 1];
    const first = trail[Math.max(0, trail.length - FLING_FRAMES)];
    if (!last || !first) return 0;
    const dt = last.t - first.t;
    return dt < FLING_MIN ? 0 : (last.x - first.x) / dt;
  };

  /** The pointer moves the grab: the offset follows it from the press point, resisted at the ends as the wheel is. */
  const dragTo = (x: number, y: number, t: number) => {
    dragX = place(grabFrom - (y - grabY), max());
    if (!dragMoved && Math.hypot(x - grabX, y - grabY) > DRAG_SLOP) dragMoved = true;
    trail.push({ t, x: dragX });
    if (trail.length > FLING_FRAMES) trail.shift();
  };

  /** The release: the drag stops being the offset's owner, and what follows starts from where the finger left it. */
  const release = (x: number, y: number, t: number) => {
    held = false;
    dragTo(x, y, t); // the release's own point counts: the pointer may have moved into it
    const m = max();
    const end = clamp(dragX, m);
    const v = reduced() || !dragMoved || band ? 0 : speed();
    trail = [];
    fling = null;
    if (band) {
      // past an end: the band lets go on the next tick, from where the finger left it, and settles on the clamp
      anim = track(dragX, SPRING, t);
      want = dragX;
      target = end;
      idle = BAND_HOLD;
      return;
    }
    if (!v) {
      // a click (no travel), no speed, or reduced motion: the offset stops where the finger left it, clamped
      anim = track(end, SPRING, t);
      want = target = end;
      return;
    }
    const d = decay(dragX, v, t);
    const raw = d.project();
    const land = clamp(raw, m);
    want = target = land;
    if (land === raw) fling = d;
    else restart({ x: dragX, v }, t, land);
  };

  /** The host's pointer, once a frame: a press inside the viewport grabs it, a held pointer drags the offset, a release
   *  hands it to the fling (or to the band at an end). A press elsewhere leaves it alone. */
  const pointer = (x: number, y: number, down: boolean) => {
    const t = clock;
    if (!down) {
      pressed = false;
      if (held) release(x, y, t);
      return;
    }
    if (pressed) {
      // the press was inside the viewport: grab it where it is, so the frame it lands on shows the offset it had (the
      // sample is taken before `held`, or it would be the last drag's own `dragX`)
      pressed = false;
      const from = clamp(presented(t).x, max());
      held = true;
      grabX = x, grabY = y;
      grabFrom = dragX = from;
      dragMoved = false;
      trail = [{ t, x: dragX }];
      // a glide or a fling under the finger stops, and the band has no hold: the pointer owns the offset from here
      fling = null;
      notches = 0;
      chasing = false;
      keyed = false;
      idle = 0;
      band = 0;
      return;
    }
    if (held) dragTo(x, y, t);
  };

  /** A key's target, as the wheel's own: the track eases to it, it does not jump (and under reduced motion it lands at
   *  once), and it comes back to the content first — a key is not the wheel, so the band lets go. */
  const seek = (to: number) => {
    want = clamp(to, max());
    keyed = true;
  };

  /** One tick: the wheel and the keys retarget, the release may fling, and the value goes to Clay. */
  const tick = (dt: number) => {
    const t = clock;
    const m = max();
    if (held) {
      // the pointer owns the offset: this tick only writes it — a band cannot let go under the finger, and no notch or
      // key retargets the track until the release
      maxWas = m;
      clock += dt;
      if (dragX < -BAND_EPS || dragX > m + BAND_EPS) ui.scrollPut(id, -dragX);
      else ui.scrollTo(id, -dragX);
      return;
    }
    const n = notches;
    notches = 0;
    const key = keyed;
    keyed = false;
    idle = n ? 0 : idle + dt;
    if (!band) want = clamp(want, m);
    target = clamp(target, m);
    // A shorter page (a feed switch) must not leave the offset past the new end — its content would not fill the
    // viewport — so a clamp that moved is hard. A band past an end, and its spring back, are on purpose: those are the
    // tracks'.
    const shrank = Math.abs(m - maxWas) > 0.01;
    maxWas = m;
    const before = presented(t);
    if (shrank && (before.x < 0 || before.x > m)) {
      const x = clamp(before.x, m);
      restart({ x, v: 0 }, t, x);
      target = want = x;
    }
    if (n) {
      burst += Math.abs(n);
      want += n * 10;
      const p = presented(t);
      const to = place(want, m);
      // a notch past an end is a pull of the edge, not a scroll of the content: once the content has arrived at the end
      // it is pushed past (or is already over it), the band is where the wheel puts it on this tick. A notch that only
      // reaches the end while the content is still travelling there is a scroll like any other: a snap would jump it.
      const pull = band !== 0 && (n > 0 ? p.x >= m - 0.5 : p.x <= 0.5);
      target = to;
      if (pull) (anim = track(to, SPRING, t)), (fling = null);
      else {
        restart(p, t, to);
        // a notch from rest starts with the velocity a critically damped spring needs to glide the 10px without
        // overshoot (ω·d): the offset moves on the first frame and each frame after it moves less. A notch during a
        // burst keeps the presented velocity, so the steps grow with the accumulated target.
        if (Math.abs(p.v) < 1) anim.v0 = SPRING.omega * (to - p.x);
      }
      chasing = true;
    } else if (key) {
      // a key drops the band and retargets the same track
      chasing = false;
      burst = 0;
      want = clamp(want, m);
      band = 0;
      target = want;
      restart(presented(t), t, target);
    } else if (chasing) {
      chasing = false;
      const p = anim.at(t);
      // a fling only for a burst (a flick, not one notch) whose presented velocity still follows the wheel — and not at
      // all over an end: a stroke that ends past one is a band's pull, and it lets go on the band's own clock. Reduced
      // motion has no throw either: the notches' own target is where it stops.
      if (!reduced() && !band && burst >= 2 && Math.abs(p.v) > 10 && Math.sign(p.v) === notchDir) {
        const d = decay(p.x, p.v, t);
        const raw = d.project();
        const land = clamp(notchDir > 0 ? Math.max(raw, target) : Math.min(raw, target), m);
        // inside the content: the decay runs to its projection. Past an end (or short of the wheel's target): a spring
        // from the presented (x, v) to the clamped end.
        if (land === raw) (fling = d), (target = land);
        else restart(p, t, land), (target = land);
        // the throw's landing is where the wheel's next notch counts from, as its target always was
        want = land;
      }
      burst = 0;
    } else if (fling) {
      const d = fling.at(t);
      if (d.done) restart({ x: d.x, v: 0 }, t, d.x), (target = want = d.x);
      else if (d.x < 0 || d.x > m) {
        const x = clamp(d.x, m);
        restart({ x, v: 0 }, t, x), (target = want = x);
      }
    }
    // the wheel has stopped past an end: the band lets go, from what it presents, and settles exactly on the clamp
    if (band && !chasing && idle >= BAND_HOLD) {
      want = clamp(want, m);
      band = 0;
      target = want;
      restart(presented(t), t, target, BAND_BACK);
    }
    clock += dt;
    // the offset goes on Clay's clip element: clamped to the content as always, and past an end written as it is (the
    // band's own value, and the first frames of its way back): only the page knows how far past the end it is. The 0.01px
    // is the boundary's own float noise (a clamp the layout computed a hair past): a settled value is written through
    // `scrollTo`, so a page at rest is the exact integer the stored frames have always been.
    const x = presented(clock).x;
    if (x < -BAND_EPS || x > m + BAND_EPS) ui.scrollPut(id, -x);
    else ui.scrollTo(id, -x);
  };

  return {
    get now() {
      return clock;
    },
    wheel,
    press: () => (pressed = true),
    pointer,
    seek,
    tick,
    target: () => clamp(want, max()),
    get held() {
      return held;
    },
    get dragged() {
      return held && dragMoved;
    },
  };
}
