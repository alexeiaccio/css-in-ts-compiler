import { createSignal } from "solid-js";
import { render } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";
import type { TableColumn, TableSelectionMode, TableSort } from "@cssints/headless";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableScroll,
} from "./table.tsx";

// Solid 2 delivers events through its delegated listener on a later turn.
const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

const COLUMNS: ReadonlyArray<TableColumn> = [
  { key: "title", abbr: "Title" },
  { key: "owner", sortable: false },
  { key: "count", numeric: true },
];

/** The sort and the selection are controlled, so the test sees exactly the state the primitive announces. */
const mountTable = (
  options: { selection?: TableSelectionMode; rows?: ReadonlyArray<string> } = {},
) => {
  const root = document.createElement("div");
  document.body.append(root);
  const [rows, setRows] = createSignal<ReadonlyArray<string>>(options.rows ?? ["a", "b", "c"]);
  // `null` is "controlled and unsorted"; `undefined` would mean "uncontrolled" to the primitive
  const [sort, setSort] = createSignal<TableSort | null>(null);
  const [selected, setSelected] = createSignal<ReadonlyArray<string>>([]);
  const dispose = render(
    () => (
      <TableScroll>
        <Table
          columns={COLUMNS}
          rows={() => rows()}
          selection={options.selection ?? "multiple"}
          sort={sort()}
          onSortChange={(next) => setSort(next ?? null)}
          selected={selected()}
          onSelectionChange={setSelected}
          caption="Issues"
          labels={{ selectRow: (id) => `Choose ${id}` }}
        >
          <TableHead>
            {COLUMNS.map((column) => (
              <TableHeaderCell column={column.key}>{column.key}</TableHeaderCell>
            ))}
          </TableHead>
          <TableBody>
            {rows().map((id) => (
              <TableRow row={id}>
                {COLUMNS.map((column) => (
                  <TableCell column={column.key}>{`${id}-${column.key}`}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScroll>
    ),
    root,
  );
  return {
    root,
    rows: setRows,
    selected,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

const headerCell = (root: HTMLElement, key: string): HTMLElement | null =>
  [...root.querySelectorAll<HTMLElement>("th")].find((th) =>
    th.textContent?.trim().startsWith(key),
  ) ?? null;
const arrow = (root: HTMLElement, key: string): HTMLElement | null =>
  headerCell(root, key)?.querySelector<HTMLElement>('[data-part="table-sort-arrow"]') ?? null;
const row = (root: HTMLElement, id: string): HTMLElement | null =>
  [...root.querySelectorAll<HTMLElement>("tbody td")]
    .find((cell) => cell.textContent === `${id}-title`)
    ?.closest("tr") ?? null;
const rowCheckbox = (root: HTMLElement, id: string): HTMLElement | null =>
  row(root, id)?.querySelector<HTMLElement>('[data-part="table-row-checkbox"]') ?? null;
const selectAll = (root: HTMLElement): HTMLElement | null =>
  root.querySelector<HTMLElement>('[data-part="table-select-all"]');

describe("Table skin", () => {
  it("flips aria-sort on a header click and repaints the arrow from it", async () => {
    const { root, dispose } = mountTable();
    const title = headerCell(root, "title");
    expect(title?.getAttribute("aria-sort")).toBeNull();
    expect(getComputedStyle(arrow(root, "title") as HTMLElement).visibility).toBe("hidden");

    const button = title?.querySelector<HTMLElement>('[data-part="table-sort"]');
    button?.click();
    await tick();
    expect(headerCell(root, "title")?.getAttribute("aria-sort")).toBe("ascending");
    expect(getComputedStyle(arrow(root, "title") as HTMLElement).visibility).toBe("visible");
    expect(getComputedStyle(arrow(root, "title") as HTMLElement).transform).toBe("none");

    button?.click();
    await tick();
    expect(headerCell(root, "title")?.getAttribute("aria-sort")).toBe("descending");
    // the same glyph, turned over
    expect(getComputedStyle(arrow(root, "title") as HTMLElement).transform).not.toBe("none");

    button?.click();
    await tick();
    expect(headerCell(root, "title")?.getAttribute("aria-sort")).toBeNull();
    expect(getComputedStyle(arrow(root, "title") as HTMLElement).visibility).toBe("hidden");

    // a column that does not sort has no button and no arrow at all
    const owner = [...root.querySelectorAll<HTMLElement>("th")].find(
      (th) => th.textContent?.trim() === "owner",
    );
    expect(owner?.querySelector('[data-part="table-sort"]')).toBeNull();
    expect(owner?.hasAttribute("aria-sort")).toBe(false);
    dispose();
  });

  it("toggles a row's aria-selected from its control, and paints the row from it", async () => {
    const { root, selected, dispose } = mountTable();
    expect(row(root, "a")?.getAttribute("aria-selected")).toBe("false");
    const plain = getComputedStyle(row(root, "a") as HTMLElement).backgroundColor;

    rowCheckbox(root, "a")?.click();
    await tick();
    expect(selected()).toEqual(["a"]);
    expect(row(root, "a")?.getAttribute("aria-selected")).toBe("true");
    expect(rowCheckbox(root, "a")?.getAttribute("aria-checked")).toBe("true");
    expect(getComputedStyle(row(root, "a") as HTMLElement).backgroundColor).not.toBe(plain);

    // a second click on the row itself is the primitive's own toggle, not a second gesture
    row(root, "a")?.click();
    await tick();
    expect(row(root, "a")?.getAttribute("aria-selected")).toBe("false");
    dispose();
  });

  it("keeps the select-all in step with the rows it renders, and only those", async () => {
    const { root, rows, selected, dispose } = mountTable({ rows: ["a", "b", "c"] });
    expect(selectAll(root)?.getAttribute("aria-checked")).toBe("false");

    rowCheckbox(root, "a")?.click();
    await tick();
    expect(selectAll(root)?.getAttribute("aria-checked")).toBe("mixed");

    // page 2: none of its rows is selected, though `a` still is
    rows(["d", "e"]);
    await tick();
    expect(selectAll(root)?.getAttribute("aria-checked")).toBe("false");

    // back on page 1 the mixed state is back, and the control selects the rendered window only
    rows(["a", "b", "c"]);
    await tick();
    expect(selectAll(root)?.getAttribute("aria-checked")).toBe("mixed");
    selectAll(root)?.click();
    await tick();
    expect(selectAll(root)?.getAttribute("aria-checked")).toBe("true");
    expect([...selected()].sort()).toEqual(["a", "b", "c"]);

    rows(["d", "e"]);
    await tick();
    expect(selectAll(root)?.getAttribute("aria-checked")).toBe("false");
    dispose();
  });

  it("keeps a cell in front of the row in single selection too, so the columns stay lined up", () => {
    const { root, dispose } = mountTable({ selection: "single" });
    // one control per row and no select-all: one control over one selection is meaningless
    expect(root.querySelector('[data-part="table-select-all"]')).toBeNull();
    const headerCells = root.querySelectorAll("thead th").length;
    const bodyCells = row(root, "a")?.querySelectorAll("td").length;
    expect(headerCells).toBe(COLUMNS.length + 1);
    expect(bodyCells).toBe(COLUMNS.length + 1);
    dispose();
  });

  it("right-aligns a numeric column from the layout hint, and names the select-all", () => {
    const { root, dispose } = mountTable();
    const numeric = [...root.querySelectorAll<HTMLElement>("tbody td")].find(
      (cell) => cell.textContent === "a-count",
    );
    expect(numeric?.hasAttribute("data-numeric")).toBe(true);
    expect(getComputedStyle(numeric as HTMLElement).textAlign).toBe("end");
    expect(selectAll(root)?.getAttribute("aria-label")).toBe("Select all rows");
    expect(root.querySelector("caption")?.textContent).toBe("Issues");
    dispose();
  });
});
