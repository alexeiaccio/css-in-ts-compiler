import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { assertReachable, explore, stateKey } from "@quint-machine/core/testing";
import { describe, expect, it } from "vite-plus/test";
import { differentialWalk, specDriver } from "../../src/scenario";
import { timelineBridge, timelineProbe, timelineSteps } from "../../src/apg/timeline.bridge";
import definitionJson from "../../src/apg/timeline.model.generated.json";

// Spec-only verification for specs/apg/timeline.qnt plus the scenario bridge.
//
// Span tree (pre-order ids): 1 root > {2 child > {3 leaf, 4 leaf}, 5 leaf}.
// `expanded` is a bitmask over nodes 1..5 (weight 2^(id-1)); `selected` is the
// selected id (0 = none); `focus` is the roving node; `viewStart`/`viewEnd` is
// the zoom window over the 0..100 tick domain.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);
const initial = model.initial;

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const run = (...events: ReadonlyArray<Record<string, unknown>>) => events.reduce(step, initial);

const tag = (name: string) => ({ _tag: name });
const click = (node: number) => ({ _tag: "click", node: BigInt(node) });
const focusNode = (node: number) => ({ _tag: "focusNode", node: BigInt(node) });
const selectNode = (node: number) => ({
  _tag: "selectNode",
  node: BigInt(node),
});
const setValue = (value: number) => ({ _tag: "setValue", v: BigInt(value) });

