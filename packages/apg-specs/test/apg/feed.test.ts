import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { eventsOf, explore, stateKey } from "@quint-machine/core/testing";
import { Schema } from "effect";
import definitionJson from "../../src/apg/feed.model.generated.json";

// Spec-only verification for specs/apg/feed.qnt: the APG feed pattern.
//
// There is no Solid implementation yet, so the spec's reference model is the
// system under test: events come from the spec's own pools, `transition` is
// stepped, and every declared invariant is checked after every step.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);

const invariants = model.invariants.map((invariant) => invariant.name);

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const run = (events: ReadonlyArray<Record<string, unknown>>) => events.reduce(step, model.initial);

describe("apg feed (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "BusyIffLoading",
      "PhaseValid",
      "LoadingImpliesMore",
      "LoadedWithinTotal",
      "ZoneValid",
      "FocusMatchesZone",
      "FocusWithinLoaded",
      "SizeModeValid",
      "PosinsetsContiguous",
      "PosinsetWithinSetsize",
      "FocusedPosinsetWithinSetsize",
      "SetsizeUnknownOnlyWhenTotalUnknown",
      "SetsizeValid",
      "ArticlesTabbable",
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
        phase: "loading",
        busy: false,
      }),
    ).toEqual(["BusyIffLoading"]);

    expect(
      violatedInvariants(model, {
        ...model.initial,
        phase: "idle",
        busy: true,
      }),
    ).toEqual(["BusyIffLoading"]);

    expect(
      violatedInvariants(model, {
        ...model.initial,
        zone: "feed",
        focus: 0n,
      }),
    ).toEqual(["FocusMatchesZone"]);

    expect(
      violatedInvariants(model, {
        ...model.initial,
        zone: "feed",
        focus: 3n,
      }),
    ).toEqual(["FocusWithinLoaded", "FocusedPosinsetWithinSetsize"]);

    expect(violatedInvariants(model, { ...model.initial, loaded: 7n })).toEqual([
      "LoadedWithinTotal",
    ]);

    // an event committed while controlled: the state left the value prop behind
    expect(
      violatedInvariants(model, {
        ...model.initial,
        controlled: true,
        valueProp: 1n,
        loaded: 3n,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the count anyway
    expect(
      violatedInvariants(model, {
        ...model.initial,
        outcome: "rejected",
        base: 1n,
        loaded: 3n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...model.initial,
        outcome: "accepted",
        requested: 3n,
        loaded: 1n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
  });

  it("starts idle, not busy, with focus before the feed", () => {
    expect(model.initial).toMatchObject({
      phase: "idle",
      busy: false,
      loaded: 1n,
      zone: "before",
      focus: 0n,
      sizeMode: "loaded",
      totalKnown: false,
    });
  });

  it("Page Down / Page Up move focus article by article, clamped at the ends", () => {
    // focus lands on the only (= last) article, which starts a load
    let state = run([{ _tag: "focus_article", n: 1n }]);
    expect(state).toMatchObject({
      zone: "feed",
      focus: 1n,
      phase: "loading",
      busy: true,
    });

    // Page Up on the first article stays
    state = step(state, { _tag: "page_up" });
    expect(state).toMatchObject({ zone: "feed", focus: 1n });

    // nothing to move to until the batch arrives
    state = step(state, { _tag: "page_down" });
    expect(state).toMatchObject({ focus: 1n, loaded: 1n, busy: true });

    // a failed load clears busy; Page Down on the last article retries it
    state = step(state, { _tag: "load_fail" });
    expect(state).toMatchObject({ phase: "idle", busy: false });
    state = step(state, { _tag: "page_down" });
    expect(state).toMatchObject({ focus: 1n, phase: "loading", busy: true });

    state = step(state, { _tag: "load_finish", n: 2n });
    expect(state).toMatchObject({ loaded: 3n, phase: "idle", busy: false });

    state = step(state, { _tag: "page_down" });
    expect(state).toMatchObject({ focus: 2n });
    state = step(state, { _tag: "page_up" });
    expect(state).toMatchObject({ focus: 1n });
  });

  it("Page Down / Page Up outside the feed do nothing", () => {
    expect(step(model.initial, { _tag: "page_down" })).toEqual(model.initial);
    expect(step(model.initial, { _tag: "page_up" })).toEqual(model.initial);
  });

  it("Ctrl+End / Ctrl+Home leave the feed to the matching zone", () => {
    const inside = run([{ _tag: "focus_article", n: 1n }]);

    expect(step(inside, { _tag: "ctrl_end" })).toMatchObject({
      zone: "after",
      focus: 0n,
    });
    expect(step(inside, { _tag: "ctrl_home" })).toMatchObject({
      zone: "before",
      focus: 0n,
    });

    // from outside, both keys are no-ops
    const after = step(inside, { _tag: "ctrl_end" });
    expect(step(after, { _tag: "ctrl_home" })).toEqual(after);
    expect(step(after, { _tag: "ctrl_end" })).toEqual(after);
  });

  it("focus can re-enter on any loaded article and ignores unloaded ones", () => {
    const state = run([
      { _tag: "focus_article", n: 1n },
      { _tag: "load_start" },
      { _tag: "load_finish", n: 3n },
    ]);
    expect(state).toMatchObject({ loaded: 4n, focus: 1n });

    expect(step(state, { _tag: "focus_article", n: 3n })).toMatchObject({
      zone: "feed",
      focus: 3n,
    });
    expect(step(state, { _tag: "focus_article", n: 6n })).toEqual(state);

    const outside = step(state, { _tag: "focus_outside", side: "after" });
    expect(outside).toMatchObject({ zone: "after", focus: 0n });
    expect(step(outside, { _tag: "focus_article", n: 2n })).toMatchObject({
      zone: "feed",
      focus: 2n,
    });
  });

  it("aria-busy is true exactly while loading and cleared by finish and fail", () => {
    let state = step(model.initial, { _tag: "load_start" });
    expect(state).toMatchObject({ phase: "loading", busy: true });

    // a second load_start while loading changes nothing
    expect(step(state, { _tag: "load_start" })).toEqual(state);

    state = step(state, { _tag: "load_fail" });
    expect(state).toMatchObject({ phase: "idle", busy: false, loaded: 1n });

    // fail / finish with nothing in flight are no-ops
    expect(step(state, { _tag: "load_fail" })).toEqual(state);
    expect(step(state, { _tag: "load_finish", n: 2n })).toEqual(state);

    state = run([{ _tag: "load_start" }, { _tag: "load_finish", n: 1n }]);
    expect(state).toMatchObject({ phase: "idle", busy: false, loaded: 2n });
  });

  it("focus reaching the last loaded article loads more", () => {
    const state = run([
      { _tag: "load_start" },
      { _tag: "load_finish", n: 2n },
      { _tag: "focus_article", n: 2n },
    ]);
    expect(state).toMatchObject({ focus: 2n, phase: "idle", busy: false });

    const onLast = step(state, { _tag: "page_down" });
    expect(onLast).toMatchObject({ focus: 3n, phase: "loading", busy: true });
  });

  it("loading stops at the total and never starts once everything is loaded", () => {
    let state = model.initial;
    for (let i = 0; i < 4; i++) {
      state = step(state, { _tag: "load_start" });
      state = step(state, { _tag: "load_finish", n: 3n });
    }
    expect(state).toMatchObject({ loaded: 6n, phase: "idle", busy: false });

    // complete: neither a scroll nor focus on the last article starts a load
    expect(step(state, { _tag: "load_start" })).toEqual(state);
    const focused = step(state, { _tag: "focus_article", n: 6n });
    expect(focused).toMatchObject({ focus: 6n, phase: "idle", busy: false });
  });

  it("aria-setsize: loaded count, total, or -1 when the total is unknown", () => {
    // sizeMode loaded + any known flag -> setsize follows the loaded count;
    // sizeMode total + unknown total -> -1; total known -> the total (6).
    // The invariants (setsize >= posinset, -1 only when unknown) hold at each.
    let state = run([{ _tag: "load_start" }, { _tag: "load_finish", n: 2n }]);
    state = step(state, { _tag: "set_size_mode", mode: "total" });
    expect(state).toMatchObject({ sizeMode: "total", totalKnown: false });

    state = step(state, { _tag: "set_total_known", known: true });
    expect(state).toMatchObject({ sizeMode: "total", totalKnown: true });

    state = step(state, { _tag: "set_total_known", known: false });
    state = step(state, { _tag: "set_size_mode", mode: "loaded" });
    expect(state).toMatchObject({ sizeMode: "loaded", totalKnown: false });
  });

  it("exposes a typed event schema for the pools", () => {
    const schema = model.eventSchemas["load_finish"];
    if (schema === undefined) {
      throw new Error("no event schema for load_finish");
    }
    const decode = Schema.decodeUnknownSync(schema as Schema.Codec<Record<string, unknown>>);
    expect(decode({ _tag: "load_finish", n: 2n })).toEqual({
      _tag: "load_finish",
      n: 2n,
    });
    expect(() => decode({ _tag: "load_finish", n: "2" })).toThrow();
  });

  it("uncontrolled, an arriving batch is accepted and commits its intent", () => {
    const state = run([{ _tag: "load_start" }, { _tag: "load_finish", n: 2n }]);
    expect(state).toMatchObject({
      loaded: 3n,
      phase: "idle",
      busy: false,
      outcome: "accepted",
      requested: 3n,
      base: 1n,
      requests: 1n,
    });
    // a failed load is not a value request
    const failed = [{ _tag: "load_start" }, { _tag: "load_fail" }].reduce(step, state);
    expect(failed).toMatchObject({ loaded: 3n, requests: 1n });
    // host-side commits are inert without a controlled value
    expect(model.transition(state, { _tag: "setValue", v: 5n })).toEqual(state);
  });

  it("controlled, a rejected batch leaves the count untouched", () => {
    const controlled = run([{ _tag: "control" }, { _tag: "load_start" }]);
    const next = step(controlled, { _tag: "load_finish", n: 2n });
    expect(next).toMatchObject({
      loaded: 1n,
      valueProp: 1n,
      phase: "idle",
      busy: false,
      outcome: "rejected",
      requested: 3n,
      base: 1n,
      requests: 1n,
    });
    // a host write is the only commit while controlled
    expect(step(next, { _tag: "setValue", v: 4n })).toMatchObject({
      loaded: 4n,
      valueProp: 4n,
      outcome: "none",
    });
  });

  it("controlled, a host that accepts commits the batch through the value", () => {
    const host = run([{ _tag: "control" }, { _tag: "acceptRequests" }, { _tag: "load_start" }]);
    const next = step(host, { _tag: "load_finish", n: 2n });
    expect(next).toMatchObject({
      loaded: 3n,
      valueProp: 3n,
      outcome: "accepted",
      requests: 1n,
    });
  });

  it("controlled, setValue clamps focus into the new range", () => {
    const inside = run([
      { _tag: "load_start" },
      { _tag: "load_finish", n: 3n },
      { _tag: "focus_article", n: 3n },
      { _tag: "control" },
    ]);
    expect(inside).toMatchObject({ loaded: 4n, focus: 3n });
    expect(step(inside, { _tag: "setValue", v: 1n })).toMatchObject({
      loaded: 1n,
      focus: 1n,
    });
  });

  it("every event from the spec pools keeps every invariant (all states, depth 1)", () => {
    const events = eventsOf(model);
    expect(events.length).toBeGreaterThan(20);
    const report = explore(model, { maxDepth: 4, maxStates: 50_000 });
    for (const state of report.states) {
      for (const event of events) {
        const next = model.transition(state, event);
        expect(violatedInvariants(model, next)).toEqual([]);
      }
    }
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 7, maxStates: 50_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(50);
  });
});
