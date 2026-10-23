import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { assertReachable, explore, simulate, stateKey } from "@quint-machine/core/testing";
import { describe, expect, it } from "vite-plus/test";
import { Schema } from "effect";
import definitionJson from "../../src/apg/listbox-typeahead.model.generated.json";

// Spec-only verification for specs/apg/listbox-typeahead.qnt: APG type-ahead
// as a char pool + buffer + timeout event. Options are named
// 0 "aa"  1 "ab"  2 "b"  3 "ba"  4 "bc"  5 "c"  and the chars are a=1 b=2 c=3.
// The shared harness derives the event alphabet from the spec's own pools and
// checks every declared invariant after every step.

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
const A = 1n;
const B = 2n;
const C = 3n;
const type = (ch: bigint) => ({ _tag: "type_char", ch });
const timeout = key("timeout");
const focused = step(initial, key("focus_in"));

describe("apg listbox typeahead (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "ActiveInRange",
      "ActiveDescendantTracksFocus",
      "BufferWellFormed",
      "TimerArmedIffBuffered",
      "BufferOnlyWhileFocused",
      "MatchedImpliesPrefix",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    const base = {
      hasFocus: true,
      active: 0n,
      buf: 0n,
      bufLen: 0n,
      armed: false,
      matched: false,
      controlled: false,
      accepting: false,
      valueProp: 0n,
      requested: 0n,
      outcome: "none",
      base: 0n,
      requests: 0n,
    };
    // buffer "bb" (code 10) without a running timer
    expect(violatedInvariants(model, { ...base, buf: 10n, bufLen: 2n })).toEqual([
      "TimerArmedIffBuffered",
    ]);
    // a buffer content that does not fit its length
    expect(violatedInvariants(model, { ...base, buf: 20n, bufLen: 2n, armed: true })).toEqual([
      "BufferWellFormed",
    ]);
    // typing into an unfocused listbox
    expect(
      violatedInvariants(model, {
        ...base,
        hasFocus: false,
        buf: 2n,
        bufLen: 1n,
        armed: true,
      }),
    ).toEqual(["BufferOnlyWhileFocused"]);
    // "matched" on an option whose name does not start with the buffer
    expect(
      violatedInvariants(model, {
        ...base,
        active: 0n,
        buf: 2n,
        bufLen: 1n,
        armed: true,
        matched: true,
      }),
    ).toEqual(["MatchedImpliesPrefix"]);
    expect(violatedInvariants(model, { ...base, active: 6n })).toEqual([
      "ActiveInRange",
      "ActiveDescendantTracksFocus",
    ]);
    // a commit left focus off the controlled value prop
    expect(
      violatedInvariants(model, {
        ...base,
        controlled: true,
        active: 3n,
        valueProp: 1n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved focus anyway
    expect(
      violatedInvariants(model, {
        ...base,
        controlled: true,
        active: 3n,
        valueProp: 3n,
        outcome: "rejected",
        base: 1n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...base,
        controlled: true,
        active: 3n,
        valueProp: 3n,
        outcome: "accepted",
        requested: 1n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
    expect(violatedInvariants(model, { ...base, requests: -1n })).toEqual(["RequestsNonNegative"]);
  });

  it("a single char moves focus to the next option starting with it", () => {
    const state = step(focused, type(B));
    expect(state).toMatchObject({
      active: 2n,
      buf: 2n,
      bufLen: 1n,
      armed: true,
      matched: true,
    });
  });

  it("the search starts AFTER the active option and wraps around", () => {
    // from "aa" the next "a…" option is "ab"
    expect(step(focused, type(A))).toMatchObject({ active: 1n });
    // from "c" the next "a…" option wraps to "aa"
    const atC = run(focused, [type(C), timeout]);
    expect(atC).toMatchObject({ active: 5n });
    expect(step(atC, type(A))).toMatchObject({ active: 0n });
    // from "b" the next "b…" option is "ba", then "bc", then back to "b"
    const b1 = run(focused, [type(B)]);
    const b2 = run(b1, [timeout, type(B)]);
    expect(b2).toMatchObject({ active: 3n });
    expect(run(b2, [timeout, type(B)])).toMatchObject({ active: 4n });
    expect(run(b2, [timeout, type(B), timeout, type(B)])).toMatchObject({
      active: 2n,
    });
  });

  it("typing several chars in rapid succession matches the whole string", () => {
    // "b" -> option "b"; "ba" -> option "ba"; "bc" is a different word
    const ba = run(focused, [type(B), type(A)]);
    expect(ba).toMatchObject({
      active: 3n,
      buf: 9n,
      bufLen: 2n,
      matched: true,
    });
    const bc = run(focused, [type(B), type(C)]);
    expect(bc).toMatchObject({ active: 4n, buf: 11n, matched: true });
    // "aa" stays on the focused "aa" (it still matches the buffer)
    const aa = run(initial, [key("focus_in"), type(C), timeout, type(A), type(A)]);
    expect(aa).toMatchObject({ active: 0n, buf: 5n, matched: true });
  });

  it("no match keeps focus but the buffer still grows", () => {
    const state = run(focused, [type(B), type(B)]);
    expect(state).toMatchObject({
      active: 2n,
      buf: 10n,
      bufLen: 2n,
      armed: true,
      matched: false,
    });
  });

  it("the only match being the active option leaves focus there", () => {
    const atC = run(focused, [type(C), timeout]);
    expect(step(atC, type(C))).toMatchObject({ active: 5n, matched: true });
  });

  it("the timeout clears the buffer and the next char starts a fresh search", () => {
    const typed = run(focused, [type(B), type(A)]);
    expect(typed).toMatchObject({ armed: true, bufLen: 2n });
    const cleared = step(typed, timeout);
    expect(cleared).toMatchObject({
      active: 3n,
      buf: 0n,
      bufLen: 0n,
      armed: false,
      matched: false,
    });
    // fresh search from "ba": the next "b…" option after it is "bc"
    expect(step(cleared, type(B))).toMatchObject({ active: 4n, bufLen: 1n });
  });

  it("the timeout is a no-op on an empty buffer", () => {
    expect(step(focused, timeout)).toEqual(focused);
  });

  it("the buffer saturates at three chars; nothing can match it", () => {
    const state = run(focused, [type(A), type(A), type(A), type(A)]);
    expect(state).toMatchObject({ bufLen: 3n, matched: false, armed: true });
    expect(step(state, type(B))).toMatchObject({
      bufLen: 3n,
      buf: state["buf"],
    });
  });

  it("navigation keys and blur drop the buffer", () => {
    const typed = run(focused, [type(B)]);
    for (const tag of ["arrow_down", "arrow_up", "home", "end"]) {
      expect(step(typed, key(tag))).toMatchObject({
        buf: 0n,
        bufLen: 0n,
        armed: false,
        matched: false,
      });
    }
    expect(step(typed, key("arrow_down"))).toMatchObject({ active: 3n });
    expect(step(typed, key("end"))).toMatchObject({ active: 5n });
    expect(step(typed, key("blur"))).toMatchObject({
      hasFocus: false,
      active: 2n,
      bufLen: 0n,
      armed: false,
    });
  });

  it("typing does nothing while the listbox is not focused", () => {
    expect(step(initial, type(B))).toEqual(initial);
    expect(step(initial, key("arrow_down"))).toEqual(initial);
  });

  it("focus returns to the remembered active option", () => {
    const state = run(focused, [type(B), key("blur"), key("focus_in")]);
    expect(state).toMatchObject({ hasFocus: true, active: 2n });
  });

  it("exposes a typed event schema for the char pool", () => {
    const schema = model.eventSchemas["type_char"];
    if (schema === undefined) {
      throw new Error("no event schema for type_char");
    }
    const decode = Schema.decodeUnknownSync(schema as Schema.Codec<Record<string, unknown>>);
    expect(decode({ _tag: "type_char", ch: 2n })).toEqual({
      _tag: "type_char",
      ch: 2n,
    });
    expect(() => decode({ _tag: "type_char", ch: "b" })).toThrow();
  });

  it("no reachable state violates an invariant (bounded exploration + simulation)", () => {
    const report = explore(model, { maxDepth: 8, maxStates: 30_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(50);
    assertReachable(
      report,
      "a two-char word matched",
      (s) => s["bufLen"] === 2n && s["matched"] === true && s["active"] === 4n,
    );
    assertReachable(report, "a saturated buffer", (s) => s["bufLen"] === 3n && s["armed"] === true);
    expect(simulate(model, { runs: 300, maxSteps: 80, seed: 3 }).violations).toEqual([]);
  }, 300_000);
});
