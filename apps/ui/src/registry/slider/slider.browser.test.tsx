import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import {
  sliderBridge,
  sliderConfig,
  sliderProbe,
  sliderSteps,
} from "@cssints/apg-specs/apg/slider.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";
import baseUi from "@cssints/apg-specs/scenarios/apg/slider.base-ui.json";
import definitionJson from "@cssints/apg-specs/apg/slider.model.json";
import { domDriver } from "./slider-driver.ts";
import { mountSlider } from "./slider.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/slider.react-aria.json";
import { Slider } from "./slider.tsx";
import type { Slider as SliderController, SliderOptions } from "@cssints/headless";

// The copy's own conformance: the same scenarios the primitive is checked against, driven through
// this styled slider rather than through the bare controller. The bridge speaks the primitive's
// parts (`thumb`, `track`); the skin names them after itself (`slider-thumb`, `slider`), so the
// target is translated on the way in and every attribute read lands on the skin's own element.
const model = makeReferenceModel(decodeDefinition(definitionJson));

// Solid 2 delivers events through its delegated listener on a later turn, and applies setters on its flush.
const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

type Driver = ReturnType<typeof domDriver>;

const toSkin = (target: string | undefined): string | undefined =>
  target?.replace(/^thumb/, "slider-thumb").replace(/^(track|rail)/, "slider");

const translated = (driver: Driver): Driver => ({
  ...driver,
  perform: (step) => {
    const target = toSkin(step.target);
    return driver.perform(target === undefined ? step : { ...step, target });
  },
  observer: {
    ...driver.observer,
    attr: (target, name) => driver.observer.attr(toSkin(target) ?? target, name),
  },
});

const dom = (config: ScenarioConfig) =>
  translated(domDriver(mountSlider(sliderConfig(config)), { hideableParts: [] }));

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so closing the gap forces removing it) and says why.
// The spec fixes one configuration (range 0..10, step 1, value 5), so most
// ported scenarios are `Unsupported` rather than divergent.
const DIVERGENCES: Readonly<Record<string, string>> = {};

describe("Slider x ported scenarios (real DOM)", () => {
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

describe("Slider x spec (differential walk)", () => {
  // uncontrolled, then a controlled host that accepts every request, one that
  // pins the value (rejects), and one that pins it while vertical. The step-2
  // variants (bean qtmy) make a walk notice an arrow key that ignores `step`.
  const CONFIGS: ReadonlyArray<ScenarioConfig> = [
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
  ];
  for (const config of CONFIGS) {
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

// The skin's own contract: the rail copies the announced orientation and the disabled state (a box
// cannot read an attribute of its child), and the fill is the value's share of the rail as an inline
// percentage of the same attributes the thumb announces.
const mount = (view: () => ReturnType<typeof Slider>): HTMLElement => {
  const root = document.createElement("div");
  document.body.append(root);
  render(view, root);
  return root;
};

const part = (root: HTMLElement, name: string): HTMLElement =>
  root.querySelector<HTMLElement>(`[data-part="${name}"]`)!;

describe("Slider skin", () => {
  it("paints the fill as the thumb's share, and copies its orientation onto the rail", async () => {
    const root = mount(() => <Slider label="Volume" defaultValue={5} />);
    const rail = part(root, "slider");
    const fill = part(root, "slider-fill");
    const thumb = part(root, "slider-thumb");
    expect(rail.getAttribute("data-orientation")).toBe("horizontal");
    expect(thumb.getAttribute("aria-orientation")).toBe("horizontal");
    expect(thumb.getAttribute("role")).toBe("slider");
    expect(thumb.getAttribute("aria-label")).toBe("Volume");
    expect(thumb.getAttribute("aria-valuenow")).toBe("5");
    expect(fill.getAttribute("aria-hidden")).toBe("true");
    expect(fill.style.width).toBe("50%");
    // a key moves the value and the fill follows the same attributes the thumb announces
    thumb.focus();
    await tick();
    thumb.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await tick();
    expect(thumb.getAttribute("aria-valuenow")).toBe("6");
    expect(fill.style.width).toBe("60%");
  });

  it("takes its geometry from the range, and vertical grows upward", () => {
    const root = mount(() => <Slider label="Volume" min={10} max={50} defaultValue={25} />);
    // 25 in 10..50 is three eighths of the rail
    expect(part(root, "slider-fill").style.width).toBe("37.5%");

    const vertical = mount(() => (
      <Slider label="Volume" min={10} max={50} defaultValue={25} orientation="vertical" />
    ));
    expect(part(vertical, "slider").getAttribute("data-orientation")).toBe("vertical");
    expect(part(vertical, "slider-thumb").getAttribute("aria-orientation")).toBe("vertical");
    const fill = part(vertical, "slider-fill");
    expect(fill.style.height).toBe("37.5%");
    expect(fill.style.width).toBe("");
  });

  it("copies aria-disabled onto the rail, so the rail and the thumb are greyed together", () => {
    const root = mount(() => <Slider label="Volume" defaultValue={5} disabled />);
    expect(part(root, "slider-thumb").getAttribute("aria-disabled")).toBe("true");
    expect(part(root, "slider").getAttribute("aria-disabled")).toBe("true");
    // painted from the attribute the rail now carries
    expect(getComputedStyle(part(root, "slider")).cursor).toBe("not-allowed");
    expect(getComputedStyle(part(root, "slider-thumb")).cursor).toBe("not-allowed");
  });
});

// `disabled` is a widget-level extension of the pattern (the spec omits it): the thumb
// keeps its tab stop, announces `aria-disabled`, and drops every key and rail press.
describe("Slider disabled", () => {
  const renderSlider = () => {
    const root = document.createElement("div");
    root.style.cssText = "position:fixed;top:0;left:0;width:100px;height:20px";
    document.body.append(root);
    const [disabled, setDisabled] = createSignal(true);
    let api: SliderController | undefined;
    const dispose = render(
      () => (
        <Slider
          label="Volume"
          defaultValue={5}
          disabled={disabled()}
          onReady={(slider) => {
            api = slider;
          }}
        />
      ),
      root,
    );
    const partOf = (name: string) => root.querySelector<HTMLElement>(`[data-part="${name}"]`)!;
    return {
      setDisabled,
      api: () => api,
      thumb: () => partOf("slider-thumb"),
      rail: () => partOf("slider"),
      dispose: () => {
        dispose();
        root.remove();
      },
    };
  };

  it("keeps its tab stop, announces aria-disabled and ignores a key and a rail press", async () => {
    const { setDisabled, api, thumb, rail, dispose } = renderSlider();
    const now = () => thumb().getAttribute("aria-valuenow");
    expect(thumb().getAttribute("aria-disabled")).toBe("true");
    // the thumb is the pattern's tab stop either way
    expect(thumb().getAttribute("tabindex")).toBe("0");

    thumb().focus();
    await tick();
    expect(api()?.focused()).toBe(true);
    thumb().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await tick();
    expect(now()).toBe("5");

    const rect = rail().getBoundingClientRect();
    rail().dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: rect.left + rect.width * 0.8 }),
    );
    await tick();
    rail().dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: rect.left + rect.width }),
    );
    await tick();
    expect(now()).toBe("5");

    // the getter is live: enabling the thumb enables its keys and its rail
    setDisabled(false);
    await tick();
    expect(thumb().hasAttribute("aria-disabled")).toBe(false);
    thumb().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await tick();
    expect(now()).toBe("6");
    rail().dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: rect.left + rect.width * 0.8 }),
    );
    await tick();
    expect(now()).toBe("8");
    dispose();
  });
});

