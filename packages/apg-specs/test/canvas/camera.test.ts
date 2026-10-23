import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { assertReachable, explore, simulate, stateKey } from "@quint-machine/core/testing";
import { describe, expect, it } from "vite-plus/test";
import definitionJson from "../../src/canvas/camera.model.generated.json";

// Spec-only verification for specs/canvas/camera.qnt: the infinite-canvas
// camera (integer fixed point, zoom about an anchor, clamp, tween).
//
// Events come from the spec's own pools, `transition` is stepped, and every
// declared invariant is checked after every step. A second, independent
// implementation in plain TS doubles checks the "exactly comparable to TS
// doubles" claim.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const run = (start: QuintModelValue, events: readonly Record<string, unknown>[]): QuintModelValue =>
  events.reduce(step, start);

const initial = model.initial;

// constants, mirrored from the spec header
const ZONE = 4096n;
const TONE = 256n;
const TZ = ZONE * TONE;
const ZMIN = 256n;
const ZMAX = 32768n;
const WT = 1_000_000n * TONE;

// selector helpers (see the packed pools in the spec)
const pan = (dx: number, dy: number) => ({
  _tag: "pan_by",
  delta: BigInt(dx + 5 * dy),
});
// pan deltas by pool index: 0 -9e6, 1 -400, 2 0, 3 +5, 4 +9e6
const zoomAt = (anchor: number, factor: number) => ({
  _tag: "zoom_at",
  gesture: BigInt(anchor + 4 * factor),
});
// factors: 0 x0.5, 1 x0.75, 2 x1.25, 3 x1.5, 4 x2, 5 x16, 6 x1/16
const zoomLimit = (anchor: number, max: boolean) => ({
  _tag: "zoom_limit",
  limit: BigInt(anchor + (max ? 4 : 0)),
});
const request = (goal: number) => ({
  _tag: "request_tween",
  goal: BigInt(goal),
});
const tick = { _tag: "tween_tick" };
const motion = (reduced: boolean) => ({ _tag: "set_motion", reduced });

const num = (value: unknown): bigint => {
  if (typeof value !== "bigint") {
    throw new Error(`expected bigint, got ${typeof value}`);
  }
  return value;
};
const camera = (state: QuintModelValue) => ({
  tx: num(state["tx"]),
  ty: num(state["ty"]),
  z: num(state["z"]),
});

// independent reference: the same math in plain doubles
const fdivD = (a: number, b: number) => Math.floor(a / b);
const rdivD = (a: number, b: number) => fdivD(2 * a + b, 2 * b);
const clampD = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
const refAnchored = (t: number, z: number, z2: number, s: number) =>
  clampD(t + rdivD(s * 2 ** 20, z2) - rdivD(s * 2 ** 20, z), -Number(WT), Number(WT));
const refPan = (t: number, z: number, d: number) =>
  clampD(t + rdivD(d * 2 ** 20, z), -Number(WT), Number(WT));

