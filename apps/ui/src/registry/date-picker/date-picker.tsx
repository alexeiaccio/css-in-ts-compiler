import {
  type DatePicker as DatePickerController,
  type DatePickerOptions,
  createDatePicker,
} from "@cssints/headless";
import { Portal } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { For, createContext, merge, omit, onCleanup, untrack, useContext } from "solid-js";
import { Button } from "../button/button.tsx";
import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** A civil date as `YYYY-MM-DD`; the primitive's own model is the day number behind it. */
const formatDate = (iso: string): string => {
  const [year = "1970", month = "01", day = "01"] = iso.split("-");
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toLocaleDateString(
    undefined,
    { dateStyle: "medium", timeZone: "UTC" },
  );
};

export interface DatePickerProps extends Omit<DatePickerOptions, "id"> {
  /** The primitive, once: a test fixture needs the month and the roving day; a page rarely does. */
  readonly onReady?: (picker: DatePickerController) => void;
  /** The trigger's visible text for a chosen day; the locale's medium date by default. */
  readonly format?: (iso: string) => string;
  readonly id?: string;
  readonly children?: JSX.Element;
}

export type DatePickerTriggerPartProps = PartProps;

export interface DatePickerTriggerProps extends Renderable<DatePickerTriggerPartProps, void> {
  readonly class?: string;
  /** The chosen day by default, or the accessible name while nothing is chosen. */
  readonly children?: JSX.Element;
}

export type DatePickerContentPartProps = PartProps;

export interface DatePickerContentProps extends Renderable<DatePickerContentPartProps, void> {
  readonly class?: string;
  /** A month of your own; without children the header and the 6x7 grid are the panel. */
  readonly children?: JSX.Element;
}

export type DatePickerHeaderPartProps = PartProps;

export interface DatePickerHeaderProps extends Renderable<DatePickerHeaderPartProps, void> {
  readonly class?: string;
  /** The nav buttons; the previous and the next month by default. */
  readonly children?: JSX.Element;
}

export type DatePickerTitlePartProps = PartProps;

export interface DatePickerTitleProps extends Renderable<DatePickerTitlePartProps, void> {
  readonly class?: string;
  /** `labels.month(year, month)` by default. */
  readonly children?: JSX.Element;
}

export type DatePickerNavPartProps = PartProps;

export interface DatePickerNavProps extends Renderable<DatePickerNavPartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export type DatePickerGridPartProps = PartProps;

export interface DatePickerGridProps extends Renderable<DatePickerGridPartProps, void> {
  readonly class?: string;
  /** Weeks of your own; without children the weekday row and the six day rows are the grid. */
  readonly children?: JSX.Element;
}

export type DatePickerWeekPartProps = PartProps;

export interface DatePickerWeekProps extends Renderable<DatePickerWeekPartProps, void> {
  /** Seven ISO days, in the grid's column order. */
  readonly week: ReadonlyArray<string>;
  readonly class?: string;
  /** Cells of your own; without children one `DatePickerDay` per day. */
  readonly children?: JSX.Element;
}

export type DatePickerWeekdayPartProps = PartProps;

export interface DatePickerWeekdayProps extends Renderable<DatePickerWeekdayPartProps, void> {
  /** The column, 0-6, in the shown week order. */
  readonly index: number;
  readonly class?: string;
  readonly children?: JSX.Element;
}

export type DatePickerDayPartProps = PartProps;

export interface DatePickerDayProps extends Renderable<DatePickerDayPartProps, void> {
  /** The day this cell shows, `YYYY-MM-DD`; the primitive owns its id, indices and announced state. */
  readonly iso: string;
  readonly class?: string;
  /** The day of the month by default. */
  readonly children?: JSX.Element;
}

export type DatePickerStatusPartProps = PartProps;

export interface DatePickerStatusProps extends Renderable<DatePickerStatusPartProps, void> {
  readonly class?: string;
  /** `labels.day(iso)` of the chosen day by default; the announcement itself. */
  readonly children?: JSX.Element;
}

const DatePickerContext = createContext<{
  readonly picker: DatePickerController;
  readonly format: (iso: string) => string;
  /** The two refs the primitive's `attach` needs: it wires them once both exist. */
  readonly connect: (part: "trigger" | "content", element: HTMLElement) => void;
  /** Moves the DOM focus to the roving day, after the month's cells have re-rendered. */
  readonly focusRoving: () => void;
}>();

