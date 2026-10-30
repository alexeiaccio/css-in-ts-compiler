import { type Scrollspy, createScrollspy } from "../src/scrollspy";
import { For } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { render } from "@solidjs/web";

const ENTRIES = Array.from({ length: 6 }, (_, index) => ({
  id: `heading-${index + 1}`,
  label: `Heading ${index + 1}`,
}));

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

const labelled = (): HTMLAnchorElement[] =>
  Array.from(document.querySelectorAll<HTMLAnchorElement>('a[aria-current="location"]'));

const absoluteTop = (element: HTMLElement): number =>
  element.getBoundingClientRect().top + window.scrollY;

interface MountOptions {
  readonly offset?: number | undefined;
  /** Render the headings in a 400 px scroll container instead of the document. */
  readonly scroller?: boolean | undefined;
  /** Section height; the sticky-header test needs the last heading to reach the top. */
  readonly section?: number | undefined;
}

interface Mounted {
  readonly api: Scrollspy;
  readonly changes: Array<string | undefined>;
  readonly teardown: () => void;
  readonly scroller: HTMLElement | undefined;
  /** A heading's top in the scrollport's own coordinates. */
  readonly topOf: (index: number) => number;
  readonly scrollTo: (top: number) => Promise<void>;
}

const mounted: Array<() => void> = [];

afterEach(() => {
  for (const dispose of mounted.splice(0)) {
    dispose();
  }
  window.scrollTo(0, 0);
});

const mount = (options: MountOptions = {}): Mounted => {
  const sectionHeight = options.section ?? 800;
  const scroller = options.scroller === true ? document.createElement("div") : undefined;
  if (scroller !== undefined) {
    scroller.style.height = "400px";
    scroller.style.overflowY = "auto";
    document.body.append(scroller);
  }
  const page = document.createElement("div");
  (scroller ?? document.body).append(page);
  for (const entry of ENTRIES) {
    const section = document.createElement("section");
    section.style.height = `${sectionHeight}px`;
    const heading = document.createElement("h2");
    heading.id = entry.id;
    heading.textContent = entry.label;
    section.append(heading);
    page.append(section);
  }
  // A tail past the last heading, so scrolling can push it above the offset line.
  const tail = document.createElement("div");
  tail.style.height = `${sectionHeight}px`;
  page.append(tail);

  const changes: Array<string | undefined> = [];
  const api = createScrollspy({
    entries: ENTRIES,
    offset: options.offset,
    root: scroller === undefined ? undefined : () => scroller,
    onChange: (id) => changes.push(id),
  });

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.top = "0";
  document.body.append(host);
  const dispose = render(
    () => (
      <nav {...api.navProps}>
        <ul {...api.listProps}>
          <For each={ENTRIES}>
            {(entry) => (
              <li {...api.itemProps(entry.id)}>
                <a {...api.linkProps(entry.id)}>{entry.label}</a>
              </li>
            )}
          </For>
        </ul>
      </nav>
    ),
    host,
  );
  const teardown = api.attach();

  mounted.push(() => {
    teardown();
    dispose();
    host.remove();
    page.remove();
    scroller?.remove();
  });

  const topOf = (index: number): number => {
    const heading = document.getElementById(ENTRIES[index]?.id ?? "");
    if (heading === null) {
      throw new Error(`no heading ${index}`);
    }
    return scroller === undefined
      ? absoluteTop(heading)
      : absoluteTop(heading) - absoluteTop(scroller) + scroller.scrollTop;
  };

  const scrollTo = async (top: number): Promise<void> => {
    if (scroller === undefined) {
      window.scrollTo(0, top);
    } else {
      scroller.scrollTop = top;
    }
    await waitFor(() => Math.abs((scroller?.scrollTop ?? window.scrollY) - top) <= 1);
    // The scroll event lands on a later turn, then Solid flushes the attribute.
    await tick();
    await tick();
  };

  return { api, changes, teardown, scroller, topOf, scrollTo };
};

describe("createScrollspy", () => {
  it("starts on the first entry, before any scroll", () => {
    const { api } = mount();

    expect(api.active()).toBe("heading-1");
    expect(labelled().map((link) => link.getAttribute("href"))).toEqual(["#heading-1"]);
    expect(api.navProps["aria-label"]).toBe("On this page");
    expect(api.listProps.role).toBe("list");
    expect(api.itemProps("heading-1").role).toBe("listitem");
    expect(api.linkProps("heading-1")).toMatchObject({ href: "#heading-1" });
  });

  it("keeps exactly one entry current while scrolling", async () => {
    const { api, topOf, scrollTo } = mount();

    for (const index of [0, 2, 4]) {
      await scrollTo(topOf(index + 1) + 100);
      await waitFor(() => api.active() === ENTRIES[index + 1]?.id);

      const current = labelled();
      expect(current).toHaveLength(1);
      expect(current[0]?.getAttribute("href")).toBe(`#${ENTRIES[index + 1]?.id}`);
    }
  });

  it("counts a heading current only once its top passes the offset", async () => {
    const { api, changes, topOf, scrollTo } = mount({ offset: 100 });
    const second = topOf(1);

    // The second heading is 150 px down: still below the offset line.
    await scrollTo(second - 150);
    expect(api.active()).toBe("heading-1");

    // 60 px down: above the line, though the next heading is on screen too.
    await scrollTo(second - 60);
    expect(api.active()).toBe("heading-2");
    expect(labelled().map((link) => link.getAttribute("href"))).toEqual(["#heading-2"]);
    expect(changes.at(-1)).toBe("heading-2");
  });

  it("stops updating after teardown", async () => {
    const { api, teardown, topOf, scrollTo } = mount();

    await scrollTo(topOf(1) + 100);
    await waitFor(() => api.active() === "heading-2");

    teardown();
    await scrollTo(topOf(3) + 100);
    await tick();

    expect(api.active()).toBe("heading-2");
    expect(labelled().map((link) => link.getAttribute("href"))).toEqual(["#heading-2"]);
  });

  it("listens on the passed root rather than the document", async () => {
    const { api, scroller, topOf, scrollTo } = mount({ scroller: true, section: 300 });
    expect(scroller?.scrollTop).toBe(0);
    expect(window.scrollY).toBe(0);
    expect(api.active()).toBe("heading-1");

    // 20 px above the scrollport's edge, so the third heading is the last one passed.
    await scrollTo(topOf(2) + 20);
    await waitFor(() => api.active() === "heading-3");

    expect(window.scrollY).toBe(0);
    expect(labelled().map((link) => link.getAttribute("href"))).toEqual(["#heading-3"]);
  });
});
