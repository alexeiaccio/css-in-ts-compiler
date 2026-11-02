import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import {
  checkboxGroupBridge,
  checkboxGroupConfig,
  checkboxGroupProbe,
  checkboxGroupSteps,
} from "@cssints/apg-specs/apg/checkbox-group.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { flush } from "solid-js";
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";
import ariakit from "@cssints/apg-specs/scenarios/apg/checkbox.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/checkbox.base-ui.json";
import { CheckboxGroup } from "./checkbox-group.tsx";
import definitionJson from "@cssints/apg-specs/apg/checkbox-group.model.json";
import { domDriver } from "./checkbox-group-driver.ts";
import { mountCheckboxGroup } from "./checkbox-group.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/checkbox.react-aria.json";

// The copy's own conformance: the same scenarios the primitive is checked against, driven through
// this styled group rather than through the bare controller. The styled group composes the kit's
// `Checkbox`, so the bridge's `checkbox:parent` / `checkbox:0..2` are the four
// `data-part="checkbox"` elements in DOM order, the parent first. The target is translated on the
// way in and every attribute read lands on the skin's own box.
const model = makeReferenceModel(decodeDefinition(definitionJson));

type Driver = ReturnType<typeof domDriver>;

const SHIFT: Readonly<Record<string, string>> = {
  "checkbox:parent": "checkbox:0",
  "checkbox:0": "checkbox:1",
  "checkbox:1": "checkbox:2",
  "checkbox:2": "checkbox:3",
};

const toSkin = (target: string | undefined): string | undefined =>
  target === undefined ? undefined : (SHIFT[target] ?? target);

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
  translated(domDriver(mountCheckboxGroup(checkboxGroupConfig(config)), { hideableParts: [] }));

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so closing the gap forces removing it) and says why.
const DEFAULT_VALUES =
  "the upstream fixture supplies unstated child values (red/green/blue); without a `values` config the primitive uses its own labels, so the reported value array differs";
const NATIVE_ATTR =
  "react-aria renders native checkboxes; the primitive exposes role=checkbox + aria-checked (APG) and reports onValueChange, not the native checked/onChange pair";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "checkbox.base-ui.group-omitted-defaultvalue": DEFAULT_VALUES,
  "checkbox.react-aria.group-selected-state": NATIVE_ATTR,
};

