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
  spinbuttonBridge,
  spinbuttonConfig,
  spinbuttonProbe,
  spinbuttonSteps,
} from "@cssints/apg-specs/apg/spinbutton.bridge";
import baseUi from "@cssints/apg-specs/scenarios/apg/spinbutton.base-ui.json";
import definitionJson from "@cssints/apg-specs/apg/spinbutton.model.json";
import { type Spinbutton as SpinbuttonController } from "@cssints/headless";
import { Spinbutton } from "./spinbutton.tsx";
import { domDriver } from "./spinbutton-driver.ts";
import { mountSpinbutton, spinbuttonParts } from "./spinbutton.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/spinbutton.react-aria.json";

// The copy's own conformance: the same scenarios the primitive is checked against, driven through this styled
// spinbutton rather than through the bare controller.
const model = makeReferenceModel(decodeDefinition(definitionJson));

// Solid 2 delivers events through its delegated listener on a later turn, and applies setters on its flush.
const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

const dom = (config: ScenarioConfig) =>
  domDriver(mountSpinbutton(spinbuttonConfig(config)), { hideableParts: [] });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so closing the gap forces removing it) and says why.
const SEED_FROM_ZERO =
  "base-ui seeds an untouched field to 0 (clamped into range); the spec starts at 5 and clamps to min 1";
const TEXTBOX_ROLE = "base-ui exposes the editable field as role=textbox; APG uses role=spinbutton";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "spinbutton.base-ui.input-has-textbox-role": TEXTBOX_ROLE,
  "spinbutton.base-ui.increment-starts-empty-at-zero": SEED_FROM_ZERO,
  "spinbutton.base-ui.decrement-starts-empty-at-zero": SEED_FROM_ZERO,
  "spinbutton.base-ui.increment-once-per-click": SEED_FROM_ZERO,
  "spinbutton.base-ui.decrement-once-per-click": SEED_FROM_ZERO,
};

describe("Spinbutton x ported scenarios (real DOM)", () => {
  for (const source of [baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, spinbuttonBridge, dom);
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

describe("Spinbutton x spec (differential walk)", () => {
  // uncontrolled, then a controlled host that accepts every request, one that
  // pins the value (rejects), and one that accepts while wrapping
  const CONFIGS: ReadonlyArray<ScenarioConfig> = [
    {},
    { buttons: true },
    { controlled: true },
    { controlled: true, value: 5 },
    { controlled: true, wrap: true },
  ];
  for (const config of CONFIGS) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: spinbuttonSteps,
        probe: spinbuttonProbe,
        makePair: () => Promise.resolve([specDriver(model, spinbuttonBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});

// `disabled` is a widget-level extension of the pattern (the spec models the steppers'
// bound only): the field announces `aria-disabled`, carries the native `disabled`, takes
// no typing and no key, and neither stepper moves the value.
describe("Spinbutton disabled", () => {
  const renderSpin = () => {
    const root = document.createElement("div");
    document.body.append(root);
    const [disabled, setDisabled] = createSignal(true);
    let api: SpinbuttonController | undefined;
    const dispose = render(() => {
      return (
        <Spinbutton
          {...spinbuttonParts(() => root)}
          defaultValue={5}
          disabled={disabled()}
          onReady={(controller) => {
            api = controller;
          }}
        />
      );
    }, root);
    const part = (name: string) => root.querySelector<HTMLElement>(`[data-part="${name}"]`)!;
    return {
      setDisabled,
      api: () => api!,
      input: () => root.querySelector<HTMLInputElement>('[data-part="input"]')!,
      increment: () => part("increment"),
      decrement: () => part("decrement"),
      dispose: () => {
        dispose();
        root.remove();
      },
    };
  };

  it("announces aria-disabled, takes no typing and ignores both steppers", async () => {
    const { setDisabled, api, input, increment, decrement, dispose } = renderSpin();
    const now = () => input().getAttribute("aria-valuenow");
    expect(input().getAttribute("aria-disabled")).toBe("true");
    expect(input().disabled).toBe(true);
    expect(increment().getAttribute("aria-disabled")).toBe("true");
    expect(decrement().getAttribute("aria-disabled")).toBe("true");

    // a native disabled field is not a target, and the primitive refuses the draft anyway
    input().focus();
    await tick();
    expect(document.activeElement).not.toBe(input());
    api().focus();
    api().typeInput("9");
    input().value = "9";
    input().dispatchEvent(new InputEvent("input", { bubbles: true }));
    await tick();
    expect(api().draft()).toBe("");
    input().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    await tick();
    expect(now()).toBe("5");

    increment().click();
    decrement().click();
    await tick();
    expect(now()).toBe("5");

    // the getters are live: enabling the field enables its keys, its typing and its steppers
    setDisabled(false);
    await tick();
    expect(input().hasAttribute("aria-disabled")).toBe(false);
    expect(input().disabled).toBe(false);
    input().focus();
    await tick();
    input().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    await tick();
    expect(now()).toBe("6");
    increment().click();
    await tick();
    expect(now()).toBe("7");
    dispose();
  });
});
