import { harness } from "@cssints/machine";
import { type Virtualizer, createVirtualizer, settleDefinition } from "../src/virtual";
import { For, Show, createMemo, createSignal, flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { render } from "@solidjs/web";

// Layout and the ResizeObserver need a frame; the primitive's window is a memo,
// so `flush` applies the writes a scroll or a measurement made first.
const frame = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, 0));
  });
const settle = async (): Promise<void> => {
  flush();
  await frame();
  flush();
  await frame();
};

interface MountOptions {
  readonly count: number;
  readonly itemSize?: number | ((index: number) => number) | undefined;
  readonly gap?: number | undefined;
  readonly overscan?: number | undefined;
  readonly estimate?: number | undefined;
  readonly height?: number | undefined;
  /** The DOM height of row `index`; the fixed mode defaults to `itemSize`. */
  readonly rowHeight?: ((index: number) => number) | undefined;
}

interface Mounted {
  readonly api: Virtualizer;
  readonly port: HTMLElement;
  readonly setCount: (count: number) => void;
  /** Rows in the DOM, in column order. */
  readonly rows: () => HTMLElement[];
  readonly row: (index: number) => HTMLElement | undefined;
  readonly spacer: (position: "start" | "end") => HTMLElement | undefined;
  readonly scrollTo: (top: number) => void;
}

const mounted: Array<() => void> = [];

afterEach(() => {
  for (const dispose of mounted.splice(0)) {
    dispose();
  }
});

const mount = (options: MountOptions): Mounted => {
  const gap = options.gap ?? 0;
  const root = document.createElement("div");
  document.body.append(root);
  const [count, setCount] = createSignal(options.count);
  let api: Virtualizer | undefined;
  let port: HTMLElement | undefined;
  let detach: (() => void) | undefined;

  const dispose = render(() => {
    const virtualizer = createVirtualizer({
      get count() {
        return count();
      },
      itemSize: options.itemSize,
      gap,
      overscan: options.overscan,
      estimate: options.estimate,
    });
    api = virtualizer;
    const rows = createMemo(() => {
      const at = virtualizer.window();
      return Array.from({ length: Math.max(0, at.last - at.first + 1) }, (_, step) => {
        return at.first + step;
      });
    });
    const heightOf = (index: number): number =>
      options.rowHeight?.(index) ?? (typeof options.itemSize === "number" ? options.itemSize : 190);

    return (
      <div
        data-part="port"
        {...virtualizer.scrollProps}
        ref={(element) => {
          port = element;
          detach = virtualizer.attach(element);
        }}
        style={{
          height: `${options.height ?? 600}px`,
          overflow: "auto",
          position: "relative",
        }}
      >
        <div
          data-part="column"
          style={{
            display: "flex",
            "flex-direction": "column",
            "row-gap": `${gap}px`,
          }}
        >
          <Show when={virtualizer.window().above > 0}>
            <div data-part="start" {...virtualizer.spacerProps("start")} />
          </Show>
          <For each={rows()}>
            {(index) => (
              <div
                data-part="row"
                data-index={index}
                {...virtualizer.itemProps(index)}
                style={{ height: `${heightOf(index)}px` }}
              >
                {index}
              </div>
            )}
          </For>
          <Show when={virtualizer.window().below > 0}>
            <div data-part="end" {...virtualizer.spacerProps("end")} />
          </Show>
        </div>
      </div>
    );
  }, root);

  if (api === undefined || port === undefined) {
    throw new Error("the virtualizer did not mount");
  }
  const element = port;
  const part = (name: string): HTMLElement | undefined =>
    root.querySelector<HTMLElement>(`[data-part="${name}"]`) ?? undefined;
  const row = (index: number): HTMLElement | undefined =>
    root.querySelector<HTMLElement>(`[data-index="${index}"]`) ?? undefined;

  mounted.push(() => {
    detach?.();
    dispose();
    root.remove();
  });

  return {
    api,
    port: element,
    setCount,
    rows: () => Array.from(root.querySelectorAll<HTMLElement>('[data-part="row"]')),
    row,
    spacer: part,
    scrollTo: (top) => {
      element.scrollTop = top;
      // setting `scrollTop` fires the browser's own event on a later task; the
      // spread handler is the primitive's path, so call it now
      element.dispatchEvent(new Event("scroll"));
      flush();
    },
  };
};

