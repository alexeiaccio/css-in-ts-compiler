// The bar chart's conformance: the table is the data, the bars are backgrounds, and the legend is the header row. The tests
// read what a reader gets — a caption, a header per series, a cell per pair with its number and its header, and the widths
// the values ask for — and what the legend does to the table, not the stylesheet that draws it.
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { Bars, type BarsSeries } from "./bars.tsx";

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

const SERIES: ReadonlyArray<BarsSeries> = [
  { key: "eu", label: "eu-west" },
  { key: "us", label: "us-east" },
  { key: "ap", label: "ap-south" },
];
const CATEGORIES = ["Mon", "Tue"];
const VALUES = [
  [10, 40, 20],
  [20, 10, 40],
];

const headers = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="bars-series"]'),
];
const cells = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="bars-cell"]'),
];
const table = (root: HTMLElement): HTMLElement =>
  root.querySelector<HTMLElement>('[data-part="bars"]')!;
// the bar's width is a percentage of the cell, which is what `background-size` keeps; the padding beside it resolves to px
const share = (cell: HTMLElement): number =>
  Number.parseFloat(getComputedStyle(cell).backgroundSize);
const start = (cell: HTMLElement): number =>
  Number.parseFloat(getComputedStyle(cell).paddingInlineStart);

describe("Bars", () => {
  it("is a table: a caption, a legend per series, a cell per pair with its number", () => {
    const { root, dispose } = mount(() => (
      <Bars label="Requests by region" series={SERIES} categories={CATEGORIES} values={VALUES} />
    ));
    // the caption names the chart
    expect(root.querySelector("caption")?.textContent).toBe("Requests by region");
    // the header row is the legend: one named, checked box per series
    expect(headers(root).map((head) => head.textContent?.trim())).toEqual([
      "eu-west",
      "us-east",
      "ap-south",
    ]);
    for (const head of headers(root)) {
      expect(head.querySelector("input[type=checkbox]")).toHaveProperty("checked", true);
    }
    // one row header per category, one cell per pair, and the number is the cell's text
    expect(root.querySelectorAll('th[scope="row"]')).toHaveLength(2);
    expect(cells(root).map((cell) => cell.textContent?.trim())).toEqual([
      "10",
      "40",
      "20",
      "20",
      "10",
      "40",
    ]);
    // every cell is tied to its series' header, so a reader hears which series the number is
    const ids = headers(root).map((head) => head.id);
    expect(cells(root).map((cell) => cell.getAttribute("headers"))).toEqual([
      ids[0],
      ids[1],
      ids[2],
      ids[0],
      ids[1],
      ids[2],
    ]);
    dispose();
  });

  it("paints each bar as wide as its share of the scale, and starts the number where it ends", () => {
    const { root, dispose } = mount(() => (
      <Bars label="Requests" series={SERIES} categories={CATEGORIES} values={VALUES} />
    ));
    const [low, high, middle] = cells(root);
    // the scale is the data's largest value unless the page gives one
    expect(table(root).style.getPropertyValue("--max")).toBe("40");
    expect(share(high!)).toBe(100);
    expect(share(middle!)).toBe(50);
    expect(share(low!)).toBe(25);
    // a background, not an element: the bar is the cell's own paint
    expect(getComputedStyle(high!).backgroundImage).toContain("linear-gradient");
    // the number starts just past the bar, because the padding is the same share of the cell (plus the gap)
    expect(start(low!)).toBeCloseTo(
      (low!.getBoundingClientRect().width * share(low!)) / 100 + 5.6,
      0,
    );
    dispose();
  });

  it("takes the page's scale, its formatting and a missing value", () => {
    const { root, dispose } = mount(() => (
      <Bars
        label="Requests"
        series={SERIES}
        categories={CATEGORIES}
        values={[
          [10, 20, 40],
          [20, 10],
        ]}
        max={80}
        format={(value) => `${value} req`}
      />
    ));
    expect(table(root).style.getPropertyValue("--max")).toBe("80");
    expect(cells(root)[0]?.textContent?.trim()).toBe("10 req");
    // a missing number is an empty cell, not a zero the page never gave
    expect(cells(root)[5]?.textContent?.trim()).toBe("");
    expect(cells(root)[5]?.style.getPropertyValue("--v")).toBe("0");
    // the page's scale is what the bar is a share of
    expect(share(cells(root)[0]!)).toBe(12.5);
    dispose();
  });

  it("hides a series in the table itself when its legend box is unchecked", async () => {
    const { root, dispose } = mount(() => (
      <Bars label="Requests" series={SERIES} categories={CATEGORIES} values={VALUES} />
    ));
    const us = headers(root)[1]!;
    const box = us.querySelector<HTMLInputElement>("input[type=checkbox]")!;
    await userEvent.click(box);

    // the header leaves the table with its column: no empty cells are left lying to a reader
    expect(us.hidden).toBe(true);
    expect(box.checked).toBe(false);
    const gone = cells(root).filter((cell) => cell.dataset["series"] === "us");
    expect(gone).toHaveLength(2);
    for (const cell of gone) {
      expect(cell.hidden).toBe(true);
    }
    // the telling cells stay, with their numbers and their own headers
    const stays = cells(root).filter((cell) => cell.dataset["series"] === "eu");
    expect(stays.every((cell) => !cell.hidden)).toBe(true);
    expect(stays.map((cell) => cell.textContent?.trim())).toEqual(["10", "20"]);

    // a series the page starts hidden is not in the table either
    const other = mount(() => (
      <Bars
        label="Requests"
        series={SERIES}
        categories={CATEGORIES}
        values={VALUES}
        hidden={["ap"]}
      />
    ));
    expect(headers(other.root)[2]?.hidden).toBe(true);
    expect(cells(other.root).filter((cell) => cell.hidden)).toHaveLength(2);
    other.dispose();
    dispose();
  });

  it("reads the hidden set from the page when the page owns it", async () => {
    const [hidden, setHidden] = createSignal<ReadonlyArray<string>>([]);
    const { root, dispose } = mount(() => (
      <Bars
        label="Requests"
        series={SERIES}
        categories={CATEGORIES}
        values={VALUES}
        hidden={hidden()}
        onHiddenChange={setHidden}
      />
    ));
    await userEvent.click(headers(root)[0]!.querySelector("input[type=checkbox]")!);
    // the page's signal is the one that moved, and the table followed it
    expect(hidden()).toEqual(["eu"]);
    expect(headers(root)[0]?.hidden).toBe(true);
    expect(
      cells(root)
        .filter((cell) => cell.dataset["series"] === "eu")
        .every((c) => c.hidden),
    ).toBe(true);
    dispose();
  });

  it("keeps a long number inside the plot and wraps a long name", () => {
    const { root, dispose } = mount(() => (
      <Bars
        label="Requests"
        series={SERIES}
        categories={["a category with a long name"]}
        values={[[40, 40, 40]]}
      />
    ));
    const cell = cells(root)[0]!;
    // the bar may run under a long label, but the label never starts past the cell:
    // `min()` caps the padding, so no part of the value is clipped
    expect(start(cell)).toBeLessThan(cell.getBoundingClientRect().width);
    expect(getComputedStyle(cell).overflowWrap).toBe("anywhere");
    const name = root.querySelector<HTMLElement>('th[scope="row"]')!;
    expect(getComputedStyle(name).overflowWrap).toBe("anywhere");
    expect(name.textContent).toBe("a category with a long name");
    dispose();
  });
});