// The same decision as the popover's: the primitive's panel is `position: absolute` with page-space coordinates, so it is
// portalled to the body, out of any `position: relative`, `transform` or `overflow: hidden` between it and the page. The cost
// is a client-only island and a measurement of the trigger per open. No `display`: `hidden` on the panel is what closes it.
const contentClass = css.cn(
  css.zIndex("var(--z-popover)"),
  css.width("max-content"),
  css.padding(t.space._2),
  css.bg(t.color.overlayBackground),
  css.color(t.color.text),
  css.border("1px solid", t.color.overlayBorder),
  css.borderRadius(t.radius.lg),
  css.boxShadow(t.shadow.popover),
  // the panel holds the grid, whose cells take the DOM focus: a ring around the panel is noise
  css.outline("none"),
);

const headerClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.gap(t.space._1),
  css.marginBlockEnd(t.space._2),
);

const titleClass = css.cn(
  css.margin("0"),
  css.marginInlineEnd("auto"),
  css.fontSize(t.font.size),
  css.fontWeight("600"),
  css.color(t.color.text),
);

// One row of seven equal columns; the weekday row and the six day rows line up because both are this class.
const rowClass = css.cn(
  css.display("grid"),
  css.gridTemplateColumns("repeat(7, 1fr)"),
  css.gap(t.space._1),
);

const gridClass = css.cn(css.display("grid"), css.gap(t.space._1));

const weekdayClass = css.cn(
  css.paddingBlockEnd(t.space._1),
  css.textAlign("center"),
  css.fontSize(t.font.sizeSm),
  css.fontWeight("500"),
  css.color(t.color.muted),
);

// The nav buttons are plain buttons, not the kit's `Button`: a `Button` owns `data-part="button"`, and these are parts of
// the calendar, so the skin keeps their name and the quiet, compact look itself.
const navClass = css.cn(
  css.padding(t.space._1, t.space._2),
  css.bg("transparent"),
  css.border("1px solid", "transparent"),
  css.borderRadius(t.radius.sm),
  css.fontSize(t.font.size),
  css.color(t.color.text),
  css.cursor("pointer"),
  css.hover(css.bg(t.color.buttonBackground)),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("-2px")),
);

// The cell's state is the primitive's announcement: `aria-selected` for the chosen day, `aria-current="date"` for today,
// `aria-disabled` outside `min` / `max`. The kit paints those and keeps no copy of the value.
const dayClass = css.cn(
  css.display("grid"),
  css.placeItems("center"),
  css.minWidth("2.25rem"),
  css.minHeight("2.25rem"),
  css.borderRadius(t.radius.sm),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.text),
  css.cursor("pointer"),
  css.hover(css.bg(t.color.buttonBackground)),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("-2px")),
  css.attr("aria-current", "date")(css.boxShadow("inset 0 0 0 1px", t.color.highlight)),
  css.attr("aria-selected", "true")(
    css.bg(t.color.highlight),
    css.color(t.color.onHighlight),
    css.hover(css.bg(t.color.highlightPressed)),
  ),
  css.attr("aria-disabled", "true")(css.color(t.color.textDisabled), css.cursor("not-allowed")),
);

// The chosen day's announcement, read by a screen reader: the region is in the page and visually hidden, never `hidden` (a
// hidden live region is not announced).
const statusClass = css.cn(
  css.position("absolute"),
  css.width("1px"),
  css.height("1px"),
  css.overflow("hidden"),
  css.clipPath("inset(50%)"),
  css.whiteSpace("nowrap"),
);

/**
 * A date picker, styled: `DatePicker.Trigger` opens `DatePicker.Content`, a calendar with `role="dialog"` around a 6x7
 * `role="grid"` of days. `createDatePicker` composes the popover, the grid and the status region: it owns the open state, the
 * month, the roving day, the day numbers, the keys (arrows, Home, End, PageUp, PageDown, Enter, Space, Escape), `min` / `max`,
 * the announcement of a chosen day, and the placement and light dismissal of the popup. The kit adds the trigger's visible
 * date, the panel's surface, the header with its nav buttons, the calendar grid's look, and the portal the primitive's
 * page-space placement needs.
 *
 * The skin carries its own parts rather than reusing the kit's `Popover`: `createDatePicker` owns a popover instance inside, and
 * the two would be separate controllers sharing only the trigger's id.
 */
