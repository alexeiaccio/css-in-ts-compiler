import { type Grid, createGrid, packSelection, packSort } from "../src/grid";
import { createEffect, createSignal } from "solid-js";
import type { GridConfig } from "@cssints/apg-specs/apg/grid.bridge";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./dom-driver";
import { render } from "@solidjs/web";

/**
 * Renders `createGrid` as rows/cells/headers and exposes the `Mounted` the DOM
 * driver needs. Controlled, the fixture is the host: it keeps the packed
 * selection (`value`) and sort (`sortValue`) in signals, passes them only while
 * controlled, and writes every request back only while `accepts`.
 */
export const mountGrid = (config: GridConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [hostSelection, setHostSelection] = createSignal(config.selectionValue ?? 0);
  const [hostSort, setHostSort] = createSignal(config.sortValue ?? -1);
  const writeSelection = (next: number): void => {
    if (config.selectionControlled) {
      setHostSelection(next);
    }
  };
  const writeSort = (next: number): void => {
    if (config.sortControlled) {
      setHostSort(next);
    }
  };
  let api: Grid | undefined;
  const columns = Array.from({ length: config.cols }, (_, index) => index);

  const dispose = render(() => {
    const grid = createGrid({
      rows: config.rows,
      cols: config.cols,
      gridKind: config.gridKind,
      wrapCols: config.wrapCols,
      wrapRows: config.wrapRows,
      focusTarget: config.focusTarget,
      gridReadonly: config.gridReadonly,
      selectable: config.selectable,
      sortEnabled: config.sortEnabled,
      get value() {
        return config.selectionControlled ? hostSelection() : undefined;
      },
      defaultValue: config.selectionValue ?? 0,
      onValueChange: (next) => {
        events.set("onValueChange", [...(events.get("onValueChange") ?? []), next]);
        if (config.selectionAccepts) {
          setHostSelection(next);
        }
      },
      get sortValue() {
        return config.sortControlled ? hostSort() : undefined;
      },
      defaultSortValue: config.sortValue ?? -1,
      onSortChange: (next) => {
        events.set("onValueChange", [...(events.get("onValueChange") ?? []), next]);
        if (config.sortAccepts) {
          setHostSort(next);
        }
      },
    });
    api = grid;

    createEffect(grid.focusTargetPart, (target) => {
      if (target !== null) {
        const element = root.querySelector<HTMLElement>(`[data-part="${target}"]`);
        if (element !== null && element !== document.activeElement) {
          element.focus();
        }
      } else if (root.contains(document.activeElement)) {
        (document.activeElement as HTMLElement).blur();
      }
    });

    return (
      <div data-part="grid" {...grid.gridProps}>
        {columns.map((col) => (
          <div data-part={`header:${col}`} {...grid.headerProps(col)} />
        ))}
        {grid.renderedRows().map((row) => (
          <div data-part={`row:${row}`} {...grid.rowProps(row)}>
            {columns.map((col) => (
              <div data-part={`cell:${row},${col}`} {...grid.cellProps(row, col)}>
                <span data-part={`cell:${row},${col}/widget`} {...grid.widgetProps(row, col)} />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }, root);

  const toggleSelection = (): void => {
    if (hostSelection() !== 0) {
      writeSelection(0);
      return;
    }
    const row = api?.row() ?? 0;
    const col = api?.col() ?? 0;
    writeSelection(packSelection(config.rows, config.cols, true, row, row, col, col));
  };

  const toggleSort = (): void => {
    const value = hostSort();
    if (value === -1) {
      writeSort(packSort(0, "ascending"));
      return;
    }
    const column = Math.floor(value / 2);
    writeSort(packSort(column, value % 2 === 1 ? "ascending" : "descending"));
  };

  return {
    root,
    events,
    setProp: (name, value) => {
      switch (name) {
        case "focus":
          api?.focus();
          break;
        case "gridKind":
        case "kind":
          if (value === "data" || value === "layout") {
            api?.setGridKind(value);
          }
          break;
        case "wrapCols":
          api?.setWrapCols(value === true);
          break;
        case "wrapRows":
          api?.setWrapRows(value === true);
          break;
        case "focusTarget":
          if (value === "cell" || value === "widget") {
            api?.setFocusTarget(value);
          }
          break;
        case "readonly":
        case "gridReadonly":
          api?.setGridReadonly(value === true);
          break;
        case "selectable":
          api?.setSelectable(value === true);
          break;
        case "sortEnabled":
          api?.setSortEnabled(value === true);
          break;
        case "setValue":
          if (config.selectionControlled) {
            writeSelection(Number(value));
          } else if (config.sortControlled) {
            writeSort(Number(value));
          }
          break;
        case "hostToggle":
          if (config.selectionControlled) {
            toggleSelection();
          } else if (config.sortControlled) {
            toggleSort();
          }
          break;
        default:
          throw new Error(`fixture has no prop ${name}`);
      }
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
