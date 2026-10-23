import {
  type ScenarioConfig,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/src/scenario";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { createRoot, flush } from "solid-js";
import { describe, expect, it } from "vite-plus/test";
import { createResizablePanels } from "../src/resizable-panels";
import {
  resizablePanelsBridge,
  resizablePanelsConfig,
  resizablePanelsProbe,
  resizablePanelsSteps,
} from "@cssints/apg-specs/src/patterns/resizable-panels.bridge";
import apg from "@cssints/apg-specs/scenarios/patterns/resizable-panels.spec.json";
import definitionJson from "@cssints/apg-specs/src/patterns/resizable-panels.model.generated.json";
import { mountResizablePanels } from "./resizable-panels.fixture";
import { resizablePanelsDriver } from "./resizable-panels.driver";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  resizablePanelsDriver(mountResizablePanels(resizablePanelsConfig(config)));

describe("createResizablePanels x scenarios (real DOM)", () => {
  const file = parseScenarioFile(apg);
  describe(file.source, () => {
    for (const scenario of file.scenarios) {
      it(scenario.id, async (context) => {
        const result = await replayScenario(scenario, resizablePanelsBridge, dom);
        if (result.status === "unsupported") {
          context.skip(result.reason);
        }
      });
    }
  });
});

describe("createResizablePanels x spec (differential walk)", () => {
  it("asks the host for a layout without committing it (controlled, holds)", async () => {
    const driver = dom({ controlled: true, accepts: false });
    await driver.perform({ event: "focus", target: "separator:0" });
    await driver.perform({ event: "key", key: "ArrowRight", target: "separator:0" });
    expect(driver.observer.value?.()).toEqual([20, 40, 40]);
    expect(driver.observer.events("onSizesChange")).toEqual([[30, 30, 40]]);
    driver.dispose?.();
  });

  it("keeps its own accepted drag going (a host echo is not a write)", async () => {
    const driver = dom({ controlled: true });
    await driver.perform({ event: "dragStart", target: "separator:0" });
    await driver.perform({ event: "dragBy", value: 10 });
    await driver.perform({ event: "dragBy", value: 10 });
    expect(driver.observer.value?.()).toEqual([40, 20, 40]);
    await driver.perform({ event: "dragBy", value: -10 });
    expect(driver.observer.value?.()).toEqual([30, 30, 40]);
    driver.dispose?.();
  });

  it("drags by the pointer's distance, not by the event count", async () => {
    const driver = dom({});
    await driver.perform({ event: "dragStart", target: "separator:0" });
    await driver.perform({ event: "dragBy", value: 10 });
    await driver.perform({ event: "dragBy", value: 10 });
    expect(driver.observer.value?.()).toEqual([40, 20, 40]);
    expect(driver.observer.attr("separator:0", "aria-valuenow")).toBe("40");
    await driver.perform({ event: "dragBy", value: -10 });
    expect(driver.observer.value?.()).toEqual([30, 30, 40]);
    driver.dispose?.();
  });

  for (const config of [
    {},
    { orientation: "horizontal" },
    { controlled: true },
    { controlled: true, accepts: false },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: resizablePanelsSteps,
        probe: resizablePanelsProbe,
        makePair: () =>
          Promise.resolve([specDriver(model, resizablePanelsBridge, config), dom(config)]),
        runs: 6,
        steps: 20,
        seed: 23,
      });
    });
  }
});

describe("createResizablePanels remembered size", () => {
  it("a pane mounted already collapsed restores to its min", () => {
    const panels = createRoot(() =>
      createResizablePanels({
        panes: [{ collapsible: true }, {}, {}],
        defaultSizes: [0, 50, 50],
      }),
    );
    expect(panels.collapsed(0)).toBe(true);
    panels.keyDown(0, "Enter");
    expect(panels.sizes()).toEqual([10, 40, 50]);
  });
});

describe("createResizablePanels persistence", () => {
  const key = "cssints-resizable-panels-test";

  const mount = (defaultSizes?: ReadonlyArray<number>) =>
    createRoot(() =>
      createResizablePanels({
        panes: [{ collapsible: true }, {}, {}],
        storageKey: key,
        ...(defaultSizes === undefined ? {} : { defaultSizes }),
      }),
    );

  it("restores the layout it last wrote under storageKey", () => {
    localStorage.removeItem(key);
    const first = mount([20, 40, 40]);
    first.keyDown(0, "ArrowRight");
    flush();
    expect(first.sizes()).toEqual([30, 30, 40]);

    const second = mount([20, 40, 40]);
    expect(second.sizes()).toEqual([30, 30, 40]);
    localStorage.removeItem(key);
  });

  it("ignores a stored layout that is not a layout", () => {
    localStorage.setItem(key, JSON.stringify([1, 2]));
    const panels = mount([20, 40, 40]);
    expect(panels.sizes()).toEqual([20, 40, 40]);
    localStorage.removeItem(key);
  });
});
