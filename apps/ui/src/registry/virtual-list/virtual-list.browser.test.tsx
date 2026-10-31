import { flush } from "solid-js";
import { render } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";
import type { Virtualizer } from "@cssints/headless";
import { VirtualList } from "./virtual-list.tsx";

// The primitive's window is a memo over the scroll signals; `flush` applies the writes a scroll made.
const ITEM = 36;
const GAP = 4;
const SLOT = ITEM + GAP;

const mountList = (options: { count?: number } = {}) => {
  const root = document.createElement("div");
  document.body.append(root);
  let list: Virtualizer | undefined;
  const dispose = render(
    () => (
      <VirtualList
        count={options.count ?? 10_000}
        itemSize={ITEM}
        gap={GAP}
        height={600}
        onReady={(ready) => {
          list = ready;
        }}
        renderItem={(index) => <span>{`Name ${index + 1}`}</span>}
      />
    ),
    root,
  );
  const port = root.querySelector<HTMLElement>('[data-part="virtual-list"]');
  if (port === null) {
    throw new Error("the list did not mount");
  }
  const rows = (): HTMLElement[] => [
    ...root.querySelectorAll<HTMLElement>('[data-part="virtual-list-item"]'),
  ];
  return {
    root,
    port,
    rows,
    row: (index: number): HTMLElement | undefined =>
      root.querySelector<HTMLElement>(`[data-part="virtual-list-item"][data-index="${index}"]`) ??
      undefined,
    api: (): Virtualizer => {
      if (list === undefined) {
        throw new Error("the list has no primitive");
      }
      return list;
    },
    scrollTo: (top: number): void => {
      port.scrollTop = top;
      port.dispatchEvent(new Event("scroll"));
      flush();
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

const indexes = (rows: ReadonlyArray<HTMLElement>): number[] =>
  rows.map((row) => Number(row.dataset["index"]));

describe("VirtualList skin", () => {
  it("declares a window of 10,000 rows and announces each one's place in the whole set", () => {
    const mounted = mountList();
    const content = 10_000 * ITEM + 9_999 * GAP;

    expect(mounted.port.clientHeight).toBe(600);
    expect(mounted.port.scrollHeight).toBe(content);

    const rows = mounted.rows();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(40);
    expect(rows.length).toBe(mounted.api().rangeCount());
    expect(indexes(rows)).toEqual(
      Array.from({ length: rows.length }, (_, step) => mounted.api().window().first + step),
    );

    for (const row of rows) {
      const index = Number(row.dataset["index"]);
      expect(row.getAttribute("role")).toBe("listitem");
      expect(row.getAttribute("aria-setsize")).toBe("10000");
      expect(row.getAttribute("aria-posinset")).toBe(String(index + 1));
      expect(row.offsetTop).toBe(index * SLOT);
      expect(row.textContent).toBe(`Name ${index + 1}`);
    }

    // At the top there is no start spacer: a zero-height box would still add the column's gap.
    expect(
      mounted.root.querySelector('[data-part="virtual-list-spacer"][data-position="start"]'),
    ).toBeNull();
    const end = mounted.root.querySelector<HTMLElement>(
      '[data-part="virtual-list-spacer"][data-position="end"]',
    );
    expect(end?.getAttribute("aria-hidden")).toBe("true");
    expect(end?.offsetHeight).toBe(mounted.api().window().below);
    mounted.dispose();
  });

  it("moves the window with the scroll, re-rendering other rows at their exact offsets", () => {
    const mounted = mountList();
    const top = indexes(mounted.rows());

    mounted.scrollTo(200_000);
    const at = mounted.api().window();
    const middle = indexes(mounted.rows());

    expect(at.first).toBe(4_998);
    expect(middle).not.toEqual(top);
    expect(middle[0]).toBe(at.first);
    for (const row of mounted.rows()) {
      expect(row.offsetTop).toBe(Number(row.dataset["index"]) * SLOT);
    }
    // The start spacer is the rows above the window, gap-compensated: first·slot − gap.
    const start = mounted.root.querySelector<HTMLElement>(
      '[data-part="virtual-list-spacer"][data-position="start"]',
    );
    expect(start?.offsetHeight).toBe(at.above);
    expect(at.above).toBe(at.first * SLOT - GAP);
    expect(mounted.rows()[0]?.offsetTop).toBe(at.above + GAP);
    mounted.dispose();
  });

  it("scrollToIndex reaches a far index and declares it", () => {
    const mounted = mountList();
    expect(mounted.row(9_000)).toBeUndefined();

    mounted.api().scrollToIndex(9_000);
    flush();

    const view = mounted.port.clientHeight;
    expect(mounted.port.scrollTop).toBe(9_000 * SLOT + ITEM - view);
    const row = mounted.row(9_000);
    expect(row).toBeDefined();
    expect(row?.getAttribute("aria-posinset")).toBe("9001");
    expect(row?.getAttribute("aria-setsize")).toBe("10000");
    expect(row?.offsetTop).toBe(9_000 * SLOT);
    mounted.dispose();
  });
});
