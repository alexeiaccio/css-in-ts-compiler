import { type Accessor, createSignal } from "solid-js";

export interface ScrollspyEntry {
  readonly id: string;
  readonly label: string;
}

export interface ScrollspyOptions {
  /** The table of contents, in document order. The heading elements carry these ids. */
  readonly entries: ReadonlyArray<ScrollspyEntry>;
  /**
   * How far below the scrollport's top edge a heading counts as current, in px.
   * A host with a sticky header passes its height. @default 0
   */
  readonly offset?: number | undefined;
  /**
   * The scroll container; the document by default. Read once, when `attach`
   * runs, so a host that swaps containers attaches again.
   */
  readonly root?: (() => HTMLElement | undefined) | undefined;
  /** The active id changed. */
  readonly onChange?: ((id: string | undefined) => void) | undefined;
}

export interface ScrollspyNavProps {
  /** The navigation landmark's name; the host overrides it after the spread to translate it. */
  readonly "aria-label": string;
}

export interface ScrollspyListProps {
  readonly role: "list";
}

export interface ScrollspyItemProps {
  readonly role: "listitem";
}

export interface ScrollspyLinkProps {
  readonly href: string;
  readonly "aria-current": "location" | undefined;
}

export interface Scrollspy {
  /** The current entry's id; `undefined` only when there are no entries. */
  readonly active: Accessor<string | undefined>;
  readonly navProps: ScrollspyNavProps;
  readonly listProps: ScrollspyListProps;
  readonly itemProps: (id: string) => ScrollspyItemProps;
  readonly linkProps: (id: string) => ScrollspyLinkProps;
  /**
   * DOM wiring: one passive `scroll` listener on the root, which measures the
   * headings. Call it once mounted and call the teardown it returns on cleanup.
   */
  readonly attach: () => () => void;
}

/**
 * A scrollspy: a table of contents whose current entry is the last heading that
 * has reached the top of the scrollport, marked `aria-current="location"` on
 * its link (and nowhere else: exactly one link is current).
 *
 * **No APG pattern exists for a scrollspy**, so there is no Quint spec and no
 * ported scenarios: the contract is WAI-ARIA (`aria-current="location"`, the
 * `list` / `listitem` roles, the navigation landmark and its name) and HTML,
 * and `test/scrollspy.browser.test.tsx` is its oracle.
 *
 * **A scroll listener, not an `IntersectionObserver`.** "The last heading at or
 * above the offset" is a total order over every heading, while an observer only
 * reports what crossed its band: a band observer has to rebuild the order from
 * its enter/leave state, and it misreports after a jump (an anchor click, a
 * restored scroll position). The listener is passive, the measurements are
 * reads only (no writes, so no layout thrash), and a docs page has a dozen
 * headings — the same cost as the listener the page already keeps.
 *
 * Smooth scrolling is the host's (`scroll-behavior: smooth`): the links are
 * plain `#id` targets and nothing here moves the scrollport, so no
 * `prefers-reduced-motion` branch is needed either.
 */
export const createScrollspy = (options: ScrollspyOptions): Scrollspy => {
  const offset = options.offset ?? 0;
  const first = options.entries[0]?.id;
  const [active, setActive] = createSignal<string | undefined>(first);

  // The last heading whose top is at or above the offset line, else the first:
  // before any scroll the table starts at its first entry.
  const at = (): string | undefined => {
    const container = options.root?.()?.getBoundingClientRect().top ?? 0;
    let id = first;
    for (const entry of options.entries) {
      const element = document.getElementById(entry.id);
      if (element === null) {
        continue;
      }
      if (element.getBoundingClientRect().top - container <= offset) {
        id = entry.id;
      }
    }
    return id;
  };

  const commit = (): void => {
    const next = at();
    if (next === active()) {
      return;
    }
    setActive(next);
    options.onChange?.(next);
  };

  return {
    active,
    navProps: { "aria-label": "On this page" },
    listProps: { role: "list" },
    itemProps: () => ({ role: "listitem" }),
    linkProps: (id) => ({
      href: `#${id}`,
      get "aria-current"() {
        return id === active() ? "location" : undefined;
      },
    }),
    attach: () => {
      const target: EventTarget = options.root?.() ?? document;
      const listener = (): void => commit();
      target.addEventListener("scroll", listener, { passive: true });
      commit();
      return () => target.removeEventListener("scroll", listener);
    },
  };
};
