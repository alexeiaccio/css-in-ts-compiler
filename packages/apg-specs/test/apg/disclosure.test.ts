import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import {
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "../../src/scenario";
import {
  disclosureBridge,
  disclosureProbe,
  disclosureSteps,
} from "../../src/apg/disclosure.bridge";
import { readFileSync, readdirSync } from "node:fs";
import definitionJson from "../../src/apg/disclosure.model.generated.json";
import { verifySpec } from "@quint-machine/core/testing";

// Spec-only verification for specs/apg/disclosure.qnt, plus the scenario
// bridge: every scenarios/apg/disclosure.*.json replayed against the model.

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);
const initial = model.initial;

const step = (state: QuintModelValue, tag: string): QuintModelValue => {
  const next = model.transition(state, { _tag: tag });
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

const scenariosDir = new URL("../../scenarios/apg/", import.meta.url);
const files = readdirSync(scenariosDir)
  .filter((name) => /^disclosure\..+\.json$/.test(name))
  .sort();

describe("apg disclosure (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(model.invariants.map((invariant) => invariant.name)).toEqual([
      "AriaMirrorsPanel",
      "RenderFollowsState",
      "DisabledNotFocused",
      "FocusKnown",
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
        ariaExpanded: "true",
        panelHidden: true,
      }),
    ).toEqual(["AriaMirrorsPanel", "RenderFollowsState"]);
    expect(
      violatedInvariants(model, {
        ...initial,
        disabled: true,
        focus: "trigger",
      }),
    ).toEqual(["DisabledNotFocused"]);
    // an event committed while controlled: the state left the value prop behind
    expect(
      violatedInvariants(model, {
        ...initial,
        controlled: true,
        valueProp: false,
        expanded: true,
        ariaExpanded: "true",
        panelHidden: false,
      }),
    ).toEqual(["ControlledFollowsProp"]);
    // a rejected request that moved the state anyway
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "rejected",
        base: false,
        expanded: true,
        ariaExpanded: "true",
        panelHidden: false,
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

  it("aria-expanded mirrors the panel through every user action", () => {
    expect(initial).toMatchObject({
      expanded: false,
      ariaExpanded: "false",
      panelHidden: true,
    });
    const clicked = step(initial, "click");
    expect(clicked).toMatchObject({
      expanded: true,
      ariaExpanded: "true",
      panelHidden: false,
      focus: "trigger",
      requests: 1n,
    });
    const pressed = step(clicked, "press");
    expect(pressed).toMatchObject({
      expanded: false,
      ariaExpanded: "false",
      requests: 2n,
    });
  });

  it("keys need focus; disabled blocks every user path but not the API", () => {
    expect(step(initial, "press")).toEqual(initial);
    const disabled = step(step(initial, "focusTrigger"), "disable");
    expect(disabled).toMatchObject({ disabled: true, focus: "unknown" });
    expect(step(disabled, "click")).toEqual(disabled);
    expect(step(disabled, "focusTrigger")).toEqual(disabled);
    expect(step(disabled, "press")).toEqual(disabled);
    // an unfocused trigger that gets disabled stays unfocused
    expect(step(initial, "disable")).toMatchObject({ focus: "none" });
    expect(step(disabled, "expand")).toMatchObject({
      expanded: true,
      ariaExpanded: "true",
      requests: 1n,
    });
  });

  it("a redundant expand/collapse is not a change", () => {
    expect(step(initial, "collapse")).toEqual(initial);
    const expanded = step(initial, "expand");
    expect(step(expanded, "expand")).toEqual(expanded);
  });

  it("uncontrolled, every request is accepted and commits its intent", () => {
    expect(initial).toMatchObject({ controlled: false, outcome: "none" });
    const clicked = step(initial, "click");
    expect(clicked).toMatchObject({
      expanded: true,
      outcome: "accepted",
      requested: true,
      base: false,
      requests: 1n,
    });
    // the host-side events are inert without a controlled value
    expect(step(clicked, "hostToggle")).toEqual(clicked);
    expect(model.transition(clicked, { _tag: "setValue", v: false })).toEqual(clicked);
  });

  it("controlled, a request that the host ignores leaves the state untouched", () => {
    const controlled = step(initial, "control");
    for (const tag of ["click", "toggle", "expand"]) {
      const requested = step(controlled, tag);
      expect(requested).toMatchObject({
        expanded: false,
        ariaExpanded: "false",
        panelHidden: true,
        valueProp: false,
        outcome: "rejected",
        requested: true,
        base: false,
        requests: 1n,
      });
    }
    // a key request needs focus; a disabled trigger fires nothing at all
    const focused = step(controlled, "focusTrigger");
    expect(step(focused, "press")).toMatchObject({
      expanded: false,
      outcome: "rejected",
      requests: 1n,
    });
    const inert = step(controlled, "disable");
    expect(step(inert, "click")).toEqual(inert);
    // a redundant request is not a request
    expect(step(controlled, "collapse")).toEqual(controlled);
  });

  it("controlled, only the value prop commits", () => {
    const rejected = step(step(initial, "control"), "click");
    const committed = step(rejected, "hostToggle");
    expect(committed).toMatchObject({
      expanded: true,
      ariaExpanded: "true",
      panelHidden: false,
      valueProp: true,
      outcome: "none",
      requests: 1n,
    });
    expect(
      step(model.transition(committed, { _tag: "setValue", v: false }), "click"),
    ).toMatchObject({ expanded: false, outcome: "rejected", requested: true });
    // adopting a value on `control` keeps what was on screen
    expect(step(step(initial, "expand"), "control")).toMatchObject({
      expanded: true,
      valueProp: true,
    });
  });

  it("controlled, a host that accepts commits the intent through the value", () => {
    const host = step(step(initial, "control"), "acceptRequests");
    const clicked = step(host, "click");
    expect(clicked).toMatchObject({
      expanded: true,
      valueProp: true,
      outcome: "accepted",
      requested: true,
      requests: 1n,
    });
    expect(step(clicked, "collapse")).toMatchObject({
      expanded: false,
      valueProp: false,
      requests: 2n,
    });
  });

  it("no reachable state violates an invariant (explore + simulate)", () => {
    const { exploration, simulation } = verifySpec(model, { maxDepth: 6 });
    expect(exploration.states.length).toBeGreaterThan(10);
    expect(simulation.violations).toEqual([]);
  });

  it("replays the ported scenarios against the spec", async () => {
    expect(files).toContain("disclosure.apg.json");
    for (const name of files) {
      const file = parseScenarioFile(JSON.parse(readFileSync(new URL(name, scenariosDir), "utf8")));
      let passed = 0;
      for (const scenario of file.scenarios) {
        const result = await replayScenario(scenario, disclosureBridge, (config) =>
          specDriver(model, disclosureBridge, config),
        );
        if (result.status === "passed") {
          passed += 1;
          if (file.source === "apg") {
            // our own scenarios are written inside the spec's vocabulary
            expect(result.skipped).toEqual([]);
          }
        }
      }
      if (file.source === "apg") {
        expect(passed).toBe(file.scenarios.length);
      } else {
        expect(passed).toBeGreaterThan(0);
      }
    }
  });

  it("a differential walk of the spec against itself is stable", async () => {
    await differentialWalk({
      alphabet: disclosureSteps,
      probe: disclosureProbe,
      makePair: () =>
        Promise.resolve([specDriver(model, disclosureBridge), specDriver(model, disclosureBridge)]),
      runs: 5,
      steps: 20,
    });
  });
});
