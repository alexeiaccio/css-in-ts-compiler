import { afterEach, describe, expect, it } from "vite-plus/test";

import { TODAY, mountDatePicker, type DatePickerMounted } from "./date-picker.fixture";
import { datePickerDriver, settle } from "./date-picker-driver.ts";

const live: DatePickerMounted[] = [];

const mounted = (
  options: Parameters<typeof mountDatePicker>[0] = {},
): ReturnType<typeof datePickerDriver> & DatePickerMounted => {
  const instance = mountDatePicker(options);
  live.push(instance);
  return { ...datePickerDriver(instance), ...instance };
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

describe("Date picker (the kit's DOM)", () => {
  it("opens from the trigger into a portalled dialog around a named grid", async () => {
    const { root, picker, trigger, content, grid, title, rows, weekdays, days, roving, open } =
      mounted();
    expect(trigger().getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(trigger().getAttribute("aria-label")).toBe("Choose date");
    expect(content().hidden).toBe(true);

    await open();

    expect(root.contains(content())).toBe(false);
    expect(content().parentElement).toBe(document.body);
    expect(content().getAttribute("role")).toBe("dialog");
    expect(content().getAttribute("aria-modal")).toBeNull();
    expect(content().getAttribute("aria-labelledby")).toBe(title().id);
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(grid().getAttribute("role")).toBe("grid");
    expect(grid().getAttribute("aria-rowcount")).toBe("6");
    expect(grid().getAttribute("aria-colcount")).toBe("7");
    expect(grid().getAttribute("aria-labelledby")).toBe(title().id);
    expect(title().textContent).toBe("October 2026");
    // 2026-10-01 is a Thursday, so the Monday-first window opens on 28 September
    expect(picker.monthDays()[0]?.[0]).toBe("2026-09-28");
    expect(rows()).toHaveLength(7);
    expect(weekdays()).toHaveLength(7);
    expect(weekdays()[0]?.getAttribute("role")).toBe("columnheader");
    expect(weekdays()[0]?.textContent).toBe("Mon");
    expect(days()).toHaveLength(42);
    // the roving tab stop is today, and opening took the DOM focus there
    expect(roving()?.textContent).toBe("15");
    expect(document.activeElement).toBe(roving());
  });

  it("places the panel under the trigger and paints it as a popover surface", async () => {
    const { trigger, content, open, style } = mounted();
    await open();
    await settle();
    const anchor = trigger().getBoundingClientRect();
    const panel = content().getBoundingClientRect();
    expect(Math.round(panel.top - window.scrollY)).toBe(Math.round(anchor.bottom + 4));
    const surface = style(content());
    expect(surface.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(surface.borderTopWidth).toBe("1px");
    expect(surface.boxShadow).not.toBe("none");
    expect(surface.zIndex).toBe("10");
  });

  it("moves the focus and the roving stop by a day with the arrows", async () => {
    const { open, press, roving } = mounted();
    await open();
    const start = document.activeElement as HTMLElement;
    expect(start.textContent).toBe("15");
    expect(start.getAttribute("tabindex")).toBe("0");

    // the cursor move re-renders the month's cells, so the assertions read the element the focus landed on, not the old one
    await press("ArrowRight");
    const next = document.activeElement as HTMLElement;
    expect(next.textContent).toBe("16");
    expect(next.getAttribute("tabindex")).toBe("0");
    expect(roving()).toBe(next);

    await press("ArrowDown");
    expect((document.activeElement as HTMLElement).textContent).toBe("23");
    expect((document.activeElement as HTMLElement).getAttribute("tabindex")).toBe("0");
  });

  it("chooses the focused day, closes, labels the trigger and returns the focus", async () => {
    const { trigger, content, status, open, press } = mounted();
    await open();
    await press("ArrowRight");
    await press("Enter");

    expect(content().hidden).toBe(true);
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(trigger().textContent).toBe("2026-10-16");
    expect(document.activeElement).toBe(trigger());
    // the announcement is the primitive's polite region, which the kit renders visually hidden
    expect(status().textContent).toBe("2026-10-16");
    expect(status().getAttribute("role")).toBe("status");
  });

  it("pages the month with the nav buttons and keeps the roving day", async () => {
    const { content, title, next, previous, open, click, days, roving } = mounted();
    await open();
    expect(title().textContent).toBe("October 2026");

    await click(next());
    expect(content().hidden).toBe(false);
    expect(title().textContent).toBe("November 2026");
    expect(days()).toHaveLength(42);
    // the cursor moved with the month and the DOM focus went to the new roving day
    expect(roving()?.textContent).toBe("15");
    expect(document.activeElement).toBe(roving());

    await click(previous());
    expect(title().textContent).toBe("October 2026");
  });

  it("paints the chosen day and today from their announcements", async () => {
    const { open, days, roving, style } = mounted({ defaultValue: "2026-10-10" });
    await open();
    const chosen = days().find((day) => day.getAttribute("aria-selected") === "true");
    const today = days().find((day) => day.getAttribute("aria-current") === "date");
    expect(chosen?.textContent).toBe("10");
    expect(roving()).toBe(chosen);
    expect(today?.textContent).toBe("15");
    // the chosen day has the highlight; today only a ring, so the two announcements paint differently
    const plain = chosen?.nextElementSibling as HTMLElement;
    expect(style(chosen as HTMLElement).backgroundColor).not.toBe(style(plain).backgroundColor);
    expect(style(today as HTMLElement).boxShadow).not.toBe("none");
    expect(style(today as HTMLElement).boxShadow).not.toBe(style(plain).boxShadow);
  });

  it("marks the days outside min and max as disabled, and refuses them", async () => {
    const { trigger, content, status, open, press, click, days, style } = mounted({
      defaultValue: "2026-10-15",
      min: "2026-10-10",
      max: "2026-10-20",
    });
    await open();
    const day = (text: string): HTMLElement | undefined =>
      days().find((cell) => cell.textContent === text);
    expect(day("9")?.getAttribute("aria-disabled")).toBe("true");
    expect(day("21")?.getAttribute("aria-disabled")).toBe("true");
    expect(day("10")?.getAttribute("aria-disabled")).toBeNull();
    expect(day("20")?.getAttribute("aria-disabled")).toBeNull();
    expect(style(day("9") as HTMLElement).cursor).toBe("not-allowed");
    expect(style(day("10") as HTMLElement).cursor).toBe("pointer");

    // a disabled day takes no click: no value, no close
    await click(day("9") as HTMLElement);
    expect(content().hidden).toBe(false);
    expect(trigger().textContent).toBe("2026-10-15");

    // Enter on the enabled roving day chooses it and closes
    await press("Enter");
    expect(content().hidden).toBe(true);
    expect(status().textContent).toBe(TODAY);
    expect(trigger().textContent).toBe("2026-10-15");
  });
});
