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
import definitionJson from "../../src/apg/checkbox-group.model.generated.json";

// Spec-only verification for specs/apg/checkbox-group.qnt (APG Checkbox
// pattern, tri-state group controller over three dual-state children).

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const play = (
  events: ReadonlyArray<Record<string, unknown>>,
  from: QuintModelValue = model.initial,
): QuintModelValue => events.reduce(step, from);

const click = (target: string) => ({ _tag: "click", target });
const focusOn = (target: string) => ({ _tag: "focus_on", target });
const space = { _tag: "key_space" };
const tab = { _tag: "key_tab" };
const remember = { _tag: "set_remember", value: true };
const control = { _tag: "control" };
const acceptRequests = { _tag: "acceptRequests" };
const setValue = (v: number) => ({ _tag: "setValue", v: BigInt(v) });

const children = (state: QuintModelValue) => [state["c0"], state["c1"], state["c2"]];

describe("apg checkbox-group (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "MixedIffChildrenDisagree",
      "CheckedIffAllChildrenChecked",
      "UncheckedIffNoChildChecked",
      "MemoryIsMixedOrEmpty",
      "FocusValid",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    expect(
      violatedInvariants(model, {
        ...model.initial,
        m0: true,
        m1: true,
        m2: true,
        focus: "nowhere",
      }),
    ).toEqual(["MemoryIsMixedOrEmpty", "FocusValid"]);
    // controlled: a commit left the value prop behind
    expect(
      violatedInvariants(model, {
        ...model.initial,
        controlled: true,
        valueProp: 0n,
        c0: true,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the state anyway
    expect(
      violatedInvariants(model, {
        ...model.initial,
        outcome: "rejected",
        base: 0n,
        c1: true,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...model.initial,
        outcome: "accepted",
        requested: 1n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("Tab walks outside -> controller -> children -> outside", () => {
    const focusOrder: string[] = [];
    let state = model.initial;
    for (const event of [tab, tab, tab, tab, tab]) {
      state = step(state, event);
      focusOrder.push(String(state["focus"]));
    }
    expect(focusOrder).toEqual(["parent", "c0", "c1", "c2", "none"]);
  });

  it("children toggle individually with Space on the focused child", () => {
    const state = play([focusOn("c1"), space]);
    expect(children(state)).toEqual([false, true, false]);
    expect(play([focusOn("c1"), space, space])).toMatchObject({ c1: false });
  });

  it("Space without focus on a checkbox changes nothing", () => {
    expect(play([space])).toEqual(model.initial);
  });

  it("the controller is mixed exactly when the children disagree", () => {
    // derived aria-checked: false -> mixed -> true, children drive it
    expect(children(play([click("c0")]))).toEqual([true, false, false]);
    const all = play([click("c0"), click("c1"), click("c2")]);
    expect(children(all)).toEqual([true, true, true]);
    // every state along the way satisfied MixedIffChildrenDisagree via `step`
  });

  it("activating the controller: mixed -> all checked -> all unchecked", () => {
    const mixed = play([click("c0")]);
    const checked = step(mixed, click("parent"));
    expect(children(checked)).toEqual([true, true, true]);
    expect(checked).toMatchObject({ focus: "parent" });

    const unchecked = step(checked, space);
    expect(children(unchecked)).toEqual([false, false, false]);
  });

  it("without memory, an unchecked controller checks all", () => {
    const state = play([click("c0"), click("c2"), click("parent")]);
    expect(children(state)).toEqual([true, true, true]);
    const none = step(state, click("parent"));
    expect(children(none)).toEqual([false, false, false]);
    expect(children(step(none, click("parent")))).toEqual([true, true, true]);
  });

  it("with memory, the third activation restores the last mixed combination", () => {
    // mixed [true,false,true] -> true -> false -> mixed again
    const mixed = play([remember, click("c0"), click("c2")]);
    expect(children(mixed)).toEqual([true, false, true]);

    const checked = step(mixed, click("parent"));
    expect(children(checked)).toEqual([true, true, true]);
    expect(checked).toMatchObject({ m0: true, m1: false, m2: true });

    const unchecked = step(checked, click("parent"));
    expect(children(unchecked)).toEqual([false, false, false]);

    const restored = step(unchecked, click("parent"));
    expect(children(restored)).toEqual([true, false, true]);

    // and the cycle continues
    expect(children(step(restored, click("parent")))).toEqual([true, true, true]);
  });

  it("the memory follows the latest mixed combination, even when a child ends mixed", () => {
    const state = play([
      remember,
      click("c0"),
      click("c1"),
      // mixed [t,t,f] -> user flips c1 off: mixed [t,f,f]
      click("c1"),
      click("c0"),
      // now [f,f,f]; the last mixed combination seen was [t,f,f]
    ]);
    expect(children(state)).toEqual([false, false, false]);
    expect(children(step(state, click("parent")))).toEqual([true, false, false]);
  });

  it("with no mixed combination ever seen, memory on still checks all", () => {
    const state = play([remember, click("parent")]);
    expect(children(state)).toEqual([true, true, true]);
    expect(children(step(state, click("parent")))).toEqual([false, false, false]);
    expect(children(step(step(state, click("parent")), click("parent")))).toEqual([
      true,
      true,
      true,
    ]);
  });

  it("blur clears focus and keeps the state", () => {
    const state = play([click("c0"), { _tag: "blur" }]);
    expect(state).toMatchObject({ focus: "none", c0: true });
  });

  it("derives its event alphabet from the spec pools", () => {
    const events = eventsOf(model);
    expect(events).toContainEqual({ _tag: "click", target: "parent" });
    expect(events).toContainEqual({ _tag: "focus_on", target: "c2" });
    expect(events).toContainEqual({ _tag: "set_remember", value: false });
  });

  it("uncontrolled, activating a child commits the intent", () => {
    const state = play([focusOn("c1"), space]);
    expect(state).toMatchObject({
      c1: true,
      outcome: "accepted",
      requested: 2n,
      base: 0n,
      requests: 1n,
    });
    // a redundant request (parent already all-checked -> uncheck all) still moves
    const all = play([click("c0"), click("c1"), click("c2")]);
    const cleared = step(all, click("parent"));
    expect(children(cleared)).toEqual([false, false, false]);
    // the host-side writes are inert without a controlled value
    expect(step(all, { _tag: "hostToggle", panel: 0n })).toEqual(all);
    expect(model.transition(all, setValue(1))).toEqual(all);
  });

  it("controlled, a request the host ignores leaves the children untouched", () => {
    const controlled = step(model.initial, control);
    const requested = step(controlled, click("c0"));
    expect(requested).toMatchObject({
      c0: false,
      valueProp: 0n,
      outcome: "rejected",
      requested: 1n,
      base: 0n,
      requests: 1n,
    });
    // memory still follows the combination being left (the current value)
    expect(requested).toMatchObject({ m0: false, m1: false, m2: false });
  });

  it("controlled, only the value prop commits", () => {
    const rejected = step(step(model.initial, control), click("c0"));
    const committed = step(rejected, setValue(1));
    expect(committed).toMatchObject({
      c0: true,
      valueProp: 1n,
      outcome: "none",
      requests: 1n,
    });
    // adopting a value on `control` keeps what was on screen
    expect(step(step(model.initial, click("c2")), control)).toMatchObject({
      c2: true,
      valueProp: 4n,
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = step(step(model.initial, control), acceptRequests);
    const clicked = step(host, click("parent"));
    expect(clicked).toMatchObject({
      c0: true,
      c1: true,
      c2: true,
      valueProp: 7n,
      outcome: "accepted",
      requested: 7n,
      requests: 1n,
    });
    const cleared = step(clicked, click("parent"));
    expect(cleared).toMatchObject({
      c0: false,
      c1: false,
      c2: false,
      valueProp: 0n,
      requests: 2n,
    });
  });

  it("no reachable state violates an invariant (exploration + simulation)", () => {
    const report = explore(model, { maxDepth: 8, maxStates: 50_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(100);

    assertReachable(report, "a mixed controller", (s) => (s["c0"] === true) !== (s["c1"] === true));
    assertReachable(
      report,
      "a remembered mixed combination with the controller mixed again",
      (s) => s["remember"] === true && s["m0"] === true && s["c0"] === true && s["c1"] === false,
    );
    assertUnreachable(
      report,
      "memory holding a non-mixed combination",
      (s) => s["m0"] === true && s["m1"] === true && s["m2"] === true,
    );

    expect(simulate(model, { runs: 50, maxSteps: 80 }).violations).toEqual([]);
  });
});
