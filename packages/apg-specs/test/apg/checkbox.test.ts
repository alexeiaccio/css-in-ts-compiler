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
import definitionJson from "../../src/apg/checkbox.model.generated.json";

// Spec-only verification for specs/apg/checkbox.qnt (APG Checkbox pattern,
// single checkbox: dual-state and tri-state display).

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
const triState = { _tag: "set_allow_mixed", value: true };
const dualState = { _tag: "set_allow_mixed", value: false };
const disable = { _tag: "set_disabled", value: true };
const control = { _tag: "control" };
const accept = { _tag: "acceptRequests" };
const hostToggle = { _tag: "hostToggle" };
const seed = (incoming: string) => ({ _tag: "seed", incoming });
const setValue = (incoming: string) => ({ _tag: "setValue", incoming });

describe("apg checkbox (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "StateValid",
      "DualStateNeverMixed",
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
        state: "mixed",
        allowMixed: false,
        spaceArmed: true,
      }),
    ).toEqual(["DualStateNeverMixed", "AriaCheckedContract", "SpaceArmedImpliesFocusedEnabled"]);
    expect(violatedInvariants(model, { ...model.initial, state: "maybe" })).toEqual([
      "StateValid",
      "AriaCheckedContract",
    ]);
    // an event committed while controlled: the state left the value prop behind
    expect(
      violatedInvariants(model, {
        ...model.initial,
        controlled: true,
        valueProp: "false",
        state: "true",
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the state anyway
    expect(
      violatedInvariants(model, {
        ...model.initial,
        outcome: "rejected",
        base: "false",
        state: "true",
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

  it("Space toggles a dual-state checkbox (armed on keydown, fires on keyup)", () => {
    const armed = play([focus, down("Space")]);
    expect(armed).toMatchObject({ state: "false", spaceArmed: true });

    const checked = step(armed, up("Space"));
    expect(checked).toMatchObject({ state: "true", requests: 1n });
    expect(play(space, checked)).toMatchObject({
      state: "false",
      requests: 2n,
    });
  });

  it("Enter and other keys never change the state", () => {
    expect(play([focus, down("Enter"), up("Enter"), down("Other"), up("Other")])).toMatchObject({
      state: "false",
      requests: 0n,
    });
  });

  it("blur between Space down and up cancels the press; no focus, no press", () => {
    expect(play([focus, down("Space"), blur, up("Space")])).toMatchObject({
      state: "false",
      requests: 0n,
    });
    expect(play(space)).toMatchObject({ state: "false", requests: 0n });
  });

  it("pointer click toggles; a cancelled pointer does not", () => {
    expect(play(click)).toMatchObject({
      state: "true",
      focused: true,
      requests: 1n,
    });
    expect(
      play([{ _tag: "pointer_down" }, { _tag: "pointer_cancel" }, { _tag: "pointer_up" }]),
    ).toMatchObject({ state: "false", requests: 0n });
  });

  it("a tri-state checkbox shows mixed; activating mixed checks it", () => {
    const mixed = play([triState, seed("mixed"), focus]);
    expect(mixed).toMatchObject({ state: "mixed", allowMixed: true });

    const checked = play(space, mixed);
    expect(checked).toMatchObject({ state: "true", requests: 1n });
    expect(play(space, checked)).toMatchObject({ state: "false" });
  });

  it("a dual-state checkbox rejects mixed, and going dual-state resolves it", () => {
    expect(step(model.initial, setValue("mixed"))).toMatchObject({
      state: "false",
    });
    const mixed = play([triState, seed("mixed")]);
    expect(step(mixed, dualState)).toMatchObject({
      state: "false",
      allowMixed: false,
    });
    // a checked tri-state checkbox stays checked when it goes dual-state
    expect(play([triState, seed("true"), dualState])).toMatchObject({
      state: "true",
    });
  });

  it("a disabled checkbox is focusable but ignores every input", () => {
    expect(play([disable, focus, ...space, ...click])).toMatchObject({
      focused: true,
      state: "false",
      requests: 0n,
      spaceArmed: false,
      pointerArmed: false,
    });
  });

  it("uncontrolled, every request is accepted and commits its intent", () => {
    expect(model.initial).toMatchObject({ controlled: false, outcome: "none" });
    const clicked = play(click);
    expect(clicked).toMatchObject({
      state: "true",
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
      state: "false",
      valueProp: "false",
      outcome: "rejected",
      requested: "true",
      base: "false",
      requests: 1n,
    });
    // a key request needs focus
    const focused = play([focus], controlled);
    expect(play(space, focused)).toMatchObject({
      state: "false",
      outcome: "rejected",
    });
    // a redundant activation is not a request: a disabled checkbox fires nothing
    const inert = step(controlled, disable);
    expect(step(inert, { _tag: "pointer_up" })).toEqual(inert);
  });

  it("controlled, only the value prop commits", () => {
    const rejected = play(click, step(model.initial, control));
    const committed = step(rejected, hostToggle);
    expect(committed).toMatchObject({
      state: "true",
      valueProp: "true",
      outcome: "none",
      requests: 1n,
    });
    expect(step(committed, setValue("false"))).toMatchObject({
      state: "false",
      valueProp: "false",
      outcome: "none",
    });
    // adopting a value on `control` keeps what was on screen
    expect(play([seed("true"), control])).toMatchObject({
      state: "true",
      valueProp: "true",
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = play([control, accept]);
    const clicked = play(click, host);
    expect(clicked).toMatchObject({
      state: "true",
      valueProp: "true",
      outcome: "accepted",
      requested: "true",
      requests: 1n,
    });
    expect(play(click, clicked)).toMatchObject({
      state: "false",
      valueProp: "false",
      requests: 2n,
    });
  });

  it("no reachable state violates an invariant (exploration + simulation)", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 30_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(50);

    assertReachable(report, "a mixed checkbox", (s) => s["state"] === "mixed");
    assertReachable(report, "a checked checkbox", (s) => s["state"] === "true");
    assertUnreachable(
      report,
      "a mixed dual-state checkbox",
      (s) => s["state"] === "mixed" && s["allowMixed"] === false,
    );

    expect(simulate(model, { runs: 50, maxSteps: 80 }).violations).toEqual([]);
  });
});
