import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import {
  assertReachable,
  assertUnreachable,
  eventsOf,
  explore,
  simulate,
  stateKey,
} from "@quint-machine/core/testing";
import { describe, expect, it } from "vite-plus/test";
import definitionJson from "../../src/apg/accordion.model.generated.json";

// Spec-only verification for specs/apg/accordion.qnt (WAI-ARIA APG accordion).
//
// The spec's reference model is the system under test: events come from the
// spec's own pools, `transition` is stepped, and every declared invariant is
// checked after every step.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const run = (events: ReadonlyArray<Record<string, unknown>>): QuintModelValue =>
  events.reduce(step, model.initial);

const expandedOf = (state: QuintModelValue): boolean[] => [
  state["expanded0"] === true,
  state["expanded1"] === true,
  state["expanded2"] === true,
];

const click = (panel: number) => ({
  _tag: "click_header",
  panel: BigInt(panel),
});
const clickContent = (panel: number) => ({
  _tag: "click_content",
  panel: BigInt(panel),
});
const setMultiple = (allow: boolean) => ({ _tag: "set_multiple", allow });
const setCollapsible = (allow: boolean) => ({ _tag: "set_collapsible", allow });
const control = { _tag: "control" };
const acceptRequests = { _tag: "acceptRequests" };
const setValue = (v: number) => ({ _tag: "setValue", v: BigInt(v) });

