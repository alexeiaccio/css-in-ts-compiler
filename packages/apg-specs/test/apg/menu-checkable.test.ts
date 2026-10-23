import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { explore, stateKey } from "@quint-machine/core/testing";
import definitionJson from "../../src/apg/menu-checkable.model.generated.json";

// Spec-only verification for specs/apg/menu-checkable.qnt: menuitemcheckbox /
// menuitemradio state and the Enter-closes / Space-stays distinction. The
// shared harness checks every declared invariant after every step.

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
const down = tag("arrow_down");
const enter = tag("enter");
const space = tag("space");
const control = tag("control");
const acceptRequests = tag("acceptRequests");
const setValue = (v: number): Record<string, unknown> => ({
  _tag: "setValue",
  v: BigInt(v),
});

const at = (focusIdx: number, menuOpen: boolean, wrap: boolean, choice: number) => ({
  focusIdx: BigInt(focusIdx),
  menuOpen,
  wrap,
  choice: BigInt(choice),
});

describe("apg menu-checkable (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "FocusIdxInRange",
      "OpenIffFocusInMenu",
      "RadioChoiceInGroup",
      "ExactlyOneRadioChecked",
      "CheckboxCheckedIsWrap",
      "PlainItemNeverChecked",
      "LastActivatedValid",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    const base = {
      focusIdx: 7n,
      menuOpen: false,
      wrap: false,
      choice: 5n,
      lastActivated: 9n,
      controlled: false,
      accepting: false,
      valueProp: 2n,
      requested: 2n,
      outcome: "none",
      base: 2n,
      requests: 0n,
    };
    expect(violatedInvariants(model, base)).toEqual([
      "FocusIdxInRange",
      "OpenIffFocusInMenu",
      "RadioChoiceInGroup",
      "ExactlyOneRadioChecked",
      "LastActivatedValid",
    ]);
    // controlled: an event committed and the checked items left the value prop behind
    expect(
      violatedInvariants(model, {
        ...base,
        focusIdx: 0n,
        menuOpen: false,
        wrap: true,
        choice: 2n,
        lastActivated: 0n,
        controlled: true,
        valueProp: 2n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the checked items anyway
    expect(
      violatedInvariants(model, {
        ...base,
        focusIdx: 0n,
        menuOpen: false,
        wrap: true,
        choice: 2n,
        lastActivated: 0n,
        outcome: "rejected",
        base: 2n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...base,
        focusIdx: 0n,
        menuOpen: false,
        wrap: false,
        choice: 2n,
        lastActivated: 0n,
        outcome: "accepted",
        requested: 7n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("starts closed with the first radio checked and the checkbox clear", () => {
    expect(model.initial).toMatchObject(at(0, false, false, 2));
  });

  it("Down / Up Arrow on the trigger open on the first / last item", () => {
    expect(run([down])).toMatchObject(at(1, true, false, 2));
    expect(run([tag("arrow_up")])).toMatchObject(at(5, true, false, 2));
  });

  it("Enter on a menuitemcheckbox toggles it and closes the menu", () => {
    const toggled = run([down, enter]);
    expect(toggled).toMatchObject({
      ...at(0, false, true, 2),
      lastActivated: 1n,
    });
    // opened again (Enter on the trigger), toggled back
    expect(step(step(toggled, enter), enter)).toMatchObject(at(0, false, false, 2));
  });

  it("Space on a menuitemcheckbox toggles it WITHOUT closing the menu", () => {
    const once = run([down, space]);
    expect(once).toMatchObject(at(1, true, true, 2));
    expect(step(once, space)).toMatchObject(at(1, true, false, 2));
  });

  it("Space on a menuitemradio checks it and unchecks the group sibling, staying open", () => {
    const onMedium = run([down, down, down]);
    expect(onMedium).toMatchObject(at(3, true, false, 2));
    const checked = step(onMedium, space);
    expect(checked).toMatchObject(at(3, true, false, 3));
    // an already-checked radio cannot be unchecked
    expect(step(checked, space)).toMatchObject(at(3, true, false, 3));
  });

  it("Enter on a menuitemradio checks it and closes the menu", () => {
    const large = run([tag("arrow_up"), tag("arrow_up"), enter]);
    expect(large).toMatchObject({
      ...at(0, false, false, 4),
      lastActivated: 4n,
    });
  });

  it("radio choice is independent of the checkbox", () => {
    const state = run([down, space, down, down, space]);
    expect(state).toMatchObject(at(3, true, true, 3));
  });

  it("the plain item activates and closes on Enter or Space, state untouched", () => {
    const viaSpace = run([tag("arrow_up"), space]);
    expect(viaSpace).toMatchObject({
      ...at(0, false, false, 2),
      lastActivated: 5n,
    });
    const viaEnter = run([tag("arrow_up"), enter]);
    expect(viaEnter).toEqual(viaSpace);
  });

  it("Escape closes without changing any state", () => {
    const state = run([down, space, down, down, space, tag("escape")]);
    expect(state).toMatchObject(at(0, false, true, 3));
  });

  it("Home / End and wrapping stay inside the five items", () => {
    expect(run([down, tag("key_end")])).toMatchObject(at(5, true, false, 2));
    expect(run([down, tag("key_end"), down])).toMatchObject(at(1, true, false, 2));
    expect(run([down, tag("key_end"), tag("key_home")])).toMatchObject(at(1, true, false, 2));
  });

  it("uncontrolled, a check request commits its intent", () => {
    const toggled = run([down, enter]);
    expect(toggled).toMatchObject({
      wrap: true,
      outcome: "accepted",
      requested: 7n,
      base: 2n,
      requests: 1n,
    });
    // the host-side writes are inert without a controlled value
    expect(step(toggled, tag("hostToggle"))).toEqual(toggled);
    expect(model.transition(toggled, setValue(2))).toEqual(toggled);
  });

  it("controlled, a check the host ignores leaves the checked items untouched", () => {
    const requested = step(step(step(model.initial, control), down), enter);
    expect(requested).toMatchObject({
      wrap: false,
      choice: 2n,
      valueProp: 2n,
      outcome: "rejected",
      requested: 7n,
      base: 2n,
      requests: 1n,
    });
  });

  it("controlled, only the value prop commits", () => {
    const rejected = step(step(step(model.initial, control), down), enter);
    const committed = step(rejected, setValue(7));
    expect(committed).toMatchObject({
      wrap: true,
      choice: 2n,
      valueProp: 7n,
      outcome: "none",
      requests: 1n,
    });
    // adopting a state on `control` keeps what was on screen
    expect(step(run([down, enter]), control)).toMatchObject({
      wrap: true,
      valueProp: 7n,
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = step(step(model.initial, control), acceptRequests);
    const checked = step(step(host, down), space);
    expect(checked).toMatchObject({
      wrap: true,
      choice: 2n,
      valueProp: 7n,
      outcome: "accepted",
      requested: 7n,
      requests: 1n,
    });
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 7, maxStates: 50_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(20);
  });
});
