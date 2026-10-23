import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { explore, stateKey } from "@quint-machine/core/testing";
import definitionJson from "../../src/apg/menu-button.model.generated.json";

// Spec-only verification for specs/apg/menu-button.qnt: the APG menu button
// opening a flat menu (first/last item focus, typeahead, disabled item, focus
// return). The shared harness checks every declared invariant after every step.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const run = (events: ReadonlyArray<Record<string, unknown>>): QuintModelValue =>
  events.reduce(step, model.initial);

const tag = (name: string): Record<string, unknown> => ({ _tag: name });
const enter = { _tag: "activate", key: "Enter" };
const space = { _tag: "activate", key: "Space" };
const type = (ch: number): Record<string, unknown> => ({
  _tag: "typeahead",
  ch: BigInt(ch),
});

const onButton = [tag("focus_in")];

const at = (focusLevel: number, focusIdx: number, menuOpen: boolean) => ({
  focusLevel: BigInt(focusLevel),
  focusIdx: BigInt(focusIdx),
  menuOpen,
});

describe("apg menu-button (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "LevelValid",
      "ExpandedIffFocusInMenu",
      "FocusIdxInRange",
      "DisabledNeverActivated",
      "ActiveDescendantMatchesFocus",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    const base = {
      focusLevel: 1n,
      focusIdx: 2n,
      menuOpen: true,
      lastActivated: 3n,
      controlled: false,
      accepting: false,
      valueProp: false,
      requested: false,
      outcome: "none",
      base: false,
      requests: 0n,
    };
    expect(violatedInvariants(model, base)).toEqual([
      "ExpandedIffFocusInMenu",
      "FocusIdxInRange",
      "DisabledNeverActivated",
      "ActiveDescendantMatchesFocus",
    ]);
    // controlled: an event committed and the state left the value prop behind
    expect(
      violatedInvariants(model, {
        ...base,
        focusLevel: 2n,
        focusIdx: 1n,
        menuOpen: true,
        lastActivated: 0n,
        controlled: true,
        valueProp: false,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the state anyway
    expect(
      violatedInvariants(model, {
        ...base,
        focusLevel: 2n,
        focusIdx: 1n,
        menuOpen: true,
        lastActivated: 0n,
        outcome: "rejected",
        base: false,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...base,
        focusLevel: 1n,
        focusIdx: 0n,
        menuOpen: false,
        lastActivated: 0n,
        outcome: "accepted",
        requested: true,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("Enter and Space open the menu on the first item", () => {
    expect(run([...onButton, enter])).toMatchObject(at(2, 1, true));
    expect(run([...onButton, space])).toMatchObject(at(2, 1, true));
  });

  it("Down Arrow opens on the first item, Up Arrow on the last", () => {
    expect(run([...onButton, tag("arrow_down")])).toMatchObject(at(2, 1, true));
    expect(run([...onButton, tag("arrow_up")])).toMatchObject(at(2, 4, true));
  });

  it("arrows wrap inside the open menu, Home/End jump", () => {
    const open = [...onButton, tag("arrow_down")];
    expect(run([...open, tag("arrow_up")])).toMatchObject(at(2, 4, true));
    expect(run([...open, tag("arrow_up"), tag("arrow_down")])).toMatchObject(at(2, 1, true));
    expect(run([...open, tag("key_end")])).toMatchObject(at(2, 4, true));
    expect(run([...open, tag("key_end"), tag("key_home")])).toMatchObject(at(2, 1, true));
  });

  it("Escape closes the menu and returns focus to the button", () => {
    expect(run([...onButton, enter, tag("escape")])).toMatchObject(at(1, 0, false));
  });

  it("activating an item closes the menu, returns focus and records it", () => {
    const fired = run([...onButton, enter, tag("arrow_down"), enter]);
    expect(fired).toMatchObject({ ...at(1, 0, false), lastActivated: 2n });
  });

  it("a disabled item is focusable but cannot be activated", () => {
    const onDisabled = run([...onButton, enter, tag("arrow_down"), tag("arrow_down")]);
    expect(onDisabled).toMatchObject(at(2, 3, true));

    const after = step(onDisabled, enter);
    expect(after).toMatchObject({ ...at(2, 3, true), lastActivated: 0n });
    expect(step(onDisabled, space)).toEqual(after);
  });

  it("typeahead focuses the next matching item, wrapping, else stays", () => {
    const open = [...onButton, enter];
    expect(run([...open, type(1)])).toMatchObject(at(2, 3, true));
    expect(run([...open, type(2)])).toMatchObject(at(2, 2, true));
    expect(run([...open, type(2), type(2)])).toMatchObject(at(2, 4, true));
    expect(run([...open, type(3)])).toMatchObject(at(2, 1, true));
    // inert while closed
    expect(run([...onButton, type(1)])).toMatchObject(at(1, 0, false));
  });

  it("Tab closes the menu and moves focus out; click toggles", () => {
    expect(run([...onButton, enter, tag("tab_out")])).toMatchObject(at(0, 0, false));
    expect(run([tag("click_button")])).toMatchObject(at(2, 1, true));
    expect(run([tag("click_button"), tag("click_button")])).toMatchObject(at(1, 0, false));
  });

  it("events are inert while focus is outside the widget", () => {
    for (const event of [tag("arrow_down"), tag("escape"), enter, type(1), tag("key_end")]) {
      expect(step(model.initial, event)).toEqual(model.initial);
    }
  });

  it("uncontrolled, a request commits its intent", () => {
    const opened = run([...onButton, enter]);
    expect(opened).toMatchObject({
      menuOpen: true,
      outcome: "accepted",
      requested: true,
      base: false,
      requests: 1n,
    });
    // the host-side writes are inert without a controlled value
    expect(step(opened, tag("hostToggle"))).toEqual(opened);
    expect(model.transition(opened, { _tag: "setValue", v: false })).toEqual(opened);
  });

  it("controlled, a request the host ignores leaves the state untouched", () => {
    const controlled = step(model.initial, tag("control"));
    const requested = step(step(controlled, tag("focus_in")), enter);
    expect(requested).toMatchObject({
      menuOpen: false,
      focusLevel: 1n,
      valueProp: false,
      outcome: "rejected",
      requested: true,
      base: false,
      requests: 1n,
    });
    // a redundant request is not a request
    expect(step(controlled, tag("escape"))).toEqual(controlled);
  });

  it("controlled, only the value prop commits", () => {
    const rejected = step(step(step(model.initial, tag("control")), tag("focus_in")), enter);
    const committed = step(rejected, { _tag: "setValue", v: true });
    expect(committed).toMatchObject({
      menuOpen: true,
      focusLevel: 2n,
      focusIdx: 1n,
      valueProp: true,
      outcome: "none",
      requests: 1n,
    });
    // adopting a state on `control` keeps what was on screen
    expect(step(run([...onButton, enter]), tag("control"))).toMatchObject({
      menuOpen: true,
      valueProp: true,
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = step(step(model.initial, tag("control")), tag("acceptRequests"));
    const opened = step(step(host, tag("focus_in")), enter);
    expect(opened).toMatchObject({
      menuOpen: true,
      focusLevel: 2n,
      valueProp: true,
      outcome: "accepted",
      requested: true,
      requests: 1n,
    });
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 50_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(8);
  });
});
