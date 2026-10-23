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
import definitionJson from "../../src/apg/grid.model.generated.json";

// Spec-only verification for specs/apg/grid.qnt (WAI-ARIA APG grid: roving
// focus, navigation, wrap, edit mode).
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

const run = (start: QuintModelValue, events: readonly Record<string, unknown>[]): QuintModelValue =>
  events.reduce(step, start);

const press = (state: QuintModelValue, key: string): QuintModelValue =>
  step(state, { _tag: "key", key });

const pressAll = (start: QuintModelValue, keys: readonly string[]): QuintModelValue =>
  keys.reduce(press, start);

const click = (state: QuintModelValue, cell: bigint): QuintModelValue =>
  step(state, { _tag: "click", cell });

const at = (row: bigint, col: bigint) => ({ row, col });

const focused = step(model.initial, { _tag: "focus_in" });

// a layout grid with both wrap flags on, focused at (0,0)
const wrapping = run(model.initial, [
  { _tag: "set_kind", choice: "layout" },
  { _tag: "set_wrap_cols", flag: true },
  { _tag: "set_wrap_rows", flag: true },
  { _tag: "focus_in" },
]);

describe("apg grid (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "FocusInBounds",
      "ExactlyOneTabStop",
      "AriaIndicesInRange",
      "ModeValid",
      "KindValid",
      "FocusTargetValid",
      "LastEditValid",
      "EditImpliesFocus",
      "EditOnEditableCell",
      "DirtyImpliesEdit",
      "DataGridNeverWraps",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    expect(
      violatedInvariants(model, {
        row: 4n,
        col: -1n,
        hasFocus: false,
        mode: "zombie",
        dirty: true,
        lastEdit: "lost",
        gridKind: "table",
        wrapCols: true,
        wrapRows: false,
        focusTarget: "both",
        gridReadonly: true,
      }),
    ).toEqual([
      "FocusInBounds",
      "ExactlyOneTabStop",
      "AriaIndicesInRange",
      "ModeValid",
      "KindValid",
      "FocusTargetValid",
      "LastEditValid",
      "DirtyImpliesEdit",
      "DataGridNeverWraps",
    ]);

    expect(
      violatedInvariants(model, {
        ...model.initial,
        mode: "edit",
        hasFocus: false,
      }),
    ).toEqual(["EditImpliesFocus"]);

    // the read-only last column cannot be in edit mode
    expect(
      violatedInvariants(model, {
        ...model.initial,
        col: 2n,
        mode: "edit",
        hasFocus: true,
      }),
    ).toEqual(["EditOnEditableCell"]);
  });

  it("starts as a data grid with one roving tab stop and no focus", () => {
    expect(model.initial).toMatchObject({
      ...at(0n, 0n),
      hasFocus: false,
      mode: "navigate",
      gridKind: "data",
      wrapCols: false,
      wrapRows: false,
      focusTarget: "cell",
    });
  });

  it("ignores keys while DOM focus is outside the grid", () => {
    const state = press(model.initial, "ArrowRight");
    expect(state).toEqual(model.initial);
    expect(press(state, "Enter")).toEqual(model.initial);
  });

  it("focus_in keeps the roving tab stop where it was left", () => {
    const moved = pressAll(focused, ["ArrowRight", "ArrowDown"]);
    const left = step(moved, { _tag: "focus_out" });
    expect(left).toMatchObject({ ...at(1n, 1n), hasFocus: false });
    expect(step(left, { _tag: "focus_in" })).toMatchObject({
      ...at(1n, 1n),
      hasFocus: true,
    });
  });

  describe("data grid navigation (no wrapping)", () => {
    it("arrows stop at every edge", () => {
      expect(press(focused, "ArrowLeft")).toMatchObject(at(0n, 0n));
      expect(press(focused, "ArrowUp")).toMatchObject(at(0n, 0n));
      expect(pressAll(focused, ["ArrowRight", "ArrowRight"])).toMatchObject(at(0n, 2n));
      expect(pressAll(focused, ["ArrowRight", "ArrowRight", "ArrowRight"])).toMatchObject(
        at(0n, 2n),
      );
      expect(pressAll(focused, ["ArrowDown", "ArrowDown", "ArrowDown"])).toMatchObject(at(3n, 0n));
      expect(pressAll(focused, ["ArrowDown", "ArrowDown", "ArrowDown", "ArrowDown"])).toMatchObject(
        at(3n, 0n),
      );
    });

    it("Home/End jump within the row, Control+Home/End within the grid", () => {
      const middle = pressAll(focused, ["ArrowDown", "ArrowRight"]);
      expect(press(middle, "Home")).toMatchObject(at(1n, 0n));
      expect(press(middle, "End")).toMatchObject(at(1n, 2n));
      expect(press(middle, "Control+Home")).toMatchObject(at(0n, 0n));
      expect(press(middle, "Control+End")).toMatchObject(at(3n, 2n));
    });

    it("PageDown/PageUp move PAGE rows, clamp at the ends and keep the column", () => {
      const start = press(focused, "ArrowRight");
      const down1 = press(start, "PageDown");
      expect(down1).toMatchObject(at(2n, 1n));
      const down2 = press(down1, "PageDown");
      expect(down2).toMatchObject(at(3n, 1n));
      expect(press(down2, "PageDown")).toMatchObject(at(3n, 1n));

      const up1 = press(down2, "PageUp");
      expect(up1).toMatchObject(at(1n, 1n));
      const up2 = press(up1, "PageUp");
      expect(up2).toMatchObject(at(0n, 1n));
      expect(press(up2, "PageUp")).toMatchObject(at(0n, 1n));
    });

    it("a click moves the roving tab stop and focus to that cell", () => {
      expect(click(model.initial, 7n)).toMatchObject({
        ...at(2n, 1n),
        hasFocus: true,
      });
      expect(click(focused, 11n)).toMatchObject(at(3n, 2n));
    });
  });

  describe("layout grid wrapping", () => {
    it("Right/Left wrap across row boundaries and stop at the grid corners", () => {
      const endOfRow = press(wrapping, "End");
      expect(endOfRow).toMatchObject(at(0n, 2n));
      expect(press(endOfRow, "ArrowRight")).toMatchObject(at(1n, 0n));
      expect(press(press(endOfRow, "ArrowRight"), "ArrowLeft")).toMatchObject(at(0n, 2n));

      expect(press(wrapping, "ArrowLeft")).toMatchObject(at(0n, 0n));
      const last = press(wrapping, "Control+End");
      expect(press(last, "ArrowRight")).toMatchObject(at(3n, 2n));
    });

    it("Down/Up wrap across column boundaries and stop at the grid corners", () => {
      const bottomLeft = click(wrapping, 9n);
      expect(bottomLeft).toMatchObject(at(3n, 0n));
      const topNext = press(bottomLeft, "ArrowDown");
      expect(topNext).toMatchObject(at(0n, 1n));
      expect(press(topNext, "ArrowUp")).toMatchObject(at(3n, 0n));

      expect(press(wrapping, "ArrowUp")).toMatchObject(at(0n, 0n));
      const last = press(wrapping, "Control+End");
      expect(press(last, "ArrowDown")).toMatchObject(at(3n, 2n));
    });

    it("wrapping is independent per axis", () => {
      const colsOnly = run(model.initial, [
        { _tag: "set_kind", choice: "layout" },
        { _tag: "set_wrap_cols", flag: true },
        { _tag: "focus_in" },
      ]);
      expect(press(press(colsOnly, "End"), "ArrowRight")).toMatchObject(at(1n, 0n));
      const bottom = click(colsOnly, 9n);
      expect(press(bottom, "ArrowDown")).toMatchObject(at(3n, 0n));
    });

    it("a data grid never wraps: switching kind clears, wrap props are ignored", () => {
      const data = step(wrapping, { _tag: "set_kind", choice: "data" });
      expect(data).toMatchObject({
        gridKind: "data",
        wrapCols: false,
        wrapRows: false,
      });
      expect(step(data, { _tag: "set_wrap_cols", flag: true })).toMatchObject({
        wrapCols: false,
      });
      expect(step(data, { _tag: "set_wrap_rows", flag: true })).toMatchObject({
        wrapRows: false,
      });
    });
  });

  describe("cell edit mode", () => {
    it("Enter starts editing, arrows are frozen, Enter commits", () => {
      const editing = press(focused, "Enter");
      expect(editing).toMatchObject({
        mode: "edit",
        dirty: false,
        ...at(0n, 0n),
      });
      expect(
        pressAll(editing, ["ArrowRight", "ArrowDown", "End", "PageDown", "Control+End"]),
      ).toEqual(editing);

      const typed = press(editing, "a");
      expect(typed).toMatchObject({ mode: "edit", dirty: true });

      expect(press(typed, "Enter")).toMatchObject({
        mode: "navigate",
        dirty: false,
        lastEdit: "committed",
        ...at(0n, 0n),
      });
    });

    it("F2 toggles edit mode and commits", () => {
      const editing = press(focused, "F2");
      expect(editing).toMatchObject({ mode: "edit" });
      expect(press(editing, "F2")).toMatchObject({
        mode: "navigate",
        lastEdit: "committed",
      });
    });

    it("Escape cancels the draft and restores navigation", () => {
      const typed = pressAll(focused, ["Enter", "a"]);
      expect(typed).toMatchObject({ dirty: true });
      const cancelled = press(typed, "Escape");
      expect(cancelled).toMatchObject({
        mode: "navigate",
        dirty: false,
        lastEdit: "cancelled",
      });
      // grid navigation works again
      expect(press(cancelled, "ArrowRight")).toMatchObject(at(0n, 1n));
    });

    it("a printable key starts editing with a draft; Escape in navigation is a no-op", () => {
      expect(press(focused, "a")).toMatchObject({ mode: "edit", dirty: true });
      expect(press(focused, "Escape")).toEqual(focused);
    });

    it("read-only cells and read-only grids never enter edit mode", () => {
      const readonlyColumn = click(focused, 2n);
      expect(readonlyColumn).toMatchObject(at(0n, 2n));
      expect(press(readonlyColumn, "Enter")).toEqual(readonlyColumn);
      expect(press(readonlyColumn, "a")).toEqual(readonlyColumn);

      const readonlyGrid = step(focused, { _tag: "set_readonly", flag: true });
      expect(press(readonlyGrid, "Enter")).toEqual(readonlyGrid);
      expect(press(readonlyGrid, "F2")).toEqual(readonlyGrid);
    });

    it("making the grid read-only cancels a running edit", () => {
      const typed = pressAll(focused, ["Enter", "a"]);
      expect(step(typed, { _tag: "set_readonly", flag: true })).toMatchObject({
        mode: "navigate",
        dirty: false,
        lastEdit: "cancelled",
        gridReadonly: true,
      });
      // switching read-only off mid-edit leaves the edit alone
      expect(step(typed, { _tag: "set_readonly", flag: false })).toMatchObject({
        mode: "edit",
        dirty: true,
      });
    });

    it("blur commits an edit; the focus return lands on the same cell", () => {
      const typed = pressAll(focused, ["ArrowRight", "Enter", "a"]);
      const blurred = step(typed, { _tag: "focus_out" });
      expect(blurred).toMatchObject({
        mode: "navigate",
        dirty: false,
        lastEdit: "committed",
        hasFocus: false,
        ...at(0n, 1n),
      });
      expect(step(blurred, { _tag: "focus_in" })).toMatchObject(at(0n, 1n));
    });

    it("clicking another cell commits; clicking the edited cell keeps editing", () => {
      const typed = pressAll(focused, ["Enter", "a"]);
      expect(click(typed, 0n)).toMatchObject({ mode: "edit", dirty: true });
      expect(click(typed, 4n)).toMatchObject({
        mode: "navigate",
        dirty: false,
        lastEdit: "committed",
        ...at(1n, 1n),
      });
    });

    it("Tab leaves the grid in navigation mode; inside edit mode it is a no-op", () => {
      const left = press(focused, "Tab");
      expect(left).toMatchObject({ hasFocus: false, ...at(0n, 0n) });
      // the grid no longer receives keys
      expect(press(left, "ArrowRight")).toEqual(left);
      expect(press(press(focused, "ArrowRight"), "Shift+Tab")).toMatchObject({
        hasFocus: false,
        ...at(0n, 1n),
      });

      const editing = press(focused, "Enter");
      expect(press(editing, "Tab")).toEqual(editing);
      expect(press(editing, "Shift+Tab")).toEqual(editing);
    });
  });

  it("keeps exactly one tab stop when the focus target flips to the widget", () => {
    const widget = step(focused, {
      _tag: "set_focus_target",
      choice: "widget",
    });
    expect(widget).toMatchObject({ focusTarget: "widget" });
    expect(press(widget, "ArrowRight")).toMatchObject(at(0n, 1n));
    expect(step(widget, { _tag: "set_focus_target", choice: "cell" })).toMatchObject({
      focusTarget: "cell",
    });
  });

  it("exposes typed event schemas for the key and click pools", () => {
    const decodeKey = Schema.decodeUnknownSync(
      model.eventSchemas["key"] as Schema.Codec<Record<string, unknown>>,
    );
    expect(decodeKey({ _tag: "key", key: "Home" })).toEqual({
      _tag: "key",
      key: "Home",
    });
    expect(() => decodeKey({ _tag: "key", key: 7 })).toThrow();

    const decodeClick = Schema.decodeUnknownSync(
      model.eventSchemas["click"] as Schema.Codec<Record<string, unknown>>,
    );
    expect(decodeClick({ _tag: "click", cell: 5n })).toEqual({
      _tag: "click",
      cell: 5n,
    });
    expect(() => decodeClick({ _tag: "click", cell: "x" })).toThrow();
  });

  it("derives the key alphabet and cell pool from the spec", () => {
    const events = eventsOf(model);
    expect(events.filter((event) => event._tag === "key")).toHaveLength(16);
    expect(events.filter((event) => event._tag === "click")).toHaveLength(12);
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 4, maxStates: 30_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(500);

    assertReachable(report, "a cell in the last row/column is focused", (s) => {
      return s["row"] === 3n && s["col"] === 2n;
    });
    assertReachable(report, "a dirty edit is in progress", (s) => {
      return s["mode"] === "edit" && s["dirty"] === true;
    });
    assertReachable(report, "focus wrapped to the next row", (s) => {
      return s["wrapCols"] === true && s["row"] === 1n && s["col"] === 0n;
    });
    assertUnreachable(report, "a data grid that wraps", (s) => {
      return s["gridKind"] === "data" && s["wrapCols"] === true;
    });
    assertUnreachable(report, "editing the read-only column", (s) => {
      return s["mode"] === "edit" && s["col"] === 2n;
    });
  });

  it("random walks over every derived event keep all invariants", () => {
    const verification = verifySpec(model, {
      maxDepth: 3,
      maxStates: 10_000,
      runs: 50,
      maxSteps: 120,
      seed: 7,
    });
    expect(verification.simulation.violations).toEqual([]);
    expect(verification.events.length).toBeGreaterThan(30);
  });
});
