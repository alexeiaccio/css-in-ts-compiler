import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import {
  assertReachable,
  assertUnreachable,
  explore,
  simulate,
  stateKey,
} from "@quint-machine/core/testing";
import { describe, expect, it } from "vite-plus/test";
import definitionJson from "../../src/apg/switch.model.generated.json";

// Spec-only verification for specs/apg/switch.qnt (APG Switch pattern).

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

const focus = { _tag: "focus" };
const blur = { _tag: "blur" };
const down = (key: string) => ({ _tag: "key_down", key });
const up = (key: string) => ({ _tag: "key_up", key });
const space = [down("Space"), up("Space")];
const click = [{ _tag: "pointer_down" }, { _tag: "pointer_up" }];
const withEnter = { _tag: "set_enter_toggles", value: true };
const disable = { _tag: "set_disabled", value: true };
const control = { _tag: "control" };
const accept = { _tag: "acceptRequests" };
const hostToggle = { _tag: "hostToggle" };
const setValue = (incoming: string) => ({ _tag: "setValue", incoming });

describe("apg switch (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "CheckedIsBinary",
      "AriaCheckedContract",
      "SpaceArmedImpliesFocusedEnabled",
      "PointerArmedImpliesEnabled",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    expect(
      violatedInvariants(model, {
        ...model.initial,
        checked: "mixed",
        spaceArmed: true,
        pointerArmed: true,
        disabled: true,
      }),
    ).toEqual(["CheckedIsBinary", "SpaceArmedImpliesFocusedEnabled", "PointerArmedImpliesEnabled"]);
    // an event committed while controlled: the state left the value prop behind
    expect(
      violatedInvariants(model, {
        ...model.initial,
        controlled: true,
        valueProp: "false",
        checked: "true",
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the state anyway
    expect(
      violatedInvariants(model, {
        ...model.initial,
        outcome: "rejected",
        base: "false",
        checked: "true",
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...model.initial,
        outcome: "accepted",
        requested: "true",
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("starts off; Space flips it on and off (armed on keydown, fires on keyup)", () => {
    expect(model.initial).toMatchObject({ checked: "false" });
    const armed = play([focus, down("Space")]);
    expect(armed).toMatchObject({ checked: "false", spaceArmed: true });

    const on = step(armed, up("Space"));
    expect(on).toMatchObject({ checked: "true", requests: 1n });
    expect(play(space, on)).toMatchObject({ checked: "false", requests: 2n });
  });

  it("Enter does nothing unless the optional Enter support is on", () => {
    expect(play([focus, down("Enter"), up("Enter")])).toMatchObject({
      checked: "false",
      requests: 0n,
    });
    expect(play([withEnter, focus, down("Enter")])).toMatchObject({
      checked: "true",
      requests: 1n,
    });
  });

  it("blur between Space down and up cancels the press", () => {
    expect(play([focus, down("Space"), blur, up("Space")])).toMatchObject({
      checked: "false",
      requests: 0n,
    });
  });

  it("keys without focus and unhandled keys do nothing", () => {
    expect(play([...space, down("Enter")])).toMatchObject({ requests: 0n });
    expect(play([focus, down("Other"), up("Other")])).toMatchObject({
      requests: 0n,
    });
  });

  it("pointer click flips; a cancelled pointer does not", () => {
    expect(play(click)).toMatchObject({
      checked: "true",
      focused: true,
      requests: 1n,
    });
    expect(
      play([{ _tag: "pointer_down" }, { _tag: "pointer_cancel" }, { _tag: "pointer_up" }]),
    ).toMatchObject({ checked: "false", requests: 0n });
  });

  it("a disabled switch is focusable but ignores every input", () => {
    const state = play([disable, withEnter, focus, ...space, down("Enter"), ...click]);
    expect(state).toMatchObject({
      focused: true,
      checked: "false",
      requests: 0n,
      spaceArmed: false,
      pointerArmed: false,
    });
  });

  it("disabling mid-press drops the pending press", () => {
    expect(play([focus, down("Space"), disable, up("Space")])).toMatchObject({
      checked: "false",
      requests: 0n,
    });
  });

  it("uncontrolled, every request is accepted and commits its intent", () => {
    expect(model.initial).toMatchObject({ controlled: false, outcome: "none" });
    const clicked = play(click);
    expect(clicked).toMatchObject({
      checked: "true",
      outcome: "accepted",
      requested: "true",
      base: "false",
      requests: 1n,
    });
    // the host-side events are inert without a controlled value
    expect(step(clicked, hostToggle)).toEqual(clicked);
    expect(step(clicked, setValue("false"))).toEqual(clicked);
  });

  it("controlled, a request the host ignores leaves the state untouched", () => {
    const controlled = step(model.initial, control);
    const clicked = play(click, controlled);
    expect(clicked).toMatchObject({
      checked: "false",
      valueProp: "false",
      outcome: "rejected",
      requested: "true",
      base: "false",
      requests: 1n,
    });
    // a key request needs focus (and the optional Enter support)
    const focused = play([withEnter, focus], controlled);
    expect(step(focused, down("Enter"))).toMatchObject({
      checked: "false",
      outcome: "rejected",
    });
    // a redundant request is not a request: a disabled switch fires nothing
    const inert = step(controlled, disable);
    expect(step(inert, { _tag: "pointer_up" })).toEqual(inert);
  });

  it("controlled, only the value prop commits", () => {
    const rejected = play(click, step(model.initial, control));
    const committed = step(rejected, hostToggle);
    expect(committed).toMatchObject({
      checked: "true",
      valueProp: "true",
      outcome: "none",
      requests: 1n,
    });
    expect(step(committed, setValue("false"))).toMatchObject({
      checked: "false",
      valueProp: "false",
      outcome: "none",
    });
    // adopting a value on `control` keeps what was on screen
    expect(play([{ _tag: "seed", incoming: "true" }, control])).toMatchObject({
      checked: "true",
      valueProp: "true",
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = play([control, accept]);
    const clicked = play(click, host);
    expect(clicked).toMatchObject({
      checked: "true",
      valueProp: "true",
      outcome: "accepted",
      requested: "true",
      requests: 1n,
    });
    expect(play(click, clicked)).toMatchObject({
      checked: "false",
      valueProp: "false",
      requests: 2n,
    });
  });

  it('a switch never exposes "mixed", and the value prop rejects it', () => {
    const controlled = step(model.initial, control);
    expect(step(controlled, setValue("mixed"))).toEqual(controlled);
  });

  it("no reachable state violates an invariant (exploration + simulation)", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(50);

    assertReachable(report, "an on switch", (s) => s["checked"] === "true");
    assertReachable(
      report,
      "a focused disabled switch",
      (s) => s["focused"] === true && s["disabled"] === true,
    );
    assertUnreachable(report, "a mixed switch", (s) => s["checked"] === "mixed");

    expect(simulate(model, { runs: 50, maxSteps: 80 }).violations).toEqual([]);
  });
});
