import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { explore, simulate } from "@quint-machine/core/testing";
import { Schema } from "effect";
import definitionJson from "../../src/apg/treeview.model.generated.json";

// Spec-only verification for specs/apg/treeview.qnt.
//
// The spec's reference model is the system under test: events are stepped
// through `transition` and every declared invariant is checked after every
// step. Node ids (pre-order): 1 Projects > {2 Reports > {3 Roadmap, 4 Summary},
// 5 Notes}, 6 Photos > {7 Trip}. `expanded` / `selected` are bitmasks with
// weight 2^(id-1): 1->1, 2->2, 3->4, 4->8, 5->16, 6->32, 7->64.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const run = (...events: ReadonlyArray<Record<string, unknown>>) =>
  events.reduce(step, model.initial);

const tag = (name: string) => ({ _tag: name });
const click = (node: number) => ({ _tag: "click", node: BigInt(node) });
const type = (ch: string) => ({ _tag: "typeChar", ch });
const focused = tag("focusTree");

describe("apg treeview (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "FocusKnown",
      "FocusVisible",
      "ExactlyOneTabbable",
      "MasksInRange",
      "LeafNeverExpanded",
      "AriaExpandedOnlyOnParents",
      "AriaPositionConsistent",
      "SingleSelectAtMostOne",
      "TypeaheadBufferShape",
      "ActivatedKnown",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    // focus on a hidden node, a leaf recorded as expanded, two selections in a
    // single-select tree, a typeahead buffer with a hole, an unknown activation
    expect(
      violatedInvariants(model, {
        ...model.initial,
        focus: 3n,
        expanded: 4n,
        selected: 3n,
        ta1: "",
        ta2: "x",
        activated: 9n,
      }),
    ).toEqual([
      "FocusVisible",
      "LeafNeverExpanded",
      "SingleSelectAtMostOne",
      "TypeaheadBufferShape",
      "ActivatedKnown",
    ]);
    // the roving node must be one of the seven nodes
    expect(violatedInvariants(model, { ...model.initial, focus: 0n })).toContain("FocusKnown");
    expect(violatedInvariants(model, { ...model.initial, focus: 0n })).toContain(
      "ExactlyOneTabbable",
    );
    // masks stay inside the node set
    expect(violatedInvariants(model, { ...model.initial, expanded: 128n })).toContain(
      "MasksInRange",
    );
    // a child hidden by a closed parent cannot hold focus (2 closed, 3 focused)
    expect(violatedInvariants(model, { ...model.initial, focus: 3n, expanded: 1n })).toEqual([
      "FocusVisible",
    ]);
    // an event committed while controlled: the selection left the value prop behind
    expect(
      violatedInvariants(model, {
        ...model.initial,
        controlled: true,
        valueProp0: false,
        selected: 1n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the selection anyway
    expect(
      violatedInvariants(model, {
        ...model.initial,
        outcome: "rejected",
        base: 0n,
        selected: 1n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...model.initial,
        outcome: "accepted",
        requested: 0n,
        selected: 1n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("starts closed, single-select, tabbable on the first node", () => {
    expect(model.initial).toMatchObject({
      multi: false,
      expanded: 0n,
      selected: 0n,
      focus: 1n,
      hasFocus: false,
      activated: 0n,
    });
  });

  it("keys are ignored while the tree does not have focus", () => {
    const state = run(
      tag("pressDown"),
      tag("pressRight"),
      tag("pressSpace"),
      tag("pressEnter"),
      tag("pressStar"),
      type("p"),
    );
    expect(state).toMatchObject({
      focus: 1n,
      expanded: 0n,
      selected: 0n,
      activated: 0n,
      ta1: "",
    });
  });

  it("Down/Up skip collapsed subtrees; the ends do nothing", () => {
    let state = run(focused, tag("pressUp"));
    expect(state).toMatchObject({ focus: 1n });

    state = step(state, tag("pressDown"));
    expect(state).toMatchObject({ focus: 6n });
    // node 6 is collapsed, so 7 is skipped and Down stays on the last visible
    state = step(state, tag("pressDown"));
    expect(state).toMatchObject({ focus: 6n });

    state = step(state, tag("pressUp"));
    expect(state).toMatchObject({ focus: 1n });
  });

  it("Right opens a closed parent, then enters it; Down walks the open nodes", () => {
    let state = run(focused, tag("pressRight"));
    expect(state).toMatchObject({ expanded: 1n, focus: 1n });

    state = step(state, tag("pressRight"));
    expect(state).toMatchObject({ expanded: 1n, focus: 2n });

    state = step(state, tag("pressRight"));
    expect(state).toMatchObject({ expanded: 3n, focus: 2n });
    state = step(state, tag("pressRight"));
    expect(state).toMatchObject({ focus: 3n });

    // Right on an end node does nothing
    state = step(state, tag("pressRight"));
    expect(state).toMatchObject({ expanded: 3n, focus: 3n });

    for (const expected of [4n, 5n, 6n, 6n]) {
      state = step(state, tag("pressDown"));
      expect(state).toMatchObject({ focus: expected });
    }
  });

  it("Left closes an open parent, else moves to the parent, root is a no-op", () => {
    // open 1 and 2, focus the leaf 3
    let state = run(
      focused,
      tag("pressRight"),
      tag("pressRight"),
      tag("pressRight"),
      tag("pressRight"),
    );
    expect(state).toMatchObject({ focus: 3n, expanded: 3n });

    state = step(state, tag("pressLeft"));
    expect(state).toMatchObject({ focus: 2n, expanded: 3n });
    state = step(state, tag("pressLeft"));
    expect(state).toMatchObject({ focus: 2n, expanded: 1n });
    state = step(state, tag("pressLeft"));
    expect(state).toMatchObject({ focus: 1n, expanded: 1n });
    state = step(state, tag("pressLeft"));
    expect(state).toMatchObject({ focus: 1n, expanded: 0n });
    state = step(state, tag("pressLeft"));
    expect(state).toMatchObject({ focus: 1n, expanded: 0n });
  });

  it("Home and End jump to the first and last visible node without opening", () => {
    let state = run(focused, tag("pressEnd"));
    expect(state).toMatchObject({ focus: 6n, expanded: 0n });

    state = step(state, tag("pressRight"));
    state = step(state, tag("pressHome"));
    expect(state).toMatchObject({ focus: 1n, expanded: 32n });
    state = step(state, tag("pressEnd"));
    expect(state).toMatchObject({ focus: 7n });
    state = step(state, tag("pressHome"));
    expect(state).toMatchObject({ focus: 1n });
  });

  it("* opens every parent sibling of the focused node", () => {
    // from the root level: Projects and Photos both open, nothing else
    let state = run(focused, tag("pressStar"));
    expect(state).toMatchObject({ expanded: 33n, focus: 1n });

    // from level 2 (focus 2): only Reports opens — Notes is an end node
    state = run(focused, tag("pressRight"), tag("pressRight"), tag("pressStar"));
    // (Photos is not a sibling of Reports, so it stays closed)
    expect(state).toMatchObject({ expanded: 3n, focus: 2n });
  });

  it("type-ahead jumps to the next visible match and refines on more characters", () => {
    // two roots start with "p": Projects (1) and Photos (6)
    let state = run(focused, type("p"));
    expect(state).toMatchObject({ focus: 6n, ta1: "p", ta2: "" });
    // "ph" refines in place; "pr" would wrap around to Projects
    state = step(state, type("h"));
    expect(state).toMatchObject({ focus: 6n, ta1: "p", ta2: "h" });

    state = step(state, tag("typeaheadReset"));
    expect(state).toMatchObject({ ta1: "", ta2: "" });
    state = step(state, type("p"));
    expect(state).toMatchObject({ focus: 1n });
    state = step(state, type("r"));
    expect(state).toMatchObject({ focus: 1n, ta1: "p", ta2: "r" });

    // a third character restarts the buffer
    state = step(state, type("t"));
    expect(state).toMatchObject({ ta1: "t", ta2: "" });
  });

  it("type-ahead never lands on a hidden node", () => {
    // "r": Reports (2) and Roadmap (3) are hidden while Projects is closed
    let state = run(focused, type("r"));
    expect(state).toMatchObject({ focus: 1n, ta1: "r" });

    // open Projects: Reports becomes the only visible "r"
    state = run(focused, tag("pressRight"), type("r"));
    expect(state).toMatchObject({ focus: 2n });
    // "ro" targets Roadmap, hidden while Reports is closed -> focus stays
    state = step(state, type("o"));
    expect(state).toMatchObject({ focus: 2n, ta1: "r", ta2: "o" });
    // once Reports is open, a fresh "ro" reaches Roadmap
    state = run(
      focused,
      tag("pressRight"),
      tag("pressRight"),
      tag("pressRight"),
      tag("pressHome"),
      type("r"),
      type("o"),
    );
    expect(state).toMatchObject({ focus: 3n });
  });

  it("single-select: Space/Enter/click replace the selection, Shift+Arrow and Ctrl+A do not select", () => {
    let state = run(focused, tag("pressSpace"));
    expect(state).toMatchObject({ selected: 1n });

    state = step(state, tag("pressDown"));
    expect(state).toMatchObject({ focus: 6n, selected: 1n });
    state = step(state, tag("pressSpace"));
    expect(state).toMatchObject({ selected: 32n });
    // Space does not deselect in a single-select tree
    state = step(state, tag("pressSpace"));
    expect(state).toMatchObject({ selected: 32n });

    state = step(state, tag("pressShiftUp"));
    expect(state).toMatchObject({ focus: 1n, selected: 32n });
    state = step(state, tag("pressCtrlA"));
    expect(state).toMatchObject({ selected: 32n });

    // Enter selects, activates, and opens a parent
    state = step(state, tag("pressEnter"));
    expect(state).toMatchObject({ selected: 1n, activated: 1n, expanded: 1n });
  });

  it("multi-select: Space toggles, Shift+Arrow moves and toggles, Ctrl+A selects all then clears", () => {
    let state = run({ _tag: "configure", m: true }, focused);
    expect(state).toMatchObject({ multi: true });

    state = step(state, tag("pressSpace"));
    expect(state).toMatchObject({ selected: 1n });
    state = step(state, tag("pressSpace"));
    expect(state).toMatchObject({ selected: 0n });

    // Shift+Down toggles the node arrived at (6), not the one left (1)
    state = step(state, tag("pressShiftDown"));
    expect(state).toMatchObject({ focus: 6n, selected: 32n });
    // at the last visible node it neither moves nor toggles
    state = step(state, tag("pressShiftDown"));
    expect(state).toMatchObject({ focus: 6n, selected: 32n });
    state = step(state, tag("pressShiftUp"));
    expect(state).toMatchObject({ focus: 1n, selected: 33n });

    state = step(state, tag("pressCtrlA"));
    expect(state).toMatchObject({ selected: 127n });
    state = step(state, tag("pressCtrlA"));
    expect(state).toMatchObject({ selected: 0n });
  });

  it("switching selection mode resets the selection", () => {
    let state = run({ _tag: "configure", m: true }, focused, tag("pressCtrlA"));
    expect(state).toMatchObject({ selected: 127n });
    state = step(state, { _tag: "configure", m: true });
    expect(state).toMatchObject({ selected: 127n });
    state = step(state, { _tag: "configure", m: false });
    expect(state).toMatchObject({ multi: false, selected: 0n });
  });

  it("click: hidden nodes are unreachable; a parent toggles; focus follows the click", () => {
    // node 3 is hidden: the click is ignored
    let state = run(click(3));
    expect(state).toMatchObject({ focus: 1n, hasFocus: false, activated: 0n });

    state = step(state, click(1));
    expect(state).toMatchObject({
      focus: 1n,
      hasFocus: true,
      expanded: 1n,
      selected: 1n,
      activated: 1n,
    });
    state = step(state, click(5));
    expect(state).toMatchObject({ focus: 5n, expanded: 1n, selected: 16n });

    // clicking the open ancestor collapses it and takes focus from the child
    state = step(state, click(1));
    expect(state).toMatchObject({ focus: 1n, expanded: 0n });
  });

  it("blur drops the type-ahead buffer and keeps the roving node", () => {
    // "p" from Photos wraps to Projects (Photos' children are hidden)
    const typed = run(focused, tag("pressDown"), type("p"));
    expect(typed).toMatchObject({ focus: 1n, ta1: "p" });
    const state = step(typed, tag("blurTree"));
    expect(state).toMatchObject({ hasFocus: false, focus: 1n, ta1: "" });
    expect(step(state, focused)).toMatchObject({ hasFocus: true, focus: 1n });
  });

  describe("request vs commit (map ticket rt1p)", () => {
    it("uncontrolled, every request is accepted and commits its intent", () => {
      const state = run(focused, tag("pressSpace"));
      expect(state).toMatchObject({
        selected: 1n,
        outcome: "accepted",
        requested: 1n,
        base: 0n,
        requests: 1n,
      });
      // the host-side events are inert without a controlled value
      expect(step(state, { _tag: "hostToggle", n: 1n })).toEqual(state);
      expect(model.transition(state, { _tag: "setValue", v: 2n })).toEqual(state);
    });

    it("controlled, a request the host ignores leaves the selection untouched", () => {
      const controlled = run(focused, tag("control"));
      const requested = step(controlled, tag("pressSpace"));
      expect(requested).toMatchObject({
        selected: 0n,
        valueProp0: false,
        outcome: "rejected",
        requested: 1n,
        base: 0n,
        requests: 1n,
      });
    });

    it("controlled, only the value prop commits", () => {
      const rejected = run(focused, tag("control"), tag("pressSpace"));
      const committed = step(rejected, { _tag: "hostToggle", n: 1n });
      expect(committed).toMatchObject({
        selected: 1n,
        valueProp0: true,
        outcome: "none",
        requests: 1n,
      });
      expect(model.transition(committed, { _tag: "setValue", v: 0n })).toMatchObject({
        selected: 0n,
        outcome: "none",
      });
      // control adopts the current selection
      expect(step(run(focused, tag("pressSpace")), tag("control"))).toMatchObject({
        selected: 1n,
        valueProp0: true,
      });
    });

    it("controlled, a host that accepts commits the intent through the value", () => {
      const host = run(focused, tag("control"), tag("acceptRequests"));
      const selected = step(host, tag("pressSpace"));
      expect(selected).toMatchObject({
        selected: 1n,
        valueProp0: true,
        outcome: "accepted",
        requested: 1n,
        requests: 1n,
      });
    });
  });

  it("exposes a typed event schema for the click node pool", () => {
    const schema = model.eventSchemas["click"];
    if (schema === undefined) {
      throw new Error("no event schema for click");
    }
    const decode = Schema.decodeUnknownSync(schema as Schema.Codec<Record<string, unknown>>);
    expect(decode({ _tag: "click", node: 3n })).toEqual({
      _tag: "click",
      node: 3n,
    });
    expect(() => decode({ _tag: "click", node: "three" })).toThrow();
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 3, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
  });

  it("long random walks never violate an invariant", () => {
    const report = simulate(model, { runs: 60, maxSteps: 100, seed: 7 });
    expect(report.violations).toEqual([]);
    expect(report.steps).toBe(60 * 100);
    // the walks reach the deepest level and every node gets focus
    const focusedNodes = new Set(report.states.map((state) => state["focus"]));
    expect(focusedNodes.size).toBe(7);
  });
});
