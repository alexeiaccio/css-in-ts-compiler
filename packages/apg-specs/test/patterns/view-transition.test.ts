import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { explore, stateKey } from "@quint-machine/core/testing";
import definitionJson from "../../src/patterns/view-transition.model.generated.json";
import { viewTransitionBridge } from "../../src/patterns/view-transition.bridge";
import { parseScenarioFile, replayScenario, specDriver } from "../../src/scenario";
import scenarios from "../../scenarios/patterns/view-transition.spec.json";

// Spec-only verification for specs/patterns/view-transition.qnt: one runner,
// one transition at a time. The shared harness walks the spec's own event
// alphabet and checks every invariant after every action.

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

describe("patterns view-transition (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "OneUpdatePerRequest",
      "InertRequestsStartNothing",
      "AnimatedStartsBalance",
      "ActiveIsTheLatest",
      "InertNeverActive",
      "PendingOnlyWhileActive",
    ]);
  });

  it("starts with nothing running and the platform policy on", () => {
    expect(initial).toMatchObject({
      mode: "animate",
      phase: "idle",
      active: 0n,
      latest: 0n,
      requests: 0n,
      updates: 0n,
      inert: 0n,
      starts: 0n,
      finished: 0n,
      skips: 0n,
      pending: 0n,
    });
  });

  it("runs the update, starts a transition, then settles", () => {
    const requested = run(initial, "request");
    expect(requested).toMatchObject({
      phase: "active",
      requests: 1n,
      updates: 1n,
      starts: 1n,
      skips: 0n,
      pending: 1n,
    });
    expect(run(requested, "settle")).toMatchObject({
      phase: "idle",
      finished: 1n,
      skips: 0n,
      pending: 0n,
    });
  });

  it("runs the update and starts nothing under inert mode", () => {
    const inert = run(initial, "inertOn", "request");
    expect(inert).toMatchObject({
      mode: "inert",
      phase: "idle",
      requests: 1n,
      updates: 1n,
      inert: 1n,
      starts: 0n,
      pending: 0n,
    });
  });

  it("skips the running transition when a newer request wins", () => {
    const superseded = run(initial, "request", "request");
    expect(superseded).toMatchObject({
      phase: "active",
      active: 2n,
      latest: 2n,
      requests: 2n,
      updates: 2n,
      starts: 2n,
      skips: 1n,
      pending: 1n,
    });
  });

  it("counts an abort as a skip, not a failure", () => {
    const aborted = run(initial, "request", "abort");
    expect(aborted).toMatchObject({
      phase: "idle",
      requests: 1n,
      updates: 1n,
      starts: 1n,
      finished: 0n,
      skips: 1n,
      pending: 0n,
    });
  });

  it("ignores settle and abort while idle", () => {
    expect(run(initial, "settle")).toEqual(initial);
    expect(run(initial, "abort")).toEqual(initial);
  });

  it("keeps a running transition when the preference flips mid-flight", () => {
    const flipped = run(initial, "request", "inertOn");
    expect(flipped).toMatchObject({ mode: "animate", phase: "active", pending: 1n });
  });

  it("invariants have teeth on hand-built bad states", () => {
    expect(violatedInvariants(model, { ...initial, updates: 1n })).toEqual(["OneUpdatePerRequest"]);
    expect(
      violatedInvariants(model, {
        ...initial,
        phase: "active",
        latest: 1n,
        starts: 1n,
        requests: 1n,
        updates: 1n,
        pending: 1n,
      }),
    ).toEqual(["ActiveIsTheLatest"]);
    expect(
      violatedInvariants(model, {
        ...initial,
        mode: "inert",
        phase: "active",
        active: 1n,
        latest: 1n,
        starts: 1n,
        requests: 1n,
        updates: 1n,
        pending: 1n,
      }),
    ).toEqual(["InertNeverActive"]);
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 5, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(40);
  });
});

describe("view transition scenarios (spec driver)", () => {
  const file = parseScenarioFile(scenarios);
  for (const scenario of file.scenarios) {
    it(scenario.id, async () => {
      const result = await replayScenario(scenario, viewTransitionBridge, (config) =>
        specDriver(model, viewTransitionBridge, config),
      );
      // our own scenarios must be expressible: an `unsupported` here is a gap
      // in the bridge, not a step we deliberately drop
      expect(result.status).toBe("passed");
    });
  }
});
