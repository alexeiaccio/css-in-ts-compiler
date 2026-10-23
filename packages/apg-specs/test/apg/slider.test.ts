import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import {
  assertReachable,
  explore,
  simulate,
  stateKey,
  verifySpec,
} from "@quint-machine/core/testing";
import { describe, expect, it } from "vite-plus/test";
import { Schema } from "effect";
import definitionJson from "../../src/apg/slider.model.generated.json";

// Spec-only verification for specs/apg/slider.qnt: the APG slider pattern.
// Range 0..10, step 1, large step 3; init value 5, ltr + horizontal.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const initial = model.initial;

const press = (state: QuintModelValue, key: string): QuintModelValue =>
  step(state, { _tag: "keydown", key });

const focused = step(initial, { _tag: "focus" });

const withValue = (value: bigint): QuintModelValue => ({ ...focused, value });

describe("apg slider (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "ValueInRange",
      "AriaNowWithinBounds",
      "ValueOnStepGrid",
      "ValueTextDerived",
      "OrientationAndDirValid",
      "HandledImpliesFocused",
      "InTabSequence",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    expect(violatedInvariants(model, { ...initial, value: 11n })).toEqual([
      "ValueInRange",
      "AriaNowWithinBounds",
    ]);
    expect(violatedInvariants(model, { ...initial, value: -1n })).toEqual([
      "ValueInRange",
      "AriaNowWithinBounds",
    ]);
    expect(violatedInvariants(model, { ...initial, handled: true, dir: "up" })).toEqual([
      "OrientationAndDirValid",
      "HandledImpliesFocused",
    ]);
    // an event committed while controlled: the value left the value prop behind
    expect(
      violatedInvariants(model, {
        ...initial,
        controlled: true,
        valueProp: 0n,
        value: 5n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the value anyway
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "rejected",
        base: 0n,
        value: 5n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "accepted",
        requested: 0n,
        value: 5n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("starts unfocused, mid-range, horizontal, ltr", () => {
    expect(initial).toMatchObject({
      value: 5n,
      focused: false,
      orientation: "horizontal",
      dir: "ltr",
      handled: false,
    });
  });

  it("ignores keys while the thumb is not focused", () => {
    const next = press(initial, "ArrowRight");
    expect(next).toMatchObject({ value: 5n, handled: false });
    expect(press(initial, "End")).toMatchObject({ value: 5n, handled: false });
  });

  it("Right/Up increase and Left/Down decrease by one step", () => {
    expect(press(focused, "ArrowRight")).toMatchObject({
      value: 6n,
      handled: true,
    });
    expect(press(focused, "ArrowUp")).toMatchObject({ value: 6n });
    expect(press(focused, "ArrowLeft")).toMatchObject({ value: 4n });
    expect(press(focused, "ArrowDown")).toMatchObject({ value: 4n });
  });

  it("PageUp/PageDown move by the large step", () => {
    expect(press(focused, "PageUp")).toMatchObject({ value: 8n });
    expect(press(focused, "PageDown")).toMatchObject({ value: 2n });
  });

  it("a configured step drives arrows, page keys and the start value", () => {
    // oxlint-disable-next-line automation/no-manual-tagged-construction
    const configured = step(initial, { _tag: "configure", pick: 1n });
    const stepped = step(configured, {
      // oxlint-disable-next-line automation/no-manual-tagged-construction
      _tag: "focus",
    });
    expect(stepped).toMatchObject({
      flavor: 1n,
      value: 6n,
      focused: true,
    });
    expect(press(stepped, "ArrowRight")).toMatchObject({ value: 8n });
    expect(press(stepped, "ArrowLeft")).toMatchObject({ value: 4n });
    // large step 4 is a multiple of step 2, so a page jump stays on the grid
    expect(press(stepped, "PageUp")).toMatchObject({ value: 10n });
    expect(press(stepped, "PageDown")).toMatchObject({ value: 2n });
    expect(press(stepped, "Home")).toMatchObject({ value: 0n });
    expect(press(stepped, "End")).toMatchObject({ value: 10n });
  });

  it("a pointer press snaps to the configured step grid", () => {
    // oxlint-disable-next-line automation/no-manual-tagged-construction
    const stepped = step(initial, { _tag: "configure", pick: 1n });
    // raw 7 is between 6 and 8 on a step-2 grid; the press lands on 8
    // oxlint-disable-next-line automation/no-manual-tagged-construction
    expect(step(stepped, { _tag: "pointer", raw: 7n })).toMatchObject({
      value: 8n,
      focused: true,
    });
    // oxlint-disable-next-line automation/no-manual-tagged-construction
    expect(step(stepped, { _tag: "pointer", raw: 4n })).toMatchObject({
      value: 4n,
    });
  });

  it("Home/End jump to the range ends", () => {
    expect(press(focused, "Home")).toMatchObject({ value: 0n, handled: true });
    expect(press(focused, "End")).toMatchObject({ value: 10n, handled: true });
  });

  it("clamps at both ends instead of overshooting", () => {
    expect(press(withValue(10n), "ArrowRight")).toMatchObject({ value: 10n });
    expect(press(withValue(9n), "PageUp")).toMatchObject({ value: 10n });
    expect(press(withValue(0n), "ArrowDown")).toMatchObject({ value: 0n });
    expect(press(withValue(2n), "PageDown")).toMatchObject({ value: 0n });
    // a key at the edge is still consumed
    expect(press(withValue(10n), "ArrowUp")).toMatchObject({ handled: true });
  });

  it("does not consume keys it has no meaning for", () => {
    expect(press(focused, "Enter")).toMatchObject({
      value: 5n,
      handled: false,
    });
  });

  it("rtl flips Left/Right on a horizontal slider, never Up/Down", () => {
    const rtl = step(focused, { _tag: "setDir", d: "rtl" });
    expect(press(rtl, "ArrowLeft")).toMatchObject({ value: 6n });
    expect(press(rtl, "ArrowRight")).toMatchObject({ value: 4n });
    expect(press(rtl, "ArrowUp")).toMatchObject({ value: 6n });
    expect(press(rtl, "ArrowDown")).toMatchObject({ value: 4n });
    // Page keys, Home and End are direction-independent
    expect(press(rtl, "PageUp")).toMatchObject({ value: 8n });
    expect(press(rtl, "End")).toMatchObject({ value: 10n });
  });

  it("vertical keeps all four arrows, with Left/Right unflipped even in rtl", () => {
    const vertical = step(focused, {
      _tag: "setOrientation",
      o: "vertical",
    });
    expect(vertical).toMatchObject({ orientation: "vertical" });
    expect(press(vertical, "ArrowUp")).toMatchObject({ value: 6n });
    expect(press(vertical, "ArrowDown")).toMatchObject({ value: 4n });
    expect(press(vertical, "ArrowRight")).toMatchObject({ value: 6n });

    const verticalRtl = step(vertical, { _tag: "setDir", d: "rtl" });
    expect(press(verticalRtl, "ArrowRight")).toMatchObject({ value: 6n });
    expect(press(verticalRtl, "ArrowLeft")).toMatchObject({ value: 4n });
  });

  it("keeps focus and value across orientation and direction changes", () => {
    const next = step(step(withValue(7n), { _tag: "setDir", d: "rtl" }), {
      _tag: "setOrientation",
      o: "vertical",
    });
    expect(next).toMatchObject({
      value: 7n,
      focused: true,
      dir: "rtl",
      orientation: "vertical",
      handled: false,
    });
  });

  it("a pointer press focuses the thumb and clamps to the range", () => {
    expect(step(initial, { _tag: "pointer", raw: 4n })).toMatchObject({
      value: 4n,
      focused: true,
    });
    expect(step(initial, { _tag: "pointer", raw: 14n })).toMatchObject({
      value: 10n,
    });
    expect(step(initial, { _tag: "pointer", raw: -3n })).toMatchObject({
      value: 0n,
    });
  });

  it("blur drops focus and clears the consumed flag", () => {
    const consumed = press(focused, "ArrowRight");
    expect(step(consumed, { _tag: "blur" })).toMatchObject({
      focused: false,
      handled: false,
      value: 6n,
    });
  });

  it("uncontrolled, a request is accepted and commits its intent", () => {
    expect(initial).toMatchObject({
      controlled: false,
      outcome: "none",
      requests: 0n,
    });
    const moved = press(focused, "ArrowRight");
    expect(moved).toMatchObject({
      value: 6n,
      outcome: "accepted",
      requested: 6n,
      base: 5n,
      requests: 1n,
    });
    // a key at the bound moves nowhere, so it is not a request
    const top = step(focused, { _tag: "keydown", key: "End" });
    expect(top).toMatchObject({ value: 10n, requests: 1n });
    expect(step(top, { _tag: "keydown", key: "End" })).toMatchObject({
      value: 10n,
      requests: 1n,
    });
    // the host-side commit is inert without a controlled value
    expect(model.transition(moved, { _tag: "setValue", v: 3n })).toMatchObject({
      value: 6n,
      requests: 1n,
    });
  });

  it("controlled, a request the host ignores leaves the value untouched", () => {
    const host = step(initial, { _tag: "control" });
    expect(host).toMatchObject({ controlled: true, valueProp: 5n });
    const requested = press(step(host, { _tag: "focus" }), "ArrowRight");
    expect(requested).toMatchObject({
      value: 5n,
      valueProp: 5n,
      outcome: "rejected",
      requested: 6n,
      base: 5n,
      requests: 1n,
    });
    // only the host writing the value prop commits
    expect(step(requested, { _tag: "setValue", v: 8n })).toMatchObject({
      value: 8n,
      valueProp: 8n,
      outcome: "none",
      requests: 1n,
    });
  });

  it("controlled, a host that accepts commits the intent through the prop", () => {
    const host = step(step(initial, { _tag: "control" }), {
      _tag: "acceptRequests",
    });
    const requested = press(step(host, { _tag: "focus" }), "ArrowRight");
    expect(requested).toMatchObject({
      value: 6n,
      valueProp: 6n,
      outcome: "accepted",
      requested: 6n,
      requests: 1n,
    });
  });

  it("controlled, the host outside toggle writes the opposite range end", () => {
    const host = step(initial, { _tag: "control" });
    expect(step(host, { _tag: "hostToggle" })).toMatchObject({
      value: 10n,
      valueProp: 10n,
      outcome: "none",
    });
    expect(step(step(host, { _tag: "hostToggle" }), { _tag: "hostToggle" })).toMatchObject({
      value: 0n,
      valueProp: 0n,
    });
    // inert while uncontrolled
    expect(step(initial, { _tag: "hostToggle" })).toMatchObject({
      value: 5n,
      requests: 0n,
    });
  });

  it("a pointer press is a request that clamps and focuses", () => {
    const pressed = step(initial, { _tag: "pointer", raw: 14n });
    expect(pressed).toMatchObject({
      value: 10n,
      focused: true,
      outcome: "accepted",
      requested: 10n,
      base: 5n,
      requests: 1n,
    });
    // a press at the current value is not a request
    const again = step(pressed, { _tag: "pointer", raw: 10n });
    expect(again).toMatchObject({ value: 10n, requests: 1n });
  });

  it("walking the range by arrow steps visits every value, invariants intact", () => {
    // ValueTextDerived (aria-valuetext present, endpoints low/high) is checked
    // by `press` at every value on the way.
    let state = press(focused, "Home");
    const seen: bigint[] = [];
    for (let i = 0; i < 12; i += 1) {
      seen.push(state["value"] as bigint);
      state = press(state, "ArrowRight");
    }
    expect(seen).toEqual([0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, 10n]);
  });

  it("exposes typed event schemas for the pools", () => {
    const schema = model.eventSchemas["keydown"];
    if (schema === undefined) {
      throw new Error("no event schema for keydown");
    }
    const decode = Schema.decodeUnknownSync(schema as Schema.Codec<Record<string, unknown>>);
    expect(decode({ _tag: "keydown", key: "Home" })).toEqual({
      _tag: "keydown",
      key: "Home",
    });
    expect(() => decode({ _tag: "keydown", key: 1n })).toThrow();
  });

  it("every value in the range is reachable, no invariant is violated", () => {
    const report = explore(model, { maxDepth: 5, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(20);
    assertReachable(report, "value at the minimum", (state) => state["value"] === 0n);
    assertReachable(report, "value at the maximum", (state) => state["value"] === 10n);
  });

  it("survives long random walks and the shared verifier", () => {
    const report = simulate(model, { runs: 50, maxSteps: 60, seed: 7 });
    expect(report.violations).toEqual([]);
    verifySpec(model, {
      maxDepth: 4,
      maxStates: 5_000,
      runs: 20,
      maxSteps: 40,
    });
  });
});
