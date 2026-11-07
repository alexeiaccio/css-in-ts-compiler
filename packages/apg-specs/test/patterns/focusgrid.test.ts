import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { explore, stateKey } from "@quint-machine/core/testing";
import definitionJson from "../../src/patterns/focusgrid.model.generated.json";
import { focusgridBridge } from "../../src/patterns/focusgrid.bridge";
import { parseScenarioFile, replayScenario, specDriver } from "../../src/scenario";
import scenarios from "../../scenarios/patterns/focusgrid.spec.json";

// Spec-only verification for specs/patterns/focusgrid.qnt: the platform contract
// of `focusgroup="grid"` (V2) — one tab stop, arrows on both axes, Home / End per
// row, Ctrl+Home / Ctrl+End for the grid, per-axis wrap and flow, entry / memory
// and `focusgroupstart`, `grid` vs `grid manual`. The APG grid keeps its delta.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const ROWS = 3;
const COLS = 4;
const CELLS = ROWS * COLS;

const cell = (row: number, col: number): bigint => BigInt(row * COLS + col);
const click = (state: QuintModelValue, row: number, col: number) =>
  step(state, { _tag: "click", cell: cell(row, col) });
const key = (state: QuintModelValue, k: string) => step(state, { _tag: "key", k });
const edges = (state: QuintModelValue, rowEdge: string, colEdge: string) =>
  step(step(state, { _tag: "set_row_edge", e: rowEdge }), { _tag: "set_col_edge", e: colEdge });
const focusOut = (state: QuintModelValue) => step(state, { _tag: "focus_out" });
const focusIn = (state: QuintModelValue) => step(state, { _tag: "focus_in" });

const initial = model.initial;
const inside = focusIn(initial);

