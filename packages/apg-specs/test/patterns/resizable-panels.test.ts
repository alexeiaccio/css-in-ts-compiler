import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { explore, stateKey } from "@quint-machine/core/testing";
import definitionJson from "../../src/patterns/resizable-panels.model.generated.json";
import { resizablePanelsBridge } from "../../src/patterns/resizable-panels.bridge";
import { parseScenarioFile, replayScenario, specDriver } from "../../src/scenario";
import scenarios from "../../scenarios/patterns/resizable-panels.spec.json";

// Spec-only verification for specs/patterns/resizable-panels.qnt: a group of
// three panes with two separators, sizes in percent. The shared harness derives
// the event alphabet from the spec's own pools (there are no nondet pools, so
// `explore` walks the 24 actions) and checks every invariant after every step.

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
const focused0 = run(initial, "focusSep0");
const focused1 = run(initial, "focusSep1");

const sizes = (state: QuintModelValue): ReadonlyArray<bigint> =>
  [state["s0"], state["s1"], state["s2"]] as ReadonlyArray<bigint>;

describe("patterns resizable-panels (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "PaneSizesSumTo100",
      "PaneInBounds",
      "PrevInBounds",
      "RestoreReturnsPrev",
      "FocusKnown",
      "OrientationKnown",
      "RequestsNonNegative",
      "HoldingLayoutStable",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
      "DragMovesOnlyNeighbours",
      "DragDeltaBounded",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    expect(violatedInvariants(model, { ...initial, s0: 30n, s1: 30n, s2: 30n })).toEqual([
      "PaneSizesSumTo100",
    ]);

    expect(violatedInvariants(model, { ...initial, s1: 0n, s2: 80n })).toEqual(["PaneInBounds"]);
    expect(violatedInvariants(model, { ...initial, s2: 90n, s1: 0n })).toEqual([
      "PaneSizesSumTo100",
      "PaneInBounds",
    ]);

    expect(violatedInvariants(model, { ...initial, prev0: 0n })).toEqual(["PrevInBounds"]);
    expect(violatedInvariants(model, { ...initial, justRestored: true, prev0: 50n })).toEqual([
      "RestoreReturnsPrev",
    ]);
    expect(violatedInvariants(model, { ...initial, focus: "pane0" })).toEqual(["FocusKnown"]);
    expect(violatedInvariants(model, { ...initial, o: "diagonal" })).toEqual(["OrientationKnown"]);
    expect(violatedInvariants(model, { ...initial, requests: -1n })).toEqual([
      "RequestsNonNegative",
    ]);

    // a holding host that reports an accepted request
    expect(
      violatedInvariants(model, { ...initial, controlled: true, outcome: "accepted" }),
    ).toEqual(["HoldingLayoutStable"]);
    // a rejected request that moved the layout anyway
    expect(violatedInvariants(model, { ...initial, outcome: "rejected", b0: 10n })).toEqual([
      "RejectedRequestUntouched",
    ]);
    // an accepted request that did not commit its target
    expect(violatedInvariants(model, { ...initial, outcome: "accepted", rq0: 30n })).toEqual([
      "AcceptedRequestCommits",
    ]);
    // a drag that moved the far pane
    expect(violatedInvariants(model, { ...initial, dr: 0n, s2: 30n })).toEqual([
      "PaneSizesSumTo100",
      "DragMovesOnlyNeighbours",
    ]);
    expect(violatedInvariants(model, { ...initial, dd: 200n })).toEqual(["DragDeltaBounded"]);
  });

  it("starts on the initial layout, vertical, unfocused", () => {
    expect(initial).toMatchObject({
      o: "vertical",
      s0: 20n,
      s1: 40n,
      s2: 40n,
      prev0: 20n,
      focus: "none",
      dd: 0n,
      dr: -1n,
      outcome: "none",
      controlled: false,
      accepting: false,
      requests: 0n,
    });
  });

  it("ignores keys unless a separator has focus", () => {
    expect(run(initial, "right", "enter", "home")).toEqual(initial);
  });

  it("moves only the focused separator's pair, by one step, clamped by both bounds", () => {
    expect(sizes(run(focused0, "right"))).toEqual([30n, 30n, 40n]);
    expect(sizes(run(focused0, "right", "right", "right"))).toEqual([50n, 10n, 40n]);
    // the neighbour is at MIN: another step changes nothing and fires no request
    expect(run(focused0, "right", "right", "right", "right")).toMatchObject({
      s0: 50n,
      requests: 3n,
    });
    expect(sizes(run(focused0, "left"))).toEqual([10n, 50n, 40n]);

    // the second separator moves panes 1 and 2 and never pane 0
    expect(sizes(run(focused1, "right"))).toEqual([20n, 50n, 30n]);
    expect(sizes(run(focused1, "left"))).toEqual([20n, 30n, 50n]);
    expect(run(focused1, "right", "right", "right")).toMatchObject({ s1: 70n, s2: 10n });
  });

  it("moves along the orientation only", () => {
    expect(run(focused0, "up", "down")).toEqual(focused0);
    const horizontal = run(focused0, "orientHorizontal");
    expect(sizes(run(horizontal, "up"))).toEqual([10n, 50n, 40n]);
    expect(sizes(run(horizontal, "down"))).toEqual([30n, 30n, 40n]);
    expect(run(horizontal, "left", "right")).toEqual(horizontal);
  });

  it("Home and End jump the focused pair to its bounds", () => {
    expect(sizes(run(focused0, "home"))).toEqual([10n, 50n, 40n]);
    expect(sizes(run(focused0, "end"))).toEqual([50n, 10n, 40n]);
    expect(sizes(run(focused1, "home"))).toEqual([20n, 10n, 70n]);
    expect(sizes(run(focused1, "end"))).toEqual([20n, 70n, 10n]);
  });

  it("Enter collapses pane 0, Enter restores the remembered size", () => {
    const collapsed = run(focused0, "enter");
    expect(collapsed).toMatchObject({
      s0: 0n,
      s1: 60n,
      s2: 40n,
      prev0: 20n,
      justRestored: false,
      requests: 1n,
    });

    const restored = run(collapsed, "enter");
    expect(restored).toMatchObject({ s0: 20n, s1: 40n, s2: 40n, justRestored: true });

    // a movement clears the restore marker
    expect(run(restored, "right")).toMatchObject({ justRestored: false, s0: 30n });

    // a separator that has no collapsible pane next to it does nothing
    expect(run(focused1, "enter")).toEqual(focused1);
  });

  it("collapsing cascades outward when the neighbour is at MAX, restoring cascades back", () => {
    // pane 0 at MAX, pane 1 at MIN, pane 2 at MIN: collapsing pane 0 cannot be
    // absorbed by pane 1 alone, so the overflow lands on pane 2
    const wide = run(focused1, "end", "focusSep0", "end");
    expect(sizes(wide)).toEqual([80n, 10n, 10n]);

    const collapsed = run(wide, "enter");
    expect(sizes(collapsed)).toEqual([0n, 80n, 20n]);
    expect(collapsed).toMatchObject({ prev0: 80n });

    // restoring takes the space back from pane 1 first (down to MIN), then pane 2
    const restored = run(collapsed, "enter");
    expect(sizes(restored)).toEqual([80n, 10n, 10n]);
    expect(restored).toMatchObject({ justRestored: true, prev0: 80n });
  });

  it("a separator next to a collapsed pane is immovable", () => {
    const collapsed = run(focused0, "enter");
    expect(run(collapsed, "right", "left", "home", "end", "up", "down")).toEqual(collapsed);
    // a pointerdown on it does not start a drag either
    expect(run(collapsed, "dragDown0")).toMatchObject({ dr: -1n, dd: 0n });
    // while the other separator still moves panes 1 and 2
    expect(sizes(run(collapsed, "focusSep1", "left"))).toEqual([0n, 50n, 50n]);
  });

  it("drags from the pointerdown snapshot, clamped by the pair's bounds", () => {
    const down = run(focused0, "dragDown0");
    expect(down).toMatchObject({ dr: 0n, dd: 0n, k0: 20n, k1: 40n, k2: 40n, requests: 0n });

    const right = run(down, "dragNext");
    expect(right).toMatchObject({ s0: 30n, s1: 30n, s2: 40n, dd: 10n, requests: 1n });

    // one more notch, then back one: the snapshot, not the last layout, decides
    expect(sizes(run(right, "dragNext", "dragPrev"))).toEqual([30n, 30n, 40n]);
    // one notch back is the pointerdown layout, not a step from the last one
    expect(sizes(run(right, "dragPrev"))).toEqual([20n, 40n, 40n]);
    // past MIN the layout clamps and the delta keeps growing without a request
    const clamped = run(right, "dragPrev", "dragPrev", "dragPrev");
    expect(clamped).toMatchObject({ s0: 10n, s1: 50n, dd: -20n, requests: 3n });

    // pointerup ends the drag and keeps the layout
    expect(run(clamped, "dragUp")).toMatchObject({ dr: -1n, dd: 0n, s0: 10n, s1: 50n });

    // the other separator leaves pane 0 alone (DragMovesOnlyNeighbours)
    const second = run(focused1, "dragDown1", "dragNext");
    expect(sizes(second)).toEqual([20n, 50n, 30n]);
    expect(second).toMatchObject({ dr: 1n, k0: 20n });
  });

  it("keeps the drag delta bounded while the pointer keeps moving", () => {
    let state = run(focused0, "dragDown0");
    for (let index = 0; index < 20; index += 1) {
      state = run(state, "dragNext");
    }
    expect(state).toMatchObject({ dd: 100n, s0: 50n, s1: 10n });
  });

  it("controlled, a request the host ignores leaves the layout untouched", () => {
    const held = run(initial, "control", "focusSep0");
    const moved = run(held, "right");
    expect(moved).toMatchObject({
      s0: 20n,
      s1: 40n,
      s2: 40n,
      outcome: "rejected",
      rq0: 30n,
      rq1: 30n,
      b0: 20n,
      b1: 40n,
      requests: 1n,
    });

    // the collapse is rejected together with the layout
    const collapsing = run(held, "enter");
    expect(collapsing).toMatchObject({ s0: 20n, prev0: 20n, outcome: "rejected" });
    expect(run(collapsing, "dragDown0", "dragNext")).toMatchObject({
      s0: 20n,
      outcome: "rejected",
    });
  });

  it("controlled, only a host write commits", () => {
    const held = run(initial, "control");
    // host writes are inert while uncontrolled
    expect(run(initial, "hostWide")).toEqual(initial);

    const wide = run(held, "hostWide");
    expect(wide).toMatchObject({
      s0: 50n,
      s1: 30n,
      s2: 20n,
      prev0: 50n,
      outcome: "none",
      dr: -1n,
    });
    expect(run(wide, "hostCollapsed")).toMatchObject({ s0: 0n, s1: 50n, s2: 50n, prev0: 50n });
    // a write settles a pending request and cancels a running drag
    expect(run(held, "right", "hostNarrow")).toMatchObject({
      s0: 10n,
      outcome: "none",
      dr: -1n,
    });
  });

  it("controlled, a host that accepts commits every target through the layout", () => {
    const host = run(initial, "control", "acceptRequests", "focusSep0");
    const moved = run(host, "right");
    expect(moved).toMatchObject({
      s0: 30n,
      s1: 30n,
      outcome: "accepted",
      rq0: 30n,
      requests: 1n,
    });
    expect(run(moved, "enter")).toMatchObject({ s0: 0n, s1: 60n, outcome: "accepted" });
    expect(run(moved, "dragDown0", "dragNext", "dragUp")).toMatchObject({
      s0: 40n,
      s1: 20n,
      dr: -1n,
    });
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 5, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(50);
  });
});

describe("resizable panels scenarios (spec driver)", () => {
  const file = parseScenarioFile(scenarios);
  for (const scenario of file.scenarios) {
    it(scenario.id, async () => {
      const result = await replayScenario(scenario, resizablePanelsBridge, (config) =>
        specDriver(model, resizablePanelsBridge, config),
      );
      // our own scenarios must be expressible: an `unsupported` here is a gap
      // in the bridge, not a step we deliberately drop
      expect(result.status).toBe("passed");
    });
  }
});
