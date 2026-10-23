import {
  type QuintExprData,
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { assertReachable, explore, simulate, stateKey } from "@quint-machine/core/testing";
import { describe, expect, it } from "vite-plus/test";
import cameraJson from "../../src/canvas/camera.model.generated.json";
import definitionJson from "../../src/canvas/pointer.model.generated.json";

// Spec-only verification for specs/canvas/pointer.qnt: the pointer /
// interaction machine (one capture owner, screen-px drag threshold, drag =
// pointerdown snapshot + world delta, marquee contain | overlap, snapping with a
// screen threshold, culling exemptions, announcements as outputs).
//
// Events come from the spec's own pools, `transition` is stepped, and every
// declared invariant is checked after every step.

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
const TONE = 256n;
const WB = 1_000_000n;

// events: `touch` = (pointer id - 1) * 12 + palette position (see the spec header)
// palette: 0-3 on node 0 (0 / 5 / 16 / 25 squared px from 0), 4 nodes 0+1, 5 node 1,
// 6 node 2, 7 empty, 8 node 1, 9-11 empty
const down = (pointer: number, at: number) => ({
  _tag: "down",
  touch: BigInt((pointer - 1) * 12 + at),
});
const move = (pointer: number, at: number) => ({
  _tag: "move",
  touch: BigInt((pointer - 1) * 12 + at),
});
const up = (pointer: number) => ({ _tag: "up", lift: BigInt(pointer) });
const cancel = (pointer: number) => ({
  _tag: "cancel_pointer",
  lost: BigInt(pointer),
});
const shift = (held: boolean) => ({ _tag: "set_shift", held });
const space = (held: boolean) => ({ _tag: "set_space", held });
const snap = (snapping: boolean) => ({ _tag: "set_snap", snapping });
const marqueeMode = (choice: "contain" | "overlap") => ({
  _tag: "set_marquee_mode",
  choice,
});
// zoom levels: 0 ZMIN, 1 x0.5, 2 100%, 3 x2, 4 ZMAX; about the last pointer position
const zoomTo = (level: number) => ({ _tag: "zoom_to", level: BigInt(level) });
const editToggle = { _tag: "toggle_edit" };

const click = (at: number) => [down(1, at), up(1)];

// evaluate any def of the spec against a state, through a probe invariant
const probeOn = (
  json: unknown,
  state: QuintModelValue,
  opcode: string,
  args: readonly number[],
) => {
  const doc = structuredClone(json) as typeof definitionJson;
  (doc.defs as Record<string, unknown>)["Probe"] = {
    kind: "invariant",
    params: [],
    body: {
      kind: "app",
      opcode,
      args: args.map((n) => ({ kind: "int", value: String(n) })),
    },
  };
  const probed = makeReferenceModel(decodeDefinition(doc));
  const probe = probed.invariants.find((invariant) => invariant.name === "Probe");
  if (probe === undefined) {
    throw new Error("probe missing");
  }
  return probe.holds(state);
};
const culled = (state: QuintModelValue, node: number) =>
  probeOn(definitionJson, state, "culled", [node]);

// a copy of the pointer model with one def's body replaced (mutation testing)
const mutated = (name: string, body: QuintExprData) => {
  const doc = structuredClone(definitionJson) as typeof definitionJson;
  const entry = (doc.defs as Record<string, { body: unknown }>)[name];
  if (entry === undefined) {
    throw new Error(`no def ${name}`);
  }
  entry.body = body;
  return makeReferenceModel(decodeDefinition(doc));
};
const app = (opcode: string, ...args: QuintExprData[]): QuintExprData => ({
  kind: "app",
  opcode,
  args,
});
const name = (value: string): QuintExprData => ({ kind: "name", name: value });

const bigint = (value: unknown): bigint => {
  if (typeof value !== "bigint") {
    throw new Error(`expected bigint, got ${typeof value}`);
  }
  return value;
};
const subset = (a: bigint, b: bigint) => (a | b) === b;

describe("canvas pointer (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "ModeValid",
      "OneCaptureOwner",
      "OnlyLegalTransitions",
      "SelectionSubsetOfNodes",
      "IdsInRange",
      "IdleIsClean",
      "GestureTargetConsistent",
      "PointingWithinThreshold",
      "TargetIsTopmostHit",
      "DragIsSnapshotPlusDelta",
      "DragPreservesGrabOffset",
      "SnappedPositionOnGrid",
      "NoMissedSnap",
      "GuidesOnlyWhileSnapping",
      "PanKeepsGrabUnderPointer",
      "CameraInBound",
      "NodesInWorldBound",
      "ContainSubsetOfOverlap",
      "MarqueeSelectionExact",
      "MarqueeAdditiveKeepsBase",
      "ExemptNodesNeverCulled",
      "CulledOnlyWhenOffscreen",
      "EditingIsTheSingleSelection",
      "AnnouncementsTrackSelection",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    const bad = (patch: Record<string, unknown>) =>
      violatedInvariants(model, { ...initial, ...patch } as QuintModelValue);
    const dragging = {
      mode: "dragging",
      prev: "pointing",
      owner: 1n,
      tgt: 0n,
      sel: 1n,
      px: 280n,
      py: 170n,
      downx: 150n,
      downy: 130n,
      gx: 150n * TONE,
      gy: 130n * TONE,
      ddx: 130n,
      ddy: 40n,
    };
    // the good drag state: pointer moved (130, 40) screen px at 100%
    expect(bad(dragging)).toEqual([]);

    // two capture owners / none / a stray owner while idle
    expect(bad({ mode: "pointing", prev: "idle", owner: 0n })).toContain("OneCaptureOwner");
    expect(bad({ owner: 2n })).toContain("OneCaptureOwner");
    // a gesture entered from a gesture
    expect(
      bad({
        ...dragging,
        mode: "pointing",
        prev: "dragging",
        ddx: 0n,
        ddy: 0n,
      }),
    ).toContain("OnlyLegalTransitions");
    // selection outside the node set
    expect(bad({ sel: 9n, selSnap: 9n, annSel: 9n })).toEqual([
      "SelectionSubsetOfNodes",
      "AnnouncementsTrackSelection",
    ]);
    // a drag delta that was ACCUMULATED instead of recomputed from the snapshot
    expect(bad({ ...dragging, ddx: 260n })).toEqual([
      "DragIsSnapshotPlusDelta",
      "DragPreservesGrabOffset",
    ]);
    // the grabbed point no longer under the pointer
    expect(bad({ ...dragging, ddx: 100n })).toContain("DragPreservesGrabOffset");
    // a press below the screen threshold that already left it
    expect(
      bad({
        mode: "pointing",
        prev: "idle",
        owner: 1n,
        tgt: 0n,
        sel: 1n,
        px: 160n,
        py: 130n,
        downx: 150n,
        downy: 130n,
        gx: 150n * TONE,
        gy: 130n * TONE,
      }),
    ).toEqual(["PointingWithinThreshold"]);
    // a drag whose target is not the topmost hit at pointerdown (n1 is on top at position 4)
    expect(
      bad({
        ...dragging,
        tgt: 0n,
        gx: 280n * TONE,
        gy: 170n * TONE,
        px: 280n,
        py: 170n,
        ddx: 0n,
        ddy: 0n,
      }),
    ).toContain("TargetIsTopmostHit");
    // a marquee whose live selection is stale
    expect(
      bad({
        mode: "marquee",
        prev: "pointing",
        owner: 1n,
        sel: 0n,
        px: 320n,
        py: 220n,
        downx: 60n,
        downy: 60n,
        gx: 60n * TONE,
        gy: 60n * TONE,
      }),
    ).toEqual(["MarqueeSelectionExact"]);
    // guides outside a snapping drag; a snapped axis off the grid
    expect(bad({ guide: 1n })).toContain("GuidesOnlyWhileSnapping");
    expect(bad({ ...dragging, snapOn: true, guide: 1n })).toContain("SnappedPositionOnGrid");
    // a missed snap: 105 is 5 units from the grid at 100%, so a snapping drag must be guided
    expect(
      bad({
        ...dragging,
        snapOn: true,
        px: 155n,
        py: 130n,
        ddx: 5n,
        ddy: 0n,
        guide: 0n,
      }),
    ).toContain("NoMissedSnap");
    // a camera / node out of bound, an editing node that is not the selection, a lost announcement
    expect(bad({ z: 100n })).toContain("CameraInBound");
    expect(bad({ tx: 256_000_001n })).toContain("CameraInBound");
    expect(bad({ n0x: WB })).toEqual(["NodesInWorldBound"]);
    expect(bad({ editing: 1n })).toEqual(["EditingIsTheSingleSelection"]);
    expect(bad({ sel: 1n, selSnap: 1n })).toEqual(["AnnouncementsTrackSelection"]);
    expect(bad({ mode: "bogus" })).toContain("ModeValid");
    expect(bad({ tgt: 5n })).toEqual(["IdsInRange", "IdleIsClean"]);
    expect(bad({ guide: 0n, ddx: 3n })).toEqual(["IdleIsClean"]);
    expect(
      bad({
        mode: "marquee",
        prev: "pointing",
        owner: 1n,
        shift: true,
        sel: 2n,
        selSnap: 1n,
        px: 320n,
        py: 220n,
        downx: 60n,
        downy: 60n,
        gx: 60n * TONE,
        gy: 60n * TONE,
        mqmode: "overlap",
      }),
    ).toContain("MarqueeAdditiveKeepsBase");
    expect(
      bad({
        mode: "panning",
        prev: "idle",
        owner: 1n,
        px: 100n,
        gx: 50n * TONE,
      }),
    ).toEqual(["PanKeepsGrabUnderPointer"]);
  });

  it("mutating the defs breaks the invariants that guard them", () => {
    // overlap that selects nothing: contain is no longer a subset of overlap
    const noOverlap = mutated("overlapped", { kind: "bool", value: false });
    const marquee = run(initial, [down(1, 7), move(1, 8)]);
    expect(violatedInvariants(model, marquee)).toEqual([]);
    expect(violatedInvariants(noOverlap, marquee)).toContain("ContainSubsetOfOverlap");

    // a snap threshold in WORLD units (the bug the research warns about) disagrees with the
    // screen-space rule once the zoom is not 100%
    const worldThreshold = mutated(
      "snapHit",
      app(
        "and",
        name("on"),
        app(
          "ilte",
          app("absI", app("isub", name("v"), app("snapNearest", name("v")))),
          name("SNAP_PX"),
        ),
      ),
    );
    const dragAtHalf = run(initial, [
      snap(true),
      move(1, 0),
      zoomTo(1),
      ...click(0).slice(0, 1),
      move(1, 4),
    ]);
    expect(violatedInvariants(model, dragAtHalf)).toEqual([]);
    expect(violatedInvariants(worldThreshold, dragAtHalf)).toContain("DragIsSnapshotPlusDelta");

    // culling that forgets the exemptions would cull a selected, off-screen node
    const forgetful = mutated("culled", app("not", app("inView", name("i"))));
    const away = run(initial, [...click(0), move(1, 10), zoomTo(4)]);
    expect(violatedInvariants(model, away)).toEqual([]);
    expect(violatedInvariants(forgetful, away)).toContain("ExemptNodesNeverCulled");
  });

  it("keeps the camera defs identical to camera.qnt (the copy contract)", () => {
    const names = [
      "ZONE",
      "TONE",
      "TZ",
      "ZMIN",
      "ZMAX",
      "WB",
      "WT",
      "absI",
      "clampI",
      "fdiv",
      "rdiv",
      "screenToWorld",
      "clampZ",
      "clampT",
      "anchoredT",
    ];
    const here = definitionJson.defs as Record<string, unknown>;
    const there = cameraJson.defs as Record<string, unknown>;
    for (const defName of names) {
      expect(here[defName], defName).toBeDefined();
      expect(here[defName], defName).toEqual(there[defName]);
    }
  });

  it("starts idle, nothing selected, nothing announced", () => {
    expect(initial).toMatchObject({
      mode: "idle",
      owner: 0n,
      sel: 0n,
      cursor: -1n,
      annCount: 0n,
      mqmode: "contain",
      snapOn: false,
    });
  });

  it("a click selects the TOPMOST node, announces once, and a repeat click is silent", () => {
    // position 4 is inside node 0 and node 1; node 1 is on top
    const pressed = step(initial, down(1, 4));
    expect(pressed).toMatchObject({
      mode: "pointing",
      owner: 1n,
      tgt: 1n,
      sel: 2n,
      selSnap: 0n,
    });
    expect(pressed["annCount"]).toBe(0n); // never mid-gesture
    const clicked = step(pressed, up(1));
    expect(clicked).toMatchObject({
      mode: "idle",
      owner: 0n,
      sel: 2n,
      cursor: 1n,
      annCount: 1n,
      annSel: 2n,
    });
    expect(run(clicked, click(4))).toMatchObject({ sel: 2n, annCount: 1n });
    // a click on node 0 alone (position 0) moves the selection
    expect(run(clicked, click(0))).toMatchObject({
      sel: 1n,
      cursor: 0n,
      annCount: 2n,
      annSel: 1n,
    });
  });

  it("clicking empty canvas clears; shift toggles", () => {
    const one = run(initial, click(0));
    expect(run(one, click(7))).toMatchObject({ sel: 0n, annCount: 2n });
    // shift-click adds, a second shift-click on a member removes
    const two = run(one, [shift(true), ...click(6)]);
    expect(two).toMatchObject({ sel: 5n, annCount: 2n });
    expect(run(two, click(6))).toMatchObject({ sel: 1n, annCount: 3n });
    // shift on empty canvas keeps the selection
    expect(run(two, click(7))).toMatchObject({ sel: 5n, annCount: 2n });
  });

  it("the drag threshold is in SCREEN px: 5 and 16 squared stay pointing, 25 drags (at every zoom)", () => {
    for (const zoom of [undefined, 0, 1, 3, 4]) {
      const base = zoom === undefined ? initial : run(initial, [move(1, 0), zoomTo(zoom)]);
      const pressed = step(base, down(1, 0));
      expect(pressed).toMatchObject({ mode: "pointing", tgt: 0n });
      let state = step(pressed, move(1, 1)); // 5 squared px
      expect(state["mode"]).toBe("pointing");
      state = step(state, move(1, 2)); // 16: not yet past
      expect(state["mode"]).toBe("pointing");
      state = step(state, move(1, 3)); // 25
      expect(state["mode"]).toBe("dragging");
      // once dragging, coming back under the threshold does not cancel the drag
      expect(step(state, move(1, 0))["mode"]).toBe("dragging");
    }
  });

  it("a drag is the pointerdown snapshot plus a world delta; the grab offset is kept", () => {
    let state = run(initial, [down(1, 0), move(1, 4)]);
    expect(state).toMatchObject({
      mode: "dragging",
      n0x: 100n,
      n0y: 100n,
      ddx: 130n,
      ddy: 40n,
    });
    // moving elsewhere and back recomputes (not accumulates) the delta
    state = run(state, [move(1, 5), move(1, 4)]);
    expect(state).toMatchObject({ ddx: 130n, ddy: 40n, n0x: 100n });
    state = step(state, up(1));
    expect(state).toMatchObject({
      mode: "idle",
      n0x: 230n,
      n0y: 140n,
      sel: 1n,
      annCount: 1n,
    });
    // a drag of an unselected node under a multi-selection selects it alone; a selected one drags the group
    const group = run(initial, [...click(0), shift(true), ...click(6), shift(false)]);
    expect(group["sel"]).toBe(5n);
    const moved = run(group, [down(1, 0), move(1, 4), up(1)]);
    expect(moved).toMatchObject({
      n0x: 230n,
      n0y: 140n,
      n2x: 730n,
      n2y: 440n,
      sel: 5n,
    });
  });

  it("pointercancel aborts to the snapshot; nothing was committed", () => {
    const before = run(initial, click(6));
    const aborted = run(before, [down(1, 0), move(1, 4), cancel(1)]);
    expect(aborted).toMatchObject({
      mode: "idle",
      owner: 0n,
      n0x: 100n,
      n0y: 100n,
      sel: 4n,
      annCount: before["annCount"],
    });
    // a marquee cancels back to the selection it started from
    const marqueed = run(before, [down(1, 7), move(1, 10), cancel(1)]);
    expect(marqueed).toMatchObject({
      mode: "idle",
      sel: 4n,
      annCount: before["annCount"],
    });
  });

  it("one capture owner: the other pointer can neither start, move, nor end a gesture", () => {
    const owned = step(initial, down(1, 0));
    const unchanged = (state: QuintModelValue) => ({
      ...state,
      prev: owned["prev"],
    });
    expect(unchanged(step(owned, down(2, 6)))).toEqual(owned);
    expect(unchanged(step(owned, move(2, 10)))).toEqual(owned);
    expect(unchanged(step(owned, up(2)))).toEqual(owned);
    expect(unchanged(step(owned, cancel(2)))).toEqual(owned);
    expect(step(owned, up(1))).toMatchObject({ mode: "idle", owner: 0n });
    // while idle either pointer can take the capture
    expect(step(initial, down(2, 6))).toMatchObject({ owner: 2n, tgt: 2n });
    // modifiers and parameters are frozen during a gesture
    const dragging = run(initial, [down(1, 0), move(1, 4)]);
    const same = (state: QuintModelValue) => ({
      ...state,
      prev: dragging["prev"],
    });
    expect(same(step(dragging, shift(true)))).toEqual(dragging);
    expect(same(step(dragging, snap(true)))).toEqual(dragging);
    expect(same(step(dragging, marqueeMode("overlap")))).toEqual(dragging);
    expect(same(step(dragging, editToggle))).toEqual(dragging);
  });

  it("marquee: contain needs the box inside, overlap needs any intersection", () => {
    // 7 -> 8 is the rectangle (60,60)-(320,220): node 0 inside, node 1 partly in
    const contain = run(initial, [down(1, 7), move(1, 8)]);
    expect(contain).toMatchObject({ mode: "marquee", sel: 1n });
    const overlap = run(initial, [marqueeMode("overlap"), down(1, 7), move(1, 8)]);
    expect(overlap).toMatchObject({ mode: "marquee", sel: 3n });
    // (60,60)-(500,350) encloses nodes 0 and 1; (60,60)-(800,600) all three
    for (const mode of ["contain", "overlap"] as const) {
      expect(run(initial, [marqueeMode(mode), down(1, 7), move(1, 9)])["sel"]).toBe(3n);
      expect(run(initial, [marqueeMode(mode), down(1, 7), move(1, 10)])["sel"]).toBe(7n);
    }
    // (600,60)-(650,450) only touches node 2
    expect(run(initial, [down(1, 11), move(1, 6)])["sel"]).toBe(0n);
    expect(run(initial, [marqueeMode("overlap"), down(1, 11), move(1, 6)])["sel"]).toBe(4n);
    // the marquee is live: shrinking it deselects, and releasing announces once
    let state = run(initial, [marqueeMode("overlap"), down(1, 7), move(1, 8)]);
    expect(state["annCount"]).toBe(0n);
    state = step(state, move(1, 11)); // (60,60)-(600,60): zero height
    expect(state["sel"]).toBe(0n);
    state = step(run(initial, [marqueeMode("overlap"), down(1, 7), move(1, 8)]), up(1));
    expect(state).toMatchObject({
      mode: "idle",
      sel: 3n,
      annCount: 1n,
      annSel: 3n,
    });
  });

  it("marquee in contain mode selects a subset of overlap for every rectangle in the palette", () => {
    const empties = [7, 9, 10, 11];
    let compared = 0;
    for (const from of empties) {
      for (let to = 0; to < 12; to += 1) {
        const contain = run(initial, [down(1, from), move(1, to)]);
        const overlap = run(initial, [marqueeMode("overlap"), down(1, from), move(1, to)]);
        if (contain["mode"] !== "marquee") {
          continue;
        }
        compared += 1;
        expect(subset(bigint(contain["sel"]), bigint(overlap["sel"]))).toBe(true);
      }
    }
    expect(compared).toBeGreaterThan(30);
  });

  it("shift-additive marquee keeps the base selection; a plain marquee replaces it", () => {
    const base = run(initial, [marqueeMode("overlap"), ...click(6)]);
    expect(base["sel"]).toBe(4n);
    expect(run(base, [down(1, 7), move(1, 8)])["sel"]).toBe(3n);
    const additive = run(base, [shift(true), down(1, 7), move(1, 8)]);
    expect(additive).toMatchObject({ sel: 7n, mode: "marquee" });
    // shrinking the rectangle gives back only the marquee's own hits, never the base
    expect(step(additive, move(1, 11))["sel"]).toBe(4n);
    expect(step(additive, up(1))).toMatchObject({
      sel: 7n,
      annCount: 2n,
      annSel: 7n,
    });
  });

  it("snapping: the threshold is 8 SCREEN px, converted by the zoom; guides are cleared", () => {
    const snapped = run(initial, [snap(true), down(1, 0), move(1, 3)]); // 5 units off the grid
    expect(snapped).toMatchObject({
      mode: "dragging",
      ddx: 0n,
      ddy: 0n,
      guide: 3n,
    });
    // far from every grid line at 100%: no snap on either axis (20 and 10 units, past 8 px)
    const free = step(snapped, move(1, 4));
    expect(free).toMatchObject({ ddx: 130n, ddy: 40n, guide: 0n });
    // at 50% the same screen drag covers 260 x 80 units: x lands 10 units (5 px) from the grid
    const half = run(initial, [snap(true), move(1, 0), zoomTo(1), down(1, 0), move(1, 4)]);
    expect(half).toMatchObject({
      mode: "dragging",
      ddx: 250n,
      ddy: 80n,
      guide: 1n,
    });
    // guides are output state: gone when the drag ends, and snapping off means no guides
    expect(step(half, up(1))).toMatchObject({
      guide: 0n,
      n0x: 350n,
      n0y: 180n,
    });
    expect(run(initial, [down(1, 0), move(1, 3)])["guide"]).toBe(0n);
  });

  it("a zoom under a running drag keeps the grab point under the pointer", () => {
    const dragging = run(initial, [down(1, 0), move(1, 4)]);
    for (const level of [0, 1, 3, 4]) {
      const zoomed = step(dragging, zoomTo(level));
      expect(zoomed).toMatchObject({ mode: "dragging", ddx: 130n, ddy: 40n });
    }
    // the delta is f(world pointer, grab point): the pointer then moves in the new camera
    const zoomed = run(dragging, [zoomTo(3), move(1, 5)]);
    // the pointer's world point (280, 170) survived the zoom; 120 x 80 screen px at x2 are 60 x 40
    // units, so the world pointer is (340, 210) and the delta from the grab point (150, 130) is
    // (190, 80): the node origin lands at (290, 180), still 50 x 30 from the pointer as grabbed
    expect(zoomed).toMatchObject({ ddx: 190n, ddy: 80n });
  });

  it("space-drag pans, keeping the grab world point under the pointer; no threshold", () => {
    const panning = run(initial, [space(true), down(1, 0)]);
    expect(panning).toMatchObject({
      mode: "panning",
      tgt: -1n,
      sel: 0n,
      owner: 1n,
    });
    const moved = step(panning, move(1, 4));
    expect(moved).toMatchObject({
      mode: "panning",
      tx: 33_280n,
      ty: 10_240n,
      n0x: 100n,
    });
    // zooming mid-pan re-grabs: the same world point stays under the pointer
    expect(step(moved, zoomTo(3))).toMatchObject({ mode: "panning" });
    expect(step(moved, up(1))).toMatchObject({
      mode: "idle",
      tx: 33_280n,
      sel: 0n,
      annCount: 0n,
    });
  });

  it("culled iff outside the viewport and not selected / cursor; geometry still selects", () => {
    const near = run(initial, [...click(0)]);
    expect([0, 1, 2].map((node) => culled(near, node))).toEqual([false, false, false]);
    // zoom to ZMAX about (800, 600): every node leaves the viewport
    const away = run(initial, [...click(0), move(1, 10), zoomTo(4)]);
    expect(culled(away, 0)).toBe(false); // selected
    expect(culled(away, 1)).toBe(true);
    expect(culled(away, 2)).toBe(true);
    // deselected, node 0 is still the cursor (the focus candidate): still exempt
    const deselected = run(away, [move(1, 10), ...click(10)]);
    expect(deselected).toMatchObject({ sel: 0n, cursor: 0n });
    expect(culled(deselected, 0)).toBe(false);
    // after clicking node 2 (zoom back out), node 0 loses the exemption once it is off screen again
    const noExemption = run(initial, [...click(6), ...click(10), move(1, 10), zoomTo(4)]);
    expect([0, 1, 2].map((node) => culled(noExemption, node))).toEqual([true, true, false]);
  });

  it("editing the single selected node; a new gesture ends it", () => {
    const selected = run(initial, click(5));
    expect(step(selected, editToggle)).toMatchObject({
      editing: 1n,
      cursor: 1n,
    });
    expect(run(selected, [editToggle, editToggle])).toMatchObject({
      editing: -1n,
    });
    expect(run(selected, [editToggle, down(1, 7)])).toMatchObject({
      editing: -1n,
    });
    // nothing or several selected: nothing to edit
    expect(step(initial, editToggle)).toMatchObject({ editing: -1n });
    const several = run(initial, [...click(0), shift(true), ...click(6)]);
    expect(step(several, editToggle)).toMatchObject({ editing: -1n });
  });

  it("a pan that would leave the world bound pins the camera instead", () => {
    // hand-built: the grab point lies beyond the bound, so keeping it under the pointer is impossible
    const far = {
      ...run(initial, [space(true), down(1, 0)]),
      gx: -300_000_000n,
    } as QuintModelValue;
    const pinned = model.transition(far, move(1, 4));
    expect(pinned).toMatchObject({ mode: "panning", tx: 256_000_000n });
    expect(violatedInvariants(model, pinned)).toEqual([]);
    // and zooming while pinned re-grabs without leaving the bound
    expect(violatedInvariants(model, model.transition(pinned, zoomTo(4)))).toEqual([]);
  });

  it("a committed drag is clamped into the world bound", () => {
    // hand-built: node 0 near the edge with a pending +500 delta
    const edge = {
      ...run(initial, [down(1, 0), move(1, 4)]),
      n0x: 999_900n,
      ddx: 500n,
      ddy: -40n,
    } as QuintModelValue;
    const landed = model.transition(edge, up(1));
    expect(landed).toMatchObject({ n0x: WB - 200n });
    expect(violatedInvariants(model, landed)).toEqual([]);
  });

  describe("host_move (host-controlled positions)", () => {
    // place = 3 * k + node: node takes position k of (0,0) (320,200) (-300,-300) (far past the bound)
    const hostMove = (node: number, k: number) => ({
      _tag: "host_move",
      place: BigInt(3 * k + node),
    });

    it("sets one committed position and nothing else; the world bound clamps it", () => {
      const moved = step(initial, hostMove(0, 1));
      expect(moved).toMatchObject({
        n0x: 320n,
        n0y: 200n,
        n1x: 250n,
        n2x: 600n,
        mode: "idle",
        sel: 0n,
        annCount: 0n,
        hostMoved: false,
      });
      expect(step(initial, hostMove(2, 3))).toMatchObject({
        n2x: WB - 100n,
        n2y: -WB,
      });
    });

    it("a running drag keeps its delta over the new base; the release commits it", () => {
      const dragging = run(initial, [down(1, 0), move(1, 3)]);
      expect(dragging).toMatchObject({ mode: "dragging", ddx: 5n });
      const hosted = step(dragging, hostMove(0, 1));
      expect(hosted).toMatchObject({
        n0x: 320n,
        ddx: 5n,
        ddy: 0n,
        hostMoved: true,
      });
      expect(step(hosted, up(1))).toMatchObject({
        n0x: 325n,
        n0y: 200n,
        hostMoved: false,
        mode: "idle",
      });
    });

    it("a snapped drag re-solves its snap against the new base", () => {
      const dragging = run(initial, [snap(true), down(1, 0), move(1, 3)]);
      expect(dragging).toMatchObject({ ddx: 0n, guide: 3n });
      // x: base 320 + 5 = 325 is 25 from the grid lines 300 / 350, out of reach, free.
      // y: base 200 is on a grid line, so only the y guide (bit 1) is lit
      const hosted = step(dragging, hostMove(0, 1));
      expect(hosted).toMatchObject({ n0x: 320n, ddx: 5n, guide: 2n });
    });

    it("a marquee re-selects over the new geometry", () => {
      const marquee = run(initial, [marqueeMode("overlap"), down(1, 7), move(1, 5)]);
      expect(marquee).toMatchObject({ mode: "marquee", sel: 3n });
      const withC = step(marquee, hostMove(2, 0));
      expect(withC).toMatchObject({ sel: 7n, annCount: 0n, hostMoved: true });
      expect(step(withC, hostMove(0, 2))).toMatchObject({ sel: 6n });
    });

    it("hostMoved stands TargetIsTopmostHit down for that gesture only", () => {
      const hosted = run(initial, [down(1, 0), move(1, 3), hostMove(0, 1)]);
      // the grab point left the node: the target is no longer the topmost hit there
      const without = { ...hosted, hostMoved: false } as QuintModelValue;
      expect(violatedInvariants(model, without)).toEqual(["TargetIsTopmostHit"]);
      // idle is clean: a stale flag is a bug
      const stale = { ...initial, hostMoved: true } as QuintModelValue;
      expect(violatedInvariants(model, stale)).toEqual(["IdleIsClean"]);
      // a cancel ends the gesture and clears it; the moved position stays committed
      expect(step(hosted, cancel(1))).toMatchObject({
        hostMoved: false,
        n0x: 320n,
        mode: "idle",
      });
    });
  });

  it("only legal mode edges happen, and a running gesture is never replaced", () => {
    const report = explore(model, { maxDepth: 3, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
    const legal = new Set([
      "idle>pointing",
      "idle>panning",
      "pointing>marquee",
      "pointing>dragging",
      "pointing>idle",
      "panning>idle",
      "marquee>idle",
      "dragging>idle",
    ]);
    let starts = 0;
    for (const { from, event, to } of report.transitions) {
      if (from["mode"] !== to["mode"]) {
        expect(legal.has(`${String(from["mode"])}>${String(to["mode"])}`)).toBe(true);
      }
      if (event._tag === "down" && from["mode"] !== "idle") {
        expect(to).toEqual({ ...from, prev: from["mode"] });
        starts += 1;
      }
      // a gesture only ever changes owner by ending
      if (from["owner"] !== to["owner"]) {
        expect(from["owner"] === 0n || to["owner"] === 0n).toBe(true);
      }
    }
    expect(starts).toBeGreaterThan(100);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(1000);
    assertReachable(report, "dragging", (s) => s["mode"] === "dragging");
    assertReachable(report, "marquee", (s) => s["mode"] === "marquee");
    assertReachable(report, "panning", (s) => s["mode"] === "panning");
    assertReachable(report, "snap guide", (s) => s["guide"] !== 0n);
    assertReachable(report, "announced selection", (s) => bigint(s["annCount"]) > 0n);
    assertReachable(report, "pointer 2 owns the capture", (s) => s["owner"] === 2n);
    assertReachable(report, "a host move during a gesture", (s) => s["hostMoved"] === true);
  });

  it("random walks over the whole pool keep every invariant", () => {
    const walks = simulate(model, { runs: 60, maxSteps: 150, seed: 11 });
    expect(walks.violations).toEqual([]);
    const seen = new Set(walks.states.map((s) => String(s["mode"])));
    expect([...seen].sort()).toEqual(["dragging", "idle", "marquee", "panning", "pointing"]);
    expect(walks.states.some((s) => s["guide"] !== 0n)).toBe(true);
    expect(walks.states.some((s) => bigint(s["annCount"]) > 0n)).toBe(true);
    expect(walks.states.some((s) => [0, 1, 2].some((n) => culled(s, n)))).toBe(true);
  });
});
