import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { explore, stateKey } from "@quint-machine/core/testing";
import definitionJson from "../../src/apg/link.model.generated.json";

// Spec-only verification for specs/apg/link.qnt: the APG link — Enter
// executes it and moves focus to the target; a non-native role=link must
// carry tabindex. The shared harness derives the event alphabet from the
// spec's own pools and checks every declared invariant after every step.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const initial = model.initial;

describe("apg link (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "KeyboardReachable",
      "FocusOnLinkImpliesFocusable",
      "TargetFocusImpliesArrived",
      "ArrivedImpliesActivated",
      "LocationKnown",
      "ActivationsNonNegative",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    // a role=link without tabindex is unreachable by keyboard
    expect(violatedInvariants(model, { ...initial, native: false })).toEqual(["KeyboardReachable"]);
    expect(violatedInvariants(model, { ...initial, native: false, focus: "link" })).toEqual([
      "KeyboardReachable",
      "FocusOnLinkImpliesFocusable",
    ]);

    expect(violatedInvariants(model, { ...initial, focus: "target" })).toEqual([
      "TargetFocusImpliesArrived",
    ]);
    expect(violatedInvariants(model, { ...initial, location: 1n })).toEqual([
      "ArrivedImpliesActivated",
    ]);
  });

  it("Enter on the focused link executes it and focuses the target", () => {
    const focused = step(initial, { _tag: "focusLink" });
    expect(focused).toMatchObject({ focus: "link", location: 0n });

    const activated = step(focused, { _tag: "press" });
    expect(activated).toMatchObject({
      focus: "target",
      location: 1n,
      activations: 1n,
    });
  });

  it("Enter without focus on the link does nothing", () => {
    expect(step(initial, { _tag: "press" })).toEqual(initial);

    const blurred = step(step(initial, { _tag: "focusLink" }), {
      _tag: "blur",
    });
    expect(step(blurred, { _tag: "press" })).toEqual(blurred);
  });

  it("Space does not activate a link", () => {
    const focused = step(initial, { _tag: "focusLink" });
    expect(step(focused, { _tag: "pressSpace" })).toEqual(focused);
  });

  it("a click executes the link and focuses the target", () => {
    const clicked = step(initial, { _tag: "click" });
    expect(clicked).toMatchObject({
      focus: "target",
      location: 1n,
      activations: 1n,
    });
  });

  it("back returns to the origin and keeps the activation count", () => {
    const arrived = step(initial, { _tag: "click" });
    const back = step(arrived, { _tag: "back" });
    expect(back).toMatchObject({
      focus: "none",
      location: 0n,
      activations: 1n,
    });
  });

  it("a non-native role=link carries tabindex and stays focusable", () => {
    const custom = step(initial, { _tag: "setCustom" });
    expect(custom).toMatchObject({ native: false, tabindex: true });

    const focused = step(custom, { _tag: "focusLink" });
    expect(focused).toMatchObject({ focus: "link" });
    expect(step(focused, { _tag: "press" })).toMatchObject({
      focus: "target",
      activations: 1n,
    });

    // switching back to native keeps focus on the link
    const native = step(focused, { _tag: "setNative" });
    expect(native).toMatchObject({
      native: true,
      tabindex: false,
      focus: "link",
    });
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 5, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(8);
  });
});
