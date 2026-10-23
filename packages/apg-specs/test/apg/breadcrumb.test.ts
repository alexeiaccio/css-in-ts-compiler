import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { explore, stateKey } from "@quint-machine/core/testing";
import { Schema } from "effect";
import definitionJson from "../../src/apg/breadcrumb.model.generated.json";

// Spec-only verification for specs/apg/breadcrumb.qnt: aria-current=page sits
// on the last trail item (or is absent for a non-link current item), through
// every navigation. The shared harness derives the event alphabet from the
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

describe("apg breadcrumb (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "CurrentIsLastOrAbsent",
      "LinkCurrentIsMarked",
      "TrailNotEmpty",
      "TrailBounded",
      "NavigationsNonNegative",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    // aria-current left on an ancestor
    expect(violatedInvariants(model, { ...initial, depth: 2n, currentIndex: 1n })).toEqual([
      "CurrentIsLastOrAbsent",
      "LinkCurrentIsMarked",
    ]);

    // the current-page link lost its aria-current
    expect(violatedInvariants(model, { ...initial, currentIndex: 0n })).toEqual([
      "LinkCurrentIsMarked",
    ]);

    expect(violatedInvariants(model, { ...initial, depth: 5n, currentIndex: 5n })).toEqual([
      "TrailBounded",
    ]);
  });

  it("descending moves aria-current to the new last item", () => {
    const deeper = step(initial, { _tag: "descend" });
    expect(deeper).toMatchObject({ depth: 2n, currentIndex: 2n });

    const deepest = step(step(deeper, { _tag: "descend" }), {
      _tag: "descend",
    });
    expect(deepest).toMatchObject({ depth: 4n, currentIndex: 4n });

    // the trail is bounded
    expect(step(deepest, { _tag: "descend" })).toMatchObject({ depth: 4n });
  });

  it("following an ancestor cuts the trail back and re-marks the current page", () => {
    const deep = step(step(initial, { _tag: "descend" }), { _tag: "descend" });
    const cut = step(deep, { _tag: "ancestor", target: 2n });
    expect(cut).toMatchObject({ depth: 2n, currentIndex: 2n, navigations: 1n });

    // a target at or past the current page is not an ancestor: no change
    const same = step(cut, { _tag: "ancestor", target: 3n });
    expect(same).toEqual(cut);
    expect(step(cut, { _tag: "ancestor", target: 2n })).toEqual(cut);
  });

  it("a non-link current item may drop aria-current, a link may not", () => {
    const deeper = step(initial, { _tag: "descend" });
    const text = step(deeper, { _tag: "renderText" });
    expect(text).toMatchObject({ currentIsLink: false, currentIndex: 2n });

    const unmarked = step(text, { _tag: "toggleMark" });
    expect(unmarked).toMatchObject({ currentIsLink: false, currentIndex: 0n });

    // an unmarked current item stays unmarked while navigating
    const moved = step(unmarked, { _tag: "descend" });
    expect(moved).toMatchObject({ depth: 3n, currentIndex: 0n });

    // toggling the mark of a link is refused
    expect(step(deeper, { _tag: "toggleMark" })).toEqual(deeper);

    // turning the item back into a link restores aria-current
    const relinked = step(moved, { _tag: "renderLink" });
    expect(relinked).toMatchObject({ currentIsLink: true, currentIndex: 3n });
  });

  it("exposes a typed event schema for the ancestor pool", () => {
    const schema = model.eventSchemas["ancestor"];
    if (schema === undefined) {
      throw new Error("no event schema for ancestor");
    }
    const decode = Schema.decodeUnknownSync(schema as Schema.Codec<Record<string, unknown>>);
    expect(decode({ _tag: "ancestor", target: 1n })).toEqual({
      _tag: "ancestor",
      target: 1n,
    });
    expect(() => decode({ _tag: "ancestor", target: "1" })).toThrow();
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(10);
  });
});
