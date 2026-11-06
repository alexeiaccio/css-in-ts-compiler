import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import {
  canonicalEvent,
  radioBridge,
  radioConfig,
  radioProbe,
  radioSteps,
} from "@cssints/apg-specs/apg/radio.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { afterEach, describe, expect, it } from "vite-plus/test";
import ariakit from "@cssints/apg-specs/scenarios/apg/radio.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/radio.base-ui.json";
import definitionJson from "@cssints/apg-specs/apg/radio.model.json";
import { type RadioGroup, createRadioGroup } from "../src/radio";
import { supportsFocusGroup } from "../src/focusgroup";
import { domDriver } from "./dom-driver";
import { mountRadio } from "./radio.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/radio.react-aria.json";
import { flush } from "solid-js";
import { render } from "@solidjs/web";
import { userEvent } from "vite-plus/test/browser";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountRadio(radioConfig(config)), {
    hideableParts: [],
    eventName: canonicalEvent,
  });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so closing the gap forces removing it) and says why.
const NATIVE_ATTR =
  "react-aria renders a native <input type=radio>; the primitive exposes role=radio + aria-checked (APG) instead of the HTML disabled attribute";
const PER_RADIO_CALLBACKS =
  "the upstream test uses per-radio onFocusA/onBlurA callbacks; the primitive reports one onFocus/onBlur with the radio target";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "radio.react-aria.disabled-radio-state": NATIVE_ATTR,
  "radio.react-aria.focus-moves-between-radios-fires-blur": PER_RADIO_CALLBACKS,
};

