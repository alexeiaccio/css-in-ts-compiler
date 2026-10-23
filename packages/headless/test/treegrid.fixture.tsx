import { type Treegrid, createTreegrid } from "../src/treegrid";
import { createEffect, createSignal } from "solid-js";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./dom-driver";
import type { TreegridConfig } from "@cssints/apg-specs/apg/treegrid.bridge";
import { render } from "@solidjs/web";

/**
 * Renders `createTreegrid` as rows/cells/expanders and exposes the `Mounted` the
 * DOM driver needs. Controlled, the fixture is the host: it keeps the selected
 * rows in a signal, passes them as `value`, and either writes every request back
 * (`accepts`) or ignores it.
 */
export const mountTreegrid = (config: TreegridConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [host, setHost] = createSignal<ReadonlyArray<number>>(config.selected);
  let api: Treegrid | undefined;

  const writeHost = (next: ReadonlyArray<number>): void => {
    if (config.controlled) {
      setHost([...next].sort((a, b) => a - b));
    }
  };

  const dispose = render(() => {
    const grid = createTreegrid({
      nav: config.nav,
      selection: config.selection,
      defaultValue: config.selected,
      get value() {
        return config.controlled ? host() : undefined;
      },
      onValueChange: (selected) => {
        events.set("onSelectionChange", [
          ...(events.get("onSelectionChange") ?? []),
          [...selected],
        ]);
        if (config.accepts) {
          setHost([...selected].sort((a, b) => a - b));
        }
      },
    });
    api = grid;
    const columns = Array.from({ length: grid.cols() }, (_, index) => index);
    const rows = Array.from({ length: grid.rows() }, (_, index) => index);

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
        {rows.map((row) => (
          <div data-part={`row:${row}`} {...grid.rowProps(row)}>
            {columns.map((col) => (
              <div data-part={`cell:${row},${col}`} {...grid.cellProps(row, col)}>
                {col === 0 && grid.hasChildren(row) ? (
                  <span data-part={`row:${row}/expander`} {...grid.expanderProps(row)} />
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }, root);

  return {
    root,
    events,
    setProp: (name, value) => {
      switch (name) {
        case "focus":
          api?.focus();
          break;
        case "nav":
        case "navModel":
          if (value === "rowsFirst" || value === "cellsFirst" || value === "cellsOnly") {
            api?.configureNav(value);
          }
          break;
        case "selection":
        case "selMode":
          if (value === "single" || value === "multi") {
            api?.configureSelection(value);
          }
          break;
        case "selected":
        case "setValue":
          if (Array.isArray(value)) {
            writeHost(value.map(Number));
          } else {
            throw new Error(`selected needs an array, got ${JSON.stringify(value)}`);
          }
          break;
        case "hostToggle":
          writeHost(host().includes(0) ? host().filter((row) => row !== 0) : [...host(), 0]);
          break;
        default:
          throw new Error(`fixture has no prop ${name}`);
      }
    },
    focus: () => api?.focusTargetPart() ?? null,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
