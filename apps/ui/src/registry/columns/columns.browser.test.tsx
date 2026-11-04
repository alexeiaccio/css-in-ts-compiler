// The column chart's conformance, to the checklist the charts epic is held to: the chart is a named figure over a list of
// names and values a reader hears in order, every value is text (not a tooltip), a truncated name is not a lost name, and the
// bar heights are the values' shares. The tests read the DOM and the computed boxes; none of them needs a pointer.
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";

import { Columns, type ColumnPoint } from "./columns.tsx";

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

const POINTS: ReadonlyArray<ColumnPoint> = [
  { label: "Mon", value: 10 },
  { label: "Tue", value: 40 },
  { label: "Wed", value: 20 },
];

const list = (root: HTMLElement): HTMLElement =>
  root.querySelector<HTMLElement>('[data-part="columns"]')!;
const bars = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="columns-bar"]'),
];
const fill = (bar: HTMLElement): HTMLElement =>
  bar.querySelector<HTMLElement>('[data-part="columns-fill"]')!;

describe("Columns", () => {
  it("is a named figure over a list of names and their values, in reading order", () => {
    const { root, dispose } = mount(() => <Columns label="Issues by day" points={POINTS} />);
    expect(root.querySelector("figcaption")?.textContent).toBe("Issues by day");
    const rows = bars(root);
    expect(rows).toHaveLength(3);
    // the name comes before its value for a reader, whatever the eye sees
    expect(rows.map((row) => row.textContent?.trim())).toEqual(["Mon10", "Tue40", "Wed20"]);
    // the value is text, not a tooltip: it is there before any pointer
    expect(rows[1]?.querySelector('[data-part="columns-value"]')?.textContent).toBe("40");
    dispose();
  });

  it("sizes each bar by its value, under a scale the data or the page sets", () => {
    const { root, dispose } = mount(() => <Columns label="Issues" points={POINTS} />);
    const heights = bars(root).map((row) => fill(row).getBoundingClientRect().height);
    // 10 / 40 / 20 of 40: the second bar is the tallest, and the first is a quarter of it
    expect(heights[1]!).toBeGreaterThan(heights[2]!);
    expect(heights[2]!).toBeGreaterThan(heights[0]!);
    expect(heights[0]! / heights[1]!).toBeCloseTo(0.25, 1);
    expect(list(root).style.getPropertyValue("--max")).toBe("40");
    // the tallest bar leaves room for its own number: the value never sits outside the plot
    const plot = bars(root)[1]!.querySelector<HTMLElement>('[data-part="columns-plot"]')!;
    expect(fill(bars(root)[1]!).getBoundingClientRect().height).toBeLessThan(
      plot.getBoundingClientRect().height,
    );
    dispose();
  });

  it("takes the page's scale and the page's formatting", () => {
    const { root, dispose } = mount(() => (
      <Columns label="Issues" points={POINTS} max={80} format={(value) => `${value} open`} />
    ));
    expect(list(root).style.getPropertyValue("--max")).toBe("80");
    expect(bars(root)[1]?.querySelector('[data-part="columns-value"]')?.textContent).toBe(
      "40 open",
    );
    // half the scale, so half the room the tallest bar could take
    const plot = bars(root)[1]!.querySelector<HTMLElement>('[data-part="columns-plot"]')!;
    const ratio =
      fill(bars(root)[1]!).getBoundingClientRect().height / plot.getBoundingClientRect().height;
    expect(ratio).toBeLessThan(0.6);
    dispose();
  });

  it("keeps a flat chart standing, and a name wraps instead of being clipped", () => {
    const { root, dispose } = mount(() => (
      <Columns
        label="Pods"
        points={[
          { label: "eu-west with a long name", value: 3 },
          { label: "us", value: 3 },
        ]}
      />
    ));
    const [first, second] = bars(root);
    expect(fill(first!).getBoundingClientRect().height).toBeGreaterThan(0);
    expect(fill(first!).getBoundingClientRect().height).toBe(
      fill(second!).getBoundingClientRect().height,
    );
    // the scale is invented for a flat chart, so the bars do not divide by zero
    expect(list(root).style.getPropertyValue("--max")).toBe("3");
    const name = first!.querySelector<HTMLElement>('[data-part="columns-label"]');
    expect(getComputedStyle(name!).overflowWrap).toBe("anywhere");
    expect(name?.textContent).toBe("eu-west with a long name");
    dispose();
  });
});
