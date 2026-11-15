import {
  type ScenarioConfig,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { render } from "@solidjs/web";
import { createRoot, flush } from "solid-js";
import { describe, expect, it } from "vite-plus/test";
import { type ResizablePanels, createResizablePanels } from "../src/resizable-panels";
import {
  resizablePanelsBridge,
  resizablePanelsConfig,
  resizablePanelsProbe,
  resizablePanelsSteps,
} from "@cssints/apg-specs/patterns/resizable-panels.bridge";
import apg from "@cssints/apg-specs/scenarios/patterns/resizable-panels.spec.json";
import definitionJson from "@cssints/apg-specs/patterns/resizable-panels.model.json";
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

describe("createResizablePanels defaults", () => {
  it("keeps a pane's defaultSize and shares the rest among the panes that name none", () => {
    const panels = createRoot(() =>
      createResizablePanels({
        panes: [{ defaultSize: 24, min: 15, collapsible: true }, { max: 100 }, {}],
      }),
    );
    expect(panels.sizes()).toEqual([24, 38, 38]);
  });
  it("splits equally when no pane names a size", () => {
    const panels = createRoot(() => createResizablePanels({ panes: [{}, {}, {}] }));
    expect(panels.sizes()).toEqual([33.34, 33.33, 33.33]);
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

/** A 600 px group of three panes with real separator bars: the drag measures the group, so a test needs a layout. */
const mountSnap = (snap: boolean) => {
  const root = document.createElement("div");
  document.body.append(root);
  let api: ResizablePanels | undefined;
  const dispose = render(() => {
    const panels = createResizablePanels({
      panes: [{}, {}, {}],
      defaultSizes: [20, 40, 40],
      snap,
    });
    api = panels;
    return (
      <div {...panels.groupProps} data-part="group" style={{ display: "flex", width: "600px" }}>
        <div {...panels.paneProps(0)} style={{ flex: `${panels.sizes()[0] ?? 0} 1 0` }} />
        <div
          {...panels.separatorProps(0)}
          data-part="split"
          style={{ width: "8px", flex: "none" }}
        />
        <div {...panels.paneProps(1)} style={{ flex: `${panels.sizes()[1] ?? 0} 1 0` }} />
        <div
          {...panels.separatorProps(1)}
          data-part="split"
          style={{ width: "8px", flex: "none" }}
        />
        <div {...panels.paneProps(2)} style={{ flex: `${panels.sizes()[2] ?? 0} 1 0` }} />
      </div>
    );
  }, root);
  const split = (index: number): HTMLElement =>
    root.querySelectorAll<HTMLElement>('[data-part="split"]')[index]!;
  return {
    api: api!,
    split,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

/** One drag on separator 0 from where it is to `percent`, in the group's 600 px (6 px a percent). */
const dragTo = (element: HTMLElement, from: number, percent: number, altKey = false): void => {
  const at = 100 + from * 6;
  const to = 100 + percent * 6;
  const fire = (type: string, x: number, buttons: number, alt: boolean): void => {
    element.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true,
        button: 0,
        buttons,
        clientX: x,
        clientY: 0,
        altKey: alt,
      }),
    );
  };
  fire("pointerdown", at, 1, false);
  fire("pointermove", to, 1, altKey);
  fire("pointerup", to, 0, altKey);
  // Solid 2 applies a setter on the next flush: a signal the drag wrote is read after one
  flush();
};

describe("createResizablePanels snap", () => {
  it("learns the width it is dropped at, and the edge sticks to it", () => {
    const { api, split, dispose } = mountSnap(true);
    expect(api.snapPoint(0)).toBeUndefined();

    // three releases in one hill; two would not be enough
    dragTo(split(0), 20, 24);
    dragTo(split(0), 24, 24.2);
    expect(api.snapPoint(0)).toBeUndefined();
    dragTo(split(0), 24.2, 24);
    expect(api.snapPoint(0)).toBe(24);

    // inside the 10 px zone the edge lands on the point while the pointer keeps moving
    dragTo(split(0), 24, 25);
    expect(api.sizes()[0]).toBe(24);
    // Alt asks for the exact width, so the widths beside the point are reachable
    dragTo(split(0), 24, 25, true);
    expect(api.sizes()[0]).toBe(25);
    // past the zone the edge follows the pointer again
    dragTo(split(0), 25, 30);
    expect(api.sizes()[0]).toBe(30);
    dispose();
  });

  it("never snaps the keyboard, and is off unless asked", () => {
    const on = mountSnap(true);
    dragTo(on.split(0), 20, 24);
    dragTo(on.split(0), 24, 24.2);
    dragTo(on.split(0), 24.2, 24);
    expect(on.api.snapPoint(0)).toBe(24);
    // a key step is exact: from the point, one step is a whole step, not the point again
    on.api.keyDown(0, "ArrowRight");
    expect(on.api.sizes()[0]).toBe(34);
    on.dispose();

    const off = mountSnap(false);
    dragTo(off.split(0), 20, 24);
    dragTo(off.split(0), 24, 24.2);
    dragTo(off.split(0), 24.2, 24);
    expect(off.api.snapPoint(0)).toBeUndefined();
    dragTo(off.split(0), 24, 25);
    expect(off.api.sizes()[0]).toBe(25);
    off.dispose();
  });
});
