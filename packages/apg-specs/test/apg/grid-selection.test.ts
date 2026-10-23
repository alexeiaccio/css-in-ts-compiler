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
  stateKey,
  verifySpec,
} from "@quint-machine/core/testing";
import { describe, expect, it } from "vite-plus/test";
import { Schema } from "effect";
import definitionJson from "../../src/apg/grid-selection.model.generated.json";

// Spec-only verification for specs/apg/grid-selection.qnt (WAI-ARIA APG grid:
// cell / row / column selection).
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

const press = (state: QuintModelValue, key: string): QuintModelValue =>
  step(state, { _tag: "key", key });

const click = (state: QuintModelValue, cell: bigint): QuintModelValue =>
  step(state, { _tag: "click", cell });

const shiftClick = (state: QuintModelValue, cell: bigint): QuintModelValue =>
  step(state, { _tag: "shift_click", cell });

const focus = (row: bigint, col: bigint) => ({ row, col });
const anchor = (row: bigint, col: bigint) => ({
  anchorRow: row,
  anchorCol: col,
});
const rect = (r0: bigint, r1: bigint, c0: bigint, c1: bigint) => ({
  selR0: r0,
  selR1: r1,
  selC0: c0,
  selC1: c1,
});

const focused = step(model.initial, { _tag: "focus_in" });
// focus on (2,1), anchored there, no selection
const atCenter = click(model.initial, 7n);

