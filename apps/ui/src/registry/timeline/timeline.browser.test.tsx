import { afterEach, describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import {
  TIMELINE_LABEL,
  TIMELINE_SPANS,
  type MountedTimeline,
  mountTimeline,
} from "./timeline.fixture";

// @cssints/headless checks the rows mode on its own fixture in test/timeline-rows.browser.test.tsx; the rows mode has no
// APG pattern, so that file is the primitive's oracle. This file is the skin's: it mounts the starter in a real Chromium,
// reads the geometry the primitive put on the bars, and drives the cursor, the selection and the focus ring the way a
// reader does. The trace is normalized: its whole extent is 1 s, so a span's start and duration are its percentages.

/** Solid 2 applies setters and the primitive's effects on later turns. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

/** A frame for the computed styles, after a focus-visible state has been applied. */
const frame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

/** Polls until `done` holds, so the row's colour transition is waited for rather than assumed. */
const waitFor = async (done: () => boolean, limit = 2000): Promise<void> => {
  const start = performance.now();
  while (!done()) {
    if (performance.now() - start > limit) {
      throw new Error("waitFor timed out");
    }
    await settle();
  }
};

const live: MountedTimeline[] = [];

const mounted = (): MountedTimeline => {
  const instance = mountTimeline();
  live.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

const required = <T extends Element>(parent: ParentNode, selector: string): T => {
  const element = parent.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`timeline: no ${selector}`);
  }
  return element;
};

const row = (root: ParentNode, id: string): HTMLElement =>
  required(root, `[data-part="timeline-row"][data-id="${id}"]`);

const bar = (root: ParentNode, id: string): HTMLElement =>
  required(root, `[data-part="timeline-row"][data-id="${id}"] [data-part="timeline-bar"]`);

const status = (root: ParentNode): HTMLElement => required(root, '[data-part="timeline-status"]');

/** A key on the focused row, as a reader's would arrive. */
const press = async (key: string): Promise<void> => {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) {
    throw new Error("timeline: nothing has the focus");
  }
  active.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  await settle();
};