describe("CheckboxGroup x ported scenarios (real DOM)", () => {
  for (const source of [ariakit, baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, checkboxGroupBridge, dom);
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

describe("CheckboxGroup x the field contract", () => {
  const values: readonly [string, string, string] = ["email", "push", "sms"];

  const mountGroup = (props: {
    label?: string;
    labelledby?: string;
    describedby?: string;
    invalid?: string | boolean;
    error?: string;
    defaultValue?: ReadonlyArray<string>;
  }): HTMLElement => {
    const root = document.createElement("div");
    document.body.append(root);
    render(
      () => (
        <CheckboxGroup
          values={values}
          label={props.label}
          labelledby={props.labelledby}
          describedby={props.describedby}
          invalid={props.invalid}
          error={props.error}
          defaultValue={props.defaultValue}
        >
          {(value) => value}
        </CheckboxGroup>
      ),
      root,
    );
    flush();
    return root;
  };

  const groupOf = (root: HTMLElement): HTMLElement =>
    root.querySelector<HTMLElement>('[data-part="checkbox-group"]')!;
  const errorOf = (root: HTMLElement): HTMLElement =>
    root.querySelector<HTMLElement>('[data-part="checkbox-group-error"]')!;

  it("announces its name, the description the host owns, and its error", () => {
    const root = mountGroup({
      label: "Notifications",
      describedby: "form-hint",
      invalid: true,
      error: "Pick at least one channel",
    });
    const group = groupOf(root);
    const error = errorOf(root);
    expect(group.getAttribute("role")).toBe("group");
    expect(group.getAttribute("aria-label")).toBe("Notifications");
    expect(group.hasAttribute("aria-labelledby")).toBe(false);
    // the error wins over the string `invalid`, and the error id comes first
    expect(group.getAttribute("aria-invalid")).toBe("true");
    expect(group.getAttribute("aria-describedby")).toBe(`${error.id} form-hint`);
    // the error announces itself while it is shown
    expect(error.hasAttribute("hidden")).toBe(false);
    expect(error.getAttribute("role")).toBe("alert");
    expect(error.textContent).toBe("Pick at least one channel");
  });

  it("names the group from a host element, and stays quiet while it is valid", () => {
    const root = mountGroup({
      labelledby: "channels-title",
      // `invalid: false` wins over a message: the host keeps the text ready
      invalid: false,
      error: "Pick at least one channel",
    });
    const group = groupOf(root);
    const error = errorOf(root);
    expect(group.getAttribute("aria-labelledby")).toBe("channels-title");
    expect(group.hasAttribute("aria-label")).toBe(false);
    expect(group.hasAttribute("aria-invalid")).toBe(false);
    expect(group.hasAttribute("aria-describedby")).toBe(false);
    expect(error.hasAttribute("hidden")).toBe(true);
    expect(error.hasAttribute("role")).toBe(false);
    expect(error.textContent).toBe("");
  });

  it("keeps the announced attributes on the group, not on the boxes", () => {
    const root = mountGroup({ label: "Notifications", invalid: true });
    const group = groupOf(root);
    expect(group.getAttribute("aria-invalid")).toBe("true");
    // no error message: the group is marked, and nothing is described
    expect(group.hasAttribute("aria-describedby")).toBe(false);
    expect(errorOf(root).hasAttribute("hidden")).toBe(true);
    for (const box of root.querySelectorAll<HTMLElement>('[data-part="checkbox"]')) {
      expect(box.hasAttribute("aria-invalid")).toBe(false);
    }
  });

  it("gives two groups on one page distinct ids", () => {
    const first = mountGroup({ label: "Channels" });
    const second = mountGroup({ label: "Topics" });
    expect(groupOf(first).id).not.toBe("");
    expect(groupOf(first).id).not.toBe(groupOf(second).id);
  });
});

describe("CheckboxGroup x spec (differential walk)", () => {
  const base: ScenarioConfig = {
    group: true,
    parent: true,
    values: ["0", "1", "2"],
  };
  for (const config of [
    base,
    { ...base, remember: true },
    { ...base, parent: false },
    { group: true, values: ["0", "1", "2"] },
    // controlled: a host that accepts every request, and one that holds
    { ...base, value: ["0"] },
    { ...base, value: ["0", "2"] },
    { ...base, controlled: true, accepts: true },
    { ...base, controlled: true, accepts: false, value: ["1"] },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: checkboxGroupSteps,
        probe: checkboxGroupProbe,
        makePair: () =>
          Promise.resolve([specDriver(model, checkboxGroupBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});

// The skin's own contract: one `role="group"` around the kit's boxes, the tri-state parent box
// drawn from `aria-checked`, and the error element the primitive's `aria-describedby` names.
const mount = (view: () => JSX.Element): HTMLElement => {
  const root = document.createElement("div");
  document.body.append(root);
  render(view, root);
  flush();
  return root;
};

const boxesOf = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="checkbox"]'),
];

describe("CheckboxGroup skin", () => {
  it("renders three of the kit's boxes with the tri-state parent above them", () => {
    const root = mount(() => (
      <CheckboxGroup
        label="Notifications"
        values={["email", "push", "sms"]}
        parent
        defaultValue={["email"]}
      >
        {(value) => value}
      </CheckboxGroup>
    ));
    const group = root.querySelector<HTMLElement>('[data-part="checkbox-group"]')!;
    expect(group.getAttribute("role")).toBe("group");
    expect(group.getAttribute("aria-label")).toBe("Notifications");
    const boxes = boxesOf(root);
    expect(boxes.length).toBe(4);
    // the parent first, derived from the children: one of three is mixed
    expect(boxes.map((box) => box.getAttribute("aria-checked"))).toEqual([
      "mixed",
      "true",
      "false",
      "false",
    ]);
    expect(new Set(boxes.map((box) => box.getAttribute("role")))).toEqual(new Set(["checkbox"]));
  });

  it("toggles one box without the others, and the parent follows", () => {
    const root = mount(() => (
      <CheckboxGroup label="Notifications" values={["email", "push", "sms"]} parent>
        {(value) => value}
      </CheckboxGroup>
    ));
    const boxes = boxesOf(root);
    boxes[1]!.click();
    flush();
    expect(boxes.map((box) => box.getAttribute("aria-checked"))).toEqual([
      "mixed",
      "true",
      "false",
      "false",
    ]);
    boxes[2]!.click();
    flush();
    boxes[3]!.click();
    flush();
    expect(boxes.map((box) => box.getAttribute("aria-checked"))).toEqual([
      "true",
      "true",
      "true",
      "true",
    ]);
    // the parent is off: the next press turns every child off
    boxes[0]!.click();
    flush();
    expect(boxes.map((box) => box.getAttribute("aria-checked"))).toEqual([
      "false",
      "false",
      "false",
      "false",
    ]);
  });
});
