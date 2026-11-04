// The stat tile's conformance, to the checklist the charts epic is held to: the heading names the tile, the value is a
// `<data>`, the change is a sentence with its sign in words (not colour, and not a pseudo-element), a tile with no previous
// value claims no change, and the samples are a list. The colour is read too, but only to show it agrees with the words.
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";

import { Stat } from "./stat.tsx";

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

const part = (root: HTMLElement, name: string): HTMLElement =>
  root.querySelector<HTMLElement>(`[data-part="${name}"]`)!;
const change = (root: HTMLElement): HTMLElement | null =>
  root.querySelector('[data-part="stat-change"]');

describe("Stat", () => {
  it("is an article whose heading names the metric and whose value is its data", () => {
    const { root, dispose } = mount(() => (
      <Stat label="Requests per second" value={1350} previous={1310} unit="req/s" />
    ));
    const tile = part(root, "stat");
    expect(tile.tagName).toBe("ARTICLE");
    expect(tile.querySelector("h3")?.textContent).toBe("Requests per second");
    const value = part(root, "stat-value");
    expect(value.tagName).toBe("DATA");
    expect(value.getAttribute("value")).toBe("1350");
    // the value is text, and the unit is read with it
    expect(value.textContent).toBe("1350req/s");
    dispose();
  });

  it("says the change in words, with the sign, for good news and for bad", () => {
    const good = mount(() => <Stat label="Requests" value={1350} previous={1000} better={1} />);
    const better = change(good.root)!;
    expect(better.textContent).toContain("Up 35%");
    expect(better.textContent).toContain("better");
    // the arrow is decoration: the words after it say which way it went
    expect(better.querySelector('[data-part="stat-arrow"]')?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    good.dispose();

    const bad = mount(() => <Stat label="p95 latency" value={197} previous={171} better={-1} />);
    const worse = change(bad.root)!;
    expect(worse.textContent).toContain("Up 15%");
    expect(worse.textContent).toContain("worse");
    // the same direction, the other judgement: the phrase is the component's, not the colour's
    expect(worse.getAttribute("data-tone")).toBe("bad");
    expect(bad.root.querySelector('[data-part="stat-arrow"]')?.textContent).toBe("▲");
    bad.dispose();
  });

  it("claims no change without a previous value, and no percentage to divide by", () => {
    const { root, dispose } = mount(() => <Stat label="Deploys" value={12} />);
    expect(change(root)).toBeNull();
    expect(part(root, "stat").style.getPropertyValue("--pct")).toBe("");
    dispose();
  });

  it("writes the samples as a list of their own numbers", () => {
    const { root, dispose } = mount(() => (
      <Stat label="Requests" value={6} previous={5} samples={[3, 5, 4, 6]} />
    ));
    const list = root.querySelector("ol")!;
    expect(list.getAttribute("aria-label")).toBe("The last 4 samples");
    // the caption says what the line shows, so a sample is not a pointer away for a keyboard reader
    expect(root.querySelector("figcaption")?.textContent).toContain("from 3 to 6");
    const samples = [...list.querySelectorAll("li")];
    expect(samples).toHaveLength(4);
    expect(samples.map((sample) => sample.querySelector("data")?.getAttribute("value"))).toEqual([
      "3",
      "5",
      "4",
      "6",
    ]);
    dispose();
  });

  it("colours good and bad differently, and says which one it is in words", () => {
    const good = mount(() => <Stat label="Requests" value={1350} previous={1000} better={1} />);
    const bad = mount(() => <Stat label="p95 latency" value={197} previous={171} better={-1} />);
    const goodChip = change(good.root)!;
    const badChip = change(bad.root)!;
    const colour = (element: HTMLElement): string => getComputedStyle(element).backgroundColor;
    // the colours are the theme's two signal tokens, not a value of the component's own
    const token = (name: string): string => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = `var(${name})`;
      document.body.append(probe);
      const value = colour(probe);
      probe.remove();
      return value;
    };
    expect(colour(goodChip)).toBe(token("--color-highlight"));
    expect(colour(badChip)).toBe(token("--color-invalid"));
    expect(colour(goodChip)).not.toBe(colour(badChip));
    // the colour is not the message: each chip says "better" or "worse" on its own
    expect(goodChip.textContent).toContain("better");
    expect(badChip.textContent).toContain("worse");
    good.dispose();
    bad.dispose();
  });
});
