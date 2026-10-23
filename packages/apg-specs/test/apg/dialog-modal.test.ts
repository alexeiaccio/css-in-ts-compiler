import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { assertReachable, explore, stateKey, verifySpec } from "@quint-machine/core/testing";
import { describe, expect, it } from "vite-plus/test";
import { Schema } from "effect";
import definitionJson from "../../src/apg/dialog-modal.model.generated.json";

// Spec-only verification for specs/apg/dialog-modal.qnt.
//
// The spec's reference model is the system under test: events come from the
// spec's own pools, `transition` is stepped, and every declared invariant is
// checked after every step. Focus is the encoded target `layer * 100 + pos`.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const run = (events: ReadonlyArray<Record<string, unknown>>, from = model.initial) =>
  events.reduce(step, from);

const tabs = (n: number) => Array.from({ length: n }, () => ({ _tag: "tab" }));
const focusAt = (target: bigint) => ({ _tag: "focus_attempt", target });

// page -> Add Delivery Address (dialog 1, initial focus on the first input)
const inDialog1 = () => run([{ _tag: "activate" }]);
// dialog 1 -> Verify Address (dialog 2, static first paragraph focused)
const inDialog2 = () => run([focusAt(106n), { _tag: "activate" }], inDialog1());
// dialog 2 -> help link (dialog 4)
const inDialog4 = () => run([{ _tag: "tab" }, { _tag: "activate" }], inDialog2());

