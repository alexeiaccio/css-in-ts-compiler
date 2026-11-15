// The scale's conformance: the number the bars divide by is read out of layout, not computed in script. The test reads it off
// the registered property, off the counter that prints it and off the bars themselves, and it reads the values as text —
// which is what remains where container units are missing.
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { Scale, type ScaleItem } from "./scale.tsx";

const ITEMS: ReadonlyArray<ScaleItem> = [
  { label: "us-east", value: 420 },
  { label: "eu-west", value: 310 },
  { label: "ap-south", value: 96 },
  { label: "sa-east", value: 42 },
];

const mounted: Array<() => void> = [];

afterEach(() => {
  for (const dispose of mounted.splice(0)) {
    dispose();
  }
});

const mount = (items: ReadonlyArray<ScaleItem> = ITEMS): HTMLElement => {
  const host = document.createElement("div");
  document.body.append(host);
  const dispose = render(() => <Scale items={items} label="By region" />, host);
  mounted.push(() => {
    dispose();
    host.remove();
  });
  return host;
};

const part = <T extends Element>(host: HTMLElement, name: string): T =>
  host.querySelector<T>(`[data-part="${name}"]`)!;

const bars = (host: HTMLElement): HTMLElement[] => [
  ...host.querySelectorAll<HTMLElement>('[data-part="scale-bar"]'),
];

const tracks = (host: HTMLElement): HTMLElement[] => [
  ...host.querySelectorAll<HTMLElement>('[data-part="scale-track"]'),
];

const share = (host: HTMLElement, index: number): number =>
  Number.parseFloat(getComputedStyle(bars(host)[index]!).inlineSize) /
  Number.parseFloat(getComputedStyle(tracks(host)[index]!).inlineSize);

describe("Scale", () => {
  it("reads the largest value out of layout, and the bars divide by it", () => {
    // the division of a length by a length is what makes the read possible: a browser without it has no scale at all
    if (!CSS.supports("width", "1cqw")) {
      return;
    }
    const host = mount();
    // the number is the registered <integer>, computed by the query container: the largest value, in px
    const gauge = part<HTMLElement>(host, "scale-gauge");
    expect(getComputedStyle(gauge).getPropertyValue("--scale").trim()).toBe("420");
    // and the counter prints that number: `content` takes a counter, not a custom property
    const printed = part<HTMLElement>(host, "scale-print");
    expect(getComputedStyle(printed).counterReset).toBe("result 420");

    // the bars are the values' shares of the largest one
    expect(share(host, 0)).toBeCloseTo(1, 2);
    expect(share(host, 1)).toBeCloseTo(310 / 420, 2);
    expect(share(host, 3)).toBeCloseTo(42 / 420, 2);
  });

  it("moves the scale with a new largest value, and nothing else changes", () => {
    if (!CSS.supports("width", "1cqw")) {
      return;
    }
    const host = mount([...ITEMS, { label: "af-south", value: 900 }]);
    const gauge = part<HTMLElement>(host, "scale-gauge");
    expect(getComputedStyle(gauge).getPropertyValue("--scale").trim()).toBe("900");
    expect(share(host, 0)).toBeCloseTo(420 / 900, 2);
  });

  it("states every number as text, which is the fallback as well as the table", () => {
    const host = mount();
    const list = part<HTMLElement>(host, "scale-list");
    expect(list.textContent).toContain("us-east");
    expect(list.textContent).toContain("420");
    // the bars are decoration over those numbers, and the marks that measure are decoration too
    expect(part(host, "scale-track").getAttribute("aria-hidden")).toBe("true");
    expect(host.querySelectorAll('[data-part="scale-mark"]')).toHaveLength(ITEMS.length);
    expect(host.querySelector('[data-part="scale-mark"]')!.getAttribute("aria-hidden")).toBe(
      "true",
    );
    // the figure is named, so a reader knows what the numbers are
    expect(host.querySelector("figcaption")?.textContent).toBe("By region");
  });
});
