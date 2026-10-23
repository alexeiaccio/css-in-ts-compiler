import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import {
  treegridBridge,
  treegridConfig,
  treegridProbe,
  treegridSteps,
} from "@cssints/apg-specs/apg/treegrid.bridge";
import apg from "@cssints/apg-specs/scenarios/apg/treegrid.apg.json";
import { mountTreegrid } from "./treegrid.fixture";
import { partsDriver } from "./parts-driver";
import reactAria from "@cssints/apg-specs/scenarios/apg/treegrid.react-aria.json";
import treegridDefinition from "@cssints/apg-specs/apg/treegrid.model.json";

const treegridModel = makeReferenceModel(decodeDefinition(treegridDefinition));

const dom = (config: ScenarioConfig) => partsDriver(mountTreegrid(treegridConfig(config)));

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so fixing the gap forces removing it) and says why.
const DIVERGENCES: Readonly<Record<string, string>> = {};

describe("createTreegrid x ported scenarios (real DOM)", () => {
  for (const source of [apg, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, treegridBridge, dom);
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

describe("createTreegrid x treegrid.qnt (differential walk)", () => {
  for (const config of [
    { nav: "rowsFirst" as const, selection: "single" as const },
    { nav: "cellsFirst" as const, selection: "multi" as const },
    { nav: "cellsOnly" as const, selection: "multi" as const },
    // controlled: a host that accepts every request, one that holds the
    // selection (rejects), in single and multi
    {
      nav: "rowsFirst" as const,
      selection: "single" as const,
      controlled: true,
      accepts: true,
    },
    {
      nav: "rowsFirst" as const,
      selection: "single" as const,
      controlled: true,
      accepts: false,
    },
    {
      nav: "rowsFirst" as const,
      selection: "multi" as const,
      controlled: true,
      accepts: true,
    },
    {
      nav: "cellsFirst" as const,
      selection: "single" as const,
      controlled: true,
      accepts: false,
    },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: treegridSteps,
        probe: treegridProbe,
        makePair: () =>
          Promise.resolve([specDriver(treegridModel, treegridBridge, config), dom(config)]),
        runs: 12,
        steps: 25,
        seed: 17,
      });
    });
  }
});
