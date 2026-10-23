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
import definitionJson from "../../src/apg/combobox-dialog.model.generated.json";

// Spec-only verification for specs/apg/combobox-dialog.qnt (APG date picker
// combobox: the popup is a dialog, so DOM focus moves into it). Events come
// from the spec's own pools; every declared invariant is checked after every
// step.
//
// Dates are absolute day numbers 0..266 (months of 31, 28, 30 days); TODAY=134.

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
const typeText = (k: bigint) => ({ _tag: "type_text", k });
const setValue = (k: bigint) => ({ _tag: "set_value", k });
const INVALID = 999n;
const GRID = 6n;

const initial = model.initial;
const combo = run(initial, key("focus"));
const opened = step(combo, key("arrow_down"));
// open the dialog on a given date through the combobox value
const openOn = (date: bigint) => run(combo, setValue(date), key("arrow_down"));
const focusOf = (state: QuintModelValue) => state["focusAbs"];

describe("apg combobox-dialog (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "DomFocusInsideDialogWhenOpen",
      "DomFocusOutsideDialogWhenClosed",
      "AriaContractConsistent",
      "DatesInRange",
      "EscapeKeepsValue",
      "EscapeReturnsFocusToCombobox",
      "NavigationKeepsValue",
      "ValueChangesOnlyOnCommitOrEdit",
      "OpensOnValueOrToday",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    // dialog open while DOM focus is still on the combobox
    expect(violatedInvariants(model, { ...initial, open: true, domFocus: 1n })).toEqual([
      "DomFocusInsideDialogWhenOpen",
    ]);
    // dialog closed while DOM focus is inside it
    expect(violatedInvariants(model, { ...initial, domFocus: 6n })).toEqual([
      "DomFocusOutsideDialogWhenClosed",
    ]);
    expect(violatedInvariants(model, { ...initial, focusAbs: 300n, value: 267n })).toEqual([
      "DatesInRange",
    ]);
    expect(
      violatedInvariants(model, {
        ...initial,
        lastEvent: "escape",
        valueChanged: true,
        wasOpen: true,
        open: true,
        domFocus: 6n,
      }),
    ).toEqual([
      "EscapeKeepsValue",
      "EscapeReturnsFocusToCombobox",
      "ValueChangesOnlyOnCommitOrEdit",
    ]);
    expect(
      violatedInvariants(model, {
        ...initial,
        lastEvent: "page_up",
        valueChanged: true,
      }),
    ).toEqual(["NavigationKeepsValue", "ValueChangesOnlyOnCommitOrEdit"]);
    // a fresh dialog that did not start on today / the combobox's date
    expect(
      violatedInvariants(model, {
        ...initial,
        lastEvent: "arrow_down",
        open: true,
        domFocus: 6n,
        focusAbs: 5n,
      }),
    ).toEqual(["OpensOnValueOrToday"]);
    // an event committed while controlled: the date left the prop
    expect(
      violatedInvariants(model, {
        ...initial,
        controlled: true,
        valueProp: -1n,
        value: 59n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the date anyway
    expect(
      violatedInvariants(model, {
        ...initial,
        controlled: true,
        outcome: "rejected",
        base: -1n,
        value: 59n,
        valueProp: 59n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "accepted",
        requested: 59n,
        value: -1n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("ignores keys while DOM focus is outside", () => {
    expect(step(initial, key("arrow_down"))).toMatchObject({
      open: false,
      domFocus: 0n,
    });
    expect(step(initial, key("tab"))).toMatchObject({ domFocus: 0n });
  });

  it("opens on today when the combobox has no valid date, moving DOM focus into the dialog", () => {
    expect(combo).toMatchObject({ open: false, domFocus: 1n });
    for (const tag of ["arrow_down", "alt_arrow_down"]) {
      expect(step(combo, key(tag))).toMatchObject({
        open: true,
        domFocus: GRID,
        focusAbs: 134n,
      });
    }
    expect(step(combo, key("click_button"))).toMatchObject({
      open: true,
      domFocus: GRID,
      focusAbs: 134n,
    });
  });

  it("opens on the combobox date when it holds a valid one", () => {
    expect(openOn(59n)).toMatchObject({
      open: true,
      focusAbs: 59n,
      value: 59n,
    });
    const typed = run(combo, typeText(0n), key("alt_arrow_down"));
    expect(typed).toMatchObject({ open: true, focusAbs: 0n });
    // an invalid typed text falls back to today
    const invalid = run(combo, setValue(59n), typeText(INVALID), key("arrow_down"));
    expect(invalid).toMatchObject({ value: -1n, focusAbs: 134n });
  });

  it("Tab / Shift+Tab cycle the seven dialog tab stops and wrap (focus trap)", () => {
    let state = opened;
    const forward = [7n, 8n, 2n, 3n, 4n, 5n, 6n, 7n];
    for (const stop of forward) {
      state = step(state, key("tab"));
      expect(state).toMatchObject({ open: true, domFocus: stop });
    }
    state = run(opened, key("shift_tab"));
    expect(state).toMatchObject({ domFocus: 5n });
    state = run(state, key("shift_tab"), key("shift_tab"), key("shift_tab"), key("shift_tab"));
    expect(state).toMatchObject({ domFocus: 8n });
    state = run(state, key("shift_tab"), key("shift_tab"));
    expect(state).toMatchObject({ domFocus: 6n });
    // in the combobox Tab / Shift+Tab leave it
    expect(step(combo, key("tab"))).toMatchObject({
      domFocus: 0n,
      open: false,
    });
    expect(step(combo, key("shift_tab"))).toMatchObject({ domFocus: 0n });
  });

  it("week and day keys move the grid focus, crossing months, stopping at the ends", () => {
    expect(focusOf(run(opened, key("arrow_down")))).toBe(141n);
    expect(focusOf(run(opened, key("arrow_up")))).toBe(127n);
    expect(focusOf(run(opened, key("arrow_right")))).toBe(135n);
    expect(focusOf(run(opened, key("arrow_left")))).toBe(133n);
    // the calendar ends do not move
    const first = openOn(0n);
    expect(focusOf(run(first, key("arrow_up"), key("arrow_left")))).toBe(0n);
    const last = openOn(266n);
    expect(focusOf(run(last, key("arrow_down"), key("arrow_right")))).toBe(266n);
    // Right from the last day of a month lands on the first of the next
    expect(focusOf(run(openOn(59n), key("arrow_left")))).toBe(58n);
  });

  it("Home / End jump to the first / last day of the week", () => {
    // 134 = week 19, weekday 1
    expect(focusOf(run(opened, key("home")))).toBe(133n);
    expect(focusOf(run(opened, key("end")))).toBe(139n);
    // the final week of the calendar is cut at the last day
    expect(focusOf(run(openOn(266n), key("end")))).toBe(266n);
  });

  it("PageUp / PageDown change the month keeping the day, else the last day", () => {
    // 134 = month 4 (starts 120), day index 14
    expect(focusOf(run(opened, key("page_up")))).toBe(103n);
    expect(focusOf(run(opened, key("page_down")))).toBe(162n);
    // last day of a 30-day month into a shorter / longer one
    expect(focusOf(run(openOn(266n), key("page_up")))).toBe(236n);
    expect(focusOf(run(openOn(266n), key("page_down")))).toBe(266n);
    expect(focusOf(run(openOn(0n), key("page_up")))).toBe(0n);
  });

  it("Shift+PageUp / Shift+PageDown change the year", () => {
    expect(focusOf(run(opened, key("shift_page_up")))).toBe(
      // month 1, same day index 14
      45n,
    );
    expect(focusOf(run(opened, key("shift_page_down")))).toBe(
      // month 7, same day index 14
      223n,
    );
    expect(focusOf(run(openOn(266n), key("shift_page_up")))).toBe(177n);
  });

  it("grid keys are inert while DOM focus is on a dialog button", () => {
    const onButton = run(opened, key("tab"), key("tab"), key("tab"));
    expect(onButton).toMatchObject({ domFocus: 2n, focusAbs: 134n });
    for (const tag of [
      "arrow_down",
      "arrow_up",
      "arrow_left",
      "arrow_right",
      "home",
      "end",
      "page_up",
      "page_down",
    ]) {
      expect(step(onButton, key(tag))).toMatchObject({
        focusAbs: 134n,
        domFocus: 2n,
      });
    }
  });

  it("Space selects the date and keeps the dialog open; Enter selects and closes", () => {
    const spaced = step(opened, key("space"));
    expect(spaced).toMatchObject({
      open: true,
      domFocus: GRID,
      value: 134n,
      valueChanged: true,
    });
    // selecting the already-selected date reports no change
    expect(step(spaced, key("space"))).toMatchObject({ valueChanged: false });
    const entered = run(opened, key("arrow_right"), key("enter"));
    expect(entered).toMatchObject({
      open: false,
      domFocus: 1n,
      value: 135n,
      valueChanged: true,
    });
    // after closing, ArrowDown reopens on the chosen date
    expect(step(entered, key("arrow_down"))).toMatchObject({ focusAbs: 135n });
  });

  it("calendar buttons change the displayed month / year and keep DOM focus on them", () => {
    // tab stops: 2 prev year, 3 prev month, 4 next month, 5 next year
    const prevMonth = run(opened, key("tab"), key("tab"), key("tab"), key("tab"));
    expect(prevMonth).toMatchObject({ domFocus: 3n });
    const back = step(prevMonth, key("enter"));
    expect(back).toMatchObject({
      domFocus: 3n,
      focusAbs: 103n,
      open: true,
      value: -1n,
    });
    expect(step(prevMonth, key("space"))).toMatchObject({ focusAbs: 103n });
    const nextMonth = run(opened, key("shift_tab"), key("shift_tab"));
    expect(nextMonth).toMatchObject({ domFocus: 4n });
    expect(step(nextMonth, key("enter"))).toMatchObject({ focusAbs: 162n });
    const prevYear = run(opened, key("tab"), key("tab"), key("tab"));
    expect(step(prevYear, key("enter"))).toMatchObject({
      domFocus: 2n,
      focusAbs: 45n,
    });
    const nextYear = run(opened, key("shift_tab"));
    expect(step(nextYear, key("space"))).toMatchObject({
      domFocus: 5n,
      focusAbs: 223n,
    });
  });

  it("Cancel and OK close the dialog and return DOM focus to the combobox", () => {
    const cancel = run(opened, key("tab"));
    const ok = run(opened, key("tab"), key("tab"));
    expect(cancel).toMatchObject({ domFocus: 7n });
    expect(ok).toMatchObject({ domFocus: 8n });
    for (const state of [cancel, ok]) {
      for (const tag of ["enter", "space"]) {
        expect(step(state, key(tag))).toMatchObject({
          open: false,
          domFocus: 1n,
          value: -1n,
          valueChanged: false,
        });
      }
    }
  });

  it("Escape closes from anywhere in the dialog, returns focus, keeps the value", () => {
    const picked = run(opened, key("space"), key("arrow_right"));
    for (const presses of [0, 1, 2, 3]) {
      const state = run(picked, ...Array.from({ length: presses }, () => key("tab")));
      expect(step(state, key("escape"))).toMatchObject({
        open: false,
        domFocus: 1n,
        value: 134n,
        valueChanged: false,
        wasOpen: true,
      });
    }
    // Escape on the closed combobox does nothing
    expect(step(combo, key("escape"))).toMatchObject({
      domFocus: 1n,
      open: false,
    });
  });

  it("typing edits the combobox text only while it holds DOM focus", () => {
    expect(step(combo, typeText(59n))).toMatchObject({
      value: 59n,
      valueChanged: true,
    });
    expect(step(combo, typeText(INVALID))).toMatchObject({
      value: -1n,
      valueChanged: false,
    });
    expect(step(opened, typeText(59n))).toMatchObject({ value: -1n });
    expect(step(initial, typeText(59n))).toMatchObject({ value: -1n });
  });

  it("blur from the combobox drops DOM focus; the dialog keeps its own", () => {
    expect(step(combo, key("blur"))).toMatchObject({ domFocus: 0n });
    expect(step(opened, key("blur"))).toMatchObject({
      open: true,
      domFocus: GRID,
    });
  });

  it("set_value is a prop change that leaves an open dialog open", () => {
    expect(step(opened, setValue(266n))).toMatchObject({
      open: true,
      domFocus: GRID,
      value: 266n,
      valueChanged: true,
      focusAbs: 134n,
    });
  });

  it("uncontrolled, a date request is accepted and commits its intent", () => {
    const typed = step(combo, typeText(59n));
    expect(typed).toMatchObject({
      value: 59n,
      outcome: "accepted",
      requested: 59n,
      base: -1n,
      requests: 1n,
    });
  });

  it("controlled, a rejected date request leaves the value untouched", () => {
    const controlled = step(initial, key("control"));
    const typed = step(step(controlled, key("focus")), typeText(59n));
    expect(typed).toMatchObject({
      value: -1n,
      valueProp: -1n,
      outcome: "rejected",
      requested: 59n,
      requests: 1n,
    });
    // the host writing its own copy is the only commit while controlled
    expect(step(typed, key("hostToggle"))).toMatchObject({
      value: 134n,
      valueProp: 134n,
      outcome: "none",
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = step(step(initial, key("control")), key("acceptRequests"));
    const typed = step(step(host, key("focus")), typeText(59n));
    expect(typed).toMatchObject({
      value: 59n,
      valueProp: 59n,
      outcome: "accepted",
      requested: 59n,
      requests: 1n,
    });
  });

  it("derives the event alphabet from the spec pools", () => {
    const events = eventsOf(model);
    expect(events.filter((e) => e["_tag"] === "type_text")).toHaveLength(4);
    expect(events.filter((e) => e["_tag"] === "set_value")).toHaveLength(4);
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(300);
    assertReachable(
      report,
      "dialog open on a grid cell",
      (s) => s["open"] === true && s["domFocus"] === 6n,
    );
    assertReachable(report, "dialog open on OK", (s) => s["open"] === true && s["domFocus"] === 8n);
    assertReachable(report, "date chosen", (s) => s["value"] !== -1n && s["valueChanged"] === true);
  });

  it("random walks never violate an invariant", () => {
    const report = simulate(model, { runs: 80, maxSteps: 100, seed: 9 });
    expect(report.violations).toEqual([]);
  });
});
