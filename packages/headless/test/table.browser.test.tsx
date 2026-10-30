import {
  type Table,
  type TableColumn,
  type TableOptions,
  type TableSort,
  createTable,
} from "../src/table";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vite-plus/test";
import { render } from "@solidjs/web";
import { userEvent } from "vite-plus/test/browser";

// Solid 2 delivers events through its delegated listener on a later turn.
const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

const COLUMNS: ReadonlyArray<TableColumn> = [
  { key: "title", abbr: "Title" },
  { key: "status", sortable: false },
  { key: "count", numeric: true },
];
const ROWS: ReadonlyArray<string> = ["a", "b", "c"];

/**
 * `free` is uncontrolled; `accept` is a controlled host that writes every
 * request back; `hold` is a controlled host that ignores them.
 */
type Host = "free" | "accept" | "hold";

/** Renders the primitive as a real `<table>`: a caption, a header row, body rows. */
const mount = (options: Partial<TableOptions>, host: Host = "free") => {
  const root = document.createElement("div");
  document.body.append(root);
  const requests: {
    sort: (TableSort | undefined)[];
    selected: ReadonlyArray<string>[];
  } = { sort: [], selected: [] };
  const [hostSort, setHostSort] = createSignal<TableSort | null>(options.defaultSort ?? null);
  const [hostSelected, setHostSelected] = createSignal<ReadonlyArray<string>>(
    options.defaultSelected ?? [],
  );
  let api: Table | undefined;

  const dispose = render(() => {
    const columns = options.columns ?? COLUMNS;
    const rows = options.rows ?? ROWS;
    const table = createTable({
      columns,
      rows,
      ...options,
      get sort() {
        return host === "free" ? undefined : hostSort();
      },
      get selected() {
        return host === "free" ? undefined : hostSelected();
      },
      onSortChange: (next) => {
        requests.sort.push(next);
        if (host === "accept") {
          setHostSort(next ?? null);
        }
      },
      onSelectionChange: (next) => {
        requests.selected.push([...next]);
        if (host === "accept") {
          setHostSelected(next);
        }
      },
    });
    api = table;
    const selectAll = table.selectAllProps;

    return (
      <table data-table {...table.tableProps}>
        <caption {...table.captionProps}>Issues</caption>
        <thead>
          <tr>
            {selectAll === undefined ? null : (
              <th>
                <span data-part="select-all" {...selectAll} />
              </th>
            )}
            {columns.map((column) => {
              const button = table.headerButtonProps(column.key);
              return (
                <th data-col={column.key} {...table.headerCellProps(column.key)}>
                  {button === undefined ? (
                    column.key
                  ) : (
                    <button data-part={`header:${column.key}`} {...button}>
                      {column.key}
                    </button>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((id) => {
            const checkbox = table.rowCheckboxProps(id);
            return (
              <tr data-row={id} {...table.rowProps(id)}>
                {checkbox === undefined ? null : (
                  <td>
                    <span data-part={`checkbox:${id}`} {...checkbox} />
                  </td>
                )}
                {columns.map((column) => (
                  <td data-cell={`${id}:${column.key}`} {...table.cellProps(id, column.key)}>
                    {`${id}-${column.key}`}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }, root);

  return {
    root,
    requests,
    table: (): Table => {
      if (api === undefined) {
        throw new Error("not mounted");
      }
      return api;
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

const part = (root: HTMLElement, name: string): HTMLElement | null =>
  root.querySelector<HTMLElement>(`[data-part="${name}"]`);
const headerCell = (root: HTMLElement, key: string): HTMLElement | null =>
  root.querySelector<HTMLElement>(`th[data-col="${key}"]`);
const row = (root: HTMLElement, id: string): HTMLElement | null =>
  root.querySelector<HTMLElement>(`tr[data-row="${id}"]`);
const sorted = (root: HTMLElement): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>("thead th")].filter((th) => th.hasAttribute("aria-sort"));
const selectedRows = (root: HTMLElement): string[] =>
  [...root.querySelectorAll<HTMLElement>('tbody tr[aria-selected="true"]')].map(
    (tr) => tr.dataset.row ?? "",
  );

describe("createTable sorting", () => {
  it("names the table, gives the caption an id, and marks only the sorted column", () => {
    const { root, dispose } = mount({
      id: "issues",
      labels: { table: "Open issues" },
      defaultSort: { key: "title", direction: "ascending" },
    });
    const table = root.querySelector("table");
    expect(table?.getAttribute("aria-label")).toBe("Open issues");
    expect(table?.getAttribute("role")).toBeNull();
    expect(root.querySelector("caption")?.id).toBe("issues-caption");

    const marked = sorted(root);
    expect(marked.length).toBe(1);
    expect(marked[0]?.dataset.col).toBe("title");
    expect(marked[0]?.getAttribute("aria-sort")).toBe("ascending");
    expect(headerCell(root, "title")?.getAttribute("scope")).toBe("col");
    expect(headerCell(root, "title")?.getAttribute("abbr")).toBe("Title");
    expect(headerCell(root, "status")?.hasAttribute("aria-sort")).toBe(false);
    dispose();
  });

  it("cycles ascending, descending, unsorted, ascending (tri-state, the default)", async () => {
    const { root, table, dispose } = mount({
      defaultSort: { key: "title", direction: "ascending" },
    });
    const button = part(root, "header:title");
    expect(button).not.toBeNull();

    button?.click();
    await tick();
    expect(table().sort()).toEqual({ key: "title", direction: "descending" });
    expect(headerCell(root, "title")?.getAttribute("aria-sort")).toBe("descending");

    button?.click();
    await tick();
    expect(table().sort()).toBeUndefined();
    expect(sorted(root)).toEqual([]);

    button?.click();
    await tick();
    expect(table().sort()).toEqual({ key: "title", direction: "ascending" });
    dispose();
  });

  it("never returns to unsorted when sortCycle is toggle", async () => {
    const { root, table, dispose } = mount({
      sortCycle: "toggle",
      defaultSort: { key: "title", direction: "ascending" },
    });
    part(root, "header:title")?.click();
    await tick();
    expect(table().sort()).toEqual({ key: "title", direction: "descending" });
    part(root, "header:title")?.click();
    await tick();
    expect(table().sort()).toEqual({ key: "title", direction: "ascending" });
    dispose();
  });

  it("sorts a new column ascending and keeps one sorted column", async () => {
    const { root, table, dispose } = mount({
      defaultSort: { key: "title", direction: "descending" },
    });
    part(root, "header:count")?.click();
    await tick();
    expect(table().sort()).toEqual({ key: "count", direction: "ascending" });
    const marked = sorted(root);
    expect(marked.map((th) => th.dataset.col)).toEqual(["count"]);
    dispose();
  });

  it("leaves a non-sortable header inert: no button, no aria-sort", async () => {
    const { root, table, dispose } = mount({
      defaultSort: { key: "title", direction: "ascending" },
    });
    expect(part(root, "header:status")).toBeNull();
    expect(headerCell(root, "status")?.getAttribute("scope")).toBe("col");
    expect(headerCell(root, "status")?.hasAttribute("aria-sort")).toBe(false);
    headerCell(root, "status")?.click();
    await tick();
    expect(table().sort()).toEqual({ key: "title", direction: "ascending" });
    dispose();
  });

  it("activates the header button from the keyboard", async () => {
    const { root, table, dispose } = mount({
      defaultSort: { key: "title", direction: "ascending" },
    });
    const button = part(root, "header:title");
    expect(button?.getAttribute("type")).toBe("button");
    button?.focus();
    await userEvent.keyboard("{Enter}");
    await tick();
    expect(table().sort()).toEqual({ key: "title", direction: "descending" });

    await userEvent.keyboard(" ");
    await tick();
    expect(table().sort()).toBeUndefined();
    dispose();
  });

  it("announces nothing extra unless the host windows its rows or columns", () => {
    const plain = mount({});
    expect(plain.root.querySelector("table")?.hasAttribute("aria-rowcount")).toBe(false);
    expect(plain.root.querySelector("table")?.hasAttribute("aria-colcount")).toBe(false);
    expect(plain.root.querySelector('[data-cell="a:title"]')?.hasAttribute("aria-colindex")).toBe(
      false,
    );
    plain.dispose();

    const windowed = mount({ rows: ["a", "b"], rowCount: 200, columnCount: 9 });
    const table = windowed.root.querySelector("table");
    expect(table?.getAttribute("aria-rowcount")).toBe("200");
    expect(table?.getAttribute("aria-colcount")).toBe("9");
    expect(
      windowed.root.querySelector('[data-cell="a:title"]')?.getAttribute("aria-colindex"),
    ).toBe("1");
    windowed.dispose();
  });
});

describe("createTable selection", () => {
  it("selects no row when selection is none, and offers no control", async () => {
    const { root, table, dispose } = mount({});
    expect(part(root, "select-all")).toBeNull();
    expect(part(root, "checkbox:a")).toBeNull();
    row(root, "a")?.click();
    await tick();
    expect(table().selected()).toEqual([]);
    expect(row(root, "a")?.hasAttribute("aria-selected")).toBe(false);
    dispose();
  });

  it("keeps one row at a time in single selection", async () => {
    const { root, table, dispose } = mount({ selection: "single" });
    expect(part(root, "select-all")).toBeNull(); // one control for one selection is meaningless

    row(root, "a")?.click();
    await tick();
    expect(row(root, "a")?.getAttribute("aria-selected")).toBe("true");
    expect(selectedRows(root)).toEqual(["a"]);

    row(root, "b")?.click();
    await tick();
    expect(selectedRows(root)).toEqual(["b"]);
    expect(part(root, "checkbox:a")?.getAttribute("aria-checked")).toBe("false");

    row(root, "b")?.click();
    await tick();
    expect(table().selected()).toEqual([]);
    dispose();
  });

  it("toggles rows independently in multiple selection, and the row control does not double-toggle", async () => {
    const { root, requests, table, dispose } = mount({ selection: "multiple" });

    part(root, "checkbox:a")?.click();
    await tick();
    expect(table().selected()).toEqual(["a"]); // the click did not also reach the row
    expect(requests.selected).toEqual([["a"]]);

    part(root, "checkbox:c")?.click();
    await tick();
    expect(table().selected()).toEqual(["a", "c"]);
    expect(selectedRows(root)).toEqual(["a", "c"]);
    expect(part(root, "checkbox:a")?.getAttribute("aria-checked")).toBe("true");

    part(root, "checkbox:a")?.click();
    await tick();
    expect(table().selected()).toEqual(["c"]);
    dispose();
  });

  it("shows the mixed select-all state and clears the whole window", async () => {
    const { root, table, dispose } = mount({ selection: "multiple" });
    const selectAll = part(root, "select-all");
    expect(selectAll?.getAttribute("role")).toBe("checkbox");
    expect(selectAll?.getAttribute("aria-checked")).toBe("false");
    expect(selectAll?.getAttribute("aria-label")).toBe("Select all rows");

    part(root, "checkbox:b")?.click();
    await tick();
    expect(selectAll?.getAttribute("aria-checked")).toBe("mixed");

    selectAll?.click();
    await tick();
    expect(selectAll?.getAttribute("aria-checked")).toBe("true");
    expect(table().selected()).toEqual(["b", "a", "c"]);

    selectAll?.click();
    await tick();
    expect(selectAll?.getAttribute("aria-checked")).toBe("false");
    expect(table().selected()).toEqual([]);
    dispose();
  });

  it("toggles the row control with Space and names it for the screen reader", async () => {
    const { root, table, dispose } = mount({
      selection: "multiple",
      labels: { selectRow: (id) => `Choose ${id}` },
    });
    const checkbox = part(root, "checkbox:a");
    expect(checkbox?.getAttribute("aria-label")).toBe("Choose a");
    checkbox?.focus();
    await userEvent.keyboard(" ");
    await tick();
    expect(table().selected()).toEqual(["a"]);
    await userEvent.keyboard("{Enter}");
    await tick();
    expect(table().selected()).toEqual([]);
    dispose();
  });
});

describe("createTable controlled", () => {
  it("holds a sort the host did not write back", async () => {
    const { root, table, requests, dispose } = mount(
      { defaultSort: { key: "title", direction: "ascending" } },
      "hold",
    );
    part(root, "header:title")?.click();
    await tick();
    expect(requests.sort).toEqual([{ key: "title", direction: "descending" }]);
    expect(table().sort()).toEqual({ key: "title", direction: "ascending" });
    expect(headerCell(root, "title")?.getAttribute("aria-sort")).toBe("ascending");
    dispose();
  });

  it("commits a sort through the controlled prop only", async () => {
    const { root, table, dispose } = mount(
      { defaultSort: { key: "title", direction: "ascending" } },
      "accept",
    );
    part(root, "header:title")?.click();
    await tick();
    expect(table().sort()).toEqual({ key: "title", direction: "descending" });
    expect(headerCell(root, "title")?.getAttribute("aria-sort")).toBe("descending");
    dispose();
  });

  it("holds a selection the host did not write back", async () => {
    const { root, table, requests, dispose } = mount(
      { selection: "multiple", defaultSelected: ["a"] },
      "hold",
    );
    part(root, "checkbox:b")?.click();
    await tick();
    expect(requests.selected).toEqual([["a", "b"]]);
    expect(table().selected()).toEqual(["a"]);
    expect(selectedRows(root)).toEqual(["a"]);
    dispose();
  });
});
