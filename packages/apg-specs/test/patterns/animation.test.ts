import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { explore, stateKey } from "@quint-machine/core/testing";
import definitionJson from "../../src/patterns/animation.model.generated.json";
import { animationBridge } from "../../src/patterns/animation.bridge";
import { parseScenarioFile, replayScenario, specDriver } from "../../src/scenario";
import scenarios from "../../scenarios/patterns/animation.spec.json";

// Spec-only verification for specs/patterns/animation.qnt: the protocol of an
// animated disclosure — the race of two intents, the cancellation of an effect
// and the ignored completion of it, the reversal that keeps the box where it
// is, one effect per transition, the debounce window, and the optimistic split
// between what the host exposes and what the machine has committed.
// `explore` walks the eleven actions and checks every invariant after every
// step; the last test is the liveness claim NoStuckState makes local.

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

/** An in-flight state with the given history, built from `initial`. */
const flying = (patches: QuintModelValue): QuintModelValue => ({
  ...initial,
  visual: "opening",
  visible: true,
  logical: true,
  optimistic: true,
  committed: "closed",
  progress: 0n,
  handle: 1n,
  live: 1n,
  ...patches,
});

describe("patterns animation (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "LastIntentWins",
      "OneEffectPerState",
      "OptimisticIsSplit",
      "OptimisticLeadsOnIntent",
      "OptimisticReconcilesOnSettle",
      "OptimisticRollsBackOnCancel",
      "NoStaleOptimistic",
      "CancelledFinishIgnored",
      "StaleCarriesCancelled",
      "ReversalKeepsPosition",
      "NoStuckState",
      "DebounceKeepsLast",
      "CoalescingHolds",
      "ReducedMotionSkips",
      "Atomic",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    // a rest state whose box disagrees with the intent (a settle that landed
    // on the wrong end, or the exposed state left behind)
    expect(violatedInvariants(model, { ...initial, visual: "open", visible: true })).toEqual([
      "LastIntentWins",
    ]);
    // two live effects in one in-flight state
    expect(violatedInvariants(model, flying({ live: 2n }))).toEqual(["OneEffectPerState"]);
    // the optimistic flag not derived from the exposed and committed states
    expect(violatedInvariants(model, flying({ optimistic: false }))).toEqual(["OptimisticIsSplit"]);
    // an intent that moved the committed state before its effect settled
    expect(
      violatedInvariants(model, flying({ lead: true, committed: "open", optimistic: false })),
    ).toEqual(["OptimisticLeadsOnIntent"]);
    // a settle that left the split open
    expect(violatedInvariants(model, flying({ settled: true, committed: "closed" }))).toEqual([
      "OptimisticReconcilesOnSettle",
    ]);
    // a superseded intent that committed anyway, or that did not hand the box
    // to the newer intent
    expect(
      violatedInvariants(model, {
        ...flying({ visual: "closing", logical: false, optimistic: false, handle: 2n, last: 1n }),
        reversed: true,
        snapVisual: "opening",
        snapProgress: 0n,
        snapHandle: 1n,
        snapLogical: true,
        committed: "closed",
      }),
    ).toEqual([]);
    expect(
      violatedInvariants(model, {
        ...flying({
          visual: "closing",
          logical: false,
          committed: "open",
          last: 1n,
          handle: 2n,
        }),
        reversed: true,
        snapVisual: "opening",
        snapProgress: 0n,
        snapHandle: 1n,
        snapLogical: true,
        snapCommitted: "closed",
      }),
    ).toEqual(["OptimisticRollsBackOnCancel"]);
    // the box animating towards an intent the machine no longer holds, and an
    // optimistic exposure with no effect to reconcile it
    expect(violatedInvariants(model, flying({ logical: false, optimistic: false }))).toEqual([
      "NoStaleOptimistic",
    ]);
    expect(
      violatedInvariants(model, {
        ...initial,
        visual: "open",
        visible: true,
        progress: 4n,
        committed: "closed",
        logical: true,
        optimistic: true,
      }),
    ).toEqual(["LastIntentWins", "NoStaleOptimistic"]);
    // a cancelled completion that moved the box, or that carried the live handle
    expect(
      violatedInvariants(model, {
        ...flying({ progress: 2n }),
        stale: true,
        snapVisual: "opening",
        snapProgress: 1n,
        snapHandle: 1n,
      }),
    ).toEqual(["CancelledFinishIgnored"]);
    expect(
      violatedInvariants(
        model,
        flying({ stale: true, arrived: 1n, snapVisual: "opening", snapHandle: 1n }),
      ),
    ).toEqual(["StaleCarriesCancelled"]);
    // a reversal that restarted from an end, that did not flip the direction,
    // or that kept the cancelled effect's handle
    const reversed = {
      ...flying({
        visual: "closing",
        logical: false,
        optimistic: false,
        progress: 2n,
        handle: 2n,
        last: 1n,
      }),
      reversed: true,
      snapVisual: "opening",
      snapProgress: 2n,
      snapHandle: 1n,
      snapLogical: true,
    };
    expect(violatedInvariants(model, reversed)).toEqual([]);
    expect(violatedInvariants(model, { ...reversed, progress: 4n })).toEqual([
      "ReversalKeepsPosition",
    ]);
    expect(violatedInvariants(model, { ...reversed, visual: "opening" })).toEqual([
      "OptimisticRollsBackOnCancel",
      "NoStaleOptimistic",
      "ReversalKeepsPosition",
    ]);
    expect(violatedInvariants(model, { ...reversed, handle: 1n, arrived: 1n })).toEqual([
      "ReversalKeepsPosition",
    ]);
    // an in-flight box with no effect that could finish it
    // an in-flight box with no effect that could finish it (the multiplicity
    // invariant catches the same state, since a live effect implies a handle)
    expect(violatedInvariants(model, flying({ live: 0n, handle: 0n }))).toEqual([
      "OneEffectPerState",
      "NoStuckState",
    ]);
    // a commit that took an earlier intent of the burst, or that left the
    // window open
    expect(violatedInvariants(model, { ...initial, debounced: true, snapPending: "open" })).toEqual(
      ["DebounceKeepsLast"],
    );
    expect(
      violatedInvariants(model, {
        ...initial,
        debounced: true,
        pending: "open",
        snapPending: "close",
      }),
    ).toEqual(["DebounceKeepsLast"]);
    // a pointer intent that moved the box, or that held nothing
    expect(violatedInvariants(model, { ...initial, coalesced: true })).toEqual(["CoalescingHolds"]);
    expect(violatedInvariants(model, flying({ coalesced: true, pending: "open" }))).toEqual([
      "CoalescingHolds",
    ]);
    // a transition entered with the motion preference on
    expect(violatedInvariants(model, flying({ reduced: true }))).toEqual(["ReducedMotionSkips"]);
    // a `hidden` that disagrees with the box (the close cut from the a11y tree
    // while it is still painted)
    expect(
      violatedInvariants(
        model,
        flying({ visual: "closing", visible: false, logical: false, committed: "open" }),
      ),
    ).toEqual(["Atomic"]);
  });

  it("starts closed, committed closed, with no effect", () => {
    expect(initial).toMatchObject({
      visual: "closed",
      committed: "closed",
      logical: false,
      optimistic: false,
      visible: false,
      progress: 0n,
      handle: 0n,
      last: 0n,
      live: 0n,
      pending: "none",
      reduced: false,
      arrived: 0n,
    });
  });

  it("two intents in one frame end at the last one, with one live effect", () => {
    // from closed: open starts effect 1, close replaces it with effect 2
    const raced = run(initial, "open", "close");
    expect(raced).toMatchObject({
      visual: "closing",
      committed: "closed",
      logical: false,
      optimistic: false,
      progress: 0n,
      handle: 2n,
      last: 1n,
      live: 1n,
    });
    expect(run(raced, "finish_live")).toMatchObject({ visual: "closed", handle: 0n, live: 0n });

    // the other order, from open: close starts effect 1, open replaces it
    const back = run(initial, "open", "finish_live", "close", "open");
    expect(back).toMatchObject({ visual: "opening", progress: 4n, handle: 2n, live: 1n });
    expect(run(back, "finish_live")).toMatchObject({ visual: "open", progress: 4n, live: 0n });
  });

  it("a superseded effect's completion is ignored and its handle recorded", () => {
    const reversal = run(initial, "open", "tick", "close");
    expect(reversal).toMatchObject({ visual: "closing", progress: 1n, handle: 2n, last: 1n });

    // the cancelled opening completes late: it carries handle 1 and moves nothing
    const late = step(reversal, { _tag: "finish_stale" });
    expect(late).toMatchObject({
      visual: "closing",
      progress: 1n,
      handle: 2n,
      stale: true,
      arrived: 1n,
    });
    expect(run(late, "finish_live")).toMatchObject({ visual: "closed", progress: 0n });

    // a completion with no effect to finish is a no-op
    expect(run(initial, "finish_live")).toMatchObject({ visual: "closed", handle: 0n, live: 0n });
    expect(run(initial, "open", "finish_live", "finish_stale")).toMatchObject({
      visual: "open",
    });
  });

  it("a reversal keeps the box where it is and flips the direction", () => {
    const halfway = run(initial, "open", "tick", "tick");
    expect(halfway).toMatchObject({ visual: "opening", progress: 2n, handle: 1n });

    const interrupted = step(halfway, { _tag: "close" });
    expect(interrupted).toMatchObject({
      visual: "closing",
      progress: 2n,
      handle: 2n,
      last: 1n,
      reversed: true,
      committed: "closed",
    });
    // the frames walk down from where the box is, not up from closed
    expect(run(interrupted, "tick")).toMatchObject({ visual: "closing", progress: 1n });

    // and back: an interrupted close reverses from its own progress
    const closing = run(initial, "open", "finish_live", "close", "tick", "tick");
    expect(closing).toMatchObject({ visual: "closing", progress: 2n, committed: "open" });
    expect(step(closing, { _tag: "open" })).toMatchObject({
      visual: "opening",
      progress: 2n,
      handle: 2n,
      reversed: true,
    });
  });

  it("the debounce window holds its intent and lands the last one", () => {
    const burst = run(initial, "hover_in", "hover_out", "hover_in");
    expect(burst).toMatchObject({
      visual: "closed",
      pending: "open",
      coalesced: true,
      handle: 0n,
    });
    // the commit reads the window's last intent, which is the enter
    expect(run(burst, "debounce")).toMatchObject({
      visual: "opening",
      logical: true,
      pending: "none",
      debounced: true,
      handle: 1n,
    });
    const opened = run(initial, "open", "finish_live");
    expect(run(opened, "hover_out", "hover_in", "hover_out", "debounce")).toMatchObject({
      visual: "closing",
      logical: false,
    });
    // a direct intent cancels the window: the timer has nothing left to fire
    const clicked = run(initial, "open", "finish_live", "hover_out", "toggle");
    expect(clicked).toMatchObject({ visual: "closing", pending: "none", handle: 1n });
    expect(run(clicked, "debounce")).toMatchObject({ visual: "closing", debounced: false });
  });

  it("the optimistic split: leads on the intent, reconciles on the settle", () => {
    const intent = run(initial, "toggle");
    expect(intent).toMatchObject({
      visual: "opening",
      committed: "closed",
      logical: true,
      optimistic: true,
      lead: true,
    });
    expect(run(intent, "finish_live")).toMatchObject({
      visual: "open",
      committed: "open",
      optimistic: false,
      settled: true,
    });

    // an intent that is superseded commits nothing, and the exposed state
    // returns to the committed one
    const rollback = run(initial, "toggle", "tick", "toggle");
    expect(rollback).toMatchObject({
      visual: "closing",
      committed: "closed",
      logical: false,
      optimistic: false,
      progress: 1n,
      reversed: true,
    });
    expect(run(rollback, "finish_live")).toMatchObject({
      visual: "closed",
      committed: "closed",
      settled: true,
    });

    // and from open: the aborted close leaves committed open, the open that
    // superseded it is not optimistic (the exposed state is the committed one)
    const backToOpen = run(initial, "open", "finish_live", "close", "open");
    expect(backToOpen).toMatchObject({
      visual: "opening",
      committed: "open",
      logical: true,
      optimistic: false,
      reversed: true,
    });
  });

  it("reduced motion never enters a transition", () => {
    const reduced = step(initial, { _tag: "reduced_motion" });
    expect(reduced).toMatchObject({ visual: "closed", reduced: true, settled: true });
    expect(run(reduced, "open")).toMatchObject({
      visual: "open",
      committed: "open",
      progress: 4n,
      handle: 0n,
      live: 0n,
    });
    expect(run(reduced, "open", "close")).toMatchObject({ visual: "closed", progress: 0n });

    // turning it on mid-flight cancels the effect and lands the box
    const mid = run(initial, "open", "tick", "tick");
    expect(step(mid, { _tag: "reduced_motion" })).toMatchObject({
      visual: "open",
      committed: "open",
      progress: 4n,
      handle: 0n,
      live: 0n,
      last: 1n,
    });
    // nothing is left to finish
    expect(run(mid, "reduced_motion", "finish_live")).toMatchObject({
      visual: "open",
      settled: false,
    });
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 100_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(500);

    // NoStuckState's claim, checked rather than assumed: from every reachable
    // state, committing the window and finishing the live effect lands at
    // closed or open
    const inFlight = (value: QuintModelValue[string] | undefined): boolean =>
      value === "opening" || value === "closing";
    const stuck = report.states.filter((state) => {
      let next =
        state["pending"] === "none" ? state : model.transition(state, { _tag: "debounce" });
      if (inFlight(next["visual"])) {
        next = model.transition(next, { _tag: "finish_live" });
      }
      return inFlight(next["visual"]);
    });
    expect(stuck).toEqual([]);
  });
});

describe("animated disclosure scenarios (spec driver)", () => {
  const file = parseScenarioFile(scenarios);
  for (const scenario of file.scenarios) {
    it(scenario.id, async () => {
      const result = await replayScenario(scenario, animationBridge, (config) =>
        specDriver(model, animationBridge, config),
      );
      // our own scenarios must be expressible: an `unsupported` here is a gap
      // in the bridge, not a step we deliberately drop
      expect(result.status).toBe("passed");
    });
  }
});
