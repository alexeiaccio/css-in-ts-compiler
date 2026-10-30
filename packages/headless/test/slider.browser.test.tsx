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
