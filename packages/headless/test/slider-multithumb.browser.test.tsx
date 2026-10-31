import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";
import { type SliderMultiThumb, createSliderMultiThumb } from "../src/slider-multithumb";
import type { SliderDirection, SliderOrientation } from "../src/slider";
import {
  sliderMultithumbBridge,
  sliderMultithumbConfig,
  sliderMultithumbProbe,
  sliderMultithumbSteps,
} from "@cssints/apg-specs/apg/slider-multithumb.bridge";
import baseUi from "@cssints/apg-specs/scenarios/apg/slider-multithumb.base-ui.json";
import definitionJson from "@cssints/apg-specs/apg/slider-multithumb.model.json";
import { domDriver } from "./dom-driver";
import { mountSliderMultithumb } from "./slider-multithumb.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/slider-multithumb.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountSliderMultithumb(sliderMultithumbConfig(config)), {
    hideableParts: [],
  });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail. The spec fixes two thumbs over 0..10 with values
// [3, 7], so every ported scenario (which sets other `values`/ranges) is
// `Unsupported` rather than divergent.
const DIVERGENCES: Readonly<Record<string, string>> = {};

describe("createSliderMultiThumb x ported scenarios (real DOM)", () => {
  for (const source of [baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, sliderMultithumbBridge, dom);
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

describe("createSliderMultiThumb x spec (differential walk)", () => {
  for (const config of [
    {},
    { orientation: "vertical" },
    { dir: "rtl" },
    { orientation: "vertical", dir: "rtl" },
    // controlled: a host that accepts every request, and one that holds
    { controlled: true, accepts: true },
    { controlled: true, accepts: true, values: [3, 7] },
    { controlled: true, accepts: false, values: [3, 7] },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: sliderMultithumbSteps,
        probe: sliderMultithumbProbe,
        makePair: () =>
          Promise.resolve([specDriver(model, sliderMultithumbBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});

// A press on the rail and the drag it starts are deliberate extensions of
// `specs/apg/slider-multithumb.qnt` (its press names its thumb and has no pointer
// position), so these cases are the oracle: the measured position picks the
// nearer thumb (a tie to the lower), the four orientation/direction
// combinations agree with the arrow keys, a thumb cannot be dragged past its
// neighbour, and `disabled` drops every press and every move.

const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

interface MountConfig {
  readonly orientation?: SliderOrientation;
  readonly direction?: SliderDirection;
  readonly defaultValue?: readonly [number, number];
  readonly disabled?: () => boolean;
}

const mountRail = (config: MountConfig = {}) => {
  const root = document.createElement("div");
  root.style.cssText =
    config.orientation === "vertical"
      ? "position:fixed;top:0;left:0;width:20px;height:100px"
      : "position:fixed;top:0;left:0;width:100px;height:20px";
  document.body.append(root);
  const requests: [number, number][] = [];
  let api: SliderMultiThumb | undefined;
  const dispose = render(() => {
    const slider = createSliderMultiThumb({
      defaultValue: config.defaultValue ?? [3, 7],
      get orientation() {
        return config.orientation ?? "horizontal";
      },
      get direction() {
        return config.direction ?? "ltr";
      },
      get disabled() {
        return config.disabled?.() === true;
      },
      onValueChange: (values) => {
        requests.push([...values]);
      },
    });
    api = slider;
    // the thumbs sit in the rail, as a host positions them over the track
    return (
      <div data-part="track" style={{ position: "absolute", inset: "0" }} {...slider.trackProps}>
        <div data-part="thumb" {...slider.thumbProps(0)} />
        <div data-part="thumb" {...slider.thumbProps(1)} />
      </div>
    );
  }, root);
  const part = (name: string, index = 0): HTMLElement =>
    root.querySelectorAll<HTMLElement>(`[data-part="${name}"]`)[index]!;
  return {
    requests,
    track: () => part("track"),
    thumb: (index: 0 | 1) => part("thumb", index),
    now: (index: 0 | 1) => part("thumb", index).getAttribute("aria-valuenow"),
    focused: () => api?.focused() ?? null,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

const pointer = (element: Element, type: string, x: number, y: number): void => {
  element.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y }));
};

describe("createSliderMultiThumb rail press", () => {
  it("moves the nearer thumb: the lower for a press near it, the upper for a press near it", async () => {
    const lower = mountRail();
    pointer(lower.track(), "pointerdown", 10, 10);
    await tick();
    expect(lower.now(0)).toBe("1");
    expect(lower.now(1)).toBe("7");
    expect(lower.focused()).toBe(0);
    expect(lower.requests).toEqual([[1, 7]]);
    lower.dispose();

    const upper = mountRail();
    pointer(upper.track(), "pointerdown", 90, 10);
    await tick();
    expect(upper.now(0)).toBe("3");
    expect(upper.now(1)).toBe("9");
    expect(upper.focused()).toBe(1);
    upper.dispose();
  });

  it("a tie goes to the lower thumb", async () => {
    const slider = mountRail();
    // 50% is as far from 3 as from 7: the floor takes it, so the ceiling stays
    pointer(slider.track(), "pointerdown", 50, 10);
    await tick();
    expect(slider.now(0)).toBe("5");
    expect(slider.now(1)).toBe("7");
    expect(slider.focused()).toBe(0);
    slider.dispose();
  });

  it("a press on a thumb drags that thumb from where it is, without a jump", async () => {
    const slider = mountRail();
    // 54 is a step away from the lower thumb's 30%: a rail press would jump, a thumb press does not
    pointer(slider.thumb(0), "pointerdown", 54, 10);
    await tick();
    expect(slider.now(0)).toBe("3");
    expect(slider.requests).toEqual([]);
    expect(slider.focused()).toBe(0);
    pointer(slider.thumb(0), "pointermove", 80, 10);
    await tick();
    expect(slider.now(0)).toBe("7");
    pointer(slider.thumb(0), "pointerup", 80, 10);
    await tick();
    slider.dispose();
  });
});

describe("createSliderMultiThumb drag", () => {
  it("keeps following the pointer after the press, one request per value, and stops on release", async () => {
    const slider = mountRail({ defaultValue: [0, 9] });
    pointer(slider.track(), "pointerdown", 10, 10);
    await tick();
    expect(slider.now(0)).toBe("1");
    expect(slider.focused()).toBe(0);

    // 2.4 -> 2; then three moves inside one step, which is one request
    for (const x of [24, 51, 50, 52]) {
      pointer(slider.track(), "pointermove", x, 10);
      await tick();
    }
    expect(slider.now(0)).toBe("5");
    expect(slider.requests).toEqual([
      [1, 9],
      [2, 9],
      [5, 9],
    ]);

    pointer(slider.track(), "pointerup", 52, 10);
    await tick();
    pointer(slider.track(), "pointermove", 90, 10);
    await tick();
    expect(slider.now(0)).toBe("5");
    slider.dispose();
  });

  it("clamps a thumb against its neighbour, then follows it back", async () => {
    const slider = mountRail();
    // the upper thumb takes a press at 90%, then a drag below the lower one clamps to it
    pointer(slider.track(), "pointerdown", 90, 10);
    await tick();
    expect(slider.now(1)).toBe("9");
    pointer(slider.track(), "pointermove", 20, 10);
    await tick();
    expect(slider.now(0)).toBe("3");
    expect(slider.now(1)).toBe("3");
    pointer(slider.track(), "pointermove", 40, 10);
    await tick();
    expect(slider.now(1)).toBe("4");
    pointer(slider.track(), "pointerup", 40, 10);
    await tick();
    slider.dispose();
  });

  it("a vertical rail increases upward", async () => {
    const slider = mountRail({ orientation: "vertical" });
    // 10 px from the top of 100 is 90%, the upper thumb
    pointer(slider.track(), "pointerdown", 10, 10);
    await tick();
    expect(slider.now(1)).toBe("9");
    pointer(slider.track(), "pointermove", 10, 50);
    await tick();
    expect(slider.now(1)).toBe("5");
    pointer(slider.track(), "pointermove", 10, 90);
    await tick();
    expect(slider.now(1)).toBe("3");
    pointer(slider.track(), "pointerup", 10, 90);
    await tick();
    slider.dispose();
  });

  it("a horizontal rtl rail counts from its right edge", async () => {
    const slider = mountRail({ direction: "rtl" });
    // 10 px from the right of 100 is 90% under rtl: the upper thumb
    pointer(slider.track(), "pointerdown", 10, 10);
    await tick();
    expect(slider.now(1)).toBe("9");
    pointer(slider.track(), "pointermove", 80, 10);
    await tick();
    expect(slider.now(1)).toBe("3");
    pointer(slider.track(), "pointermove", 60, 10);
    await tick();
    expect(slider.now(1)).toBe("4");
    pointer(slider.track(), "pointerup", 60, 10);
    await tick();
    slider.dispose();
  });
});

describe("createSliderMultiThumb disabled", () => {
  it("keeps both tab stops, announces aria-disabled and ignores a key, a press and a drag", async () => {
    const [disabled, setDisabled] = createSignal(true);
    const slider = mountRail({ disabled: () => disabled() });
    expect(slider.thumb(0).getAttribute("aria-disabled")).toBe("true");
    expect(slider.thumb(1).getAttribute("aria-disabled")).toBe("true");
    // both thumbs are the pattern's tab stops either way
    expect(slider.thumb(0).getAttribute("tabindex")).toBe("0");
    expect(slider.thumb(1).getAttribute("tabindex")).toBe("0");

    slider.thumb(1).focus();
    await tick();
    slider
      .thumb(1)
      .dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await tick();
    expect(slider.now(1)).toBe("7");

    pointer(slider.track(), "pointerdown", 90, 10);
    await tick();
    pointer(slider.track(), "pointermove", 10, 10);
    await tick();
    expect(slider.now(0)).toBe("3");
    expect(slider.now(1)).toBe("7");
    expect(slider.requests).toEqual([]);

    // the getter is live: enabling the pair enables its keys, its press and its drag
    setDisabled(false);
    await tick();
    expect(slider.thumb(1).hasAttribute("aria-disabled")).toBe(false);
    slider
      .thumb(1)
      .dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await tick();
    expect(slider.now(1)).toBe("8");
    pointer(slider.track(), "pointerdown", 10, 10);
    await tick();
    expect(slider.now(0)).toBe("1");
    pointer(slider.track(), "pointermove", 20, 10);
    await tick();
    expect(slider.now(0)).toBe("2");
    slider.dispose();
  });
});
