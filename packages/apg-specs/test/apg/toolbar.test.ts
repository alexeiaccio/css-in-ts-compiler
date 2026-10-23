import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { explore, stateKey } from "@quint-machine/core/testing";
import definitionJson from "../../src/apg/toolbar.model.generated.json";

// Spec-only verification for specs/apg/toolbar.qnt: the APG toolbar. The roving
// tab stop, arrows, wrap, Home/End, focus memory and Tab-escape come from the
// imported shared/focusgroup.qnt contract; the toolbar owns the delta:
// disabled-but-focusable items, embedded controls that swallow keys, activation.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const click = (state: QuintModelValue, idx: bigint) => step(state, { _tag: "click", idx });
const key = (state: QuintModelValue, k: string) => step(state, { _tag: "key", k });
const press = (state: QuintModelValue, keys: string[]) => keys.reduce(key, state);
const tab = (state: QuintModelValue, back = false) => step(state, { _tag: "tab", back });

const initial = model.initial;
const tabbedIn = step(initial, { _tag: "tabIn" });
const escape = (state: QuintModelValue) => step(state, { _tag: "escape" });
const activate = (state: QuintModelValue) => step(state, { _tag: "activate" });

describe("apg toolbar (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "ExactlyOneTabbable",
      "TabStopInRange",
      "FocusInRange",
      "FocusIsTabStop",
      "DisabledMaskValid",
      "OrientationKnown",
      "OnlyButtonsActivate",
      "ActivationLogValid",
      "ConsumedStaysEmbedded",
      "CountersNonNegative",
      "MenuOpenImpliesMenuButtonFocused",
      "MenuIndexInRange",
      "MenuButtonExpandedIffOpen",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    expect(violatedInvariants(model, { ...initial, tabStop: 7n })).toEqual([
      "ExactlyOneTabbable",
      "TabStopInRange",
    ]);
    expect(violatedInvariants(model, { ...initial, tabStop: -1n })).toEqual([
      "ExactlyOneTabbable",
      "TabStopInRange",
    ]);
    expect(violatedInvariants(model, { ...initial, focus: 5n })).toEqual([
      "FocusInRange",
      "FocusIsTabStop",
    ]);
    expect(violatedInvariants(model, { ...initial, focus: 2n })).toEqual(["FocusIsTabStop"]);
    expect(violatedInvariants(model, { ...initial, lastKeyConsumed: true })).toEqual([
      "ConsumedStaysEmbedded",
    ]);
    expect(violatedInvariants(model, { ...initial, lastActivated: 2n })).toEqual([
      "OnlyButtonsActivate",
    ]);
    expect(
      violatedInvariants(model, {
        ...initial,
        menuOpen: true,
        focus: 1n,
        tabStop: 1n,
      }),
    ).toEqual(["MenuOpenImpliesMenuButtonFocused"]);
    expect(violatedInvariants(model, { ...initial, menuIndex: 3n })).toEqual(["MenuIndexInRange"]);
    expect(violatedInvariants(model, { ...initial, menuOpen: true, menuIndex: 7n })).toEqual([
      "MenuOpenImpliesMenuButtonFocused",
      "MenuIndexInRange",
    ]);
  });

  it("starts with one tab stop, focus outside, menu closed", () => {
    expect(initial).toMatchObject({
      focus: -1n,
      tabStop: 0n,
      orientation: "horizontal",
      wrap: false,
      menuOpen: false,
      menuIndex: 0n,
    });
  });

  it("Tab enters on the tab stop; arrows rove it", () => {
    expect(tabbedIn).toMatchObject({ focus: 0n, tabStop: 0n });
    const moved = key(tabbedIn, "Right");
    expect(moved).toMatchObject({ focus: 1n, tabStop: 1n });
    expect(key(moved, "Left")).toMatchObject({ focus: 0n, tabStop: 0n });
  });

  it("arrows follow the orientation; perpendicular arrows are ignored off the menu-button", () => {
    const onButton = click(initial, 1n);
    expect(key(onButton, "Down")).toMatchObject({ focus: 1n });
    expect(key(onButton, "Up")).toMatchObject({ focus: 1n });
    const vertical = step(onButton, { _tag: "flipOrientation" });
    expect(key(vertical, "Down")).toMatchObject({ focus: 2n });
    expect(key(vertical, "Right")).toMatchObject({ focus: 1n });
  });

  it("menu-button: Enter/Space open the menu on the first item", () => {
    const open = activate(tabbedIn);
    expect(open).toMatchObject({
      focus: 0n,
      tabStop: 0n,
      menuOpen: true,
      menuIndex: 0n,
      activations: 0n,
      lastActivated: -1n,
    });
  });

  it("menu-button: the perpendicular key opens; Down stays navigation vertically", () => {
    // horizontal: Down opens on the first item, Up on the last
    expect(key(tabbedIn, "Down")).toMatchObject({
      focus: 0n,
      menuOpen: true,
      menuIndex: 0n,
    });
    expect(key(tabbedIn, "Up")).toMatchObject({
      focus: 0n,
      menuOpen: true,
      menuIndex: 2n,
    });
    // vertical: Right opens on the first, Left on the last, and Down keeps roving
    const vertical = step(tabbedIn, { _tag: "flipOrientation" });
    expect(key(vertical, "Right")).toMatchObject({
      focus: 0n,
      menuOpen: true,
      menuIndex: 0n,
    });
    expect(key(vertical, "Left")).toMatchObject({
      focus: 0n,
      menuOpen: true,
      menuIndex: 2n,
    });
    expect(key(vertical, "Down")).toMatchObject({
      focus: 1n,
      menuOpen: false,
    });
  });

  it("menu-button: while open the menu owns the arrows, Home/End jump", () => {
    const open = activate(tabbedIn);
    const moved = key(open, "Down");
    expect(moved).toMatchObject({
      focus: 0n,
      tabStop: 0n,
      menuOpen: true,
      menuIndex: 1n,
    });
    expect(key(moved, "Down")).toMatchObject({ menuIndex: 2n });
    expect(key(key(moved, "Down"), "Up")).toMatchObject({ menuIndex: 1n });
    expect(key(moved, "End")).toMatchObject({ menuIndex: 2n });
    expect(key(moved, "Home")).toMatchObject({ menuIndex: 0n });
    // a perpendicular key is not a menu key: it pins the menu, not the toolbar
    const horizontalOnly = key(open, "Left");
    expect(horizontalOnly).toMatchObject({
      focus: 0n,
      menuOpen: true,
      menuIndex: 0n,
    });
  });

  it("menu-button: Escape and Enter close and return focus to the trigger", () => {
    const open = key(activate(tabbedIn), "Down");
    expect(escape(open)).toMatchObject({
      focus: 0n,
      tabStop: 0n,
      menuOpen: false,
      menuIndex: 0n,
    });
    expect(activate(open)).toMatchObject({
      focus: 0n,
      tabStop: 0n,
      menuOpen: false,
      menuIndex: 0n,
    });
  });

  it("menu-button: Tab while open closes and leaves the toolbar", () => {
    const open = key(activate(tabbedIn), "Down");
    expect(tab(open)).toMatchObject({
      focus: -1n,
      tabStop: 0n,
      menuOpen: false,
    });
  });

  it("stops at the ends without wrap and wraps with it", () => {
    const atEnd = key(tabbedIn, "End");
    expect(atEnd).toMatchObject({ focus: 4n, tabStop: 4n });
    expect(key(atEnd, "Right")).toMatchObject({ focus: 4n });
    expect(key(tabbedIn, "Left")).toMatchObject({ focus: 0n });

    const wrapping = step(tabbedIn, { _tag: "flipWrap" });
    expect(key(wrapping, "Left")).toMatchObject({ focus: 4n });
    expect(key(step(wrapping, { _tag: "key", k: "End" }), "Right")).toMatchObject({
      focus: 0n,
      tabStop: 0n,
    });
  });

  it("Home and End jump to the first and last item", () => {
    const middle = click(initial, 1n);
    expect(key(middle, "End")).toMatchObject({ focus: 4n });
    expect(key(key(middle, "End"), "Home")).toMatchObject({ focus: 0n });
  });

  it("remembers the last focused item when re-entering", () => {
    const away = step(key(key(tabbedIn, "Right"), "Right"), { _tag: "leave" });
    expect(away).toMatchObject({ focus: -1n, tabStop: 2n });
    expect(step(away, { _tag: "tabIn" })).toMatchObject({ focus: 2n });
    // Tab while already inside does not move focus
    expect(step(tabbedIn, { _tag: "tabIn" })).toMatchObject({ focus: 0n });
  });

  it("keys outside the toolbar do nothing", () => {
    expect(key(initial, "Right")).toEqual(initial);
    expect(key(initial, "End")).toEqual(initial);
  });

  it("disabled items stay focusable but never activate", () => {
    // item 1 is a button; disable it, then rove onto it
    const disabled = step(tabbedIn, { _tag: "toggleDisabled", idx: 1n });
    expect(disabled).toMatchObject({ disabledMask: 2n, focus: 0n });
    const onIt = key(disabled, "Right");
    expect(onIt).toMatchObject({ focus: 1n, tabStop: 1n });
    expect(step(onIt, { _tag: "activate" })).toMatchObject({
      activations: 0n,
      lastActivated: -1n,
    });
    expect(click(disabled, 1n)).toMatchObject({
      focus: 1n,
      tabStop: 1n,
      activations: 0n,
    });
    // disabling the focused item does not move focus or the tab stop
    const underFocus = step(onIt, { _tag: "toggleDisabled", idx: 1n });
    expect(underFocus).toMatchObject({
      disabledMask: 0n,
      focus: 1n,
      tabStop: 1n,
    });
    const reDisabled = step(underFocus, { _tag: "toggleDisabled", idx: 1n });
    expect(reDisabled).toMatchObject({
      disabledMask: 2n,
      focus: 1n,
      tabStop: 1n,
    });
  });

  it("activates enabled buttons by Enter/Space and click", () => {
    const onButton = key(tabbedIn, "Right");
    const pressed = step(onButton, { _tag: "activate" });
    expect(pressed).toMatchObject({
      activations: 1n,
      lastActivated: 1n,
      menuOpen: false,
    });
    const clicked = click(pressed, 4n);
    expect(clicked).toMatchObject({ activations: 2n, lastActivated: 4n });
  });

  it("a text field swallows Left/Right/Home/End in a horizontal toolbar", () => {
    const inText = click(initial, 2n);
    for (const k of ["Left", "Right", "Home", "End"]) {
      expect(key(inText, k)).toMatchObject({
        focus: 2n,
        tabStop: 2n,
        consumed: 1n,
        lastKeyConsumed: true,
      });
    }
    // Up/Down are not toolbar keys in a horizontal toolbar: ignored, not swallowed
    expect(key(inText, "Down")).toMatchObject({
      focus: 2n,
      consumed: 0n,
      lastKeyConsumed: false,
    });
    // activation keys belong to the text field too
    expect(step(inText, { _tag: "activate" })).toMatchObject({
      activations: 0n,
    });
  });

  it("a spinbutton only blocks the toolbar when the toolbar is vertical", () => {
    const inSpin = click(initial, 3n);
    // horizontal: Left/Right still leave the spinbutton
    expect(key(inSpin, "Right")).toMatchObject({ focus: 4n, consumed: 0n });
    expect(key(inSpin, "Left")).toMatchObject({ focus: 2n, consumed: 0n });
    // vertical: Up/Down are the spinbutton's, focus is pinned
    const vertical = step(inSpin, { _tag: "flipOrientation" });
    expect(key(vertical, "Down")).toMatchObject({
      focus: 3n,
      consumed: 1n,
      lastKeyConsumed: true,
    });
    expect(key(vertical, "Up")).toMatchObject({ focus: 3n, consumed: 1n });
    expect(key(vertical, "Home")).toMatchObject({ focus: 3n, consumed: 1n });
  });

  it("a vertical toolbar: a text field swallows Up/Down/Home/End, not Left/Right", () => {
    const vertical = step(click(initial, 2n), { _tag: "flipOrientation" });
    for (const k of ["Up", "Down", "Home", "End"]) {
      expect(key(vertical, k)).toMatchObject({
        focus: 2n,
        consumed: 1n,
        lastKeyConsumed: true,
      });
    }
    expect(key(vertical, "Left")).toMatchObject({
      focus: 2n,
      consumed: 0n,
      lastKeyConsumed: false,
    });
  });

  it("Tab enters on the remembered item from either direction", () => {
    expect(tab(initial)).toMatchObject({ focus: 0n, tabStop: 0n });
    const away = step(click(initial, 3n), { _tag: "leave" });
    expect(tab(away)).toMatchObject({ focus: 3n });
    expect(tab(away, true)).toMatchObject({ focus: 3n });
  });

  it("Tab on a button or custom spinbutton leaves the toolbar, memory kept", () => {
    const onButton = key(tabbedIn, "Right");
    expect(tab(onButton)).toMatchObject({ focus: -1n, tabStop: 1n });
    expect(tab(onButton, true)).toMatchObject({ focus: -1n, tabStop: 1n });
    // a role=spinbutton div is not a native key-conflict control
    expect(tab(click(initial, 3n))).toMatchObject({ focus: -1n, tabStop: 3n });
  });

  it("Tab steps out of a native text field to the neighbouring item", () => {
    const inText = click(initial, 2n);
    expect(tab(inText)).toMatchObject({ focus: 3n, tabStop: 3n });
    expect(tab(inText, true)).toMatchObject({ focus: 1n, tabStop: 1n });
    // the neighbour is a normal item again: the next Tab leaves
    expect(tab(tab(inText))).toMatchObject({ focus: -1n, tabStop: 3n });
  });

  it("Tab out of an embedded control by focus loss keeps the memory", () => {
    const left = step(click(initial, 2n), { _tag: "leave" });
    expect(left).toMatchObject({
      focus: -1n,
      tabStop: 2n,
      lastKeyConsumed: false,
    });
    expect(step(left, { _tag: "tabIn" })).toMatchObject({ focus: 2n });
  });

  it("a walk across all items keeps exactly one tab stop", () => {
    const end = press(tabbedIn, ["Right", "Right", "Right", "Right", "Right"]);
    // text swallows the third Right, so focus is pinned on it
    expect(end).toMatchObject({ focus: 2n, consumed: 3n });
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 5, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(100);
  });
});