describe("patterns focusgrid (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "CurInRange",
      "StopInRange",
      "StartInRange",
      "ExactlyOneTabStop",
      "StopIsEntry",
      "FocusImpliesCurrent",
      "EdgesKnown",
      "OutcomeKnown",
      "MovedImpliesFocus",
      "IgnoredKeepsFocus",
      "BlockedKeepsFocus",
      "MovedChangesFocus",
      "ManualDoesNotMove",
      "SnapshotsInRange",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    // a coordinate outside the body, and a remembered one that is not a cell
    expect(violatedInvariants(model, { ...initial, cur: 12n })).toEqual([
      "CurInRange",
      "StopIsEntry",
    ]);
    // -2 is remembered as "no cell" by `stopOf`, so only the range is violated
    expect(violatedInvariants(model, { ...initial, cur: -2n })).toEqual(["CurInRange"]);
    // a tab stop outside the body: no cell is tabbable at all
    expect(violatedInvariants(model, { ...initial, tabStop: -1n })).toEqual([
      "StopInRange",
      "ExactlyOneTabStop",
      "StopIsEntry",
    ]);
    expect(violatedInvariants(model, { ...initial, tabStop: 12n })).toEqual([
      "StopInRange",
      "ExactlyOneTabStop",
      "StopIsEntry",
    ]);
    // a stop that is not the entry target: memory and focusgroupstart disagree
    expect(violatedInvariants(model, { ...initial, tabStop: 5n })).toEqual(["StopIsEntry"]);
    expect(violatedInvariants(model, { ...initial, tabStop: 0n, start: 6n })).toEqual([
      "StopIsEntry",
    ]);
    // focus outside but a coordinate that was never focused
    expect(violatedInvariants(model, { ...initial, cur: 3n, tabStop: 3n, memory: false })).toEqual([
      "StopIsEntry",
    ]);
    // focus claimed inside with no coordinate
    expect(
      violatedInvariants(model, { ...initial, hasFocus: true, cur: -1n, tabStop: 0n }),
    ).toEqual(["FocusImpliesCurrent"]);
    // an edge that is not a grid edge, an outcome that is not an outcome
    expect(violatedInvariants(model, { ...initial, rowEdge: "both" })).toEqual(["EdgesKnown"]);
    expect(violatedInvariants(model, { ...initial, outcome: "consumed" })).toEqual([
      "OutcomeKnown",
    ]);
    // moved without focus, moved without a change, ignored/blocked with one
    expect(violatedInvariants(model, { ...initial, outcome: "moved" })).toEqual([
      "MovedImpliesFocus",
      "MovedChangesFocus",
    ]);
    expect(
      violatedInvariants(model, { ...initial, outcome: "ignored", cur: 4n, tabStop: 4n }),
    ).toEqual(["IgnoredKeepsFocus"]);
    expect(
      violatedInvariants(model, { ...initial, outcome: "blocked", cur: 4n, tabStop: 4n }),
    ).toEqual(["BlockedKeepsFocus"]);
    // a topology change that moved the stop anyway
    expect(violatedInvariants(model, { ...initial, lastManual: true, tabStop: 3n })).toEqual([
      "StopIsEntry",
      "ManualDoesNotMove",
    ]);
    // snapshots are cells too
    expect(violatedInvariants(model, { ...initial, snapCur: 12n })).toEqual(["SnapshotsInRange"]);
    expect(violatedInvariants(model, { ...initial, snapStop: -1n })).toEqual(["SnapshotsInRange"]);
  });

  it("starts outside the grid, with the first cell as the tab stop", () => {
    expect(initial).toMatchObject({
      cur: -1n,
      tabStop: 0n,
      hasFocus: false,
      start: 0n,
      memory: true,
      manual: false,
      rowEdge: "none",
      colEdge: "none",
      outcome: "none",
    });
  });

  it("arrows move on both axes and the default edges are hard", () => {
    const corner = click(inside, 0, 3);
    expect(key(corner, "ArrowRight")).toMatchObject({ cur: 3n, outcome: "blocked" });
    expect(key(click(inside, 2, 0), "ArrowDown")).toMatchObject({ cur: 8n, outcome: "blocked" });
    expect(key(click(inside, 1, 1), "ArrowRight")).toMatchObject({ cur: 6n, outcome: "moved" });
    expect(key(click(inside, 1, 1), "ArrowLeft")).toMatchObject({ cur: 4n });
    expect(key(click(inside, 1, 1), "ArrowDown")).toMatchObject({ cur: 9n });
    expect(key(click(inside, 1, 1), "ArrowUp")).toMatchObject({ cur: 1n });
    // a hard edge is not consumed: the coordinate and the stop stay
    expect(key(corner, "ArrowRight")).toMatchObject({ tabStop: 3n, hasFocus: true });
  });

  it("Home and End are the row's ends; Ctrl+Home and Ctrl+End the grid's", () => {
    const middle = click(inside, 1, 2);
    expect(key(middle, "Home")).toMatchObject({ cur: 4n });
    expect(key(middle, "End")).toMatchObject({ cur: 7n });
    expect(key(middle, "Control+Home")).toMatchObject({ cur: 0n, outcome: "moved" });
    expect(key(middle, "Control+End")).toMatchObject({ cur: 11n });
    // the same cell: Ctrl+Home on the first cell is blocked, not ignored
    expect(key(click(inside, 0, 0), "Control+Home")).toMatchObject({
      cur: 0n,
      outcome: "blocked",
    });
  });

  it("wraps within a row or a column", () => {
    const both = edges(inside, "wrap", "wrap");
    expect(key(click(both, 0, 3), "ArrowRight")).toMatchObject({ cur: 0n, outcome: "moved" });
    expect(key(click(both, 0, 0), "ArrowLeft")).toMatchObject({ cur: 3n });
    expect(key(click(both, 2, 1), "ArrowDown")).toMatchObject({ cur: 1n });
    expect(key(click(both, 0, 1), "ArrowUp")).toMatchObject({ cur: 9n });
    // wrapping never leaves the row on the inline axis, nor the column on the block axis
    expect(key(click(both, 1, 3), "ArrowRight")).toMatchObject({ cur: 4n });
  });

  it("flows into the adjacent row or column, and wraps at the outer edge", () => {
    const both = edges(inside, "flow", "flow");
    // the row's end continues in the next row, from its first cell
    expect(key(click(both, 0, 3), "ArrowRight")).toMatchObject({ cur: 4n, outcome: "moved" });
    expect(key(click(both, 1, 0), "ArrowLeft")).toMatchObject({ cur: 3n });
    // the column's end continues in the next column, from its first row
    expect(key(click(both, 2, 1), "ArrowDown")).toMatchObject({ cur: 2n });
    // going up from the first row continues in the PREVIOUS column, at its last row
    expect(key(click(both, 0, 2), "ArrowUp")).toMatchObject({ cur: 9n });
    // and the outer edge continues from the last cell / column to the first
    expect(key(click(both, 2, 3), "ArrowRight")).toMatchObject({ cur: 0n });
    expect(key(click(both, 0, 0), "ArrowLeft")).toMatchObject({ cur: 11n });
    expect(key(click(both, 2, 3), "ArrowDown")).toMatchObject({ cur: 0n });
    expect(key(click(both, 0, 0), "ArrowUp")).toMatchObject({ cur: 11n });
  });

  it("configures the two axes independently", () => {
    const rowOnly = edges(inside, "flow", "none");
    expect(key(click(rowOnly, 0, 3), "ArrowRight")).toMatchObject({ cur: 4n });
    expect(key(click(rowOnly, 2, 0), "ArrowDown")).toMatchObject({ cur: 8n, outcome: "blocked" });
    const colOnly = edges(inside, "none", "wrap");
    expect(key(click(colOnly, 0, 3), "ArrowRight")).toMatchObject({ cur: 3n, outcome: "blocked" });
    expect(key(click(colOnly, 2, 1), "ArrowDown")).toMatchObject({ cur: 1n });
  });

  it("ignores modified and unrelated keys, with focus inside or outside", () => {
    const onCell = click(inside, 1, 1);
    for (const k of ["Shift+ArrowRight", "Alt+Home", "Meta+ArrowDown"]) {
      expect(key(onCell, k)).toMatchObject({ cur: 5n, outcome: "ignored" });
    }
    // a command key with focus outside never moves
    for (const k of ["ArrowRight", "Home", "Control+End"]) {
      expect(key(initial, k)).toMatchObject({ cur: -1n, hasFocus: false, outcome: "ignored" });
    }
  });

  it("enters on the remembered cell, and on the start without memory", () => {
    const left = focusOut(click(inside, 1, 2));
    expect(left).toMatchObject({ cur: 6n, tabStop: 6n, hasFocus: false });
    expect(focusIn(left)).toMatchObject({ cur: 6n, tabStop: 6n, hasFocus: true });
    // inside again, focus_in is a no-op
    expect(focusIn(inside)).toMatchObject({ cur: 0n });

    const noMemory = step(left, { _tag: "set_memory", on: false });
    expect(noMemory).toMatchObject({ cur: 6n, tabStop: 0n, hasFocus: false });
    expect(focusIn(noMemory)).toMatchObject({ cur: 0n, tabStop: 0n });
    // turning memory off while outside re-seats the stop at once
    expect(step(inside, { _tag: "set_memory", on: false })).toMatchObject({
      cur: 0n,
      tabStop: 0n,
      hasFocus: true,
    });
  });

  it("focusgroupstart is the entry target only when nothing is remembered", () => {
    const moved = step(initial, { _tag: "set_start", i: 5n });
    expect(moved).toMatchObject({ start: 5n, tabStop: 5n, cur: -1n });
    expect(focusIn(moved)).toMatchObject({ cur: 5n });

    // a real memory beats a later start
    const left = focusOut(click(inside, 2, 2));
    const restarted = step(left, { _tag: "set_start", i: 5n });
    expect(restarted).toMatchObject({ start: 5n, cur: 10n, tabStop: 10n });
    expect(focusIn(restarted)).toMatchObject({ cur: 10n });

    // without memory the new start is the entry target, and the coordinate is kept
    const noMemory = step(restarted, { _tag: "set_memory", on: false });
    expect(noMemory).toMatchObject({ start: 5n, tabStop: 5n, cur: 10n });
    expect(focusIn(noMemory)).toMatchObject({ cur: 5n });

    // moving the start while focus is inside moves nothing
    expect(step(inside, { _tag: "set_start", i: 7n })).toMatchObject({
      cur: 0n,
      tabStop: 0n,
      start: 7n,
    });
  });

  it("grid manual is topology only: no coordinate and no tab stop moves", () => {
    const onCell = click(inside, 1, 1);
    expect(step(onCell, { _tag: "set_manual", flag: true })).toMatchObject({
      cur: 5n,
      tabStop: 5n,
      manual: true,
      outcome: "none",
    });
    const outside = focusOut(onCell);
    expect(step(outside, { _tag: "set_manual", flag: false })).toMatchObject({
      cur: 5n,
      tabStop: 5n,
      hasFocus: false,
    });
  });

  it("a command from a cell already at its edge is blocked, never 'moved'", () => {
    const hard = click(inside, 1, 0);
    expect(key(hard, "ArrowLeft")).toMatchObject({ cur: 4n, outcome: "blocked" });
    // wrapping a one-cell axis resolves to the source: a blocked command too
    const wrapped = edges(inside, "wrap", "wrap");
    expect(key(click(wrapped, 0, 0), "Home")).toMatchObject({ cur: 0n, outcome: "blocked" });
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 5, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(100);
    expect(report.states.length).toBeLessThanOrEqual(20_001);
    expect(CELLS).toBe(12);
  });
});

describe("focus group grid scenarios (spec driver)", () => {
  const file = parseScenarioFile(scenarios);
  for (const scenario of file.scenarios) {
    it(scenario.id, async () => {
      const result = await replayScenario(scenario, focusgridBridge, (config) =>
        specDriver(model, focusgridBridge, config),
      );
      expect(result.status).toBe("passed");
    });
  }
});
