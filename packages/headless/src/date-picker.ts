import { type Accessor, createEffect, createMemo, createSignal, createUniqueId } from "solid-js";
import { createControllable } from "./controllable";
import { type GridProps, createGrid } from "./grid";
import { type PopoverContentProps, type PopoverStyle, createPopover } from "./popover";
import { type StatusProps, createStatus } from "./status";

/**
 * A date picker as a composition: `createPopover` (a non-modal trigger + popup)
 * around a `createGrid` month (6 rows x 7 columns), with `createStatus` for the
 * selected day. No new primitive and no Quint spec: the research
 * (`docs/research/compositions-2026-10.md`, "Date picker") settles it as
 * `combobox-dialog` + the grid, and the calendar maths here is day numbers.
 *
 * **The day-number model.** A date is its index in days since 1970-01-01 in
 * UTC: `Date.UTC(year, month, day) / 86_400_000`. Parsing a month length, a
 * weekday or a leap day is then one `Date` read, and moving by a day, a week
 * or a year is integer addition. There is no locale arithmetic and no
 * `@internationalized/date`: a host with real calendars (Hebrew, Islamic, buddhist
 * eras) brings its own library and passes its ISO strings here. Treating a
 * `YYYY-MM-DD` as a UTC midnight is the honest model for a civil date with no
 * time and no zone; `today` is read off the local clock and injected, so a test
 * never depends on when it runs.
 *
 * **The grid paints the neighbouring days, not blanks.** The 42 cells are the
 * six weeks around the month, so the first row can start in the previous month
 * and the last row can end in the next one. Every cell is a real, focusable
 * date (a blank cell cannot hold the roving focus), and a cursor that leaves
 * the month pages the grid to the month it landed in: ← on the 1st is the last
 * day of the previous month, and the title follows it.
 *
 * **Not modal.** The picker is `createPopover`, not `createDialogModal`: nothing
 * behind it is `inert`, nothing traps Tab, and Tab leaves the popup — which is
 * what the keyboard contract asks for. The modal dialog exists for surfaces
 * that keep the user until they answer; a date picker is one field.
 *
 * **Not a text field.** A segmented date field is a host composition of
 * `createField` + `createSpinbutton` over these same day numbers, not part of
 * this PR. The trigger shows the formatted value; this module names it.
 */

/** Everything the host reads off a date; all dates are ISO `YYYY-MM-DD`. */
export interface DatePickerLabels {
  /** The trigger's accessible name; defaults to "Choose date". */
  readonly trigger: string;
  readonly previousMonth: string;
  readonly nextMonth: string;
  /** The month title; `month` is 0-11. Defaults to "October 2026". */
  readonly month: (year: number, month: number) => string;
  /** Seven short weekday names in `getUTCDay()` order: Sunday first. */
  readonly weekdays: ReadonlyArray<string>;
  /** A day's name for the announcement; defaults to the ISO string. */
  readonly day: (iso: string) => string;
}

export interface DatePickerOptions {
  /** Controlled: the host owns the value and this is the only thing that changes it. */
  readonly value?: string | undefined;
  /** Uncontrolled starting value; ignored while `value` is set. */
  readonly defaultValue?: string | undefined;
  /** A request to change the value, called when the intent differs. */
  readonly onValueChange?: ((iso: string) => void) | undefined;
  /** The first selectable day, inclusive. */
  readonly min?: string | undefined;
  /** The last selectable day, inclusive. */
  readonly max?: string | undefined;
  /** "Today", injected so a test never reads the clock; defaults to the local date. */
  readonly today?: string | undefined;
  /** Controlled: the host owns the open state and this is the only thing that changes it. */
  readonly open?: boolean | undefined;
  /** A request to change the open state, called when the intent differs. */
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  readonly labels?: Partial<DatePickerLabels> | undefined;
  readonly id?: string | undefined;
  /** 0 = Sunday .. 6 = Saturday. @default 1 (Monday) */
  readonly firstDayOfWeek?: number | undefined;
}

