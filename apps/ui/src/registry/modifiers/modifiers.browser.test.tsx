// The modifiers' conformance: the mechanic is `createModifiers`', so what is proved here is the skin's half — the rail is
// a toolbar of one tab stop, the panel is the unit's settings, and the table reads what the stack owns while the values
// stay in the cells. Plus the one thing a starter exists to show: the pointer's routes and the keyboard's are the same.
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { Modifiers, type ModifiersColumn, type ModifiersRow } from "./modifiers.tsx";

const mount = (element: () => JSX.Element) => {
  const root = document.createElement("div");
  document.body.append(root);
  const dispose = render(element, root);
  const instance = {
    root,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
  live.push(instance);
  return instance;
};

const live: Array<{ dispose: () => void }> = [];

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

/** Solid delivers a click through its delegated listener on a later turn. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

const COLUMNS: ReadonlyArray<ModifiersColumn> = [
  { key: "title", label: "Film" },
  { key: "score", label: "Score", numeric: true },
  { key: "gross", label: "Gross", numeric: true },
];

const ROWS: ReadonlyArray<ModifiersRow> = [
  { id: "a", cells: { title: "A", score: 1, gross: 10 } },
  { id: "b", cells: { title: "B", score: 3, gross: 30 } },
  { id: "c", cells: { title: "C", score: 2, gross: 20 } },
];

const mounted = (): { root: HTMLElement } =>
  mount(() => <Modifiers rows={ROWS} columns={COLUMNS} caption="Three films" />);

const button = (root: HTMLElement, text: string): HTMLButtonElement => {
  const found = [...root.querySelectorAll<HTMLButtonElement>("button")].find(
    (candidate) => candidate.textContent?.trim().startsWith(text) === true,
  );
  if (found === undefined) {
    throw new Error(`no button ${text}`);
  }
  return found;
};

const units = (root: HTMLElement): HTMLButtonElement[] => [
  ...root.querySelectorAll<HTMLButtonElement>('[data-part="modifiers-unit"]'),
];
const rail = (root: HTMLElement): HTMLElement =>
  root.querySelector<HTMLElement>('[data-part="modifiers-rail"]')!;
const panel = (root: HTMLElement): HTMLElement | null =>
  root.querySelector<HTMLElement>('[data-part="modifiers-panel"]');
const status = (root: HTMLElement): string =>
  root.querySelector('[data-part="modifiers-status"]')?.textContent?.trim() ?? "";
const rowIds = (root: HTMLElement): string[] =>
  [...root.querySelectorAll<HTMLElement>('[data-part="modifiers-row"]')].map(
    (row) => row.dataset["row"] ?? "",
  );
/** A resolved paint's alpha, whether the browser prints `rgba()` or `oklab(… / a)` — a mix of 0 % is still "none". */
const alphaOf = (paint: string): number => {
  const slash = /\/\s*([\d.]+)\s*\)/.exec(paint);
  if (slash?.[1] !== undefined) {
    return Number(slash[1]);
  }
  const parts = /rgba?\(([^)]+)\)/.exec(paint)?.[1]?.split(",") ?? [];
  return parts.length === 4 ? Number(parts[3]) : 1;
};

const cell = (root: HTMLElement, row: string, index: number): HTMLElement =>
  root
    .querySelector<HTMLElement>(`[data-row="${row}"]`)!
    .querySelectorAll<HTMLElement>('[data-part="modifiers-cell"]')[index]!;

