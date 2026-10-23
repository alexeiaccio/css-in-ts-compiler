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
import { describe, expect, it } from "vite-plus/test";
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
import type { ListboxMountConfig } from "@cssints/apg-specs/apg/listbox-shared";
import ariakit from "@cssints/apg-specs/scenarios/apg/listbox.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/listbox.base-ui.json";
import { domDriver } from "./dom-driver";
import { mountListbox } from "./listbox.fixture";
import multiDefinitionJson from "@cssints/apg-specs/apg/listbox-multi.model.json";
import reactAria from "@cssints/apg-specs/scenarios/apg/listbox.react-aria.json";
import singleDefinitionJson from "@cssints/apg-specs/apg/listbox-single.model.json";
import typeaheadDefinitionJson from "@cssints/apg-specs/apg/listbox-typeahead.model.json";

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

describe("createListbox x ported scenarios (real DOM)", () => {
  for (const source of [ariakit, baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const machine = machineFor(scenario);
          const run = replayScenario(scenario, machine.bridge, async (config) =>
            domDriver(mountListbox(machine.config(config)), {
              hideableParts: [],
            }),
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

describe("createListbox x spec (differential walk)", () => {
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
            domDriver(mountListbox(machine.config(config)), {
              hideableParts: [],
            }),
          ]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});
