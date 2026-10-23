import { type ScenarioConfig, differentialWalk, specDriver } from "@cssints/apg-specs/src/scenario";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import {
  timelineBridge,
  timelineConfig,
  timelineProbe,
  timelineSteps,
} from "@cssints/apg-specs/src/apg/timeline.bridge";
import definitionJson from "@cssints/apg-specs/src/apg/timeline.model.generated.json";
import { domDriver } from "./dom-driver";
import { mountTimeline } from "./timeline.fixture";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountTimeline(timelineConfig(config)), { hideableParts: ["row"] });

describe("createTimeline x spec (differential walk)", () => {
  // uncontrolled, an uncontrolled initial selection, a controlled host that
  // accepts every request, and a host that pins the value (rejects)
  for (const config of [
    {},
    { selected: 2 },
    { controlled: true, selected: 0 },
    { controlled: true, selected: 3 },
    { controlled: true, value: 4 },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: timelineSteps,
        probe: timelineProbe,
        makePair: () => Promise.resolve([specDriver(model, timelineBridge, config), dom(config)]),
        runs: 10,
        steps: 20,
        seed: 7,
      });
    });
  }
});

describe("createTimeline (real DOM)", () => {
  it("collapsing a parent hides its children", async () => {
    const driver = dom({});
    // start closed: expanding the root then the child shows the grandchildren
    await driver.perform({ event: "click", target: "row:0" });
    await driver.perform({ event: "click", target: "row:1" });
    expect(driver.observer.attr("row:2", "hidden")).toBe(null);
    expect(driver.observer.attr("row:3", "hidden")).toBe(null);
    // collapse the child again
    await driver.perform({ event: "click", target: "row:1" });
    expect(driver.observer.attr("row:2", "hidden")).toBe("true");
    expect(driver.observer.attr("row:3", "hidden")).toBe("true");
    driver.dispose?.();
  });

  it("zoom changes the ruler aria values and reset restores them", async () => {
    const driver = dom({});
    expect(driver.observer.attr("ruler", "aria-valuemin")).toBe("0");
    expect(driver.observer.attr("ruler", "aria-valuemax")).toBe("100");
    await driver.perform({ event: "prop", prop: "zoomIn" });
    expect(driver.observer.attr("ruler", "aria-valuemin")).not.toBe("0");
    expect(driver.observer.attr("ruler", "aria-valuemax")).not.toBe("100");
    await driver.perform({ event: "prop", prop: "zoomReset" });
    expect(driver.observer.attr("ruler", "aria-valuemin")).toBe("0");
    expect(driver.observer.attr("ruler", "aria-valuemax")).toBe("100");
    driver.dispose?.();
  });

  it("arrow keys move focus with roving tabindex", async () => {
    const driver = dom({});
    await driver.perform({ event: "click", target: "row:0" });
    expect(driver.observer.focus()).toBe("row:0");
    expect(driver.observer.attr("row:0", "tabindex")).toBe("0");
    await driver.perform({ event: "key", key: "ArrowDown", target: "row:0" });
    expect(driver.observer.focus()).toBe("row:1");
    expect(driver.observer.attr("row:1", "tabindex")).toBe("0");
    expect(driver.observer.attr("row:0", "tabindex")).toBe("-1");
    driver.dispose?.();
  });

  it("Enter selects the focused span", async () => {
    const driver = dom({});
    await driver.perform({ event: "click", target: "row:0" });
    await driver.perform({ event: "key", key: "ArrowDown", target: "row:0" });
    await driver.perform({ event: "key", key: "Enter", target: "row:1" });
    expect(driver.observer.attr("row:1", "aria-selected")).toBe("true");
    expect(driver.observer.attr("row:0", "aria-selected")).toBe("false");
    driver.dispose?.();
  });

  it("uncontrolled, a selection request commits and fires onValueChange", async () => {
    const driver = dom({});
    await driver.perform({ event: "click", target: "row:0" });
    expect(driver.observer.attr("row:0", "aria-selected")).toBe("true");
    expect(driver.observer.events("onValueChange")).toEqual([1]);
    driver.dispose?.();
  });

  it("controlled, an accepting host commits the requested selection", async () => {
    const driver = dom({ controlled: true, selected: 0 });
    // the root opens, then the child becomes clickable
    await driver.perform({ event: "click", target: "row:0" });
    await driver.perform({ event: "click", target: "row:1" });
    expect(driver.observer.attr("row:1", "aria-selected")).toBe("true");
    expect(driver.observer.events("onValueChange")).toEqual([1, 2]);
    driver.dispose?.();
  });

  it("controlled, a rejected request fires onValueChange but leaves the selection; the host write commits", async () => {
    const driver = dom({ controlled: true, value: 2 });
    expect(driver.observer.attr("row:1", "aria-selected")).toBe("true");
    // open the root, then the child, so row:3 (node 4) is reachable
    await driver.perform({ event: "click", target: "row:0" });
    await driver.perform({ event: "click", target: "row:1" });
    await driver.perform({ event: "key", key: "Enter", target: "row:3" });
    // focus moved, selection did not; each intent change fired the callback
    expect(driver.observer.focus()).toBe("row:3");
    expect(driver.observer.attr("row:1", "aria-selected")).toBe("true");
    expect(driver.observer.events("onValueChange")).toEqual([1, 4]);
    await driver.perform({ event: "prop", prop: "setValue", value: 4 });
    expect(driver.observer.attr("row:3", "aria-selected")).toBe("true");
    expect(driver.observer.attr("row:1", "aria-selected")).toBe("false");
    driver.dispose?.();
  });
});
