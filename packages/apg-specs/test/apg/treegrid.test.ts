import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { Schema } from "effect";
import definitionJson from "../../src/apg/treegrid.model.generated.json";
import { simulate } from "@quint-machine/core/testing";

// Spec-only verification for specs/apg/treegrid.qnt: the APG treegrid (e-mail
// inbox example) - row focus vs cell focus, expand / collapse with Right / Left,
// navigation over visible rows, Home / End, Ctrl+Home / Ctrl+End, the three
// navigation models and the single / multi selection variants. The shared
// harness derives the event alphabet from the spec's own pools and checks every
// declared invariant after every step.
//
// Tree (row: parent): 0: -, 1: 0, 2: 0, 3: 2, 4: -, 5: 4, 6: 4. Parent rows
// are 0, 2 and 4; selMask bit r = row r is selected.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const press = (state: QuintModelValue, ...tags: string[]): QuintModelValue =>
  tags.reduce<QuintModelValue>((current, tag) => step(current, { _tag: tag }), state);

const configureNav = (nav: string): QuintModelValue =>
  step(model.initial, { _tag: "configureNav", nav });

const configureSel = (sel: string): QuintModelValue =>
  step(model.initial, { _tag: "configureSel", sel });

const toggleRow = (state: QuintModelValue, r: bigint): QuintModelValue =>
  step(state, { _tag: "toggleRow", r });

const clickCell = (state: QuintModelValue, cell: bigint): QuintModelValue =>
  step(state, { _tag: "clickCell", cell });

const initial = model.initial;
const focused = press(initial, "focusIn");

