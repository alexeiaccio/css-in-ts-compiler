import { afterEach, describe, expect, it } from "vite-plus/test";

import { type MountedScrollspy, mountScrollspy } from "./scrollspy.fixture";

// No APG pattern and no Quint spec exists for a scrollspy, so this file is the skin's oracle: it mounts the starter in a
// real Chromium and scrolls the same pane a reader does. The accessible contract (a named landmark, one `aria-current`
// link, ids as the headings' targets) is only observable through the DOM.
//
// The fixture's pane is 260 px tall and every section is 300, so one heading is at the top of the pane at a time and the
// next starts below the fold.

/** Solid applies setters on the next flush, and a scroll event lands on a later turn: two frames settle both. */
const frame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

/** Polls until `done` holds, so a slow frame on a busy machine is waited for rather than assumed. */
const waitFor = async (done: () => boolean, limit = 5000): Promise<void> => {
  const start = performance.now();
  while (!done()) {
    if (performance.now() - start > limit) {
      throw new Error("waitFor timed out");
    }
    await frame();
  }
};

const live: MountedScrollspy[] = [];

const mounted = (): MountedScrollspy => {
  const instance = mountScrollspy();
  live.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

const nav = (root: ParentNode): HTMLElement => {
  const element = root.querySelector<HTMLElement>('nav[data-part="scrollspy"]');
  if (element === null) {
    throw new Error("scrollspy: no nav");
  }
  return element;
};

const links = (root: ParentNode): HTMLAnchorElement[] => [
  ...nav(root).querySelectorAll<HTMLAnchorElement>('a[data-part="scrollspy-link"]'),
];

const current = (root: ParentNode): HTMLAnchorElement[] => [
  ...nav(root).querySelectorAll<HTMLAnchorElement>('a[aria-current="location"]'),
];

const heading = (id: string): HTMLElement => {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`scrollspy: no heading ${id}`);
  }
  return element;
};

/** A heading's top in the pane's own coordinates. */
const topOf = (mountedInstance: MountedScrollspy, id: string): number => {
  const pane = mountedInstance.pane.getBoundingClientRect();
  return heading(id).getBoundingClientRect().top - pane.top + mountedInstance.pane.scrollTop;
};

const scrollTo = async (mountedInstance: MountedScrollspy, top: number): Promise<void> => {
  mountedInstance.pane.scrollTop = top;
  await waitFor(() => Math.abs(mountedInstance.pane.scrollTop - top) <= 1);
  await frame();
};

describe("Scrollspy", () => {
  it("is a named landmark that lists the entries, the first one current", () => {
    const { root } = mounted();
    const items = links(root);

    expect(nav(root).tagName).toBe("NAV");
    expect(nav(root).getAttribute("aria-label")).toBe("Table of contents");
    expect(nav(root).querySelector("ul")?.getAttribute("role")).toBe("list");
    expect(items.map((link) => link.textContent)).toEqual(["Overview", "Install", "Configure"]);
    expect(items.map((link) => link.getAttribute("href"))).toEqual([
      "#scrollspy-overview",
      "#scrollspy-install",
      "#scrollspy-configure",
    ]);
    expect(items.map((link) => link.closest("li")?.getAttribute("role"))).toEqual([
      "listitem",
      "listitem",
      "listitem",
    ]);

    const currentLinks = current(root);
    expect(currentLinks).toHaveLength(1);
    expect(currentLinks[0]?.getAttribute("href")).toBe("#scrollspy-overview");
    expect(items[1]?.hasAttribute("aria-current")).toBe(false);
  });

  it("indents a nested entry by its level", () => {
    const { root } = mounted();
    const [outer, nested] = links(root);
    expect(outer).toBeDefined();
    expect(nested).toBeDefined();
    const padding = (link: HTMLAnchorElement | undefined): number =>
      Number.parseFloat(getComputedStyle(link as HTMLAnchorElement).paddingInlineStart);

    expect(padding(nested)).toBeGreaterThan(padding(outer));
  });

  it("moves aria-current to the heading that passed the top, and only one has it", async () => {
    const instance = mounted();
    const { root } = instance;

    // the heading of Configure at the top of the pane: it is the last one at or above the line
    await scrollTo(instance, topOf(instance, "scrollspy-configure") + 40);
    await waitFor(() => current(root)[0]?.getAttribute("href") === "#scrollspy-configure");

    expect(current(root)).toHaveLength(1);
    expect(current(root)[0]?.textContent).toBe("Configure");

    await scrollTo(instance, topOf(instance, "scrollspy-install") + 40);
    await waitFor(() => current(root)[0]?.getAttribute("href") === "#scrollspy-install");
    expect(current(root)).toHaveLength(1);
  });

  it("keeps a heading below the fold out of the table of contents until the pane scrolls", () => {
    const instance = mounted();
    const paneBox = instance.pane.getBoundingClientRect();
    const install = heading("scrollspy-install").getBoundingClientRect();

    expect(install.top).toBeGreaterThanOrEqual(paneBox.top + instance.pane.clientHeight);
    expect(current(instance.root)[0]?.getAttribute("href")).toBe("#scrollspy-overview");
  });

  it("scrolls the pane to the heading when its link is clicked, and marks it current", async () => {
    const instance = mounted();
    const paneBox = instance.pane.getBoundingClientRect();

    links(instance.root)[2]?.click();
    await waitFor(() => {
      const box = heading("scrollspy-configure").getBoundingClientRect();
      return box.top >= paneBox.top - 1 && box.top < paneBox.bottom;
    });

    expect(instance.pane.scrollTop).toBeGreaterThan(0);
    await waitFor(() => current(instance.root)[0]?.getAttribute("href") === "#scrollspy-configure");
  });

  it("re-reads the list and the headings when the entries change", async () => {
    const instance = mounted();
    expect(links(instance.root)).toHaveLength(3);

    instance.reveal();
    await waitFor(() => links(instance.root).length === 4);
    expect(links(instance.root)[3]?.textContent).toBe("Deploy");

    await scrollTo(instance, topOf(instance, "scrollspy-deploy") + 40);
    await waitFor(() => current(instance.root)[0]?.getAttribute("href") === "#scrollspy-deploy");
    expect(current(instance.root)).toHaveLength(1);
  });
});
