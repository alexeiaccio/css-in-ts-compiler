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
import definitionJson from "../../src/apg/combobox-autocomplete.model.generated.json";

// Spec-only verification for specs/apg/combobox-autocomplete.qnt (APG editable
// combobox: aria-autocomplete none / list / both). Events come from the spec's
// own pools; every declared invariant is checked after every step.

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
// typed-character pool: 0 A, 1 l, 2 r, 3 C, 4 o, 5 D, 6 Z
const type = (ch: bigint) => ({ _tag: "type_char", ch });
const A = type(0n);
const l = type(1n);
const C = type(3n);
const D = type(5n);
const Z = type(6n);
const clickOption = (i: bigint) => ({ _tag: "click_option", i });
const setValue = (i: bigint) => ({ _tag: "set_value", i });
const setMode = (m: bigint) => ({ _tag: "set_autocomplete", m });

const initial = model.initial;
// focused editable combobox per autocomplete mode
const listCombo = run(initial, key("focus"));
const noneCombo = run(initial, setMode(0n), key("focus"));
const bothCombo = run(initial, setMode(2n), key("focus"));

describe("apg combobox-autocomplete (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "ActiveDescendantRefersToVisibleOption",
      "OpenPopupHasSuggestions",
      "DomFocusStaysOnCombobox",
      "AriaContractConsistent",
      "EditingReturnsVisualFocusToTextbox",
      "BothModeAutoSelectsFirstMatchOnEdit",
      "EscapeOnOpenPopupKeepsValue",
      "NavigationKeepsValue",
      "ValueChangesOnlyOnCommitOrEdit",
      "FocusLossClosesPopup",
      "StateInRange",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    // activedescendant on a closed popup, and popup open without DOM focus
    expect(violatedInvariants(model, { ...initial, active: 1n })).toEqual([
      "ActiveDescendantRefersToVisibleOption",
      "AriaContractConsistent",
    ]);
    expect(violatedInvariants(model, { ...initial, open: true })).toEqual([
      "DomFocusStaysOnCombobox",
    ]);
    // activedescendant on an option the typed text filtered out
    expect(
      violatedInvariants(model, {
        ...initial,
        open: true,
        focused: true,
        text: 4n,
        active: 0n,
      }),
    ).toEqual(["ActiveDescendantRefersToVisibleOption"]);
    // an open popup with nothing to suggest
    expect(
      violatedInvariants(model, {
        ...initial,
        open: true,
        focused: true,
        text: 8n,
      }),
    ).toEqual(["OpenPopupHasSuggestions"]);
    // Escape / navigation that changed the value
    expect(
      violatedInvariants(model, {
        ...initial,
        lastEvent: "escape",
        wasOpen: true,
        valueChanged: true,
      }),
    ).toEqual(["EscapeOnOpenPopupKeepsValue"]);
    expect(
      violatedInvariants(model, {
        ...initial,
        lastEvent: "arrow_down",
        valueChanged: true,
      }),
    ).toEqual(["NavigationKeepsValue", "ValueChangesOnlyOnCommitOrEdit"]);
    // list mode auto-selecting after an edit
    expect(
      violatedInvariants(model, {
        ...initial,
        open: true,
        focused: true,
        text: 1n,
        active: 0n,
        lastEvent: "type_char",
      }),
    ).toEqual(["EditingReturnsVisualFocusToTextbox"]);
    // both mode selecting a non-first match after an edit
    expect(
      violatedInvariants(model, {
        ...initial,
        mode: 2n,
        open: true,
        focused: true,
        text: 1n,
        active: 2n,
        lastEvent: "backspace",
      }),
    ).toEqual(["BothModeAutoSelectsFirstMatchOnEdit"]);
    expect(
      violatedInvariants(model, {
        ...initial,
        lastEvent: "blur",
        focused: true,
      }),
    ).toEqual(["FocusLossClosesPopup"]);
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
    expect(step(initial, A)).toMatchObject({ open: false, text: 0n });
    expect(step(initial, key("arrow_down"))).toMatchObject({ open: false });
  });

  describe('aria-autocomplete="list" (manual selection)', () => {
    it("filters on typing, never selects automatically, closes on no match", () => {
      const typedA = step(listCombo, A);
      expect(typedA).toMatchObject({
        open: true,
        text: 1n,
        active: -1n,
        focused: true,
        picked: -1n,
      });
      expect(step(typedA, l)).toMatchObject({
        open: true,
        text: 2n,
        active: -1n,
      });
      // "Z" matches nothing: the popup closes
      expect(step(listCombo, Z)).toMatchObject({ open: false, text: 8n });
      expect(run(typedA, Z)).toMatchObject({ open: false, text: 8n });
    });

    it("ArrowDown / ArrowUp move the visual focus with wrap-around", () => {
      let state = run(listCombo, A, key("arrow_down"));
      // "A" suggests Alabama(0) Alaska(1) Arizona(2): DOM focus never moves
      expect(state).toMatchObject({ active: 0n, focused: true, open: true });
      state = run(state, key("arrow_down"), key("arrow_down"));
      expect(state).toMatchObject({ active: 2n });
      state = run(state, key("arrow_down"));
      expect(state).toMatchObject({ active: 0n });
      state = run(state, key("arrow_up"));
      expect(state).toMatchObject({ active: 2n });
      // ArrowUp on a closed combobox opens on the last visible option
      expect(run(listCombo, C, key("escape"), key("arrow_up"))).toMatchObject({
        open: true,
        active: 4n,
      });
    });

    it("Enter commits the focused option, a bare Enter just closes", () => {
      const committed = run(listCombo, C, key("arrow_down"), key("arrow_down"), key("enter"));
      expect(committed).toMatchObject({
        open: false,
        active: -1n,
        picked: 4n,
        valueChanged: true,
        focused: true,
      });
      const bare = run(listCombo, A, key("enter"));
      expect(bare).toMatchObject({
        open: false,
        picked: -1n,
        text: 1n,
        valueChanged: false,
      });
      // Enter on a closed popup does nothing
      expect(step(committed, key("enter"))).toMatchObject({
        picked: 4n,
        valueChanged: false,
      });
    });

    it("Escape closes keeping the value, then clears the textbox", () => {
      const open = run(listCombo, A, key("arrow_down"));
      const closed = step(open, key("escape"));
      expect(closed).toMatchObject({
        open: false,
        active: -1n,
        text: 1n,
        valueChanged: false,
        wasOpen: true,
      });
      const cleared = step(closed, key("escape"));
      expect(cleared).toMatchObject({
        text: 0n,
        picked: -1n,
        valueChanged: true,
      });
      // nothing left to clear
      expect(step(cleared, key("escape"))).toMatchObject({
        valueChanged: false,
      });
      // Escape also clears a committed suggestion when the popup is closed
      const picked = run(listCombo, A, key("arrow_down"), key("enter"));
      expect(step(picked, key("escape"))).toMatchObject({
        picked: -1n,
        text: 0n,
      });
    });

    it("Left / Right / Home / End / Delete return visual focus, popup stays open", () => {
      for (const tag of ["arrow_left", "arrow_right", "home", "end", "delete"]) {
        const state = run(listCombo, A, key("arrow_down"), key(tag));
        expect(state).toMatchObject({
          open: true,
          active: -1n,
          valueChanged: false,
        });
      }
    });

    it("Alt+ArrowDown opens without moving focus, Alt+ArrowUp closes", () => {
      const opened = step(listCombo, key("alt_arrow_down"));
      expect(opened).toMatchObject({ open: true, active: -1n });
      expect(step(opened, key("alt_arrow_down"))).toMatchObject({
        open: true,
        active: -1n,
      });
      const focusedOption = step(opened, key("arrow_down"));
      expect(step(focusedOption, key("alt_arrow_up"))).toMatchObject({
        open: false,
        active: -1n,
        focused: true,
        picked: -1n,
      });
    });

    it("blur and Tab keep the typed text and commit nothing", () => {
      const open = run(listCombo, A, key("arrow_down"));
      for (const tag of ["blur", "tab"]) {
        expect(step(open, key(tag))).toMatchObject({
          open: false,
          active: -1n,
          picked: -1n,
          text: 1n,
          focused: false,
          valueChanged: false,
        });
      }
    });

    it("Backspace re-filters; from a committed value it edits the name", () => {
      const typed = run(listCombo, C, key("arrow_down"));
      const back = step(typed, key("backspace"));
      // text "" in a filtered mode: the popup closes, focus is on the textbox
      expect(back).toMatchObject({ text: 0n, open: false, active: -1n });
      const deep = run(listCombo, C, type(4n), key("backspace"));
      expect(deep).toMatchObject({ text: 4n, open: true, active: -1n });
      const picked = run(listCombo, A, key("arrow_down"), key("enter"), key("backspace"));
      expect(picked).toMatchObject({ picked: -1n, text: 1n, open: true });
      // typing after a commit appends to a full name that matches nothing
      expect(run(listCombo, A, key("arrow_down"), key("enter"), A)).toMatchObject({
        picked: -1n,
        text: 8n,
        open: false,
      });
      // nothing to delete: only the visual focus returns to the textbox
      const empty = run(listCombo, key("click_input"), key("arrow_down"), key("backspace"));
      expect(empty).toMatchObject({ open: true, active: -1n, text: 0n });
    });
  });

  describe('aria-autocomplete="both" (automatic selection + inline completion)', () => {
    it("selects the first match after typing", () => {
      const typed = step(bothCombo, C);
      expect(typed).toMatchObject({
        mode: 2n,
        open: true,
        text: 4n,
        active: 3n,
      });
      // another character re-selects the first of the narrower list
      expect(step(typed, type(4n))).toMatchObject({ text: 5n, active: 3n });
      // no match: popup closes and nothing is selected
      expect(step(typed, Z)).toMatchObject({ open: false, active: -1n });
    });

    it("ArrowDown goes to the suggestion following the automatic one", () => {
      const state = run(bothCombo, C, key("arrow_down"));
      expect(state).toMatchObject({ active: 4n });
      expect(run(bothCombo, C, key("arrow_down"), key("arrow_down"))).toMatchObject({
        active: 3n,
      });
      expect(run(bothCombo, C, key("arrow_up"))).toMatchObject({ active: 4n });
    });

    it("Enter accepts the auto-selected suggestion", () => {
      expect(run(bothCombo, D, key("enter"))).toMatchObject({
        open: false,
        picked: 5n,
        valueChanged: true,
      });
    });

    it("blur / Tab accept the selected suggestion as the value", () => {
      expect(run(bothCombo, D, key("blur"))).toMatchObject({
        open: false,
        picked: 5n,
        focused: false,
        valueChanged: true,
      });
      expect(run(bothCombo, C, key("arrow_down"), key("tab"))).toMatchObject({
        picked: 4n,
        focused: false,
      });
    });

    it("Delete / Left drop the selection so blur keeps the typed text", () => {
      const dropped = run(bothCombo, C, key("delete"));
      expect(dropped).toMatchObject({ open: true, active: -1n });
      expect(step(dropped, key("blur"))).toMatchObject({
        picked: -1n,
        text: 4n,
      });
    });

    it("Escape on the open popup keeps the typed text, then clears", () => {
      const closed = run(bothCombo, C, key("escape"));
      expect(closed).toMatchObject({
        open: false,
        active: -1n,
        text: 4n,
        picked: -1n,
        valueChanged: false,
      });
      expect(step(closed, key("escape"))).toMatchObject({
        text: 0n,
        valueChanged: true,
      });
    });
  });

  describe('aria-autocomplete="none"', () => {
    it("does not open on focus and never filters the suggestions", () => {
      expect(noneCombo).toMatchObject({ mode: 0n, open: false });
      const typed = step(noneCombo, Z);
      // text matches nothing, yet the same six suggestions stay available
      expect(typed).toMatchObject({ open: true, text: 8n, active: -1n });
      expect(step(typed, key("arrow_down"))).toMatchObject({ active: 0n });
      expect(run(typed, key("arrow_up"))).toMatchObject({ active: 5n });
      expect(run(typed, key("end"), key("arrow_down"))).toMatchObject({
        active: 0n,
      });
    });

    it("ArrowDown opens on the first option, Enter commits", () => {
      const state = run(noneCombo, key("arrow_down"), key("arrow_down"), key("enter"));
      expect(state).toMatchObject({
        open: false,
        picked: 1n,
        valueChanged: true,
      });
    });

    it("Escape closes the popup but never clears the textbox", () => {
      const typed = run(noneCombo, A);
      const closed = step(typed, key("escape"));
      expect(closed).toMatchObject({ open: false, text: 1n });
      expect(step(closed, key("escape"))).toMatchObject({
        text: 1n,
        valueChanged: false,
      });
    });

    it("blur keeps the typed text", () => {
      expect(run(noneCombo, A, key("arrow_down"), key("blur"))).toMatchObject({
        picked: -1n,
        text: 1n,
        open: false,
      });
    });
  });

  it("click on the input or the open button toggles the popup", () => {
    for (const tag of ["click_input", "click_button"]) {
      const opened = step(initial, key(tag));
      expect(opened).toMatchObject({ open: true, focused: true, active: -1n });
      expect(step(opened, key(tag))).toMatchObject({
        open: false,
        focused: true,
      });
    }
    // a filtered popup with no match does not open
    expect(run(listCombo, Z, key("click_input"))).toMatchObject({
      open: false,
    });
  });

  it("clicking a visible option commits it and keeps DOM focus", () => {
    const open = run(listCombo, C);
    expect(step(open, clickOption(4n))).toMatchObject({
      open: false,
      picked: 4n,
      focused: true,
      valueChanged: true,
    });
    // an option filtered out by the typed text cannot be clicked
    expect(step(open, clickOption(0n))).toMatchObject({
      open: true,
      picked: -1n,
    });
    expect(step(listCombo, clickOption(0n))).toMatchObject({ picked: -1n });
  });

  it("prop changes close the popup and keep the committed value", () => {
    const open = run(listCombo, A, key("arrow_down"));
    expect(step(open, setMode(2n))).toMatchObject({
      mode: 2n,
      open: false,
      active: -1n,
      text: 1n,
    });
    expect(step(open, setValue(3n))).toMatchObject({
      picked: 3n,
      open: false,
      active: -1n,
      valueChanged: true,
    });
    const picked = run(listCombo, setValue(3n));
    // a filtered popup now offers only the committed suggestion
    expect(step(picked, key("arrow_down"))).toMatchObject({
      open: true,
      active: 3n,
    });
    expect(run(picked, setMode(0n), key("arrow_down"), key("arrow_down"))).toMatchObject({
      active: 1n,
    });
  });

  it("uncontrolled, a pick request is accepted and commits its intent", () => {
    const committed = run(listCombo, C, key("arrow_down"), key("arrow_down"), key("enter"));
    expect(committed).toMatchObject({
      picked: 4n,
      outcome: "accepted",
      requested: 4n,
      base: -1n,
      requests: 1n,
    });
    // a host write still applies without a controlled value
    expect(step(committed, setValue(1n))).toMatchObject({
      picked: 1n,
      outcome: "none",
    });
  });

  it("controlled, a rejected pick leaves the value untouched", () => {
    const controlled = step(initial, key("control"));
    const committed = run(
      step(controlled, key("focus")),
      C,
      key("arrow_down"),
      key("arrow_down"),
      key("enter"),
    );
    expect(committed).toMatchObject({
      picked: -1n,
      valueProp: -1n,
      outcome: "rejected",
      requested: 4n,
      requests: 1n,
    });
    // the host writing its own copy is the only commit while controlled
    expect(step(committed, key("hostToggle"))).toMatchObject({
      picked: 0n,
      valueProp: 0n,
      outcome: "none",
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = step(step(initial, key("control")), key("acceptRequests"));
    const committed = run(
      step(host, key("focus")),
      C,
      key("arrow_down"),
      key("arrow_down"),
      key("enter"),
    );
    expect(committed).toMatchObject({
      picked: 4n,
      valueProp: 4n,
      outcome: "accepted",
      requested: 4n,
      requests: 1n,
    });
  });

  it("derives the event alphabet from the spec pools", () => {
    const events = eventsOf(model);
    expect(events.filter((e) => e["_tag"] === "type_char")).toHaveLength(7);
    expect(events.filter((e) => e["_tag"] === "set_autocomplete")).toHaveLength(3);
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 5, maxStates: 40_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(500);
    assertReachable(
      report,
      "both mode with inline completion",
      (s) => s["mode"] === 2n && s["active"] !== -1n,
    );
    assertReachable(
      report,
      "list mode with a focused option",
      (s) => s["mode"] === 1n && s["active"] !== -1n,
    );
    assertReachable(report, "none mode open", (s) => s["mode"] === 0n && s["open"] === true);
    assertReachable(report, "suggestion committed", (s) => s["picked"] !== -1n);
  });

  it("random walks never violate an invariant", () => {
    const report = simulate(model, { runs: 80, maxSteps: 100, seed: 11 });
    expect(report.violations).toEqual([]);
  });
});