describe("apg dialog-modal (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "FocusInTopLayer",
      "NoFocusInInertLayer",
      "FocusPositionValid",
      "DepthBounded",
      "StackContiguous",
      "ReturnTargetsValid",
      "OpenDialogsHonourContract",
      "InitialFocusConfigValid",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    const base = { ...model.initial };
    expect(violatedInvariants(model, base)).toEqual([]);
    // focus escaped to the inert page under two open dialogs
    expect(
      violatedInvariants(model, {
        ...base,
        depth: 2n,
        l1: 1n,
        l2: 2n,
        r1: 1n,
        r2: 106n,
      }),
    ).toEqual(["FocusInTopLayer", "NoFocusInInertLayer"]);
    // the dialog container (position 0 of a dialog without a static start)
    expect(
      violatedInvariants(model, {
        ...base,
        depth: 1n,
        l1: 1n,
        r1: 1n,
        focus: 100n,
      }),
    ).toEqual(["FocusPositionValid"]);
    // a stale layer left behind after closing
    expect(violatedInvariants(model, { ...base, l1: 1n })).toEqual(["StackContiguous"]);
    // return target pointing at a non-existent element
    expect(
      violatedInvariants(model, {
        ...base,
        depth: 1n,
        l1: 1n,
        r1: 9n,
        focus: 101n,
      }),
    ).toEqual(["ReturnTargetsValid"]);
    // depth beyond the stack limit
    expect(violatedInvariants(model, { ...base, depth: 4n })).toContain("DepthBounded");
    // an event committed while controlled: the state left the value prop behind
    expect(
      violatedInvariants(model, {
        ...base,
        controlled: true,
        valueProp: false,
        depth: 1n,
        l1: 1n,
        r1: 1n,
        focus: 101n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the open state anyway
    expect(
      violatedInvariants(model, {
        ...base,
        outcome: "rejected",
        base: false,
        depth: 1n,
        l1: 1n,
        r1: 1n,
        focus: 101n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...base,
        outcome: "accepted",
        requested: true,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("opening moves focus into the dialog at its initial focus", () => {
    expect(inDialog1()).toMatchObject({
      depth: 1n,
      l1: 1n,
      r1: 1n,
      focus: 101n,
    });
    // dialog 2: first interactive element is out of view -> static paragraph
    expect(inDialog2()).toMatchObject({
      depth: 2n,
      l2: 2n,
      r2: 106n,
      focus: 200n,
    });
  });

  it("Tab and Shift+Tab wrap inside the dialog (focus trap)", () => {
    const last = run(tabs(7), inDialog1());
    expect(last).toMatchObject({ focus: 108n });
    expect(step(last, { _tag: "tab" })).toMatchObject({ focus: 101n });
    expect(step(inDialog1(), { _tag: "shift_tab" })).toMatchObject({
      focus: 108n,
    });
    // a long walk in both directions never leaves layer 1
    const walked = run([...tabs(20), ...tabs(20).map(() => ({ _tag: "shift_tab" }))], inDialog1());
    expect(walked).toMatchObject({ depth: 1n });
    expect(Number(walked["focus"]) / 100).toBeGreaterThanOrEqual(1);
  });

  it("a static tabindex=-1 start is focusable but outside the tab sequence", () => {
    const dialog2 = inDialog2();
    expect(dialog2).toMatchObject({ focus: 200n });
    expect(step(dialog2, { _tag: "tab" })).toMatchObject({ focus: 201n });
    expect(step(dialog2, { _tag: "shift_tab" })).toMatchObject({ focus: 202n });
    const helpLink = step(dialog2, { _tag: "tab" });
    expect(step(helpLink, { _tag: "shift_tab" })).toMatchObject({
      focus: 202n,
    });
  });

  it("Escape closes only the top dialog and returns focus to its invoker", () => {
    const closed = step(inDialog2(), { _tag: "escape" });
    expect(closed).toMatchObject({ depth: 1n, l2: 0n, r2: 0n, focus: 106n });
    expect(step(closed, { _tag: "escape" })).toMatchObject({
      depth: 0n,
      l1: 0n,
      r1: 0n,
      focus: 1n,
    });
  });

  it("nested stack: three layers unwind in order, each restoring its invoker", () => {
    const top = inDialog4();
    expect(top).toMatchObject({
      depth: 3n,
      l1: 1n,
      l2: 2n,
      l3: 4n,
      r3: 201n,
      focus: 301n,
    });
    const escape = { _tag: "escape" };
    const a = step(top, escape);
    const b = step(a, escape);
    const c = step(b, escape);
    expect(a).toMatchObject({ depth: 2n, focus: 201n });
    expect(b).toMatchObject({ depth: 1n, focus: 106n });
    expect(c).toMatchObject({ depth: 0n, focus: 1n });
  });

  it("activating a close button closes and restores focus like Escape", () => {
    // dialog 1 Cancel (position 8)
    const cancelled = run([focusAt(108n), { _tag: "activate" }], inDialog1());
    expect(cancelled).toMatchObject({ depth: 0n, focus: 1n });
    // dialog 4 Close
    expect(step(inDialog4(), { _tag: "activate" })).toMatchObject({
      depth: 2n,
      focus: 201n,
    });
  });

  it("Add replaces dialog 1 with dialog 3, which inherits the return target", () => {
    const replaced = run([focusAt(107n), { _tag: "activate" }], inDialog1());
    // Address Added: focus on OK (the last focusable element)
    expect(replaced).toMatchObject({ depth: 1n, l1: 3n, r1: 1n, focus: 102n });
    // closing it returns to the original page button, not the removed dialog
    expect(step(replaced, { _tag: "escape" })).toMatchObject({
      depth: 0n,
      focus: 1n,
    });
    expect(step(replaced, { _tag: "activate" })).toMatchObject({
      depth: 0n,
      focus: 1n,
    });
  });

  it("focus_attempt outside the top dialog is refused; inside it is honoured", () => {
    const dialog = inDialog1();
    expect(step(dialog, focusAt(1n))).toEqual(dialog); // inert page
    expect(step(dialog, focusAt(100n))).toEqual(dialog); // dialog container
    expect(step(dialog, focusAt(109n))).toEqual(dialog); // no such element
    expect(step(dialog, focusAt(203n))).toEqual(dialog); // other layer
    expect(step(dialog, focusAt(106n))).toMatchObject({ focus: 106n });
    // with a nested dialog open, the lower dialog is inert too
    const nested = inDialog2();
    expect(step(nested, focusAt(101n))).toEqual(nested);
    // with nothing open the page takes focus freely, but not nonexistent elements
    expect(step(model.initial, focusAt(3n))).toMatchObject({ focus: 3n });
    expect(step(model.initial, focusAt(4n))).toEqual(model.initial);
    expect(step(model.initial, focusAt(100n))).toEqual(model.initial);
  });

  it("a click on the inert content does nothing (CLOSE_ON_OUTSIDE off)", () => {
    const dialog = inDialog2();
    expect(step(dialog, { _tag: "pointer_outside" })).toEqual(dialog);
  });

  it("a removed invoker falls back to a logical-workflow element", () => {
    const fromPage = step(inDialog1(), { _tag: "remove_invoker" });
    expect(fromPage).toMatchObject({ r1: 3n });
    expect(step(fromPage, { _tag: "escape" })).toMatchObject({
      depth: 0n,
      focus: 3n,
    });

    const nested = step(inDialog2(), { _tag: "remove_invoker" });
    expect(nested).toMatchObject({ r2: 101n, r1: 1n });
    expect(step(nested, { _tag: "escape" })).toMatchObject({
      depth: 1n,
      focus: 101n,
    });

    // nothing to remove with no dialog open
    expect(step(model.initial, { _tag: "remove_invoker" })).toEqual(model.initial);
  });

  it("Escape and non-actionable activation are no-ops on the bare page", () => {
    expect(step(model.initial, { _tag: "escape" })).toEqual(model.initial);
    const onLink = step(model.initial, { _tag: "tab" });
    expect(onLink).toMatchObject({ focus: 2n });
    expect(step(onLink, { _tag: "activate" })).toEqual(onLink);
    // the page tab sequence wraps too
    expect(run(tabs(3))).toMatchObject({ focus: 1n });
  });

  it("uncontrolled, opening and closing are accepted requests", () => {
    const openState = step(model.initial, { _tag: "activate" });
    expect(openState).toMatchObject({
      depth: 1n,
      outcome: "accepted",
      requested: true,
      base: false,
      requests: 1n,
      controlled: false,
    });
    const closed = step(openState, { _tag: "escape" });
    expect(closed).toMatchObject({
      depth: 0n,
      outcome: "accepted",
      requested: false,
      base: true,
      requests: 2n,
    });
    // the host-side writes are inert without a controlled value
    expect(step(openState, { _tag: "setValue", v: false })).toEqual(openState);
    expect(step(openState, { _tag: "hostToggle" })).toEqual(openState);
  });

  it("controlled, a rejected open leaves the stack untouched", () => {
    const controlled = step(model.initial, { _tag: "control" });
    const rejected = step(controlled, { _tag: "activate" });
    expect(rejected).toMatchObject({
      depth: 0n,
      focus: 1n,
      valueProp: false,
      outcome: "rejected",
      requested: true,
      base: false,
      requests: 1n,
    });
  });

  it("controlled, only the value prop commits", () => {
    const controlled = step(model.initial, { _tag: "control" });
    const opened = step(controlled, { _tag: "setValue", v: true });
    expect(opened).toMatchObject({
      depth: 1n,
      l1: 1n,
      r1: 1n,
      focus: 101n,
      valueProp: true,
      outcome: "none",
    });
    const rejected = step(opened, { _tag: "escape" });
    expect(rejected).toMatchObject({
      depth: 1n,
      focus: 101n,
      outcome: "rejected",
      requested: false,
      base: true,
      requests: 1n,
    });
    const toggled = step(opened, { _tag: "hostToggle" });
    expect(toggled).toMatchObject({ depth: 0n, valueProp: false, focus: 1n });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = step(step(model.initial, { _tag: "control" }), {
      _tag: "acceptRequests",
    });
    const opened = step(host, { _tag: "activate" });
    expect(opened).toMatchObject({
      depth: 1n,
      valueProp: true,
      outcome: "accepted",
      requested: true,
      requests: 1n,
    });
  });

  it("exposes a typed event schema for the focus_attempt pool", () => {
    const schema = model.eventSchemas["focus_attempt"];
    if (schema === undefined) {
      throw new Error("no event schema for focus_attempt");
    }
    const decode = Schema.decodeUnknownSync(schema as Schema.Codec<Record<string, unknown>>);
    expect(decode({ _tag: "focus_attempt", target: 101n })).toEqual({
      _tag: "focus_attempt",
      target: 101n,
    });
    expect(() => decode({ _tag: "focus_attempt", target: "x" })).toThrow();
  });

  it("no reachable state violates an invariant (exploration + simulation)", () => {
    const report = explore(model, { maxDepth: 7, maxStates: 50_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(30);
    assertReachable(report, "three layers open", (state) => state["depth"] === 3n);
    assertReachable(report, "focus on the static paragraph", (state) => state["focus"] === 200n);
    verifySpec(model, {
      runs: 50,
      maxSteps: 100,
      maxDepth: 5,
      maxStates: 20_000,
    });
  });
});
