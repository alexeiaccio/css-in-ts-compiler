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
import { Schema } from "effect";
import definitionJson from "../../src/apg/button.model.generated.json";

// Spec-only verification for specs/apg/button.qnt (APG Button pattern).
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

const play = (
  events: ReadonlyArray<Record<string, unknown>>,
  from: QuintModelValue = model.initial,
): QuintModelValue => events.reduce(step, from);

const focus = { _tag: "focus" };
const blur = { _tag: "blur" };
const down = (key: string) => ({ _tag: "key_down", key });
const up = (key: string) => ({ _tag: "key_up", key });
const click = [{ _tag: "pointer_down" }, { _tag: "pointer_up" }];
const asToggle = { _tag: "set_toggle", value: true };
const asCommand = { _tag: "set_toggle", value: false };
const disable = { _tag: "set_disabled", value: true };
const enable = { _tag: "set_disabled", value: false };
const control = { _tag: "control" };
const accept = { _tag: "acceptRequests" };
const hostToggle = { _tag: "hostToggle" };
const setValue = (v: boolean) => ({ _tag: "setValue", v });

describe("apg button (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "PressedAttrPresentIffToggle",
      "PressedAttrMirrorsState",
      "DisabledAttrContract",
      "CommandButtonNeverPressed",
      "PressedIsToggleParity",
      "RequestsWithinActivations",
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
        isToggle: false,
        pressed: true,
        toggleCount: 1n,
        spaceArmed: true,
        pointerArmed: true,
        disabled: true,
      }),
    ).toEqual([
      "CommandButtonNeverPressed",
      "SpaceArmedImpliesFocusedEnabled",
      "PointerArmedImpliesEnabled",
    ]);
    expect(
      violatedInvariants(model, {
        ...model.initial,
        isToggle: true,
        pressed: false,
        toggleCount: 1n,
        activations: 1n,
      }),
    ).toEqual(["PressedIsToggleParity"]);
    // an event committed while controlled: the state left the value prop behind
    expect(
      violatedInvariants(model, {
        ...model.initial,
        controlled: true,
        isToggle: true,
        valueProp: false,
        pressed: true,
        toggleCount: 1n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the state anyway
    expect(
      violatedInvariants(model, {
        ...model.initial,
        outcome: "rejected",
        base: false,
        isToggle: true,
        pressed: true,
        toggleCount: 1n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...model.initial,
        outcome: "accepted",
        requested: true,
        isToggle: true,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("Enter activates a focused command button on keydown", () => {
    const state = play([focus, down("Enter")]);
    expect(state).toMatchObject({ activations: 1n, pressed: false });
    // focus stays on the button after activation
    expect(state).toMatchObject({ focused: true });
  });

  it("keys do nothing without focus, and other keys never activate", () => {
    expect(play([down("Enter"), down("Space"), up("Space")])).toMatchObject({
      activations: 0n,
      spaceArmed: false,
    });
    expect(play([focus, down("Other"), up("Other")])).toMatchObject({
      activations: 0n,
    });
  });

  it("Space arms on keydown and activates on keyup", () => {
    const armed = play([focus, down("Space")]);
    expect(armed).toMatchObject({ spaceArmed: true, activations: 0n });
    expect(step(armed, up("Space"))).toMatchObject({
      spaceArmed: false,
      activations: 1n,
    });
  });

  it("blur between Space down and up cancels the press", () => {
    const state = play([focus, down("Space"), blur, up("Space")]);
    expect(state).toMatchObject({ spaceArmed: false, activations: 0n });
    // a stray keyup never activates
    expect(play([focus, up("Space")])).toMatchObject({ activations: 0n });
  });

  it("a toggle button flips aria-pressed on every activation", () => {
    let state = play([asToggle, focus]);
    expect(state).toMatchObject({ isToggle: true, pressed: false });

    state = play([down("Enter")], state);
    expect(state).toMatchObject({ pressed: true, toggleCount: 1n });

    state = play([down("Space"), up("Space")], state);
    expect(state).toMatchObject({
      pressed: false,
      toggleCount: 2n,
      activations: 2n,
      requests: 2n,
    });
  });

  it("pointer down + up activates; a cancelled pointer does not", () => {
    const clicked = play([asToggle, { _tag: "pointer_down" }]);
    expect(clicked).toMatchObject({ focused: true, pointerArmed: true });
    expect(step(clicked, { _tag: "pointer_up" })).toMatchObject({
      pressed: true,
      activations: 1n,
      pointerArmed: false,
    });

    const cancelled = play([
      asToggle,
      { _tag: "pointer_down" },
      { _tag: "pointer_cancel" },
      { _tag: "pointer_up" },
    ]);
    expect(cancelled).toMatchObject({ pressed: false, activations: 0n });
  });

  it("aria-disabled stays focusable but never activates", () => {
    const state = play([
      asToggle,
      disable,
      focus,
      down("Enter"),
      down("Space"),
      up("Space"),
      ...click,
    ]);
    expect(state).toMatchObject({
      focused: true,
      disabled: true,
      pressed: false,
      activations: 0n,
      spaceArmed: false,
      pointerArmed: false,
    });
  });

  it("disabling mid-press drops the pending press; re-enabling does not resurrect it", () => {
    const state = play([
      focus,
      down("Space"),
      { _tag: "pointer_down" },
      disable,
      up("Space"),
      { _tag: "pointer_up" },
      enable,
      up("Space"),
      { _tag: "pointer_up" },
    ]);
    expect(state).toMatchObject({ activations: 0n, disabled: false });
  });

  it("becoming a command button resets the pressed state", () => {
    const pressed = play([asToggle, focus, down("Enter")]);
    expect(pressed).toMatchObject({ pressed: true, toggleCount: 1n });
    expect(step(pressed, asCommand)).toMatchObject({
      isToggle: false,
      pressed: false,
      toggleCount: 0n,
      activations: 1n,
    });
  });

  it("a command button activation is not a value request", () => {
    const state = play([focus, down("Enter")]);
    expect(state).toMatchObject({ activations: 1n, requests: 0n });
  });

  it("uncontrolled, a toggle request is accepted and commits its intent", () => {
    const clicked = play([asToggle, ...click]);
    expect(clicked).toMatchObject({
      pressed: true,
      outcome: "accepted",
      requested: true,
      base: false,
      requests: 1n,
    });
    // the host-side events are inert without a controlled value
    expect(step(clicked, hostToggle)).toEqual(clicked);
    expect(step(clicked, setValue(false))).toEqual(clicked);
  });

  it("controlled, a request the host ignores leaves the state untouched", () => {
    const controlled = play([asToggle, control]);
    const clicked = play(click, controlled);
    expect(clicked).toMatchObject({
      pressed: false,
      valueProp: false,
      outcome: "rejected",
      requested: true,
      base: false,
      requests: 1n,
    });
    // only the value prop commits
    const committed = step(clicked, hostToggle);
    expect(committed).toMatchObject({
      pressed: true,
      valueProp: true,
      outcome: "none",
    });
    expect(step(committed, setValue(false))).toMatchObject({
      pressed: false,
      valueProp: false,
      outcome: "none",
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = play([asToggle, control, accept]);
    const clicked = play(click, host);
    expect(clicked).toMatchObject({
      pressed: true,
      valueProp: true,
      outcome: "accepted",
      requested: true,
      requests: 1n,
    });
    expect(play(click, clicked)).toMatchObject({
      pressed: false,
      valueProp: false,
      requests: 2n,
    });
  });

  it("adopting a value on `control` keeps what was on screen", () => {
    expect(play([asToggle, { _tag: "seed", v: true }, control])).toMatchObject({
      pressed: true,
      valueProp: true,
    });
  });

  it("derives its event alphabet from the spec pools", () => {
    const events = eventsOf(model);
    expect(events).toContainEqual({ _tag: "key_down", key: "Space" });
    expect(events).toContainEqual({ _tag: "set_toggle", value: true });
    expect(model.pools["key_up"]).toEqual({
      key: ["Enter", "Space", "Other"],
    });
    const schema = model.eventSchemas["set_disabled"];
    if (schema === undefined) {
      throw new Error("no event schema for set_disabled");
    }
    const decode = Schema.decodeUnknownSync(schema as Schema.Codec<Record<string, unknown>>);
    expect(decode({ _tag: "set_disabled", value: true })).toEqual({
      _tag: "set_disabled",
      value: true,
    });
    expect(() => decode({ _tag: "set_disabled", value: "yes" })).toThrow();
  });

  it("no reachable state violates an invariant (exploration + simulation)", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(50);

    assertReachable(report, "a pressed toggle", (state) => state["pressed"] === true);
    assertReachable(
      report,
      "a focused disabled button",
      (state) => state["focused"] === true && state["disabled"] === true,
    );
    assertUnreachable(
      report,
      "a pressed command button",
      (state) => state["pressed"] === true && state["isToggle"] === false,
    );

    expect(simulate(model, { runs: 50, maxSteps: 80 }).violations).toEqual([]);
  });
});