describe("Timeline", () => {
  it("is a named list of spans, with the primitive's levels and a decorative ruler", async () => {
    const { root, api } = mounted();
    await settle();

    const list = required(root, '[data-part="timeline-list"]');
    expect(list.getAttribute("role")).toBe("list");
    expect(list.getAttribute("aria-label")).toBe(TIMELINE_LABEL);
    expect(root.querySelectorAll('[data-part="timeline-row"]')).toHaveLength(TIMELINE_SPANS.length);
    expect(
      [...root.querySelectorAll('[data-part="timeline-row"]')].every(
        (element) => element.getAttribute("role") === "listitem",
      ),
    ).toBe(true);

    // the nesting a flat list cannot show in the DOM is the primitive's aria-level, not a second copy here
    expect(row(root, "request").getAttribute("aria-level")).toBe("1");
    expect(row(root, "auth").getAttribute("aria-level")).toBe("2");
    expect(row(root, "db").getAttribute("aria-level")).toBe("3");
    expect(row(root, "render").getAttribute("aria-level")).toBe("2");

    const nested = required<HTMLElement>(row(root, "db"), '[data-part="timeline-label"]');
    expect(nested.style.getPropertyValue("--depth")).toBe("2");
    expect(parseFloat(getComputedStyle(nested).paddingInlineStart)).toBeCloseTo(24, 0);

    // the ruler is decoration; its ticks are exactly the primitive's, at the primitive's positions
    const ruler = required(root, '[data-part="timeline-ruler"]');
    expect(ruler.getAttribute("role")).toBe("presentation");
    expect(ruler.getAttribute("aria-hidden")).toBe("true");
    const ticks = [...root.querySelectorAll<HTMLElement>('[data-part="timeline-tick"]')];
    expect(ticks.map((tick) => tick.textContent)).toEqual(
      api.rulerProps.ticks.map((tick) => tick.label),
    );
    expect(ticks).toHaveLength(api.rulerProps.ticks.length);
    for (const [index, tick] of api.rulerProps.ticks.entries()) {
      expect(parseFloat(ticks[index]?.style.left ?? "")).toBeCloseTo(tick.left, 6);
    }
    expect(ticks.length).toBeGreaterThanOrEqual(4);
    expect(ticks[0]?.textContent).toBe("0.0 s");
  });

  it("draws one bar per span at the primitive's percentages of the whole extent", async () => {
    const { root, api } = mounted();
    await settle();

    for (const span of TIMELINE_SPANS) {
      const element = bar(root, span.id);
      const geometry = api.barProps(span.id).style;
      expect(element.style.left).toBe(geometry.left);
      expect(element.style.width).toBe(geometry.width);
    }

    // start / duration against the 1 s extent, read straight off the style
    expect(bar(root, "request").style.left).toBe("0%");
    expect(bar(root, "request").style.width).toBe("100%");
    expect(bar(root, "auth").style.left).toBe("3%");
    expect(bar(root, "auth").style.width).toBe("23%");
    expect(bar(root, "db").style.left).toBe("8%");
    expect(bar(root, "db").style.width).toBe("14%");
    expect(bar(root, "render").style.left).toBe("55%");
    expect(bar(root, "render").style.width).toBe("42%");

    // the grandchild is drawn inside its parent's range: its left starts after the parent's and its end is before it
    const parent = api.barProps("auth").style;
    const child = api.barProps("db").style;
    const parentLeft = parseFloat(parent.left);
    const parentRight = parentLeft + parseFloat(parent.width);
    const childLeft = parseFloat(child.left);
    const childRight = childLeft + parseFloat(child.width);
    expect(childLeft).toBeGreaterThanOrEqual(parentLeft);
    expect(childRight).toBeLessThanOrEqual(parentRight);

    // the tone is the primitive's data-status, and the root and the error span do not share it
    expect(row(root, "request").getAttribute("data-status")).toBe("ok");
    expect(row(root, "db").getAttribute("data-status")).toBe("error");
    expect(getComputedStyle(bar(root, "db")).backgroundColor).not.toBe(
      getComputedStyle(bar(root, "render")).backgroundColor,
    );
  });

  it("moves the cursor with the arrows, Home and End, and the announcement follows the selection", async () => {
    const { root } = mounted();
    await settle();

    // the first row is the primitive's tab stop before anyone asks for another
    expect(row(root, "request").tabIndex).toBe(0);
    expect(row(root, "auth").tabIndex).toBe(-1);
    expect(status(root).textContent).toContain("GET /checkout");

    row(root, "request").focus();
    await settle();

    // the primitive moves the tab stop; the skin moves the real focus after it
    await press("ArrowDown");
    expect(document.activeElement).toBe(row(root, "auth"));
    expect(row(root, "auth").tabIndex).toBe(0);
    expect(row(root, "request").tabIndex).toBe(-1);
    // moving the cursor is not selecting: the announced value still names the root
    expect(status(root).textContent).toContain("GET /checkout");

    await press("Enter");
    expect(row(root, "auth").getAttribute("aria-current")).toBe("true");
    expect(row(root, "request").hasAttribute("aria-current")).toBe(false);
    expect(status(root).textContent).toContain("auth: verify session");

    await press("End");
    expect(document.activeElement).toBe(row(root, "render"));
    await press(" ");
    expect(row(root, "render").getAttribute("aria-current")).toBe("true");
    expect(status(root).textContent).toContain("render: checkout page");

    await press("Home");
    expect(document.activeElement).toBe(row(root, "request"));
  });

  it("paints the selected row from aria-current, and a click moves both the selection and the tab stop", async () => {
    const { root } = mounted();
    await settle();

    const plain = getComputedStyle(row(root, "auth")).backgroundColor;
    // the demo starts with the root selected, so the selected look is on it and not on its child
    expect(row(root, "request").getAttribute("aria-current")).toBe("true");
    expect(getComputedStyle(row(root, "request")).backgroundColor).not.toBe(plain);

    await userEvent.click(row(root, "auth"));
    await settle();

    expect(row(root, "auth").getAttribute("aria-current")).toBe("true");
    expect(row(root, "request").hasAttribute("aria-current")).toBe(false);
    expect(getComputedStyle(row(root, "auth")).backgroundColor).not.toBe(plain);
    await waitFor(() => getComputedStyle(row(root, "request")).backgroundColor === plain);
    expect(document.activeElement).toBe(row(root, "auth"));
    expect(status(root).textContent).toContain("auth: verify session");
  });

  it("draws the focus ring when Tab reaches the tab stop", async () => {
    const { root } = mounted();
    await settle();

    (document.activeElement as HTMLElement | null)?.blur();
    await userEvent.keyboard("{Tab}");
    await frame();

    const focused = document.activeElement;
    expect(focused).toBe(row(root, "request"));
    const style = getComputedStyle(focused as HTMLElement);
    expect(style.outlineStyle).toBe("solid");
    expect(parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
    expect(root.contains(focused)).toBe(true);
  });
});
