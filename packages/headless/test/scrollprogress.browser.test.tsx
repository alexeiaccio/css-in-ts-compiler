import { createScrollProgress, type ScrollProgress } from "../src/scrollprogress";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { render } from "@solidjs/web";

const tick = (): Promise<unknown> => new Promise((resolve) => setTimeout(resolve, 20));

const waitFor = async (done: () => boolean, limit = 2000): Promise<void> => {
  const start = Date.now();
  while (!done()) {
    if (Date.now() - start > limit) {
      throw new Error("waitFor timed out");
    }
    await tick();
  }
};

interface Mounted {
  readonly api: ScrollProgress;
  readonly scroller: HTMLElement;
  readonly changes: number[];
  readonly teardown: () => void;
}

const mounted: Array<() => void> = [];

afterEach(() => {
  for (const dispose of mounted.splice(0)) {
    dispose();
  }
  window.scrollTo(0, 0);
});

/** A 400 px scrollport holding `content` px of content; `root: false` watches the document instead. */
const mount = (content: number, root = true): Mounted => {
  const scroller = document.createElement("div");
  scroller.style.height = "400px";
  scroller.style.overflowY = "auto";
  scroller.setAttribute("data-scroller", "");
  const page = document.createElement("div");
  page.style.height = `${content}px`;
  scroller.append(page);
  document.body.append(scroller);

  const changes: number[] = [];
  const api = createScrollProgress({
    ...(root ? { root: () => scroller } : {}),
    onChange: (value) => changes.push(value),
  });
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.top = "0";
  document.body.append(host);
  const dispose = render(
    () => <div data-bar {...api.barProps} style={{ scale: `${api.progress()} 1` }} />,
    host,
  );
  const teardown = api.attach();
  mounted.push(() => {
    teardown();
    dispose();
    host.remove();
    scroller.remove();
  });
  return { api, scroller, changes, teardown };
};

const scroll = async (scroller: HTMLElement, top: number, left = 0): Promise<void> => {
  scroller.scrollTop = top;
  scroller.scrollLeft = left;
  scroller.dispatchEvent(new Event("scroll"));
  await tick();
};

const bar = (): HTMLElement => document.querySelector<HTMLElement>("[data-bar]")!;

describe("createScrollProgress", () => {
  it("is the scroll's fraction, with the bar's ARIA from the same value", async () => {
    const { api, scroller, changes } = mount(1200);
    // Solid 2 flushes a write on the next task, so the mount's own sync is read after one
    await tick();
    expect(api.progress()).toBe(0);
    expect(api.distance()).toBe(800);
    expect(api.barProps["aria-valuenow"]).toBe(0);

    await scroll(scroller, 200);
    await waitFor(() => api.progress() === 0.25);
    expect(api.progress()).toBe(0.25);
    expect(api.scrolled()).toBe(200);
    expect(api.barProps["aria-valuenow"]).toBe(25);
    expect(bar().getAttribute("aria-valuenow")).toBe("25");
    expect(bar().getAttribute("role")).toBe("progressbar");
    expect(bar().style.scale).toBe("0.25 1");
    expect(changes.at(-1)).toBe(0.25);

    await scroll(scroller, 800);
    await waitFor(() => api.progress() === 1);
    expect(api.barProps["aria-valuenow"]).toBe(100);
  });

  it("clamps a scroll past the end, and a negative one", async () => {
    const { api, scroller } = mount(1200);
    await scroll(scroller, 900);
    await waitFor(() => api.progress() === 1);
    expect(api.progress()).toBe(1);
    await scroll(scroller, -100);
    await waitFor(() => api.progress() === 0);
    expect(api.progress()).toBe(0);
  });

  it("is complete when there is nothing to scroll, not indeterminate", async () => {
    const { api, scroller } = mount(300);
    await tick();
    await waitFor(() => api.distance() === 0);
    expect(api.distance()).toBe(0);
    expect(api.progress()).toBe(1);
    expect(api.barProps["aria-valuenow"]).toBe(100);
    await scroll(scroller, 0);
    expect(api.progress()).toBe(1);
  });

  it("reads the inline axis on request", async () => {
    const { api, scroller } = mount(1200);
    const host = document.createElement("div");
    host.style.width = "200px";
    host.style.height = "50px";
    host.style.overflowX = "auto";
    const wide = document.createElement("div");
    wide.style.width = "600px";
    host.append(wide);
    document.body.append(host);
    const inline = createScrollProgress({ root: () => host, axis: "inline" });
    const teardown = inline.attach();
    mounted.push(() => {
      teardown();
      host.remove();
    });
    host.scrollLeft = 200;
    host.dispatchEvent(new Event("scroll"));
    await waitFor(() => inline.progress() === 0.5);
    expect(inline.progress()).toBe(0.5);
    expect(inline.distance()).toBe(400);
    expect(inline.scrolled()).toBe(200);
    // the first instance still reads its own axis and its own container
    await scroll(scroller, 400);
    await waitFor(() => api.progress() === 0.5);
    expect(api.progress()).toBe(0.5);
  });

  it("stops at the teardown, and the synced value is exact after a jump", async () => {
    const { api, scroller, teardown } = mount(1200);
    scroller.scrollTop = 400;
    // a restored position, no scroll event of our own: `attach` synced before, so fire one
    scroller.dispatchEvent(new Event("scroll"));
    await waitFor(() => api.progress() === 0.5);
    teardown();
    await scroll(scroller, 800);
    await tick();
    expect(api.progress()).toBe(0.5);
  });

  it("follows the document when no root is given", async () => {
    const filler = document.createElement("div");
    filler.style.height = "3000px";
    document.body.append(filler);
    mounted.push(() => filler.remove());
    const api = createScrollProgress();
    const teardown = api.attach();
    mounted.push(teardown);
    // the harness's own page may not scroll: the document branch is read for its numbers, not for a scroll of the iframe
    await tick();
    expect(api.distance()).toBeGreaterThan(0);
    expect(api.progress()).toBe(0);
  });
});
