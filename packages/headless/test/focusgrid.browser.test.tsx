import {
  type ActionStep,
  type Driver,
  type Json,
  type ScenarioConfig,
  Unsupported,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import {
  FOCUSGRID_COLS,
  FOCUSGRID_ROWS,
  type FocusGridConfig,
  focusGridCell,
  focusgridBridge,
  focusgridConfig,
  focusgridProbe,
  focusgridSteps,
} from "@cssints/apg-specs/patterns/focusgrid.bridge";
import definitionJson from "@cssints/apg-specs/patterns/focusgrid.model.json";
import scenarios from "@cssints/apg-specs/scenarios/patterns/focusgrid.spec.json";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import {
  type FocusGridDefinition,
  type FocusGridEdge,
  type FocusGridHandle,
  type FocusGridItem,
  focusGrid,
  focusgridAttribute,
  supportsFocusGrid,
} from "../src/focusgrid";
import { userEvent } from "vite-plus/test/browser";
import { afterEach, describe, expect, it } from "vite-plus/test";

/**
 * `focusGrid` in real Chromium: the model replay (the runtime's DOM against
 * `specs/patterns/focusgrid.qnt`, through the bridge) plus what a state machine
 * cannot hold — one tab stop in the markup, the authors' `tabindex` restored on
 * destroy, the `focusgrouprow` markers of a manual topology, a ragged body that
 * must decorate nothing, a row added under `update()`, a native control keeping
 * its own keys, and no listener left after unmount.
 *
 * The walk is a real one here, unlike the V1 adapter's: this runtime is the
 * provider (no engine implements V2), so it writes the tab stop and handles the
 * keydown our steps dispatch.
 */

const model = makeReferenceModel(decodeDefinition(definitionJson));

const MOUNTED: MountedGrid[] = [];

afterEach(() => {
  for (const grid of MOUNTED.splice(0)) {
    grid.dispose();
  }
});

interface MountedGrid {
  readonly root: HTMLElement;
  readonly owner: HTMLElement;
  readonly before: HTMLButtonElement;
  readonly after: HTMLButtonElement;
  /** The rows as mounted, in order; a row's length is its cell count. */
  readonly rows: HTMLElement[][];
  readonly handle: FocusGridHandle;
  items(): FocusGridItem[];
  cell(index: number): HTMLElement;
  update(definition?: FocusGridDefinition): void;
  setStart(index: number | null): void;
  addRow(): HTMLElement[];
  /** The cells' rendered `tabindex`, by linear index. */
  tabIndexes(): ReadonlyArray<string | null>;
  dispose(): void;
}

const DEFAULT_CONFIG: FocusGridConfig = {
  rowEdge: "none",
  colEdge: "none",
  memory: true,
  manual: false,
  start: 0,
};

const definitionOf = (config: FocusGridConfig): FocusGridDefinition => ({
  manual: config.manual,
  rowEdge: config.rowEdge,
  colEdge: config.colEdge,
  memory: config.memory,
});

/**
 * A 3x4 body of plain `div`s under a `role=grid` owner, with a button on each
 * side so Tab has somewhere to go. Cells carry no `tabindex` of their own unless
 * `authors` gives them one type-by-type, which is how the destroy test proves
 * the runtime restores them.
 */
const mountGrid = (
  config: FocusGridConfig = DEFAULT_CONFIG,
  options: {
    readonly authors?: ReadonlyArray<string | null>;
    /** The last row's cell count; below `FOCUSGRID_COLS` makes the body ragged. */
    readonly lastRowCells?: number;
  } = {},
): MountedGrid => {
  const root = document.createElement("div");
  const before = document.createElement("button");
  before.textContent = "before";
  const after = document.createElement("button");
  after.textContent = "after";
  const owner = document.createElement("div");
  owner.setAttribute("role", "grid");
  owner.setAttribute("aria-label", "grid");
  const rows: HTMLElement[][] = [];
  const cellsOf = (row: number): number =>
    options.lastRowCells !== undefined && row === FOCUSGRID_ROWS - 1
      ? options.lastRowCells
      : FOCUSGRID_COLS;
  for (let row = 0; row < FOCUSGRID_ROWS; row += 1) {
    const line = document.createElement("div");
    line.setAttribute("role", "row");
    const cells: HTMLElement[] = [];
    for (let col = 0; col < cellsOf(row); col += 1) {
      const cell = document.createElement("div");
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("data-part", focusGridCell(row, col));
      cell.textContent = `${row},${col}`;
      const author = options.authors?.[row * FOCUSGRID_COLS + col];
      if (author !== null && author !== undefined) {
        cell.setAttribute("tabindex", author);
      }
      line.append(cell);
      cells.push(cell);
    }
    owner.append(line);
    rows.push(cells);
  }
  root.append(before, owner, after);
  document.body.append(root);

  const items = (): FocusGridItem[] =>
    rows.flatMap((cells, row) =>
      cells.map((element, col) => ({ element, row, col, cell: element })),
    );
  const cell = (index: number): HTMLElement => {
    const element = rows[Math.floor(index / FOCUSGRID_COLS)]?.[index % FOCUSGRID_COLS];
    if (element === undefined) {
      throw new Error(`no cell at ${index}`);
    }
    return element;
  };

  // the fixture's markup names the entry cell, the way a host writes `focusgroupstart`
  cell(config.start).setAttribute("focusgroupstart", "");
  const handle = focusGrid(owner, { definition: definitionOf(config), items });

  const mounted: MountedGrid = {
    root,
    owner,
    before,
    after,
    rows,
    handle,
    items,
    cell,
    update: (definition) => handle.update(definition),
    setStart: (index) => {
      for (const item of items()) {
        item.element.removeAttribute("focusgroupstart");
      }
      if (index !== null) {
        cell(index).setAttribute("focusgroupstart", "");
      }
      handle.update();
    },
    addRow: () => {
      const row = rows.length;
      const line = document.createElement("div");
      line.setAttribute("role", "row");
      const cells: HTMLElement[] = [];
      for (let col = 0; col < FOCUSGRID_COLS; col += 1) {
        const addedCell = document.createElement("div");
        addedCell.setAttribute("role", "gridcell");
        addedCell.setAttribute("data-part", focusGridCell(row, col));
        addedCell.textContent = `${row},${col}`;
        line.append(addedCell);
        cells.push(addedCell);
      }
      owner.append(line);
      rows.push(cells);
      handle.update();
      return cells;
    },
    tabIndexes: () => items().map((item) => item.element.getAttribute("tabindex")),
    dispose: () => {
      handle.destroy();
      root.remove();
    },
  };
  MOUNTED.push(mounted);
  return mounted;
};

const active = (): Element | null => document.activeElement;

const tabStops = (grid: MountedGrid): number =>
  grid.items().filter((item) => item.element.getAttribute("tabindex") === "0").length;

const focusPart = (grid: MountedGrid): string | null => {
  const element = active();
  if (!(element instanceof HTMLElement) || !grid.owner.contains(element)) {
    return null;
  }
  const cell = element.closest<HTMLElement>("[data-part]");
  return cell?.dataset["part"] ?? null;
};

const settle = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

/** `Control+Home` -> a held Control; a bare key -> one press. */
const keyboard = (key: string): string => {
  const match = /^(Shift|Control|Alt|Meta)\+(.+)$/.exec(key);
  return match === null ? `{${key}}` : `{${match[1]}>}{${match[2]}}{/${match[1]}}`;
};

const NO_MODIFIER = new Set(["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"]);

const gridDriver = (grid: MountedGrid): Driver => {
  const perform = async (step: ActionStep): Promise<void> => {
    switch (step.event) {
      case "key": {
        const key = step.key ?? "";
        if (!NO_MODIFIER.has(key) && !/^(Shift|Control|Alt|Meta)\+/.test(key)) {
          throw new Unsupported(`key ${key}`);
        }
        await userEvent.keyboard(keyboard(key));
        break;
      }
      case "focus": {
        if (step.target === undefined || step.target === "grid") {
          const stop = grid.items().find((item) => item.element.getAttribute("tabindex") === "0");
          stop?.element.focus();
        } else {
          grid.cell(cellIndexOf(step.target)).focus();
        }
        break;
      }
      case "blur": {
        const element = active();
        if (element instanceof HTMLElement && grid.owner.contains(element)) {
          element.blur();
        }
        break;
      }
      case "click": {
        await userEvent.click(grid.cell(cellIndexOf(step.target)));
        break;
      }
      case "prop": {
        const current = currentDefinition(grid);
        switch (step.prop) {
          case "rowEdge":
            grid.update({ ...current, rowEdge: edgeOf(step.value) });
            break;
          case "colEdge":
            grid.update({ ...current, colEdge: edgeOf(step.value) });
            break;
          case "memory":
            grid.update({ ...current, memory: step.value === true });
            break;
          case "manual":
            grid.update({ ...current, manual: step.value === true });
            break;
          case "start":
            grid.setStart(Number(step.value));
            break;
          default:
            throw new Unsupported(`prop ${step.prop ?? ""}`);
        }
        break;
      }
      default:
        throw new Unsupported(`event ${step.event}`);
    }
    await settle();
  };

  return {
    perform,
    observer: {
      focus: () => focusPart(grid),
      attr: (target, name) => {
        if (name.startsWith("data-")) {
          throw new Unsupported(`styling hook ${name}`);
        }
        if (target === "grid") {
          return grid.owner.getAttribute(name);
        }
        const element = grid.cell(cellIndexOf(target));
        if (name === "focusgroupstart") {
          return element.hasAttribute(name) ? "true" : null;
        }
        return element.getAttribute(name);
      },
      visible: () => [],
      events: () => [],
    },
    dispose: () => grid.dispose(),
  };
};

const edgeOf = (value: Json | undefined): FocusGridEdge => {
  if (value === "none" || value === "wrap" || value === "flow") {
    return value;
  }
  throw new Unsupported(`edge ${JSON.stringify(value)}`);
};

const cellIndexOf = (target: string | undefined): number => {
  const match = /^cell:(\d+),(\d+)$/.exec(target ?? "");
  if (match === null) {
    throw new Unsupported(`target ${target ?? ""}`);
  }
  return Number(match[1]) * FOCUSGRID_COLS + Number(match[2]);
};

/** The definition in force, read back from the owner's canonical attribute. */
const currentDefinition = (grid: MountedGrid): FocusGridDefinition => {
  const tokens = (grid.owner.getAttribute("focusgroup") ?? "").split(/\s+/).filter(Boolean);
  const edge = (wrap: string, flow: string): FocusGridEdge =>
    tokens.includes(wrap) ? "wrap" : tokens.includes(flow) ? "flow" : "none";
  return {
    manual: tokens.includes("manual"),
    memory: !tokens.includes("nomemory"),
    rowEdge: edge("rowwrap", "rowflow"),
    colEdge: edge("colwrap", "colflow"),
  };
};

describe("focusGrid x scenarios (real DOM)", () => {
  const file = parseScenarioFile(scenarios);
  describe(file.source, () => {
    for (const scenario of file.scenarios) {
      it(scenario.id, async (context) => {
        const result = await replayScenario(scenario, focusgridBridge, (config) => {
          const c = focusgridConfig(config);
          return gridDriver(mountGrid(c));
        });
        if (result.status === "unsupported") {
          context.skip(result.reason);
        }
      });
    }
  });
});

describe("focusGrid x spec (differential walk)", () => {
  const configs: ReadonlyArray<ScenarioConfig> = [
    {},
    { rowEdge: "wrap", colEdge: "wrap" },
    { rowEdge: "flow", colEdge: "flow" },
    { memory: false },
    { manual: true },
    { start: 5 },
    { rowEdge: "flow", colEdge: "wrap", memory: false, manual: true, start: 11 },
  ];

  for (const config of configs) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      const dom = (next: ScenarioConfig) => gridDriver(mountGrid(focusgridConfig(next)));
      await differentialWalk({
        alphabet: focusgridSteps,
        probe: focusgridProbe,
        makePair: () => Promise.resolve([specDriver(model, focusgridBridge, config), dom(config)]),
        runs: 6,
        steps: 30,
        seed: 71,
      });
    });
  }
});

