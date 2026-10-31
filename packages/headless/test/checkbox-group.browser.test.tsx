import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import {
  checkboxGroupBridge,
  checkboxGroupConfig,
  checkboxGroupProbe,
  checkboxGroupSteps,
} from "@cssints/apg-specs/apg/checkbox-group.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import { createCheckboxGroup } from "../src/checkbox-group";
import ariakit from "@cssints/apg-specs/scenarios/apg/checkbox.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/checkbox.base-ui.json";
import definitionJson from "@cssints/apg-specs/apg/checkbox-group.model.json";
import { mountCheckboxGroup } from "./checkbox-group.fixture";
import { partsDriver } from "./parts-driver";
import reactAria from "@cssints/apg-specs/scenarios/apg/checkbox.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  partsDriver(mountCheckboxGroup(checkboxGroupConfig(config)));

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so closing the gap forces removing it) and says why.
const DEFAULT_VALUES =
  "the upstream fixture supplies unstated child values (red/green/blue); without a `values` config the primitive uses its own labels, so the reported value array differs";
const NATIVE_ATTR =
  "react-aria renders native checkboxes; the primitive exposes role=checkbox + aria-checked (APG) and reports onValueChange, not the native checked/onChange pair";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "checkbox.base-ui.group-omitted-defaultvalue": DEFAULT_VALUES,
  "checkbox.react-aria.group-selected-state": NATIVE_ATTR,
};

describe("createCheckboxGroup x ported scenarios (real DOM)", () => {
  for (const source of [ariakit, baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, checkboxGroupBridge, dom);
          const divergence = DIVERGENCES[scenario.id];
          if (divergence !== undefined) {
            await expect(run).rejects.toBeInstanceOf(ScenarioMismatch);
            return;
          }
          const result = await run;
          if (result.status === "unsupported") {
            context.skip(result.reason);
          }
        });
      }
    });
  }
});

describe("createCheckboxGroup x the field contract", () => {
  const values = ["email", "push", "sms"];

  it("announces its name, the description the host owns, and its error", () => {
    const group = createCheckboxGroup({
      values,
      label: "Notifications",
      describedby: "form-hint",
      invalid: "Pick a channel",
      error: "Pick at least one channel",
    });
    expect(group.groupProps.role).toBe("group");
    expect(group.groupProps.id).not.toBe("");
    expect(group.groupProps["aria-label"]).toBe("Notifications");
    expect(group.groupProps["aria-labelledby"]).toBeUndefined();
    // the error wins over the string `invalid`, and the error id comes first
    expect(group.invalid()).toBe(true);
    expect(group.error()).toBe("Pick at least one channel");
    expect(group.groupProps["aria-invalid"]).toBe("true");
    expect(group.groupProps["aria-describedby"]).toBe(`${group.errorProps.id} form-hint`);
    expect(group.describedIds()).toEqual([group.errorProps.id, "form-hint"]);
    // the error announces itself while it is shown
    expect(group.errorProps.hidden).toBe(false);
    expect(group.errorProps.role).toBe("alert");
  });

  it("names the group from a host element, and stays quiet while it is valid", () => {
    const group = createCheckboxGroup({
      values,
      labelledby: "channels-title",
      // `invalid: false` wins over a message: the host keeps the text ready
      invalid: false,
      error: "Pick at least one channel",
    });
    expect(group.groupProps["aria-labelledby"]).toBe("channels-title");
    expect(group.groupProps["aria-label"]).toBeUndefined();
    expect(group.invalid()).toBe(false);
    expect(group.error()).toBeUndefined();
    expect(group.groupProps["aria-invalid"]).toBeUndefined();
    expect(group.groupProps["aria-describedby"]).toBeUndefined();
    expect(group.errorProps.hidden).toBe(true);
    expect(group.errorProps.role).toBeUndefined();
  });

  it("keeps the announced attributes on the group, not on the boxes", () => {
    const group = createCheckboxGroup({ values, label: "Notifications", invalid: true });
    expect(group.groupProps["aria-invalid"]).toBe("true");
    // no error message: the group is marked, and nothing is described
    expect(group.groupProps["aria-describedby"]).toBeUndefined();
    expect(group.errorProps.hidden).toBe(true);
    expect(Object.keys(group.childProps(0))).not.toContain("aria-invalid");
    expect(Object.keys(group.parentProps)).not.toContain("aria-invalid");
  });

  it("derives the children's ids from the group's base, so two groups do not collide", () => {
    const named = createCheckboxGroup({ values, id: "channels", label: "Channels" });
    expect(named.groupProps.id).toBe("channels-control");
    expect([named.childProps(0).id, named.childProps(1).id, named.childProps(2).id]).toEqual([
      "channels-0",
      "channels-1",
      "channels-2",
    ]);
    // no `id`: the unique base keeps the group's and its children's ids apart too
    const first = createCheckboxGroup({ values, label: "Channels" });
    const second = createCheckboxGroup({ values, label: "Topics" });
    const firstIds = [first.childProps(0).id, first.childProps(1).id, first.childProps(2).id];
    const secondIds = [second.childProps(0).id, second.childProps(1).id, second.childProps(2).id];
    expect(firstIds).not.toEqual(secondIds);
    expect(first.groupProps.id).not.toBe(second.groupProps.id);
    for (const id of firstIds) {
      expect(id.startsWith(`${first.groupProps.id.replace(/-control$/, "")}-`)).toBe(true);
    }
  });
});

describe("createCheckboxGroup x spec (differential walk)", () => {
  const base: ScenarioConfig = {
    group: true,
    parent: true,
    values: ["0", "1", "2"],
  };
  for (const config of [
    base,
    { ...base, remember: true },
    { ...base, parent: false },
    { group: true, values: ["0", "1", "2"] },
    // controlled: a host that accepts every request, and one that holds
    { ...base, value: ["0"] },
    { ...base, value: ["0", "2"] },
    { ...base, controlled: true, accepts: true },
    { ...base, controlled: true, accepts: false, value: ["1"] },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: checkboxGroupSteps,
        probe: checkboxGroupProbe,
        makePair: () =>
          Promise.resolve([specDriver(model, checkboxGroupBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});
