import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { explore, stateKey } from "@quint-machine/core/testing";
import { Schema } from "effect";
import definitionJson from "../../src/apg/meter.model.generated.json";

// Spec-only verification for specs/apg/meter.qnt: the APG meter's value /
// range / valuetext contract. The shared harness derives the event alphabet
// from the spec's own pools and checks every declared invariant after every
// step.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const initial = model.initial;

describe("apg meter (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "RangeValid",
      "NowInRange",
      "NowIsClampedRaw",
      "TextWhenNotFriendly",
      "TextNeverStale",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    expect(violatedInvariants(model, { ...initial, min: 10n, max: 10n, now: 10n })).toEqual([
      "RangeValid",
    ]);

    expect(violatedInvariants(model, { ...initial, raw: 150n, now: 150n })).toEqual([
      "NowInRange",
      "NowIsClampedRaw",
    ]);

    expect(violatedInvariants(model, { ...initial, friendly: false })).toEqual([
      "TextWhenNotFriendly",
    ]);

    expect(violatedInvariants(model, { ...initial, hasText: true, textNow: 10n })).toEqual([
      "TextNeverStale",
    ]);
  });

  it("starts as a friendly 0..100 meter at 50", () => {
    expect(initial).toMatchObject({
      min: 0n,
      max: 100n,
      raw: 50n,
      now: 50n,
      friendly: true,
      hasText: false,
    });
  });

  it("clamps an out-of-range value into [min, max]", () => {
    const high = step(initial, { _tag: "setValue", v: 150n });
    expect(high).toMatchObject({ raw: 150n, now: 100n });

    const low = step(high, { _tag: "setValue", v: -5n });
    expect(low).toMatchObject({ raw: -5n, now: 0n });

    const inside = step(low, { _tag: "setValue", v: 25n });
    expect(inside).toMatchObject({ raw: 25n, now: 25n });
  });

  it("re-clamps the raw value when the range changes", () => {
    const high = step(initial, { _tag: "setValue", v: 150n });
    // r=1 is the range 10..50
    const narrowed = step(high, { _tag: "setRange", r: 1n });
    expect(narrowed).toMatchObject({ min: 10n, max: 50n, raw: 150n, now: 50n });

    // r=2 is 20..200: the remembered raw value 150 is visible again
    const widened = step(narrowed, { _tag: "setRange", r: 2n });
    expect(widened).toMatchObject({ min: 20n, max: 200n, now: 150n });
  });

  it("ignores an invalid range (min >= max)", () => {
    for (const r of [3n, 4n]) {
      const next = step(initial, { _tag: "setRange", r });
      expect(next).toMatchObject({ min: 0n, max: 100n, now: 50n });
    }
  });

  it("keeps aria-valuetext in step with the value, never stale", () => {
    const texted = step(initial, { _tag: "addText" });
    expect(texted).toMatchObject({ hasText: true, textNow: 50n });

    const moved = step(texted, { _tag: "setValue", v: 25n });
    expect(moved).toMatchObject({ now: 25n, textNow: 25n });

    const reRanged = step(moved, { _tag: "setRange", r: 2n });
    expect(reRanged).toMatchObject({ now: 25n, textNow: 25n });

    const raised = step(reRanged, { _tag: "setRange", r: 0n });
    expect(raised).toMatchObject({ hasText: true, textNow: 25n });

    const removed = step(raised, { _tag: "removeText" });
    expect(removed).toMatchObject({ hasText: false, textNow: 0n });
  });

  it("requires valuetext once the percentage is not friendly", () => {
    const unfriendly = step(initial, { _tag: "percentUnfriendly" });
    expect(unfriendly).toMatchObject({ friendly: false, hasText: true });

    // removing the text of an unfriendly meter is refused
    const refused = step(unfriendly, { _tag: "removeText" });
    expect(refused).toMatchObject({ hasText: true, textNow: 50n });

    const friendly = step(refused, { _tag: "percentFriendly" });
    const removed = step(friendly, { _tag: "removeText" });
    expect(removed).toMatchObject({ friendly: true, hasText: false });
  });

  it("exposes typed event schemas for the value and range pools", () => {
    for (const [tag, field] of [
      ["setValue", "v"],
      ["setRange", "r"],
    ] as const) {
      const schema = model.eventSchemas[tag];
      if (schema === undefined) {
        throw new Error(`no event schema for ${tag}`);
      }
      const decode = Schema.decodeUnknownSync(schema as Schema.Codec<Record<string, unknown>>);
      expect(decode({ _tag: tag, [field]: 1n })).toEqual({
        _tag: tag,
        [field]: 1n,
      });
      expect(() => decode({ _tag: tag, [field]: "1" })).toThrow();
    }
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 5, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(20);
  });
});
