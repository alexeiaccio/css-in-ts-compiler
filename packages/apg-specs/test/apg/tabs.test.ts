import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { explore, stateKey } from "@quint-machine/core/testing";
import definitionJson from "../../src/apg/tabs.model.generated.json";

// Spec-only verification for specs/apg/tabs.qnt (WAI-ARIA APG tabs).
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

// configure flavor bits: +1 manual, +2 vertical, +4 deletable, +8*m disabled mask
// m: 0 -> none, 1 -> {0}, 2 -> {1}, 3 -> {0,2}, 4 -> {1,2,3}
const MANUAL = 1n;
const VERTICAL = 2n;
const DELETABLE = 4n;
const maskOf = (m: bigint): bigint => m * 8n;

const configure = (flavor: bigint): QuintModelValue =>
  step(model.initial, { _tag: "configure", flavor });

const focusTablist = (state: QuintModelValue): QuintModelValue =>
  step(state, { _tag: "tab_key", shift: false });

const press = (state: QuintModelValue, key: string): QuintModelValue =>
  step(state, { _tag: "press", key });

describe("apg tabs (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "ConfigValid",
      "ZoneValid",
      "PresentInRange",
      "AtLeastOneFocusableTab",
      "SelectedTabIsFocusable",
      "FocusedTabIsFocusable",
      "ExactlyOneSelectedTab",
      "ExactlyOneTabStopOnSelected",
      "VisiblePanelIsSelectedTabPanel",
      "AutomaticSelectionFollowsFocus",
      "OnlyDeletableLosesTabs",
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
        activation: "automatic",
        orientation: "diagonal",
        deletable: false,
        disabled: 1n,
        present: 7n,
        selected: 3n,
        focused: 0n,
        zone: "tablist",
      }),
    ).toEqual([
      "ConfigValid",
      "SelectedTabIsFocusable",
      "FocusedTabIsFocusable",
      "ExactlyOneSelectedTab",
      "ExactlyOneTabStopOnSelected",
      "VisiblePanelIsSelectedTabPanel",
      "AutomaticSelectionFollowsFocus",
      "OnlyDeletableLosesTabs",
    ]);
    // an event committed while controlled: the state left the value prop behind
    expect(
      violatedInvariants(model, {
        ...model.initial,
        controlled: true,
        valueProp: 0n,
        selected: 1n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the selection anyway
    expect(
      violatedInvariants(model, {
        ...model.initial,
        outcome: "rejected",
        base: 0n,
        selected: 1n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...model.initial,
        outcome: "accepted",
        requested: 1n,
        selected: 0n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("starts with the first tab selected, tab stop and panel", () => {
    expect(model.initial).toMatchObject({
      activation: "automatic",
      selected: 0n,
      focused: 0n,
      zone: "outside",
    });
  });

  it("Tab enters the tablist on the selected tab, then panel, then out", () => {
    let state = step(model.initial, { _tag: "click", tab: 2n });
    state = step(state, { _tag: "tab_key", shift: false }); // tablist -> panel
    expect(state).toMatchObject({ zone: "panel", selected: 2n });
    state = step(state, { _tag: "tab_key", shift: false });
    expect(state).toMatchObject({ zone: "outside" });
    state = step(state, { _tag: "tab_key", shift: false });
    expect(state).toMatchObject({ zone: "tablist", focused: 2n });
    state = step(state, { _tag: "tab_key", shift: true });
    expect(state).toMatchObject({ zone: "outside" });
    state = step(state, { _tag: "tab_key", shift: true });
    expect(state).toMatchObject({ zone: "panel" });
    state = step(state, { _tag: "tab_key", shift: true });
    expect(state).toMatchObject({ zone: "tablist", focused: 2n });
  });

  it("automatic: arrows wrap and select; Up/Down are ignored when horizontal", () => {
    let state = focusTablist(configure(0n));
    state = press(state, "ArrowRight");
    expect(state).toMatchObject({ focused: 1n, selected: 1n });
    state = press(state, "ArrowDown");
    expect(state).toMatchObject({ focused: 1n, selected: 1n });
    state = press(press(press(state, "ArrowRight"), "ArrowRight"), "ArrowRight");
    expect(state).toMatchObject({ focused: 0n, selected: 0n });
    state = press(state, "ArrowLeft");
    expect(state).toMatchObject({ focused: 3n, selected: 3n });
  });

  it("Home / End jump to first / last in automatic mode", () => {
    let state = focusTablist(configure(0n));
    state = press(state, "End");
    expect(state).toMatchObject({ focused: 3n, selected: 3n });
    state = press(state, "Home");
    expect(state).toMatchObject({ focused: 0n, selected: 0n });
  });

  it("vertical orientation uses Up/Down and ignores Left/Right", () => {
    let state = focusTablist(configure(VERTICAL));
    state = press(state, "ArrowRight");
    expect(state).toMatchObject({ focused: 0n, selected: 0n });
    state = press(state, "ArrowDown");
    expect(state).toMatchObject({ focused: 1n, selected: 1n });
    state = press(press(state, "ArrowUp"), "ArrowUp");
    expect(state).toMatchObject({ focused: 3n, selected: 3n });
  });

  it("manual: arrows move focus only, Enter / Space select the focused tab", () => {
    let state = focusTablist(configure(MANUAL));
    state = press(state, "ArrowRight");
    expect(state).toMatchObject({ focused: 1n, selected: 0n });
    state = press(state, "Enter");
    expect(state).toMatchObject({ focused: 1n, selected: 1n });
    state = press(press(state, "End"), " ");
    expect(state).toMatchObject({ focused: 3n, selected: 3n });
  });

  it("manual: leaving and re-entering returns focus to the selected tab", () => {
    let state = focusTablist(configure(MANUAL));
    state = press(press(state, "ArrowRight"), "ArrowRight");
    expect(state).toMatchObject({ focused: 2n, selected: 0n });
    state = run(state, [
      { _tag: "tab_key", shift: false },
      { _tag: "tab_key", shift: false },
      { _tag: "tab_key", shift: false },
    ]);
    expect(state).toMatchObject({ zone: "tablist", focused: 0n, selected: 0n });
  });

  it("click focuses and selects in both modes", () => {
    for (const flavor of [0n, MANUAL]) {
      const state = step(configure(flavor), { _tag: "click", tab: 3n });
      expect(state).toMatchObject({
        zone: "tablist",
        focused: 3n,
        selected: 3n,
      });
    }
  });

  it("keys outside the tablist do nothing", () => {
    const state = configure(0n);
    expect(press(state, "ArrowRight")).toEqual(state);
    expect(press(state, "Delete")).toEqual(state);
  });

  it("disabled tabs are skipped by arrows, Home/End and ignore clicks", () => {
    // mask 3 -> tabs 0 and 2 disabled; first enabled tab is 1
    let state = configure(maskOf(3n));
    expect(state).toMatchObject({ selected: 1n, focused: 1n, disabled: 5n });
    state = step(state, { _tag: "click", tab: 2n });
    expect(state).toMatchObject({ selected: 1n });
    state = focusTablist(state);
    state = press(state, "ArrowRight");
    expect(state).toMatchObject({ focused: 3n, selected: 3n });
    state = press(state, "ArrowRight"); // wraps over disabled 0 to 1
    expect(state).toMatchObject({ focused: 1n, selected: 1n });
    state = press(state, "ArrowLeft");
    expect(state).toMatchObject({ focused: 3n, selected: 3n });
    state = press(state, "Home");
    expect(state).toMatchObject({ focused: 1n });
    state = press(state, "End");
    expect(state).toMatchObject({ focused: 3n });
  });

  it("a lone enabled tab keeps focus and selection on any key", () => {
    // mask 4 -> only tab 0 enabled
    let state = focusTablist(configure(maskOf(4n) + DELETABLE));
    expect(state).toMatchObject({ selected: 0n, disabled: 14n });
    for (const key of ["ArrowRight", "ArrowLeft", "Home", "End", "Delete"]) {
      state = press(state, key);
      expect(state).toMatchObject({ focused: 0n, selected: 0n, present: 15n });
    }
  });

  it("Delete is a no-op unless the variant is deletable", () => {
    const state = focusTablist(configure(0n));
    expect(press(state, "Delete")).toMatchObject({
      present: 15n,
      selected: 0n,
    });
  });

  it("Delete removes the tab, focuses the following tab and selects it", () => {
    let state = focusTablist(configure(DELETABLE));
    state = press(state, "Delete");
    expect(state).toMatchObject({ present: 14n, focused: 1n, selected: 1n });
  });

  it("Delete on the last tab focuses the previous one", () => {
    let state = focusTablist(configure(DELETABLE));
    state = press(press(state, "End"), "Delete");
    expect(state).toMatchObject({ present: 7n, focused: 2n, selected: 2n });
  });

  it("manual Delete of an unselected tab keeps the selection; of the selected tab hands it over", () => {
    let state = focusTablist(configure(DELETABLE + MANUAL));
    state = press(state, "ArrowRight"); // focus 1, selected 0
    state = press(state, "Delete");
    expect(state).toMatchObject({ present: 13n, focused: 2n, selected: 0n });
    state = press(state, "Home"); // focus 0
    state = press(state, "Delete"); // delete the selected tab
    expect(state).toMatchObject({ present: 12n, focused: 2n, selected: 2n });
  });

  it("deleted tabs are skipped by navigation and the last tab cannot be deleted", () => {
    let state = focusTablist(configure(DELETABLE));
    state = run(state, [
      { _tag: "press", key: "Delete" }, // remove 0 -> focus 1
      { _tag: "press", key: "Delete" }, // remove 1 -> focus 2
      { _tag: "press", key: "Delete" }, // remove 2 -> focus 3
    ]);
    expect(state).toMatchObject({ present: 8n, focused: 3n, selected: 3n });
    state = press(state, "Delete");
    expect(state).toMatchObject({ present: 8n, focused: 3n, selected: 3n });
    state = press(state, "ArrowLeft");
    expect(state).toMatchObject({ focused: 3n });
  });

  it("uncontrolled, every selection request is accepted and commits its intent", () => {
    const clicked = step(model.initial, { _tag: "click", tab: 2n });
    expect(clicked).toMatchObject({
      selected: 2n,
      outcome: "accepted",
      requested: 2n,
      base: 0n,
      requests: 1n,
    });
    // a redundant click is not a request
    expect(step(clicked, { _tag: "click", tab: 2n })).toEqual(clicked);
    // host-side commits are inert without a controlled value
    expect(model.transition(clicked, { _tag: "setValue", v: 1n })).toEqual(clicked);
  });

  it("controlled, a rejected request leaves the selection untouched", () => {
    const controlled = step(model.initial, { _tag: "control" });
    const clicked = step(controlled, { _tag: "click", tab: 2n });
    expect(clicked).toMatchObject({
      selected: 0n,
      valueProp: 0n,
      outcome: "rejected",
      requested: 2n,
      base: 0n,
      requests: 1n,
    });
    // roving focus still moved to the requested tab; selection did not
    expect(clicked).toMatchObject({ focused: 2n, zone: "tablist" });
    // a host write is the only commit while controlled
    expect(step(clicked, { _tag: "setValue", v: 2n })).toMatchObject({
      selected: 2n,
      valueProp: 2n,
      outcome: "none",
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = step(step(model.initial, { _tag: "control" }), {
      _tag: "acceptRequests",
    });
    const clicked = step(host, { _tag: "click", tab: 3n });
    expect(clicked).toMatchObject({
      selected: 3n,
      valueProp: 3n,
      outcome: "accepted",
      requests: 1n,
    });
    expect(step(clicked, { _tag: "click", tab: 1n })).toMatchObject({
      selected: 1n,
      valueProp: 1n,
      requests: 2n,
    });
  });

  it("controlled, a redundant request is not a request", () => {
    const controlled = step(model.initial, { _tag: "control" });
    // clicking the selected tab still focuses it, but fires nothing
    expect(step(controlled, { _tag: "click", tab: 0n })).toMatchObject({
      selected: 0n,
      requests: 0n,
      outcome: "none",
      zone: "tablist",
    });
  });

  it("every reachable event keeps every invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 4, maxStates: 30_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(50);
  });
});
