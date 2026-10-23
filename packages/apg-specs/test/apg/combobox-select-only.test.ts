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
import definitionJson from "../../src/apg/combobox-select-only.model.generated.json";

// Spec-only verification for specs/apg/combobox-select-only.qnt (APG select-only
// combobox). Events come from the spec's own pools; every declared invariant is
// checked after every step.

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
const typed = (ch: bigint) => ({ _tag: "type_char", ch });
const clickOption = (i: bigint) => ({ _tag: "click_option", i });
const setValue = (i: bigint) => ({ _tag: "set_value", i });

const initial = model.initial;
const focused = run(initial, key("focus"));

describe("apg combobox-select-only (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "ActiveDescendantIffOpen",
      "AriaContractConsistent",
      "ActiveInRange",
      "ValueInRange",
      "DomFocusStaysOnCombobox",
      "EscapeKeepsValue",
      "CommitOnlyViaCommitEvents",
      "TypeaheadBufferIsTransient",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    // open popup without an activedescendant and without DOM focus
    expect(violatedInvariants(model, { ...initial, open: true })).toEqual([
      "ActiveDescendantIffOpen",
      "AriaContractConsistent",
      "DomFocusStaysOnCombobox",
    ]);
    // a stale activedescendant on a closed popup
    expect(violatedInvariants(model, { ...initial, active: 2n })).toEqual([
      "ActiveDescendantIffOpen",
      "AriaContractConsistent",
    ]);
    expect(
      violatedInvariants(model, {
        ...initial,
        open: true,
        focused: true,
        active: 9n,
        value: 7n,
      }),
    ).toEqual([
      "ActiveDescendantIffOpen",
      "AriaContractConsistent",
      "ActiveInRange",
      "ValueInRange",
    ]);
    // Escape that changed the value / a value changed by navigation
    expect(
      violatedInvariants(model, {
        ...initial,
        lastEvent: "escape",
        valueChanged: true,
      }),
    ).toEqual(["EscapeKeepsValue", "CommitOnlyViaCommitEvents"]);
    expect(
      violatedInvariants(model, {
        ...initial,
        lastEvent: "arrow_down",
        valueChanged: true,
      }),
    ).toEqual(["CommitOnlyViaCommitEvents"]);
    expect(violatedInvariants(model, { ...initial, typed: 1n, lastEvent: "home" })).toEqual([
      "TypeaheadBufferIsTransient",
    ]);
    // an event committed while controlled: the state left the value prop behind
    expect(
      violatedInvariants(model, {
        ...initial,
        controlled: true,
        valueProp: 0n,
        value: 3n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the state anyway
    expect(
      violatedInvariants(model, {
        ...initial,
        controlled: true,
        outcome: "rejected",
        base: 0n,
        value: 3n,
        valueProp: 8n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "accepted",
        requested: 8n,
        value: 0n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("ignores keys while DOM focus is elsewhere", () => {
    expect(step(initial, key("arrow_down"))).toMatchObject({ open: false });
    expect(step(initial, typed(1n))).toMatchObject({ open: false });
  });

  it("opens on ArrowDown without moving off the selected option", () => {
    const selected = run(focused, setValue(3n));
    const open = step(selected, key("arrow_down"));
    expect(open).toMatchObject({ open: true, active: 3n, value: 3n });

    const fresh = step(focused, key("alt_arrow_down"));
    expect(fresh).toMatchObject({ open: true, active: 0n, focused: true });
    // Alt+ArrowDown on an open popup does not move the visual focus
    expect(step(fresh, key("alt_arrow_down"))).toMatchObject({ active: 0n });
  });

  it("opens on the first / last option for ArrowUp, Home and End", () => {
    expect(step(run(focused, setValue(4n)), key("arrow_up"))).toMatchObject({
      open: true,
      active: 0n,
    });
    expect(step(focused, key("home"))).toMatchObject({
      open: true,
      active: 0n,
    });
    expect(step(focused, key("end"))).toMatchObject({ open: true, active: 5n });
    // Enter and Space also open without moving
    expect(step(focused, key("enter"))).toMatchObject({
      open: true,
      active: 0n,
    });
    expect(step(focused, key("space"))).toMatchObject({
      open: true,
      active: 0n,
    });
  });

  it("navigates the open popup without ever changing the value", () => {
    let state = run(focused, key("arrow_down"));
    state = run(state, key("arrow_down"), key("arrow_down"));
    expect(state).toMatchObject({
      active: 2n,
      value: -1n,
      valueChanged: false,
    });
    // does not move past either end
    state = run(state, key("end"), key("arrow_down"));
    expect(state).toMatchObject({ active: 5n, value: -1n });
    state = run(state, key("home"), key("arrow_up"));
    expect(state).toMatchObject({ active: 0n, value: -1n });
    // PageDown / PageUp jump by PAGE_SIZE (4) and clamp
    state = run(state, key("page_down"));
    expect(state).toMatchObject({ active: 4n });
    state = run(state, key("page_down"));
    expect(state).toMatchObject({ active: 5n });
    state = run(state, key("page_up"), key("page_up"));
    expect(state).toMatchObject({ active: 0n, value: -1n, open: true });
  });

  it("Enter / Space commit the active option and close the popup", () => {
    const open = run(focused, key("arrow_down"), key("arrow_down"));
    const entered = step(open, key("enter"));
    expect(entered).toMatchObject({
      open: false,
      active: -1n,
      value: 1n,
      valueChanged: true,
      focused: true,
    });

    const spaced = run(focused, key("end"), key("space"));
    expect(spaced).toMatchObject({
      open: false,
      value: 5n,
      valueChanged: true,
    });
    // committing the already-selected option reports no change
    const again = run(spaced, key("space"), key("space"));
    expect(again).toMatchObject({ value: 5n, valueChanged: false });
  });

  it("Escape closes and keeps the previous value", () => {
    const committed = run(focused, key("end"), key("enter"));
    const escaped = run(committed, key("arrow_down"), key("arrow_up"), key("escape"));
    expect(escaped).toMatchObject({
      open: false,
      active: -1n,
      value: 5n,
      valueChanged: false,
      focused: true,
    });
    // Escape on a closed combobox is a no-op
    expect(step(escaped, key("escape"))).toMatchObject({
      open: false,
      value: 5n,
    });
  });

  it("Alt+ArrowUp commits and closes while keeping DOM focus", () => {
    const open = run(focused, key("arrow_down"), key("arrow_down"));
    expect(step(open, key("alt_arrow_up"))).toMatchObject({
      open: false,
      value: 1n,
      focused: true,
      valueChanged: true,
    });
    // on a closed combobox it does nothing
    expect(step(focused, key("alt_arrow_up"))).toMatchObject({ value: -1n });
  });

  it("Tab and blur commit the active option and drop DOM focus", () => {
    const open = run(focused, key("end"));
    expect(step(open, key("tab"))).toMatchObject({
      open: false,
      value: 5n,
      focused: false,
      active: -1n,
    });
    expect(step(open, key("blur"))).toMatchObject({
      open: false,
      value: 5n,
      focused: false,
    });
    // blur of a closed combobox commits nothing
    expect(step(focused, key("blur"))).toMatchObject({ value: -1n });
  });

  it("typeahead: first match, same-letter cycling, no match", () => {
    // letters: Apple a(0); Banana, Blueberry b(1); Cherry, Cranberry c(2); Durian d(3)
    let state = step(focused, typed(1n));
    expect(state).toMatchObject({
      open: true,
      active: 1n,
      typed: 1n,
      value: -1n,
    });
    state = step(state, typed(1n));
    expect(state).toMatchObject({ active: 2n });
    state = step(state, typed(1n));
    expect(state).toMatchObject({ active: 1n });
    // a different letter jumps to its first match
    state = step(state, typed(2n));
    expect(state).toMatchObject({ active: 3n, typed: 2n });
    // an unmatched character leaves the active option alone
    state = step(state, typed(9n));
    expect(state).toMatchObject({ active: 3n, typed: 9n });
    // any other event empties the typeahead buffer
    expect(step(state, key("arrow_down"))).toMatchObject({ typed: -1n });
  });

  it("pointer: click toggles the popup, clicking an option commits", () => {
    const opened = step(initial, key("click_combobox"));
    expect(opened).toMatchObject({ open: true, focused: true, active: 0n });
    expect(step(opened, key("click_combobox"))).toMatchObject({
      open: false,
      active: -1n,
      value: -1n,
    });
    expect(step(opened, clickOption(4n))).toMatchObject({
      open: false,
      value: 4n,
      valueChanged: true,
      focused: true,
    });
    // an option click on a closed combobox is ignored
    expect(step(focused, clickOption(4n))).toMatchObject({ value: -1n });
  });

  it("set_value replaces the controlled value without touching the popup", () => {
    const open = run(focused, key("arrow_down"));
    expect(step(open, setValue(2n))).toMatchObject({
      open: true,
      active: 0n,
      value: 2n,
      valueChanged: true,
    });
  });

  it("uncontrolled, every request is accepted and commits its intent", () => {
    const opened = step(focused, key("click_combobox"));
    expect(opened).toMatchObject({
      open: true,
      outcome: "accepted",
      requested: 1n,
      base: 0n,
      requests: 1n,
    });
    // host writes still apply without a controlled value (programmatic input)
    expect(step(opened, setValue(2n))).toMatchObject({
      value: 2n,
      outcome: "none",
    });
    // hostToggle is inert without a controlled value
    expect(step(opened, key("hostToggle"))).toMatchObject({
      open: true,
      value: -1n,
      requests: 1n,
      outcome: "accepted",
    });
  });

  it("controlled, a request that the host ignores leaves the state untouched", () => {
    const controlled = step(initial, key("control"));
    expect(controlled).toMatchObject({
      controlled: true,
      valueProp: 0n,
      outcome: "none",
    });
    const clicked = step(step(controlled, key("focus")), key("click_combobox"));
    expect(clicked).toMatchObject({
      open: false,
      valueProp: 0n,
      outcome: "rejected",
      requested: 1n,
      base: 0n,
      requests: 1n,
    });
    // the host writing its own copy is the only commit while controlled
    expect(step(clicked, key("hostToggle"))).toMatchObject({
      open: true,
      valueProp: 1n,
      outcome: "none",
      requests: 1n,
    });
    expect(step(clicked, setValue(4n))).toMatchObject({
      value: 4n,
      open: false,
      valueProp: 10n,
      outcome: "none",
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = step(step(initial, key("control")), key("acceptRequests"));
    const clicked = step(step(host, key("focus")), key("click_combobox"));
    expect(clicked).toMatchObject({
      open: true,
      valueProp: 1n,
      outcome: "accepted",
      requested: 1n,
      requests: 1n,
    });
    expect(step(clicked, key("escape"))).toMatchObject({
      open: false,
      valueProp: 0n,
      outcome: "accepted",
      requests: 2n,
    });
  });

  it("derives the event alphabet from the spec pools", () => {
    const tags = new Set(eventsOf(model).map((event) => event["_tag"]));
    for (const tag of [
      "arrow_down",
      "alt_arrow_down",
      "alt_arrow_up",
      "escape",
      "type_char",
      "click_option",
      "set_value",
    ]) {
      expect(tags.has(tag)).toBe(true);
    }
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 30_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(200);
    assertReachable(report, "popup open", (s) => s["open"] === true);
    assertReachable(
      report,
      "value committed through the popup",
      (s) => s["value"] !== -1n && s["valueChanged"] === true,
    );
  });

  it("random walks never violate an invariant", () => {
    const report = simulate(model, { runs: 60, maxSteps: 80, seed: 7 });
    expect(report.violations).toEqual([]);
  });
});
