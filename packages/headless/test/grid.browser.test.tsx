import {
  type Scenario,
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { flush, createSignal } from "solid-js";
import { render } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";
import { gridBridge, gridConfig, gridProbe, gridSteps } from "@cssints/apg-specs/apg/grid.bridge";
import {
  gridSelectionBridge,
  gridSelectionConfig,
  gridSelectionProbe,
  gridSelectionSteps,
} from "@cssints/apg-specs/apg/grid-selection.bridge";
import {
  gridSortBridge,
  gridSortConfig,
  gridSortProbe,
  gridSortSteps,
} from "@cssints/apg-specs/apg/grid-sort.bridge";
import ariakit from "@cssints/apg-specs/scenarios/apg/grid.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/grid.base-ui.json";
import gridDefinition from "@cssints/apg-specs/apg/grid.model.json";
import gridSelectionDefinition from "@cssints/apg-specs/apg/grid-selection.model.json";
import gridSortDefinition from "@cssints/apg-specs/apg/grid-sort.model.json";
import { mountGrid } from "./grid.fixture";
import { partsDriver } from "./parts-driver";
import { type Grid, createGrid } from "../src/grid";
import reactAria from "@cssints/apg-specs/scenarios/apg/grid.react-aria.json";

const gridModel = makeReferenceModel(decodeDefinition(gridDefinition));
const selectionModel = makeReferenceModel(decodeDefinition(gridSelectionDefinition));
const sortModel = makeReferenceModel(decodeDefinition(gridSortDefinition));

const dom = (config: ScenarioConfig) => partsDriver(mountGrid(gridConfig(config)));

const selectionDom = (config: ScenarioConfig) =>
  partsDriver(mountGrid(gridSelectionConfig(config)));

const sortDom = (config: ScenarioConfig) =>
  partsDriver(mountGrid(gridSortConfig(config), "polyfill", "header"));

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

// The walks above prove the model on the forced fallback, the only provider
// that renders the tabindex their probes read. This is the provider-switched
// path under real keys: `supportsFocusGrid()` is false in every engine this
// repository tests, so `auto` is our runtime today and the engine's own
// implementation the day it ships — the attribute and the expectations are the
// same.
const part = (root: HTMLElement, name: string): HTMLElement => {
  const element = root.querySelector<HTMLElement>(`[data-part="${name}"]`);
  if (element === null) {
    throw new Error(`no part ${name}`);
  }
  return element;
};

const cellAt = (root: HTMLElement, row: number, col: number): HTMLElement =>
  part(root, `cell:${row},${col}`);

const widgetAt = (root: HTMLElement, row: number, col: number): HTMLElement =>
  part(root, `cell:${row},${col}/widget`);

const tabStops = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[role="gridcell"][tabindex="0"]'),
];