// The drag is a deliberate extension of `specs/apg/slider.qnt` (which fixes a
// discrete rail press and has no pointer position), so these cases are its
// oracle: the pointer's position on the rail is the value, in every
// orientation / direction, and a controlled host still owns the outcome.
describe("Slider drag", () => {
  const mountDrag = (options: SliderOptions) => {
    const root = document.createElement("div");
    root.style.cssText =
      options.orientation === "vertical"
        ? "position:fixed;top:0;left:0;width:100px;height:100px"
        : "position:fixed;top:0;left:0;width:100px;height:20px";
    document.body.append(root);
    const requests: number[] = [];
    let api: SliderController | undefined;
    const dispose = render(
      () => (
        <Slider
          label="Volume"
          {...options}
          onReady={(slider) => {
            api = slider;
          }}
          onValueChange={(value) => {
            requests.push(value);
            options.onValueChange?.(value);
          }}
        />
      ),
      root,
    );
    const partOf = (name: string) => root.querySelector<HTMLElement>(`[data-part="${name}"]`)!;
    return {
      requests,
      rail: () => partOf("slider"),
      thumb: () => partOf("slider-thumb"),
      now: () => partOf("slider-thumb").getAttribute("aria-valuenow"),
      focused: () => api?.focused() === true,
      dispose: () => {
        dispose();
        root.remove();
      },
    };
  };

  // The rail is the skin's box (a 100x8 strip, or 8x40 upright), so a pointer is
  // placed as a fraction of the rail's rect rather than at the primitive test's
  // pixels; a move dispatched on the thumb is read against the rail, as the
  // primitive reads it.
  const pointer = (
    rail: () => HTMLElement,
    element: Element,
    type: string,
    x: number,
    y: number,
  ): void => {
    const rect = rail().getBoundingClientRect();
    element.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        clientX: rect.left + rect.width * x,
        clientY: rect.top + rect.height * y,
      }),
    );
  };

  it("follows the pointer along the rail, one request per value, and stops on release", async () => {
    const slider = mountDrag({ defaultValue: 0 });
    // a secondary click is not a press
    slider
      .rail()
      .dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, button: 2, clientX: 90, clientY: 4 }),
      );
    await tick();
    expect(slider.now()).toBe("0");

    pointer(slider.rail, slider.rail(), "pointerdown", 0, 0.5);
    await tick();
    expect(slider.now()).toBe("0");
    // a press at the value it already has is no request
    expect(slider.requests).toEqual([]);
    expect(slider.focused()).toBe(true);

    // 0.24 -> 2; then three moves inside one step, which is one request
    for (const x of [0.24, 0.51, 0.5, 0.52]) {
      pointer(slider.rail, slider.rail(), "pointermove", x, 0.5);
      await tick();
    }
    expect(slider.now()).toBe("5");
    expect(slider.requests).toEqual([2, 5]);

    pointer(slider.rail, slider.rail(), "pointerup", 0.52, 0.5);
    await tick();
    pointer(slider.rail, slider.rail(), "pointermove", 0.9, 0.5);
    await tick();
    expect(slider.now()).toBe("5");
    slider.dispose();
  });

  it("clamps a drag past either end", async () => {
    const slider = mountDrag({ defaultValue: 5 });
    pointer(slider.rail, slider.rail(), "pointerdown", 0.5, 0.5);
    await tick();
    expect(slider.now()).toBe("5");
    pointer(slider.rail, slider.rail(), "pointermove", -0.4, 0.5);
    await tick();
    expect(slider.now()).toBe("0");
    pointer(slider.rail, slider.rail(), "pointermove", 1.4, 0.5);
    await tick();
    expect(slider.now()).toBe("10");
    pointer(slider.rail, slider.rail(), "pointerup", 1.4, 0.5);
    await tick();
    expect(slider.requests).toEqual([0, 10]);
    slider.dispose();
  });

  it("a vertical rail increases upward, ltr and rtl alike", async () => {
    for (const direction of ["ltr", "rtl"] as const) {
      const slider = mountDrag({ orientation: "vertical", direction, defaultValue: 0 });
      pointer(slider.rail, slider.rail(), "pointerdown", 0.5, 0.99);
      await tick();
      expect(slider.now()).toBe("0");
      pointer(slider.rail, slider.rail(), "pointermove", 0.5, 0.2);
      await tick();
      expect(slider.now()).toBe("8");
      pointer(slider.rail, slider.rail(), "pointermove", 0.5, 0.79);
      await tick();
      expect(slider.now()).toBe("2");
      pointer(slider.rail, slider.rail(), "pointerup", 0.5, 0.79);
      await tick();
      slider.dispose();
    }
  });

  it("a horizontal rtl rail counts from the right", async () => {
    const slider = mountDrag({ direction: "rtl", defaultValue: 5 });
    pointer(slider.rail, slider.rail(), "pointerdown", 0, 0.5);
    await tick();
    expect(slider.now()).toBe("10");
    pointer(slider.rail, slider.rail(), "pointermove", 1, 0.5);
    await tick();
    expect(slider.now()).toBe("0");
    pointer(slider.rail, slider.rail(), "pointerup", 1, 0.5);
    await tick();
    slider.dispose();
  });

  it("a press on the thumb starts the drag where the value is", async () => {
    const slider = mountDrag({ defaultValue: 5 });
    // off the thumb's centre: it is already at its value, so no jump
    pointer(slider.rail, slider.thumb(), "pointerdown", 0.54, 0.5);
    await tick();
    expect(slider.now()).toBe("5");
    expect(slider.requests).toEqual([]);
    // a captured move is retargeted to the rail; here it bubbles to it
    pointer(slider.rail, slider.thumb(), "pointermove", 0.8, 0.5);
    await tick();
    expect(slider.now()).toBe("8");
    pointer(slider.rail, slider.thumb(), "pointerup", 0.8, 0.5);
    await tick();
    slider.dispose();
  });

  it("a controlled host that rejects the drag keeps its value", async () => {
    // `value` without an accepting host: every request is ignored
    const slider = mountDrag({ value: 5, defaultValue: 5 });
    pointer(slider.rail, slider.rail(), "pointerdown", 0.1, 0.5);
    await tick();
    pointer(slider.rail, slider.rail(), "pointermove", 0.9, 0.5);
    await tick();
    expect(slider.now()).toBe("5");
    expect(slider.requests).toEqual([1, 9]);
    pointer(slider.rail, slider.rail(), "pointerup", 0.9, 0.5);
    await tick();
    slider.dispose();
  });

  it("a lost capture and a cancel both end the drag", async () => {
    const slider = mountDrag({ defaultValue: 0 });
    pointer(slider.rail, slider.rail(), "pointerdown", 0.2, 0.5);
    await tick();
    expect(slider.now()).toBe("2");

    slider.rail().dispatchEvent(new PointerEvent("lostpointercapture", { bubbles: true }));
    await tick();
    pointer(slider.rail, slider.rail(), "pointermove", 1, 0.5);
    await tick();
    expect(slider.now()).toBe("2");

    pointer(slider.rail, slider.rail(), "pointerdown", 0.2, 0.5);
    await tick();
    expect(slider.now()).toBe("2");
    pointer(slider.rail, slider.rail(), "pointermove", 0.3, 0.5);
    await tick();
    expect(slider.now()).toBe("3");
    slider.rail().dispatchEvent(new PointerEvent("pointercancel", { bubbles: true }));
    await tick();
    pointer(slider.rail, slider.rail(), "pointermove", 0.9, 0.5);
    await tick();
    expect(slider.now()).toBe("3");
    slider.dispose();
  });
});
