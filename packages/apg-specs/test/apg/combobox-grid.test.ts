import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import {
  assertReachable,
  eventsOf,
  explore,
  simulate,
  stateKey,
} from "@quint-machine/core/testing";
import { describe, expect, it } from "vite-plus/test";
import definitionJson from "../../src/apg/combobox-grid.model.generated.json";

// Spec-only verification for specs/apg/combobox-grid.qnt (APG combobox with a
// grid popup). Events come from the spec's own pools; every declared invariant
// is checked after every step.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const run = (
  state: QuintModelValue,
  ...events: ReadonlyArray<Record<string, unknown>>
): QuintModelValue => events.reduce(step, state);

const key = (_tag: string) => ({ _tag });
const clickCell = (k: bigint) => ({ _tag: "click_cell", k });
const setValue = (i: bigint) => ({ _tag: "set_value", i });
const setLayout = (cells: boolean) => ({ _tag: "set_layout", cells });

const initial = model.initial;
const rowCombo = run(initial, key("focus"));
const cellCombo = run(initial, setLayout(true), key("focus"));
const at = (row: bigint, col: bigint) => ({ open: true, row, col });

describe("apg combobox-grid (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "GridPositionConsistent",
      "ActiveCellRequiresOpenGrid",
      "DomFocusStaysOnCombobox",
      "AriaContractConsistent",
      "EscapeOnOpenGridKeepsValue",
      "NavigationKeepsValue",
      "ValueChangesOnlyOnCommitOrEdit",
      "PickedInRange",
      "FocusLossClosesGrid",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    expect(violatedInvariants(model, { ...initial, row: 1n, col: -1n })).toEqual([
      "GridPositionConsistent",
      "ActiveCellRequiresOpenGrid",
    ]);
    expect(
      violatedInvariants(model, {
        ...initial,
        open: true,
        row: 3n,
        col: 0n,
        focused: true,
      }),
    ).toEqual(["GridPositionConsistent", "AriaContractConsistent"]);
    expect(violatedInvariants(model, { ...initial, open: true })).toEqual([
      "DomFocusStaysOnCombobox",
    ]);
    expect(
      violatedInvariants(model, {
        ...initial,
        lastEvent: "escape",
        wasOpen: true,
        valueChanged: true,
      }),
    ).toEqual(["EscapeOnOpenGridKeepsValue"]);
    expect(
      violatedInvariants(model, {
        ...initial,
        lastEvent: "arrow_left",
        valueChanged: true,
      }),
    ).toEqual(["NavigationKeepsValue", "ValueChangesOnlyOnCommitOrEdit"]);
    expect(violatedInvariants(model, { ...initial, picked: 5n })).toEqual(["PickedInRange"]);
    expect(
      violatedInvariants(model, {
        ...initial,
        lastEvent: "tab",
        open: true,
        focused: true,
      }),
    ).toEqual(["FocusLossClosesGrid"]);
    // an event committed while controlled: the picked suggestion left the prop
    expect(
      violatedInvariants(model, {
        ...initial,
        controlled: true,
        valueProp: -1n,
        picked: 2n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the picked suggestion anyway
    expect(
      violatedInvariants(model, {
        ...initial,
        controlled: true,
        outcome: "rejected",
        base: -1n,
        picked: 2n,
        valueProp: 2n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "accepted",
        requested: 2n,
        picked: -1n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("ignores keys while DOM focus is elsewhere", () => {
    expect(step(initial, key("arrow_down"))).toMatchObject({
      open: false,
      row: -1n,
    });
    expect(step(initial, key("type_char"))).toMatchObject({
      open: false,
      hasText: false,
    });
  });

  describe("one suggestion per row", () => {
    it("ArrowDown / ArrowUp open the grid on the first / last cell", () => {
      expect(step(rowCombo, key("arrow_down"))).toMatchObject({
        ...at(0n, 0n),
        focused: true,
      });
      expect(step(rowCombo, key("arrow_up"))).toMatchObject(at(2n, 2n));
    });

    it("vertical movement wraps within the column, never across columns", () => {
      let state = run(rowCombo, key("arrow_down"), key("arrow_right"));
      expect(state).toMatchObject(at(0n, 1n));
      state = run(state, key("arrow_down"), key("arrow_down"));
      expect(state).toMatchObject(at(2n, 1n));
      state = run(state, key("arrow_down"));
      expect(state).toMatchObject(at(0n, 1n));
      state = run(state, key("arrow_up"));
      expect(state).toMatchObject(at(2n, 1n));
    });

    it("horizontal movement wraps across rows and around the grid", () => {
      let state = run(rowCombo, key("arrow_down"), key("arrow_right"), key("arrow_right"));
      expect(state).toMatchObject(at(0n, 2n));
      state = run(state, key("arrow_right"));
      expect(state).toMatchObject(at(1n, 0n));
      state = run(state, key("arrow_left"));
      expect(state).toMatchObject(at(0n, 2n));
      // first cell of the grid wraps to the last one, and back
      state = run(rowCombo, key("arrow_down"), key("arrow_left"));
      expect(state).toMatchObject(at(2n, 2n));
      expect(step(state, key("arrow_right"))).toMatchObject(at(0n, 0n));
    });

    it("selects the whole row containing the focused cell", () => {
      const state = run(rowCombo, key("arrow_down"), key("arrow_down"), key("arrow_right"));
      expect(state).toMatchObject(at(1n, 1n));
      // aria-selected is on row 1 only (and no cell): derived by the invariant
      expect(violatedInvariants(model, state)).toEqual([]);
    });

    it("Enter commits the suggestion of the focused row and closes", () => {
      const state = run(
        rowCombo,
        key("arrow_down"),
        key("arrow_down"),
        key("arrow_right"),
        key("enter"),
      );
      expect(state).toMatchObject({
        open: false,
        row: -1n,
        col: -1n,
        picked: 1n,
        valueChanged: true,
        focused: true,
      });
      // Enter with the visual focus on the textbox does nothing
      const textbox = run(rowCombo, key("type_char"), key("enter"));
      expect(textbox).toMatchObject({
        open: true,
        picked: -1n,
        valueChanged: false,
      });
    });
  });

  describe("one suggestion per cell", () => {
    it("vertical movement wraps from the end of a column to the next one", () => {
      let state = run(cellCombo, key("arrow_down"), key("arrow_down"), key("arrow_down"));
      expect(state).toMatchObject(at(2n, 0n));
      state = run(state, key("arrow_down"));
      expect(state).toMatchObject(at(0n, 1n));
      state = run(state, key("arrow_up"));
      expect(state).toMatchObject(at(2n, 0n));
      // bottom-right wraps to the top-left, top-left up to the bottom-right
      state = run(cellCombo, key("arrow_up"), key("arrow_down"));
      expect(state).toMatchObject(at(0n, 0n));
      expect(step(state, key("arrow_up"))).toMatchObject(at(2n, 2n));
    });

    it("Enter commits the focused cell", () => {
      const state = run(
        cellCombo,
        key("arrow_down"),
        key("arrow_down"),
        key("arrow_right"),
        key("arrow_right"),
        key("enter"),
      );
      expect(state).toMatchObject({
        open: false,
        picked: 5n,
        valueChanged: true,
      });
    });
  });

  it("Left / Right edit the text while the visual focus is on the textbox", () => {
    const open = run(rowCombo, key("type_char"));
    expect(step(open, key("arrow_right"))).toMatchObject({
      open: true,
      row: -1n,
    });
    expect(step(open, key("arrow_left"))).toMatchObject({
      open: true,
      row: -1n,
    });
  });

  it("Home / End / Delete return visual focus to the textbox, grid stays open", () => {
    for (const tag of ["home", "end", "delete"]) {
      const state = run(rowCombo, key("arrow_down"), key("arrow_right"), key(tag));
      expect(state).toMatchObject({
        open: true,
        row: -1n,
        col: -1n,
        valueChanged: false,
      });
    }
  });

  it("typing and Backspace return visual focus and keep the grid open", () => {
    const typed = run(rowCombo, key("arrow_down"), key("arrow_right"), key("type_char"));
    expect(typed).toMatchObject({
      open: true,
      row: -1n,
      hasText: true,
      valueChanged: true,
    });
    expect(run(rowCombo, key("arrow_down"), key("backspace"))).toMatchObject({
      open: true,
      row: -1n,
      hasText: false,
      valueChanged: false,
    });
    // editing a committed suggestion un-commits it
    const picked = run(rowCombo, key("arrow_down"), key("enter"));
    expect(picked).toMatchObject({ picked: 0n });
    expect(step(picked, key("backspace"))).toMatchObject({
      picked: -1n,
      hasText: true,
      valueChanged: true,
    });
  });

  it("Escape closes an open grid keeping the value, then clears the textbox", () => {
    const open = run(rowCombo, key("type_char"), key("arrow_down"));
    const closed = step(open, key("escape"));
    expect(closed).toMatchObject({
      open: false,
      row: -1n,
      hasText: true,
      valueChanged: false,
      wasOpen: true,
    });
    expect(step(closed, key("escape"))).toMatchObject({
      hasText: false,
      picked: -1n,
      valueChanged: true,
    });
    // nothing to clear in an empty combobox
    expect(step(rowCombo, key("escape"))).toMatchObject({
      valueChanged: false,
    });
  });

  it("blur and Tab close the grid and commit nothing", () => {
    const open = run(rowCombo, key("arrow_down"), key("arrow_right"));
    for (const tag of ["blur", "tab"]) {
      expect(step(open, key(tag))).toMatchObject({
        open: false,
        row: -1n,
        picked: -1n,
        focused: false,
      });
    }
  });

  it("pointer: click toggles the grid, clicking a cell commits it", () => {
    const opened = step(initial, key("click_input"));
    expect(opened).toMatchObject({ open: true, focused: true, row: -1n });
    expect(step(opened, key("click_input"))).toMatchObject({ open: false });
    // per-row layout: cell 7 is row 2
    expect(step(opened, clickCell(7n))).toMatchObject({
      open: false,
      picked: 2n,
      valueChanged: true,
    });
    expect(step(rowCombo, clickCell(7n))).toMatchObject({ picked: -1n });
    const cells = run(cellCombo, key("click_input"));
    expect(step(cells, clickCell(7n))).toMatchObject({ picked: 7n });
  });

  it("prop changes close the grid; a layout change clears the value", () => {
    const open = run(rowCombo, key("arrow_down"), key("arrow_right"));
    expect(step(open, setValue(2n))).toMatchObject({
      open: false,
      row: -1n,
      picked: 2n,
      valueChanged: true,
    });
    const picked = run(rowCombo, setValue(2n));
    expect(step(picked, setLayout(true))).toMatchObject({
      cellValues: true,
      picked: -1n,
      valueChanged: true,
    });
    expect(step(rowCombo, setLayout(true))).toMatchObject({
      valueChanged: false,
    });
  });

  it("uncontrolled, a commit request is accepted and commits its intent", () => {
    const state = run(rowCombo, key("arrow_down"), key("arrow_down"), key("enter"));
    expect(state).toMatchObject({
      picked: 1n,
      outcome: "accepted",
      requested: 1n,
      base: -1n,
      requests: 1n,
    });
  });

  it("controlled, a rejected commit leaves the value untouched", () => {
    const controlled = step(initial, key("control"));
    const state = run(
      step(controlled, key("focus")),
      key("arrow_down"),
      key("arrow_down"),
      key("enter"),
    );
    expect(state).toMatchObject({
      picked: -1n,
      valueProp: -1n,
      outcome: "rejected",
      requested: 1n,
      requests: 1n,
    });
    // the host writing its own copy is the only commit while controlled
    expect(step(state, key("hostToggle"))).toMatchObject({
      picked: 0n,
      valueProp: 0n,
      outcome: "none",
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = step(step(initial, key("control")), key("acceptRequests"));
    const state = run(step(host, key("focus")), key("arrow_down"), key("arrow_down"), key("enter"));
    expect(state).toMatchObject({
      picked: 1n,
      valueProp: 1n,
      outcome: "accepted",
      requested: 1n,
      requests: 1n,
    });
  });

  it("derives the event alphabet from the spec pools", () => {
    const events = eventsOf(model);
    expect(events.filter((e) => e["_tag"] === "click_cell")).toHaveLength(9);
    expect(events.filter((e) => e["_tag"] === "set_layout")).toHaveLength(2);
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 40_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(300);
    assertReachable(
      report,
      "cell focused in row layout",
      (s) => s["row"] !== -1n && s["cellValues"] === false,
    );
    assertReachable(
      report,
      "cell focused in cell layout",
      (s) => s["row"] !== -1n && s["cellValues"] === true,
    );
    assertReachable(report, "suggestion committed", (s) => s["picked"] !== -1n);
  });

  it("random walks never violate an invariant", () => {
    const report = simulate(model, { runs: 80, maxSteps: 100, seed: 5 });
    expect(report.violations).toEqual([]);
  });
});
