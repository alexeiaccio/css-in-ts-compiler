import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { explore, stateKey } from "@quint-machine/core/testing";
import definitionJson from "../../src/apg/spinbutton.model.generated.json";

// Spec-only verification for specs/apg/spinbutton.qnt: the APG spinbutton
// pattern (keyboard stepping, typed draft commit/revert, clamp vs wrap).

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const run = (state: QuintModelValue, ...events: Record<string, unknown>[]): QuintModelValue =>
  events.reduce(step, state);

const initial = model.initial;
const focused = step(initial, { _tag: "focus" });
const type = (text: string) => ({ _tag: "typeText", text });

describe("apg spinbutton (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "ValueInRange",
      "AriaNowWithinBounds",
      "AriaBoundsMatchRange",
      "ButtonsOutOfTabOrder",
      "DraftOnlyWhileEditing",
      "EditingImpliesFocus",
      "InvalidImpliesEditing",
      "WrapResultMatchesMode",
      "DisabledOnlyAtBound",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    expect(violatedInvariants(model, { ...initial, value: 13n })).toEqual([
      "ValueInRange",
      "AriaNowWithinBounds",
    ]);
    expect(violatedInvariants(model, { ...initial, draft: "5" })).toEqual([
      "DraftOnlyWhileEditing",
    ]);
    expect(violatedInvariants(model, { ...initial, editing: true })).toEqual([
      "EditingImpliesFocus",
    ]);
    expect(violatedInvariants(model, { ...initial, result: "wrapped" })).toEqual([
      "WrapResultMatchesMode",
    ]);
    expect(violatedInvariants(model, { ...initial, wrap: true, result: "clamped" })).toEqual([
      "WrapResultMatchesMode",
    ]);
    // an event committed while controlled: the value left the value prop behind
    expect(
      violatedInvariants(model, {
        ...initial,
        controlled: true,
        valueProp: 0n,
        value: 5n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the value anyway
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "rejected",
        base: 0n,
        value: 5n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "accepted",
        requested: 0n,
        value: 5n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("starts in range, unfocused, clamping", () => {
    expect(initial).toMatchObject({
      value: 5n,
      focused: false,
      editing: false,
      draft: "",
      wrap: false,
    });
  });

  it("keys do nothing until the text field has focus", () => {
    const idle = step(initial, { _tag: "arrowUp" });
    expect(idle).toMatchObject({ value: 5n, result: "none" });
    expect(step(initial, { _tag: "end" })).toMatchObject({ value: 5n });
    expect(step(initial, type("12"))).toMatchObject({
      editing: false,
      draft: "",
    });
  });

  it("Up/Down step by one, Page Up/Down by the larger step", () => {
    expect(step(focused, { _tag: "arrowUp" })).toMatchObject({
      value: 6n,
      result: "stepped",
    });
    expect(step(focused, { _tag: "arrowDown" })).toMatchObject({ value: 4n });
    expect(step(focused, { _tag: "pageUp" })).toMatchObject({ value: 8n });
    expect(step(focused, { _tag: "pageDown" })).toMatchObject({ value: 2n });
  });

  it("Home and End jump to min and max", () => {
    expect(step(focused, { _tag: "home" })).toMatchObject({
      value: 1n,
      result: "jumped",
    });
    expect(step(focused, { _tag: "end" })).toMatchObject({ value: 12n });
  });

  it("clamps at the bounds by default", () => {
    const top = step(focused, { _tag: "end" });
    expect(step(top, { _tag: "arrowUp" })).toMatchObject({
      value: 12n,
      result: "clamped",
    });
    expect(step(top, { _tag: "pageUp" })).toMatchObject({ value: 12n });
    const bottom = step(focused, { _tag: "home" });
    expect(step(bottom, { _tag: "arrowDown" })).toMatchObject({
      value: 1n,
      result: "clamped",
    });
    expect(step(bottom, { _tag: "pageDown" })).toMatchObject({ value: 1n });
  });

  it("wraps around in the wrap variant", () => {
    const wrapping = step(focused, { _tag: "setWrap", mode: true });
    expect(wrapping).toMatchObject({ wrap: true, result: "mode" });
    const top = step(wrapping, { _tag: "end" });
    expect(step(top, { _tag: "arrowUp" })).toMatchObject({
      value: 1n,
      result: "wrapped",
    });
    expect(step(top, { _tag: "pageUp" })).toMatchObject({ value: 3n });
    const bottom = step(wrapping, { _tag: "home" });
    expect(step(bottom, { _tag: "arrowDown" })).toMatchObject({
      value: 12n,
      result: "wrapped",
    });
    expect(step(bottom, { _tag: "pageDown" })).toMatchObject({ value: 10n });
    // Home/End never wrap
    expect(step(top, { _tag: "end" })).toMatchObject({ value: 12n });
  });

  it("typing a draft leaves the committed value alone", () => {
    const typed = step(focused, type("12"));
    expect(typed).toMatchObject({
      value: 5n,
      editing: true,
      draft: "12",
      result: "typed",
    });
  });

  it("Enter commits a valid draft", () => {
    const committed = run(focused, type("12"), { _tag: "commit" });
    expect(committed).toMatchObject({
      value: 12n,
      editing: false,
      draft: "",
      focused: true,
      result: "committed",
    });
  });

  it.each(["13", "0", "abc", ""])("Enter reverts the invalid draft %j", (text) => {
    const reverted = run(focused, type(text), { _tag: "commit" });
    expect(reverted).toMatchObject({
      value: 5n,
      editing: false,
      draft: "",
      result: "reverted",
    });
  });

  it("Escape drops the draft; blur commits-or-reverts", () => {
    expect(run(focused, type("12"), { _tag: "revert" })).toMatchObject({
      value: 5n,
      editing: false,
      result: "reverted",
    });
    expect(run(focused, type("12"), { _tag: "blur" })).toMatchObject({
      value: 12n,
      focused: false,
      editing: false,
      result: "committed",
    });
    expect(run(focused, type("abc"), { _tag: "blur" })).toMatchObject({
      value: 5n,
      focused: false,
      result: "reverted",
    });
    expect(step(focused, { _tag: "blur" })).toMatchObject({
      result: "blurred",
    });
  });

  it("a spin key steps from a valid draft and discards an invalid one", () => {
    expect(run(focused, type("12"), { _tag: "arrowDown" })).toMatchObject({
      value: 11n,
      editing: false,
      draft: "",
    });
    expect(run(focused, type("abc"), { _tag: "arrowUp" })).toMatchObject({
      value: 6n,
      editing: false,
    });
  });

  it("buttons step with or without focus and leave focus on the field", () => {
    const inc = step(initial, { _tag: "clickIncrement" });
    expect(inc).toMatchObject({ value: 6n, focused: true });
    const dec = step(initial, { _tag: "clickDecrement" });
    expect(dec).toMatchObject({ value: 4n, focused: true });
    const top = step(focused, { _tag: "end" });
    expect(step(top, { _tag: "clickIncrement" })).toMatchObject({
      value: 12n,
      result: "clamped",
    });
  });

  it("uncontrolled, a request is accepted and commits its intent", () => {
    expect(initial).toMatchObject({
      controlled: false,
      outcome: "none",
      requests: 0n,
    });
    const stepped = step(focused, { _tag: "arrowUp" });
    expect(stepped).toMatchObject({
      value: 6n,
      outcome: "accepted",
      requested: 6n,
      base: 5n,
      requests: 1n,
    });
    // a request at the bound moves nowhere, so it is not a request
    const top = step(focused, { _tag: "end" });
    expect(top).toMatchObject({ value: 12n, requests: 1n });
    expect(step(top, { _tag: "end" })).toMatchObject({
      value: 12n,
      requests: 1n,
    });
    // the host-side commit is inert without a controlled value
    expect(model.transition(stepped, { _tag: "setValue", v: 3n })).toMatchObject({
      value: 6n,
      requests: 1n,
    });
  });

  it("controlled, a request the host ignores leaves the value untouched", () => {
    const host = step(initial, { _tag: "control" });
    expect(host).toMatchObject({ controlled: true, valueProp: 5n });
    const requested = step(step(host, { _tag: "focus" }), { _tag: "arrowUp" });
    expect(requested).toMatchObject({
      value: 5n,
      valueProp: 5n,
      outcome: "rejected",
      requested: 6n,
      base: 5n,
      requests: 1n,
    });
    // only the host writing the value prop commits
    expect(step(requested, { _tag: "setValue", v: 9n })).toMatchObject({
      value: 9n,
      valueProp: 9n,
      outcome: "none",
      requests: 1n,
    });
  });

  it("controlled, a host that accepts commits the intent through the prop", () => {
    const host = step(step(initial, { _tag: "control" }), {
      _tag: "acceptRequests",
    });
    const stepped = step(step(host, { _tag: "focus" }), { _tag: "arrowUp" });
    expect(stepped).toMatchObject({
      value: 6n,
      valueProp: 6n,
      outcome: "accepted",
      requested: 6n,
      requests: 1n,
    });
  });

  it("controlled, the host outside toggle writes the opposite range end", () => {
    const host = step(initial, { _tag: "control" });
    expect(step(host, { _tag: "hostToggle" })).toMatchObject({
      value: 12n,
      valueProp: 12n,
      outcome: "none",
    });
    expect(step(step(host, { _tag: "hostToggle" }), { _tag: "hostToggle" })).toMatchObject({
      value: 1n,
      valueProp: 1n,
    });
    // inert while uncontrolled
    expect(step(initial, { _tag: "hostToggle" })).toMatchObject({
      value: 5n,
      requests: 0n,
    });
  });

  it("typing and Escape change no committed value, so they are not requests", () => {
    const typed = step(focused, type("12"));
    expect(typed).toMatchObject({
      value: 5n,
      editing: true,
      draft: "12",
      requests: 0n,
      outcome: "none",
    });
    expect(step(typed, { _tag: "revert" })).toMatchObject({
      value: 5n,
      requests: 0n,
    });
  });

  it("exposes typed event schemas for the draft and mode pools", () => {
    expect(model.pools["typeText"]).toEqual({
      text: ["", "5", "12", "13", "0", "abc"],
    });
    expect(model.pools["setWrap"]).toEqual({ mode: [true, false] });
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 4, maxStates: 30_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(100);
    expect(report.reachable((s) => s["wrap"] === true && s["value"] === 1n)).toBe(true);
  });
});
