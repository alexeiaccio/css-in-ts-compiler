// The progress bar's conformance: one bar, two halves. The ARIA value follows the pane's scroll (the primitive), and the
// native animation is the same element's — where the browser has scroll-driven animations it wins over the inline scale.
// The test reads both, so it holds in a browser without the timeline too.
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { Progress } from "./progress.tsx";

const SECTIONS = Array.from({ length: 8 }, (_, index) => ({
  title: `${index + 1}. Section`,
  text: "A paragraph long enough to make the pane scroll, repeated so the article has a length to read.",
}));

const mounted: Array<() => void> = [];

afterEach(() => {
  for (const dispose of mounted.splice(0)) {
    dispose();
  }
});

const mount = (): HTMLElement => {
  const host = document.createElement("div");
  host.style.width = "320px";
  document.body.append(host);
  const dispose = render(() => <Progress sections={SECTIONS} />, host);
  mounted.push(() => {
    dispose();
    host.remove();
  });
  return host;
};

const paneOf = (host: HTMLElement): HTMLElement =>
  host.querySelector<HTMLElement>('[data-part="progress-pane"]')!;

const barOf = (host: HTMLElement): HTMLElement =>
  host.querySelector<HTMLElement>('[data-part="progress-bar"]')!;

const tick = (): Promise<unknown> => new Promise((resolve) => setTimeout(resolve, 30));

const waitFor = async (done: () => boolean, limit = 2000): Promise<void> => {
  const start = Date.now();
  while (!done()) {
    if (Date.now() - start > limit) {
      throw new Error("waitFor timed out");
    }
    await tick();
  }
};

const scroll = async (pane: HTMLElement, top: number): Promise<void> => {
  pane.scrollTop = top;
  pane.dispatchEvent(new Event("scroll"));
  await tick();
};

describe("Progress", () => {
  it("is a progressbar whose value is the pane's scroll", async () => {
    const host = mount();
    const bar = barOf(host);
    const pane = paneOf(host);
    expect(bar.getAttribute("role")).toBe("progressbar");
    expect(bar.getAttribute("aria-label")).toBe("Reading progress");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    await waitFor(() => bar.getAttribute("aria-valuenow") === "0");

    const distance = pane.scrollHeight - pane.clientHeight;
    expect(distance).toBeGreaterThan(0);
    await scroll(pane, Math.round(distance / 2));
    await waitFor(() => bar.getAttribute("aria-valuenow") === "50");
    expect(bar.getAttribute("aria-valuenow")).toBe("50");
    expect(Number.parseFloat(bar.style.scale)).toBeCloseTo(0.5, 2);

    await scroll(pane, distance);
    await waitFor(() => bar.getAttribute("aria-valuenow") === "100");
    expect(bar.getAttribute("aria-valuenow")).toBe("100");
  });

  it("carries the native timeline where the browser has one, on the pane's own scroll", async () => {
    const host = mount();
    const bar = barOf(host);
    const style = getComputedStyle(bar);
    const native = CSS.supports("animation-timeline", "scroll()");
    // the same value `progress()` prints: one keyframes animation, scrubbed by `scroll(nearest)`
    expect(style.animationName !== "none").toBe(native);
    if (native) {
      expect(style.getPropertyValue("animation-timeline")).toContain("scroll(");
      expect(style.getPropertyValue("animation-duration")).toBe("auto");
    }
    // the origin is the bar's, axis x: the fill grows from the left edge (50% of a 3px bar is 1.5px)
    expect(style.transformOrigin).toBe("0px 1.5px");
  });

  it("is focusable in its pane, so the article scrolls from the keyboard", () => {
    const host = mount();
    const pane = paneOf(host);
    expect(pane.tabIndex).toBe(0);
  });
});
