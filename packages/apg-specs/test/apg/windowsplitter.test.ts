import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { explore, stateKey } from "@quint-machine/core/testing";
import definitionJson from "../../src/apg/windowsplitter.model.generated.json";

// Spec-only verification for specs/apg/windowsplitter.qnt: the APG window
// splitter. The shared harness derives the event alphabet from the spec's own
// pools and checks every declared invariant after every step.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const run = (start: QuintModelValue, ...tags: ReadonlyArray<string>): QuintModelValue =>
  tags.reduce((state, tag) => step(state, { _tag: tag }), start);

const initial = model.initial;
const focused = run(initial, "focusSplitter");

const apply = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

describe("apg windowsplitter (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "ValueInRange",
      "AriaNowMirrorsValue",
      "CollapsedAtMin",
      "PrevInRange",
      "RestoreReturnsPrev",
      "FocusKnown",
      "OrientationKnown",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    expect(
      violatedInvariants(model, {
        ...initial,
        value: 8n,
        ariaNow: 4n,
        prev: 9n,
        focus: "nowhere",
        orientation: "diagonal",
      }),
    ).toEqual([
      "ValueInRange",
      "AriaNowMirrorsValue",
      "PrevInRange",
      "FocusKnown",
      "OrientationKnown",
    ]);

    expect(
      violatedInvariants(model, {
        ...initial,
        collapsed: true,
        justRestored: true,
        prev: 2n,
      }),
    ).toEqual(["CollapsedAtMin", "RestoreReturnsPrev"]);

    // an event committed while controlled: the state left the value prop behind
    expect(
      violatedInvariants(model, {
        ...initial,
        controlled: true,
        valueProp: 0n,
        value: 4n,
        ariaNow: 4n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the value anyway
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "rejected",
        base: 4n,
        value: 2n,
        ariaNow: 2n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its target
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "accepted",
        requested: 2n,
        value: 4n,
        ariaNow: 4n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("starts at a valid value, vertical, expanded, unfocused", () => {
    expect(initial).toMatchObject({
      orientation: "vertical",
      fixed: false,
      value: 4n,
      prev: 4n,
      collapsed: false,
      focus: "none",
      ariaNow: 4n,
    });
  });

  it("ignores keys unless the splitter has focus", () => {
    expect(run(initial, "right", "enter", "home")).toEqual(initial);
  });

  it("moves a vertical splitter with Left/Right only, by one step, clamped", () => {
    const right = run(focused, "right");
    expect(right).toMatchObject({ value: 6n, ariaNow: 6n });
    expect(run(right, "right")).toMatchObject({ value: 6n });
    expect(run(focused, "left")).toMatchObject({ value: 2n, ariaNow: 2n });
    expect(run(focused, "left", "left", "left")).toMatchObject({ value: 0n });
    expect(run(focused, "up", "down")).toMatchObject({ value: 4n });
  });

  it("moves a horizontal splitter with Up/Down only", () => {
    const horizontal = run(focused, "orientHorizontal");
    expect(run(horizontal, "up")).toMatchObject({ value: 2n, ariaNow: 2n });
    expect(run(horizontal, "down")).toMatchObject({ value: 6n, ariaNow: 6n });
    expect(run(horizontal, "left", "right")).toMatchObject({ value: 4n });
  });

  it("Home and End jump to the range ends", () => {
    expect(run(focused, "home")).toMatchObject({ value: 0n, ariaNow: 0n });
    expect(run(focused, "end")).toMatchObject({ value: 6n, ariaNow: 6n });
  });

  it("Enter collapses to MIN and restores the previous position", () => {
    const moved = run(focused, "left");
    const collapsed = run(moved, "enter");
    expect(collapsed).toMatchObject({
      collapsed: true,
      value: 0n,
      ariaNow: 0n,
      prev: 2n,
      justRestored: false,
    });

    const restored = run(collapsed, "enter");
    expect(restored).toMatchObject({
      collapsed: false,
      value: 2n,
      ariaNow: 2n,
      prev: 2n,
      justRestored: true,
    });

    // the next key clears the restore marker
    expect(run(restored, "right")).toMatchObject({
      justRestored: false,
      value: 4n,
    });
  });

  it("a collapsed splitter ignores arrows and Home/End", () => {
    const collapsed = run(focused, "enter");
    expect(run(collapsed, "right", "left", "end", "home")).toEqual(collapsed);
  });

  it("a fixed splitter reacts to Enter only", () => {
    const fixed = run(focused, "makeFixed");
    expect(run(fixed, "left", "right", "up", "down", "home", "end")).toEqual(fixed);
    const collapsed = run(fixed, "enter");
    expect(collapsed).toMatchObject({ collapsed: true, value: 0n, prev: 4n });
    expect(run(collapsed, "enter")).toMatchObject({
      collapsed: false,
      value: 4n,
    });
    expect(run(fixed, "makeResizable")).toMatchObject({ fixed: false });
  });

  it("F6 cycles splitter -> secondary -> primary -> splitter, and is inert unfocused", () => {
    expect(run(initial, "f6")).toMatchObject({ focus: "none" });
    expect(run(focused, "f6")).toMatchObject({ focus: "secondary" });
    expect(run(focused, "f6", "f6")).toMatchObject({ focus: "primary" });
    expect(run(focused, "f6", "f6", "f6")).toMatchObject({
      focus: "splitter",
    });
    // keys do nothing while a pane (not the splitter) has focus
    const inPane = run(focused, "f6");
    expect(run(inPane, "right", "enter")).toEqual(inPane);
  });

  it("uncontrolled, every request is accepted and commits its target", () => {
    const moved = run(focused, "right");
    expect(moved).toMatchObject({
      value: 6n,
      ariaNow: 6n,
      outcome: "accepted",
      requested: 6n,
      base: 4n,
      requests: 1n,
      controlled: false,
    });
    // the host-side writes are inert without a controlled value
    expect(apply(moved, { _tag: "setValue", v: 0n })).toEqual(moved);
    expect(apply(moved, { _tag: "hostToggle" })).toEqual(moved);
  });

  it("controlled, a request the host ignores leaves the value untouched", () => {
    const rejected = run(initial, "control", "focusSplitter");
    const moved = run(rejected, "right");
    expect(moved).toMatchObject({
      value: 4n,
      ariaNow: 4n,
      valueProp: 4n,
      outcome: "rejected",
      requested: 6n,
      base: 4n,
      requests: 1n,
    });
    // the collapse is rejected together with the value
    const collapsing = run(rejected, "enter");
    expect(collapsing).toMatchObject({
      value: 4n,
      collapsed: false,
      outcome: "rejected",
    });
  });

  it("controlled, only the value prop commits", () => {
    const committed = apply(run(initial, "control"), {
      _tag: "setValue",
      v: 0n,
    });
    expect(committed).toMatchObject({
      value: 0n,
      valueProp: 0n,
      ariaNow: 0n,
      outcome: "none",
    });
    const toggled = apply(committed, { _tag: "hostToggle" });
    expect(toggled).toMatchObject({ value: 6n, valueProp: 6n, ariaNow: 6n });
  });

  it("controlled, a host that accepts commits the target through the value", () => {
    const host = run(initial, "control", "acceptRequests", "focusSplitter");
    const moved = run(host, "right");
    expect(moved).toMatchObject({
      value: 6n,
      valueProp: 6n,
      outcome: "accepted",
      requested: 6n,
      requests: 1n,
    });
    const collapsed = run(moved, "enter");
    expect(collapsed).toMatchObject({
      collapsed: true,
      value: 0n,
      valueProp: 0n,
    });
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 50_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(50);
  });
});