describe("apg grid selection (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "FocusInBounds",
      "AnchorInBounds",
      "SelectionRectOrdered",
      "ActiveSelectionContainsFocus",
      "ActiveSelectionContainsAnchor",
      "InactiveSelectionCollapsed",
      "SelectionOnlyWhenSelectable",
      "FullWidthSelectionIsRowSelection",
      "FullHeightSelectionIsColumnSelection",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    expect(
      violatedInvariants(model, {
        ...model.initial,
        row: 9n,
        col: -2n,
        anchorRow: 4n,
        anchorCol: 3n,
      }),
    ).toEqual(["FocusInBounds", "AnchorInBounds", "InactiveSelectionCollapsed"]);

    // a reversed rectangle that excludes the focus and anchor
    expect(
      violatedInvariants(model, {
        ...model.initial,
        selActive: true,
        selR0: 3n,
        selR1: 1n,
        selC0: 1n,
        selC1: 1n,
      }),
    ).toEqual([
      "SelectionRectOrdered",
      "ActiveSelectionContainsFocus",
      "ActiveSelectionContainsAnchor",
    ]);

    // selection on a grid that does not support it
    expect(
      violatedInvariants(model, {
        ...model.initial,
        selActive: true,
        selectable: false,
      }),
    ).toEqual(["SelectionOnlyWhenSelectable"]);

    // an event committed while controlled: the state left the value prop behind
    expect(
      violatedInvariants(model, {
        ...model.initial,
        controlled: true,
        selActive: true,
        selR0: 0n,
        selR1: 0n,
        selC0: 0n,
        selC1: 0n,
        valueProp: 0n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the selection anyway
    expect(
      violatedInvariants(model, {
        ...model.initial,
        controlled: true,
        valueProp: 70n,
        outcome: "rejected",
        base: 0n,
        selActive: true,
        selR0: 1n,
        selR1: 1n,
        selC0: 1n,
        selC1: 1n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...model.initial,
        outcome: "accepted",
        requested: 0n,
        selActive: true,
        selR0: 0n,
        selR1: 1n,
        selC0: 0n,
        selC1: 0n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("starts selectable with nothing selected and no focus", () => {
    expect(model.initial).toMatchObject({
      ...focus(0n, 0n),
      ...anchor(0n, 0n),
      selActive: false,
      selectable: true,
      hasFocus: false,
    });
  });

  describe("Shift+Arrow extends from the anchor", () => {
    it("grows the rectangle one cell at a time", () => {
      const right = press(focused, "Shift+ArrowRight");
      expect(right).toMatchObject({
        ...focus(0n, 1n),
        ...anchor(0n, 0n),
        selActive: true,
        ...rect(0n, 0n, 0n, 1n),
      });
      expect(press(right, "Shift+ArrowDown")).toMatchObject({
        ...focus(1n, 1n),
        ...anchor(0n, 0n),
        selActive: true,
        ...rect(0n, 1n, 0n, 1n),
      });
    });

    it("shrinks again when the focus returns toward the anchor", () => {
      const grown = press(press(focused, "Shift+ArrowRight"), "Shift+ArrowRight");
      expect(grown).toMatchObject(rect(0n, 0n, 0n, 2n));
      expect(press(grown, "Shift+ArrowLeft")).toMatchObject({
        ...focus(0n, 1n),
        ...rect(0n, 0n, 0n, 1n),
      });
    });

    it("extends upward and leftward from a mid-grid anchor", () => {
      const up = press(atCenter, "Shift+ArrowUp");
      expect(up).toMatchObject({
        ...focus(1n, 1n),
        ...anchor(2n, 1n),
        ...rect(1n, 2n, 1n, 1n),
      });
      expect(press(up, "Shift+ArrowLeft")).toMatchObject({
        ...focus(1n, 0n),
        ...rect(1n, 2n, 0n, 1n),
      });
    });

    it("at the grid edge it still selects the focus cell", () => {
      expect(press(focused, "Shift+ArrowLeft")).toMatchObject({
        ...focus(0n, 0n),
        selActive: true,
        ...rect(0n, 0n, 0n, 0n),
      });
    });
  });

  describe("a plain move or click collapses the selection", () => {
    it("re-anchors on the new focus cell", () => {
      const extended = press(press(focused, "Shift+ArrowRight"), "Shift+ArrowDown");
      const moved = press(extended, "ArrowRight");
      expect(moved).toMatchObject({
        ...focus(1n, 2n),
        ...anchor(1n, 2n),
        selActive: false,
        ...rect(1n, 1n, 2n, 2n),
      });
      expect(click(extended, 0n)).toMatchObject({
        ...focus(0n, 0n),
        ...anchor(0n, 0n),
        selActive: false,
        ...rect(0n, 0n, 0n, 0n),
      });
    });

    it("Escape clears the selection and keeps focus", () => {
      const all = press(atCenter, "Control+a");
      expect(all).toMatchObject({ selActive: true, ...rect(0n, 3n, 0n, 2n) });
      expect(press(all, "Escape")).toMatchObject({
        ...focus(2n, 1n),
        ...anchor(2n, 1n),
        selActive: false,
        ...rect(2n, 2n, 1n, 1n),
      });
    });
  });

  describe("row / column / all selection keys", () => {
    it("Shift+Space selects the whole focused row", () => {
      expect(press(atCenter, "Shift+Space")).toMatchObject({
        ...focus(2n, 1n),
        ...anchor(2n, 1n),
        selActive: true,
        ...rect(2n, 2n, 0n, 2n),
      });
    });

    it("Control+Space selects the whole focused column", () => {
      expect(press(atCenter, "Control+Space")).toMatchObject({
        selActive: true,
        ...rect(0n, 3n, 1n, 1n),
      });
    });

    it("Control+A selects every cell", () => {
      expect(press(atCenter, "Control+a")).toMatchObject({
        selActive: true,
        ...rect(0n, 3n, 0n, 2n),
      });
    });

    it("Shift+Arrow after a row selection re-extends from the focus cell", () => {
      const row = press(atCenter, "Shift+Space");
      expect(press(row, "Shift+ArrowDown")).toMatchObject({
        ...focus(3n, 1n),
        ...anchor(2n, 1n),
        ...rect(2n, 3n, 1n, 1n),
      });
    });
  });

  describe("Shift+click extends from the anchor", () => {
    it("selects the box between the anchor and the clicked cell", () => {
      const first = click(model.initial, 0n);
      const extended = shiftClick(first, 7n);
      expect(extended).toMatchObject({
        ...focus(2n, 1n),
        ...anchor(0n, 0n),
        selActive: true,
        ...rect(0n, 2n, 0n, 1n),
      });
      // the anchor stays: a second Shift+click re-targets the same box origin
      expect(shiftClick(extended, 3n)).toMatchObject({
        ...focus(1n, 0n),
        ...anchor(0n, 0n),
        ...rect(0n, 1n, 0n, 0n),
      });
    });

    it("works backwards from the bottom-right anchor", () => {
      const extended = shiftClick(click(model.initial, 11n), 0n);
      expect(extended).toMatchObject({
        ...focus(0n, 0n),
        ...anchor(3n, 2n),
        ...rect(0n, 3n, 0n, 2n),
      });
    });
  });

  describe("a grid that is not selectable", () => {
    const plain = step(focused, { _tag: "set_selectable", flag: false });

    it("treats Shift+Arrow as a plain move and ignores selection keys", () => {
      const moved = press(plain, "Shift+ArrowRight");
      expect(moved).toMatchObject({
        ...focus(0n, 1n),
        ...anchor(0n, 1n),
        selActive: false,
      });
      expect(press(plain, "Control+a")).toEqual(plain);
      expect(press(plain, "Shift+Space")).toEqual(plain);
      expect(press(plain, "Control+Space")).toEqual(plain);
    });

    it("Shift+click degrades to a click", () => {
      expect(shiftClick(plain, 7n)).toMatchObject({
        ...focus(2n, 1n),
        ...anchor(2n, 1n),
        selActive: false,
        ...rect(2n, 2n, 1n, 1n),
      });
    });

    it("turning selection off clears an existing selection", () => {
      const all = press(focused, "Control+a");
      expect(all).toMatchObject({ selActive: true });
      expect(step(all, { _tag: "set_selectable", flag: false })).toMatchObject({
        selActive: false,
        selectable: false,
        ...anchor(0n, 0n),
        ...rect(0n, 0n, 0n, 0n),
      });
      // turning it back on keeps an empty selection
      expect(step(plain, { _tag: "set_selectable", flag: true })).toMatchObject({
        selActive: false,
        selectable: true,
      });
    });
  });

  describe("DOM focus gates the keyboard", () => {
    it("ignores keys while the grid has no focus", () => {
      expect(press(model.initial, "Shift+ArrowRight")).toEqual(model.initial);
      expect(press(model.initial, "Control+a")).toEqual(model.initial);
    });

    it("blur keeps the selection but stops the keys", () => {
      const all = press(focused, "Control+a");
      const blurred = step(all, { _tag: "focus_out" });
      expect(blurred).toMatchObject({
        hasFocus: false,
        selActive: true,
        ...rect(0n, 3n, 0n, 2n),
      });
      expect(press(blurred, "Escape")).toEqual(blurred);
      expect(step(blurred, { _tag: "focus_in" })).toEqual(all);
    });
  });

  it("uncontrolled, every selection request is accepted and commits its intent", () => {
    const extended = press(focused, "Shift+ArrowRight");
    expect(extended).toMatchObject({
      selActive: true,
      ...rect(0n, 0n, 0n, 1n),
      outcome: "accepted",
      requested: 49n,
      base: 0n,
      requests: 1n,
    });
    // a plain arrow collapses the active selection: a request to nothing
    expect(press(extended, "ArrowRight")).toMatchObject({
      selActive: false,
      outcome: "accepted",
      requested: 0n,
      requests: 2n,
    });
    // host-side commits are inert without a controlled value
    expect(model.transition(extended, { _tag: "setValue", v: 0n })).toEqual(extended);
  });

  it("controlled, a rejected request leaves the selection untouched", () => {
    const controlled = step(focused, { _tag: "control" });
    const requested = press(controlled, "Shift+ArrowRight");
    expect(requested).toMatchObject({
      ...focus(0n, 1n),
      selActive: false,
      valueProp: 0n,
      outcome: "rejected",
      requested: 49n,
      base: 0n,
      requests: 1n,
    });
    // only a host write commits while controlled
    expect(step(requested, { _tag: "setValue", v: 49n })).toMatchObject({
      selActive: true,
      ...rect(0n, 0n, 0n, 1n),
      valueProp: 49n,
      outcome: "none",
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = step(step(focused, { _tag: "control" }), {
      _tag: "acceptRequests",
    });
    const extended = press(host, "Shift+ArrowRight");
    expect(extended).toMatchObject({
      selActive: true,
      ...rect(0n, 0n, 0n, 1n),
      valueProp: 49n,
      outcome: "accepted",
      requests: 1n,
    });
  });

  it("controlled, a click that would clear a held selection is rejected", () => {
    const held = step(step(focused, { _tag: "control" }), {
      _tag: "setValue",
      v: 49n,
    });
    const clicked = click(held, 5n);
    expect(clicked).toMatchObject({
      selActive: true,
      ...rect(0n, 0n, 0n, 1n),
      valueProp: 49n,
      outcome: "rejected",
      requested: 0n,
      requests: 1n,
    });
  });

  it("exposes typed event schemas for the key and cell pools", () => {
    const decodeKey = Schema.decodeUnknownSync(
      model.eventSchemas["key"] as Schema.Codec<Record<string, unknown>>,
    );
    expect(decodeKey({ _tag: "key", key: "Shift+Space" })).toEqual({
      _tag: "key",
      key: "Shift+Space",
    });
    expect(() => decodeKey({ _tag: "key", key: true })).toThrow();

    const decodeShiftClick = Schema.decodeUnknownSync(
      model.eventSchemas["shift_click"] as Schema.Codec<Record<string, unknown>>,
    );
    expect(decodeShiftClick({ _tag: "shift_click", cell: 3n })).toEqual({
      _tag: "shift_click",
      cell: 3n,
    });
    expect(() => decodeShiftClick({ _tag: "shift_click", cell: "a" })).toThrow();
  });

  it("derives the key alphabet and cell pools from the spec", () => {
    const events = eventsOf(model);
    expect(events.filter((event) => event._tag === "key")).toHaveLength(12);
    expect(events.filter((event) => event._tag === "click")).toHaveLength(12);
    expect(events.filter((event) => event._tag === "shift_click")).toHaveLength(12);
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 4, maxStates: 30_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(300);

    assertReachable(report, "the whole grid is selected", (s) => {
      return (
        s["selActive"] === true &&
        s["selR0"] === 0n &&
        s["selR1"] === 3n &&
        s["selC0"] === 0n &&
        s["selC1"] === 2n
      );
    });
    assertReachable(report, "a single column is selected", (s) => {
      return (
        s["selActive"] === true &&
        s["selR0"] === 0n &&
        s["selR1"] === 3n &&
        s["selC0"] === s["selC1"]
      );
    });
    assertUnreachable(report, "a selection on a non-selectable grid", (s) => {
      return s["selActive"] === true && s["selectable"] === false && s["controlled"] === false;
    });
  });

  it("random walks over every derived event keep all invariants", () => {
    const verification = verifySpec(model, {
      maxDepth: 3,
      maxStates: 10_000,
      runs: 50,
      maxSteps: 120,
      seed: 11,
    });
    expect(verification.simulation.violations).toEqual([]);
  });
});