describe("canvas camera (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "ViewportInRange",
      "ZoomInRange",
      "OriginInBound",
      "TweenEndpointsValid",
      "ScreenWorldRoundTrip",
      "AnchorFixed",
      "TweenFollowsLerp",
      "RestIsOnTarget",
      "ReducedMotionNeverTweens",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    const bad = (patch: Record<string, unknown>) =>
      violatedInvariants(model, { ...initial, ...patch } as QuintModelValue);

    const at = (zoom: bigint) => ({ z: zoom, sz: zoom, tz: zoom });
    expect(bad({ vw: 0n })).toEqual(["ViewportInRange"]);
    // z = 0 would divide by zero in screenToWorld: not invertible
    expect(bad(at(0n))).toEqual(["ZoomInRange", "TweenEndpointsValid", "ScreenWorldRoundTrip"]);
    expect(bad(at(ZMAX + 1n))).toEqual(["ZoomInRange", "TweenEndpointsValid"]);
    expect(bad({ tx: WT + 1n, ttx: WT + 1n, stx: WT + 1n })).toEqual([
      "OriginInBound",
      "TweenEndpointsValid",
    ]);
    // a zoom the camera cannot invert on whole pixels: far beyond TZ / 2
    expect(bad(at(3_145_728n))).toContain("ScreenWorldRoundTrip");
    // a drifting clamp: the anchor's world point moved by 500 fp (about 2 units)
    expect(bad({ anch: true, asx: 400n, awx: 400n * TONE + 500n })).toEqual(["AnchorFixed"]);
    // at rest but not on the target
    expect(bad({ ttx: 100n })).toEqual(["RestIsOnTarget"]);
    // a running tween whose camera is not the interpolation of start -> target
    expect(bad({ active: true, tp: 1n, ttx: 1024n, tx: 7n })).toEqual(["TweenFollowsLerp"]);
    expect(bad({ rm: true, active: true, tp: 0n })).toEqual(["ReducedMotionNeverTweens"]);
  });

  it("starts at rest at 100% with the origin at world (0, 0)", () => {
    expect(initial).toMatchObject({
      vw: 800n,
      vh: 600n,
      tx: 0n,
      ty: 0n,
      z: ZONE,
      active: false,
      tp: 4n,
    });
  });

  it("zoom about an anchor keeps the anchor world point (centre, x2)", () => {
    // anchor 1 = viewport centre (400, 300); factor 4 = x2
    const state = step(initial, zoomAt(1, 4));
    expect(state).toMatchObject({
      z: 8192n,
      tx: -51_200n,
      ty: -38_400n,
      anch: true,
      asx: 400n,
      asy: 300n,
      awx: 400n * TONE,
      awy: 300n * TONE,
    });
  });

  it("a limit clamp re-anchors instead of drifting", () => {
    // x16 from 100% asks for 65536 but ZMAX is 32768; anchor 2 = bottom-right
    const state = step(initial, zoomAt(2, 5));
    expect(state["z"]).toBe(ZMAX);
    // the anchor still sits at the same world point (re-anchored for the CLAMPED zoom)
    const s = 800n;
    const world = (s * TZ + ZMAX / 2n) / ZMAX - num(state["tx"]);
    expect(world).toBe(800n * TONE);
    // a drifting implementation would solve t with the unclamped request
    const naive = 0n + (s * TZ + 32_768n) / 65_536n - (s * TZ + 2048n) / 4096n;
    expect(naive).not.toBe(state["tx"]);
  });

  it("zooming past a limit that is already reached changes nothing", () => {
    const atMax = step(initial, zoomLimit(1, true));
    expect(atMax["z"]).toBe(ZMAX);
    const again = step(atMax, zoomAt(3, 4));
    expect(camera(again)).toEqual(camera(atMax));
    const atMin = step(initial, zoomLimit(0, false));
    expect(atMin["z"]).toBe(ZMIN);
    expect(camera(step(atMin, zoomAt(2, 6)))).toEqual(camera(atMin));
  });

  it("pan moves the content with the pointer; a huge pan pins the origin at the world bound", () => {
    // +5 px right at 100% = 5 world units = 1280 fp
    const moved = step(initial, pan(3, 2));
    expect(moved).toMatchObject({ tx: 1280n, ty: 0n });
    // a 9e6 px pan reaches far past +-1e6 units: clamped, never beyond
    const pinned = step(initial, pan(4, 0));
    expect(pinned["tx"]).toBe(WT);
    // zoom out about the centre at the bound: the origin stays pinned, the anchor invariant relaxes
    const zoomedOut = step(pinned, zoomAt(1, 0));
    expect(zoomedOut["tx"]).toBe(WT);
    expect(zoomedOut["anch"]).toBe(true);
  });

  it("resize keeps the top-left fixed", () => {
    const panned = step(step(initial, pan(3, 3)), zoomAt(1, 3));
    const resized = step(panned, { _tag: "resize", vp: 3n });
    expect(resized).toMatchObject({ vw: 1920n, vh: 1080n });
    expect(camera(resized)).toEqual(camera(panned));
  });

  it("a tween request starts a tween; four ticks land exactly on the target", () => {
    let state = step(initial, request(5)); // kind 1 = zoom to ZMAX, anchor 1 = centre
    expect(state).toMatchObject({ active: true, tp: 0n, z: ZONE });
    const zooms: bigint[] = [num(state["z"])];
    for (let i = 0; i < 4; i += 1) {
      state = step(state, tick);
      zooms.push(num(state["z"]));
    }
    expect(state).toMatchObject({ active: false, tp: 4n, z: ZMAX, tz: ZMAX });
    expect(zooms).toEqual([4096n, 11_264n, 18_432n, 25_600n, 32_768n]);
    // ticking at rest is a no-op
    expect(step(state, tick)).toEqual(state);
  });

  it("tweened and instant moves end in the same state (every goal, several starts)", () => {
    const starts = [
      initial,
      run(initial, [pan(3, 3), zoomAt(1, 3)]),
      run(initial, [zoomLimit(3, true), pan(1, 3)]),
      run(initial, [pan(4, 4), { _tag: "resize", vp: 0n }]),
    ];
    for (const start of starts) {
      for (let goal = 0; goal < 16; goal += 1) {
        const animated = run(start, [request(goal), tick, tick, tick, tick]);
        const instant = run(start, [motion(true), request(goal)]);
        expect({ ...animated, rm: false }).toEqual({ ...instant, rm: false });
        // and it equals the one-shot zoom event for the zoom goals
        if (goal < 8) {
          const kind = Math.floor(goal / 4);
          const direct = step(
            start,
            kind === 0 ? zoomLimit(goal % 4, false) : zoomLimit(goal % 4, true),
          );
          expect(camera(instant)).toEqual(camera(direct));
        }
      }
    }
  });

  it("turning reduced motion on mid-tween settles on the same end state", () => {
    const running = run(initial, [request(14), tick]);
    expect(running["active"]).toBe(true);
    const settled = step(running, motion(true));
    const instant = run(initial, [motion(true), request(14)]);
    expect(settled).toEqual(instant);
    // turning it off does not start anything
    expect(step(settled, motion(false))).toMatchObject({
      active: false,
      rm: false,
    });
  });

  it("every in-between camera lies between the start and the target", () => {
    for (let goal = 0; goal < 16; goal += 1) {
      let state = step(run(initial, [pan(3, 3), zoomAt(1, 3)]), request(goal));
      const start = camera(state);
      const target = {
        tx: num(state["ttx"]),
        ty: num(state["tty"]),
        z: num(state["tz"]),
      };
      while (state["active"] === true) {
        state = step(state, tick);
        const now = camera(state);
        for (const axis of ["tx", "ty", "z"] as const) {
          const low = start[axis] < target[axis] ? start[axis] : target[axis];
          const high = start[axis] < target[axis] ? target[axis] : start[axis];
          expect(now[axis] >= low && now[axis] <= high).toBe(true);
        }
      }
    }
  });

  it("a new gesture or a cancel stops the tween where the camera is", () => {
    for (const gesture of [
      pan(3, 3),
      zoomAt(0, 1),
      zoomLimit(2, false),
      { _tag: "cancel_tween" },
    ]) {
      const running = run(initial, [request(5), tick]);
      expect(running["active"]).toBe(true);
      const stopped = step(running, gesture);
      expect(stopped).toMatchObject({ active: false, tp: 4n });
      expect(stopped["ttx"]).toBe(stopped["tx"]);
      expect(stopped["tz"]).toBe(stopped["z"]);
    }
  });

  it("cancel keeps the in-between camera (it does not jump to the target)", () => {
    const running = run(initial, [request(5), tick, tick]);
    const stopped = step(running, { _tag: "cancel_tween" });
    expect(camera(stopped)).toEqual(camera(running));
    expect(stopped["z"]).not.toBe(ZMAX);
  });

  it("matches an independent TS implementation on doubles (seeded random walk)", () => {
    let seed = 12_345;
    const next = (n: number) => {
      seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
      return seed % n;
    };
    const vws = [320, 800, 1024, 1920, 4096];
    const vhs = [240, 600, 768, 1080, 2160];
    const deltas = [-9_000_000, -400, 0, 5, 9_000_000];
    const factors = [2048, 3072, 5120, 6144, 8192, 65_536, 256];
    for (let walk = 0; walk < 20; walk += 1) {
      let state = initial;
      const ref = { tx: 0, ty: 0, z: 4096, vw: 800, vh: 600 };
      const anchorAt = (a: number) => {
        if (a === 0) return { ax: 0, ay: 0 };
        if (a === 1) return { ax: ref.vw / 2, ay: ref.vh / 2 };
        if (a === 2) return { ax: ref.vw, ay: ref.vh };
        return { ax: ref.vw / 4, ay: (3 * ref.vh) / 4 };
      };
      const zoomTo = (z2: number, a: number) => {
        const { ax, ay } = anchorAt(a);
        Object.assign(ref, {
          tx: refAnchored(ref.tx, ref.z, z2, ax),
          ty: refAnchored(ref.ty, ref.z, z2, ay),
          z: z2,
        });
      };
      for (let i = 0; i < 60; i += 1) {
        const kind = next(4);
        if (kind === 0) {
          const d = next(25);
          state = step(state, { _tag: "pan_by", delta: BigInt(d) });
          Object.assign(ref, {
            tx: refPan(ref.tx, ref.z, deltas[d % 5] ?? 0),
            ty: refPan(ref.ty, ref.z, deltas[Math.floor(d / 5)] ?? 0),
          });
        } else if (kind === 1) {
          const g = next(28);
          state = step(state, { _tag: "zoom_at", gesture: BigInt(g) });
          const requested = rdivD(ref.z * (factors[Math.floor(g / 4)] ?? 4096), 4096);
          zoomTo(clampD(requested, 256, 32_768), g % 4);
        } else if (kind === 2) {
          const l = next(8);
          state = step(state, { _tag: "zoom_limit", limit: BigInt(l) });
          zoomTo(l < 4 ? 256 : 32_768, l % 4);
        } else {
          const v = next(5);
          state = step(state, { _tag: "resize", vp: BigInt(v) });
          Object.assign(ref, { vw: vws[v] ?? 800, vh: vhs[v] ?? 600 });
        }
        expect({
          tx: Number(state["tx"]),
          ty: Number(state["ty"]),
          z: Number(state["z"]),
          vw: Number(state["vw"]),
          vh: Number(state["vh"]),
        }).toEqual(ref);
      }
    }
  });

  it("every reachable event keeps every invariant (bounded exploration + random walks)", () => {
    const report = explore(model, { maxDepth: 3, maxStates: 6000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(500);
    assertReachable(report, "origin pinned at the world bound", (s) => s["tx"] === WT);
    assertReachable(report, "a tween is running", (s) => s["active"] === true);
    assertReachable(report, "zoom pinned at the limit", (s) => s["z"] === ZMAX);
    assertReachable(report, "an anchored zoom witness", (s) => s["anch"] === true);

    const walks = simulate(model, { runs: 40, maxSteps: 80, seed: 7 });
    expect(walks.violations).toEqual([]);
    expect(walks.states.some((s) => s["active"] === true)).toBe(true);
  });
});
