import { For, createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { render } from "@solidjs/web";
import { userEvent } from "vite-plus/test/browser";
import { type DatePicker, type DatePickerLabels, createDatePicker } from "../src/date-picker";

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

interface MountOptions {
  readonly value?: string | undefined;
  /** The host owns the value and ignores the request (a controlled picker that says no). */
  readonly controlled?: boolean;
  readonly today?: string | undefined;
  readonly min?: string | undefined;
  readonly max?: string | undefined;
  readonly firstDayOfWeek?: number | undefined;
  readonly labels?: Partial<DatePickerLabels> | undefined;
}

interface Mounted {
  readonly picker: DatePicker;
  readonly root: HTMLElement;
  readonly changes: string[];
  readonly dispose: () => void;
}

const OCTOBER = "2026-10-15";

const mount = (options: MountOptions = {}): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const [host, setHost] = createSignal<string | undefined>(options.value);
  const changes: string[] = [];
  let picker: DatePicker | undefined;
  let triggerEl: HTMLButtonElement | undefined;
  let contentEl: HTMLDivElement | undefined;
  let detach: (() => void) | undefined;

  const attachOnce = (): void => {
    if (triggerEl !== undefined && contentEl !== undefined && detach === undefined) {
      detach = picker?.attach(triggerEl, contentEl);
    }
  };

  const dispose = render(() => {
    const created = createDatePicker({
      get value() {
        return options.controlled === true ? host() : undefined;
      },
      defaultValue: options.value,
      min: options.min,
      max: options.max,
      today: options.today ?? OCTOBER,
      firstDayOfWeek: options.firstDayOfWeek,
      labels: options.labels,
      onValueChange: (iso) => {
        changes.push(iso);
        if (options.controlled !== true) {
          setHost(iso);
        }
      },
    });
    picker = created;
    return (
      <>
        <button data-part="before" type="button">
          Before
        </button>
        <button
          data-part="trigger"
          {...created.triggerProps}
          ref={(element) => {
            triggerEl = element;
            attachOnce();
          }}
        >
          {created.value() ?? created.labels.trigger}
        </button>
        <div
          data-part="popover"
          {...created.popoverProps}
          ref={(element) => {
            contentEl = element;
            attachOnce();
          }}
        >
          <div>
            <h2 data-part="title" {...created.headerProps}>
              {created.headerProps.text}
            </h2>
            <button data-part="previous" {...created.previousProps}>
              {"<"}
            </button>
            <button data-part="next" {...created.nextProps}>
              {">"}
            </button>
          </div>
          <div data-part="grid" {...created.gridProps}>
            <div role="row">
              <For each={Array.from({ length: 7 }, (_, index) => index)}>
                {(index) => <div data-part="weekday" {...created.weekdayProps(index)} />}
              </For>
            </div>
            <For each={created.monthDays()}>
              {(week) => (
                <div role="row">
                  <For each={week}>
                    {(iso) => (
                      <div data-date={iso} {...created.cellProps(iso)}>
                        {iso.slice(8)}
                      </div>
                    )}
                  </For>
                </div>
              )}
            </For>
          </div>
        </div>
        <div data-part="status" {...created.statusProps}>
          {created.status()}
        </div>
      </>
    );
  }, root);

  if (picker === undefined) {
    throw new Error("mount: the picker did not render");
  }
  return {
    picker,
    root,
    changes,
    dispose: () => {
      detach?.();
      dispose();
      root.remove();
    },
  };
};

const part = <T extends HTMLElement = HTMLElement>(root: HTMLElement, name: string): T => {
  const element = root.querySelector<T>(`[data-part="${name}"]`);
  if (element === null) {
    throw new Error(`mount: no ${name}`);
  }
  return element;
};

const triggerOf = (root: HTMLElement): HTMLButtonElement =>
  part<HTMLButtonElement>(root, "trigger");

const cell = (root: HTMLElement, iso: string): HTMLElement => {
  const element = root.querySelector<HTMLElement>(`[data-date="${iso}"]`);
  if (element === null) {
    throw new Error(`mount: no cell ${iso}`);
  }
  return element;
};

/** The day carrying the roving tab stop. */
const roving = (root: HTMLElement): HTMLElement | null =>
  root.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]');

