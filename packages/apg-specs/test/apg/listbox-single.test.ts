import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { assertReachable, explore, simulate, stateKey } from "@quint-machine/core/testing";
import { describe, expect, it } from "vite-plus/test";
import { Schema } from "effect";
import definitionJson from "../../src/apg/listbox-single.model.generated.json";

// Spec-only verification for specs/apg/listbox-single.qnt: the APG single-select
// listbox (focus entry, Up/Down/Home/End, selection follows focus, grouped
// options). The shared harness derives the event alphabet from the spec's own
// pools and checks every declared invariant after every step.

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
const key = (tag: string) => ({ _tag: tag });
const click = (index: bigint) => ({ _tag: "click", index });
const follow = (on: boolean) => ({ _tag: "set_follows_focus", follow: on });
const focused = run(initial, [key("focus_in")]);
const following = run(initial, [follow(true), key("focus_in")]);

describe("apg listbox single-select (spec-only)", () => {
  // every var the spec owns, at its init value: hand-built bad states spread
  // over this so only the intended invariant fires.
  const clean = {
    hasFocus: false,
    active: 0n,
    selected: 0n,
    followsFocus: false,
    controlled: false,
    accepting: false,
    valueProp0: false,
    valueProp1: false,
    valueProp2: false,
    valueProp3: false,
    valueProp4: false,
    valueProp5: false,
    requested: 0n,
    outcome: "none",
    base: 0n,
    requests: 0n,
  };

  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "SingleSelectAtMostOne",
      "SelectionInRange",
      "ActiveInRange",
      "ActiveDescendantTracksFocus",
      "SelectionFollowsFocus",
      "AriaMultiselectableFalse",
      "GroupsNonEmpty",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    // two options selected in a single-select listbox
    expect(violatedInvariants(model, { ...clean, selected: 3n })).toEqual([
      "SingleSelectAtMostOne",
    ]);

    // the mask names an option that does not exist
    expect(violatedInvariants(model, { ...clean, selected: 64n })).toEqual(["SelectionInRange"]);

    // the active option points past the last option
    expect(violatedInvariants(model, { ...clean, hasFocus: true, active: 6n })).toEqual([
      "ActiveInRange",
      "ActiveDescendantTracksFocus",
    ]);

    // selection follows focus, but the selected option is not the focused one
    expect(
      violatedInvariants(model, {
        ...clean,
        hasFocus: true,
        active: 2n,
        selected: 2n,
        followsFocus: true,
      }),
    ).toEqual(["SelectionFollowsFocus"]);

    // an event committed a selection the value prop does not hold
    expect(
      violatedInvariants(model, {
        ...clean,
        controlled: true,
        selected: 1n,
      }),
    ).toEqual(["ControlledFollowsProp"]);

    // a rejected request that moved the selection anyway
    expect(
      violatedInvariants(model, {
        ...clean,
        controlled: true,
        valueProp0: true,
        outcome: "rejected",
        base: 0n,
        selected: 1n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);

    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...clean,
        controlled: true,
        valueProp0: true,
        outcome: "accepted",
        requested: 2n,
        selected: 1n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);

    // callbacks cannot count down
    expect(violatedInvariants(model, { ...clean, requests: -1n })).toEqual(["RequestsNonNegative"]);
  });

  it("starts unfocused with nothing selected", () => {
    expect(initial).toEqual(clean);
  });

  it("Tab entry: first option when nothing is selected, without selecting it", () => {
    expect(focused).toMatchObject({ hasFocus: true, active: 0n, selected: 0n });
  });

  it("Tab entry: the selected option receives focus", () => {
    const state = run(initial, [click(3n), key("blur"), key("focus_in")]);
    expect(state).toMatchObject({ hasFocus: true, active: 3n, selected: 8n });
  });

  it("Tab entry with selection following focus selects the first option", () => {
    expect(following).toMatchObject({ active: 0n, selected: 1n });
  });

  it("focus_in while already focused changes nothing", () => {
    const moved = step(focused, key("arrow_down"));
    expect(step(moved, key("focus_in"))).toEqual(moved);
  });

  it("arrows move focus but not selection when selection does not follow focus", () => {
    const selected = run(focused, [key("space")]);
    expect(selected).toMatchObject({ active: 0n, selected: 1n });
    const down = step(selected, key("arrow_down"));
    expect(down).toMatchObject({ active: 1n, selected: 1n });
    expect(step(down, key("space"))).toMatchObject({
      active: 1n,
      selected: 2n,
    });
  });

  it("selection follows focus on Down, Up, Home and End", () => {
    const down = step(following, key("arrow_down"));
    expect(down).toMatchObject({ active: 1n, selected: 2n });
    expect(step(down, key("arrow_up"))).toMatchObject({
      active: 0n,
      selected: 1n,
    });
    expect(step(down, key("end"))).toMatchObject({ active: 5n, selected: 32n });
    expect(run(down, [key("end"), key("home")])).toMatchObject({
      active: 0n,
      selected: 1n,
    });
  });

  it("focus clamps at both ends (no wrap)", () => {
    expect(step(focused, key("arrow_up"))).toMatchObject({ active: 0n });
    const last = step(focused, key("end"));
    expect(last).toMatchObject({ active: 5n });
    expect(step(last, key("arrow_down"))).toMatchObject({ active: 5n });
  });

  it("arrows cross group boundaries: headers are never focused", () => {
    const lastOfFirstGroup = run(focused, [key("arrow_down"), key("arrow_down")]);
    expect(lastOfFirstGroup).toMatchObject({ active: 2n });
    const crossed = step(lastOfFirstGroup, key("arrow_down"));
    expect(crossed).toMatchObject({ active: 3n });
    expect(step(crossed, key("arrow_up"))).toMatchObject({ active: 2n });
  });

  it("keys do nothing while the listbox is not focused", () => {
    for (const tag of ["arrow_down", "arrow_up", "home", "end", "space"]) {
      expect(step(initial, key(tag))).toEqual(initial);
    }
  });

  it("a click focuses and selects, replacing the previous selection", () => {
    const state = run(initial, [click(4n), click(1n)]);
    expect(state).toMatchObject({ hasFocus: true, active: 1n, selected: 2n });
  });

  it("blur keeps the selection", () => {
    const state = run(initial, [click(2n), key("blur")]);
    expect(state).toMatchObject({ hasFocus: false, selected: 4n });
  });

  it("turning selection-follows-focus on while focused syncs the selection", () => {
    const moved = run(focused, [key("arrow_down"), key("arrow_down")]);
    expect(moved).toMatchObject({ active: 2n, selected: 0n });
    expect(step(moved, follow(true))).toMatchObject({
      followsFocus: true,
      selected: 4n,
    });
    // unfocused: the selection is left alone
    expect(step(initial, follow(true))).toMatchObject({
      followsFocus: true,
      selected: 0n,
    });
  });

  it("exposes a typed event schema for the click pool", () => {
    const schema = model.eventSchemas["click"];
    if (schema === undefined) {
      throw new Error("no event schema for click");
    }
    const decode = Schema.decodeUnknownSync(schema as Schema.Codec<Record<string, unknown>>);
    expect(decode({ _tag: "click", index: 3n })).toEqual({
      _tag: "click",
      index: 3n,
    });
    expect(() => decode({ _tag: "click", index: "3" })).toThrow();
  });

  it("no reachable state violates an invariant (bounded exploration + simulation)", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(50);
    assertReachable(
      report,
      "selection follows focus on the last option",
      (s) => s["followsFocus"] === true && s["selected"] === 32n,
    );
    assertReachable(
      report,
      "a selection survives losing focus",
      (s) => s["hasFocus"] === false && s["selected"] === 4n,
    );
    expect(simulate(model, { runs: 200, maxSteps: 60, seed: 7 }).violations).toEqual([]);
  }, 300_000);
});
