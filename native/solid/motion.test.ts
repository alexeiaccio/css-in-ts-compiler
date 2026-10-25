// The motion model, without a page: the spring's analytic solution (one path at any dt), a retarget that keeps x and v
// continuous, the settle rule's exact snap, the effect class's clamp, the decay's projection, presence (a node that
// leaves stays mounted for its exit), the value channel's one call an element, and reduced motion. Plain bun, no Clay.
import assert from "node:assert/strict";

import { channel, decay, effect, presence, reduced, setReducedMotion, spatial, track } from "./src/motion.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;
const DT = 1 / 60;

// --- frame-rate independence: the analytic solution is a function of the time, not of the steps taken to it
{
  const t = track(0, spatial());
  t.target = 100;
  t.retarget(0, 100);
  const one = t.at(0.0166);
  const two = t.at(0.0083 + 0.0083);
  assert.ok(close(one.x, two.x) && close(one.v, two.v), `16.6ms ${one.x} != two 8.3ms ${two.x}`);
  // a second track stepped at 8.3ms and sampled at the end has the same value as the one sampled at 16.6ms
  const stepped = track(0, spatial());
  stepped.retarget(0, 100);
  let clock = 0;
  let x = 0;
  for (const dt of [0.0083, 0.0083]) x = stepped.at((clock += dt)).x;
  assert.ok(close(one.x, x), `stepped ${x} != seek ${one.x}`);
}

// --- a retarget at an arbitrary time keeps x and v continuous: the left and right limits both meet at the sample
{
  const t = track(0, spatial(0.35, 0.2));
  t.retarget(0, 120);
  const at = 0.123;
  const before = t.at(at);
  const left = t.at(at - 1e-7);
  t.retarget(at, -40);
  const after = t.at(at);
  const right = t.at(at + 1e-7);
  assert.equal(after.x, before.x);
  assert.ok(close(after.v, before.v), `velocity ${after.v} != ${before.v} at the retarget`);
  assert.ok(close(left.x, before.x, 1e-4) && close(right.x, before.x, 1e-4), "a step at the retarget");
  assert.ok(close(left.v, before.v, 0.05) && close(right.v, before.v, 0.05), "a velocity step at the retarget");
}

// --- the settle rule: finite time, and the value is exactly the target with velocity 0
{
  const t = track(0, spatial());
  t.retarget(0, 100);
  let frames = 0;
  let s = t.at(0);
  while (!s.done && frames < 600) s = t.at((frames += 1) * DT);
  assert.ok(s.done && frames < 600, `did not settle in 10s (${s.x})`);
  assert.equal(s.x, 100);
  assert.equal(s.v, 0);
  assert.ok(close(t.at(1e6).x, 100), "settled after the end");
}

// --- the two classes: spatial may overshoot (bounce), effect never leaves the start..target range and ignores a bounce
{
  const spatialTrack = track(0, spatial(0.35, 0.6));
  spatialTrack.retarget(0, 100);
  let peak = 0;
  for (let i = 1; i <= 120; i++) peak = Math.max(peak, spatialTrack.at(i * DT).x);
  assert.ok(peak > 101, `spatial did not overshoot: ${peak}`);

  const fx = effect(0.2);
  assert.equal(fx.bounce, 0);
  assert.equal(fx.zeta, 1);
  const e = track(0, fx);
  e.v0 = 900; // an impulse that would overshoot a clamped spring
  e.target = 100;
  let max = 0;
  let min = 0;
  for (let i = 1; i <= 300; i++) {
    const x = e.at(i * DT).x;
    max = Math.max(max, x);
    min = Math.min(min, x);
  }
  assert.ok(min >= 0 && max <= 100, `effect left its range: ${min}..${max}`);
}

// --- the three regimes: an over-damped spring (a negative bounce) approaches without ever passing the target
{
  const o = track(0, spatial(0.35, -0.5));
  assert.equal(o.spring.zeta, 1.5);
  o.retarget(0, 100);
  let peak = 0;
  let s = o.at(0);
  for (let i = 1; i <= 120; i++) {
    s = o.at(i * DT);
    peak = Math.max(peak, s.x);
  }
  assert.ok(peak <= 100 + 1e-9, `over-damped overshot: ${peak}`);
  assert.ok(s.x > 99, `over-damped did not approach: ${s.x}`);
}

// --- the decay: monotonic, and its projection is exactly where it lands
{
  const d = decay(0, 600);
  let last = d.at(0).x;
  let done = false;
  for (let i = 1; i <= 600; i++) {
    const s = d.at(i * DT);
    assert.ok(s.x >= last - 1e-9, `not monotonic at ${i}: ${s.x} < ${last}`);
    last = s.x;
    done = s.done;
  }
  assert.ok(done, "the decay did not stop");
  assert.equal(d.at(30).x, d.project());
  assert.ok(close(d.project(), 600 / -Math.log(0.998) / 1000, 1e-6), `projection ${d.project()}`);
  // and backwards for a negative velocity
  const up = decay(100, -600);
  assert.ok(up.at(30).x === up.project() && up.project() < 100, "a negative fling lands below its start");
}