const focusedDate = (root: HTMLElement): string | null => {
  const active = document.activeElement;
  return active instanceof HTMLElement && root.contains(active)
    ? (active.dataset["date"] ?? null)
    : null;
};

const open = async (root: HTMLElement): Promise<void> => {
  await userEvent.click(triggerOf(root));
  await tick();
};

const press = async (key: string, init: KeyboardEventInit = {}): Promise<KeyboardEvent> => {
  const target =
    document.activeElement instanceof HTMLElement ? document.activeElement : document.body;
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  await tick();
  return event;
};

const openOf = (root: HTMLElement): boolean => !part(root, "popover").hidden;

const live: Mounted[] = [];

const mounted = (options: MountOptions = {}): Mounted => {
  const instance = mount(options);
  live.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

describe("createDatePicker (real DOM)", () => {
  it("opens from the trigger into a grid named by the month", async () => {
    const { root, picker } = mounted();
    const trigger = triggerOf(root);
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-label")).toBe("Choose date");
    expect(openOf(root)).toBe(false);

    await open(root);

    const popover = part(root, "popover");
    const grid = part(root, "grid");
    const header = part(root, "title");
    expect(popover.getAttribute("role")).toBe("dialog");
    expect(popover.getAttribute("aria-modal")).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(grid.getAttribute("role")).toBe("grid");
    expect(grid.getAttribute("aria-rowcount")).toBe("6");
    expect(grid.getAttribute("aria-colcount")).toBe("7");
    expect(grid.getAttribute("aria-labelledby")).toBe(picker.headerProps.id);
    expect(grid.getAttribute("aria-labelledby")).toBe(header.id);
    expect(header.textContent).toBe("October 2026");
    // 2026-10-01 is a Thursday, so the Monday-first window opens on 28 September
    expect(picker.monthDays()[0]?.[0]).toBe("2026-09-28");
    expect(picker.monthDays()).toHaveLength(6);
    expect(picker.monthDays()[5]).toHaveLength(7);
    expect(root.querySelectorAll('[role="gridcell"]')).toHaveLength(42);
    expect(part(root, "weekday").getAttribute("role")).toBe("columnheader");
    expect(part(root, "weekday").getAttribute("abbr")).toBe("Mon");
    expect(document.activeElement).toBe(cell(root, OCTOBER));
  });

  it("moves the roving day and the focus by a day and a week", async () => {
    const { root } = mounted();
    await open(root);
    expect(roving(root)).toBe(cell(root, "2026-10-15"));

    await press("ArrowRight");
    expect(focusedDate(root)).toBe("2026-10-16");
    expect(roving(root)).toBe(cell(root, "2026-10-16"));
    expect(cell(root, "2026-10-15").getAttribute("tabindex")).toBe("-1");

    await press("ArrowDown");
    expect(focusedDate(root)).toBe("2026-10-23");
    await press("ArrowLeft");
    expect(focusedDate(root)).toBe("2026-10-22");
    await press("ArrowUp");
    expect(focusedDate(root)).toBe("2026-10-15");

    // leaving the month pages the grid to the month it landed in
    for (let step = 0; step < 14; step += 1) {
      await press("ArrowLeft");
    }
    expect(focusedDate(root)).toBe("2026-10-01");
    expect(part(root, "title").textContent).toBe("October 2026");
    await press("ArrowLeft");
    expect(focusedDate(root)).toBe("2026-09-30");
    expect(part(root, "title").textContent).toBe("September 2026");
  });

  it("moves to the first and the last day of the week with Home and End", async () => {
    const { root } = mounted();
    await open(root);

    await press("Home");
    expect(focusedDate(root)).toBe("2026-10-12");
    await press("End");
    expect(focusedDate(root)).toBe("2026-10-18");
    await press("ArrowRight");
    await press("Home");
    // Home on the last day of the week: the first row of the next one
    expect(focusedDate(root)).toBe("2026-10-19");
  });

  it("pages the month with PageUp / PageDown and the year with Shift", async () => {
    const { root, picker } = mounted();
    await open(root);

    await press("PageDown");
    expect(picker.month()).toEqual({ year: 2026, month: 10 });
    expect(part(root, "title").textContent).toBe("November 2026");
    expect(focusedDate(root)).toBe("2026-11-15");
    expect(roving(root)).toBe(cell(root, "2026-11-15"));

    await press("PageUp");
    expect(part(root, "title").textContent).toBe("October 2026");
    expect(focusedDate(root)).toBe("2026-10-15");

    await press("PageUp", { shiftKey: true });
    expect(picker.month()).toEqual({ year: 2025, month: 9 });
    expect(part(root, "title").textContent).toBe("October 2025");
    expect(focusedDate(root)).toBe("2025-10-15");

    await press("PageDown", { shiftKey: true });
    expect(part(root, "title").textContent).toBe("October 2026");
  });

  it("clamps the day when paging to a shorter month", async () => {
    const { root, picker } = mounted({ value: "2026-01-31" });
    await open(root);
    expect(focusedDate(root)).toBe("2026-01-31");

    await press("PageDown");
    expect(focusedDate(root)).toBe("2026-02-28");
    expect(picker.month()).toEqual({ year: 2026, month: 1 });
  });

  it("selects the focused day on Enter and closes, returning focus to the trigger", async () => {
    const { root, picker } = mounted({ value: "2026-10-10" });
    await open(root);
    expect(focusedDate(root)).toBe("2026-10-10");

    await press("ArrowRight");
    await press("Enter");

    expect(openOf(root)).toBe(false);
    expect(triggerOf(root).getAttribute("aria-expanded")).toBe("false");
    expect(picker.value()).toBe("2026-10-11");
    expect(part(root, "status").textContent).toBe("2026-10-11");
    expect(document.activeElement).toBe(triggerOf(root));

    // reopening keeps the chosen day as the roving stop
    await open(root);
    expect(focusedDate(root)).toBe("2026-10-11");
  });

  it("selects the focused day on Space too", async () => {
    const { root, picker } = mounted({ value: "2026-10-10" });
    await open(root);
    await press(" ");
    expect(openOf(root)).toBe(false);
    expect(picker.value()).toBe("2026-10-10");
  });

  it("closes on Escape without changing the value", async () => {
    const { root, picker, changes } = mounted({ value: "2026-10-10" });
    await open(root);
    await press("ArrowRight");
    expect(focusedDate(root)).toBe("2026-10-11");

    await press("Escape");

    expect(openOf(root)).toBe(false);
    expect(picker.value()).toBe("2026-10-10");
    expect(changes).toEqual([]);
    expect(document.activeElement).toBe(triggerOf(root));
  });

  it("marks the chosen day aria-selected and today aria-current", async () => {
    const { root } = mounted({ value: "2026-10-10", today: "2026-10-15" });
    await open(root);

    expect(cell(root, "2026-10-10").getAttribute("aria-selected")).toBe("true");
    expect(cell(root, "2026-10-10").getAttribute("aria-current")).toBeNull();
    expect(cell(root, "2026-10-15").getAttribute("aria-current")).toBe("date");
    expect(cell(root, "2026-10-15").getAttribute("aria-selected")).toBe("false");
    expect(cell(root, "2026-10-11").getAttribute("aria-selected")).toBe("false");
    expect(cell(root, "2026-10-11").getAttribute("aria-current")).toBeNull();
  });

  it("disables the days outside min and max and refuses to select them", async () => {
    const { root, picker } = mounted({
      value: "2026-10-15",
      min: "2026-10-10",
      max: "2026-10-20",
    });
    await open(root);

    expect(cell(root, "2026-10-09").getAttribute("aria-disabled")).toBe("true");
    expect(cell(root, "2026-10-21").getAttribute("aria-disabled")).toBe("true");
    expect(cell(root, "2026-10-10").getAttribute("aria-disabled")).toBeNull();
    expect(cell(root, "2026-10-20").getAttribute("aria-disabled")).toBeNull();
    expect(cell(root, "2026-10-09").getAttribute("tabindex")).toBe("-1");

    // a pointer click on a disabled day does nothing, not even a close (the
    // raw DOM click, because a test driver refuses to click aria-disabled)
    cell(root, "2026-10-09").click();
    await tick();
    expect(picker.value()).toBe("2026-10-15");
    expect(openOf(root)).toBe(true);

    // the value is the roving stop; it cannot walk out of the bounds
    picker.select("2026-10-10");
    picker.closePicker();
    await tick();
    await open(root);
    expect(focusedDate(root)).toBe("2026-10-10");
    await press("ArrowLeft");
    expect(focusedDate(root)).toBe("2026-10-10");
    await press("ArrowLeft");
    expect(focusedDate(root)).toBe("2026-10-10");

    picker.select("2026-10-09");
    await tick();
    expect(picker.value()).toBe("2026-10-10");

    // a click inside the bounds selects and closes
    await userEvent.click(cell(root, "2026-10-12"));
    await tick();
    expect(picker.value()).toBe("2026-10-12");
    expect(openOf(root)).toBe(false);
  });

  it("counts the days of a leap February and a common one", async () => {
    const { picker } = mounted({ today: "2024-02-10" });
    picker.setMonth(2024, 1);
    await tick();
    expect(
      picker
        .monthDays()
        .flat()
        .filter((iso) => iso.startsWith("2024-02")),
    ).toHaveLength(29);
    expect(picker.monthDays().flat()).toContain("2024-02-29");
    expect(
      picker
        .monthDays()
        .flat()
        .filter((iso) => iso.startsWith("2024-01")),
    ).toHaveLength(3);

    picker.setMonth(2023, 1);
    await tick();
    expect(
      picker
        .monthDays()
        .flat()
        .filter((iso) => iso.startsWith("2023-02")),
    ).toHaveLength(28);
    expect(picker.monthDays().flat()).not.toContain("2023-02-29");
    expect(
      picker
        .monthDays()
        .flat()
        .filter((iso) => iso.startsWith("2023-03")),
    ).toHaveLength(12);
  });

  it("puts the roving tab stop on the 1st when today is not in the shown month", async () => {
    const { root, picker } = mounted({ today: "2026-10-15" });
    picker.setMonth(2026, 11);
    await tick();
    await open(root);

    expect(part(root, "title").textContent).toBe("December 2026");
    expect(roving(root)).toBe(cell(root, "2026-12-01"));
    expect(focusedDate(root)).toBe("2026-12-01");
  });

  it("skips a min that cuts the 1st off when placing the roving stop", async () => {
    const { root } = mounted({ today: "2026-12-01", min: "2026-12-05" });
    await open(root);
    expect(roving(root)).toBe(cell(root, "2026-12-05"));
    expect(focusedDate(root)).toBe("2026-12-05");
  });

  it("takes the first day of the week and the month formatter", async () => {
    const { root } = mounted({
      firstDayOfWeek: 0,
      value: "2026-10-15",
      labels: {
        trigger: "Choisir une date",
        previousMonth: "Mois précédent",
        nextMonth: "Mois suivant",
        month: (year, month) => `${month + 1}/${year}`,
        weekdays: ["D", "L", "M", "M", "J", "V", "S"],
        day: (iso) => `le ${iso}`,
      },
    });
    await open(root);
    expect(triggerOf(root).getAttribute("aria-label")).toBe("Choisir une date");
    expect(part(root, "previous").getAttribute("aria-label")).toBe("Mois précédent");
    expect(part(root, "next").getAttribute("aria-label")).toBe("Mois suivant");
    expect(part(root, "title").textContent).toBe("10/2026");
    expect(part(root, "weekday").getAttribute("abbr")).toBe("D");
    expect(cell(root, "2026-10-15").getAttribute("tabindex")).toBe("0");

    await press("Enter");
    expect(part(root, "status").textContent).toBe("le 2026-10-15");
  });

  it("requests in controlled mode and keeps the host's value when it says no", async () => {
    const { root, picker, changes } = mounted({ value: "2026-10-10", controlled: true });
    await open(root);
    expect(focusedDate(root)).toBe("2026-10-10");

    await press("ArrowRight");
    await press("Enter");

    expect(changes).toEqual(["2026-10-11"]);
    expect(picker.value()).toBe("2026-10-10");
    expect(cell(root, "2026-10-10").getAttribute("aria-selected")).toBe("true");
    expect(cell(root, "2026-10-11").getAttribute("aria-selected")).toBe("false");

    await open(root);
    expect(focusedDate(root)).toBe("2026-10-10");
  });
});
