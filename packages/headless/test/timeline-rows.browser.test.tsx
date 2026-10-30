import { type TimelineRows, type TimelineSpan, createTimeline } from "../src/timeline";
import { For } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { render } from "@solidjs/web";
import { userEvent } from "vite-plus/test/browser";

// The rows mode is not an APG pattern, so its oracle is this file: span data
// laid out as percentages of the rows' extent, selection by pointer and keys,
// a ruler of a nice step, and zero-length spans that stay visible.

const ROWS: ReadonlyArray<TimelineSpan> = [
  { id: "root", label: "GET /checkout", start: 0, end: 100 },
  { id: "http", label: "POST /cart", start: 10, end: 90, depth: 1, status: "error" },
  { id: "db", label: "SELECT cart", start: 20, end: 30, depth: 2 },
  { id: "cache", label: "cache hit", start: 50, end: 50, depth: 2, status: "ok" },
];

const settle = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

interface Mounted {
  readonly api: TimelineRows;
  readonly root: HTMLElement;
  readonly row: (id: string) => HTMLElement;
  readonly bar: (id: string) => HTMLElement;
  readonly changes: Array<string>;
  readonly dispose: () => void;
}

const mounted: Array<() => void> = [];

afterEach(() => {
  for (const dispose of mounted.splice(0)) {
    dispose();
  }
});

const mount = (
  rows: ReadonlyArray<TimelineSpan> = ROWS,
  unit: "ms" | "us" | "s" = "ms",
): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const changes: Array<string> = [];
  let api: TimelineRows | undefined;

  const dispose = render(() => {
    const timeline = createTimeline({
      rows,
      axis: { unit },
      onSelect: (id) => changes.push(id),
    });
    api = timeline;
    return (
      <>
        <div {...timeline.listProps}>
          <For each={rows}>
            {(span) => (
              <div data-part="row" data-row={span.id} {...timeline.rowProps(span.id)}>
                <span data-part="label" {...timeline.labelProps(span.id)}>
                  {span.label}
                </span>
                <div style={{ position: "relative", width: "400px", height: "20px" }}>
                  <div
                    data-part="bar"
                    {...timeline.barProps(span.id)}
                    style={{ ...timeline.barProps(span.id).style, position: "absolute" }}
                  />
                </div>
              </div>
            )}
          </For>
        </div>
        <div
          data-part="ruler"
          role={timeline.rulerProps.role}
          aria-hidden={timeline.rulerProps["aria-hidden"]}
        >
          <For each={timeline.rulerProps.ticks}>
            {(tick) => (
              <span data-part="tick" style={{ left: `${tick.left}%` }}>
                {tick.label}
              </span>
            )}
          </For>
        </div>
      </>
    );
  }, root);

  mounted.push(() => {
    dispose();
    root.remove();
  });

  const part = (selector: string): HTMLElement => {
    const element = root.querySelector<HTMLElement>(selector);
    if (element === null) {
      throw new Error(`no ${selector}`);
    }
    return element;
  };

  if (api === undefined) {
    throw new Error("the timeline did not mount");
  }
  return {
    api,
    root,
    row: (id) => part(`[data-part="row"][data-row="${id}"]`),
    bar: (id) => part(`[data-part="row"][data-row="${id}"] [data-part="bar"]`),
    changes,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

describe("createTimeline rows mode", () => {
  it("takes the extent from every row, nested ones included", () => {
    const { api } = mount();
    expect(api.extent()).toEqual({ start: 0, end: 100 });
    expect(api.depthOf("db")).toBe(2);
    expect(api.rowProps("http")["aria-level"]).toBe(2);
    expect(api.rowProps("db")["aria-level"]).toBe(3);
    expect(api.rowProps("db").role).toBe("listitem");
  });

  it("bars are percentages of the extent, so a nested span keeps its offset", () => {
    const { api } = mount();
    expect(api.barProps("http").style.left).toBe("10%");
    expect(api.barProps("http").style.width).toBe("80%");
    expect(api.barProps("db").style.left).toBe("20%");
    expect(api.barProps("db").style.width).toBe("10%");
    expect(api.barProps("db").style["--depth"]).toBe("2");
  });

  it("a narrower extent still maps the deepest span proportionally", () => {
    const { api } = mount([
      { id: "outer", label: "outer", start: 10, end: 20 },
      { id: "inner", label: "inner", start: 12, end: 14, depth: 1 },
    ]);
    expect(api.extent()).toEqual({ start: 10, end: 20 });
    expect(api.barProps("inner").style.left).toBe("20%");
    expect(api.barProps("inner").style.width).toBe("20%");
  });

  it("a zero-length span stays visible with a minimum width", async () => {
    const { api, bar } = mount();
    expect(api.barProps("cache").style.left).toBe("50%");
    expect(api.barProps("cache").style.width).toBe("0.5%");
    await settle();
    // 0.5% of the 400 px track
    expect(bar("cache").getBoundingClientRect().width).toBeCloseTo(2, 0);
  });

  it("clicking a row selects it and reports the request", async () => {
    const { api, row, changes } = mount();
    await userEvent.click(row("db"));
    expect(api.selectedId()).toBe("db");
    expect(changes).toEqual(["db"]);
    await settle();
    expect(row("db").getAttribute("aria-current")).toBe("true");
    expect(row("root").getAttribute("aria-current")).toBe(null);
    expect(row("db").getAttribute("data-status")).toBe("unset");
  });

  it("keeps one roving tab stop and selects with Enter or Space", async () => {
    const { api, row } = mount();
    // the first row is the tab stop before anyone asks for another
    expect(api.rowProps("root").tabindex).toBe(0);
    expect(api.rowProps("http").tabindex).toBe(-1);

    row("root").focus();
    await userEvent.keyboard("{ArrowDown}");
    await settle();
    expect(api.rowProps("http").tabindex).toBe(0);
    expect(api.rowProps("root").tabindex).toBe(-1);

    // the host moves DOM focus to the new tab stop, as the demo fixture does
    row("http").focus();
    await userEvent.keyboard("{Enter}");
    expect(api.selectedId()).toBe("http");

    await userEvent.keyboard("{ArrowDown}");
    row("db").focus();
    await userEvent.keyboard(" ");
    expect(api.selectedId()).toBe("db");
    await settle();
    expect(row("db").getAttribute("aria-current")).toBe("true");
  });

  it("the ruler ticks its extent at a nice step and labels the unit", () => {
    const { api, root } = mount();
    const ticks = api.rulerProps.ticks;
    expect(ticks.map((tick) => tick.value)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(ticks.map((tick) => tick.left)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(ticks[1]?.label).toBe("20 ms");
    expect(api.rulerProps["aria-hidden"]).toBe("true");
    expect(root.querySelectorAll('[data-part="tick"]')).toHaveLength(6);

    const seconds = mount(ROWS, "s");
    expect(seconds.api.rulerProps.ticks[1]?.label).toBe("20 s");
  });

  it("an empty row list has an empty extent and no ticks", () => {
    const { api } = mount([]);
    expect(api.extent()).toEqual({ start: 0, end: 0 });
    expect(api.rulerProps.ticks).toEqual([]);
  });
});

describe("createTimeline demo mode", () => {
  it("still answers the old API when no rows are passed", () => {
    const demo = createTimeline({ defaultSelected: 2 });
    expect(demo.rows()).toHaveLength(5);
    expect(demo.treeProps.role).toBe("tree");
    expect(demo.rowProps(1).role).toBe("treeitem");
    expect(demo.selected()).toBe(2);
  });
});
