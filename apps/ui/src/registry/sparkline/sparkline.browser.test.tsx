// The sparkline's conformance: the list is the data, and the line is CSS. The tests read what a reader gets — one item per
// sample with its number, a segment turned by an angle and as long as the distance, a value that appears on hover — rather
// than the stylesheet that produced it.
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { Sparkline } from "./sparkline.tsx";

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

const items = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="sparkline-sample"]'),
];

describe("Sparkline", () => {
  it("draws one item per sample, with the number as its data", () => {
    const { root, dispose } = mount(() => <Sparkline label="Requests" values={[3, 5, 4, 6]} />);
    const rows = items(root);
    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.querySelector("data")?.getAttribute("value"))).toEqual([
      "3",
      "5",
      "4",
      "6",
    ]);
    // the two values a segment is turned from: the sample and the one before it
    expect(rows[2]?.style.getPropertyValue("--b")).toBe("4");
    expect(rows[2]?.style.getPropertyValue("--a")).toBe("5");
    // the first sample has no previous one: it starts on itself, so its segment is flat
    expect(rows[0]?.style.getPropertyValue("--a")).toBe("3");
    expect(root.querySelector("ol")?.getAttribute("aria-label")).toBe("Requests");
  });

  it("draws the segment as the item's ::before, turned and as long as the step", () => {
    const { root, dispose } = mount(() => (
      <Sparkline label="Requests" values={[0, 10]} height="100px" />
    ));
    const rows = items(root);
    const segment = getComputedStyle(rows[1]!, "::before");
    // the pseudo-element exists and paints itself: `content` is what makes a ::before a box
    expect(segment.content).toBe('""');
    expect(segment.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    // a rising line turns the bar; the computed value is an angle, not `none`
    expect(segment.rotate).toMatch(/-?[\d.]+(deg|grad|rad|turn)/);
    // the bar is longer than its 2px thickness: it spans the step horizontally and the rise vertically
    expect(Number.parseFloat(segment.width)).toBeGreaterThan(2);
    dispose();
  });

  it("shows a sample's value and dot on hover, and the head's dot always", async () => {
    const { root, dispose } = mount(() => <Sparkline label="Requests" values={[1, 4, 2]} />);
    const rows = items(root);
    const value = (row: HTMLElement): HTMLElement => row.querySelector<HTMLElement>("data")!;
    const dot = (row: HTMLElement): CSSStyleDeclaration => getComputedStyle(row, "::after");

    expect(getComputedStyle(value(rows[1]!)).opacity).toBe("0");
    expect(dot(rows[1]!).opacity).toBe("0");
    await userEvent.hover(rows[1]!);
    expect(getComputedStyle(value(rows[1]!)).opacity).toBe("1");
    expect(dot(rows[1]!).opacity).toBe("1");
    // the last sample's dot is the line's head: it is drawn without a hover
    expect(dot(rows[2]!).opacity).toBe("1");
    expect(dot(rows[2]!).content).toBe('""');
    dispose();
  });

  it("takes the scale from the samples, or from the page when it shares one", () => {
    const own = mount(() => <Sparkline label="Requests" values={[10, 20, 30]} />);
    const list = own.root.querySelector<HTMLElement>("ol")!;
    expect(list.style.getPropertyValue("--min")).toBe("10");
    expect(list.style.getPropertyValue("--max")).toBe("30");
    own.dispose();

    const shared = mount(() => <Sparkline label="Requests" values={[10, 20]} min={0} max={100} />);
    const other = shared.root.querySelector<HTMLElement>("ol")!;
    expect(other.style.getPropertyValue("--min")).toBe("0");
    expect(other.style.getPropertyValue("--max")).toBe("100");
    shared.dispose();
  });

  it("gives a flat line a range, so every point sits on the rail", () => {
    const { root, dispose } = mount(() => <Sparkline label="Requests" values={[7, 7, 7]} />);
    const list = root.querySelector<HTMLElement>("ol")!;
    expect(list.style.getPropertyValue("--min")).toBe("7");
    expect(list.style.getPropertyValue("--max")).toBe("8");
    dispose();
  });
});