/** The declared indexes, in order. */
const indexes = (mounted: Mounted): number[] =>
  mounted.rows().map((row) => Number(row.dataset["index"]));

describe("createVirtualizer", () => {
  it("declares a window of a 10,000-row list, with the whole content behind it", () => {
    // 40 px rows, 4 px apart: 10,000·40 + 9,999·4 = 439,996
    const m = mount({ count: 10_000, itemSize: 40, gap: 4 });
    const at = m.api.window();

    expect(at.content).toBe(439_996);
    expect(m.port.scrollHeight).toBe(439_996);
    expect(at.first).toBe(0);
    expect(at.above).toBe(0);
    expect(at.last).toBeGreaterThan(at.first);
    expect(m.api.rangeCount()).toBe(at.last - at.first + 1);
    expect(m.api.rangeCount()).toBeLessThan(40);
    expect(indexes(m)).toEqual(
      Array.from({ length: at.last - at.first + 1 }, (_, step) => at.first + step),
    );

    // Every declared row sits where the whole list would have put it, and the
    // ARIA pair names the whole set (10,000), not the window.
    for (const row of m.rows()) {
      const index = Number(row.dataset["index"]);
      expect(row.offsetTop).toBe(index * 44);
      expect(row.getAttribute("aria-posinset")).toBe(String(index + 1));
      expect(row.getAttribute("aria-setsize")).toBe("10000");
    }

    // At the top there is no start spacer (a zero-height box would add its gap).
    expect(m.spacer("start")).toBeUndefined();
    expect(m.api.spacerProps("start").style.height).toBe("0px");
    expect(m.spacer("end")).toBeDefined();
    expect(m.spacer("end")?.offsetHeight).toBe(at.below);
  });

  it("moves the window with the scroll and keeps every offset exact", () => {
    const m = mount({ count: 10_000, itemSize: 40, gap: 4 });
    m.scrollTo(100_000);
    const at = m.api.window();

    // 100,000 / 44 = 2,272.72: the row at the viewport's top, less the overscan
    expect(at.first).toBe(2_270);
    expect(at.last).toBeGreaterThan(2_272);
    expect(at.first).not.toBe(0);
    expect(at.above).toBe(2_270 * 44 - 4);
    expect(at.below).toBeGreaterThan(0);
    expect(m.rows()).not.toHaveLength(0);
    for (const row of m.rows()) {
      expect(row.offsetTop).toBe(Number(row.dataset["index"]) * 44);
    }
    expect(m.spacer("start")?.offsetHeight).toBe(at.above);
    expect(m.rows()[0]?.offsetTop).toBe(at.above + 4);
    expect(m.port.scrollHeight).toBe(at.content);

    // The end: the last row is declared and there is no bottom spacer.
    m.scrollTo(at.content);
    const end = m.api.window();
    expect(end.last).toBe(9_999);
    expect(end.below).toBe(0);
    expect(m.spacer("end")).toBeUndefined();
    expect(m.api.spacerProps("end").style.height).toBe("0px");
    const last = m.row(9_999);
    expect(last).toBeDefined();
    expect(last?.offsetTop).toBe(9_999 * 44);
    expect((last?.offsetTop ?? 0) + (last?.offsetHeight ?? 0)).toBe(end.content);
  });

  it("scrolls to an index far down and declares it", () => {
    const m = mount({ count: 10_000, itemSize: 40, gap: 4 });

    m.api.scrollToIndex(9_000);
    flush();

    // The least scroll that shows the row: its bottom on the viewport's.
    const view = m.port.clientHeight;
    expect(m.port.scrollTop).toBe(9_000 * 44 + 40 - view);
    const at = m.api.window();
    expect(at.first).toBeLessThanOrEqual(9_000);
    expect(at.last).toBeGreaterThanOrEqual(9_000);
    const row = m.row(9_000);
    expect(row).toBeDefined();
    expect(row?.offsetTop).toBe(9_000 * 44);
    expect(row?.getAttribute("aria-posinset")).toBe("9001");

    // An item already fully visible moves nothing.
    m.api.scrollToIndex(9_000);
    flush();
    expect(m.port.scrollTop).toBe(9_000 * 44 + 40 - view);
  });

  it("keeps a measured jump's target while the estimates are corrected", async () => {
    const heightOf = (index: number): number => (index % 2 === 0 ? 40 : 60);
    const m = mount({ count: 2_000, itemSize: () => 30, gap: 4, rowHeight: heightOf });

    // The measuring pass declares every row at the per-row estimate, so the first
    // landing is the estimate's: it cannot know the real heights yet.
    m.api.scrollToIndex(1_900);
    expect(m.row(1_900)).toBeDefined();
    const estimate = m.port.scrollTop;

    await settle();

    // The exact top of 1,900: 950 pairs of 40 + 60, and one gap each.
    const top = 950 * 100 + 1_900 * 4;
    const height = heightOf(1_900);
    const view = m.port.clientHeight;
    // The pending target landed again once the heights were in, so the row's
    // bottom is on the viewport's, not where the estimate put it.
    expect(estimate).not.toBe(top + height - view);
    expect(m.port.scrollTop).toBe(top + height - view);
    const row = m.row(1_900);
    expect(row?.offsetTop).toBe(top);
    expect((row?.offsetTop ?? 0) - m.port.scrollTop).toBe(view - height);

    // The batch that left nothing unknown was the final landing: more frames move nothing and issue no move.
    await settle();
    await settle();
    expect(m.port.scrollTop).toBe(top + height - view);
  });

  it("cancels a pending measured jump when the host scrolls by hand", async () => {
    const m = mount({
      count: 2_000,
      itemSize: () => 30,
      gap: 4,
      rowHeight: (index) => (index % 2 === 0 ? 40 : 60),
    });

    m.api.scrollToIndex(1_900);
    // The reader takes the scroll back before the heights are in.
    m.scrollTo(8_000);
    await settle();

    // The measurement corrected the content, but not the reader's scroll.
    expect(m.port.scrollTop).toBe(8_000);
    expect(m.row(1_900)).toBeUndefined();

    // The target is gone, not merely paused: the heights that arrived after the hand scroll do not land it.
    await settle();
    expect(m.port.scrollTop).toBe(8_000);
  });

  it("supersedes a jump with the last intent, so the earlier landing moves nothing", async () => {
    const m = mount({
      count: 2_000,
      itemSize: () => 30,
      gap: 4,
      rowHeight: (index) => (index % 2 === 0 ? 40 : 60),
    });

    m.api.scrollToIndex(1_900);
    // A second jump before the heights arrive: the first target is superseded, and its landing is stale.
    m.api.scrollToIndex(500);
    await settle();

    // The exact top of 500: 250 pairs, and one gap each; the jump from the top shows the row fully.
    const top = 250 * 100 + 500 * 4;
    const view = m.port.clientHeight;
    expect(m.port.scrollTop).toBe(top + 40 - view);
    flush();
    expect(m.row(500)?.offsetTop).toBe(top);
    expect(m.row(1_900)).toBeUndefined();

    // and the last intent is the one that stays
    await settle();
    expect(m.port.scrollTop).toBe(top + 40 - view);
  });

  it("drops a pending jump when the count shrinks below its target", async () => {
    const m = mount({
      count: 2_000,
      itemSize: () => 30,
      gap: 4,
      rowHeight: (index) => (index % 2 === 0 ? 40 : 60),
    });

    // Unmeasured, so the jump is pending; then the list loses the row it waits for.
    m.api.scrollToIndex(1_900);
    m.setCount(100);
    flush();
    await settle();

    // No height batch landed the dropped target: the scroll stays where the shortened content clamps it, and the
    // window is the new list's.
    const at = m.api.window();
    const landed = m.port.scrollTop;
    expect(landed).toBeLessThanOrEqual(at.content - m.port.clientHeight);
    expect(at.last).toBeLessThanOrEqual(99);
    expect(m.row(1_900)).toBeUndefined();
    await settle();
    expect(m.port.scrollTop).toBe(landed);
  });

  it("lands once, immediately, when every height is already measured", async () => {
    const m = mount({
      count: 200,
      itemSize: () => 30,
      gap: 4,
      rowHeight: (index) => (index % 2 === 0 ? 40 : 60),
    });
    await settle();

    // Every height is in before the jump: the first offset is exact, and no height can correct it later.
    m.api.scrollToIndex(150);
    const top = 75 * 100 + 150 * 4;
    const view = m.port.clientHeight;
    expect(m.port.scrollTop).toBe(top + 40 - view);
    flush();
    expect(m.row(150)?.offsetTop).toBe(top);

    await settle();
    expect(m.port.scrollTop).toBe(top + 40 - view);
  });

  it("does not restart a landing when the same index is asked for again", async () => {
    const m = mount({
      count: 2_000,
      itemSize: () => 30,
      gap: 4,
      rowHeight: (index) => (index % 2 === 0 ? 40 : 60),
    });

    m.api.scrollToIndex(1_900);
    m.api.scrollToIndex(1_900);
    await settle();

    const top = 950 * 100 + 1_900 * 4;
    const view = m.port.clientHeight;
    expect(m.port.scrollTop).toBe(top + 40 - view);
    await settle();
    expect(m.port.scrollTop).toBe(top + 40 - view);
  });

  it("measures once, then virtualises a feed of two heights", async () => {
    const heightOf = (index: number): number => (index % 2 === 0 ? 40 : 60);
    const m = mount({
      count: 200,
      itemSize: () => 30,
      gap: 4,
      rowHeight: heightOf,
    });

    // Nothing measured yet: everything is declared, placed by the per-row
    // estimate (200·30 + 199·4).
    const pass = m.api.window();
    expect(pass.first).toBe(0);
    expect(pass.last).toBe(199);
    expect(m.api.rangeCount()).toBe(200);
    expect(pass.content).toBe(200 * 30 + 199 * 4);

    // The observer delivers every height on the next frame; the pass is over.
    await settle();
    const after = m.api.window();
    const content = 100 * 40 + 100 * 60 + 199 * 4;
    expect(after.content).toBe(content);
    expect(m.api.rangeCount()).toBeLessThan(30);
    expect(m.port.scrollHeight).toBe(content);
    for (const row of m.rows()) {
      const index = Number(row.dataset["index"]);
      // the sum of the heights above it plus one gap each
      const above = Math.floor(index / 2) * 100 + (index % 2) * 40;
      expect(row.offsetTop).toBe(above + index * 4);
    }

    // A row deep in the feed, whose offset is the whole measured column above it.
    m.scrollTo(8_000);
    await settle();
    const deep = m.row(150);
    expect(deep).toBeDefined();
    expect(deep?.offsetTop).toBe(75 * 100 + 150 * 4);
    expect(m.api.rangeCount()).toBeLessThan(30);
  });

  it("takes one estimate for the unmeasured rows when it is given", async () => {
    const m = mount({
      count: 200,
      gap: 4,
      estimate: 100,
      rowHeight: (index) => (index % 2 === 0 ? 40 : 60),
    });

    expect(m.api.window().content).toBe(200 * 100 + 199 * 4);
    await settle();
    expect(m.api.window().content).toBe(100 * 40 + 100 * 60 + 199 * 4);
  });

  it("falls back to the native 190 px before anything is measured", async () => {
    const m = mount({ count: 10, gap: 0, rowHeight: () => 100 });

    expect(m.api.window().content).toBe(10 * 190);
    await settle();
    expect(m.api.window().content).toBe(10 * 100);
  });

  it("drops only the heights past a smaller count", async () => {
    const m = mount({
      count: 200,
      gap: 4,
      rowHeight: (index) => (index % 2 === 0 ? 40 : 60),
    });
    await settle();
    expect(m.api.rangeCount()).toBeLessThan(30);

    // Four rows: their own measured heights are kept, the rest is gone.
    m.setCount(4);
    m.scrollTo(0);
    await settle();
    expect(m.api.window().content).toBe(40 + 60 + 40 + 60 + 3 * 4);
    expect(indexes(m)).toEqual([0, 1, 2, 3]);

    // Growing again leaves 4..199 unknown, so the pass declares them all at the
    // mean of the measured four (50), not the 190 of nothing measured: the stale
    // heights were dropped, not reused. (By the next frame the pass is over.)
    m.setCount(200);
    flush();
    expect(m.api.window().first).toBe(0);
    expect(m.api.window().last).toBe(199);
    expect(m.api.window().content).toBe(4 * 50 + 196 * 50 + 199 * 4);

    await settle();
    expect(m.api.rangeCount()).toBeLessThan(30);
    expect(m.api.window().content).toBe(100 * 40 + 100 * 60 + 199 * 4);
  });
});