describe("focusGrid", () => {
  it("derives the attribute from the definition, canonically", () => {
    expect(focusgridAttribute({})).toBe("grid");
    expect(focusgridAttribute({ manual: true })).toBe("grid manual");
    expect(focusgridAttribute({ rowEdge: "wrap" })).toBe("grid rowwrap");
    expect(focusgridAttribute({ colEdge: "flow" })).toBe("grid colflow");
    expect(focusgridAttribute({ rowEdge: "none", colEdge: "none" })).toBe("grid");
    expect(focusgridAttribute({ memory: false })).toBe("grid nomemory");
    expect(
      focusgridAttribute({ manual: true, rowEdge: "flow", colEdge: "wrap", memory: false }),
    ).toBe("grid manual rowflow colwrap nomemory");
  });

  it("puts one tab stop in the markup, and Tab enters and leaves on it", async () => {
    const grid = mountGrid();
    expect(grid.owner.getAttribute("focusgroup")).toBe("grid");
    expect(grid.tabIndexes()).toEqual([
      "0",
      "-1",
      "-1",
      "-1",
      "-1",
      "-1",
      "-1",
      "-1",
      "-1",
      "-1",
      "-1",
      "-1",
    ]);

    grid.before.focus();
    await userEvent.tab();
    expect(active()).toBe(grid.cell(0));
    await userEvent.tab();
    expect(active()).toBe(grid.after);
    await userEvent.tab({ shift: true });
    expect(active()).toBe(grid.cell(0));
  });

  it("re-enters on the cell that last had focus, and on the start with nomemory", async () => {
    const remembered = mountGrid();
    await userEvent.click(remembered.cell(6));
    expect(focusPart(remembered)).toBe("cell:1,2");
    await userEvent.tab();
    expect(active()).toBe(remembered.after);
    await userEvent.tab({ shift: true });
    expect(active()).toBe(remembered.cell(6));

    const forgetful = mountGrid({ ...DEFAULT_CONFIG, memory: false });
    await userEvent.click(forgetful.cell(6));
    await userEvent.tab();
    expect(active()).toBe(forgetful.after);
    await userEvent.tab({ shift: true });
    expect(active()).toBe(forgetful.cell(0));
    // the coordinate is still known: only the restoration is disabled
    expect(forgetful.owner.getAttribute("focusgroup")).toBe("grid nomemory");
  });

  it("moves on both axes, Home / End within a row and Ctrl+Home / Ctrl+End across the grid", async () => {
    const grid = mountGrid();
    grid.cell(5).focus();
    const press = async (key: string): Promise<void> => {
      await userEvent.keyboard(keyboard(key));
    };
    await press("ArrowRight");
    expect(focusPart(grid)).toBe("cell:1,2");
    await press("ArrowDown");
    expect(focusPart(grid)).toBe("cell:2,2");
    await press("ArrowLeft");
    expect(focusPart(grid)).toBe("cell:2,1");
    await press("ArrowUp");
    expect(focusPart(grid)).toBe("cell:1,1");
    await press("Home");
    expect(focusPart(grid)).toBe("cell:1,0");
    await press("End");
    expect(focusPart(grid)).toBe("cell:1,3");
    await press("Control+Home");
    expect(focusPart(grid)).toBe("cell:0,0");
    await press("Control+End");
    expect(focusPart(grid)).toBe("cell:2,3");
    // a hard edge does not move and does not consume
    await press("ArrowRight");
    expect(focusPart(grid)).toBe("cell:2,3");
    // a command with another modifier is not a command
    await userEvent.keyboard("{Control>}{Shift>}{Home}{/Shift}{/Control}");
    expect(focusPart(grid)).toBe("cell:2,3");
    expect(tabStops(grid)).toBe(1);
  });

  it("applies each edge modifier on its own axis", async () => {
    const cases: ReadonlyArray<readonly [Partial<FocusGridConfig>, number, string, number]> = [
      [{ rowEdge: "wrap", colEdge: "none" }, 3, "ArrowRight", 0],
      [{ rowEdge: "flow", colEdge: "none" }, 3, "ArrowRight", 4],
      [{ rowEdge: "none", colEdge: "wrap" }, 9, "ArrowDown", 1],
      [{ rowEdge: "none", colEdge: "flow" }, 9, "ArrowDown", 2],
      [{ rowEdge: "wrap", colEdge: "wrap" }, 0, "ArrowLeft", 3],
      [{ rowEdge: "flow", colEdge: "flow" }, 0, "ArrowLeft", 11],
    ];
    for (const [config, from, key, to] of cases) {
      const grid = mountGrid({ ...DEFAULT_CONFIG, ...config });
      try {
        grid.cell(from).focus();
        await userEvent.keyboard(keyboard(key));
        expect(focusPart(grid), `${JSON.stringify(config)} ${key}`).toBe(
          `cell:${Math.floor(to / FOCUSGRID_COLS)},${to % FOCUSGRID_COLS}`,
        );
        expect(tabStops(grid)).toBe(1);
      } finally {
        grid.dispose();
        MOUNTED.splice(MOUNTED.indexOf(grid), 1);
      }
    }
  });

  it("decorates nothing when the body is not a rectangle", async () => {
    const ragged = mountGrid(DEFAULT_CONFIG, {
      authors: Array.from({ length: 11 }, () => "-1"),
      lastRowCells: 3,
    });
    expect(ragged.owner.getAttribute("focusgroup")).toBe("grid");
    // the authors' values are untouched: no tab stop was written
    expect(ragged.tabIndexes()).toEqual(Array.from({ length: 11 }, () => "-1"));
    expect(tabStops(ragged)).toBe(0);
    ragged.cell(4).focus();
    await userEvent.keyboard(keyboard("ArrowRight"));
    expect(focusPart(ragged)).toBe("cell:1,0");
  });

  it("re-collects a row added under update(), and Ctrl+End reaches it", async () => {
    const grid = mountGrid();
    const added = grid.addRow();
    expect(added).toHaveLength(4);
    grid.cell(0).focus();
    await userEvent.keyboard(keyboard("Control+End"));
    expect(active()).toBe(added[3] ?? null);
    expect(tabStops(grid)).toBe(1);
    expect(grid.cell(0).getAttribute("tabindex")).toBe("-1");
    expect(added[3]?.getAttribute("tabindex")).toBe("0");
  });

  it("marks a manual topology's rows, and takes the markers back", () => {
    const grid = mountGrid({ ...DEFAULT_CONFIG, manual: true });
    expect(grid.owner.getAttribute("focusgroup")).toBe("grid manual");
    for (const row of grid.rows) {
      expect(row[0]?.parentElement?.hasAttribute("focusgrouprow")).toBe(true);
    }
    grid.update({ ...definitionOf(DEFAULT_CONFIG), manual: false });
    expect(grid.owner.getAttribute("focusgroup")).toBe("grid");
    for (const row of grid.rows) {
      expect(row[0]?.parentElement?.hasAttribute("focusgrouprow")).toBe(false);
    }
    grid.update({ ...definitionOf(DEFAULT_CONFIG), manual: true });
    grid.dispose();
    MOUNTED.splice(MOUNTED.indexOf(grid), 1);
    expect(grid.owner.hasAttribute("focusgroup")).toBe(false);
    for (const row of grid.rows) {
      expect(row[0]?.parentElement?.hasAttribute("focusgrouprow")).toBe(false);
    }
  });

  it("keeps an author's focusgrouprow marker", () => {
    const grid = mountGrid({ ...DEFAULT_CONFIG, manual: true });
    const first = grid.rows[0]?.[0]?.parentElement;
    const second = grid.rows[1]?.[0]?.parentElement;
    // an author wrote the marker before the runtime ever did
    grid.update({ ...definitionOf(DEFAULT_CONFIG), manual: false });
    first?.setAttribute("focusgrouprow", "");
    second?.removeAttribute("focusgrouprow");
    grid.update({ ...definitionOf(DEFAULT_CONFIG), manual: true });
    grid.dispose();
    MOUNTED.splice(MOUNTED.indexOf(grid), 1);
    expect(first?.hasAttribute("focusgrouprow")).toBe(true);
    expect(second?.hasAttribute("focusgrouprow")).toBe(false);
  });

  it("restores the authors' tabindex on destroy, idempotently, and leaves no listener", async () => {
    const grid = mountGrid(DEFAULT_CONFIG, { authors: ["2", null, "-1"] });
    expect(grid.cell(0).getAttribute("tabindex")).toBe("0");
    expect(grid.cell(1).getAttribute("tabindex")).toBe("-1");
    grid.handle.destroy();
    grid.handle.destroy();
    grid.handle.update();
    expect(grid.cell(0).getAttribute("tabindex")).toBe("2");
    expect(grid.cell(1).hasAttribute("tabindex")).toBe(false);
    expect(grid.cell(2).getAttribute("tabindex")).toBe("-1");
    expect(grid.owner.hasAttribute("focusgroup")).toBe(false);

    // the authors' -1 is focusable programmatically; nothing moves the grid now
    grid.cell(2).focus();
    expect(active()).toBe(grid.cell(2));
    await userEvent.keyboard(keyboard("ArrowRight"));
    expect(active()).toBe(grid.cell(2));
  });

  it("lets a native control inside a cell keep its own keys", async () => {
    const root = document.createElement("div");
    const owner = document.createElement("div");
    owner.setAttribute("role", "grid");
    const field = document.createElement("input");
    field.value = "abc";
    const sibling = document.createElement("button");
    sibling.textContent = "sibling";
    const row = document.createElement("div");
    row.append(field, sibling);
    owner.append(row);
    root.append(owner);
    document.body.append(root);
    const handle = focusGrid(owner, {
      definition: {},
      items: () => [
        { element: field, row: 0, col: 0 },
        { element: sibling, row: 0, col: 1 },
      ],
    });
    try {
      field.focus();
      await userEvent.keyboard(keyboard("ArrowLeft"));
      expect(active()).toBe(field);
      await userEvent.keyboard(keyboard("Home"));
      expect(active()).toBe(field);
      expect([field, sibling].filter((el) => el.getAttribute("tabindex") === "0")).toHaveLength(1);
    } finally {
      handle.destroy();
      root.remove();
    }
  });
});

const gridToken = (token: string): boolean => {
  const probe = document.createElement("div") as HTMLElement & {
    readonly focusGroup?: { readonly supports?: (token: string) => boolean };
  };
  return "focusGroup" in HTMLElement.prototype && probe.focusGroup?.supports?.(token) === true;
};

describe("supportsFocusGrid", () => {
  it("reports the engine's own grid token support, and manual with it", () => {
    // pinned: as of the specs' pins no engine ships V2, so this is false here and
    // the runtime is the provider the walks above exercise. It is written as a
    // comparison, not as `false`, so a future engine flips both sides together.
    expect(supportsFocusGrid()).toBe(gridToken("grid"));
    expect(supportsFocusGrid(true)).toBe(gridToken("grid") && gridToken("manual"));
  });
});
