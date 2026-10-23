import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import {
  assertReachable,
  assertUnreachable,
  eventsOf,
  explore,
  stateKey,
  verifySpec,
} from "@quint-machine/core/testing";
import { describe, expect, it } from "vite-plus/test";
import { Schema } from "effect";
import definitionJson from "../../src/apg/grid-sort.model.generated.json";

// Spec-only verification for specs/apg/grid-sort.qnt (WAI-ARIA APG grid:
// sortable column headers, aria-sort).
//
// The spec's reference model is the system under test: events come from the
// spec's own pools, `transition` is stepped, and every declared invariant is
// checked after every step.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const press = (state: QuintModelValue, key: string): QuintModelValue =>
  step(state, { _tag: "key", key });

const pressAll = (start: QuintModelValue, keys: readonly string[]): QuintModelValue =>
  keys.reduce(press, start);

const click = (state: QuintModelValue, column: bigint): QuintModelValue =>
  step(state, { _tag: "click", column });

const focused = step(model.initial, { _tag: "focus_in" });

describe("apg grid sort (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "HeaderFocusInBounds",
      "ExactlyOneHeaderTabStop",
      "AtMostOneSortedHeader",
      "SortedColumnIsSortable",
      "UnsortedMeansNoDirection",
      "SortedMeansDirection",
      "NoSortWhenDisabled",
      "NonSortableHeaderHasNoAriaSort",
      "SortDirValid",
      "RequestsNonNegative",
      "ControlledFollowsProp",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    expect(
      violatedInvariants(model, {
        ...model.initial,
        headerCol: 5n,
        hasFocus: true,
        sortEnabled: false,
        sortCol: 1n,
        sortDir: "sideways",
      }),
    ).toEqual([
      "HeaderFocusInBounds",
      "ExactlyOneHeaderTabStop",
      "SortedColumnIsSortable",
      "SortedMeansDirection",
      "NoSortWhenDisabled",
      "SortDirValid",
    ]);

    expect(
      violatedInvariants(model, {
        ...model.initial,
        sortCol: -1n,
        sortDir: "ascending",
      }),
    ).toEqual(["UnsortedMeansNoDirection"]);

    // an event committed while controlled: the state left the value prop behind
    expect(
      violatedInvariants(model, {
        ...model.initial,
        controlled: true,
        valueProp: -1n,
        sortCol: 0n,
        sortDir: "ascending",
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the sort anyway
    expect(
      violatedInvariants(model, {
        ...model.initial,
        outcome: "rejected",
        base: -1n,
        sortCol: 0n,
        sortDir: "ascending",
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...model.initial,
        outcome: "accepted",
        requested: 0n,
        sortCol: -1n,
        sortDir: "none",
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("starts unsorted, sorting enabled, header 0 as the tab stop", () => {
    expect(model.initial).toMatchObject({
      headerCol: 0n,
      hasFocus: false,
      sortEnabled: true,
      sortCol: -1n,
      sortDir: "none",
    });
  });

  it("Enter sorts ascending, then toggles descending <-> ascending", () => {
    const asc = press(focused, "Enter");
    expect(asc).toMatchObject({ sortCol: 0n, sortDir: "ascending" });
    const desc = press(asc, "Space");
    expect(desc).toMatchObject({ sortCol: 0n, sortDir: "descending" });
    expect(press(desc, "Enter")).toMatchObject({
      sortCol: 0n,
      sortDir: "ascending",
    });
  });

  it("sorting another column resets the previous one to none", () => {
    const state = pressAll(focused, ["Enter", "Enter", "End", "Space"]);
    expect(state).toMatchObject({
      headerCol: 2n,
      sortCol: 2n,
      sortDir: "ascending",
    });
  });

  it("a non-sortable header takes focus but never sorts", () => {
    const sorted = press(focused, "Enter");
    const onType = press(sorted, "ArrowRight");
    expect(onType).toMatchObject({ headerCol: 1n, sortCol: 0n });
    expect(press(onType, "Enter")).toEqual(onType);
    expect(click(sorted, 1n)).toMatchObject({
      headerCol: 1n,
      sortCol: 0n,
      sortDir: "ascending",
    });
  });

  it("clicking a sortable header focuses and sorts it", () => {
    const asc = click(model.initial, 2n);
    expect(asc).toMatchObject({
      headerCol: 2n,
      hasFocus: true,
      sortCol: 2n,
      sortDir: "ascending",
    });
    expect(click(asc, 2n)).toMatchObject({ sortDir: "descending" });
    expect(click(asc, 0n)).toMatchObject({ sortCol: 0n, sortDir: "ascending" });
  });

  it("header focus roves without wrapping", () => {
    expect(press(focused, "ArrowLeft")).toMatchObject({ headerCol: 0n });
    expect(press(focused, "ArrowRight")).toMatchObject({ headerCol: 1n });
    expect(press(focused, "End")).toMatchObject({ headerCol: 2n });
    expect(pressAll(focused, ["End", "ArrowRight"])).toMatchObject({
      headerCol: 2n,
    });
    expect(pressAll(focused, ["End", "Home"])).toMatchObject({ headerCol: 0n });
  });

  it("ignores keys without DOM focus; blur keeps the sort", () => {
    expect(press(model.initial, "Enter")).toEqual(model.initial);
    const sorted = press(focused, "Enter");
    const blurred = step(sorted, { _tag: "focus_out" });
    expect(blurred).toMatchObject({
      hasFocus: false,
      sortCol: 0n,
      sortDir: "ascending",
    });
    expect(press(blurred, "Enter")).toEqual(blurred);
  });

  it("disabling sorting clears the sort and blocks activation", () => {
    const sorted = press(focused, "Enter");
    const disabled = step(sorted, { _tag: "set_sort_enabled", flag: false });
    expect(disabled).toMatchObject({
      sortEnabled: false,
      sortCol: -1n,
      sortDir: "none",
    });
    expect(press(disabled, "Enter")).toEqual(disabled);
    expect(click(disabled, 0n)).toMatchObject({ sortCol: -1n });
    expect(step(disabled, { _tag: "set_sort_enabled", flag: true })).toMatchObject({
      sortEnabled: true,
      sortCol: -1n,
      sortDir: "none",
    });
  });

  it("uncontrolled, every sort request is accepted and commits its intent", () => {
    const clicked = click(model.initial, 0n);
    expect(clicked).toMatchObject({
      sortCol: 0n,
      sortDir: "ascending",
      outcome: "accepted",
      requested: 0n,
      base: -1n,
      requests: 1n,
    });
    // a host write is inert without a controlled value
    expect(model.transition(clicked, { _tag: "setValue", v: 4n })).toEqual(clicked);
  });

  it("controlled, a rejected request leaves the sort untouched", () => {
    const controlled = step(model.initial, { _tag: "control" });
    const clicked = click(controlled, 0n);
    expect(clicked).toMatchObject({
      sortCol: -1n,
      sortDir: "none",
      valueProp: -1n,
      outcome: "rejected",
      requested: 0n,
      base: -1n,
      requests: 1n,
    });
    // only a host write commits while controlled
    expect(step(clicked, { _tag: "setValue", v: 0n })).toMatchObject({
      sortCol: 0n,
      sortDir: "ascending",
      valueProp: 0n,
      outcome: "none",
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = step(step(model.initial, { _tag: "control" }), {
      _tag: "acceptRequests",
    });
    const clicked = click(host, 2n);
    expect(clicked).toMatchObject({
      sortCol: 2n,
      sortDir: "ascending",
      valueProp: 4n,
      outcome: "accepted",
      requests: 1n,
    });
    expect(step(clicked, { _tag: "click", column: 2n })).toMatchObject({
      sortCol: 2n,
      sortDir: "descending",
      valueProp: 5n,
    });
  });

  it("exposes typed event schemas for the key and column pools", () => {
    const decodeKey = Schema.decodeUnknownSync(
      model.eventSchemas["key"] as Schema.Codec<Record<string, unknown>>,
    );
    expect(decodeKey({ _tag: "key", key: "Enter" })).toEqual({
      _tag: "key",
      key: "Enter",
    });
    expect(() => decodeKey({ _tag: "key" })).toThrow();

    const decodeClick = Schema.decodeUnknownSync(
      model.eventSchemas["click"] as Schema.Codec<Record<string, unknown>>,
    );
    expect(decodeClick({ _tag: "click", column: 1n })).toEqual({
      _tag: "click",
      column: 1n,
    });
    expect(() => decodeClick({ _tag: "click", column: "one" })).toThrow();
  });

  it("derives the key alphabet and column pool from the spec", () => {
    const events = eventsOf(model);
    expect(events.filter((event) => event._tag === "key")).toHaveLength(6);
    expect(events.filter((event) => event._tag === "click")).toHaveLength(3);
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(20);

    assertReachable(report, "column 2 sorted descending", (s) => {
      return s["sortCol"] === 2n && s["sortDir"] === "descending";
    });
    assertUnreachable(report, "the non-sortable column is sorted", (s) => {
      return s["sortCol"] === 1n;
    });
    assertUnreachable(report, "a disabled grid with a sort", (s) => {
      return s["sortEnabled"] === false && s["sortCol"] !== -1n && s["controlled"] === false;
    });
  });

  it("random walks over every derived event keep all invariants", () => {
    const verification = verifySpec(model, {
      maxDepth: 4,
      maxStates: 5_000,
      runs: 50,
      maxSteps: 100,
      seed: 3,
    });
    expect(verification.simulation.violations).toEqual([]);
  });
});