describe("Modifiers", () => {
  it("is a table of values before anything is added, and the rail says it is empty", () => {
    const { root } = mounted();
    expect(root.querySelectorAll('th[scope="col"]')).toHaveLength(2);
    expect(root.querySelectorAll('th[scope="row"]')).toHaveLength(3);
    expect(root.querySelectorAll('[data-part="modifiers-cell"]')).toHaveLength(6);
    expect(root.querySelector("caption")?.textContent).toBe("Three films");
    // every number is the cell's own text: the rail only changes how it is drawn
    expect(
      [...root.querySelectorAll('[data-part="modifiers-cell"]')].map((entry) =>
        entry.textContent?.trim(),
      ),
    ).toEqual(["1", "10", "3", "30", "2", "20"]);
    expect(units(root)).toHaveLength(0);
    expect(root.querySelector('[data-part="modifiers-empty"]')?.textContent).toContain(
      "No transformations yet",
    );
    // the rail is one tab stop, and it is the toolbar the primitive named
    expect(rail(root).getAttribute("role")).toBe("toolbar");
    expect(rail(root).getAttribute("aria-label")).toBe("Table transformations");
  });

  it("tints the cells a Color spans, keeps their values, and announces it", async () => {
    const { root } = mounted();
    expect(alphaOf(getComputedStyle(cell(root, "b", 0)).backgroundColor)).toBe(0);

    await userEvent.click(button(root, "+ Color"));
    await settle();

    expect(units(root)).toHaveLength(1);
    expect(units(root)[0]?.getAttribute("aria-expanded")).toBe("true");
    expect(units(root)[0]?.getAttribute("aria-label")).toBe("Color, applied to Score");
    // the top of the scale is the strongest tint; the bottom is none, and both keep their number
    expect(alphaOf(getComputedStyle(cell(root, "b", 0)).backgroundColor)).toBeGreaterThan(0);
    expect(alphaOf(getComputedStyle(cell(root, "a", 0)).backgroundColor)).toBe(0);
    expect(cell(root, "b", 0).textContent?.trim()).toBe("3");
    expect(status(root)).toBe("Color added, applied to Score");
  });

  it("draws a Size as a bar over the value, and the bar is decoration", async () => {
    const { root } = mounted();
    await userEvent.click(button(root, "+ Size"));
    await settle();

    const bars = (): HTMLElement[] => [
      ...root.querySelectorAll<HTMLElement>('[data-part="modifiers-bar"]'),
    ];
    expect(bars()).toHaveLength(3);
    // the largest value has the full bar, the smallest none of it
    expect(bars()[1]?.style.width).toBe("100%");
    expect(bars()[0]?.style.width).toBe("0%");
    expect(bars()[1]?.getAttribute("aria-hidden")).toBe("true");
    expect(cell(root, "b", 0).textContent?.trim()).toBe("3");
  });

  it("reorders the rows for a Sort, and the values travel with their labels", async () => {
    const { root } = mounted();
    await userEvent.click(button(root, "+ Sort"));
    await settle();

    expect(rowIds(root)).toEqual(["b", "c", "a"]);
    expect(root.querySelector('[data-row="b"] th')?.textContent).toBe("B");
    expect(
      root.querySelector('[data-row="b"] [data-part="modifiers-cell"]')?.textContent?.trim(),
    ).toBe("3");
    expect(status(root)).toBe("Sort added, applied to Score");
  });

  it("opens the unit's settings: the span, the input column, and the stack's moves", async () => {
    const { root } = mounted();
    const open = (): HTMLElement => panel(root) as HTMLElement;

    await userEvent.click(button(root, "+ Color"));
    await settle();
    expect(open().textContent).toContain("Color, applied to Score");
    // one checkbox per column the vocabulary knows, one radio per column the unit spans
    expect(open().querySelectorAll('input[type="checkbox"]')).toHaveLength(2);
    expect(open().querySelectorAll('input[type="radio"]')).toHaveLength(2);

    const gross = [...open().querySelectorAll<HTMLInputElement>('input[type="checkbox"]')][1]!;
    await userEvent.click(gross);
    await settle();
    expect(units(root)[0]?.textContent).toContain("Color");
    expect(units(root)[0]?.getAttribute("aria-label")).toBe("Color, applied to Score, Gross");
    expect(status(root)).toBe("Color, applied to Score, Gross");

    const lock = [...open().querySelectorAll<HTMLInputElement>('input[type="radio"]')][1]!;
    await userEvent.click(lock);
    await settle();
    expect(status(root)).toBe("Color, locked to Score");
    expect(open().textContent).toContain("locked to Score");
  });

  it("joins two units into one sequence, splits it back, and moves it in the stack", async () => {
    const { root } = mounted();
    await userEvent.click(button(root, "+ Color"));
    await settle();
    await userEvent.click(button(root, "+ Size"));
    await settle();
    expect(units(root).map((entry) => entry.textContent?.trim())).toEqual(["Color1", "Size1"]);

    await userEvent.click(button(root, "Join with above"));
    await settle();
    expect(units(root)).toHaveLength(1);
    expect(units(root)[0]?.getAttribute("aria-label")).toBe("Color + Size, applied to Score");
    expect(status(root)).toBe("2 modifiers joined");

    await userEvent.click(button(root, "Split"));
    await settle();
    expect(units(root)).toHaveLength(2);
    expect(status(root)).toBe("joined unit split");

    // the split kept the joined id on its first piece, so the panel is still that unit's
    await userEvent.click(button(root, "Move down"));
    await settle();
    expect(units(root).map((entry) => entry.getAttribute("aria-label"))).toEqual([
      "Size, applied to Score",
      "Color, applied to Score",
    ]);
    expect(status(root)).toBe("Color moved to position 2 of 2");

    await userEvent.click(button(root, "Remove"));
    await settle();
    expect(units(root)).toHaveLength(1);
    expect(panel(root)).toBeNull();
  });

  it("is one tab stop, and Alt+Arrow reorders the stack from the keyboard", async () => {
    const { root } = mounted();
    await userEvent.click(button(root, "+ Color"));
    await settle();
    await userEvent.click(button(root, "+ Size"));
    await settle();

    const [first, second] = units(root);
    // the tab stop is the unit the reader last touched: the one just added
    expect(first?.tabIndex).toBe(-1);
    expect(second?.tabIndex).toBe(0);

    second?.focus();
    await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");
    await settle();

    expect(units(root).map((entry) => entry.getAttribute("aria-label"))).toEqual([
      "Size, applied to Score",
      "Color, applied to Score",
    ]);
    expect(status(root)).toBe("Size moved to position 1 of 2");
    // the moved unit kept the focus, and the panel followed it
    expect(document.activeElement).toBe(units(root)[0]);
    expect(panel(root)?.textContent).toContain("Size, applied to Score");
  });
});
