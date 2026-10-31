import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import {
  sliderMultithumbBridge,
  sliderMultithumbConfig,
  sliderMultithumbProbe,
  sliderMultithumbSteps,
} from "@cssints/apg-specs/apg/slider-multithumb.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { flush } from "solid-js";
import { describe, expect, it } from "vite-plus/test";
import baseUi from "@cssints/apg-specs/scenarios/apg/slider-multithumb.base-ui.json";
import definitionJson from "@cssints/apg-specs/apg/slider-multithumb.model.json";
import { domDriver } from "./dom-driver";
import { mountSliderMultithumb } from "./slider-multithumb.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/slider-multithumb.react-aria.json";
import { SliderMultithumb } from "./slider-multithumb.tsx";

// The copy's own conformance: the same scenarios the primitive is checked against,
// driven through this styled range slider rather than through the bare controller.
const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountSliderMultithumb(sliderMultithumbConfig(config)), {
    hideableParts: [],
  });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail, so closing the gap forces removing it. The spec fixes
// two thumbs over 0..10 with values [3, 7], so every ported scenario (which sets
// other `values`/ranges) is `Unsupported` rather than divergent.
const DIVERGENCES: Readonly<Record<string, string>> = {};

describe("SliderMultithumb x ported scenarios (real DOM)", () => {
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

describe("SliderMultithumb x spec (differential walk)", () => {
  const CONFIGS: ReadonlyArray<ScenarioConfig> = [
    {},
    { orientation: "vertical" },
    { dir: "rtl" },
    { orientation: "vertical", dir: "rtl" },
    // controlled: a host that accepts every request, and one that holds
    { controlled: true, accepts: true },
    { controlled: true, accepts: true, values: [3, 7] },
    { controlled: true, accepts: false, values: [3, 7] },
  ];
  for (const config of CONFIGS) {
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

// What the kit adds over the primitive: the interval painted between the two
// thumbs, a name per thumb, and a rail press that picks the nearer thumb.
const mount = (view: () => JSX.Element): HTMLElement => {
  const root = document.createElement("div");
  document.body.append(root);
  render(view, root);
  flush();
  return root;
};

const thumbsOf = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="thumb"]'),
];

describe("the kit's interval", () => {
  it("paints the fill from the lower thumb to the higher one, and moves it with a key", () => {
    const root = mount(() => <SliderMultithumb label="Price" defaultValue={[3, 7]} />);
    const parts = thumbsOf(root);
    const fill = root.querySelector<HTMLElement>('[data-part="fill"]')!;
    // both thumbs announce their own bounds; the outer two are the range, so both are shares of 0..10
    expect(parts[0]!.getAttribute("aria-valuemin")).toBe("0");
    expect(parts[0]!.getAttribute("aria-valuemax")).toBe("7");
    expect(parts[1]!.getAttribute("aria-valuemin")).toBe("3");
    expect(parts[1]!.getAttribute("aria-valuemax")).toBe("10");
    expect(parts[0]!.getAttribute("aria-label")).toBe("Price lower thumb");
    expect(parts[1]!.getAttribute("aria-label")).toBe("Price upper thumb");
    expect(fill.style.getPropertyValue("inset-inline-start")).toBe("30%");
    expect(fill.style.width).toBe("40%");
    // the upper thumb has the rest of the range above it: the key moves it to 8, and the fill grows from the lower
    // thumb's share, which did not move
    parts[1]!.focus();
    flush();
    parts[1]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    flush();
    expect(parts[1]!.getAttribute("aria-valuenow")).toBe("8");
    expect(fill.style.getPropertyValue("inset-inline-start")).toBe("30%");
    expect(fill.style.width).toBe("50%");
    // vertical: the same two shares, growing upwards
    const vertical = mount(() => (
      <SliderMultithumb label="Price" defaultValue={[3, 7]} orientation="vertical" />
    ));
    const verticalFill = vertical.querySelector<HTMLElement>('[data-part="fill"]')!;
    expect(vertical.querySelector('[data-part="track"]')!.getAttribute("data-orientation")).toBe(
      "vertical",
    );
    expect(verticalFill.style.getPropertyValue("inset-block-end")).toBe("30%");
    expect(verticalFill.style.height).toBe("40%");
    expect(verticalFill.style.width).toBe("");
  });

  it("picks the nearer thumb on a rail press and focuses it", () => {
    const root = mount(() => <SliderMultithumb label="Price" defaultValue={[3, 7]} />);
    const rail = root.querySelector<HTMLElement>('[data-part="track"]')!;
    const rect = rail.getBoundingClientRect();
    rail.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width * 0.9,
        clientY: rect.top + rect.height / 2,
      }),
    );
    flush();
    const parts = thumbsOf(root);
    // 90% is nearer the upper thumb (70%) than the lower one (30%): it takes the press and the focus
    expect(parts[1]!.getAttribute("aria-valuenow")).toBe("9");
    expect(parts[0]!.getAttribute("aria-valuenow")).toBe("3");
    expect(document.activeElement).toBe(parts[1]);
  });
});