/** Let Solid's settled render and the runtime's post-render re-collect land. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const surround = (root: HTMLElement) => {
  const before = document.createElement("button");
  const after = document.createElement("button");
  document.body.insertBefore(before, root);
  document.body.insertBefore(after, root.nextSibling);
  return {
    before,
    after,
    remove: () => {
      before.remove();
      after.remove();
    },
  };
};

describe("createGrid x focusgroup V2 (the provider-switched path, real keys)", () => {
  it("takes one stop, enters on it, moves on both axes and remembers it across Tab", async () => {
    const mounted = mountGrid(gridConfig({}), "auto");
    const { root } = mounted;
    await settle();
    const buttons = surround(root);
    const grid = part(root, "grid");
    expect(grid.getAttribute("focusgroup")).toBe("grid");
    // the runtime owns WHICH cell is the stop; the authored values stay on the
    // cells and exactly one of them is rendered as the stop
    expect(tabStops(root)).toHaveLength(1);
    expect(tabStops(root)[0]).toBe(cellAt(root, 0, 0));

    buttons.before.focus();
    await userEvent.tab();
    // the sortable header row is its own stop and stays out of the body group
    expect(document.activeElement).toBe(part(root, "header:0"));
    await userEvent.tab();
    expect(document.activeElement).toBe(cellAt(root, 0, 0));
    expect(mounted.focus?.()).toBe("cell:0,0");

    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(cellAt(root, 0, 1));
    expect(tabStops(root)).toHaveLength(1);
    expect(tabStops(root)[0]).toBe(cellAt(root, 0, 1));
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(cellAt(root, 1, 1));
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(cellAt(root, 1, 2));
    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(cellAt(root, 1, 0));
    await userEvent.keyboard("{Control>}{End}{/Control}");
    expect(document.activeElement).toBe(cellAt(root, 3, 2));
    await userEvent.keyboard("{Control>}{Home}{/Control}");
    expect(document.activeElement).toBe(cellAt(root, 0, 0));

    // a data grid's edges are hard
    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(cellAt(root, 0, 0));
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(cellAt(root, 0, 0));

    // one tab stop leaves from wherever focus is, and memory brings it back
    await userEvent.tab();
    expect(document.activeElement).toBe(buttons.after);
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(cellAt(root, 0, 0));

    buttons.remove();
    mounted.dispose();
  });

  it("flows each layout-grid option on its own axis only", async () => {
    const data = mountGrid(gridConfig({}), "auto");
    await settle();
    cellAt(data.root, 3, 2).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(cellAt(data.root, 3, 2));
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(cellAt(data.root, 3, 2));
    data.dispose();

    const cols = mountGrid(gridConfig({ gridKind: "layout", wrapCols: true }), "auto");
    await settle();
    expect(part(cols.root, "grid").getAttribute("focusgroup")).toBe("grid rowflow");
    cellAt(cols.root, 3, 2).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(cellAt(cols.root, 0, 0));
    // the other axis is still hard
    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(cellAt(cols.root, 0, 0));
    cols.dispose();

    const rows = mountGrid(gridConfig({ gridKind: "layout", wrapRows: true }), "auto");
    await settle();
    expect(part(rows.root, "grid").getAttribute("focusgroup")).toBe("grid colflow");
    cellAt(rows.root, 3, 2).focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(cellAt(rows.root, 0, 0));
    // the other axis is still hard
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(cellAt(rows.root, 0, 0));
    rows.dispose();

    const both = mountGrid(
      gridConfig({ gridKind: "layout", wrapCols: true, wrapRows: true }),
      "auto",
    );
    await settle();
    expect(part(both.root, "grid").getAttribute("focusgroup")).toBe("grid rowflow colflow");
    cellAt(both.root, 0, 0).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(cellAt(both.root, 3, 2));
    await userEvent.keyboard("{Control>}{Home}{/Control}");
    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(cellAt(both.root, 3, 2));
    both.dispose();
  });

  it("moves the widget target and announces it on aria-activedescendant", async () => {
    const mounted = mountGrid(gridConfig({ focusTarget: "widget" }), "auto");
    const { root } = mounted;
    await settle();
    const buttons = surround(root);
    const grid = part(root, "grid");
    // the widget set is the item set: the cells step out of the sequential order
    expect(cellAt(root, 0, 0).getAttribute("tabindex")).toBe("-1");
    expect(widgetAt(root, 0, 0).getAttribute("tabindex")).toBe("0");
    expect([...root.querySelectorAll<HTMLElement>('[role="gridcell"][tabindex="0"]')]).toEqual([]);

    buttons.before.focus();
    await userEvent.tab();
    await userEvent.tab();
    expect(document.activeElement).toBe(widgetAt(root, 0, 0));
    expect(grid.getAttribute("aria-activedescendant")).toBe(cellAt(root, 0, 0).id);

    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(widgetAt(root, 0, 1));
    expect(grid.getAttribute("aria-activedescendant")).toBe(cellAt(root, 0, 1).id);
    expect(widgetAt(root, 0, 0).getAttribute("tabindex")).toBe("-1");

    buttons.remove();
    mounted.dispose();
  });

  it("re-collects when the mount window moves and keeps one stop in range", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    const [start, setStart] = createSignal(0);
    let grid: Grid | undefined;
    const dispose = render(() => {
      const created = createGrid({
        rows: 6,
        cols: 2,
        get rowWindow() {
          return { start: start(), count: 2 };
        },
      });
      grid = created;
      return (
        <div data-part="grid" {...created.gridProps}>
          {created.renderedRows().map((row) => (
            <div {...created.rowProps(row)}>
              {[0, 1].map((col) => (
                <div data-part={`cell:${row},${col}`} {...created.cellProps(row, col)} />
              ))}
            </div>
          ))}
        </div>
      );
    }, root);
    await settle();
    const stop = (): string | null => tabStops(root)[0]?.dataset["part"] ?? null;
    expect(stop()).toBe("cell:0,0");
    expect(tabStops(root)).toHaveLength(1);

    setStart(3);
    flush();
    await Promise.resolve();
    // the old stop is unmounted, so the runtime re-seats it on the first
    // mounted cell: still exactly one, still in range
    expect(stop()).toBe("cell:3,0");
    expect(tabStops(root)).toHaveLength(1);

    cellAt(root, 4, 1).focus();
    expect(tabStops(root)).toHaveLength(1);
    expect(tabStops(root)[0]).toBe(cellAt(root, 4, 1));
    setStart(0);
    flush();
    await Promise.resolve();
    expect(stop()).toBe("cell:0,0");
    expect(tabStops(root)).toHaveLength(1);

    dispose();
    root.remove();
  });
});
