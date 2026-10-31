import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { explore, stateKey } from "@quint-machine/core/testing";
import definitionJson from "../../src/patterns/dropzone.model.generated.json";
import { dropzoneBridge } from "../../src/patterns/dropzone.bridge";
import { parseScenarioFile, replayScenario, specDriver } from "../../src/scenario";
import scenarios from "../../scenarios/patterns/dropzone.spec.json";

// Spec-only verification for specs/patterns/dropzone.qnt: a file drop zone's
// drag depth (0 none, 1 the zone, 2 a child), disabled, and the last delivery.
// `explore` walks the nine actions (the disable pool expands to both values)
// and checks every invariant after every step.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const run = (start: QuintModelValue, ...tags: ReadonlyArray<string>): QuintModelValue =>
  tags.reduce((state, tag) => step(state, { _tag: tag }), start);

const initial = model.initial;
const dragging = run(initial, "enter_zone");
const overChild = run(dragging, "enter_child");
const acceptedState = (): QuintModelValue => run(overChild, "drop_accepted");

describe("patterns dropzone (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "DraggingIffDepth",
      "DepthClearsOnDrop",
      "DepthClearsOnExit",
      "DisabledNeverDelivers",
      "OneDropOneBatch",
      "DepthNeverNegative",
      "AnnouncementOnlyAfterBatch",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    // a highlight that disagrees with the depth, in both directions
    expect(violatedInvariants(model, { ...initial, depth: 1n, highlight: false })).toEqual([
      "DraggingIffDepth",
    ]);
    expect(violatedInvariants(model, { ...initial, highlight: true })).toEqual([
      "DraggingIffDepth",
    ]);

    // a drop that left the depth behind (the stuck highlight)
    expect(
      violatedInvariants(model, { ...initial, dropped: true, depth: 2n, highlight: true }),
    ).toEqual(["DepthClearsOnDrop"]);
    // a dragleave that leaves the zone without clearing the depth
    expect(
      violatedInvariants(model, { ...initial, exited: true, depth: 1n, highlight: true }),
    ).toEqual(["DepthClearsOnExit"]);
    // a delivery from a disabled zone
    expect(violatedInvariants(model, { ...initial, delivered: true, disabled: true })).toEqual([
      "DisabledNeverDelivers",
      "OneDropOneBatch",
    ]);
    // a delivery that is not a drop, or a drop without a batch
    expect(violatedInvariants(model, { ...initial, delivered: true, dropped: true })).toEqual([
      "OneDropOneBatch",
    ]);
    // a dragleave without a dragenter (or a deeper nesting than the model has)
    expect(violatedInvariants(model, { ...initial, depth: -1n })).toEqual(["DepthNeverNegative"]);
    expect(violatedInvariants(model, { ...initial, depth: 3n, highlight: true })).toEqual([
      "DepthNeverNegative",
    ]);
    // an announcement without a batch, or a batch without one
    expect(violatedInvariants(model, { ...initial, batches: 1n })).toEqual([
      "AnnouncementOnlyAfterBatch",
    ]);
    expect(violatedInvariants(model, { ...initial, batch: "accepted" })).toEqual([
      "AnnouncementOnlyAfterBatch",
    ]);
  });

  it("starts idle, enabled, with no announcement", () => {
    expect(initial).toMatchObject({
      depth: 0n,
      highlight: false,
      disabled: false,
      batch: "none",
      batches: 0n,
      dropped: false,
      delivered: false,
      exited: false,
    });
  });

  it("counts a dragenter per nesting level and survives a child's dragleave", () => {
    expect(dragging).toMatchObject({ depth: 1n, highlight: true });
    expect(overChild).toMatchObject({ depth: 2n, highlight: true });

    // a child's dragleave decrements; the zone is still highlighted
    expect(run(overChild, "leave_child")).toMatchObject({ depth: 1n, highlight: true });
    // the zone's own dragleave clears it
    expect(run(overChild, "leave_child", "leave_zone")).toMatchObject({
      depth: 0n,
      highlight: false,
      exited: true,
    });
    // leaving the zone directly, from inside the child, clears it in one step
    expect(run(overChild, "leave_zone")).toMatchObject({ depth: 0n, highlight: false });
  });

  it("never underflows on a dragleave without a dragenter", () => {
    expect(run(initial, "leave_child")).toMatchObject({ depth: 0n, highlight: false });
    expect(run(initial, "leave_zone")).toMatchObject({ depth: 0n, highlight: false, exited: true });
    expect(run(initial, "leave_child", "leave_child", "leave_zone")).toMatchObject({ depth: 0n });
  });

  it("a drop of any kind clears the depth; only a delivered drop announces", () => {
    const accepted = run(overChild, "drop_accepted");
    expect(accepted).toMatchObject({
      depth: 0n,
      highlight: false,
      dropped: true,
      delivered: true,
      batch: "accepted",
      batches: 1n,
      exited: false,
    });
    // a later leave is inert: the drag is already over
    expect(run(accepted, "leave_child")).toMatchObject({ depth: 0n, highlight: false });

    const rejected = run(dragging, "drop_rejected");
    expect(rejected).toMatchObject({ dropped: true, delivered: true, batch: "rejected" });

    // an empty transfer clears the depth and keeps the previous announcement
    const empty = run(accepted, "drop_empty");
    expect(empty).toMatchObject({
      depth: 0n,
      dropped: true,
      delivered: false,
      batch: "accepted",
      batches: 1n,
    });
  });

  it("a disabled zone ignores the drag and delivers nothing", () => {
    const off = step(initial, { _tag: "set_disabled", off: true });
    expect(run(off, "enter_zone", "enter_child")).toMatchObject({ depth: 0n, highlight: false });
    expect(run(off, "drop_accepted")).toMatchObject({
      depth: 0n,
      dropped: true,
      delivered: false,
      batch: "none",
      batches: 0n,
    });

    // disabling mid-drag keeps the highlight (the handlers test disabled), and
    // the drop is what clears it
    const stuck = step(dragging, { _tag: "set_disabled", off: true });
    expect(stuck).toMatchObject({ depth: 1n, highlight: true, disabled: true });
    expect(run(stuck, "leave_zone")).toMatchObject({ depth: 1n, highlight: true, exited: false });
    expect(run(stuck, "drop_empty")).toMatchObject({ depth: 0n, highlight: false });

    // re-enabling delivers again, and keeps the old announcement in between
    const back = step(step(acceptedState(), { _tag: "set_disabled", off: true }), {
      _tag: "set_disabled",
      off: false,
    });
    expect(back).toMatchObject({ disabled: false, batch: "accepted", batches: 1n });
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(50);
  });
});

describe("drop zone scenarios (spec driver)", () => {
  const file = parseScenarioFile(scenarios);
  for (const scenario of file.scenarios) {
    it(scenario.id, async () => {
      const result = await replayScenario(scenario, dropzoneBridge, (config) =>
        specDriver(model, dropzoneBridge, config),
      );
      // our own scenarios must be expressible: an `unsupported` here is a gap
      // in the bridge, not a step we deliberately drop
      expect(result.status).toBe("passed");
    });
  }
});
