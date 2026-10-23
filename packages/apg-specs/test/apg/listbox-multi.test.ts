import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { assertReachable, explore, simulate, stateKey } from "@quint-machine/core/testing";
import { describe, expect, it } from "vite-plus/test";
import { Schema } from "effect";
import definitionJson from "../../src/apg/listbox-multi.model.generated.json";

// Spec-only verification for specs/apg/listbox-multi.qnt: the APG multi-select
// listbox under BOTH selection models (recommended: no modifier needed;
// alternative: moving focus collapses the selection). The shared harness
// derives the event alphabet from the spec's own pools and checks every
// declared invariant after every step.

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
const keys = (...tags: string[]) => tags.map(key);
const click = (index: bigint) => ({ _tag: "click", index });
const useModel = (name: "recommended" | "alternative") => ({
  _tag: "set_selection_model",
  model: name,
});

const recommended = run(initial, keys("focus_in"));
const alternative = run(initial, [useModel("alternative"), key("focus_in")]);
const NO_OPTION = 5n;

describe("apg listbox multi-select (spec-only)", () => {
  // every var the spec owns, at its init value (focused variant used below).
  const clean = {
    hasFocus: true,
    active: 0n,
    selected: 0n,
    anchor: NO_OPTION,
    selectionModel: "recommended",
    lastOp: "none",
    controlled: false,
    accepting: false,
    valueProp0: false,
    valueProp1: false,
    valueProp2: false,
    valueProp3: false,
    valueProp4: false,
    requested: 0n,
    outcome: "none",
    base: 0n,
    requests: 0n,
  };

  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "SelectionInRange",
      "ActiveInRange",
      "ActiveDescendantTracksFocus",
      "AriaMultiselectableTrue",
      "AnchorSelectedOrNone",
      "SelectionModelKnown",
      "AlternativeMoveCollapses",
      "AlternativeClickCollapses",
      "RangeSelectsAnchorToActive",
      "RangeToEdgeSelectsEdge",
      "SelectAllOutcome",
      "LastOpKnown",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    expect(violatedInvariants(model, { ...clean, selected: 99n })).toContain("SelectionInRange");
    expect(violatedInvariants(model, { ...clean, active: 7n })).toContain("ActiveInRange");
    // the anchor points at an option that is not selected
    expect(violatedInvariants(model, { ...clean, anchor: 2n })).toEqual(["AnchorSelectedOrNone"]);
    expect(violatedInvariants(model, { ...clean, selectionModel: "both" })).toEqual([
      "SelectionModelKnown",
    ]);
    // alternative model: a plain move left two options selected
    expect(
      violatedInvariants(model, {
        ...clean,
        selectionModel: "alternative",
        selected: 3n,
        lastOp: "move",
      }),
    ).toEqual(["AlternativeMoveCollapses"]);
    // Shift+Space left a hole between the anchor and the active option
    expect(
      violatedInvariants(model, {
        ...clean,
        active: 3n,
        selected: 9n,
        anchor: 0n,
        lastOp: "range",
      }),
    ).toEqual(["RangeSelectsAnchorToActive"]);
    // Ctrl+A claimed to select all but did not
    expect(
      violatedInvariants(model, {
        ...clean,
        selected: 7n,
        lastOp: "select_all",
      }),
    ).toEqual(["SelectAllOutcome"]);
    // a commit left the selection off the controlled value prop
    expect(violatedInvariants(model, { ...clean, controlled: true, selected: 1n })).toEqual([
      "ControlledFollowsProp",
    ]);
    // a rejected request that moved the selection anyway
    expect(
      violatedInvariants(model, {
        ...clean,
        controlled: true,
        valueProp0: true,
        selected: 1n,
        outcome: "rejected",
        base: 0n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...clean,
        controlled: true,
        valueProp0: true,
        selected: 1n,
        outcome: "accepted",
        requested: 2n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
    expect(violatedInvariants(model, { ...clean, requests: -1n })).toEqual(["RequestsNonNegative"]);
  });

  it("starts unfocused, empty, with the recommended model", () => {
    expect(initial).toEqual({ ...clean, hasFocus: false });
  });

  it("Tab entry: first option when nothing is selected, no selection change", () => {
    expect(recommended).toMatchObject({
      hasFocus: true,
      active: 0n,
      selected: 0n,
    });
  });

  it("Tab entry: focus lands on the FIRST selected option", () => {
    const state = run(initial, [click(3n), click(1n), ...keys("blur", "focus_in")]);
    expect(state).toMatchObject({ active: 1n, selected: 10n });
  });

  describe("recommended model", () => {
    it("plain arrows, Home and End move focus and never touch the selection", () => {
      const selected = run(recommended, keys("space"));
      const moved = run(selected, keys("arrow_down", "arrow_down"));
      expect(moved).toMatchObject({ active: 2n, selected: 1n });
      expect(run(moved, keys("end"))).toMatchObject({
        active: 4n,
        selected: 1n,
      });
      expect(run(moved, keys("home", "arrow_up"))).toMatchObject({
        active: 0n,
        selected: 1n,
      });
    });

    it("Space toggles the focused option on and off", () => {
      const on = step(recommended, key("space"));
      expect(on).toMatchObject({ selected: 1n, anchor: 0n });
      const off = step(on, key("space"));
      expect(off).toMatchObject({ selected: 0n, anchor: NO_OPTION });
    });

    it("Shift+Down / Shift+Up move focus and toggle the entered option", () => {
      const down = run(recommended, keys("shift_arrow_down", "shift_arrow_down"));
      expect(down).toMatchObject({ active: 2n, selected: 6n, anchor: 2n });
      // Shift+Up from option 2 toggles option 1 (selected -> unselected)
      const up = step(down, key("shift_arrow_up"));
      expect(up).toMatchObject({ active: 1n, selected: 4n, anchor: 2n });
    });

    it("Shift+Arrow at an edge neither moves nor toggles", () => {
      expect(step(recommended, key("shift_arrow_up"))).toEqual(recommended);
      const last = step(recommended, key("end"));
      expect(step(last, key("shift_arrow_down"))).toEqual(last);
    });

    it("Shift+Space selects from the most recently selected option to the focused one", () => {
      const state = run(recommended, [
        ...keys("arrow_down", "space", "arrow_down", "arrow_down", "arrow_down"),
        key("shift_space"),
      ]);
      // anchor 1, focus 4 -> options 1..4
      expect(state).toMatchObject({ active: 4n, selected: 30n, anchor: 1n });
      // and upward
      const upward = run(recommended, [
        ...keys("end", "space", "arrow_up", "arrow_up"),
        key("shift_space"),
      ]);
      expect(upward).toMatchObject({ active: 2n, selected: 28n, anchor: 4n });
    });

    it("Shift+Space with nothing selected selects only the focused option", () => {
      const state = run(recommended, keys("arrow_down", "shift_space"));
      expect(state).toMatchObject({ selected: 2n, anchor: 1n });
    });

    it("Ctrl+Shift+Home / End select to the edge and move focus there", () => {
      const atTwo = run(recommended, keys("arrow_down", "arrow_down"));
      const home = step(atTwo, key("ctrl_shift_home"));
      expect(home).toMatchObject({ active: 0n, selected: 7n });
      const end = step(atTwo, key("ctrl_shift_end"));
      expect(end).toMatchObject({ active: 4n, selected: 28n });
    });

    it("Ctrl+A selects all, and unselects all when all are selected", () => {
      const all = step(recommended, key("ctrl_a"));
      expect(all).toMatchObject({ selected: 31n, active: 0n });
      const none = step(all, key("ctrl_a"));
      expect(none).toMatchObject({ selected: 0n, anchor: NO_OPTION });
    });

    it("a click toggles the clicked option and focuses it", () => {
      const state = run(initial, [click(2n), click(4n), click(2n)]);
      expect(state).toMatchObject({ active: 2n, selected: 16n, anchor: 4n });
    });

    it("Ctrl+Arrow and Ctrl+Space are not handled", () => {
      const state = run(recommended, keys("space", "arrow_down"));
      for (const tag of ["ctrl_arrow_down", "ctrl_arrow_up", "ctrl_space"]) {
        expect(step(state, key(tag))).toEqual(state);
      }
    });
  });

  describe("alternative model", () => {
    it("plain arrows, Home and End move focus and collapse the selection to it", () => {
      const spread = run(alternative, keys("ctrl_a"));
      expect(spread).toMatchObject({ selected: 31n });
      const down = step(spread, key("arrow_down"));
      expect(down).toMatchObject({ active: 1n, selected: 2n, anchor: 1n });
      expect(step(down, key("end"))).toMatchObject({
        active: 4n,
        selected: 16n,
      });
      expect(run(down, keys("home"))).toMatchObject({
        active: 0n,
        selected: 1n,
      });
    });

    it("Ctrl+Arrow moves focus without changing the selection", () => {
      const state = run(alternative, keys("arrow_down", "ctrl_arrow_down", "ctrl_arrow_down"));
      expect(state).toMatchObject({ active: 3n, selected: 2n });
      expect(step(state, key("ctrl_arrow_up"))).toMatchObject({
        active: 2n,
        selected: 2n,
      });
    });

    it("Ctrl+Space toggles; plain Space is not handled", () => {
      const moved = run(alternative, keys("ctrl_arrow_down", "ctrl_space"));
      expect(moved).toMatchObject({ active: 1n, selected: 2n });
      expect(step(moved, key("space"))).toEqual(moved);
      expect(step(moved, key("ctrl_space"))).toMatchObject({ selected: 0n });
    });

    it("Shift+Arrow adds to the selection; a later plain move drops it again", () => {
      const state = run(alternative, keys("shift_arrow_down", "shift_arrow_down"));
      expect(state).toMatchObject({ active: 2n, selected: 6n });
      expect(step(state, key("arrow_down"))).toMatchObject({
        active: 3n,
        selected: 8n,
      });
    });

    it("a click selects only the clicked option", () => {
      const state = run(alternative, [...keys("ctrl_a"), click(3n)]);
      expect(state).toMatchObject({ active: 3n, selected: 8n, anchor: 3n });
    });
  });

  it("keys do nothing while the listbox is not focused", () => {
    const tags = [
      "arrow_down",
      "arrow_up",
      "home",
      "end",
      "space",
      "ctrl_space",
      "shift_arrow_down",
      "shift_arrow_up",
      "ctrl_arrow_down",
      "ctrl_arrow_up",
      "shift_space",
      "ctrl_shift_home",
      "ctrl_shift_end",
      "ctrl_a",
    ];
    for (const tag of tags) {
      expect(step(initial, key(tag))).toEqual(initial);
    }
  });

  it("switching the selection model keeps the selection", () => {
    const spread = run(recommended, keys("arrow_down", "space", "arrow_down", "space"));
    const switched = step(spread, useModel("alternative"));
    expect(switched).toMatchObject({
      selected: spread["selected"],
      selectionModel: "alternative",
      lastOp: "config",
    });
  });

  it("exposes a typed event schema for the model pool", () => {
    const schema = model.eventSchemas["set_selection_model"];
    if (schema === undefined) {
      throw new Error("no event schema for set_selection_model");
    }
    const decode = Schema.decodeUnknownSync(schema as Schema.Codec<Record<string, unknown>>);
    expect(decode({ _tag: "set_selection_model", model: "alternative" })).toEqual({
      _tag: "set_selection_model",
      model: "alternative",
    });
    expect(() => decode({ _tag: "set_selection_model", model: 1n })).toThrow();
  });

  it("no reachable state violates an invariant (bounded exploration + simulation)", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 30_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(200);
    assertReachable(report, "every option selected", (s) => s["selected"] === 31n);
    assertReachable(
      report,
      "a non-contiguous selection under the recommended model",
      (s) => s["selectionModel"] === "recommended" && s["selected"] === 5n,
    );
    expect(simulate(model, { runs: 300, maxSteps: 80, seed: 11 }).violations).toEqual([]);
  }, 300_000);
});
