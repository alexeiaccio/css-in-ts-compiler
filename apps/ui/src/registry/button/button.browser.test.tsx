import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import {
  buttonBridge,
  buttonConfig,
  buttonProbe,
  buttonSteps,
  canonicalEvent,
} from "@cssints/apg-specs/apg/button.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";
import ariakit from "@cssints/apg-specs/scenarios/apg/button.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/button.base-ui.json";
import definitionJson from "@cssints/apg-specs/apg/button.model.json";
import { domDriver } from "./button-driver.ts";
import { type ButtonLook, type ButtonMounted, mountButton } from "./button.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/button.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountButton(buttonConfig(config)), {
    hideableParts: [],
    eventName: canonicalEvent,
  });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so fixing the gap forces removing it) and says why.
const DIVERGENCES: Readonly<Record<string, string>> = {
  "button.base-ui.toggle-disabled":
    "a bare `<Toggle disabled>` with no pressed config is read as a command button (no aria-pressed) using aria-disabled, not the native disabled attribute",
  "button.react-aria.disabled-state":
    "the primitive uses aria-disabled (focusable, per the APG button text), not the native disabled attribute",
  "button.react-aria.toggle-button-disabled":
    "the primitive uses aria-disabled, not the native disabled attribute",
  "button.react-aria.hover-state-and-callbacks":
    "hover state and onHoverStart/onHoverChange/onHoverEnd are library extensions; the primitive reports activation only",
  "button.react-aria.s1-button-keyboard-activates-non-submit":
    "react-aria press handling reports onKeyDown/onKeyUp defaultPrevented; the primitive activates through the native click",
  "button.react-aria.s1-toggle-button-controlled-selected":
    "react-aria pins the controlled `isSelected` value and rejects the click; the primitive models `isSelected` as a host that answers every request",
  "button.react-aria.toggle-button-selected-state":
    "the ported scenario expects `onChange` to hold only the latest payload (`[false]`); the replay engine reports every call since mount, and the primitive fires both (`[true, false]`)",
};

describe("Button x ported scenarios (real DOM)", () => {
  for (const source of [ariakit, baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, buttonBridge, dom);
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

describe("Button x spec (differential walk)", () => {
  // an uncontrolled toggle, then a controlled host that accepts every request
  // and one that pins the value (rejects), plus command buttons
  const CONFIGS: ReadonlyArray<ScenarioConfig> = [
    {},
    { toggle: true },
    { disabled: true },
    { toggle: true, disabled: true },
    { defaultPressed: true },
    { pressed: false },
    { pressed: true },
    { value: false },
    { value: true },
    { value: true, disabled: true },
  ];
  for (const config of CONFIGS) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: buttonSteps,
        probe: buttonProbe,
        makePair: () => Promise.resolve([specDriver(model, buttonBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});

// The walk above is the primitive's contract through the skin's markup. What the skin adds is the look: one part, the tone
// and the size variants, the disabled paint, and `render` replacing the element while the primitive keeps its state.
const style = (element: Element): CSSStyleDeclaration => getComputedStyle(element);
const token = (name: string): string => {
  const probe = document.createElement("div");
  probe.style.backgroundColor = `var(${name})`;
  document.body.append(probe);
  const value = style(probe).backgroundColor;
  probe.remove();
  return value;
};

/** Solid 2 delivers delegated events on a later turn. */
const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

const live: ButtonMounted[] = [];
const mount = (config: ScenarioConfig = {}, look: ButtonLook = {}): ButtonMounted => {
  const mounted = mountButton(buttonConfig(config), look);
  live.push(mounted);
  return mounted;
};

afterEach(() => {
  for (const mounted of live.splice(0)) {
    mounted.dispose();
  }
});

describe("Button (the kit's look)", () => {
  it("emits one part and paints the tone and the size from the variants", () => {
    const neutral = mount({}, { tone: "neutral", size: "md" });
    const accent = mount({}, { tone: "accent", size: "sm" });
    const button = (mounted: ButtonMounted): HTMLElement => {
      const found = mounted.root.querySelector<HTMLElement>('[data-part="button"]');
      if (found === null) {
        throw new Error("no button part");
      }
      return found;
    };

    // the part is the skin's, and the element is the native <button> the primitive spreads onto
    expect(button(neutral).tagName).toBe("BUTTON");
    expect(neutral.root.querySelectorAll("[data-part]").length).toBe(1);
    // tone is the fill the theme names, not a colour of the skin's own
    expect(style(button(neutral)).backgroundColor).toBe(token("--color-button-background"));
    expect(style(button(accent)).backgroundColor).toBe(token("--color-highlight"));
    // size is the padding and the type the theme's steps give
    expect(style(button(neutral)).paddingTop).toBe("8px");
    expect(style(button(neutral)).paddingLeft).toBe("16px");
    expect(style(button(accent)).paddingTop).toBe("4px");
    expect(style(button(accent)).paddingLeft).toBe("8px");
    expect(style(button(accent)).fontSize).toBe("12px");
  });

  it("paints the disabled state the primitive announces", () => {
    const mounted = mount({ disabled: true });
    const button = mounted.root.querySelector<HTMLElement>('[data-part="button"]')!;
    // aria-disabled, per the APG text: the button stays focusable, and the skin's rule is keyed on it
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(style(button).color).toBe(token("--color-text-disabled"));
    expect(style(button).borderTopColor).toBe(token("--color-border-disabled"));
    expect(style(button).cursor).toBe("not-allowed");
  });

  it("lets render replace the element and keeps the state live", async () => {
    const mounted = mount(
      { defaultPressed: true },
      {
        render: (props, state) => (
          <a {...props} href="#link" data-live={state.pressed() ? "pressed" : "idle"} />
        ),
      },
    );
    const link = mounted.root.querySelector<HTMLElement>("a")!;
    // the caller replaces the element, not the semantics the primitive owns
    expect(link.getAttribute("data-part")).toBe("button");
    expect(link.getAttribute("role")).toBe("button");
    expect(link.getAttribute("aria-pressed")).toBe("true");
    expect(link.dataset["live"]).toBe("pressed");
    expect(mounted.button.pressed()).toBe(true);

    await userEvent.click(link);
    await tick();

    expect(link.getAttribute("aria-pressed")).toBe("false");
    expect(link.dataset["live"]).toBe("idle");
    expect(mounted.button.pressed()).toBe(false);
  });
});
