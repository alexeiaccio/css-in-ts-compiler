import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { explore, stateKey } from "@quint-machine/core/testing";
import definitionJson from "../../src/patterns/reactive.model.generated.json";
import { reactiveBridge } from "../../src/patterns/reactive.bridge";
import { parseScenarioFile, replayScenario, specDriver } from "../../src/scenario";
import scenarios from "../../scenarios/patterns/reactive.spec.json";
import owners from "../../scenarios/patterns/reactive.owners.spec.json";

// Spec-only verification for specs/patterns/reactive.qnt: two owners (the outer
// with an inner nested in it), each with `open` and `tab`, the four kinds of
// binding and one condition per subtree. The shared harness derives the event
// alphabet from the spec's own pools (there are no nondet pools, so `explore`
// walks the 14 actions) and checks every invariant after every step.

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
const ready = run(initial, "setup");

const value = (state: QuintModelValue): ReadonlyArray<string> =>
  [state["xo"], state["xt"], state["yo"], state["yt"]].map((part) => String(part));

describe("patterns reactive (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(invariants).toEqual([
      "Nearest",
      "Setup",
      "Isolated",
      "Deep",
      "ComparisonReadsNearest",
      "Atomic",
      "ScopeKnown",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    // before setup nothing is claimed: the attributes are absent on purpose
    expect(violatedInvariants(model, initial)).toEqual([]);

    // ready without the owner attributes: the setup never wrote them
    expect(violatedInvariants(model, { ...initial, ready: true })).toEqual([
      "Nearest",
      "Setup",
      "Deep",
      "ComparisonReadsNearest",
      "Atomic",
    ]);

    // a stale binding: the outer tab moved, its striped attributes did not
    const stale = { ...ready, xt: "two" } as QuintModelValue;
    expect(violatedInvariants(model, stale)).toEqual(["Nearest", "Setup", "Atomic"]);

    // the comparison written from the other owner: the inner strip would follow
    // `xt` (one) instead of `yt` (two)
    const fromOuter = { ...ready, bOneSel: "true", bOneTab: "0", bTwoSel: "false", bTwoTab: "-1" };
    expect(violatedInvariants(model, fromOuter)).toEqual(["Nearest", "ComparisonReadsNearest"]);

    // a descendant's condition reading the outer owner's stale `open`
    const opened = run(initial, "setup", "clickOuterToggle");
    expect(value(opened)).toEqual(["true", "one", "false", "two"]);
    // inside() is a CSS ancestor match: the outer owner opening shows the inner
    // panel too, because both owners declare `open`
    expect(opened["bPanel"]).toBe("block");
    expect(violatedInvariants(model, { ...opened, bPanel: "none" })).toEqual(["Deep"]);

    // with the outer closed the inner owner alone decides its panel
    const checked = run(initial, "setup", "changeInnerCheckOn");
    expect(checked["aPanel"]).toBe("none");
    expect(checked["bPanel"]).toBe("block");
    expect(violatedInvariants(model, { ...checked, bPanel: "none" })).toEqual(["Deep"]);

    // an event in the inner subtree that changed the outer owner
    const leaked = {
      ...ready,
      scope: "inner",
      snapXo: "false",
      xo: "true",
      xaOpen: "true",
      aExpanded: "true",
      aPanel: "block",
      bPanel: "block",
    };
    expect(violatedInvariants(model, leaked)).toEqual(["Isolated"]);

    // an ancestor program that changed the inner owner
    const leakedInner = {
      ...ready,
      scope: "ancestor",
      snapYo: "false",
      yo: "true",
      yaOpen: "true",
      bExpanded: "true",
      bChecked: "true",
      bPanel: "block",
    };
    expect(violatedInvariants(model, leakedInner)).toEqual(["Isolated"]);

    // a scope that names no subtree
    expect(violatedInvariants(model, { ...ready, scope: "sibling" })).toEqual(["ScopeKnown"]);
  });

  it("starts closed, with the owners' tabs on opposite values, and not ready", () => {
    expect(initial).toMatchObject({
      xo: "false",
      xt: "one",
      yo: "false",
      yt: "two",
      xaOpen: "",
      aPanel: "",
      ready: false,
      scope: "none",
    });
  });

  it("setup writes every owner's attributes and every binding", () => {
    expect(ready).toMatchObject({
      xaOpen: "false",
      xaTab: "one",
      yaOpen: "false",
      yaTab: "two",
      aExpanded: "false",
      aOneSel: "true",
      aOneTab: "0",
      aOneControls: "panel-1",
      aTwoSel: "false",
      aTwoTab: "-1",
      aCurrent: "one",
      aPanel: "none",
      bExpanded: "false",
      bOneSel: "false",
      bOneTab: "-1",
      bOneControls: "panel-1",
      bTwoSel: "true",
      bTwoTab: "0",
      bChecked: "false",
      bPanel: "none",
      ready: true,
    });
  });

  it("a click toggles the nearest owner and flushes its bindings", () => {
    expect(value(run(ready, "clickInnerToggle"))).toEqual(["false", "one", "true", "two"]);
    expect(run(ready, "clickInnerToggle")).toMatchObject({
      yaOpen: "true",
      bExpanded: "true",
      bChecked: "true",
      bPanel: "block",
      aPanel: "none",
      scope: "inner",
    });
  });

  it("a comparison and a choice follow their own owner", () => {
    const diverged = run(ready, "clickInnerTabOne", "clickOuterTabTwo");
    expect(value(diverged)).toEqual(["false", "two", "false", "one"]);
    expect(diverged).toMatchObject({
      aOneSel: "false",
      aOneTab: "-1",
      aTwoSel: "true",
      aTwoTab: "0",
      bOneSel: "true",
      bOneTab: "0",
      bTwoSel: "false",
      bTwoTab: "-1",
    });
  });

  it("a set from @value writes the select's own state", () => {
    expect(run(ready, "changeOuterFieldTwo")).toMatchObject({
      xt: "two",
      xaTab: "two",
      aCurrent: "two",
      aTwoSel: "true",
      bOneSel: "false",
      yt: "two",
    });
  });

  it("a set from @checked writes whether the box is checked", () => {
    expect(run(ready, "changeInnerCheckOn")).toMatchObject({
      yo: "true",
      yaOpen: "true",
      bChecked: "true",
      bPanel: "block",
    });
    expect(run(ready, "changeInnerCheckOn", "changeInnerCheckOff")).toMatchObject({
      yo: "false",
      bChecked: "false",
      bPanel: "none",
    });
  });

  it("an ancestor program writes the ancestor, not the subtree it fired in", () => {
    const keyed = run(ready, "keydownInner");
    expect(value(keyed)).toEqual(["true", "one", "false", "two"]);
    expect(keyed).toMatchObject({
      aExpanded: "true",
      aPanel: "block",
      bExpanded: "false",
      bPanel: "block",
      scope: "ancestor",
    });
  });

  it("an event with no program changes nothing and flushes nothing", () => {
    expect(run(ready, "clickInnerPanel")).toMatchObject({
      xo: "false",
      xt: "one",
      yo: "false",
      yt: "two",
      scope: "none",
    });
  });

  it("no reachable state violates an invariant (bounded exploration)", () => {
    const report = explore(model, { maxDepth: 4, maxStates: 20_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(30);
  });
});

describe("reactive scenarios (spec driver)", () => {
  for (const scenariosJson of [scenarios, owners]) {
    const file = parseScenarioFile(scenariosJson);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async () => {
          const result = await replayScenario(scenario, reactiveBridge, (config) =>
            specDriver(model, reactiveBridge, config),
          );
          // our own scenarios must be expressible: an `unsupported` here is a gap
          // in the bridge, not a step we deliberately drop
          expect(result.status).toBe("passed");
        });
      }
    });
  }
});
