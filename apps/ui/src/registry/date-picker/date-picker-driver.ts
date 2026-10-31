import { type DatePickerMounted } from "./date-picker.fixture";

/**
 * The DOM side of the date picker's conformance test. `createDatePicker` is a composition whose oracle is its own browser
 * test, so there is no scenario walk here: this driver is what the kit's test reads — the trigger, the panel (portalled),
 * the grid's parts, a real click and key, and the element the DOM focus is on.
 */

/** Solid 2 delivers events through its delegated listener on a later turn. */
export const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

const required = <T extends HTMLElement>(parent: ParentNode, selector: string): T => {
  const element = parent.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`date picker: no ${selector}`);
  }
  return element;
};

export const datePickerDriver = (mounted: DatePickerMounted) => {
  // the panel and the grid live in a portal, not under the trigger: they are found on the document
  const content = (): HTMLElement => required(document, '[data-part="date-picker"]');
  const grid = (): HTMLElement => required(content(), '[role="grid"]');
  const days = (): HTMLElement[] => [...grid().querySelectorAll<HTMLElement>('[role="gridcell"]')];
  return {
    trigger: (): HTMLButtonElement => required(mounted.root, '[aria-haspopup="dialog"]'),
    content,
    grid,
    title: (): HTMLElement => required(content(), '[data-part="date-picker-title"]'),
    status: (): HTMLElement => required(mounted.root, '[data-part="date-picker-status"]'),
    next: (): HTMLElement => required(content(), '[data-part="date-picker-next"]'),
    previous: (): HTMLElement => required(content(), '[data-part="date-picker-previous"]'),
    rows: (): HTMLElement[] => [...grid().querySelectorAll<HTMLElement>('[role="row"]')],
    weekdays: (): HTMLElement[] => [
      ...grid().querySelectorAll<HTMLElement>('[role="columnheader"]'),
    ],
    days,
    /** The day carrying the roving tab stop. */
    roving: (): HTMLElement | null => grid().querySelector<HTMLElement>('[tabindex="0"]'),
    open: async (): Promise<void> => {
      required<HTMLButtonElement>(mounted.root, '[aria-haspopup="dialog"]').click();
      await settle();
    },
    click: async (element: HTMLElement): Promise<void> => {
      // the raw DOM click, because a test driver refuses to press an `aria-disabled` day
      element.click();
      await settle();
    },
    /** A key on whatever holds the focus, as a reader's would arrive. */
    press: async (key: string, init: KeyboardEventInit = {}): Promise<KeyboardEvent> => {
      const target =
        document.activeElement instanceof HTMLElement ? document.activeElement : document.body;
      const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
      target.dispatchEvent(event);
      await settle();
      return event;
    },
    style: (element: Element): CSSStyleDeclaration => getComputedStyle(element),
  };
};
