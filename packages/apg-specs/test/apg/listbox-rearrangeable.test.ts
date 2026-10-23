import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { assertReachable, explore, simulate, stateKey } from "@quint-machine/core/testing";
import { describe, expect, it } from "vite-plus/test";
import { Schema } from "effect";
import definitionJson from "../../src/apg/listbox-rearrangeable.model.generated.json";

// Spec-only verification for specs/apg/listbox-rearrangeable.qnt: two
// listboxes whose options can be reordered and moved between lists (APG
// listbox-rearrangeable examples 1 and 2). The shared harness derives the
// event alphabet from the spec's own pools and checks every declared
// invariant after every step.

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

const NO_ITEM = 4n;
const initial = model.initial;
const key = (tag: string) => ({ _tag: tag });
const keys = (...tags: string[]) => tags.map(key);
const multiMode = (flag: boolean) => ({ _tag: "set_multi", flag });

/** The option ids of one list in slot order, empty slots dropped. */
const listOf = (state: QuintModelValue, list: "a" | "b"): number[] =>
  [0, 1, 2, 3].flatMap((slot) => {
    const id = state[`${list}${slot}`];
    return id === NO_ITEM ? [] : [Number(id)];
  });

describe("apg listbox rearrangeable (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "OptionsPartitioned",
      "ListsPacked",
      "ActiveInOwnList",
      "SelectionInRange",
      "FocusListKnown",
      "SingleSelectOnePerList",
      "SingleSelectFollowsFocus",
      "ActiveDescendantOnFocusedListOnly",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    const base = { ...initial };
    // option 1 duplicated, option 3 lost
    expect(violatedInvariants(model, { ...base, a3: 1n, b0: NO_ITEM })).toEqual([
      "OptionsPartitioned",
    ]);
    // a hole in list A
    expect(
      violatedInvariants(model, {
        ...base,
        a1: NO_ITEM,
        b0: 1n,
        activeB: 1n,
      }),
    ).toEqual(["ListsPacked"]);
    // list A's active option is not in list A
    expect(
      violatedInvariants(model, {
        ...base,
        a0: NO_ITEM,
        a1: 1n,
        a2: 2n,
        a3: 3n,
        b0: 0n,
        activeA: 0n,
      }),
    ).toContain("ActiveInOwnList");
    // two options selected in a single-select list
    expect(violatedInvariants(model, { ...base, sel: 3n })).toEqual(["SingleSelectOnePerList"]);
    // the focused single-select list's selection is not its active option
    expect(violatedInvariants(model, { ...base, focusList: "a", sel: 2n })).toEqual([
      "SingleSelectFollowsFocus",
    ]);
    expect(violatedInvariants(model, { ...base, sel: 16n })).toEqual(["SelectionInRange"]);
    expect(violatedInvariants(model, { ...base, focusList: "c" })).toEqual(["FocusListKnown"]);
    // multi-select tolerates several selected options
    expect(violatedInvariants(model, { ...base, multi: true, sel: 3n })).toEqual([]);
    // a commit left the selection off the controlled value prop
    expect(violatedInvariants(model, { ...base, controlled: true, sel: 1n })).toEqual([
      "ControlledFollowsProp",
    ]);
    // a rejected request that moved the selection anyway
    expect(
      violatedInvariants(model, {
        ...base,
        controlled: true,
        valueProp0: true,
        sel: 1n,
        outcome: "rejected",
        base: 0n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...base,
        controlled: true,
        valueProp0: true,
        sel: 1n,
        outcome: "accepted",
        requested: 2n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
    expect(violatedInvariants(model, { ...base, requests: -1n })).toEqual(["RequestsNonNegative"]);
  });

  it("starts with every option in list A, nothing focused or selected", () => {
    expect(listOf(initial, "a")).toEqual([0, 1, 2, 3]);
    expect(listOf(initial, "b")).toEqual([]);
    expect(initial).toMatchObject({
      activeA: 0n,
      activeB: NO_ITEM,
      focusList: "none",
      sel: 0n,
      multi: false,
    });
  });

  describe("single-select (example 1)", () => {
    const inA = run(initial, keys("focus_a"));

    it("Tab entry focuses and selects the first option", () => {
      expect(inA).toMatchObject({ focusList: "a", activeA: 0n, sel: 1n });
    });

    it("arrows move focus and selection together, clamped at the ends", () => {
      const down = run(inA, keys("arrow_down", "arrow_down"));
      expect(down).toMatchObject({ activeA: 2n, sel: 4n });
      expect(run(down, keys("end"))).toMatchObject({ activeA: 3n, sel: 8n });
      expect(run(down, keys("end", "arrow_down"))).toMatchObject({
        activeA: 3n,
      });
      expect(run(down, keys("home", "arrow_up"))).toMatchObject({
        activeA: 0n,
        sel: 1n,
      });
    });

    it("Alt+Down / Alt+Up reorder the focused option and focus stays on it", () => {
      const moved = run(inA, keys("arrow_down", "move_down"));
      expect(listOf(moved, "a")).toEqual([0, 2, 1, 3]);
      expect(moved).toMatchObject({ activeA: 1n, sel: 2n });
      const back = run(moved, keys("move_up", "move_up"));
      expect(listOf(back, "a")).toEqual([1, 0, 2, 3]);
      expect(back).toMatchObject({ activeA: 1n, sel: 2n });
    });

    it("reordering at the edges is a no-op", () => {
      expect(step(inA, key("move_up"))).toEqual(inA);
      const last = run(inA, keys("end"));
      expect(step(last, key("move_down"))).toEqual(last);
    });

    it("moving to the other list keeps focus in the source on the next option", () => {
      const moved = run(inA, keys("arrow_down", "transfer"));
      expect(listOf(moved, "a")).toEqual([0, 2, 3]);
      expect(listOf(moved, "b")).toEqual([1]);
      // focus lands on the first remaining option after the removed one,
      // and selection follows it
      expect(moved).toMatchObject({ activeA: 2n, sel: 4n, activeB: 1n });
    });

    it("moving the last option lands focus on the previous one", () => {
      const moved = run(inA, keys("end", "transfer"));
      expect(listOf(moved, "a")).toEqual([0, 1, 2]);
      expect(moved).toMatchObject({ activeA: 2n, sel: 4n });
    });

    it("moved options are appended to the destination in transfer order", () => {
      const state = run(inA, keys("transfer", "transfer", "focus_b", "end"));
      expect(listOf(state, "a")).toEqual([2, 3]);
      expect(listOf(state, "b")).toEqual([0, 1]);
      // each list keeps its own selection: A's active option 2, B's active option 1
      expect(state).toMatchObject({ focusList: "b", activeB: 1n, sel: 6n });
      const back = step(state, key("transfer"));
      expect(listOf(back, "a")).toEqual([2, 3, 1]);
      expect(listOf(back, "b")).toEqual([0]);
      expect(back).toMatchObject({ activeB: 0n, sel: 5n });
    });

    it("draining a list leaves it empty with no active option", () => {
      const drained = run(inA, keys("transfer", "transfer", "transfer", "transfer"));
      expect(listOf(drained, "a")).toEqual([]);
      expect(listOf(drained, "b")).toEqual([0, 1, 2, 3]);
      expect(drained).toMatchObject({ activeA: NO_ITEM, sel: 0n });
      // nothing left to move or navigate
      expect(step(drained, key("transfer"))).toEqual(drained);
      expect(step(drained, key("arrow_down"))).toEqual(drained);
    });

    it("Tab entry into the destination list focuses its first option", () => {
      const state = run(inA, keys("transfer", "blur", "focus_b"));
      expect(state).toMatchObject({ focusList: "b", activeB: 0n });
    });
  });

  describe("multi-select (example 2)", () => {
    const inA = run(initial, [multiMode(true), key("focus_a")]);

    it("arrows move focus only; Space toggles", () => {
      const state = run(inA, keys("space", "arrow_down", "arrow_down"));
      expect(state).toMatchObject({ activeA: 2n, sel: 1n });
      expect(step(state, key("space"))).toMatchObject({ sel: 5n });
      expect(run(state, keys("space", "space"))).toMatchObject({ sel: 1n });
    });

    it("Add / Remove move every selected option, keeping source order", () => {
      const picked = run(inA, keys("space", "arrow_down", "arrow_down", "space"));
      const moved = step(picked, key("transfer"));
      expect(listOf(moved, "a")).toEqual([1, 3]);
      expect(listOf(moved, "b")).toEqual([0, 2]);
      // focus was on moved option 2: next remaining is 3; moved options arrive deselected
      expect(moved).toMatchObject({ activeA: 3n, activeB: 0n, sel: 0n });

      const back = run(moved, keys("focus_b", "space", "transfer"));
      expect(listOf(back, "a")).toEqual([1, 3, 0]);
      expect(listOf(back, "b")).toEqual([2]);
      expect(back).toMatchObject({ activeB: 2n, sel: 0n });
    });

    it("a transfer with nothing selected does nothing", () => {
      expect(step(inA, key("transfer"))).toEqual(inA);
    });

    it("focus stays put when the focused option is not among the moved ones", () => {
      const state = run(inA, keys("arrow_down", "space", "home", "transfer"));
      expect(listOf(state, "a")).toEqual([0, 2, 3]);
      expect(state).toMatchObject({ activeA: 0n });
    });

    it("reordering is single-select only", () => {
      const state = run(inA, keys("arrow_down"));
      expect(step(state, key("move_down"))).toEqual(state);
      expect(step(state, key("move_up"))).toEqual(state);
    });

    it("Tab entry focuses the first selected option", () => {
      const state = run(inA, [
        ...keys("arrow_down", "arrow_down", "space", "blur"),
        key("focus_a"),
      ]);
      expect(state).toMatchObject({ activeA: 2n, sel: 4n });
    });

    it("switching to single-select collapses each list to its active option", () => {
      const state = run(inA, keys("space", "arrow_down", "space"));
      expect(state).toMatchObject({ sel: 3n, activeA: 1n });
      expect(step(state, multiMode(false))).toMatchObject({
        multi: false,
        sel: 2n,
      });
      // switching to multi-select keeps the selection
      expect(step(state, multiMode(true))).toMatchObject({ sel: 3n });
    });
  });

  it("keys do nothing while no list is focused", () => {
    for (const tag of [
      "arrow_down",
      "arrow_up",
      "home",
      "end",
      "space",
      "move_up",
      "move_down",
      "transfer",
    ]) {
      expect(step(initial, key(tag))).toEqual(initial);
    }
  });

  it("exposes a typed event schema for the mode pool", () => {
    const schema = model.eventSchemas["set_multi"];
    if (schema === undefined) {
      throw new Error("no event schema for set_multi");
    }
    const decode = Schema.decodeUnknownSync(schema as Schema.Codec<Record<string, unknown>>);
    expect(decode({ _tag: "set_multi", flag: true })).toEqual({
      _tag: "set_multi",
      flag: true,
    });
    expect(() => decode({ _tag: "set_multi", flag: "true" })).toThrow();
  });

  it("no reachable state violates an invariant (bounded exploration + simulation)", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 30_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(500);
    assertReachable(report, "an option moved to list B", (s) => s["b0"] !== NO_ITEM);
    assertReachable(report, "a reordered list A", (s) => s["a0"] === 1n && s["a1"] === 0n);
    expect(simulate(model, { runs: 400, maxSteps: 100, seed: 5 }).violations).toEqual([]);
  }, 300_000);
});
