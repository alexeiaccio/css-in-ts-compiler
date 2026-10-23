import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/src/scenario";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import {
  windowsplitterBridge,
  windowsplitterConfig,
  windowsplitterProbe,
  windowsplitterSteps,
} from "@cssints/apg-specs/src/apg/windowsplitter.bridge";
import apg from "@cssints/apg-specs/scenarios/apg/windowsplitter.apg.json";
import definitionJson from "@cssints/apg-specs/src/apg/windowsplitter.model.generated.json";
import { mountWindowSplitter } from "./windowsplitter.fixture";
import { partsDriver } from "./parts-driver";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  partsDriver(mountWindowSplitter(windowsplitterConfig(config)), {
    hideableParts: [],
  });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so fixing the gap forces removing it) and says why.
// The ported scenarios use `"*"` for "any non-empty IDREF / name"; the replay
// engine compares attributes literally, so a real id can never equal `"*"`.
const WILDCARD =
  'the scenario uses "*" for "any non-empty IDREF / accessible name"; the replay engine compares attributes literally, so it can never match';
const DIVERGENCES: Readonly<Record<string, string>> = {
  "windowsplitter.apg.roles.aria-label-names-primary-pane": WILDCARD,
  "windowsplitter.apg.roles.aria-controls-references-primary-pane": WILDCARD,
};

describe("createWindowSplitter x ported scenarios (real DOM)", () => {
  const file = parseScenarioFile(apg);
  describe(file.source, () => {
    for (const scenario of file.scenarios) {
      it(scenario.id, async (context) => {
        const run = replayScenario(scenario, windowsplitterBridge, dom);
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
});

describe("createWindowSplitter x spec (differential walk)", () => {
  it("cycles focus through the panes (F6)", async () => {
    const driver = dom({});
    await driver.perform({ event: "focus", target: "separator" });
    await driver.perform({ event: "prop", prop: "cycleFocus" });
    expect(driver.observer.focus()).toBe("secondary");
    await driver.perform({ event: "prop", prop: "cycleFocus" });
    expect(driver.observer.focus()).toBe("primary");
    await driver.perform({ event: "prop", prop: "cycleFocus" });
    expect(driver.observer.focus()).toBe("separator");
    driver.dispose?.();
  });

  for (const config of [
    {},
    { orientation: "horizontal" },
    { fixed: true },
    { controlled: true },
    { controlled: true, accepts: false },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: windowsplitterSteps,
        probe: windowsplitterProbe,
        makePair: () =>
          Promise.resolve([specDriver(model, windowsplitterBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 11,
      });
    });
  }
});