describe("apg treegrid (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "FocusedRowVisible",
      "ExactlyOneTabStop",
      "PositionInRange",
      "RowFocusHasNoColumn",
      "KindKnown",
      "CellsOnlyNeverFocusesRow",
      "TopLevelAlwaysVisible",
      "AriaExpandedMirrorsChildren",
      "AriaContractWellFormed",
      "SelectionInRange",
      "SingleSelectAtMostOne",
      "SingleSelectFollowsFocus",
      "SingleSelectedWhenFocused",
      "ModesKnown",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    // focus inside a collapsed subtree: no rendered tab stop
    expect(violatedInvariants(model, { ...initial, frow: 1n })).toEqual([
      "FocusedRowVisible",
      "ExactlyOneTabStop",
    ]);
    expect(violatedInvariants(model, { ...initial, fcol: 1n })).toEqual(["RowFocusHasNoColumn"]);
    expect(violatedInvariants(model, { ...initial, frow: 7n })).toContain("PositionInRange");
    expect(violatedInvariants(model, { ...initial, kind: "tab" })).toContain("KindKnown");
    expect(violatedInvariants(model, { ...initial, navModel: "cellsOnly" })).toEqual([
      "CellsOnlyNeverFocusesRow",
    ]);
    expect(violatedInvariants(model, { ...initial, selMask: 3n })).toEqual([
      "SingleSelectAtMostOne",
      "SingleSelectFollowsFocus",
    ]);
    expect(violatedInvariants(model, { ...initial, selMask: 128n })).toContain("SelectionInRange");
    expect(violatedInvariants(model, { ...initial, inGrid: true })).toEqual([
      "SingleSelectedWhenFocused",
    ]);
    expect(violatedInvariants(model, { ...initial, selMode: "multi", selMask: 3n })).toEqual([]);
    expect(violatedInvariants(model, { ...initial, navModel: "x" })).toEqual(["ModesKnown"]);
    // an event committed while controlled: the selection left the value prop behind
    expect(
      violatedInvariants(model, {
        ...initial,
        controlled: true,
        valueProp0: false,
        selMask: 1n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the selection anyway
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "rejected",
        base: 0n,
        selMask: 1n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "accepted",
        requested: 0n,
        selMask: 1n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("starts rows-first, collapsed, single-select, focus outside the grid", () => {
    expect(initial).toMatchObject({
      navModel: "rowsFirst",
      selMode: "single",
      exp0: false,
      exp2: false,
      exp4: false,
      inGrid: false,
      kind: "row",
      frow: 0n,
      fcol: 0n,
      selMask: 0n,
    });
  });

  it("ignores keys while focus is outside the grid", () => {
    for (const tag of [
      "right",
      "left",
      "down",
      "up",
      "home",
      "end",
      "ctrlHome",
      "ctrlEnd",
      "enter",
      "toggleSelect",
      "selectAll",
      "extendDown",
      "extendUp",
    ]) {
      expect(step(initial, { _tag: tag })).toEqual(initial);
    }
  });

  it("Tab in lands on the remembered tab stop and Tab out remembers it", () => {
    expect(focused).toMatchObject({ inGrid: true, kind: "row", frow: 0n });
    const moved = press(focused, "down");
    const out = press(moved, "blur");
    expect(out).toMatchObject({ inGrid: false, kind: "row", frow: 4n });
    expect(press(out, "focusIn")).toMatchObject({ inGrid: true, frow: 4n });
  });

  describe("row focus: Right / Left", () => {
    it("Right expands a collapsed parent row, then enters the cells", () => {
      const expanded = press(focused, "right");
      expect(expanded).toMatchObject({ exp0: true, kind: "row", fcol: 0n });

      const cell0 = press(expanded, "right");
      expect(cell0).toMatchObject({ exp0: true, kind: "cell", fcol: 0n });

      expect(press(cell0, "right")).toMatchObject({ fcol: 1n });
      expect(press(cell0, "right", "right")).toMatchObject({ fcol: 2n });
      // right-most cell: focus does not move
      expect(press(cell0, "right", "right", "right")).toMatchObject({
        kind: "cell",
        fcol: 2n,
      });
    });

    it("Right on a leaf row moves to its first cell without expanding", () => {
      const onLeaf = press(focused, "right", "down"); // row 1 is a leaf
      expect(onLeaf).toMatchObject({ frow: 1n, kind: "row" });
      expect(press(onLeaf, "right")).toMatchObject({
        frow: 1n,
        kind: "cell",
        fcol: 0n,
        exp0: true,
        exp2: false,
      });
    });

    it("Left collapses an expanded row, then does not move on a collapsed row", () => {
      const expanded = press(focused, "right");
      const collapsed = press(expanded, "left");
      expect(collapsed).toMatchObject({ exp0: false, kind: "row", frow: 0n });
      expect(press(collapsed, "left")).toEqual(collapsed);
    });

    it("Left on a leaf row does not move (no jump to the parent)", () => {
      const onLeaf = press(focused, "right", "down");
      expect(press(onLeaf, "left")).toEqual(onLeaf);
    });

    it("Left walks cells back to the first cell, then to the row", () => {
      const cell2 = press(focused, "right", "right", "right", "right");
      expect(cell2).toMatchObject({ kind: "cell", fcol: 2n });
      expect(press(cell2, "left")).toMatchObject({ kind: "cell", fcol: 1n });
      const row = press(cell2, "left", "left", "left");
      expect(row).toMatchObject({ kind: "row", fcol: 0n, exp0: true });
      // Left on the (expanded) row collapses it again
      expect(press(row, "left")).toMatchObject({ exp0: false, kind: "row" });
    });
  });

  describe("Down / Up over visible rows", () => {
    it("skips rows hidden by a collapsed ancestor", () => {
      expect(press(focused, "down")).toMatchObject({ frow: 4n });
      expect(press(focused, "down", "down")).toMatchObject({ frow: 4n });
    });

    it("walks into rows a parent reveals and over nested collapsed rows", () => {
      const open0 = press(focused, "right"); // expand row 0
      expect(press(open0, "down")).toMatchObject({ frow: 1n });
      expect(press(open0, "down", "down")).toMatchObject({ frow: 2n });
      // row 2 is collapsed: its child (row 3) is skipped
      expect(press(open0, "down", "down", "down")).toMatchObject({ frow: 4n });
      const open2 = press(open0, "down", "down", "right"); // expand row 2
      expect(open2).toMatchObject({ exp2: true, frow: 2n });
      expect(press(open2, "down")).toMatchObject({ frow: 3n });
      expect(press(open2, "down", "down")).toMatchObject({ frow: 4n });
    });

    it("stops at the last and first visible rows", () => {
      const atB = press(focused, "down", "right"); // expand row 4
      expect(atB).toMatchObject({ exp4: true, frow: 4n });
      const last = press(atB, "down", "down", "down");
      expect(last).toMatchObject({ frow: 6n });
      expect(press(last, "up")).toMatchObject({ frow: 5n });
      expect(press(last, "up", "up", "up")).toMatchObject({ frow: 0n });
      expect(press(focused, "up")).toMatchObject({ frow: 0n });
    });

    it("Up jumps over a collapsed subtree to the parent", () => {
      const open0 = press(focused, "right");
      const atFour = press(open0, "down", "down", "down");
      expect(press(atFour, "up")).toMatchObject({ frow: 2n });
      const collapsed = press(open0, "left", "down", "up");
      expect(collapsed).toMatchObject({ exp0: false, frow: 0n });
    });
  });

  describe("row focus: Home / End / Ctrl+Home / Ctrl+End", () => {
    it("End and Ctrl+End go to the last visible row; Home and Ctrl+Home to the first", () => {
      expect(press(focused, "end")).toMatchObject({ frow: 4n, kind: "row" });
      expect(press(focused, "ctrlEnd")).toMatchObject({ frow: 4n });
      const open4 = press(focused, "down", "right"); // expand row 4
      expect(press(open4, "end")).toMatchObject({ frow: 6n });
      expect(press(open4, "ctrlEnd")).toMatchObject({ frow: 6n });
      expect(press(open4, "home")).toMatchObject({ frow: 0n });
      expect(press(open4, "ctrlHome")).toMatchObject({ frow: 0n });
      // no movement at the boundaries
      expect(press(focused, "home")).toEqual(focused);
      expect(press(focused, "ctrlHome")).toEqual(focused);
    });
  });

  describe("cell focus", () => {
    const cellsFirst = press(configureNav("cellsFirst"), "focusIn");

    it("cells-first Tab lands on the first cell", () => {
      expect(cellsFirst).toMatchObject({
        navModel: "cellsFirst",
        inGrid: true,
        kind: "cell",
        frow: 0n,
        fcol: 0n,
      });
    });

    it("Down / Up keep the column and skip hidden rows", () => {
      const col1 = press(cellsFirst, "right");
      const down = press(col1, "down");
      expect(down).toMatchObject({ kind: "cell", frow: 4n, fcol: 1n });
      expect(press(down, "up")).toMatchObject({ frow: 0n, fcol: 1n });
      // bottom cell of the column: focus does not move
      expect(press(down, "down")).toEqual(down);
    });

    it("Home / End move within the row", () => {
      const col1 = press(cellsFirst, "right");
      expect(press(col1, "end")).toMatchObject({ frow: 0n, fcol: 2n });
      expect(press(col1, "end", "home")).toMatchObject({ frow: 0n, fcol: 0n });
      expect(press(cellsFirst, "home")).toEqual(cellsFirst);
    });

    it("Ctrl+Home / Ctrl+End move within the column", () => {
      const open4 = toggleRow(cellsFirst, 4n);
      expect(open4).toMatchObject({ exp4: true, kind: "cell", frow: 0n });
      const col1 = press(open4, "right");
      const bottom = press(col1, "ctrlEnd");
      expect(bottom).toMatchObject({ frow: 6n, fcol: 1n, kind: "cell" });
      expect(press(bottom, "ctrlHome")).toMatchObject({ frow: 0n, fcol: 1n });
      expect(press(bottom, "ctrlEnd")).toEqual(bottom);
    });

    it("Left from the first cell reaches the row when row focus is supported", () => {
      const row = press(cellsFirst, "left");
      expect(row).toMatchObject({ kind: "row", frow: 0n, fcol: 0n });
      // and Right on the collapsed row expands it
      expect(press(row, "right")).toMatchObject({ exp0: true, kind: "row" });
    });

    it("cells-only never focuses a row; Enter on the first cell toggles", () => {
      const cellsOnly = press(configureNav("cellsOnly"), "focusIn");
      expect(cellsOnly).toMatchObject({ kind: "cell", navModel: "cellsOnly" });
      // Left from the first cell: focus does not move
      expect(press(cellsOnly, "left")).toEqual(cellsOnly);
      // Right moves between cells and never expands
      expect(press(cellsOnly, "right")).toMatchObject({
        fcol: 1n,
        exp0: false,
      });

      const open = press(cellsOnly, "enter");
      expect(open).toMatchObject({ exp0: true, kind: "cell", fcol: 0n });
      expect(press(open, "enter")).toMatchObject({ exp0: false });

      // Enter on another column performs the default action only
      expect(press(cellsOnly, "right", "enter")).toMatchObject({
        exp0: false,
        fcol: 1n,
      });

      // Enter on a leaf row's first cell does not expand anything
      const onLeaf = press(open, "down");
      expect(onLeaf).toMatchObject({ frow: 1n });
      expect(press(onLeaf, "enter")).toEqual(onLeaf);
    });

    it("cells-only entry from rows-first Enter is a no-op", () => {
      expect(press(focused, "enter")).toEqual(focused);
    });
  });

  describe("pointer", () => {
    it("clicking a rendered cell focuses it; an unrendered cell is ignored", () => {
      // cell 4 = row 1, column 1: hidden while row 0 is collapsed
      expect(clickCell(initial, 4n)).toEqual(initial);
      const onCell = clickCell(initial, 13n); // row 4, column 1
      expect(onCell).toMatchObject({
        inGrid: true,
        kind: "cell",
        frow: 4n,
        fcol: 1n,
        selMask: 16n,
      });
    });

    it("expander click on a hidden parent row is ignored but remembered state persists", () => {
      expect(toggleRow(initial, 2n)).toEqual(initial);
      const open = toggleRow(toggleRow(initial, 0n), 2n);
      expect(open).toMatchObject({ exp0: true, exp2: true });
    });

    it("collapsing an ancestor relocates focus to the toggled row", () => {
      const open = toggleRow(toggleRow(initial, 0n), 2n);
      const onRow3 = press(open, "focusIn", "down", "down", "down");
      expect(onRow3).toMatchObject({ frow: 3n, kind: "row" });
      // single-select: the selected row follows the relocated focus
      expect(onRow3).toMatchObject({ selMask: 8n });
      const collapsed = toggleRow(onRow3, 0n);
      expect(collapsed).toMatchObject({
        exp0: false,
        exp2: true,
        frow: 0n,
        inGrid: true,
        selMask: 1n,
      });
      // reopening reveals the remembered nested expansion
      expect(toggleRow(collapsed, 0n)).toMatchObject({
        exp0: true,
        exp2: true,
        frow: 0n,
      });
    });

    it("relocation keeps the column in cell mode and works while focus is outside", () => {
      const cellsFirst = configureNav("cellsFirst");
      const open = toggleRow(toggleRow(cellsFirst, 0n), 2n);
      const onCell = clickCell(open, 11n); // row 3, column 2
      expect(onCell).toMatchObject({ frow: 3n, fcol: 2n, kind: "cell" });
      const blurred = press(onCell, "blur");
      const collapsed = toggleRow(blurred, 2n);
      expect(collapsed).toMatchObject({
        exp2: false,
        frow: 2n,
        fcol: 2n,
        kind: "cell",
        inGrid: false,
      });
    });

    it("collapsing an unrelated row leaves focus alone", () => {
      const open = toggleRow(initial, 4n);
      const onRow = press(open, "focusIn");
      expect(toggleRow(onRow, 4n)).toMatchObject({ frow: 0n, exp4: false });
    });
  });

  describe("single selection follows focus", () => {
    it("selects the focused row on entry and as focus moves", () => {
      expect(focused).toMatchObject({ selMask: 1n });
      expect(press(focused, "down")).toMatchObject({ selMask: 16n });
      expect(press(focused, "end")).toMatchObject({ selMask: 16n });
      expect(press(focused, "right", "down", "down")).toMatchObject({
        frow: 2n,
        selMask: 4n,
      });
    });

    it("cell focus selects the row that contains it", () => {
      const cell = press(focused, "right", "right");
      expect(cell).toMatchObject({ kind: "cell", selMask: 1n });
      // row 0 was expanded by the first Right, so Down reaches row 1
      expect(press(cell, "down")).toMatchObject({ frow: 1n, selMask: 2n });
    });

    it("multi-only keys do nothing in single mode", () => {
      for (const tag of ["toggleSelect", "selectAll", "extendDown", "extendUp"]) {
        expect(press(focused, tag)).toEqual(focused);
      }
    });
  });

  describe("multi selection is independent of focus", () => {
    const multi = press(configureSel("multi"), "focusIn");

    it("entering the grid selects nothing", () => {
      expect(multi).toMatchObject({ selMode: "multi", selMask: 0n });
    });

    it("moving focus does not change the selection", () => {
      const moved = press(multi, "toggleSelect", "down");
      expect(moved).toMatchObject({ frow: 4n, selMask: 1n });
    });

    it("Shift+Space toggles the focused row, Ctrl+A selects every row", () => {
      const two = press(multi, "toggleSelect", "down", "toggleSelect");
      expect(two).toMatchObject({ selMask: 17n });
      expect(press(two, "toggleSelect")).toMatchObject({ selMask: 1n });
      const all = press(two, "selectAll");
      expect(all).toMatchObject({ selMask: 127n });
      expect(press(all, "toggleSelect")).toMatchObject({ selMask: 111n });
    });

    it("Shift+Down / Shift+Up on a row extend the selection over visible rows", () => {
      const down = press(multi, "extendDown");
      expect(down).toMatchObject({ frow: 4n, selMask: 17n });
      const up = press(down, "extendUp");
      expect(up).toMatchObject({ frow: 0n, selMask: 17n });

      const open = press(multi, "right", "extendDown", "extendDown");
      expect(open).toMatchObject({ frow: 2n, selMask: 7n });
    });

    it("cell focus: Shift+Down does not extend (row selection only)", () => {
      const inCell = press(configureSel("multi"), "focusIn", "right", "right");
      expect(inCell).toMatchObject({ kind: "cell", exp0: true });
      expect(press(inCell, "extendDown")).toEqual(inCell);
    });

    it("multi leaves selection untouched when relocation moves focus", () => {
      const open = toggleRow(toggleRow(multi, 0n), 2n);
      const onRow3 = press(open, "down", "down", "down", "toggleSelect");
      expect(onRow3).toMatchObject({ frow: 3n, selMask: 8n });
      expect(toggleRow(onRow3, 0n)).toMatchObject({ frow: 0n, selMask: 8n });
    });
  });

  describe("configuration", () => {
    it("configureNav restarts collapsed at the model entry point", () => {
      const open = press(focused, "right", "down", "right");
      expect(open).toMatchObject({ exp0: true });
      expect(step(open, { _tag: "configureNav", nav: "cellsOnly" })).toMatchObject({
        navModel: "cellsOnly",
        selMode: "single",
        exp0: false,
        exp2: false,
        exp4: false,
        inGrid: false,
        kind: "cell",
        frow: 0n,
        fcol: 0n,
        selMask: 0n,
        requested: 0n,
        outcome: "none",
        base: 0n,
      });
    });

    it("configureSel keeps the navigation model", () => {
      const state = step(configureNav("cellsFirst"), {
        _tag: "configureSel",
        sel: "multi",
      });
      expect(state).toMatchObject({
        navModel: "cellsFirst",
        selMode: "multi",
        kind: "cell",
        selMask: 0n,
        inGrid: false,
      });
    });
  });

  describe("request vs commit (map ticket rt1p)", () => {
    it("uncontrolled, every request is accepted and commits its intent", () => {
      const clicked = clickCell(initial, 13n); // row 4, column 1
      expect(clicked).toMatchObject({
        selMask: 16n,
        outcome: "accepted",
        requested: 16n,
        base: 0n,
        requests: 1n,
      });
      // the host-side events are inert without a controlled value
      expect(step(clicked, { _tag: "hostToggle", r: 0n })).toEqual(clicked);
      expect(model.transition(clicked, { _tag: "setValue", v: 1n })).toEqual(clicked);
    });

    it("controlled, a request the host ignores leaves the selection untouched", () => {
      const controlled = step(initial, { _tag: "control" });
      const requested = clickCell(controlled, 13n);
      expect(requested).toMatchObject({
        selMask: 0n,
        valueProp4: false,
        outcome: "rejected",
        requested: 16n,
        base: 0n,
        requests: 1n,
      });
      // a redundant request is not a request
      expect(step(controlled, { _tag: "toggleSelect" })).toEqual(controlled);
    });

    it("controlled, only the value prop commits", () => {
      const rejected = clickCell(step(initial, { _tag: "control" }), 13n);
      const committed = step(rejected, { _tag: "hostToggle", r: 4n });
      expect(committed).toMatchObject({
        selMask: 16n,
        valueProp4: true,
        outcome: "none",
        requests: 1n,
      });
      expect(model.transition(committed, { _tag: "setValue", v: 0n })).toMatchObject({
        selMask: 0n,
        outcome: "none",
      });
      // control adopts the current selection
      expect(step(clickCell(initial, 13n), { _tag: "control" })).toMatchObject({
        selMask: 16n,
        valueProp4: true,
      });
    });

    it("controlled, a host that accepts commits the intent through the value", () => {
      const host = step(step(initial, { _tag: "control" }), {
        _tag: "acceptRequests",
      });
      const clicked = clickCell(host, 13n);
      expect(clicked).toMatchObject({
        selMask: 16n,
        valueProp4: true,
        outcome: "accepted",
        requested: 16n,
        requests: 1n,
      });
    });
  });

  it("exposes typed event schemas for the pools", () => {
    for (const [tag, field, good, bad] of [
      ["toggleRow", "r", 2n, "2"],
      ["clickCell", "cell", 20n, "20"],
      ["configureNav", "nav", "cellsOnly", 1n],
      ["configureSel", "sel", "multi", 1n],
    ] as const) {
      const schema = model.eventSchemas[tag];
      if (schema === undefined) {
        throw new Error(`no event schema for ${tag}`);
      }
      const decode = Schema.decodeUnknownSync(schema as Schema.Codec<Record<string, unknown>>);
      expect(decode({ _tag: tag, [field]: good })).toEqual({
        _tag: tag,
        [field]: good,
      });
      expect(() => decode({ _tag: tag, [field]: bad })).toThrow();
    }
  });

  it("long random walks never violate an invariant", () => {
    const report = simulate(model, { runs: 60, maxSteps: 100, seed: 7 });
    expect(report.violations).toEqual([]);
    expect(report.steps).toBe(60 * 100);
  });
});