describe("createRadioGroup x ported scenarios (real DOM)", () => {
  for (const source of [ariakit, baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, radioBridge, dom);
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

// Config remounts (`preselect` / `disabled` / `flavor`) write the uncontrolled
// local directly and have no controlled-host equivalent in the walk.
const CONFIG_PROPS = new Set(["preselect", "disabled", "flavor"]);

describe("createRadioGroup x spec (differential walk)", () => {
  const base: ScenarioConfig = { items: 4, values: ["0", "1", "2", "3"] };
  for (const config of [
    base,
    { ...base, checked: "radio:1" },
    { ...base, disabled: [1, 2] },
    { ...base, flavor: "activedescendant" },
    // controlled: a host that accepts every request, and one that pins the
    // value (rejects), so no event commits
    { ...base, controlled: true, checked: "radio:0" },
    { ...base, controlled: true, value: 2 },
  ]) {
    const alphabet = config["controlled"]
      ? radioSteps.filter((step) => step.prop === undefined || !CONFIG_PROPS.has(step.prop))
      : radioSteps;
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet,
        probe: radioProbe,
        makePair: () => Promise.resolve([specDriver(model, radioBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});

// The walk forces the polyfill (untrusted keydowns, a rendered `tabindex`); the
// native engine is proven here, with the real keys of the same alphabet.
const VALUES = ["a", "b", "c", "d"];
const ROOTS: HTMLElement[] = [];

afterEach(() => {
  for (const root of ROOTS.splice(0)) {
    root.remove();
  }
});

interface NativeGroup {
  readonly before: HTMLButtonElement;
  readonly after: HTMLButtonElement;
  readonly radios: HTMLElement[];
  readonly api: RadioGroup<string>;
  readonly requests: string[];
  readonly root: HTMLElement;
}

/**
 * A roving group with the platform's own provider (`provider: "auto"`, so the
 * native engine wherever it exists) and a button on either side for Tab.
 * `value` pins the check and ignores every request: the state where DOM focus and
 * the checked radio disagree, which is the one the tab stop rule is about.
 */
const mountNative = (options: {
  readonly checked?: string;
  readonly pinned?: string;
  readonly disabled?: ReadonlyArray<number>;
  readonly dir?: "ltr" | "rtl";
}): NativeGroup => {
  const root = document.createElement("div");
  document.body.append(root);
  ROOTS.push(root);
  const requests: string[] = [];
  const before = document.createElement("button");
  before.textContent = "before";
  let api: RadioGroup<string> | undefined;
  const dispose = render(() => {
    const group = createRadioGroup<string>({
      values: VALUES,
      defaultValue: options.checked,
      get value() {
        return options.pinned;
      },
      disabled: options.disabled ?? [],
      ...(options.dir === undefined ? {} : { dir: options.dir }),
      id: "native",
      onValueChange: (value) => {
        requests.push(value);
      },
    });
    api = group;
    return (
      <div data-part="host">
        {before}
        <div data-part="radiogroup" {...group.radiogroupProps}>
          {VALUES.map((label, index) => (
            <div data-part="radio" {...group.radioProps(index)}>
              {label}
            </div>
          ))}
        </div>
      </div>
    );
  }, root);
  const after = document.createElement("button");
  after.textContent = "after";
  root.append(after);
  const radios = [...root.querySelectorAll<HTMLElement>('[data-part="radio"]')];
  return {
    before,
    after,
    radios,
    api: api as RadioGroup<string>,
    requests,
    root,
  };
};

// Solid 2 commits signal writes on a flush, so read the primitive's state — and
// the attributes it renders — after one.
const press = async (key: string): Promise<void> => {
  await userEvent.keyboard(key);
  flush();
};

const tab = async (options?: { shift: boolean }): Promise<void> => {
  await userEvent.tab(options);
  flush();
};

describe("createRadioGroup x the native focusgroup (real keys)", () => {
  it.skipIf(!supportsFocusGroup())(
    "Tab enters on the checked radio, arrows move and check, Tab leaves and comes back",
    async () => {
      const group = mountNative({ checked: "c" });
      expect(group.api.checked()).toBe(2);
      group.before.focus();
      await tab();
      expect(document.activeElement).toBe(group.radios[2]);
      expect(group.api.focused()).toBe(2);
      // an arrow is a move *and* a check: selection follows focus
      await press("{ArrowDown}");
      expect(document.activeElement).toBe(group.radios[3]);
      expect(group.api.checked()).toBe(3);
      // both axes, and the radiogroup wraps
      await press("{ArrowRight}");
      expect(document.activeElement).toBe(group.radios[0]);
      expect(group.api.checked()).toBe(0);
      await press("{ArrowUp}");
      expect(document.activeElement).toBe(group.radios[3]);
      expect(group.api.checked()).toBe(3);
      await tab();
      expect(document.activeElement).toBe(group.after);
      expect(group.api.focused()).toBeNull();
      // re-entry on the checked radio, not on the first one
      await tab({ shift: true });
      expect(document.activeElement).toBe(group.radios[3]);
    },
  );

  it.skipIf(!supportsFocusGroup())(
    "skips a disabled radio and keeps it out of the tab order",
    async () => {
      const group = mountNative({ disabled: [1] });
      expect(group.radios[1]?.getAttribute("focusgroup")).toBe("none");
      expect(group.radios[1]?.getAttribute("tabindex")).toBe("-1");
      group.before.focus();
      await tab();
      expect(document.activeElement).toBe(group.radios[0]);
      await press("{ArrowDown}");
      expect(document.activeElement).toBe(group.radios[2]);
      expect(group.api.checked()).toBe(2);
      await press("{ArrowUp}");
      expect(document.activeElement).toBe(group.radios[0]);
      await press("{ArrowUp}");
      expect(document.activeElement).toBe(group.radios[3]);
    },
  );

  it.skipIf(!supportsFocusGroup())(
    "carries tabindex=0 so the engine can focus a div, and the engine writes nothing",
    async () => {
      const group = mountNative({ checked: "b" });
      group.before.focus();
      await tab();
      expect(document.activeElement).toBe(group.radios[1]);
      // measured: the native engine's item eligibility is `tabIndex > -1`, so a
      // `<div role=radio>` item has to be focusable; the engine itself adds no
      // markup and leaves the group one tab stop (the start marker's radio)
      for (const radio of group.radios) {
        expect(radio.getAttribute("tabindex")).toBe("0");
      }
      expect(group.radios[1]?.getAttribute("focusgroupstart")).toBe("");
      await press("{ArrowRight}");
      expect(document.activeElement).toBe(group.radios[2]);
      for (const radio of group.radios) {
        expect(radio.getAttribute("tabindex")).toBe("0");
      }
      expect(group.radios[2]?.getAttribute("focusgroupstart")).toBe("");
    },
  );

  it.skipIf(!supportsFocusGroup())(
    "re-enters on the checked radio after a rejected request moved the focus",
    async () => {
      // the host pins the check at "c" and ignores the request: focus moves to 3
      // and the engine's stop follows it, while the entry marker stays on the
      // checked radio 2 — so Tab out and back lands on 2
      const group = mountNative({ pinned: "c" });
      group.before.focus();
      await tab();
      expect(document.activeElement).toBe(group.radios[2]);
      await press("{ArrowDown}");
      expect(document.activeElement).toBe(group.radios[3]);
      expect(group.requests).toEqual(["d"]);
      expect(group.api.checked()).toBe(2);
      await tab();
      await tab({ shift: true });
      expect(document.activeElement).toBe(group.radios[2]);
    },
  );

  it.skipIf(!supportsFocusGroup())("Space requests the focused radio", async () => {
    const group = mountNative({ pinned: "a" });
    group.radios[0]?.focus();
    await press("{ArrowDown}");
    expect(document.activeElement).toBe(group.radios[1]);
    group.requests.length = 0;
    await press(" ");
    expect(group.requests).toEqual(["b"]);
    expect(group.api.checked()).toBe(0);
  });

  it.skipIf(!supportsFocusGroup())("follows dir=rtl for the horizontal pair", async () => {
    const group = mountNative({ dir: "rtl" });
    group.radios[0]?.focus();
    await press("{ArrowLeft}");
    expect(document.activeElement).toBe(group.radios[1]);
    expect(group.api.checked()).toBe(1);
    await press("{ArrowRight}");
    expect(document.activeElement).toBe(group.radios[0]);
  });
});
