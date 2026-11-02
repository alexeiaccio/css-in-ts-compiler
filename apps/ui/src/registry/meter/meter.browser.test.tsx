import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";
import {
  meterBridge,
  meterConfig,
  meterProbe,
  meterSteps,
} from "@cssints/apg-specs/apg/meter.bridge";
import baseUi from "@cssints/apg-specs/scenarios/apg/meter.base-ui.json";
import definitionJson from "@cssints/apg-specs/apg/meter.model.json";
import { domDriver } from "./meter-driver.ts";
import { Meter } from "./meter.tsx";
import { mountMeter } from "./meter.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/meter.react-aria.json";

// The copy's own conformance: the same scenarios the primitive is checked against, driven through
// this styled meter rather than through the bare controller. The bridge's only part is `meter`,
// which is the skin's own `data-part="meter"`, so no target has to be translated.
const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountMeter(meterConfig(config)), { hideableParts: [] });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so fixing the gap forces removing it) and says why.
const DIVERGENCES: Readonly<Record<string, string>> = {};

describe("Meter x ported scenarios (real DOM)", () => {
  for (const source of [baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, meterBridge, dom);
          const divergence = DIVERGENCES[scenario.id];
          if (divergence !== undefined) {
            await expect(run).rejects.toThrow(ScenarioMismatch);
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

describe("Meter x spec (differential walk)", () => {
  for (const config of [
    { value: 25, min: 0, max: 100 },
    { value: 25, min: 10, max: 50 },
    { value: 60, min: 20, max: 200 },
    { value: 150, min: 0, max: 100 },
    { value: -5, min: 0, max: 100 },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: meterSteps,
        probe: meterProbe,
        makePair: () => Promise.resolve([specDriver(model, meterBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});

// The skin's own contract: the track is the `role=meter` box, and the fill is decoration whose
// width is the primitive's own percentage, so the painted figure cannot disagree with
// `aria-valuetext`.
const mount = (view: () => JSX.Element): HTMLElement => {
  const root = document.createElement("div");
  document.body.append(root);
  render(view, root);
  return root;
};

const part = (root: HTMLElement, name: string): HTMLElement =>
  root.querySelector<HTMLElement>(`[data-part="${name}"]`)!;

describe("Meter skin", () => {
  it("puts the primitive's figure on the track and paints the same share as the fill", () => {
    const root = mount(() => <Meter label="Storage" value={25} />);
    const meter = part(root, "meter");
    const fill = part(root, "meter-fill");
    expect(meter.getAttribute("role")).toBe("meter");
    expect(meter.getAttribute("aria-label")).toBe("Storage");
    expect(meter.getAttribute("aria-valuemin")).toBe("0");
    expect(meter.getAttribute("aria-valuemax")).toBe("100");
    expect(meter.getAttribute("aria-valuenow")).toBe("25");
    expect(meter.getAttribute("aria-valuetext")).toBe("25%");
    expect(fill.getAttribute("aria-hidden")).toBe("true");
    expect(fill.style.width).toBe("25%");
  });

  it("takes the share from the range and clamps a value outside it", () => {
    const offset = mount(() => <Meter label="Storage" min={10} max={50} value={25} />);
    // 25 in 10..50, rounded as the primitive rounds `aria-valuetext`
    expect(part(offset, "meter").getAttribute("aria-valuetext")).toBe("38%");
    expect(part(offset, "meter-fill").style.width).toBe("38%");

    const over = mount(() => <Meter label="Storage" value={150} />);
    expect(part(over, "meter").getAttribute("aria-valuenow")).toBe("100");
    expect(part(over, "meter-fill").style.width).toBe("100%");

    const under = mount(() => <Meter label="Storage" value={-5} />);
    expect(part(under, "meter").getAttribute("aria-valuenow")).toBe("0");
    expect(part(under, "meter-fill").style.width).toBe("0%");
  });

  it("names the figure from a host element when it is given one", () => {
    const root = mount(() => <Meter label="Storage" labelId="quota-label" value={25} />);
    expect(part(root, "meter").getAttribute("aria-labelledby")).toBe("quota-label");
  });
});
