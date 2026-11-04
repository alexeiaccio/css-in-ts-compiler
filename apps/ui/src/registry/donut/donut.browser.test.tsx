// The donut's conformance, to the charts epic's accessibility checklist: the list is the data and reads as "name, share", the
// ring is the items' decoration, every share is text, the caption names the figure, and a hover lifts the ring without moving
// the page. The tests read the DOM and the computed pseudo-elements; only the hover one needs a pointer.
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { Donut, type DonutSlice } from "./donut.tsx";

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

const SLICES: ReadonlyArray<DonutSlice> = [
  { label: "Europe", value: 38 },
  { label: "North America", value: 31 },
  { label: "Asia", value: 18 },
  { label: "South America", value: 8 },
  { label: "Oceania", value: 5 },
];

const slices = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="donut-slice"]'),
];
const band = (slice: HTMLElement): { from: number; to: number } => ({
  from: Number.parseFloat(slice.style.getPropertyValue("--from")),
  to: Number.parseFloat(slice.style.getPropertyValue("--to")),
});
const ring = (slice: HTMLElement): CSSStyleDeclaration => getComputedStyle(slice, "::before");

describe("Donut", () => {
  it("is a named figure over one item per slice, its name and its share in text", () => {
    const { root, dispose } = mount(() => <Donut label="Traffic by region" slices={SLICES} />);
    expect(root.querySelector("figcaption")?.textContent).toBe("Traffic by region");
    const rows = slices(root);
    expect(rows).toHaveLength(5);
    // the reading order is the name and then its share, and the share is the item's own data
    expect(rows.map((row) => row.textContent?.replace(/\s+/g, ""))).toEqual([
      "Europe38%",
      "NorthAmerica31%",
      "Asia18%",
      "SouthAmerica8%",
      "Oceania5%",
    ]);
    expect(rows[1]?.querySelector("data")?.getAttribute("value")).toBe("31");
    // no value is hover-only: every share is in the document before any pointer
    expect(rows.every((row) => (row.querySelector("data")?.textContent ?? "").endsWith("%"))).toBe(
      true,
    );
    dispose();
  });

  it("tiles the circle with the slices' bands, in the order they are read", () => {
    const { root, dispose } = mount(() => <Donut label="Traffic by region" slices={SLICES} />);
    const bands = slices(root).map(band);
    expect(bands[0]?.from).toBe(0);
    expect(bands.at(-1)?.to).toBe(100);
    for (let index = 1; index < bands.length; index += 1) {
      // each band starts where the one before it ends: no gap, no overlap
      expect(bands[index]?.from).toBeCloseTo(bands[index - 1]!.to, 6);
      // and its width is the slice's share of the whole (the values sum to 100)
      expect(bands[index]!.to - bands[index]!.from).toBeCloseTo(SLICES[index]!.value, 6);
    }
    dispose();
  });

  it("paints the slice as the item's ring: a conic gradient, masked to a ring and clipped to its wedge", () => {
    const { root, dispose } = mount(() => <Donut label="Traffic by region" slices={SLICES} />);
    const slice = slices(root)[0]!;
    const painted = ring(slice);
    // a pseudo-element paints nothing without content
    expect(painted.content).toBe('""');
    expect(painted.backgroundImage).toContain("conic-gradient");
    // the hole and the hit area: a radial mask makes the ring, the polygon lets only the wedge take a hover
    expect(painted.maskImage).toContain("radial-gradient");
    expect(painted.clipPath).toContain("polygon");
    expect(painted.width).toBe(painted.height);
    // the slice's colour is its index, drawn from the theme's own tokens
    expect(slice.style.getPropertyValue("--c")).toBe("var(--color-highlight, #717171)");
    expect(slices(root)[1]?.style.getPropertyValue("--c")).toBe("var(--color-gray-700)");
    dispose();
  });

  it("takes the page's formatting and size", () => {
    const { root, dispose } = mount(() => (
      <Donut
        label="Sign-ups"
        size="7rem"
        slices={[
          { label: "Free", value: 3 },
          { label: "Paid", value: 1 },
        ]}
        format={(value, shareOf) => `${value} (${shareOf}%)`}
      />
    ));
    const list = root.querySelector<HTMLElement>('[data-part="donut"]')!;
    expect(list.style.getPropertyValue("--donut-size")).toBe("7rem");
    expect(slices(root)[0]?.querySelector("data")?.textContent).toBe("3 (75%)");
    // the data is the share, as the row shows it, whatever the page's formatting
    expect(slices(root)[0]?.querySelector("data")?.getAttribute("value")).toBe("75");
    dispose();
  });

  it("paints nothing for a chart of zeroes instead of a full ring", () => {
    const { root, dispose } = mount(() => (
      <Donut
        label="Nothing yet"
        slices={[
          { label: "A", value: 0 },
          { label: "B", value: 0 },
        ]}
      />
    ));
    expect(slices(root).map(band)).toEqual([
      { from: 0, to: 0 },
      { from: 0, to: 0 },
    ]);
    expect(slices(root)[0]?.querySelector("data")?.textContent).toBe("0%");
    dispose();
  });

  it("lifts the ring on hover without moving the page", async () => {
    const { root, dispose } = mount(() => <Donut label="Traffic by region" slices={SLICES} />);
    const list = root.querySelector<HTMLElement>('[data-part="donut"]')!;
    const before = {
      list: list.getBoundingClientRect(),
      rows: slices(root).map((row) => row.getBoundingClientRect()),
    };
    await userEvent.hover(slices(root)[0]!);
    // the ring's lift is a transition: let it arrive before reading it
    await new Promise((resolve) => setTimeout(resolve, 250));
    // the hover is a scale on the pseudo-element: the legend keeps every box it had
    const after = {
      list: list.getBoundingClientRect(),
      rows: slices(root).map((row) => row.getBoundingClientRect()),
    };
    expect(after.list.height).toBe(before.list.height);
    expect(after.list.width).toBe(before.list.width);
    expect(after.rows.map((rect) => [rect.width, rect.height])).toEqual(
      before.rows.map((rect) => [rect.width, rect.height]),
    );
    expect(getComputedStyle(slices(root)[0]!, "::before").scale).toBe("1.05");
    dispose();
  });
});
