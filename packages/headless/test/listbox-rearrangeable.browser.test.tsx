import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, it } from "vite-plus/test";
import { differentialWalk, specDriver } from "@cssints/apg-specs/scenario";
import {
  listboxRearrangeableBridge,
  listboxRearrangeableConfig,
  listboxRearrangeableProbe,
  listboxRearrangeableSteps,
} from "@cssints/apg-specs/apg/listbox-rearrangeable.bridge";
import type { ScenarioConfig } from "@cssints/apg-specs/scenario";
import definitionJson from "@cssints/apg-specs/apg/listbox-rearrangeable.model.json";
import { domDriver } from "./dom-driver";
import { mountRearrangeableListbox } from "./listbox-rearrangeable.fixture";

const model = makeReferenceModel(decodeDefinition(definitionJson));
const items = ["0", "1", "2", "3"];

describe("createRearrangeableListbox x spec (differential walk)", () => {
  const cases: ReadonlyArray<readonly [string, ScenarioConfig]> = [
    ["single", { items }],
    ["multi", { items, multi: true }],
    ["single controlled accepting", { items, controlled: true }],
    ["single controlled holding", { items, accepts: false }],
    ["multi controlled accepting", { items, multi: true, controlled: true }],
    ["multi controlled holding", { items, multi: true, accepts: false }],
  ];

  for (const [label, config] of cases) {
    it(`matches the generated model for ${label}`, async () => {
      await differentialWalk({
        alphabet: listboxRearrangeableSteps,
        probe: listboxRearrangeableProbe,
        makePair: () =>
          Promise.resolve([
            specDriver(model, listboxRearrangeableBridge, config),
            domDriver(mountRearrangeableListbox(listboxRearrangeableConfig(config)), {
              hideableParts: [],
            }),
          ]),
        runs: 15,
        steps: 30,
        seed: 7,
      });
    });
  }
});
