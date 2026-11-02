import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import {
  alertBridge,
  alertConfig,
  alertProbe,
  alertSteps,
} from "@cssints/apg-specs/apg/alert.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";
import { Alert, AlertBody, AlertTitle } from "./alert.tsx";
import baseUi from "@cssints/apg-specs/scenarios/apg/alert.base-ui.json";
import definitionJson from "@cssints/apg-specs/apg/alert.model.json";
import { domDriver } from "./alert-driver.ts";
import { mountAlert } from "./alert.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/alert.react-aria.json";

// The copy's own conformance: the same scenarios the primitive is checked against, driven through
// this styled alert rather than through the bare controller. The live region the scenarios probe is
// the skin's `data-part="alert"`; the toast/root/region parts around it are page structure the
// fixture supplies, as the primitive's own fixture does.
const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountAlert(alertConfig(config)), { hideableParts: [] });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so fixing the gap forces removing it) and says why.
const DIVERGENCES: Readonly<Record<string, string>> = {
  "alert.react-aria.toast-content-role-alert":
    "the useToast defaults suite mounts a toast eagerly; APG (and the other ported suites) render no live region until a message exists",
};

describe("Alert x ported scenarios (real DOM)", () => {
  for (const source of [baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, alertBridge, dom);
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

describe("Alert x spec (differential walk)", () => {
  const CONFIGS: ReadonlyArray<ScenarioConfig> = [{}, { titleId: "toast-title" }];
  for (const config of CONFIGS) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: alertSteps,
        probe: alertProbe,
        makePair: () => Promise.resolve([specDriver(model, alertBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});

// The skin's own contract: the live region is the root and it is live only while the primitive
// says so; a tone paints the rule and the title, and the title and body are parts of their own.
const mount = (view: () => JSX.Element): HTMLElement => {
  const root = document.createElement("div");
  document.body.append(root);
  render(view, root);
  return root;
};

const part = (root: HTMLElement, name: string): HTMLElement =>
  root.querySelector<HTMLElement>(`[data-part="${name}"]`)!;

describe("Alert skin", () => {
  it("is a live region only while it has a message", () => {
    const quiet = mount(() => <Alert />);
    const quietAlert = part(quiet, "alert");
    expect(quietAlert.hasAttribute("role")).toBe(false);
    expect(quietAlert.hasAttribute("hidden")).toBe(true);

    const live = mount(() => <Alert message="Saved" />);
    const liveAlert = part(live, "alert");
    expect(liveAlert.getAttribute("role")).toBe("alert");
    expect(liveAlert.getAttribute("aria-atomic")).toBe("true");
    expect(liveAlert.hasAttribute("hidden")).toBe(false);
    expect(liveAlert.textContent).toBe("Saved");
  });

  it("a tone paints the rule and the title, and the title and body are parts", () => {
    const neutral = mount(() => (
      <Alert message="Saved">
        <AlertTitle>Heads up</AlertTitle>
        <AlertBody>Your changes are stored.</AlertBody>
      </Alert>
    ));
    const invalid = mount(() => (
      <Alert message="Saved" tone="invalid">
        <AlertTitle>Heads up</AlertTitle>
        <AlertBody>Your changes are stored.</AlertBody>
      </Alert>
    ));
    const neutralAlert = part(neutral, "alert");
    const invalidAlert = part(invalid, "alert");
    expect(neutralAlert.getAttribute("data-tone")).toBe("neutral");
    expect(invalidAlert.getAttribute("data-tone")).toBe("invalid");
    // the left rule and the title are painted from the tone the root carries
    expect(getComputedStyle(neutralAlert).borderInlineStartColor).not.toBe(
      getComputedStyle(invalidAlert).borderInlineStartColor,
    );
    expect(getComputedStyle(part(neutral, "alert-title")).color).not.toBe(
      getComputedStyle(part(invalid, "alert-title")).color,
    );
    expect(part(neutral, "alert-title").textContent).toBe("Heads up");
    expect(part(neutral, "alert-body").textContent).toBe("Your changes are stored.");
  });
});
