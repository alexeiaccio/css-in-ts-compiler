/**
 * The DOM side of the popover's conformance test. There is no APG pattern for a popover and no Quint spec, so there is no
 * scenario walk: the primitive's own browser test is the oracle for the behaviour, and this driver is what the kit's test
 * reads — the parts by name, a real click and key, and a settle that lets Solid 2 deliver the event and apply the update.
 */
export interface PopoverMounted {
  readonly root: HTMLElement;
  readonly dispose: () => void;
}

/** Solid 2 delivers events through its delegated listener on a later turn. */
export const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

const required = <T extends HTMLElement>(parent: ParentNode, selector: string): T => {
  const element = parent.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`popover: no ${selector}`);
  }
  return element;
};

export const popoverDriver = (mounted: PopoverMounted) => {
  // the panel lives in a portal, not under the trigger: it is found on the document
  const content = (): HTMLElement => required(document, '[data-part="popover"]');
  return {
    trigger: (): HTMLButtonElement => required(mounted.root, '[aria-haspopup="dialog"]'),
    content,
    inside: (name: string): HTMLElement => required(content(), `[data-part="${name}"]`),
    open: async (): Promise<void> => {
      required<HTMLButtonElement>(mounted.root, '[aria-haspopup="dialog"]').click();
      await settle();
    },
    click: async (element: HTMLElement): Promise<void> => {
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