// --- the settle machine without a browser -----------------------------------------------------------------------------

/**
 * The machine with a deterministic host: it runs a `land` effect the way the primitive does (the row is the context's,
 * the offset it would write is `row · 10 + 5`) and reports it, so the harness walks the protocol through the same
 * synchronous wiring `createVirtualizer` uses.
 */
const settleHost = () => {
  const h = harness(settleDefinition);
  const lands: Array<{ index: number; final: boolean }> = [];
  const context = () => h.machine.getState().context;
  const phase = () => h.machine.getState().state;
  h.machine.onEffect((handle) => {
    if (handle.type !== "land") {
      return;
    }
    const target = context().target;
    if (target === undefined) {
      return;
    }
    lands.push({ index: target, final: handle.spec["final"] === true });
    h.send({ type: "landed", id: handle.id, offset: target * 10 + 5 });
  });
  return { h, lands, context, phase };
};

/** The `NoStuckState` invariant: `idle` holds no target, and `landing` holds one and a landing (live or reported). */
const noStuckState = (host: ReturnType<typeof settleHost>): void => {
  const { state, context } = host.h.machine.getState();
  expect(["idle", "landing"]).toContain(state);
  if (state === "idle") {
    expect(context.target).toBeUndefined();
    return;
  }
  expect(context.target).toBeDefined();
  expect(
    host.h.machine.effects().some((handle) => handle.type === "land") ||
      context.requested !== undefined,
  ).toBe(true);
};

