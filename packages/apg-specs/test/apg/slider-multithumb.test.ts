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
import definitionJson from "../../src/apg/slider-multithumb.model.generated.json";

// Spec-only verification for specs/apg/slider-multithumb.qnt: the APG
// two-thumb slider. Range 0..10, step 1, large step 3; init lo=3, hi=7.

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

const focusOn = (state: QuintModelValue, t: "lo" | "hi"): QuintModelValue =>
  step(state, { _tag: "focusThumb", t });

const onLo = focusOn(initial, "lo");
const onHi = focusOn(initial, "hi");
const control = { _tag: "control" };
const acceptRequests = { _tag: "acceptRequests" };
const setValue = (v: number) => ({ _tag: "setValue", v: BigInt(v) });

describe("apg slider-multithumb (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "ThumbsOrdered",
      "BoundsFollowNeighbour",
      "OuterBoundsAreRange",
      "NowWithinOwnBounds",
      "ValuesOnStepGrid",
      "ValueTextDerived",
      "OrientationAndDirValid",
      "FocusValid",
      "HandledImpliesFocused",
      "TabOrderConstant",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    // crossed thumbs: each thumb sits outside its neighbour-derived bounds
    expect(violatedInvariants(model, { ...initial, lo: 8n, hi: 3n })).toEqual([
      "ThumbsOrdered",
      "NowWithinOwnBounds",
    ]);
    expect(violatedInvariants(model, { ...initial, lo: -1n })).toEqual([
      "ThumbsOrdered",
      "NowWithinOwnBounds",
    ]);
    expect(violatedInvariants(model, { ...initial, hi: 11n })).toEqual([
      "ThumbsOrdered",
      "NowWithinOwnBounds",
    ]);
    expect(violatedInvariants(model, { ...initial, handled: true })).toEqual([
      "HandledImpliesFocused",
    ]);
    expect(violatedInvariants(model, { ...initial, focused: "mid" })).toEqual(["FocusValid"]);
    expect(violatedInvariants(model, { ...initial, orientation: "x" })).toEqual([
      "OrientationAndDirValid",
    ]);
    // controlled: a commit left the value prop behind
    expect(
      violatedInvariants(model, {
        ...initial,
        controlled: true,
        valueProp: 40n,
        lo: 5n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the pair anyway
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "rejected",
        base: 40n,
        lo: 3n,
        hi: 8n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "accepted",
        requested: 40n,
        lo: 3n,
        hi: 8n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("starts with ordered thumbs, nothing focused", () => {
    expect(initial).toMatchObject({
      lo: 3n,
      hi: 7n,
      focused: "none",
      orientation: "horizontal",
      dir: "ltr",
      handled: false,
    });
  });

  it("keys move only the focused thumb and ignore an unfocused slider", () => {
    expect(press(initial, "ArrowRight")).toMatchObject({
      lo: 3n,
      hi: 7n,
      handled: false,
    });
    expect(press(onLo, "ArrowRight")).toMatchObject({
      lo: 4n,
      hi: 7n,
      handled: true,
    });
    expect(press(onHi, "ArrowRight")).toMatchObject({ lo: 3n, hi: 8n });
    expect(press(onHi, "ArrowLeft")).toMatchObject({ lo: 3n, hi: 6n });
    expect(press(onLo, "ArrowUp")).toMatchObject({ lo: 4n });
    expect(press(onLo, "ArrowDown")).toMatchObject({ lo: 2n });
    expect(press(onLo, "Enter")).toMatchObject({
      lo: 3n,
      hi: 7n,
      handled: false,
    });
  });

  it("the lower thumb is capped by the upper thumb, step by step", () => {
    let state = onLo;
    for (const expected of [4n, 5n, 6n, 7n, 7n, 7n]) {
      state = press(state, "ArrowRight");
      expect(state).toMatchObject({ lo: expected, hi: 7n });
    }
    // blocked at the neighbour but the key is still consumed
    expect(state).toMatchObject({ handled: true });
  });

  it("the upper thumb is floored by the lower thumb", () => {
    let state = onHi;
    for (const expected of [6n, 5n, 4n, 3n, 3n]) {
      state = press(state, "ArrowLeft");
      expect(state).toMatchObject({ lo: 3n, hi: expected });
    }
  });

  it("PageUp/PageDown move by the large step but never past the neighbour", () => {
    expect(press(onLo, "PageUp")).toMatchObject({ lo: 6n, hi: 7n });
    expect(press(press(onLo, "PageUp"), "PageUp")).toMatchObject({
      lo: 7n,
      hi: 7n,
    });
    expect(press(onHi, "PageDown")).toMatchObject({ lo: 3n, hi: 4n });
    expect(press(press(onHi, "PageDown"), "PageDown")).toMatchObject({
      lo: 3n,
      hi: 3n,
    });
    // away from the neighbour the full large step is available / clamped
    expect(press(onHi, "PageUp")).toMatchObject({ hi: 10n });
    expect(press(onLo, "PageDown")).toMatchObject({ lo: 0n });
  });

  it("Home/End go to the first/last value the thumb may take", () => {
    expect(press(onLo, "Home")).toMatchObject({ lo: 0n, hi: 7n });
    expect(press(onLo, "End")).toMatchObject({ lo: 7n, hi: 7n });
    expect(press(onHi, "Home")).toMatchObject({ lo: 3n, hi: 3n });
    expect(press(onHi, "End")).toMatchObject({ lo: 3n, hi: 10n });
  });

  it("bounds follow the neighbour: moving one thumb re-opens the other", () => {
    // squeeze lo against hi, then pull hi away: lo may follow it up
    const squeezed = press(onLo, "End");
    expect(squeezed).toMatchObject({ lo: 7n, hi: 7n });
    const hiMoved = press(focusOn(squeezed, "hi"), "End");
    expect(hiMoved).toMatchObject({ lo: 7n, hi: 10n });
    expect(press(focusOn(hiMoved, "lo"), "End")).toMatchObject({
      lo: 10n,
      hi: 10n,
    });
  });

  it("equal thumbs stay put in both directions", () => {
    const equal = { ...onLo, lo: 5n, hi: 5n };
    expect(press(equal, "ArrowRight")).toMatchObject({ lo: 5n, hi: 5n });
    expect(press(focusOn(equal, "hi"), "ArrowLeft")).toMatchObject({
      lo: 5n,
      hi: 5n,
    });
    // each can still move away from the other
    expect(press(equal, "ArrowLeft")).toMatchObject({ lo: 4n, hi: 5n });
    expect(press(focusOn(equal, "hi"), "ArrowRight")).toMatchObject({
      lo: 5n,
      hi: 6n,
    });
  });

  it("rtl flips Left/Right on a horizontal slider, never Up/Down", () => {
    const rtl = step(onLo, { _tag: "setDir", d: "rtl" });
    expect(press(rtl, "ArrowLeft")).toMatchObject({ lo: 4n });
    expect(press(rtl, "ArrowRight")).toMatchObject({ lo: 2n });
    expect(press(rtl, "ArrowUp")).toMatchObject({ lo: 4n });
    expect(press(rtl, "ArrowDown")).toMatchObject({ lo: 2n });
    // the neighbour bound still applies to the flipped key
    const rtlHi = step(onHi, { _tag: "setDir", d: "rtl" });
    expect(
      press(press(press(press(rtlHi, "ArrowRight"), "ArrowRight"), "ArrowRight"), "ArrowRight"),
    ).toMatchObject({
      lo: 3n,
      hi: 3n,
    });
  });

  it("vertical keeps all four arrows with Left/Right unflipped even in rtl", () => {
    const vertical = step(onLo, { _tag: "setOrientation", o: "vertical" });
    expect(press(vertical, "ArrowUp")).toMatchObject({ lo: 4n });
    expect(press(vertical, "ArrowDown")).toMatchObject({ lo: 2n });
    expect(press(vertical, "ArrowRight")).toMatchObject({ lo: 4n });
    const verticalRtl = step(vertical, { _tag: "setDir", d: "rtl" });
    expect(press(verticalRtl, "ArrowRight")).toMatchObject({ lo: 4n });
    expect(press(verticalRtl, "ArrowLeft")).toMatchObject({ lo: 2n });
  });

  it("the tab order is constant and independent of the values", () => {
    const walk = (state: QuintModelValue, event: string, n: number): string[] => {
      const seen: string[] = [];
      let current = state;
      for (let i = 0; i < n; i += 1) {
        current = step(current, { _tag: event });
        seen.push(current["focused"] as string);
      }
      return seen;
    };
    const equal = { ...initial, lo: 5n, hi: 5n };
    const apart = { ...initial, lo: 0n, hi: 10n };
    for (const state of [initial, equal, apart]) {
      expect(walk(state, "tab", 4)).toEqual(["lo", "hi", "none", "lo"]);
      expect(walk(state, "shiftTab", 4)).toEqual(["hi", "lo", "none", "hi"]);
    }
    // changing a value does not reorder the sequence
    const moved = press(press(onLo, "End"), "ArrowRight");
    expect(step(moved, { _tag: "tab" })).toMatchObject({ focused: "hi" });
  });

  it("a pointer press focuses its thumb and clamps to that thumb bounds", () => {
    expect(step(initial, { _tag: "pointerLo", raw: 10n })).toMatchObject({
      lo: 7n,
      hi: 7n,
      focused: "lo",
    });
    expect(step(initial, { _tag: "pointerLo", raw: -3n })).toMatchObject({
      lo: 0n,
    });
    expect(step(initial, { _tag: "pointerHi", raw: 0n })).toMatchObject({
      lo: 3n,
      hi: 3n,
      focused: "hi",
    });
    expect(step(initial, { _tag: "pointerHi", raw: 14n })).toMatchObject({
      hi: 10n,
    });
    expect(step(initial, { _tag: "pointerHi", raw: 4n })).toMatchObject({
      hi: 4n,
    });
  });

  it("blur drops focus and clears the consumed flag", () => {
    const consumed = press(onLo, "ArrowRight");
    expect(step(consumed, { _tag: "blur" })).toMatchObject({
      focused: "none",
      handled: false,
      lo: 4n,
    });
  });

  it("uncontrolled, a key request commits its intent", () => {
    const moved = press(onLo, "ArrowRight");
    expect(moved).toMatchObject({
      lo: 4n,
      hi: 7n,
      outcome: "accepted",
      requested: 51n,
      base: 40n,
      requests: 1n,
    });
    // a key that moves nothing is not a request
    expect(press(onLo, "Enter")).toMatchObject({ requests: 0n });
  });

  it("controlled, a request the host ignores leaves the pair untouched", () => {
    const controlled = step(initial, control);
    const requested = press(focusOn(controlled, "lo"), "ArrowRight");
    expect(requested).toMatchObject({
      lo: 3n,
      hi: 7n,
      valueProp: 40n,
      outcome: "rejected",
      requested: 51n,
      base: 40n,
      requests: 1n,
    });
    // the host write is the only commit while controlled
    const committed = step(requested, setValue(60));
    expect(committed).toMatchObject({
      lo: 5n,
      hi: 5n,
      valueProp: 60n,
      outcome: "none",
      requests: 1n,
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = step(step(initial, control), acceptRequests);
    const moved = press(focusOn(host, "lo"), "ArrowRight");
    expect(moved).toMatchObject({
      lo: 4n,
      hi: 7n,
      valueProp: 51n,
      outcome: "accepted",
      requested: 51n,
      requests: 1n,
    });
  });

  it("exposes typed event schemas for the pools", () => {
    const schema = model.eventSchemas["pointerLo"];
    if (schema === undefined) {
      throw new Error("no event schema for pointerLo");
    }
    const decode = Schema.decodeUnknownSync(schema as Schema.Codec<Record<string, unknown>>);
    expect(decode({ _tag: "pointerLo", raw: 4n })).toEqual({
      _tag: "pointerLo",
      raw: 4n,
    });
    expect(() => decode({ _tag: "pointerLo", raw: "4" })).toThrow();
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 5, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(50);
    assertReachable(report, "thumbs touching", (state) => state["lo"] === state["hi"]);
    assertReachable(
      report,
      "both thumbs at the range ends",
      (state) => state["lo"] === 0n && state["hi"] === 10n,
    );
  });

  it("survives long random walks and the shared verifier", () => {
    const report = simulate(model, { runs: 50, maxSteps: 60, seed: 11 });
    expect(report.violations).toEqual([]);
    verifySpec(model, {
      maxDepth: 4,
      maxStates: 5_000,
      runs: 20,
      maxSteps: 40,
    });
  });
});