// --- a retarget mid-flight into the other direction: no jump, and it moves back
{
  const t = track(0, spatial());
  t.retarget(0, 200);
  const before = t.at(0.1);
  t.retarget(0.1, -200);
  const first = t.at(0.1 + DT);
  // it carries the forward velocity, so the first frame is still forward; the step is no larger than the one before it
  assert.ok(first.x - before.x <= before.v * DT + 1e-6, "the retarget added a jump");
  assert.ok(first.v < before.v, "the spring did not pull the velocity back");
  let s = first;
  for (let i = 2; i < 120; i++) s = t.at(0.1 + i * DT);
  assert.ok(s.x < 0 && close(t.at(20).x, -200), `did not come back: ${s.x}`);
}

// --- presence: a node that leaves stays mounted while its exit runs, then unmounts; it comes back when the node does
{
  const p = presence(true, 0.25);
  assert.deepEqual(p.update(true, DT), { mounted: true, closing: false });
  const edge = p.update(false, DT);
  assert.deepEqual(edge, { mounted: true, closing: true }, "the falling edge keeps the node mounted and closing");
  let drawn = 1; // the frame it closes on is drawn at the start of the exit
  let s = p.update(false, DT);
  while (s.mounted) (drawn++, (s = p.update(false, DT)));
  // the exit is 0.25s, to a frame: fifteen frames at 1/60, plus the frame it closes on
  assert.ok(Math.abs(drawn * DT - 0.25) <= DT + 1e-9, `the exit is 0.25s, to a frame: ${drawn} frames`);
  assert.deepEqual(p.update(false, DT), { mounted: false, closing: false }, "stays unmounted");
  assert.deepEqual(p.update(true, DT), { mounted: true, closing: false }, "a mount is mounted, not closing");

  // an exit of no time at all is no exit
  const zero = presence(true, 0);
  assert.deepEqual(zero.update(false, DT), { mounted: false, closing: false });

  // a node that was never in the tree reports nothing to close
  const never = presence(false, 0.25);
  assert.deepEqual(never.update(false, DT), { mounted: false, closing: false });
}

// --- a revive mid-exit: the presence stops closing at once and a track retargeted there presents the exit's own value
// (a jump would be the entry, 14px away)
{
  const exit = track(0, spatial(0.2, 0));
  const revive = track(0, spatial(0.2, 0));
  exit.retarget(0, 14, spatial(0.2, 0));
  revive.retarget(0, 14, spatial(0.2, 0));
  const p = presence(true, 0.25);
  p.update(true, DT);
  assert.deepEqual(p.update(false, DT), { mounted: true, closing: true }, "the exit starts");
  const at = 4 * DT;
  const was = exit.at(at);
  assert.ok(was.x > 2 && !was.done, `four frames in the exit is underway (${was.x})`);
  assert.deepEqual(p.update(true, DT), { mounted: true, closing: false }, "a revive is not closing, and does not remount");
  const before = revive.at(at);
  revive.retarget(at, 0, spatial(0.2, 0));
  const now = revive.at(at);
  assert.equal(now.x, before.x, "the revive is where the exit presented it");
  assert.equal(now.x, was.x, "... which is the exit's value at that instant");
  assert.ok(close(now.v, was.v), `the velocity carries over: ${now.v} != ${was.v}`);
  // and it goes back to the rest it was revived to
  assert.ok(close(revive.at(at + 10).x, 0, 1e-9), `it came back: ${revive.at(at + 10).x}`);
}

// --- the channel: one call per element writes its fields at t, a number written as it is (a flag for the length of an
// exit), the value of a track as its presented x
{
  const wrote: [string, number, number][] = [];
  const write = channel((id, field, v) => wrote.push([new TextDecoder().decode(id), field, v]));
  const y = track(0, spatial(0.2));
  y.retarget(0, 10);
  write(new Uint8Array([1, 2]), DT, [39, y], [45, 0], [43, 1]);
  assert.deepEqual(
    wrote.map(([id, field]) => [id, field]),
    [["\u0001\u0002", 39], ["\u0001\u0002", 45], ["\u0001\u0002", 43]],
  );
  assert.equal(wrote[0]![2], y.at(DT).x);
  assert.deepEqual([wrote[1]![2], wrote[2]![2]], [0, 1]);
}

// --- reduced motion: a retarget lands on its target in the same call with v = 0, a presence unmounts at once, and a
// zero-duration presence is the same without the flag
{
  assert.equal(reduced(), false);
  setReducedMotion(true);
  assert.equal(reduced(), true);
  const t = track(0, spatial());
  t.retarget(0, 100);
  assert.deepEqual(t.at(0), { x: 100, v: 0, done: true }, "settled on the frame of the retarget");
  assert.equal(t.at(10).x, 100, "and it stays there");
  // a velocity a bounce left does not carry into the new segment
  const u = track(0, spatial());
  u.retarget(0, 50);
  u.v0 = 900;
  u.retarget(0.1, 10);
  assert.deepEqual(u.at(0.1), { x: 10, v: 0, done: true });

  const p = presence(true, 0.25);
  p.update(true, DT);
  assert.deepEqual(p.update(false, DT), { mounted: false, closing: false }, "no frame with the node on its way out");
  assert.deepEqual(p.update(true, DT), { mounted: true, closing: false }, "and it mounts at once");

  setReducedMotion(false);
  const q = presence(true, 0.25);
  assert.deepEqual(q.update(false, DT), { mounted: true, closing: true }, "with the flag off the exit is back");
}

console.log("solid/motion.test.ts: the spring at any dt, a continuous retarget, the exact settle, spatial vs effect, the decay's projection, presence, a revive mid-exit, the channel, reduced motion");