export interface DatePickerTriggerProps {
  readonly id: string;
  readonly "aria-haspopup": "dialog";
  readonly "aria-expanded": "true" | "false";
  readonly "aria-controls": string;
  /** `labels.trigger`; the visible value is the host's text. */
  readonly "aria-label": string;
  readonly onClick: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

/** A non-modal dialog (`aria-modal` is always absent). */
export type DatePickerPopoverProps = PopoverContentProps & {
  readonly "aria-labelledby": string;
};

export interface DatePickerHeaderProps {
  readonly id: string;
  /** `labels.month(year, month)`; render it as the title. */
  readonly text: string;
}

export interface DatePickerNavProps {
  readonly type: "button";
  readonly "aria-label": string;
  readonly onClick: () => void;
}

export interface DatePickerWeekdayProps {
  readonly role: "columnheader";
  readonly abbr: string;
}

export interface DatePickerCellProps {
  readonly role: "gridcell";
  readonly id: string;
  readonly "aria-rowindex": number;
  readonly "aria-colindex": number;
  /** `0` on the roving day only. */
  readonly tabindex: number;
  readonly "aria-selected": "true" | "false";
  readonly "aria-current": "date" | undefined;
  readonly "aria-disabled": "true" | undefined;
  readonly onClick: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

export interface DatePicker {
  readonly value: Accessor<string | undefined>;
  readonly open: Accessor<boolean>;
  readonly openPicker: () => void;
  readonly closePicker: () => void;
  /** The month shown, 0-11. */
  readonly month: Accessor<{ readonly year: number; readonly month: number }>;
  /** Shows a month and puts the roving day at the value, today or the 1st. */
  readonly setMonth: (year: number, month: number) => void;
  readonly today: Accessor<string>;
  /** Selects a day (no-op outside min/max); the host closes. */
  readonly select: (iso: string) => void;
  /** 6 rows of 7 ISO dates: the shown month plus the neighbouring days. */
  readonly monthDays: Accessor<ReadonlyArray<ReadonlyArray<string>>>;
  readonly labels: DatePickerLabels;
  readonly status: Accessor<string | undefined>;
  readonly statusProps: StatusProps;
  readonly triggerProps: DatePickerTriggerProps;
  readonly popoverProps: DatePickerPopoverProps;
  /** `style` for the popup element: the popover's last measure, in page space. */
  readonly contentStyle: Accessor<PopoverStyle>;
  readonly headerProps: DatePickerHeaderProps;
  readonly previousProps: DatePickerNavProps;
  readonly nextProps: DatePickerNavProps;
  readonly gridProps: GridProps & { readonly "aria-labelledby": string };
  readonly weekdayProps: (index: number) => DatePickerWeekdayProps;
  readonly cellProps: (iso: string) => DatePickerCellProps;
  /**
   * DOM wiring for the popover: place it, light-dismiss it, move focus to the
   * roving day on open and back to the trigger on close. Call it from a ref and
   * call the teardown it returns on cleanup.
   */
  readonly attach: (trigger: HTMLElement, content: HTMLElement) => () => void;
}

const DAY_MS = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DateParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

/** The day number: UTC days since 1970-01-01, integer. */
const dayNumber = (year: number, month: number, day: number): number =>
  Math.round(Date.UTC(year, month, day) / DAY_MS);

const isoOf = (index: number): string => {
  const date = new Date(index * DAY_MS);
  const year = String(date.getUTCFullYear()).padStart(4, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const partsOf = (iso: string): DateParts | undefined => {
  const match = ISO_DATE.exec(iso);
  if (match === null) {
    return undefined;
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3]),
  };
};

/** 0 = Sunday, as `getUTCDay()` gives it. */
const weekdayOf = (index: number): number => new Date(index * DAY_MS).getUTCDay();

/** 28, 29, 30 or 31, leap years included: `Date` knows, so we do not. */
const monthLength = (year: number, month: number): number =>
  new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

const pad = (value: number): string => String(value).padStart(2, "0");

const localToday = (): string => {
  const now = new Date();
  return `${String(now.getFullYear()).padStart(4, "0")}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const defaultMonthLabel = (year: number, month: number): string => `${MONTHS[month] ?? ""} ${year}`;

/**
 * The picker. Read the module comment for the day-number model, the 42 painted
 * cells and why the popup is not modal.
 *
 * Keyboard, on the focused day: ← / → the previous / next day, ↑ / ↓ the
 * previous / next week, Home / End the first / last day of the week, PageUp /
 * PageDown the previous / next month, Shift+PageUp / Shift+PageDown the
 * previous / next year (the day clamps: 29 February in a common year is the
 * 28th), Enter / Space selects and closes, Escape closes without changing the
 * value (through the popover), Tab leaves. A day outside `min`/`max` is
 * `aria-disabled`: it cannot be selected and cannot become the roving tab stop.
 *
 * The roving tab stop on open is the selected day, else today when it is in the
 * shown month, else the 1st (and the first enabled day after a `min`/`max`
 * cuts the 1st off).
 */
export const createDatePicker = (options: DatePickerOptions): DatePicker => {
  const base = options.id ?? createUniqueId();
  const firstDay = (((options.firstDayOfWeek ?? 1) % 7) + 7) % 7;
  const headerId = `${base}-month`;
  const labels: DatePickerLabels = {
    trigger: options.labels?.trigger ?? "Choose date",
    previousMonth: options.labels?.previousMonth ?? "Previous month",
    nextMonth: options.labels?.nextMonth ?? "Next month",
    month: options.labels?.month ?? defaultMonthLabel,
    weekdays: options.labels?.weekdays ?? WEEKDAYS,
    day: options.labels?.day ?? ((iso) => iso),
  };
  const todayIso = options.today ?? localToday();
  const today = (): string => todayIso;

  const [value, requestValue] = createControllable<string | undefined>({
    value: () => options.value,
    initial: options.defaultValue,
    // a request always names a day; the host's callback never sees `undefined`
    onChange: () =>
      options.onValueChange === undefined
        ? undefined
        : (iso) => {
            if (iso !== undefined) {
              options.onValueChange?.(iso);
            }
          },
  });

  const initialParts = partsOf(value() ?? todayIso);
  const [visible, setVisibleMonth] = createSignal<{ year: number; month: number }>({
    year: initialParts?.year ?? 1970,
    month: initialParts?.month ?? 0,
  });

  const enabled = (iso: string): boolean =>
    partsOf(iso) !== undefined &&
    (options.min === undefined || iso >= options.min) &&
    (options.max === undefined || iso <= options.max);

  /** The first day of the 6x7 window that shows this month. */
  const windowStart = (year: number, month: number): number => {
    const first = dayNumber(year, month, 1);
    return first - ((((weekdayOf(first) - firstDay) % 7) + 7) % 7);
  };

  const positionOf = (iso: string): { row: number; col: number } => {
    const parts = partsOf(iso);
    const shown = visible();
    const index = parts === undefined ? 0 : dayNumber(parts.year, parts.month, parts.day);
    const offset = index - windowStart(shown.year, shown.month);
    return { row: Math.floor(offset / 7), col: offset % 7 };
  };

  const monthDays = createMemo<ReadonlyArray<ReadonlyArray<string>>>(() => {
    const { year, month } = visible();
    const start = windowStart(year, month);
    return Array.from({ length: 6 }, (_, row) =>
      Array.from({ length: 7 }, (_, col) => isoOf(start + row * 7 + col)),
    );
  });

  const [cursor, setCursor] = createSignal<string>(
    isoOf(dayNumber(initialParts?.year ?? 1970, initialParts?.month ?? 0, initialParts?.day ?? 1)),
  );

  // The grid gives the month its structure: role, row/column counts, cell ids
  // and the single roving tab stop. Its own keys are replaced (a calendar's
  // PageUp is a month, not a second row) and its rectangle selection is not
  // used: a calendar has one selected day, marked `aria-selected`.
  const grid = createGrid({ id: base, rows: 6, cols: 7 });

  /** Mirrors the day cursor into the grid's row/col, which owns `tabindex`. */
  const place = (iso: string, year: number, month: number): void => {
    const parts = partsOf(iso);
    if (parts === undefined) {
      return;
    }
    const offset = dayNumber(parts.year, parts.month, parts.day) - windowStart(year, month);
    grid.clickCell(Math.floor(offset / 7), offset % 7);
  };

  const firstEnabled = (year: number, month: number): string | undefined => {
    for (let day = 1; day <= monthLength(year, month); day += 1) {
      const iso = isoOf(dayNumber(year, month, day));
      if (enabled(iso)) {
        return iso;
      }
    }
    return undefined;
  };

  /** The selected day, else today, else the 1st — the first one that is enabled. */
  const rovingIn = (year: number, month: number): string => {
    const inMonth = (iso: string): boolean => {
      const parts = partsOf(iso);
      return parts !== undefined && parts.year === year && parts.month === month;
    };
    for (const candidate of [value(), todayIso, isoOf(dayNumber(year, month, 1))]) {
      if (candidate !== undefined && inMonth(candidate) && enabled(candidate)) {
        return candidate;
      }
    }
    return firstEnabled(year, month) ?? isoOf(dayNumber(year, month, 1));
  };

  const show = (year: number, month: number, cursorIso: string): void => {
    setVisibleMonth({ year, month });
    setCursor(cursorIso);
    place(cursorIso, year, month);
  };

  const setMonthOf = (year: number, month: number): void => {
    const total = year * 12 + month;
    const y = Math.floor(total / 12);
    const m = ((total % 12) + 12) % 12;
    show(y, m, rovingIn(y, m));
  };

  const moveTo = (iso: string): void => {
    if (!enabled(iso)) {
      return;
    }
    const parts = partsOf(iso);
    if (parts === undefined) {
      return;
    }
    show(parts.year, parts.month, iso);
  };

  const addDays = (iso: string, days: number): string => {
    const parts = partsOf(iso);
    return parts === undefined ? iso : isoOf(dayNumber(parts.year, parts.month, parts.day) + days);
  };

  const weekStart = (iso: string): string => {
    const parts = partsOf(iso);
    if (parts === undefined) {
      return iso;
    }
    const index = dayNumber(parts.year, parts.month, parts.day);
    return isoOf(index - ((((weekdayOf(index) - firstDay) % 7) + 7) % 7));
  };

  const pageMonth = (months: number): void => {
    const parts = partsOf(cursor());
    if (parts === undefined) {
      return;
    }
    const total = parts.year * 12 + parts.month + months;
    const year = Math.floor(total / 12);
    const month = ((total % 12) + 12) % 12;
    const day = Math.min(parts.day, monthLength(year, month));
    const candidate = isoOf(dayNumber(year, month, day));
    // paging always shows the month; the roving stop moves to the first day the
    // bounds allow. A month with nothing enabled has no tab stop at all.
    show(year, month, enabled(candidate) ? candidate : (firstEnabled(year, month) ?? candidate));
  };

  // The picker owns the open state and hands it to the popover as controlled,
  // so `openPicker` / `closePicker` are the same request the trigger makes.
  const [open, requestOpen] = createControllable<boolean>({
    value: () => options.open,
    initial: false,
    onChange: () => options.onOpenChange,
  });
  const popover = createPopover({
    id: base,
    get open() {
      return open();
    },
    onOpenChange: requestOpen,
  });
  const status = createStatus();

  const select = (iso: string): void => {
    if (enabled(iso)) {
      requestValue(iso);
    }
  };

  const openPicker = (): void => {
    requestOpen(true);
  };

  const closePicker = (): void => {
    requestOpen(false);
  };

  // The popup element, set by `attach`: a key moves the cursor and then the
  // focus, on the microtask that applies the new `tabindex` (or the month).
  let content: HTMLElement | undefined;
  const focusRoving = (): void => {
    queueMicrotask(() => {
      content?.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]')?.focus();
    });
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    const iso = cursor();
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        moveTo(addDays(iso, -1));
        focusRoving();
        return;
      case "ArrowRight":
        event.preventDefault();
        moveTo(addDays(iso, 1));
        focusRoving();
        return;
      case "ArrowUp":
        event.preventDefault();
        moveTo(addDays(iso, -7));
        focusRoving();
        return;
      case "ArrowDown":
        event.preventDefault();
        moveTo(addDays(iso, 7));
        focusRoving();
        return;
      case "Home":
        event.preventDefault();
        moveTo(weekStart(iso));
        focusRoving();
        return;
      case "End":
        event.preventDefault();
        moveTo(addDays(weekStart(iso), 6));
        focusRoving();
        return;
      case "PageUp":
        event.preventDefault();
        pageMonth(event.shiftKey ? -12 : -1);
        focusRoving();
        return;
      case "PageDown":
        event.preventDefault();
        pageMonth(event.shiftKey ? 12 : 1);
        focusRoving();
        return;
      case "Enter":
      case " ":
        event.preventDefault();
        if (enabled(iso)) {
          select(iso);
          closePicker();
        }
        return;
      default:
        // Escape closes through the popover without touching the value; Tab is
        // not intercepted, so it leaves the popup (there is no trap).
        return;
    }
  };

  // One announcement per value: the day's name, in the polite region.
  createEffect(
    () => value(),
    (iso) => {
      if (iso === undefined) {
        status.clear();
      } else {
        status.show(labels.day(iso));
      }
    },
  );

  // Opening repositions the roving day: a value opens on its month, otherwise
  // the shown month stays where the host (or the last visit) put it.
  createEffect(
    () => open(),
    (isOpen) => {
      if (!isOpen) {
        return;
      }
      const parts = partsOf(value() ?? "");
      const shown = parts ?? visible();
      show(shown.year, shown.month, rovingIn(shown.year, shown.month));
    },
  );

  const triggerProps: DatePickerTriggerProps = {
    ...popover.triggerProps,
    // the spread froze the getter; an attribute that must follow the state
    // gets its own
    get "aria-expanded"() {
      return open() ? "true" : "false";
    },
    "aria-label": labels.trigger,
    onClick: () => {
      if (!open()) {
        openPicker();
        return;
      }
      closePicker();
    },
  };

  return {
    value,
    open,
    openPicker,
    closePicker,
    month: visible,
    setMonth: setMonthOf,
    today,
    select,
    monthDays,
    labels,
    status: status.message,
    statusProps: status.statusProps,
    triggerProps,
    popoverProps: {
      ...popover.contentProps,
      get hidden() {
        return !open();
      },
      "aria-labelledby": headerId,
    },
    contentStyle: popover.contentStyle,
    headerProps: {
      id: headerId,
      get text() {
        const { year, month } = visible();
        return labels.month(year, month);
      },
    },
    previousProps: {
      type: "button",
      "aria-label": labels.previousMonth,
      onClick: () => pageMonth(-1),
    },
    nextProps: {
      type: "button",
      "aria-label": labels.nextMonth,
      onClick: () => pageMonth(1),
    },
    gridProps: {
      ...grid.gridProps,
      "aria-labelledby": headerId,
    },
    weekdayProps: (index) => ({
      role: "columnheader",
      abbr: labels.weekdays[(((firstDay + index) % 7) + 7) % 7] ?? "",
    }),
    cellProps: (iso) => {
      const { row, col } = positionOf(iso);
      const cell = grid.cellProps(row, col);
      return {
        role: "gridcell",
        id: cell.id,
        "aria-rowindex": cell["aria-rowindex"],
        "aria-colindex": cell["aria-colindex"],
        get tabindex() {
          return cursor() === iso ? 0 : -1;
        },
        get "aria-selected"() {
          return value() === iso ? "true" : "false";
        },
        get "aria-current"() {
          return todayIso === iso ? "date" : undefined;
        },
        get "aria-disabled"() {
          return enabled(iso) ? undefined : "true";
        },
        onClick: () => {
          if (enabled(iso)) {
            moveTo(iso);
            select(iso);
            closePicker();
          }
        },
        onKeyDown,
      };
    },
    attach: (trigger, popup) => {
      content = popup;
      const detach = popover.attach(trigger, popup);
      createEffect(
        () => open(),
        (isOpen) => {
          if (isOpen) {
            focusRoving();
          }
        },
      );
      return () => {
        content = undefined;
        detach();
      };
    },
  };
};
