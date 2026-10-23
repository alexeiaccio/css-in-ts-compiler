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
import definitionJson from "../../src/apg/combobox-tree.model.generated.json";

// Spec-only verification for specs/apg/combobox-tree.qnt (APG combobox with a
// tree popup). Events come from the spec's own pools; every declared invariant
// is checked after every step.
//
// Tree: 0 Fruits {1 Apple, 2 Banana}, 3 Vegetables {4 Carrot, 5 Dill}, 6 Water.

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
const clickNode = (n: bigint) => ({ _tag: "click_node", n });
const setValue = (n: bigint) => ({ _tag: "set_value", n });
const setLabelMode = (v: bigint) => ({ _tag: "set_label_mode", v });

const initial = model.initial;
const all = run(initial, key("focus"));
const sticky = run(initial, setLabelMode(1n), key("focus"));
const cleared = run(initial, setLabelMode(2n), key("focus"));
const on = (active: bigint, selected: bigint) => ({
  open: true,
  active,
  selected,
});

describe("apg combobox-tree (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "ActiveNodeIsVisibleInOpenPopup",
      "DomFocusStaysOnCombobox",
      "SelectionIsSingleAndSelectable",
      "SelectionFollowsFocus",
      "AriaContractConsistent",
      "EscapeOnOpenPopupKeepsValue",
      "NavigationKeepsValue",
      "ValueChangesOnlyOnCommitOrEdit",
      "PickedIsSelectable",
      "FocusLossClosesPopup",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    // focus on a node hidden inside a collapsed parent
    expect(
      violatedInvariants(model, {
        ...initial,
        ...on(1n, 1n),
        focused: true,
      }),
    ).toEqual(["ActiveNodeIsVisibleInOpenPopup"]);
    // activedescendant on a closed popup, popup open without DOM focus
    expect(violatedInvariants(model, { ...initial, active: 0n, selected: 0n })).toEqual([
      "ActiveNodeIsVisibleInOpenPopup",
      "SelectionIsSingleAndSelectable",
      "AriaContractConsistent",
    ]);
    expect(violatedInvariants(model, { ...initial, open: true })).toEqual([
      "DomFocusStaysOnCombobox",
    ]);
    // selection that did not follow focus (variant 0)
    expect(violatedInvariants(model, { ...initial, ...on(3n, 0n), focused: true })).toEqual([
      "SelectionFollowsFocus",
    ]);
    // a label selected under the "labels" variants
    expect(
      violatedInvariants(model, {
        ...initial,
        labelMode: 2n,
        ...on(0n, 0n),
        focused: true,
      }),
    ).toEqual(["SelectionIsSingleAndSelectable", "SelectionFollowsFocus"]);
    // selection kept on a label under variant 2 (must be cleared)
    expect(
      violatedInvariants(model, {
        ...initial,
        labelMode: 2n,
        e0: true,
        ...on(0n, 1n),
        focused: true,
      }),
    ).toEqual(["SelectionFollowsFocus"]);
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
        lastEvent: "arrow_right",
        valueChanged: true,
      }),
    ).toEqual(["NavigationKeepsValue", "ValueChangesOnlyOnCommitOrEdit"]);
    // a category label committed under variant 1
    expect(violatedInvariants(model, { ...initial, labelMode: 1n, picked: 3n })).toEqual([
      "PickedIsSelectable",
    ]);
    expect(
      violatedInvariants(model, {
        ...initial,
        lastEvent: "blur",
        focused: true,
      }),
    ).toEqual(["FocusLossClosesPopup"]);
    // an event committed while controlled: the picked node left the prop
    expect(
      violatedInvariants(model, {
        ...initial,
        controlled: true,
        valueProp: -1n,
        picked: 1n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the picked node anyway
    expect(
      violatedInvariants(model, {
        ...initial,
        controlled: true,
        outcome: "rejected",
        base: -1n,
        picked: 1n,
        valueProp: 1n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "accepted",
        requested: 1n,
        picked: -1n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("ignores keys while DOM focus is elsewhere", () => {
    expect(step(initial, key("arrow_down"))).toMatchObject({
      open: false,
      active: -1n,
    });
    expect(step(initial, key("type_char"))).toMatchObject({ open: false });
  });

  describe("every node selectable (variant 0)", () => {
    it("opens on the first / last node; selection follows focus", () => {
      expect(step(all, key("arrow_down"))).toMatchObject({
        ...on(0n, 0n),
        focused: true,
      });
      expect(step(all, key("arrow_up"))).toMatchObject(on(6n, 6n));
    });

    it("Down / Up skip hidden children and stop at the ends", () => {
      let state = run(all, key("arrow_down"), key("arrow_down"));
      expect(state).toMatchObject(on(3n, 3n));
      state = run(state, key("arrow_down"), key("arrow_down"));
      expect(state).toMatchObject(on(6n, 6n));
      state = run(state, key("arrow_up"), key("arrow_up"), key("arrow_up"));
      expect(state).toMatchObject(on(0n, 0n));
    });

    it("Right expands in place, then enters the children", () => {
      let state = run(all, key("arrow_down"), key("arrow_right"));
      // focus and selection do not move
      expect(state).toMatchObject({ ...on(0n, 0n), e0: true, e3: false });
      state = run(state, key("arrow_down"));
      expect(state).toMatchObject(on(1n, 1n));
      // Right on a leaf does nothing
      expect(step(state, key("arrow_right"))).toMatchObject(on(1n, 1n));
      const again = run(all, key("arrow_down"), key("arrow_right"), key("arrow_right"));
      expect(again).toMatchObject(on(1n, 1n));
    });

    it("Left collapses an open parent, otherwise goes to the parent", () => {
      const child = run(all, key("arrow_down"), key("arrow_right"), key("arrow_down"));
      expect(child).toMatchObject({ ...on(1n, 1n), e0: true });
      const parent = step(child, key("arrow_left"));
      expect(parent).toMatchObject({ ...on(0n, 0n), e0: true });
      expect(step(parent, key("arrow_left"))).toMatchObject({
        ...on(0n, 0n),
        e0: false,
      });
      // a root that is closed / a leaf root: nothing happens
      expect(run(all, key("arrow_down"), key("arrow_left"))).toMatchObject(on(0n, 0n));
      expect(run(all, key("arrow_up"), key("arrow_left"))).toMatchObject(on(6n, 6n));
    });

    it("Home / End focus the first / last visible node", () => {
      // closed: Home / End are text-editing keys and do nothing
      expect(run(all, key("end"), key("home"))).toMatchObject({
        open: false,
        active: -1n,
      });
      const state = run(all, key("arrow_down"), key("end"), key("home"));
      expect(state).toMatchObject(on(0n, 0n));
      const expanded = run(
        all,
        key("arrow_down"),
        key("arrow_down"),
        key("arrow_right"),
        key("end"),
      );
      expect(expanded).toMatchObject({ ...on(6n, 6n), e3: true });
    });

    it("Left / Right are inert while the visual focus is on the textbox", () => {
      const open = run(all, key("type_char"));
      expect(open).toMatchObject({ open: true, active: -1n });
      for (const tag of ["arrow_left", "arrow_right"]) {
        expect(step(open, key(tag))).toMatchObject({ active: -1n, e0: false });
      }
      // Home / End on an open tree focus a node (tree pattern)
      expect(step(open, key("home"))).toMatchObject(on(0n, 0n));
    });

    it("Enter commits the selected node and closes the popup", () => {
      const committed = run(all, key("arrow_down"), key("arrow_down"), key("enter"));
      expect(committed).toMatchObject({
        open: false,
        active: -1n,
        selected: -1n,
        picked: 3n,
        valueChanged: true,
        focused: true,
      });
      // Enter with the visual focus on the textbox does nothing
      const textbox = run(all, key("type_char"), key("enter"));
      expect(textbox).toMatchObject({ open: true, picked: -1n });
    });
  });

  describe("parents are category labels", () => {
    it("variant 1 keeps the previous selection while a label is focused", () => {
      let state = run(sticky, key("arrow_down"));
      // a label focused with nothing selected before: nothing selected
      expect(state).toMatchObject(on(0n, -1n));
      state = run(state, key("arrow_right"), key("arrow_down"));
      expect(state).toMatchObject(on(1n, 1n));
      // back onto the label: the previous selection stays
      state = run(state, key("arrow_up"));
      expect(state).toMatchObject(on(0n, 1n));
      state = run(state, key("arrow_down"), key("arrow_down"));
      expect(state).toMatchObject(on(2n, 2n));
      // Enter accepts the selected value
      expect(step(state, key("enter"))).toMatchObject({
        picked: 2n,
        open: false,
      });
      // Enter while a label is focused accepts the previously selected node
      const onLabel = run(
        sticky,
        key("arrow_down"),
        key("arrow_right"),
        key("arrow_down"),
        key("arrow_up"),
      );
      expect(step(onLabel, key("enter"))).toMatchObject({
        picked: 1n,
        open: false,
      });
    });

    it("variant 2 clears the selection on a label; Enter then does nothing", () => {
      let state = run(cleared, key("arrow_down"), key("arrow_right"), key("arrow_down"));
      expect(state).toMatchObject(on(1n, 1n));
      state = run(state, key("arrow_up"));
      expect(state).toMatchObject(on(0n, -1n));
      expect(step(state, key("enter"))).toMatchObject({
        open: true,
        picked: -1n,
        valueChanged: false,
      });
    });

    it("Left onto a label parent applies the variant rule", () => {
      const child = run(sticky, key("arrow_down"), key("arrow_right"), key("arrow_down"));
      expect(step(child, key("arrow_left"))).toMatchObject(on(0n, 1n));
      const childCleared = run(cleared, key("arrow_down"), key("arrow_right"), key("arrow_down"));
      expect(step(childCleared, key("arrow_left"))).toMatchObject(on(0n, -1n));
    });
  });

  it("Escape closes an open popup keeping the value, then clears the textbox", () => {
    const committed = run(all, key("arrow_down"), key("enter"));
    const open = run(committed, key("arrow_down"), key("arrow_down"));
    const closed = step(open, key("escape"));
    expect(closed).toMatchObject({
      open: false,
      active: -1n,
      selected: -1n,
      picked: 0n,
      valueChanged: false,
      wasOpen: true,
    });
    expect(step(closed, key("escape"))).toMatchObject({
      picked: -1n,
      valueChanged: true,
    });
    expect(step(all, key("escape"))).toMatchObject({ valueChanged: false });
  });

  it("typing returns visual focus to the textbox and un-commits the value", () => {
    const committed = run(all, key("arrow_down"), key("enter"));
    const typed = run(committed, key("arrow_down"), key("type_char"));
    expect(typed).toMatchObject({
      open: true,
      active: -1n,
      selected: -1n,
      picked: -1n,
    });
    expect(step(committed, key("type_char"))).toMatchObject({
      open: true,
      valueChanged: true,
    });
  });

  it("blur and Tab close the popup and commit nothing", () => {
    const open = run(all, key("arrow_down"), key("arrow_right"));
    for (const tag of ["blur", "tab"]) {
      expect(step(open, key(tag))).toMatchObject({
        open: false,
        active: -1n,
        selected: -1n,
        picked: -1n,
        focused: false,
      });
    }
    // expansion state survives closing the popup
    expect(step(open, key("blur"))).toMatchObject({ e0: true });
  });

  it("pointer: click toggles; nodes commit, labels toggle and take the focus", () => {
    const opened = step(initial, key("click_input"));
    expect(opened).toMatchObject({ open: true, focused: true, active: -1n });
    expect(step(opened, key("click_input"))).toMatchObject({ open: false });
    // variant 0: a parent is a selectable value
    expect(step(opened, clickNode(3n))).toMatchObject({
      open: false,
      picked: 3n,
      valueChanged: true,
    });
    // hidden nodes cannot be clicked; neither can nodes of a closed popup
    expect(step(opened, clickNode(1n))).toMatchObject({
      open: true,
      picked: -1n,
    });
    expect(step(all, clickNode(6n))).toMatchObject({ picked: -1n });
    expect(step(opened, clickNode(6n))).toMatchObject({
      picked: 6n,
      open: false,
    });
    // label variants: a click toggles the parent and focuses it
    const label = run(sticky, key("click_input"));
    const toggled = step(label, clickNode(0n));
    expect(toggled).toMatchObject({ e0: true, ...on(0n, -1n), picked: -1n });
    expect(step(toggled, clickNode(0n))).toMatchObject({ e0: false });
    const leaf = run(toggled, clickNode(2n));
    expect(leaf).toMatchObject({ open: false, picked: 2n, e0: true });
  });

  it("prop changes close the popup; labels cannot be committed", () => {
    const open = run(all, key("arrow_down"), key("arrow_right"));
    expect(step(open, setValue(5n))).toMatchObject({
      open: false,
      active: -1n,
      selected: -1n,
      picked: 5n,
    });
    const picked = run(all, setValue(3n));
    expect(picked).toMatchObject({ picked: 3n });
    // switching to a label variant drops a now non-selectable value
    expect(step(picked, setLabelMode(1n))).toMatchObject({
      labelMode: 1n,
      picked: -1n,
      valueChanged: true,
    });
    expect(step(run(all, setValue(6n)), setLabelMode(1n))).toMatchObject({
      picked: 6n,
      valueChanged: false,
    });
    // a label value is ignored under the label variants
    expect(step(sticky, setValue(0n))).toMatchObject({
      picked: -1n,
      valueChanged: false,
    });
  });

  it("uncontrolled, a commit request is accepted and commits its intent", () => {
    const committed = run(all, key("arrow_down"), key("enter"));
    expect(committed).toMatchObject({
      picked: 0n,
      outcome: "accepted",
      requested: 0n,
      base: -1n,
      requests: 1n,
    });
  });

  it("controlled, a rejected commit leaves the value untouched", () => {
    const controlled = step(initial, key("control"));
    const committed = run(step(controlled, key("focus")), key("arrow_down"), key("enter"));
    expect(committed).toMatchObject({
      picked: -1n,
      valueProp: -1n,
      outcome: "rejected",
      requested: 0n,
      requests: 1n,
    });
    // the host writing its own copy is the only commit while controlled
    expect(step(committed, key("hostToggle"))).toMatchObject({
      picked: 1n,
      valueProp: 1n,
      outcome: "none",
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = step(step(initial, key("control")), key("acceptRequests"));
    const committed = run(step(host, key("focus")), key("arrow_down"), key("enter"));
    expect(committed).toMatchObject({
      picked: 0n,
      valueProp: 0n,
      outcome: "accepted",
      requested: 0n,
      requests: 1n,
    });
  });

  it("derives the event alphabet from the spec pools", () => {
    const events = eventsOf(model);
    expect(events.filter((e) => e["_tag"] === "click_node")).toHaveLength(7);
    expect(events.filter((e) => e["_tag"] === "set_label_mode")).toHaveLength(3);
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 40_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(300);
    assertReachable(report, "child focused", (s) => s["active"] === 1n);
    assertReachable(
      report,
      "sticky selection kept on a label",
      (s) => s["labelMode"] === 1n && s["active"] === 0n && s["selected"] !== -1n,
    );
    assertReachable(report, "node committed", (s) => s["picked"] !== -1n);
  });

  it("random walks never violate an invariant", () => {
    const report = simulate(model, { runs: 80, maxSteps: 100, seed: 3 });
    expect(report.violations).toEqual([]);
  });
});
