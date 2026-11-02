import {
  type ActionStep,
  type Scenario,
  type ScenarioConfig,
  type Probe,
  ScenarioMismatch,
  type SpecBridge,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import {
  type QuintReferenceModel,
  decodeDefinition,
  makeReferenceModel,
} from "@quint-machine/core";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";
import {
  listboxMultiBridge,
  listboxMultiConfig,
  listboxMultiProbe,
  listboxMultiSteps,
} from "@cssints/apg-specs/apg/listbox-multi.bridge";
import {
  listboxSingleBridge,
  listboxSingleConfig,
  listboxSingleProbe,
  listboxSingleSteps,
} from "@cssints/apg-specs/apg/listbox-single.bridge";
import {
  listboxTypeaheadBridge,
  listboxTypeaheadConfig,
  listboxTypeaheadProbe,
  listboxTypeaheadSteps,
} from "@cssints/apg-specs/apg/listbox-typeahead.bridge";
import { type ListboxMountConfig, listboxConfig } from "@cssints/apg-specs/apg/listbox-shared";
import ariakit from "@cssints/apg-specs/scenarios/apg/listbox.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/listbox.base-ui.json";
import { mountListbox } from "./listbox.fixture";
import multiDefinitionJson from "@cssints/apg-specs/apg/listbox-multi.model.json";
import reactAria from "@cssints/apg-specs/scenarios/apg/listbox.react-aria.json";
import singleDefinitionJson from "@cssints/apg-specs/apg/listbox-single.model.json";
import typeaheadDefinitionJson from "@cssints/apg-specs/apg/listbox-typeahead.model.json";
import { type Mounted, domDriver } from "./listbox-driver.ts";

// The copy's own conformance: the same scenarios the primitive is checked against, driven through this styled list. The
// bridge calls an option `option`; the skin names it `listbox-option`, so the target is translated on the way in (the parts
// the walk lists as visible are none, and the skin adds no other part to the walk).
type DriverType = ReturnType<typeof domDriver>;

const RENAME: Readonly<Record<string, string>> = {
  option: "listbox-option",
};
const BACK: Readonly<Record<string, string>> = {
  "listbox-option": "option",
};

const move = (target: string, table: Readonly<Record<string, string>>): string => {
  const [name = "", index] = target.split(":");
  const mapped = table[name] ?? name;
  return index === undefined ? mapped : `${mapped}:${index}`;
};

const translated = (driver: DriverType): DriverType => ({
  ...driver,
  perform: (step: ActionStep) => {
    const target = step.target === undefined ? undefined : move(step.target, RENAME);
    return driver.perform(target === undefined ? step : { ...step, target });
  },
  observer: {
    ...driver.observer,
    attr: (target, name) => {
      const value = driver.observer.attr(move(target, RENAME), name);
      // an aria-activedescendant reads back as the option's own part name, which the walk calls `option:n`
      return value === null ? null : move(value, BACK);
    },
  },
});

interface Machine {
  readonly bridge: SpecBridge;
  readonly config: (config: ScenarioConfig) => ListboxMountConfig;
  readonly model: QuintReferenceModel;
  readonly steps: ReadonlyArray<ActionStep>;
  readonly probe: Probe;
}

const MACHINES = {
  single: {
    bridge: listboxSingleBridge,
    config: listboxSingleConfig,
    model: makeReferenceModel(decodeDefinition(singleDefinitionJson)),
    steps: listboxSingleSteps,
    probe: listboxSingleProbe,
  },
  multi: {
    bridge: listboxMultiBridge,
    config: listboxMultiConfig,
    model: makeReferenceModel(decodeDefinition(multiDefinitionJson)),
    steps: listboxMultiSteps,
    probe: listboxMultiProbe,
  },
  typeahead: {
    bridge: listboxTypeaheadBridge,
    config: listboxTypeaheadConfig,
    model: makeReferenceModel(decodeDefinition(typeaheadDefinitionJson)),
    steps: listboxTypeaheadSteps,
    probe: listboxTypeaheadProbe,
  },
} as const satisfies Record<string, Machine>;

const isAction = (step: Scenario["steps"][number]): step is ActionStep => "event" in step;

const machineFor = (scenario: Scenario): Machine => {
  if (scenario.steps.some((step) => isAction(step) && step.event === "type")) {
    return MACHINES.typeahead;
  }
  return scenario.config?.["selectionMode"] === "multiple" ? MACHINES.multi : MACHINES.single;
};

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so closing the gap forces removing it) and says why.
// The divergence reason is documentation; the assertion only needs the throw.
const DIVERGENCES: Readonly<Record<string, string>> = {
  "listbox.react-aria.auto-focus-listbox":
    "autoFocus:true focuses the active option (roving tabindex), not the listbox container, so `focus` reads option:0",
  "listbox.react-aria.on-action-list-and-item":
    "onAction/onItemAction are react-aria extensions; the primitive reports only onSelectionChange",
  "listbox.react-aria.press-events":
    "onPress*/onAction/onClick are react-aria extensions; the primitive reports only onSelectionChange",
};