describe("the settle machine (harness)", () => {
  it("lands on every batch, makes the last one final, and then stops", () => {
    const host = settleHost();
    host.h.send({ type: "seek", index: 900, settled: false });
    expect(host.phase()).toBe("landing");
    expect(host.lands).toEqual([{ index: 900, final: false }]);
    noStuckState(host);

    host.h.send({ type: "measured", settled: false });
    host.h.send({ type: "measured", settled: false });
    expect(host.lands).toHaveLength(3);
    expect(host.lands.every((land) => land.index === 900 && !land.final)).toBe(true);
    noStuckState(host);

    // the batch that leaves nothing unknown: one final landing, and the target is dropped
    host.h.send({ type: "measured", settled: true });
    expect(host.lands).toHaveLength(4);
    expect(host.lands.at(-1)).toEqual({ index: 900, final: true });
    expect(host.phase()).toBe("idle");
    expect(host.context().target).toBeUndefined();
    noStuckState(host);

    // no loop: heights arriving after the final landing do not land again
    host.h.send({ type: "measured", settled: true });
    host.h.send({ type: "measured", settled: false });
    expect(host.lands).toHaveLength(4);
    noStuckState(host);
  });

  it("cancels the pending target on a manual scroll, and later heights do not move it", () => {
    const host = settleHost();
    host.h.send({ type: "seek", index: 900, settled: false });
    const lands = host.lands.length;

    host.h.send({ type: "manual" });
    expect(host.phase()).toBe("idle");
    expect(host.context().target).toBeUndefined();
    noStuckState(host);

    host.h.send({ type: "measured", settled: true });
    host.h.send({ type: "measured", settled: false });
    expect(host.lands).toHaveLength(lands);
    noStuckState(host);
  });

  it("supersedes the first target with the last intent, and a stale landed moves nothing", () => {
    const h = harness(settleDefinition);
    h.send({ type: "seek", index: 100, settled: false });
    const first = h.machine.effects().at(-1);
    h.send({ type: "seek", index: 200, settled: false });
    const second = h.machine.effects().at(-1);

    expect(first?.spec["final"]).toBe(false);
    expect(second?.id).not.toBe(first?.id);
    expect(h.cancelled()).toContain(first?.id);
    expect(h.machine.getState().context.target).toBe(200);

    // the first landing reports late: its handle is gone, so nothing is written and the target stays the last one
    h.send({ type: "landed", id: first?.id as number, offset: 1 });
    expect(h.machine.getState().context.target).toBe(200);
    expect(h.machine.getState().context.requested).toBeUndefined();
    expect(h.log.at(-1)?.cancelled).toBe(true);

    // the live landing is the one that writes
    h.send({ type: "landed", id: second?.id as number, offset: 2 });
    expect(h.machine.getState().context.requested).toBe(2);
    expect(h.machine.getState().state).toBe("landing");
  });

  it("drops a target a shrunk count no longer names, and keeps one it still does", () => {
    const host = settleHost();
    host.h.send({ type: "seek", index: 900, settled: false });

    // the list still has the row: the protocol continues
    host.h.send({ type: "count", total: 901 });
    expect(host.phase()).toBe("landing");
    expect(host.context().target).toBe(900);
    noStuckState(host);

    host.h.send({ type: "count", total: 900 });
    expect(host.phase()).toBe("idle");
    expect(host.context().target).toBeUndefined();

    const lands = host.lands.length;
    host.h.send({ type: "measured", settled: true });
    expect(host.lands).toHaveLength(lands);
    noStuckState(host);
  });

  it("lands exactly once when the jump is already exact, and drops the target", () => {
    const host = settleHost();
    host.h.send({ type: "seek", index: 10, settled: true });

    expect(host.lands).toEqual([{ index: 10, final: true }]);
    expect(host.phase()).toBe("idle");
    expect(host.context().target).toBeUndefined();
    expect(host.context().requested).toBeUndefined();
    noStuckState(host);

    host.h.send({ type: "measured", settled: true });
    expect(host.lands).toHaveLength(1);
  });

  it("does not restart the protocol for a repeated seek of the same row", () => {
    const host = settleHost();
    host.h.send({ type: "seek", index: 900, settled: false });
    expect(host.lands).toHaveLength(1);

    host.h.send({ type: "seek", index: 900, settled: false });
    expect(host.lands).toHaveLength(1);
    expect(host.phase()).toBe("landing");
    noStuckState(host);

    host.h.send({ type: "measured", settled: true });
    expect(host.lands).toHaveLength(2);
    expect(host.lands.at(-1)).toEqual({ index: 900, final: true });
    expect(host.phase()).toBe("idle");
  });
});
