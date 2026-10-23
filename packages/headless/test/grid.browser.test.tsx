import {
  type Scenario,
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
  gridBridge,
  gridConfig,
  gridProbe,
  gridSteps,
} from "@cssints/apg-specs/src/apg/grid.bridge";
import {
  gridSelectionBridge,
  gridSelectionConfig,
  gridSelectionProbe,
  gridSelectionSteps,
} from "@cssints/apg-specs/src/apg/grid-selection.bridge";
import {
  gridSortBridge,
  gridSortConfig,
  gridSortProbe,
  gridSortSteps,
} from "@cssints/apg-specs/src/apg/grid-sort.bridge";
import ariakit from "@cssints/apg-specs/scenarios/apg/grid.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/grid.base-ui.json";
import gridDefinition from "@cssints/apg-specs/src/apg/grid.model.generated.json";
import gridSelectionDefinition from "@cssints/apg-specs/src/apg/grid-selection.model.generated.json";
import gridSortDefinition from "@cssints/apg-specs/src/apg/grid-sort.model.generated.json";
import { mountGrid } from "./grid.fixture";
import { partsDriver } from "./parts-driver";
import reactAria from "@cssints/apg-specs/scenarios/apg/grid.react-aria.json";

const gridModel = makeReferenceModel(decodeDefinition(gridDefinition));
const selectionModel = makeReferenceModel(decodeDefinition(gridSelectionDefinition));
const sortModel = makeReferenceModel(decodeDefinition(gridSortDefinition));

const dom = (config: ScenarioConfig) => partsDriver(mountGrid(gridConfig(config)));

const selectionDom = (config: ScenarioConfig) =>
  partsDriver(mountGrid(gridSelectionConfig(config)));

const sortDom = (config: ScenarioConfig) => partsDriver(mountGrid(gridSortConfig(config)));

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so fixing the gap forces removing it) and says why.
const LOOP_WRAP =
  "base-ui grids loop by default; the APG data grid (grid.qnt) never wraps, so the row-edge Left/Right stays on the cell";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "grid.base-ui.uniform-1x1-items": LOOP_WRAP,
};

describe("createGrid x ported scenarios (real DOM)", () => {
  for (const source of [ariakit, baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, gridBridge, dom);
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

describe("createGrid x grid.qnt (differential walk)", () => {
  for (const config of [
    {},
    { gridKind: "layout" as const, wrapCols: true, wrapRows: true },
    { gridReadonly: true },
    { focusTarget: "widget" as const },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: gridSteps,
        probe: gridProbe,
        makePair: () => Promise.resolve([specDriver(gridModel, gridBridge, config), dom(config)]),
        runs: 12,
        steps: 25,
        seed: 7,
      });
    });
  }
});

describe("createGrid x grid-selection.qnt (differential walk)", () => {
  for (const config of [
    { selectable: true },
    { selectable: false },
    // controlled: a host that accepts every request, and one that pins a
    // selection (rejects), so no event commits
    { selectable: true, controlled: true },
    { selectable: true, controlled: true, selection: 5 },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: gridSelectionSteps,
        probe: gridSelectionProbe,
        makePair: () =>
          Promise.resolve([
            specDriver(selectionModel, gridSelectionBridge, config),
            selectionDom(config),
          ]),
        runs: 12,
        steps: 25,
        seed: 11,
      });
    });
  }
});

// controlled scenarios that are not in the ported files: a pinned host holds
// every request, and a host write (`setValue`) is the only thing that commits.
const CONTROLLED_SELECTION: Scenario = {
  id: "grid.selection.controlled-holds",
  config: { selectable: true, controlled: true, selection: 1 },
  steps: [
    { event: "click", target: "cell:1,1" },
    {
      expect: {
        attrs: {
          "cell:0,0": { "aria-selected": "true" },
          "cell:1,1": { "aria-selected": "false" },
        },
      },
    },
    { event: "prop", prop: "setValue", value: 0 },
    { expect: { attrs: { "cell:0,0": { "aria-selected": "false" } } } },
  ],
};

const CONTROLLED_SORT: Scenario = {
  id: "grid.sort.controlled-holds",
  config: { sortEnabled: true, sortControlled: true, sort: 4 },
  steps: [
    { event: "click", target: "header:0" },
    {
      expect: {
        attrs: {
          "header:0": { "aria-sort": "none" },
          "header:2": { "aria-sort": "ascending" },
        },
      },
    },
    { event: "prop", prop: "setValue", value: -1 },
    { expect: { attrs: { "header:2": { "aria-sort": "none" } } } },
  ],
};

describe("createGrid x controlled scenarios (real DOM)", () => {
  it("replays a held selection against the model and the DOM", async () => {
    const spec = await replayScenario(CONTROLLED_SELECTION, gridSelectionBridge, (config) =>
      specDriver(selectionModel, gridSelectionBridge, config),
    );
    expect(spec.status).toBe("passed");
    const domResult = await replayScenario(CONTROLLED_SELECTION, gridSelectionBridge, selectionDom);
    expect(domResult.status).toBe("passed");
  });

  it("replays a held sort against the model and the DOM", async () => {
    const spec = await replayScenario(CONTROLLED_SORT, gridSortBridge, (config) =>
      specDriver(sortModel, gridSortBridge, config),
    );
    expect(spec.status).toBe("passed");
    const domResult = await replayScenario(CONTROLLED_SORT, gridSortBridge, sortDom);
    expect(domResult.status).toBe("passed");
  });
});

describe("createGrid x grid-sort.qnt (differential walk)", () => {
  for (const config of [
    { sortEnabled: true },
    { sortEnabled: false },
    // controlled: a host that accepts every request, and one that pins a sort
    { sortEnabled: true, sortControlled: true },
    { sortEnabled: true, sortControlled: true, sort: 4 },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: gridSortSteps,
        probe: gridSortProbe,
        makePair: () =>
          Promise.resolve([specDriver(sortModel, gridSortBridge, config), sortDom(config)]),
        runs: 12,
        steps: 20,
        seed: 13,
      });
    });
  }
});
