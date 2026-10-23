import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { explore, stateKey } from "@quint-machine/core/testing";
import { Schema } from "effect";
import definitionJson from "../../src/apg/radio.model.generated.json";

// Spec-only verification for specs/apg/radio.qnt: the APG radio group
// (roving tabindex + aria-activedescendant variants). The shared harness
// derives the event alphabet from the spec's own pools and checks every
// declared invariant after every step.

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
const roving = { _tag: "set_flavor", v: "roving" };
const activedescendant = { _tag: "set_flavor", v: "activedescendant" };
const disable = (m: bigint) => ({ _tag: "set_disabled", m });
const preselect = (pick: bigint) => ({ _tag: "preselect", pick });
const click = (target: bigint) => ({ _tag: "click", target });

describe("apg radio (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "AtMostOneChecked",
      "ExactlyOneTabStop",
      "TabStopIsCheckedOrFirst",
      "DisabledNeverActive",
      "FocusFollowsChecked",
      "SomeRadioEnabled",
      "ActiveDescendantContract",
      "VariantValid",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    // disabled radio 1 checked and focused
    expect(
      violatedInvariants(model, {
        ...initial,
        flavor: "roving",
        mask: 2n,
        checked: 1n,
        focus: 1n,
      }),
    ).toEqual(["DisabledNeverActive"]);

    // focus drifted away from the checked radio
    expect(
      violatedInvariants(model, {
        ...initial,
        flavor: "roving",
        mask: 0n,
        checked: 2n,
        focus: 0n,
      }),
    ).toEqual(["FocusFollowsChecked"]);

    // every radio disabled
    expect(
      violatedInvariants(model, {
        ...initial,
        flavor: "roving",
        mask: 15n,
        checked: -1n,
        focus: -1n,
      }),
    ).toContain("SomeRadioEnabled");

    expect(
      violatedInvariants(model, {
        ...initial,
        flavor: "bogus",
        mask: 0n,
        checked: -1n,
        focus: -1n,
      }),
    ).toContain("VariantValid");

    // an event committed while controlled: the state left the value prop behind
    expect(
      violatedInvariants(model, {
        ...initial,
        controlled: true,
        valueProp: -1n,
        checked: 0n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the check anyway
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "rejected",
        base: -1n,
        checked: 0n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "accepted",
        requested: 0n,
        checked: -1n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("starts roving with nothing checked and focus outside", () => {
    expect(initial).toMatchObject({
      flavor: "roving",
      mask: 0n,
      checked: -1n,
      focus: -1n,
      controlled: false,
      outcome: "none",
    });
  });

  it("Tab enters on the first radio when none is checked, without checking it", () => {
    const entered = step(initial, { _tag: "enter" });
    expect(entered).toMatchObject({ focus: 0n, checked: -1n });
    // the first *enabled* radio when radio 0 is disabled
    const skipped = run(initial, [disable(1n), { _tag: "enter" }]);
    expect(skipped).toMatchObject({ focus: 1n, checked: -1n });
  });

  it("Tab enters on the checked radio", () => {
    const state = run(initial, [preselect(2n), { _tag: "enter" }]);
    expect(state).toMatchObject({ focus: 2n, checked: 2n });
  });

  it("Space checks the focused radio and is idempotent", () => {
    const focused = step(initial, { _tag: "enter" });
    const checked = step(focused, { _tag: "space" });
    expect(checked).toMatchObject({ focus: 0n, checked: 0n });
    expect(step(checked, { _tag: "space" })).toEqual(checked);
    // Space outside the group does nothing
    expect(step(initial, { _tag: "space" })).toEqual(initial);
  });

  it("arrows move AND check, wrapping in both directions", () => {
    const start = run(initial, [{ _tag: "enter" }]);
    const down = step(start, { _tag: "arrow_next" });
    expect(down).toMatchObject({ focus: 1n, checked: 1n });

    const wrapForward = run(down, [
      { _tag: "arrow_next" },
      { _tag: "arrow_next" },
      { _tag: "arrow_next" },
    ]);
    expect(wrapForward).toMatchObject({ focus: 0n, checked: 0n });

    const wrapBack = step(wrapForward, { _tag: "arrow_prev" });
    expect(wrapBack).toMatchObject({ focus: 3n, checked: 3n });
    expect(step(wrapBack, { _tag: "arrow_prev" })).toMatchObject({
      focus: 2n,
      checked: 2n,
    });
  });

  it("arrows outside the group do nothing", () => {
    expect(step(initial, { _tag: "arrow_next" })).toEqual(initial);
    expect(step(initial, { _tag: "arrow_prev" })).toEqual(initial);
  });

  it("arrows skip disabled radios, across the wrap too", () => {
    // radios 1 and 2 disabled (mask 6)
    const state = run(initial, [disable(6n), { _tag: "enter" }]);
    expect(state).toMatchObject({ focus: 0n });
    const next = step(state, { _tag: "arrow_next" });
    expect(next).toMatchObject({ focus: 3n, checked: 3n });
    expect(step(next, { _tag: "arrow_next" })).toMatchObject({
      focus: 0n,
      checked: 0n,
    });
    expect(step(next, { _tag: "arrow_prev" })).toMatchObject({
      focus: 0n,
      checked: 0n,
    });
    // radios 1..3 disabled (mask 14): a lone enabled radio stays put
    const lone = run(initial, [disable(14n), { _tag: "enter" }]);
    expect(step(lone, { _tag: "arrow_next" })).toMatchObject({
      focus: 0n,
      checked: 0n,
    });
  });

  it("clicking a disabled radio does nothing; an enabled one focuses and checks", () => {
    // mask 2 = radio 1 disabled
    const state = step(initial, disable(2n));
    expect(step(state, click(2n))).toMatchObject({ focus: 2n, checked: 2n });
    expect(step(state, click(1n))).toEqual(state);
    const entered = step(state, { _tag: "enter" });
    expect(step(entered, click(1n))).toEqual(entered);
  });

  it("disabling the checked radio unchecks it", () => {
    const state = run(initial, [preselect(1n), disable(2n)]);
    expect(state).toMatchObject({ checked: -1n, focus: -1n });
  });

  it("leaving the group keeps the checked radio as the next tab stop", () => {
    const left = run(initial, [
      { _tag: "enter" },
      { _tag: "arrow_next" },
      { _tag: "arrow_next" },
      { _tag: "leave" },
    ]);
    expect(left).toMatchObject({ focus: -1n, checked: 2n });
    expect(step(left, { _tag: "enter" })).toMatchObject({
      focus: 2n,
      checked: 2n,
    });
  });

  it("both variants reach the same focus/checked states", () => {
    const events = [
      { _tag: "enter" },
      { _tag: "arrow_next" },
      { _tag: "space" },
      { _tag: "arrow_prev" },
    ];
    const a = run(initial, [roving, ...events]);
    const b = run(initial, [activedescendant, ...events]);
    expect(a).toMatchObject({ flavor: "roving", focus: 0n, checked: 0n });
    expect(b).toMatchObject({
      flavor: "activedescendant",
      focus: 0n,
      checked: 0n,
    });
  });

  it("exposes typed event schemas for the pools", () => {
    const schema = model.eventSchemas["set_disabled"];
    if (schema === undefined) {
      throw new Error("no event schema for set_disabled");
    }
    const decode = Schema.decodeUnknownSync(schema as Schema.Codec<Record<string, unknown>>);
    expect(decode({ _tag: "set_disabled", m: 6n })).toEqual({
      _tag: "set_disabled",
      m: 6n,
    });
    expect(() => decode({ _tag: "set_disabled", m: "6" })).toThrow();
  });

  it("uncontrolled, every check request is accepted and commits its intent", () => {
    const checked = step(step(initial, { _tag: "enter" }), {
      _tag: "arrow_next",
    });
    expect(checked).toMatchObject({
      focus: 1n,
      checked: 1n,
      outcome: "accepted",
      requested: 1n,
      base: -1n,
      requests: 1n,
    });
    // host-side commits are inert without a controlled value
    expect(model.transition(checked, { _tag: "setValue", v: 2n })).toEqual(checked);
  });

  it("controlled, a rejected request leaves the check untouched", () => {
    const controlled = run(initial, [preselect(0n), { _tag: "enter" }, { _tag: "control" }]);
    const next = step(controlled, { _tag: "arrow_next" });
    expect(next).toMatchObject({
      focus: 1n,
      checked: 0n,
      valueProp: 0n,
      outcome: "rejected",
      requested: 1n,
      base: 0n,
      requests: 1n,
    });
    // a host write is the only commit while controlled
    expect(step(next, { _tag: "setValue", v: 2n })).toMatchObject({
      checked: 2n,
      valueProp: 2n,
      outcome: "none",
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = run(initial, [
      preselect(0n),
      { _tag: "enter" },
      { _tag: "control" },
      { _tag: "acceptRequests" },
    ]);
    const next = step(host, { _tag: "arrow_next" });
    expect(next).toMatchObject({
      focus: 1n,
      checked: 1n,
      valueProp: 1n,
      outcome: "accepted",
      requests: 1n,
    });
  });

  it("controlled, setValue ignores a pick that is disabled", () => {
    const controlled = run(initial, [disable(2n), { _tag: "control" }]);
    // radio 1 is disabled; the host write is ignored
    expect(step(controlled, { _tag: "setValue", v: 1n })).toEqual(controlled);
    expect(step(controlled, { _tag: "setValue", v: 3n })).toMatchObject({
      checked: 3n,
      valueProp: 3n,
    });
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 5, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(50);
  });
});