describe("Listbox x ported scenarios (real DOM)", () => {
  for (const source of [ariakit, baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const machine = machineFor(scenario);
          const run = replayScenario(scenario, machine.bridge, async (config) =>
            translated(
              domDriver(mountListbox(machine.config(config)), {
                hideableParts: [],
              }),
            ),
          );
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

describe("Listbox x spec (differential walk)", () => {
  const six = ["0", "1", "2", "3", "4", "5"];
  const five = ["0", "1", "2", "3", "4"];
  const names = ["aa", "ab", "b", "ba", "bc", "c"];

  const cases: ReadonlyArray<readonly [string, Machine, ScenarioConfig]> = [
    ["single", MACHINES.single, { items: six, selectionMode: "single" }],
    [
      "single followsFocus",
      MACHINES.single,
      { items: six, selectionMode: "single", followsFocus: true },
    ],
    [
      "single defaultSelected",
      MACHINES.single,
      { items: six, selectionMode: "single", defaultSelected: [3] },
    ],
    ["multi", MACHINES.multi, { items: five, selectionMode: "multiple" }],
    [
      "multi defaultSelected",
      MACHINES.multi,
      { items: five, selectionMode: "multiple", defaultSelected: [1, 3] },
    ],
    ["typeahead", MACHINES.typeahead, { items: names, selectionMode: "none" }],
    // controlled: a host that accepts every request, one that pins the value
    // (rejects), for the selection machines and the type-ahead focus value
    [
      "single controlled accepting",
      MACHINES.single,
      { items: six, selectionMode: "single", controlled: true, accepts: true },
    ],
    [
      "single controlled accepting defaultSelected",
      MACHINES.single,
      {
        items: six,
        selectionMode: "single",
        controlled: true,
        accepts: true,
        defaultSelected: [3],
      },
    ],
    [
      "single controlled holding",
      MACHINES.single,
      { items: six, selectionMode: "single", value: [3] },
    ],
    [
      "multi controlled accepting",
      MACHINES.multi,
      {
        items: five,
        selectionMode: "multiple",
        controlled: true,
        accepts: true,
      },
    ],
    [
      "multi controlled holding",
      MACHINES.multi,
      { items: five, selectionMode: "multiple", value: [1, 3] },
    ],
    [
      "typeahead controlled accepting",
      MACHINES.typeahead,
      {
        items: names,
        selectionMode: "none",
        controlled: true,
        accepts: true,
        defaultActive: 2,
      },
    ],
    [
      "typeahead controlled holding",
      MACHINES.typeahead,
      {
        items: names,
        selectionMode: "none",
        controlled: true,
        accepts: false,
        defaultActive: 2,
      },
    ],
  ];

  for (const [label, machine, config] of cases) {
    it(`matches the generated model for ${label}`, async () => {
      await differentialWalk({
        alphabet: machine.steps,
        probe: machine.probe,
        makePair: () =>
          Promise.resolve([
            specDriver(machine.model, machine.bridge, config),
            translated(
              domDriver(mountListbox(machine.config(config)), {
                hideableParts: [],
              }),
            ),
          ]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});

// The walk above is the primitive's contract through the skin's markup. What the skin adds is one part per row, the
// highlight it mirrors as `data-highlighted`, the selected fill and the multiple-mode check, the disabled grey, and the DOM
// focus that follows the primitive's roving tabindex.
const style = (element: Element): CSSStyleDeclaration => getComputedStyle(element);

const backgroundColorToken = (name: string): string => {
  const probe = document.createElement("div");
  probe.style.backgroundColor = `var(${name})`;
  document.body.append(probe);
  const value = style(probe).backgroundColor;
  probe.remove();
  return value;
};

const colorToken = (name: string): string => {
  const probe = document.createElement("div");
  probe.style.color = `var(${name})`;
  document.body.append(probe);
  const value = style(probe).color;
  probe.remove();
  return value;
};

/** Solid 2 applies setters and the primitive's effects on later turns. */
const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

const live: Mounted[] = [];

const mounted = (config: ScenarioConfig = {}): Mounted => {
  const instance = mountListbox(
    listboxConfig({ items: 4, selectionMode: "single", ...config }, "single"),
  );
  live.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

const required = <T extends Element>(parent: ParentNode, selector: string): T => {
  const element = parent.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`listbox: no ${selector}`);
  }
  return element;
};

const list = (root: ParentNode): HTMLElement => required(root, '[data-part="listbox"]');

const rows = (root: ParentNode): ReadonlyArray<HTMLElement> => [
  ...root.querySelectorAll<HTMLElement>('[data-part="listbox-option"]'),
];

const press = async (element: HTMLElement, key: string): Promise<void> => {
  element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  await tick();
};

describe("Listbox (the kit's look)", () => {
  it("is a named listbox whose rows state their place, with one roving tab stop", async () => {
    const { root } = mounted({ ariaLabel: "Fruit" });
    await tick();

    const element = list(root);
    expect(element.tagName).toBe("UL");
    expect(element.getAttribute("role")).toBe("listbox");
    expect(element.getAttribute("aria-label")).toBe("Fruit");
    expect(element.getAttribute("aria-multiselectable")).toBe("false");

    const all = rows(root);
    expect(all).toHaveLength(4);
    for (const [index, row] of all.entries()) {
      expect(row.tagName).toBe("LI");
      expect(row.getAttribute("role")).toBe("option");
      expect(row.getAttribute("aria-posinset")).toBe(String(index + 1));
      expect(row.getAttribute("aria-setsize")).toBe("4");
    }
    // exactly one row is the tab stop, and it is the primitive's active option
    expect(all.filter((row) => row.getAttribute("tabindex") === "0")).toHaveLength(1);
    expect(all.filter((row) => row.getAttribute("tabindex") === "-1")).toHaveLength(3);
  });

  it("follows the arrows with aria-activedescendant, data-highlighted and the real focus", async () => {
    const { root } = mounted({ items: 4 });
    await tick();

    const element = list(root);
    const all = rows(root);
    const roving = all.find((row) => row.getAttribute("tabindex") === "0");
    expect(roving).toBeDefined();
    roving!.focus();
    await tick();

    expect(element.getAttribute("aria-activedescendant")).toBe(roving!.id);
    expect(roving!.getAttribute("data-highlighted")).toBe("true");

    await press(roving!, "ArrowDown");

    const second = all[1]!;
    expect(element.getAttribute("aria-activedescendant")).toBe(second.id);
    expect(second.getAttribute("data-highlighted")).toBe("true");
    expect(roving!.getAttribute("data-highlighted")).toBe("false");
    // the highlight and the roving tab stop are the same row, and the focus followed it
    expect(second.getAttribute("tabindex")).toBe("0");
    expect(roving!.getAttribute("tabindex")).toBe("-1");
    expect(document.activeElement).toBe(second);

    await press(second, "ArrowUp");
    expect(element.getAttribute("aria-activedescendant")).toBe(roving!.id);
    expect(document.activeElement).toBe(roving!);
  });

  it("skips a disabled row and paints it grey", async () => {
    const { root } = mounted({ items: 3, disabled: [1] });
    await tick();

    const element = list(root);
    const all = rows(root);
    expect(all[1]!.getAttribute("aria-disabled")).toBe("true");
    expect(style(all[1]!).color).toBe(colorToken("--color-text-disabled"));
    expect(style(all[1]!).cursor).toBe("not-allowed");

    const first = all[0]!;
    first.focus();
    await tick();
    await press(first, "ArrowDown");

    // the arrow steps over the disabled row: row 2 is next, and row 1 never becomes the tab stop
    expect(element.getAttribute("aria-activedescendant")).toBe(all[2]!.id);
    expect(all[1]!.getAttribute("tabindex")).toBe("-1");
    expect(all[2]!.getAttribute("tabindex")).toBe("0");
  });

  it("paints the selected row, and a multiple list marks it with a check", async () => {
    const single = mounted({ items: 3, defaultSelected: [0] });
    await tick();
    expect(single.root.querySelectorAll('[data-part="listbox-check"]')).toHaveLength(0);

    const multiple = mounted({
      items: 3,
      selectionMode: "multiple",
      defaultSelected: [0],
    });
    await tick();

    const element = list(multiple.root);
    const all = rows(multiple.root);
    expect(element.getAttribute("aria-multiselectable")).toBe("true");
    expect(all[0]!.getAttribute("aria-selected")).toBe("true");
    expect(all[1]!.getAttribute("aria-selected")).toBe("false");
    // the fill is painted from aria-selected
    expect(style(all[0]!).backgroundColor).toBe(
      backgroundColorToken("--color-button-background-pressed"),
    );
    expect(style(all[1]!).backgroundColor).not.toBe(
      backgroundColorToken("--color-button-background-pressed"),
    );

    // a check beside the label, and only the selected row shows it
    const checks = [...multiple.root.querySelectorAll<HTMLElement>('[data-part="listbox-check"]')];
    expect(checks).toHaveLength(3);
    for (const check of checks) {
      expect(check.getAttribute("aria-hidden")).toBe("true");
      expect(check.textContent).toBe("✓");
    }
    expect(style(checks[0]!).visibility).toBe("visible");
    expect(style(checks[1]!).visibility).toBe("hidden");
  });

  it("keeps the selection of a controlled host that ignores the request", async () => {
    const { root, events } = mounted({ items: 3, value: [0] });
    await tick();

    const all = rows(root);
    await userEvent.click(all[2]!);
    await tick();

    // the primitive asked for row 2; the host never wrote it back, so row 0 is still the selection
    expect(all[0]!.getAttribute("aria-selected")).toBe("true");
    expect(all[2]!.getAttribute("aria-selected")).toBe("false");
    expect(events.get("onSelectionChange")).toEqual(["2"]);
  });
});
