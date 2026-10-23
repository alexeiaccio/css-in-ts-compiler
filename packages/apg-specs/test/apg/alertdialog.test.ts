import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { assertReachable, explore, stateKey, verifySpec } from "@quint-machine/core/testing";
import { describe, expect, it } from "vite-plus/test";
import { Schema } from "effect";
import definitionJson from "../../src/apg/alertdialog.model.generated.json";

// Spec-only verification for specs/apg/alertdialog.qnt.
//
// The spec's reference model is the system under test: events come from the
// spec's own pools, `transition` is stepped, and every declared invariant is
// checked after every step. Focus is the encoded target `layer * 100 + pos`
// (page: 1 textarea, 2 Save, 3 Discard; dialog: 101 No, 102 Yes).

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);
const initial = model.initial;

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const run = (events: ReadonlyArray<Record<string, unknown>>, from = model.initial) =>
  events.reduce(step, from);

const focusAt = (target: bigint) => ({ _tag: "focus_attempt", target });
const toDiscard = () => run([focusAt(3n)]);
const opened = () => run([{ _tag: "activate" }], toDiscard());

describe("apg alertdialog (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "FocusInActiveLayer",
      "FocusPositionValid",
      "OpenImpliesNotes",
      "ReturnTargetIsInvoker",
      "InitialFocusLeastDestructive",
      "AlertDialogHonoursContract",
      "PageInertIffOpen",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    expect(violatedInvariants(model, initial)).toEqual([]);
    // focus left on the page behind an open alertdialog
    expect(violatedInvariants(model, { ...initial, isOpen: true, ret: 3n })).toContain(
      "FocusInActiveLayer",
    );
    // initial focus on the destructive "Yes"
    expect(
      violatedInvariants(model, {
        ...initial,
        isOpen: true,
        ret: 3n,
        focus: 102n,
      }),
    ).toEqual(["InitialFocusLeastDestructive"]);
    // an alertdialog with nothing to discard, and no remembered invoker
    expect(
      violatedInvariants(model, {
        ...initial,
        isOpen: true,
        focus: 101n,
        notes: 0n,
      }),
    ).toEqual(["OpenImpliesNotes", "ReturnTargetIsInvoker"]);
    // a stale return target after closing
    expect(violatedInvariants(model, { ...initial, ret: 3n })).toEqual(["ReturnTargetIsInvoker"]);
    // an event committed while controlled: the state left the value prop behind
    expect(
      violatedInvariants(model, {
        ...initial,
        controlled: true,
        valueProp: false,
        isOpen: true,
        focus: 101n,
        ret: 3n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the open state anyway
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "rejected",
        base: false,
        isOpen: true,
        focus: 101n,
        ret: 3n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "accepted",
        requested: true,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("opening focuses the least destructive action and remembers the invoker", () => {
    expect(opened()).toMatchObject({
      isOpen: true,
      focus: 101n,
      ret: 3n,
      interacted: false,
    });
  });

  it("Tab and Shift+Tab cycle between No and Yes, never leaving the dialog", () => {
    const yes = step(opened(), { _tag: "tab" });
    expect(yes).toMatchObject({ focus: 102n, interacted: true });
    expect(step(yes, { _tag: "tab" })).toMatchObject({ focus: 101n });
    expect(step(opened(), { _tag: "shift_tab" })).toMatchObject({
      focus: 102n,
    });
  });

  it('Escape and "No" close without discarding, returning focus to Discard', () => {
    expect(step(opened(), { _tag: "escape" })).toMatchObject({
      isOpen: false,
      focus: 3n,
      ret: 0n,
      notes: 1n,
      stored: 1n,
    });
    expect(step(opened(), { _tag: "activate" })).toMatchObject({
      isOpen: false,
      focus: 3n,
      notes: 1n,
    });
  });

  it('"Yes" discards notes and storage; the emptied Discard still takes focus', () => {
    const confirmed = run([{ _tag: "tab" }, { _tag: "activate" }], opened());
    expect(confirmed).toMatchObject({
      isOpen: false,
      notes: 0n,
      stored: 0n,
      focus: 3n, // aria-disabled Discard stays in the tab sequence
    });
    // the aria-disabled Discard cannot be activated again
    expect(step(confirmed, { _tag: "activate" })).toEqual(confirmed);
  });

  it("pointer clicks and focus attempts cannot leave the alertdialog", () => {
    const dialog = opened();
    expect(step(dialog, focusAt(1n))).toEqual(dialog);
    expect(step(dialog, focusAt(3n))).toEqual(dialog);
    expect(step(dialog, focusAt(100n))).toEqual(dialog);
    expect(step(dialog, focusAt(103n))).toEqual(dialog);
    expect(step(dialog, focusAt(102n))).toMatchObject({
      focus: 102n,
      interacted: true,
    });
    expect(step(dialog, { _tag: "pointer_outside" })).toEqual(dialog);
  });

  it("Discard is inert while the textarea is empty (aria-disabled, still focusable)", () => {
    const emptied = run([focusAt(1n), { _tag: "clear_text" }]);
    expect(emptied).toMatchObject({ notes: 0n, focus: 1n });
    const onDiscard = step(emptied, focusAt(3n));
    expect(onDiscard).toMatchObject({ focus: 3n });
    expect(step(onDiscard, { _tag: "activate" })).toEqual(onDiscard);
  });

  it("Save is enabled only when the textarea differs from storage; Ctrl+S saves too", () => {
    const idleSave = run([focusAt(2n), { _tag: "activate" }]);
    expect(idleSave).toMatchObject({ notes: 1n, stored: 1n });
    const edited = run([focusAt(1n), { _tag: "type_text" }]);
    expect(edited).toMatchObject({ notes: 2n, stored: 1n });
    const viaButton = run([focusAt(2n), { _tag: "activate" }], edited);
    expect(viaButton).toMatchObject({ stored: 2n });
    const viaShortcut = step(edited, { _tag: "ctrl_s" });
    expect(viaShortcut).toMatchObject({ stored: 2n, focus: 1n });
    // Ctrl+S only acts from the textarea
    const elsewhere = run([focusAt(2n), { _tag: "ctrl_s" }], edited);
    expect(elsewhere).toMatchObject({ stored: 1n });
  });

  it("typing is impossible while the alertdialog is open", () => {
    const dialog = opened();
    expect(step(dialog, { _tag: "type_text" })).toEqual(dialog);
    expect(step(dialog, { _tag: "clear_text" })).toEqual(dialog);
    expect(step(dialog, { _tag: "ctrl_s" })).toEqual(dialog);
  });

  it("uncontrolled, opening and closing are accepted requests", () => {
    const openState = step(toDiscard(), { _tag: "activate" });
    expect(openState).toMatchObject({
      isOpen: true,
      outcome: "accepted",
      requested: true,
      base: false,
      requests: 1n,
      controlled: false,
    });
    const closed = step(openState, { _tag: "escape" });
    expect(closed).toMatchObject({
      isOpen: false,
      outcome: "accepted",
      requested: false,
      base: true,
      requests: 2n,
    });
    // the host-side writes are inert without a controlled value
    expect(step(openState, { _tag: "setValue", v: false })).toEqual(openState);
    expect(step(openState, { _tag: "hostToggle" })).toEqual(openState);
  });

  it("controlled, a rejected open leaves the dialog closed and focus put", () => {
    const controlled = step(initial, { _tag: "control" });
    const rejected = step(step(controlled, focusAt(3n)), { _tag: "activate" });
    expect(rejected).toMatchObject({
      isOpen: false,
      focus: 3n,
      valueProp: false,
      outcome: "rejected",
      requested: true,
      base: false,
      requests: 1n,
    });
  });

  it("controlled, a rejected close keeps the dialog open and focus put", () => {
    const controlled = step(initial, { _tag: "control" });
    const openState = step(controlled, { _tag: "setValue", v: true });
    expect(openState).toMatchObject({
      isOpen: true,
      focus: 101n,
      ret: 3n,
      valueProp: true,
    });
    const rejected = step(openState, { _tag: "escape" });
    expect(rejected).toMatchObject({
      isOpen: true,
      focus: 101n,
      ret: 3n,
      outcome: "rejected",
      requested: false,
      base: true,
      requests: 1n,
    });
  });

  it("controlled, only the value prop commits", () => {
    const controlled = step(initial, { _tag: "control" });
    const committed = step(controlled, { _tag: "setValue", v: true });
    expect(committed).toMatchObject({
      isOpen: true,
      valueProp: true,
      focus: 101n,
      ret: 3n,
      outcome: "none",
    });
    const toggled = step(committed, { _tag: "hostToggle" });
    expect(toggled).toMatchObject({
      isOpen: false,
      valueProp: false,
      focus: 3n,
      ret: 0n,
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = step(step(initial, { _tag: "control" }), {
      _tag: "acceptRequests",
    });
    const openState = step(step(host, focusAt(3n)), { _tag: "activate" });
    expect(openState).toMatchObject({
      isOpen: true,
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
    expect(decode({ _tag: "focus_attempt", target: 3n })).toEqual({
      _tag: "focus_attempt",
      target: 3n,
    });
    expect(() => decode({ _tag: "focus_attempt", target: "x" })).toThrow();
  });

  it("no reachable state violates an invariant (exploration + simulation)", () => {
    const report = explore(model, { maxDepth: 8, maxStates: 50_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(20);
    assertReachable(report, "alertdialog open", (state) => state["isOpen"] === true);
    assertReachable(
      report,
      "notes discarded",
      (state) => state["notes"] === 0n && state["stored"] === 0n,
    );
    verifySpec(model, {
      runs: 50,
      maxSteps: 100,
      maxDepth: 6,
      maxStates: 20_000,
    });
  });
});
