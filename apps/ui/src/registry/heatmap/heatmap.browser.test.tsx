// The heatmap's conformance: the table is the data and the colour is CSS. The tests read what a reader gets — a header per
// column, a label per row, one cell per pair with its number, a colour that follows the value, and the scale in words — not
// the stylesheet that produced it.
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { Heatmap, type HeatmapRow } from "./heatmap.tsx";

const mount = (element: () => JSX.Element) => {
  const root = document.createElement("div");
  document.body.append(root);
  const dispose = render(element, root);
  return {
    root,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

const ROWS: ReadonlyArray<HeatmapRow> = [
  { label: "Mon", values: [0, 4, 8] },
  { label: "Tue", values: [2, 6, 1] },
];
const COLUMNS = ["08", "09", "10"];

const table = (root: HTMLElement): HTMLElement =>
  root.querySelector<HTMLElement>('[data-part="heatmap"]')!;
const cells = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="heatmap-cell"]'),
];

describe("Heatmap", () => {
  it("is a table: a header per column, a label per row and a cell per pair", () => {
    const { root, dispose } = mount(() => (
      <Heatmap label="Deploys by hour" columns={COLUMNS} rows={ROWS} unit="deploys" />
    ));
    expect(root.querySelectorAll('th[scope="col"]')).toHaveLength(3);
    expect(root.querySelectorAll('th[scope="row"]')).toHaveLength(2);
    expect(cells(root)).toHaveLength(6);
    // the caption names the table and says what the numbers are
    expect(root.querySelector("caption")?.textContent).toBe("Deploys by hour, in deploys");
    // every value is the cell's text, so a reader hears it
    expect(cells(root).map((cell) => cell.textContent?.trim())).toEqual([
      "0",
      "4",
      "8",
      "2",
      "6",
      "1",
    ]);
    dispose();
  });

  it("colours a cell by its share of the scale, and keeps the scale on the table", () => {
    const { root, dispose } = mount(() => (
      <Heatmap label="Deploys" columns={COLUMNS} rows={ROWS} />
    ));
    const [first, , last] = cells(root);
    // the scale is the data's unless the page gives one
    expect(table(root).style.getPropertyValue("--max")).toBe("8");
    expect(table(root).style.getPropertyValue("--min")).toBe("0");
    // a bigger share is a different colour: the mix is the value's
    const low = getComputedStyle(first!).backgroundColor;
    const high = getComputedStyle(last!).backgroundColor;
    expect(low).not.toBe(high);
    dispose();
  });

  it("shows a cell's value on hover, over the square and without moving the grid", async () => {
    const { root, dispose } = mount(() => (
      <Heatmap label="Deploys" columns={COLUMNS} rows={ROWS} />
    ));
    const cell = cells(root)[1]!;
    const value = cell.querySelector<HTMLElement>("span")!;
    expect(getComputedStyle(value).fontSize).toBe("0px");
    await userEvent.hover(cell);
    expect(getComputedStyle(value).fontSize).not.toBe("0px");
    // the square is the grid item either way: the label's box does not change
    expect(cell.getBoundingClientRect().width).toBeGreaterThan(0);
    dispose();
  });

  it("shows every number without a pointer, from its own toggle", async () => {
    const { root, dispose } = mount(() => (
      <Heatmap label="Deploys" columns={COLUMNS} rows={ROWS} />
    ));
    const toggle = root.querySelector<HTMLButtonElement>('[data-part="heatmap-toggle"]')!;
    const cell = cells(root)[1]!;
    const value = cell.querySelector<HTMLElement>("span")!;

    // the colours first: the value is out of the way, and the button says what pressing it does
    expect(toggle.textContent?.trim()).toBe("Show the numbers");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(getComputedStyle(value).fontSize).toBe("0px");
    expect(getComputedStyle(cell).aspectRatio).toBe("1 / 1");

    toggle.click();
    // the same table, read: every number in place, the squares grown to their rows
    await Promise.resolve();
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(toggle.textContent?.trim()).toBe("Show the colours");
    expect(getComputedStyle(value).fontSize).not.toBe("0px");
    expect(getComputedStyle(value).position).toBe("static");
    expect(getComputedStyle(cell).aspectRatio).toBe("auto");
    expect(cell.textContent?.trim()).toBe("4");
    dispose();
  });

  it("reads an empty cell as empty and puts the scale in words", () => {
    const { root, dispose } = mount(() => (
      <Heatmap
        label="Deploys"
        unit="deploys"
        columns={COLUMNS}
        rows={[
          { label: "Mon", values: [1, 2, 3] },
          { label: "Tue", values: [1, 2, 3] },
        ]}
        max={6}
      />
    ));
    expect(root.querySelector('[data-part="heatmap-scale"]')?.textContent).toBe(
      "0 to 6 deploys; darker is more.",
    );
    // the empty cell: no value, so no text and no colour of the scale
    const { root: other, dispose: stop } = mount(() => (
      <Heatmap label="Deploys" columns={["08", "09"]} rows={[{ label: "Mon", values: [1] }]} />
    ));
    const empty = cells(other)[1]!;
    expect(empty.textContent?.trim()).toBe("");
    expect(empty.style.getPropertyValue("--v")).toBe("0");
    dispose();
    stop();
  });
});
