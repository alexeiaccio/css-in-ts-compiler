import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { explore, stateKey } from "@quint-machine/core/testing";
import { Schema } from "effect";
import definitionJson from "../../src/apg/tooltip.model.generated.json";

// Spec-only verification for specs/apg/tooltip.qnt: the APG tooltip pattern
// with WCAG 1.4.13 (dismissable, hoverable, persistent) and the global warm-up
// variant. The shared harness checks every declared invariant after every step.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const run = (state: QuintModelValue, events: readonly Record<string, unknown>[]): QuintModelValue =>
  events.reduce(step, state);

const initial = model.initial;

const focusIn = (t: string) => ({ _tag: "focusIn", t });
const pointerEnter = (t: string) => ({ _tag: "pointerEnter", t });
const showTimer = (t: string) => ({ _tag: "showTimer", t });
const focusOut = { _tag: "focusOut" };
const pointerLeave = { _tag: "pointerLeave" };
const pointerEnterTip = { _tag: "pointerEnterTip" };
const hideTimer = { _tag: "hideTimer" };
const escape = { _tag: "escape" };
const warmExpire = { _tag: "warmExpire" };
const warmup = { _tag: "setWarmup", on: true };

describe("apg tooltip (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "AtMostOneVisible",
      "DescribedByIffShown",
      "DismissedStaysHidden",
      "DismissedImpliesEngaged",
      "PendingImpliesEngagedHidden",
      "TipHoverNeedsTooltip",
      "PositionsKnown",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    expect(violatedInvariants(model, { ...initial, shownA: true, shownB: true })).toEqual([
      "AtMostOneVisible",
      "DescribedByIffShown",
    ]);

    expect(violatedInvariants(model, { ...initial, shownA: true })).toEqual([
      "DescribedByIffShown",
    ]);

    expect(
      violatedInvariants(model, {
        ...initial,
        focus: "a",
        shownA: true,
        describedA: true,
        dismA: true,
      }),
    ).toEqual(["DismissedStaysHidden"]);

    expect(violatedInvariants(model, { ...initial, dismB: true, pendA: true })).toEqual([
      "DismissedImpliesEngaged",
      "PendingImpliesEngagedHidden",
    ]);

    expect(violatedInvariants(model, { ...initial, pointer: "tip" })).toEqual([
      "TipHoverNeedsTooltip",
    ]);

    expect(violatedInvariants(model, { ...initial, focus: "c" })).toEqual(["PositionsKnown"]);
    // an event committed while controlled: the state left the value prop behind
    expect(
      violatedInvariants(model, {
        ...initial,
        controlled: true,
        valueProp: 0n,
        shownA: true,
        describedA: true,
        focus: "a",
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the visible tooltip anyway
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "rejected",
        base: 0n,
        shownA: true,
        describedA: true,
        focus: "a",
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its target
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "accepted",
        requested: 1n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("shows on hover only after the delay elapses, with aria-describedby", () => {
    const entered = step(initial, pointerEnter("a"));
    expect(entered).toMatchObject({
      pendA: true,
      shownA: false,
      describedA: false,
    });

    const shown = step(entered, showTimer("a"));
    expect(shown).toMatchObject({
      pendA: false,
      shownA: true,
      describedA: true,
      describedB: false,
    });
  });

  it("shows on keyboard focus after the delay", () => {
    const shown = run(initial, [focusIn("b"), showTimer("b")]);
    expect(shown).toMatchObject({ focus: "b", shownB: true, describedB: true });
  });

  it("cancels the show timer when the trigger is left early", () => {
    const left = run(initial, [pointerEnter("a"), pointerLeave]);
    expect(left).toMatchObject({ pendA: false, shownA: false });

    // a late timer event is a no-op
    expect(step(left, showTimer("a"))).toMatchObject({ shownA: false });
  });

  it("keeps a tooltip engaged by either focus or hover open", () => {
    const both = run(initial, [focusIn("a"), showTimer("a"), pointerEnter("a"), focusOut]);
    // hover still engages the trigger: grace never starts
    expect(step(both, hideTimer)).toMatchObject({ shownA: true });
  });

  it("hides after the grace period, and hovering the tooltip keeps it open", () => {
    const shown = run(initial, [pointerEnter("a"), showTimer("a")]);

    // grace: still visible after the pointer left, hides when the timer fires
    const grace = step(shown, pointerLeave);
    expect(grace).toMatchObject({ shownA: true, describedA: true });
    expect(step(grace, hideTimer)).toMatchObject({
      shownA: false,
      describedA: false,
    });

    // hoverable: crossing onto the tooltip cancels the grace period
    const onTip = step(grace, pointerEnterTip);
    expect(onTip).toMatchObject({ pointer: "tip", shownA: true });
    expect(step(onTip, hideTimer)).toMatchObject({ shownA: true });

    // leaving the tooltip restarts it
    const offTip = step(onTip, pointerLeave);
    expect(step(offTip, hideTimer)).toMatchObject({ shownA: false });
  });

  it("pointerEnterTip is ignored while no tooltip is visible", () => {
    expect(step(initial, pointerEnterTip)).toMatchObject({ pointer: "none" });
  });

  it("Escape dismisses without moving focus and stays dismissed until re-entry", () => {
    const shown = run(initial, [focusIn("a"), showTimer("a")]);
    const dismissed = step(shown, escape);
    expect(dismissed).toMatchObject({
      focus: "a",
      shownA: false,
      describedA: false,
      dismA: true,
    });

    // hovering the still-focused trigger does not bring it back
    const hovered = run(dismissed, [pointerEnter("a"), showTimer("a")]);
    expect(hovered).toMatchObject({ shownA: false, pendA: false, dismA: true });

    // leaving every modality clears the memory; re-entry arms the timer again
    const reset = run(hovered, [focusOut, pointerLeave]);
    expect(reset).toMatchObject({ dismA: false });
    const again = step(reset, focusIn("a"));
    expect(again).toMatchObject({ pendA: true, shownA: false });
  });

  it("Escape during the show delay cancels the pending tooltip", () => {
    const state = run(initial, [pointerEnter("a"), escape]);
    expect(state).toMatchObject({ pendA: false, dismA: true, pointer: "a" });
    expect(step(state, showTimer("a"))).toMatchObject({ shownA: false });
  });

  it("Escape with the pointer on the tooltip drops the tooltip hover", () => {
    const state = run(initial, [
      pointerEnter("a"),
      showTimer("a"),
      pointerLeave,
      pointerEnterTip,
      escape,
    ]);
    expect(state).toMatchObject({ shownA: false, pointer: "none" });
  });

  it("without warm-up a second tooltip waits for its own delay and then replaces the first", () => {
    const first = run(initial, [pointerEnter("a"), showTimer("a")]);
    const moved = run(first, [pointerLeave, pointerEnter("b")]);
    expect(moved).toMatchObject({ shownA: true, shownB: false, pendB: true });

    const replaced = step(moved, showTimer("b"));
    expect(replaced).toMatchObject({
      shownA: false,
      shownB: true,
      describedA: false,
      describedB: true,
    });
  });

  it("warm-up: a second tooltip opens immediately while another is visible", () => {
    const first = run(initial, [warmup, pointerEnter("a"), showTimer("a")]);
    // the first still needs its delay: nothing is visible or warm yet
    expect(first).toMatchObject({ shownA: true });

    const moved = run(first, [pointerLeave, pointerEnter("b")]);
    expect(moved).toMatchObject({
      shownA: false,
      shownB: true,
      describedB: true,
      pendB: false,
    });
  });

  it("warm-up: a tooltip hidden recently keeps the next one immediate until the window closes", () => {
    const hidden = run(initial, [
      warmup,
      pointerEnter("a"),
      showTimer("a"),
      pointerLeave,
      hideTimer,
    ]);
    expect(hidden).toMatchObject({ shownA: false, warm: true });

    const immediate = step(hidden, pointerEnter("b"));
    expect(immediate).toMatchObject({ shownB: true, pendB: false });

    const cold = run(hidden, [warmExpire, pointerEnter("b")]);
    expect(cold).toMatchObject({ warm: false, shownB: false, pendB: true });
  });

  it("warm-up never overrides Escape dismissal of the same trigger", () => {
    const state = run(initial, [
      warmup,
      pointerEnter("a"),
      showTimer("a"),
      escape,
      pointerLeave,
      focusIn("a"),
      pointerEnter("a"),
    ]);
    // focus engaged `a` right after the pointer left, so the dismissal was
    // dropped and warm-up opened it again: re-entry is the documented reset
    expect(state).toMatchObject({ shownA: true, dismA: false });

    const stillEngaged = run(initial, [
      warmup,
      focusIn("a"),
      showTimer("a"),
      escape,
      pointerEnter("a"),
    ]);
    expect(stillEngaged).toMatchObject({ shownA: false, dismA: true });
  });

  it("uncontrolled, showing and hiding are accepted requests", () => {
    const shown = run(initial, [pointerEnter("a"), showTimer("a")]);
    expect(shown).toMatchObject({
      shownA: true,
      describedA: true,
      outcome: "accepted",
      requested: 1n,
      base: 0n,
      requests: 1n,
      controlled: false,
    });
    const hidden = step(shown, escape);
    expect(hidden).toMatchObject({
      shownA: false,
      describedA: false,
      outcome: "accepted",
      requested: 0n,
      base: 1n,
      requests: 2n,
    });
    // the host-side writes are inert without a controlled value
    expect(step(shown, { _tag: "setValue", v: 0n })).toEqual(shown);
    expect(step(shown, { _tag: "hostToggle" })).toEqual(shown);
  });

  it("controlled, a rejected show leaves the visible tooltip untouched", () => {
    const controlled = step(initial, { _tag: "control" });
    const requested = run(controlled, [pointerEnter("a"), showTimer("a")]);
    expect(requested).toMatchObject({
      shownA: false,
      valueProp: 0n,
      outcome: "rejected",
      requested: 1n,
      base: 0n,
      requests: 1n,
    });
  });

  it("controlled, only the value prop commits", () => {
    const controlled = step(initial, { _tag: "control" });
    const committed = step(controlled, { _tag: "setValue", v: 1n });
    expect(committed).toMatchObject({
      shownA: true,
      describedA: true,
      valueProp: 1n,
      outcome: "none",
    });
    const toggled = step(committed, { _tag: "hostToggle" });
    // a host toggle is nondet; just assert it does not fire a request
    expect(toggled).toMatchObject({ outcome: "none", requests: 0n });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = run(initial, [{ _tag: "control" }, { _tag: "acceptRequests" }]);
    const shown = run(host, [pointerEnter("a"), showTimer("a")]);
    expect(shown).toMatchObject({
      shownA: true,
      describedA: true,
      valueProp: 1n,
      outcome: "accepted",
      requested: 1n,
      requests: 1n,
    });
  });

  it("exposes a typed event schema for the trigger pool", () => {
    const schema = model.eventSchemas["focusIn"];
    if (schema === undefined) {
      throw new Error("no event schema for focusIn");
    }
    const decode = Schema.decodeUnknownSync(schema as Schema.Codec<Record<string, unknown>>);
    expect(decode({ _tag: "focusIn", t: "a" })).toEqual({
      _tag: "focusIn",
      t: "a",
    });
    expect(() => decode({ _tag: "focusIn", t: 1n })).toThrow();
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 50_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(100);
  });
});