export const DatePicker = (props: DatePickerProps): JSX.Element => {
  const picker = createDatePicker({
    get value() {
      return props.value;
    },
    defaultValue: props.defaultValue,
    get onValueChange() {
      return props.onValueChange;
    },
    get min() {
      return props.min;
    },
    get max() {
      return props.max;
    },
    today: props.today,
    get open() {
      return props.open;
    },
    get onOpenChange() {
      return props.onOpenChange;
    },
    labels: props.labels,
    id: props.id,
    get firstDayOfWeek() {
      return props.firstDayOfWeek;
    },
  });
  // structural, read once: it is the primitive for a test, not a signal
  untrack(() => props.onReady)?.(picker);
  // The primitive wires two elements and creates an effect, so it is attached from the parts' refs: `ref` travels with the
  // props, so a `render` that spreads them keeps the wiring. Its teardown runs with the root.
  let trigger: HTMLElement | undefined;
  let content: HTMLElement | undefined;
  let detach: (() => void) | undefined;
  const connect = (part: "trigger" | "content", element: HTMLElement): void => {
    if (part === "trigger") {
      trigger = element;
    } else {
      content = element;
    }
    if (trigger !== undefined && content !== undefined && detach === undefined) {
      detach = picker.attach(trigger, content);
    }
  };
  onCleanup(() => {
    detach?.();
    detach = undefined;
  });
  // The primitive moves the roving tab stop but not the DOM focus on a nav click (its own `focusRoving` runs on a key only).
  // The skin finishes the job on the next task, after the month's cells re-rendered, so the arrows keep working after a click.
  const focusRoving = (): void => {
    content?.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]')?.focus();
  };
  const format = (iso: string): string => (props.format ?? formatDate)(iso);
  return (
    <DatePickerContext value={{ picker, format, connect, focusRoving }}>
      {props.children}
      {/* the chosen day is announced even after the panel closed, so the region lives here and not in the panel */}
      <DatePickerStatus />
    </DatePickerContext>
  );
};

/** The button that opens the calendar: `Button` unless `render` says otherwise. Its text is the chosen day. */
export const DatePickerTrigger = (props: DatePickerTriggerProps): JSX.Element => {
  const { picker, format, connect } = useContext(DatePickerContext);
  const rest = omit(props, "render", "class", "children");
  const merged = merge(rest, picker.triggerProps, () => ({
    get class() {
      return css.cn(props.class);
    },
    ref: (element: HTMLElement) => {
      connect("trigger", element);
    },
  }));
  // an accessor, not a snapshot: Solid wraps the JSX interpolation in an effect, so the trigger's text follows the value
  const text = (): string => {
    const chosen = picker.value();
    return chosen === undefined ? picker.labels.trigger : format(chosen);
  };
  return renderPart(props, merged, undefined, (part) => (
    <Button {...part}>{props.children ?? text()}</Button>
  ));
};

/** The panel, portalled to the body and placed by the primitive. It is `hidden` while the calendar is closed. */
export const DatePickerContent = (props: DatePickerContentProps): JSX.Element => {
  const { picker, connect } = useContext(DatePickerContext);
  const merged = merge(omit(props, "render", "class", "children"), picker.popoverProps, () => ({
    "data-part": "date-picker",
    get class() {
      return css.cn(contentClass, props.class);
    },
    ref: (element: HTMLElement) => {
      connect("content", element);
    },
  }));
  return (
    <Portal>
      {renderPart(props, merged, undefined, (part) => (
        <div {...part} style={picker.contentStyle()}>
          {props.children ?? (
            <>
              <DatePickerHeader />
              <DatePickerGrid />
            </>
          )}
        </div>
      ))}
    </Portal>
  );
};

