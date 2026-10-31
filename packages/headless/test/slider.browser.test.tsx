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
import {
  sliderBridge,
  sliderConfig,
  sliderProbe,
  sliderSteps,
} from "@cssints/apg-specs/apg/slider.bridge";
import baseUi from "@cssints/apg-specs/scenarios/apg/slider.base-ui.json";
import definitionJson from "@cssints/apg-specs/apg/slider.model.json";
import { createSlider } from "../src/slider";
import type { Slider, SliderOptions } from "../src/slider";
import { domDriver } from "./dom-driver";
import { mountSlider } from "./slider.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/slider.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

// Solid 2 delivers events through its delegated listener on a later turn, and applies setters on its flush.
const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

const dom = (config: ScenarioConfig) =>
  domDriver(mountSlider(sliderConfig(config)), { hideableParts: [] });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so closing the gap forces removing it) and says why.
// The spec fixes one configuration (range 0..10, step 1, value 5), so most
// ported scenarios are `Unsupported` rather than divergent.
const DIVERGENCES: Readonly<Record<string, string>> = {};

describe("createSlider x ported scenarios (real DOM)", () => {
  for (const source of [baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, sliderBridge, dom);
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

describe("createSlider x spec (differential walk)", () => {
  // uncontrolled, then a controlled host that accepts every request, one that
  // pins the value (rejects), and one that pins it while vertical. The step-2
  // variants (bean qtmy) make a walk notice an arrow key that ignores `step`.
  for (const config of [
    {},
    { orientation: "vertical" },
    { dir: "rtl" },
    { orientation: "vertical", dir: "rtl" },
    { step: 2, largeStep: 4 },
    { step: 2, largeStep: 4, dir: "rtl" },
    { controlled: true },
    { controlled: true, value: 5 },
    { controlled: true, orientation: "vertical" },
    { controlled: true, step: 2, largeStep: 4, value: 6 },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: sliderSteps,
        probe: sliderProbe,
        makePair: () => Promise.resolve([specDriver(model, sliderBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});

// `disabled` is a widget-level extension of the pattern (the spec omits it): the thumb
// keeps its tab stop, announces `aria-disabled`, and drops every key and rail press.
describe("createSlider disabled", () => {
  const renderSlider = () => {
    const root = document.createElement("div");
    root.style.cssText = "position:fixed;top:0;left:0;width:100px;height:20px";
    document.body.append(root);
    const [disabled, setDisabled] = createSignal(true);
    const dispose = render(() => {
      const slider = createSlider({
        defaultValue: 5,
        get disabled() {
          return disabled();
        },
      });
      return (
        <>
          <div
            data-part="track"
            style={{ position: "absolute", inset: "0" }}
            {...slider.trackProps}
          />
          <div data-part="thumb" {...slider.thumbProps} />
        </>
      );
    }, root);
    const part = (name: string) => root.querySelector<HTMLElement>(`[data-part="${name}"]`)!;
    return {
      setDisabled,
      thumb: () => part("thumb"),
      track: () => part("track"),
      dispose: () => {
        dispose();
        root.remove();
      },
    };
  };

  it("keeps its tab stop, announces aria-disabled and ignores a key and a rail press", async () => {
    const { setDisabled, thumb, track, dispose } = renderSlider();
    const now = () => thumb().getAttribute("aria-valuenow");
    expect(thumb().getAttribute("aria-disabled")).toBe("true");
    // the thumb is the pattern's tab stop either way
    expect(thumb().getAttribute("tabindex")).toBe("0");

    thumb().focus();
    await tick();
    thumb().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await tick();
    expect(now()).toBe("5");

    track().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 80 }));
    await tick();
    track().dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 100 }));
    await tick();
    expect(now()).toBe("5");

    // the getter is live: enabling the thumb enables its keys and its rail
    setDisabled(false);
    await tick();
    expect(thumb().hasAttribute("aria-disabled")).toBe(false);
    thumb().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await tick();
    expect(now()).toBe("6");
    track().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 80 }));
    await tick();
    expect(now()).toBe("8");
    dispose();
  });
});