describe("apg accordion (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "FocusInRange",
      "FocusNotInCollapsedPanel",
      "SingleModeAtMostOneExpanded",
      "NonCollapsibleKeepsOneExpanded",
      "AriaDisabledOnlyOnExpanded",
      "AriaDisabledMatchesToggle",
      "ExpandRespectsMode",
      "AriaExpandedMirrorsVisibility",
      "ControlsLabelledByRoundTrip",
      "HeadingLevelValid",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("derives its event alphabet from the spec pools", () => {
    const tags = new Set(eventsOf(model).map((event) => event._tag));
    expect([...tags].sort()).toEqual([
      "acceptRequests",
      "blur",
      "click_content",
      "click_header",
      "control",
      "hostToggle",
      "key_enter",
      "key_shift_tab",
      "key_space",
      "key_tab",
      "setValue",
      "set_collapsible",
      "set_heading_level",
      "set_multiple",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    const base = {
      expanded0: false,
      expanded1: false,
      expanded2: false,
      focus: -1n,
      multiple: false,
      collapsible: true,
      headingLevel: 3n,
      controlled: false,
      accepting: false,
      valueProp: 0n,
      requested: 0n,
      outcome: "none",
      base: 0n,
      requests: 0n,
    };
    expect(violatedInvariants(model, base)).toEqual([]);
    expect(
      violatedInvariants(model, {
        ...base,
        expanded0: true,
        expanded1: true,
      }),
    ).toEqual(["SingleModeAtMostOneExpanded"]);
    expect(violatedInvariants(model, { ...base, focus: 3n })).toEqual(["FocusNotInCollapsedPanel"]);
    expect(violatedInvariants(model, { ...base, focus: 9n })).toContain("FocusInRange");
    expect(violatedInvariants(model, { ...base, collapsible: false })).toEqual([
      "NonCollapsibleKeepsOneExpanded",
    ]);
    expect(violatedInvariants(model, { ...base, headingLevel: 0n })).toEqual(["HeadingLevelValid"]);
    // controlled: an event committed and the panels left the value prop behind
    expect(
      violatedInvariants(model, {
        ...base,
        controlled: true,
        valueProp: 0n,
        expanded0: true,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the state anyway
    expect(
      violatedInvariants(model, {
        ...base,
        outcome: "rejected",
        base: 0n,
        expanded0: true,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...base,
        outcome: "accepted",
        requested: 1n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("Enter and Space expand the focused header and collapse it again", () => {
    let state = run([{ _tag: "key_tab" }]);
    expect(state).toMatchObject({ focus: 0n, expanded0: false });

    state = step(state, { _tag: "key_enter" });
    expect(expandedOf(state)).toEqual([true, false, false]);
    expect(state["focus"]).toBe(0n);

    state = step(state, { _tag: "key_space" });
    expect(expandedOf(state)).toEqual([false, false, false]);
  });

  it("Enter/Space do nothing unless a header has focus", () => {
    const outside = step(model.initial, { _tag: "key_enter" });
    expect(outside).toEqual(model.initial);

    const inContent = run([click(0), { _tag: "key_tab" }]);
    expect(inContent["focus"]).toBe(1n);
    expect(step(inContent, { _tag: "key_space" })).toEqual(inContent);
  });

  it("single mode: expanding one panel collapses the other", () => {
    const state = run([click(0), click(1)]);
    expect(expandedOf(state)).toEqual([false, true, false]);
    expect(state["focus"]).toBe(2n);
  });

  it("multiple mode keeps several panels expanded", () => {
    const state = run([setMultiple(true), click(0), click(2), click(1)]);
    expect(expandedOf(state)).toEqual([true, true, true]);
  });

  it("non-collapsible single mode refuses to collapse the open panel", () => {
    const state = run([setCollapsible(false)]);
    // switching to non-collapsible with nothing open expands panel 0
    expect(expandedOf(state)).toEqual([true, false, false]);

    const refused = step(state, click(0));
    expect(expandedOf(refused)).toEqual([true, false, false]);

    const switched = step(refused, click(2));
    expect(expandedOf(switched)).toEqual([false, false, true]);
  });

  it("multiple + non-collapsible: only the last expanded panel is protected", () => {
    let state = run([setMultiple(true), setCollapsible(false)]);
    // switching to non-collapsible expanded panel 0; add panel 1
    expect(expandedOf(state)).toEqual([true, false, false]);
    state = step(state, click(1));
    expect(expandedOf(state)).toEqual([true, true, false]);

    // either may collapse while the other stays
    state = step(state, click(0));
    expect(expandedOf(state)).toEqual([false, true, false]);
    // the last one is locked
    state = step(state, click(1));
    expect(expandedOf(state)).toEqual([false, true, false]);
  });

  it("Tab walks headers and only the expanded panels\u2019 content", () => {
    const order = (events: ReadonlyArray<Record<string, unknown>>): bigint[] => {
      let state = run(events);
      const visited: bigint[] = [];
      for (let i = 0; i < 8; i += 1) {
        state = step(state, { _tag: "key_tab" });
        const focus = state["focus"];
        visited.push(typeof focus === "bigint" ? focus : -2n);
        if (focus === -1n) break;
      }
      return visited;
    };

    // all collapsed: header0, header1, header2, out
    expect(order([])).toEqual([0n, 2n, 4n, -1n]);
    // panel 1 expanded: its content is a tab stop between header1 and header2
    expect(order([click(1), { _tag: "blur" }])).toEqual([0n, 2n, 3n, 4n, -1n]);
    // multiple + all expanded: every slot
    expect(order([setMultiple(true), click(0), click(1), click(2), { _tag: "blur" }])).toEqual([
      0n,
      1n,
      2n,
      3n,
      4n,
      5n,
      -1n,
    ]);
  });

  it("Shift+Tab walks backwards and leaves before the first element", () => {
    let state = run([click(1), { _tag: "blur" }]);
    const visited: bigint[] = [];
    for (let i = 0; i < 6; i += 1) {
      state = step(state, { _tag: "key_shift_tab" });
      const focus = state["focus"];
      visited.push(typeof focus === "bigint" ? focus : -2n);
      if (focus === -1n) break;
    }
    // panel 1 expanded: header2, content1, header1, header0, out
    expect(visited).toEqual([4n, 3n, 2n, 0n, -1n]);
  });

  it("content of a collapsed panel cannot be clicked into", () => {
    const state = step(model.initial, clickContent(1));
    expect(state["focus"]).toBe(-1n);

    const open = run([click(1), clickContent(1)]);
    expect(open["focus"]).toBe(3n);
  });

  it("losing the open panel via a prop change drops focus held inside it", () => {
    const state = run([setMultiple(true), click(0), click(1), clickContent(1)]);
    expect(state["focus"]).toBe(3n);

    // single mode keeps only the first expanded panel; focus in panel 1 is lost
    const single = step(state, setMultiple(false));
    expect(expandedOf(single)).toEqual([true, false, false]);
    expect(single["focus"]).toBe(-1n);
  });

  it("header focus survives a prop change that collapses its panel", () => {
    const state = run([setMultiple(true), click(0), click(1)]);
    const single = step(state, setMultiple(false));
    expect(expandedOf(single)).toEqual([true, false, false]);
    expect(single["focus"]).toBe(2n);
  });

  it("uncontrolled, every request is accepted and commits its intent", () => {
    const clicked = step(model.initial, click(0));
    expect(clicked).toMatchObject({
      expanded0: true,
      outcome: "accepted",
      requested: 1n,
      base: 0n,
      requests: 1n,
    });
    // the host-side writes are inert without a controlled value
    expect(step(clicked, { _tag: "hostToggle", panel: 0n })).toEqual(clicked);
    expect(model.transition(clicked, setValue(2))).toEqual(clicked);
  });

  it("controlled, a request the host ignores leaves the panels untouched", () => {
    const controlled = step(model.initial, control);
    const requested = step(controlled, click(0));
    expect(requested).toMatchObject({
      expanded0: false,
      valueProp: 0n,
      outcome: "rejected",
      requested: 1n,
      base: 0n,
      requests: 1n,
    });
    // a redundant request is not a request
    expect(step(controlled, click(2))).toMatchObject({ requests: 1n });
    // a mode prop change does not move a controlled value
    expect(step(requested, setMultiple(true))).toMatchObject({
      expanded0: false,
      valueProp: 0n,
    });
  });

  it("controlled, only the value prop commits", () => {
    const rejected = step(step(model.initial, control), click(0));
    const committed = step(rejected, setValue(1));
    expect(committed).toMatchObject({
      expanded0: true,
      valueProp: 1n,
      outcome: "none",
      requests: 1n,
    });
    // adopting a value on `control` keeps what was on screen
    expect(step(step(model.initial, click(1)), control)).toMatchObject({
      expanded1: true,
      valueProp: 2n,
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = step(step(model.initial, control), acceptRequests);
    const clicked = step(host, click(0));
    expect(clicked).toMatchObject({
      expanded0: true,
      valueProp: 1n,
      outcome: "accepted",
      requested: 1n,
      requests: 1n,
    });
    const second = step(clicked, click(1));
    expect(second).toMatchObject({
      expanded0: false,
      expanded1: true,
      valueProp: 2n,
      requests: 2n,
    });
  });

  it("reaches the interesting configurations and never the broken ones", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 30_000 });
    expect(report.violations).toEqual([]);
    expect(new Set(report.states.map((state) => stateKey(model, state))).size).toBeGreaterThan(200);

    assertReachable(
      report,
      "all three panels expanded in multiple mode",
      (state) => state["multiple"] === true && expandedOf(state).every((expanded) => expanded),
    );
    assertReachable(
      report,
      "focus inside an expanded panel",
      (state) => state["focus"] === 3n && state["expanded1"] === true,
    );
    assertUnreachable(
      report,
      "two panels expanded in single mode while uncontrolled",
      (state) =>
        state["controlled"] === false &&
        state["multiple"] === false &&
        expandedOf(state).filter(Boolean).length > 1,
    );
    assertUnreachable(
      report,
      "nothing expanded while uncontrolled and collapsing is forbidden",
      (state) =>
        state["controlled"] === false &&
        state["collapsible"] === false &&
        expandedOf(state).every((expanded) => !expanded),
    );
  });

  it("random walks keep every invariant", () => {
    const report = simulate(model, { runs: 200, maxSteps: 60, seed: 7 });
    expect(report.violations).toEqual([]);
  });
});