/** The row above the grid: the month's title and the nav buttons. */
export const DatePickerHeader = (props: DatePickerHeaderProps): JSX.Element => {
  const merged = merge(omit(props, "render", "class", "children"), () => ({
    "data-part": "date-picker-header",
    get class() {
      return css.cn(headerClass, props.class);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <div {...part}>
      <DatePickerTitle />
      {props.children ?? (
        <>
          <DatePickerPrevious />
          <DatePickerNext />
        </>
      )}
    </div>
  ));
};

/** The shown month, `labels.month(year, month)`; its id is what the grid and the popup are labelled by. */
export const DatePickerTitle = (props: DatePickerTitleProps): JSX.Element => {
  const { picker } = useContext(DatePickerContext);
  const merged = merge(omit(props, "render", "class", "children"), () => ({
    id: picker.headerProps.id,
    "data-part": "date-picker-title",
    get class() {
      return css.cn(titleClass, props.class);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <h2 {...part}>{props.children ?? picker.headerProps.text}</h2>
  ));
};

/** The previous month; either button pages the shown month and moves the roving day. */
export const DatePickerPrevious = (props: DatePickerNavProps): JSX.Element => {
  const { picker, focusRoving } = useContext(DatePickerContext);
  const merged = merge(omit(props, "render", "class", "children"), picker.previousProps, () => ({
    "data-part": "date-picker-previous",
    get class() {
      return css.cn(navClass, props.class);
    },
    onClick: () => {
      picker.previousProps.onClick();
      setTimeout(focusRoving, 0);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <button {...part}>{props.children ?? <span aria-hidden="true">‹</span>}</button>
  ));
};

/** The next month. */
export const DatePickerNext = (props: DatePickerNavProps): JSX.Element => {
  const { picker, focusRoving } = useContext(DatePickerContext);
  const merged = merge(omit(props, "render", "class", "children"), picker.nextProps, () => ({
    "data-part": "date-picker-next",
    get class() {
      return css.cn(navClass, props.class);
    },
    onClick: () => {
      picker.nextProps.onClick();
      setTimeout(focusRoving, 0);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <button {...part}>{props.children ?? <span aria-hidden="true">›</span>}</button>
  ));
};

/** The month: `role="grid"`, its row and column counts and the name of the month above it. */
export const DatePickerGrid = (props: DatePickerGridProps): JSX.Element => {
  const { picker } = useContext(DatePickerContext);
  const merged = merge(omit(props, "render", "class", "children"), picker.gridProps, () => ({
    "data-part": "date-picker-grid",
    get class() {
      return css.cn(gridClass, props.class);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <div {...part}>
      {props.children ?? (
        <>
          <div role="row" data-part="date-picker-row" class={rowClass}>
            <For each={[0, 1, 2, 3, 4, 5, 6]}>{(index) => <DatePickerWeekday index={index} />}</For>
          </div>
          <For each={picker.monthDays()}>{(week) => <DatePickerWeek week={week} />}</For>
        </>
      )}
    </div>
  ));
};

/** One week: `role="row"` and seven `DatePickerDay`s. */
export const DatePickerWeek = (props: DatePickerWeekProps): JSX.Element => {
  const merged = merge({ role: "row" as const }, () => ({
    "data-part": "date-picker-row",
    get class() {
      return css.cn(rowClass, props.class);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <div {...part}>{props.children ?? props.week.map((iso) => <DatePickerDay iso={iso} />)}</div>
  ));
};

/** A column's name: `role="columnheader"`, the primitive's short weekday (`abbr`) as its text. */
export const DatePickerWeekday = (props: DatePickerWeekdayProps): JSX.Element => {
  const { picker } = useContext(DatePickerContext);
  const weekday = picker.weekdayProps(props.index);
  const merged = merge(weekday, () => ({
    "data-part": "date-picker-weekday",
    get class() {
      return css.cn(weekdayClass, props.class);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <div {...part}>{props.children ?? part.abbr}</div>
  ));
};

/** One day: `role="gridcell"`, its indices, the roving tab stop and the chosen / today / disabled announcements. */
export const DatePickerDay = (props: DatePickerDayProps): JSX.Element => {
  const { picker } = useContext(DatePickerContext);
  const merged = merge(picker.cellProps(props.iso), () => ({
    "data-part": "date-picker-day",
    get class() {
      return css.cn(dayClass, props.class);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <div {...part}>{props.children ?? String(Number(props.iso.slice(8)))}</div>
  ));
};

/** The chosen day's announcement: the primitive's polite `role="status"` region, visually hidden. */
export const DatePickerStatus = (props: DatePickerStatusProps): JSX.Element => {
  const { picker } = useContext(DatePickerContext);
  const merged = merge(omit(props, "render", "class", "children"), picker.statusProps, () => ({
    "data-part": "date-picker-status",
    get class() {
      return css.cn(statusClass, props.class);
    },
  }));
  const announcement = (): string | undefined => picker.status();
  return renderPart(props, merged, undefined, (part) => (
    <div {...part}>{props.children ?? announcement()}</div>
  ));
};