// The drag is a deliberate extension of `specs/apg/slider.qnt` (which fixes a
// discrete rail press and has no pointer position), so these cases are its
// oracle: the pointer's position on the rail is the value, in every
// orientation / direction, and a controlled host still owns the outcome.
describe("createSlider drag", () => {
  const mount = (options: SliderOptions) => {
    const root = document.createElement("div");
    root.style.cssText =
      options.orientation === "vertical"
        ? "position:fixed;top:0;left:0;width:20px;height:100px"
        : "position:fixed;top:0;left:0;width:100px;height:20px";
    document.body.append(root);
    const requests: number[] = [];
    let api: Slider | undefined;
    const dispose = render(() => {
      const slider = createSlider({
        ...options,
        onValueChange: (value) => {
          requests.push(value);
          options.onValueChange?.(value);
        },
      });
      api = slider;
      // the thumb sits in the rail, as a host positions it over the track
      return (
        <div data-part="track" style={{ position: "absolute", inset: "0" }} {...slider.trackProps}>
          <div data-part="thumb" {...slider.thumbProps} />
        </div>
      );
    }, root);
    const part = (name: string) => root.querySelector<HTMLElement>(`[data-part="${name}"]`)!;
    return {
      requests,
      track: () => part("track"),
      thumb: () => part("thumb"),
      now: () => part("thumb").getAttribute("aria-valuenow"),
      focused: () => api?.focused() === true,
      dispose: () => {
        dispose();
        root.remove();
      },
    };
  };

  const pointer = (element: Element, type: string, x: number, y: number): void => {
    element.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y }));
  };

  it("follows the pointer along the rail, one request per value, and stops on release", async () => {
    const slider = mount({ defaultValue: 0 });
    // a secondary click is not a press
    slider
      .track()
      .dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, button: 2, clientX: 90, clientY: 10 }),
      );
    await tick();
    expect(slider.now()).toBe("0");

    pointer(slider.track(), "pointerdown", 0, 10);
    await tick();
    expect(slider.now()).toBe("0");
    // a press at the value it already has is no request
    expect(slider.requests).toEqual([]);
    expect(slider.focused()).toBe(true);

    // 2.4 -> 2; then three moves inside one step, which is one request
    for (const x of [24, 51, 50, 52]) {
      pointer(slider.track(), "pointermove", x, 10);
      await tick();
    }
    expect(slider.now()).toBe("5");
    expect(slider.requests).toEqual([2, 5]);

    pointer(slider.track(), "pointerup", 52, 10);
    await tick();
    pointer(slider.track(), "pointermove", 90, 10);
    await tick();
    expect(slider.now()).toBe("5");
    slider.dispose();
  });

  it("clamps a drag past either end", async () => {
    const slider = mount({ defaultValue: 5 });
    pointer(slider.track(), "pointerdown", 50, 10);
    await tick();
    expect(slider.now()).toBe("5");
    pointer(slider.track(), "pointermove", -40, 10);
    await tick();
    expect(slider.now()).toBe("0");
    pointer(slider.track(), "pointermove", 140, 10);
    await tick();
    expect(slider.now()).toBe("10");
    pointer(slider.track(), "pointerup", 140, 10);
    await tick();
    expect(slider.requests).toEqual([0, 10]);
    slider.dispose();
  });

  it("a vertical rail increases upward, ltr and rtl alike", async () => {
    for (const direction of ["ltr", "rtl"] as const) {
      const slider = mount({ orientation: "vertical", direction, defaultValue: 0 });
      pointer(slider.track(), "pointerdown", 10, 99);
      await tick();
      expect(slider.now()).toBe("0");
      pointer(slider.track(), "pointermove", 10, 20);
      await tick();
      expect(slider.now()).toBe("8");
      pointer(slider.track(), "pointermove", 10, 79);
      await tick();
      expect(slider.now()).toBe("2");
      pointer(slider.track(), "pointerup", 10, 79);
      await tick();
      slider.dispose();
    }
  });

  it("a horizontal rtl rail counts from the right", async () => {
    const slider = mount({ direction: "rtl", defaultValue: 5 });
    pointer(slider.track(), "pointerdown", 0, 10);
    await tick();
    expect(slider.now()).toBe("10");
    pointer(slider.track(), "pointermove", 100, 10);
    await tick();
    expect(slider.now()).toBe("0");
    pointer(slider.track(), "pointerup", 100, 10);
    await tick();
    slider.dispose();
  });

  it("a press on the thumb starts the drag where the value is", async () => {
    const slider = mount({ defaultValue: 5 });
    // off the thumb's centre: it is already at its value, so no jump
    pointer(slider.thumb(), "pointerdown", 54, 10);
    await tick();
    expect(slider.now()).toBe("5");
    expect(slider.requests).toEqual([]);
    // a captured move is retargeted to the rail; here it bubbles to it
    pointer(slider.thumb(), "pointermove", 80, 10);
    await tick();
    expect(slider.now()).toBe("8");
    pointer(slider.thumb(), "pointerup", 80, 10);
    await tick();
    slider.dispose();
  });

  it("a controlled host that rejects the drag keeps its value", async () => {
    // `value` without an accepting host: every request is ignored
    const slider = mount({ value: 5, defaultValue: 5 });
    pointer(slider.track(), "pointerdown", 10, 10);
    await tick();
    pointer(slider.track(), "pointermove", 90, 10);
    await tick();
    expect(slider.now()).toBe("5");
    expect(slider.requests).toEqual([1, 9]);
    pointer(slider.track(), "pointerup", 90, 10);
    await tick();
    slider.dispose();
  });

  it("a lost capture and a cancel both end the drag", async () => {
    const slider = mount({ defaultValue: 0 });
    pointer(slider.track(), "pointerdown", 20, 10);
    await tick();
    expect(slider.now()).toBe("2");

    slider.track().dispatchEvent(new PointerEvent("lostpointercapture", { bubbles: true }));
    await tick();
    pointer(slider.track(), "pointermove", 100, 10);
    await tick();
    expect(slider.now()).toBe("2");

    pointer(slider.track(), "pointerdown", 20, 10);
    await tick();
    expect(slider.now()).toBe("2");
    pointer(slider.track(), "pointermove", 30, 10);
    await tick();
    expect(slider.now()).toBe("3");
    pointer(slider.track(), "pointercancel", 30, 10);
    await tick();
    pointer(slider.track(), "pointermove", 90, 10);
    await tick();
    expect(slider.now()).toBe("3");
    slider.dispose();
  });
});