describe("apg timeline (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(model.invariants.map((invariant) => invariant.name)).toEqual([
      "FocusKnown",
      "FocusVisible",
      "SelectedKnown",
      "ZoomOrdered",
      "ZoomBounded",
      "LeafNeverExpanded",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    // the roving node must be one of the five nodes
    expect(violatedInvariants(model, { ...initial, focus: 6n })).toContain("FocusKnown");
    // a child hidden by a closed parent cannot hold focus
    expect(violatedInvariants(model, { ...initial, focus: 3n, expanded: 0n })).toEqual([
      "FocusVisible",
    ]);
    // selection is none or a real node
    expect(violatedInvariants(model, { ...initial, selected: 9n })).toEqual(["SelectedKnown"]);
    // the zoom window is non-empty
    expect(violatedInvariants(model, { ...initial, viewStart: 5n, viewEnd: 5n })).toEqual([
      "ZoomOrdered",
    ]);
    // the zoom window stays inside 0..100
    expect(violatedInvariants(model, { ...initial, viewStart: 0n, viewEnd: 101n })).toEqual([
      "ZoomBounded",
    ]);
    // leaves are never recorded as expanded
    expect(violatedInvariants(model, { ...initial, expanded: 4n })).toEqual(["LeafNeverExpanded"]);
    // an event committed while controlled: the state left the value prop behind
    expect(
      violatedInvariants(model, {
        ...initial,
        controlled: true,
        valueProp: 0n,
        selected: 1n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the selection anyway
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "rejected",
        base: 0n,
        selected: 1n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "accepted",
        requested: 2n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("starts closed, nothing selected, focused by roving tabindex, full domain", () => {
    expect(initial).toMatchObject({
      expanded: 0n,
      selected: 0n,
      focus: 1n,
      hasFocus: false,
      viewStart: 0n,
      viewEnd: 100n,
    });
  });

  it("key events are ignored while the timeline does not have focus", () => {
    const state = run(
      tag("pressDown"),
      tag("pressUp"),
      tag("pressRight"),
      tag("pressLeft"),
      tag("pressHome"),
      tag("pressEnd"),
      tag("pressEnter"),
    );
    expect(state).toEqual(initial);
  });

  it("Down/Up walk only visible nodes; Right opens then enters; Left closes", () => {
    let state = run(tag("focusTimeline"));
    expect(state).toMatchObject({ focus: 1n, hasFocus: true });

    state = step(state, tag("pressRight")); // open the root, focus stays
    expect(state).toMatchObject({ expanded: 1n, focus: 1n });

    state = step(state, tag("pressDown")); // 2 is now visible
    expect(state).toMatchObject({ focus: 2n });

    state = step(state, tag("pressRight")); // open 2, focus stays
    expect(state).toMatchObject({ expanded: 3n, focus: 2n });

    state = step(state, tag("pressRight")); // 2 is open -> enter its first child
    expect(state).toMatchObject({ focus: 3n });

    state = step(state, tag("pressDown"));
    expect(state).toMatchObject({ focus: 4n });
    state = step(state, tag("pressDown"));
    expect(state).toMatchObject({ focus: 5n });
    state = step(state, tag("pressDown")); // last visible stays put
    expect(state).toMatchObject({ focus: 5n });

    state = step(state, tag("pressHome"));
    expect(state).toMatchObject({ focus: 1n });
    state = step(state, tag("pressLeft")); // root is open -> close, focus stays
    expect(state).toMatchObject({ expanded: 2n, focus: 1n });
  });

  it("End is the last node focusable without opening anything", () => {
    let state = run(tag("focusTimeline"), tag("pressEnd"));
    expect(state).toMatchObject({ focus: 1n });

    state = run(
      focusNode(1),
      tag("pressRight"), // open the root
      tag("pressRight"), // enter node 2
      tag("pressEnd"),
    );
    expect(state).toMatchObject({ focus: 5n, expanded: 1n });
  });

  it("Enter selects the focused span; click selects and toggles parents", () => {
    // a hidden row is unreachable by pointer
    let state = run(click(3));
    expect(state).toMatchObject({
      focus: 1n,
      hasFocus: false,
      selected: 0n,
      expanded: 0n,
    });

    state = step(state, click(1)); // visible parent: open, select, focus
    expect(state).toMatchObject({
      expanded: 1n,
      selected: 1n,
      focus: 1n,
      hasFocus: true,
    });
    state = step(state, click(2)); // open 2, select it
    expect(state).toMatchObject({ expanded: 3n, selected: 2n, focus: 2n });
    state = step(state, click(1)); // open parent toggles closed again
    expect(state).toMatchObject({ expanded: 2n, selected: 1n, focus: 1n });

    const entered = run(focusNode(1), tag("pressRight"), tag("pressDown"), tag("pressEnter"));
    expect(entered).toMatchObject({ focus: 2n, selected: 2n });
  });

  it("zoomIn shrinks around the centre and stops at the minimum width", () => {
    let state = run(tag("zoomIn"));
    // 0..100 -> width 75, start 12
    expect(state).toMatchObject({ viewStart: 12n, viewEnd: 87n });
    state = step(state, tag("zoomIn"));
    // 12..87 -> width 57, start 21
    expect(state).toMatchObject({ viewStart: 21n, viewEnd: 78n });

    let atMin = run(tag("zoomReset"));
    for (let index = 0; index < 20; index += 1) {
      atMin = step(atMin, tag("zoomIn"));
    }
    expect(Number(atMin["viewEnd"]) - Number(atMin["viewStart"])).toBe(10);
    expect(step(atMin, tag("zoomIn"))).toEqual(atMin);
  });

  it("zoomOut grows to the full domain and then is a no-op", () => {
    const full = run(tag("zoomReset"));
    expect(step(full, tag("zoomOut"))).toEqual(full);
    expect(step(full, tag("panRight"))).toEqual(full);
    expect(step(full, tag("panLeft"))).toEqual(full);

    const zoomed = run(tag("zoomIn")); // 12..87
    expect(step(zoomed, tag("panRight"))).toMatchObject({
      viewStart: 25n,
      viewEnd: 100n,
    });
    expect(step(zoomed, tag("panLeft"))).toMatchObject({
      viewStart: 0n,
      viewEnd: 75n,
    });
    // growing past the right edge clamps at the domain end
    const nearEnd = run(tag("zoomIn"), tag("panRight"), tag("panRight"));
    expect(step(nearEnd, tag("zoomOut"))).toMatchObject({ viewEnd: 100n });
  });

  it("uncontrolled, every selection request is accepted and commits its intent", () => {
    const selected = step(initial, selectNode(2));
    expect(selected).toMatchObject({
      selected: 2n,
      outcome: "accepted",
      requested: 2n,
      base: 0n,
      requests: 1n,
    });
    // a redundant request is not a request
    expect(step(selected, selectNode(2))).toEqual(selected);
    // host commits are inert without a controlled value
    expect(model.transition(selected, setValue(1))).toEqual(selected);
  });

  it("controlled, a rejected request leaves the selection untouched", () => {
    const controlled = step(initial, tag("control"));
    const requested = step(controlled, selectNode(3));
    expect(requested).toMatchObject({
      selected: 0n,
      valueProp: 0n,
      outcome: "rejected",
      requested: 3n,
      base: 0n,
      requests: 1n,
    });
    // a host write is the only commit while controlled
    expect(step(requested, setValue(3))).toMatchObject({
      selected: 3n,
      valueProp: 3n,
      outcome: "none",
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = step(step(initial, tag("control")), tag("acceptRequests"));
    const selected = step(host, selectNode(3));
    expect(selected).toMatchObject({
      selected: 3n,
      valueProp: 3n,
      outcome: "accepted",
      requested: 3n,
      requests: 1n,
    });
    expect(step(selected, selectNode(1))).toMatchObject({
      selected: 1n,
      valueProp: 1n,
      requests: 2n,
    });
  });

  it("controlled, Enter and click request the selection while focus/expansion still move", () => {
    const controlled = step(initial, tag("control"));
    const focused = [tag("focusTimeline"), tag("pressRight"), tag("pressDown")].reduce(
      step,
      controlled,
    );
    const requested = step(focused, tag("pressEnter"));
    expect(requested).toMatchObject({
      selected: 0n,
      valueProp: 0n,
      outcome: "rejected",
      requested: 2n,
      focus: 2n,
      requests: 1n,
    });
    // a pointer click on the root still opens it and moves focus
    const clicked = step(controlled, click(1));
    expect(clicked).toMatchObject({
      selected: 0n,
      outcome: "rejected",
      requested: 1n,
      expanded: 1n,
      focus: 1n,
      requests: 1n,
    });
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 4, maxStates: 30_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(50);
    assertReachable(report, "a nested node is focused", (state) => state["focus"] === 3n);
    assertReachable(report, "a panned zoom window", (state) => state["viewStart"] !== 0n);
    assertReachable(report, "a controlled held state", (state) => state["controlled"] === true);
    assertReachable(report, "an accepted request", (state) => state["outcome"] === "accepted");
  });

  it("a differential walk of the spec against itself is stable", async () => {
    await differentialWalk({
      alphabet: timelineSteps,
      probe: timelineProbe,
      makePair: () =>
        Promise.resolve([specDriver(model, timelineBridge), specDriver(model, timelineBridge)]),
      runs: 5,
      steps: 20,
    });
  });
});
