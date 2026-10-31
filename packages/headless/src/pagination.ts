export interface PaginationLabels {
  /** The navigation landmark's name; defaults to "Pagination". */
  readonly nav?: string | undefined;
  readonly previous?: string | undefined;
  readonly next?: string | undefined;
  /** The prefix of a page link's name; defaults to "Page". */
  readonly page?: string | undefined;
  /** The gap between page runs; defaults to "More pages". */
  readonly gap?: string | undefined;
  /** The live count; defaults to `Page <page> of <count>`. */
  readonly status?: ((page: number, count: number) => string) | undefined;
}

export interface PaginationOptions {
  /** The current page, 1-based. */
  readonly page: number;
  readonly pageCount: number;
  /** Pages shown on each side of the current one; defaults to 1. */
  readonly siblings?: number;
  /** Pages always shown at each end; defaults to 1. */
  readonly boundaries?: number;
  /** Where a page link points, when the host renders anchors; without it, buttons. */
  readonly hrefFor?: ((page: number) => string) | undefined;
  readonly disabled?: boolean;
  readonly labels?: PaginationLabels | undefined;
  readonly onPageChange?: ((page: number) => void) | undefined;
}

/** One entry of the page list: a page, or the run of pages the list elides. */
export type PaginationItem =
  | { readonly kind: "page"; readonly page: number; readonly current: boolean }
  | { readonly kind: "gap"; readonly key: string };

export interface PaginationNavProps {
  readonly "aria-label": string;
}

export interface PaginationListProps {
  readonly role: "list";
}

export interface PaginationItemProps {
  readonly role: "listitem";
  readonly "aria-current": "page" | undefined;
}

export interface PaginationLinkProps {
  readonly href: string | undefined;
  readonly "aria-current": "page" | undefined;
  readonly "aria-disabled": "true" | undefined;
  readonly "aria-label": string;
  readonly rel: "prev" | "next" | undefined;
  readonly onClick: (event: { preventDefault: () => void }) => void;
}

export interface PaginationStatusProps {
  readonly role: "status";
  readonly "aria-live": "polite";
  readonly "aria-atomic": "true";
}

export interface Pagination {
  /** The page list with the elided runs, recomputed when an option changes. */
  readonly items: () => readonly PaginationItem[];
  readonly current: () => number;
  readonly navProps: PaginationNavProps;
  readonly listProps: PaginationListProps;
  readonly itemProps: (page: number) => PaginationItemProps;
  readonly linkProps: (page: number) => PaginationLinkProps;
  /** The previous page's control; a getter, so read it again after the page moves. */
  readonly previousProps: PaginationLinkProps;
  /** The next page's control; a getter, so read it again after the page moves. */
  readonly nextProps: PaginationLinkProps;
  /** The count, announced once here rather than in every link. */
  readonly status: () => string;
  readonly statusProps: PaginationStatusProps;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Pagination: a navigation landmark over a page list, the current page marked
 * `aria-current=page` and never a link. No APG pattern exists for it; the
 * requirements are TetraLogical's (accessible-components-library, v1.0.0):
 * exactly one current page, ends kept in place and disabled rather than
 * removed, the count announced once, and a host-supplied `href` for every link
 * so the control works without JS.
 *
 * Target size is the skin's job: 24x24 CSS px at AA, 44x44 at AAA.
 */
export const createPagination = (options: PaginationOptions): Pagination => {
  const current = (): number => clamp(options.page, 1, Math.max(options.pageCount, 1));
  const label = (name: Exclude<keyof PaginationLabels, "status">, fallback: string): string =>
    options.labels?.[name] ?? fallback;
  const navigate = (page: number): void => {
    if (options.disabled === true || page === current()) {
      return;
    }
    if (page < 1 || page > options.pageCount) {
      return;
    }
    options.onPageChange?.(page);
  };

  const pages = (): readonly PaginationItem[] => {
    const count = options.pageCount;
    const page = current();
    const siblings = Math.max(options.siblings ?? 1, 0);
    const boundaries = Math.max(options.boundaries ?? 1, 0);
    const first = Math.min(boundaries, count);
    const last = Math.max(count - boundaries + 1, 1);
    const from = Math.max(page - siblings, first + 1);
    const to = Math.min(page + siblings, last - 1);

    const items: PaginationItem[] = [];
    for (let index = 1; index <= count; index++) {
      const shown = index <= first || index >= last || (index >= from && index <= to);
      if (shown) {
        items.push({ kind: "page", page: index, current: index === page });
        continue;
      }
      // One gap per elided run, keyed by the run's start so the list is stable.
      if (items.at(-1)?.kind !== "gap") {
        items.push({ kind: "gap", key: `gap-${index}` });
      }
    }
    return items;
  };

  const linkProps = (page: number): PaginationLinkProps => ({
    get href() {
      return options.hrefFor?.(page);
    },
    get "aria-current"() {
      return page === current() ? ("page" as const) : undefined;
    },
    get "aria-disabled"() {
      // A page outside the range is present but inert, like the disabled ends.
      const outside = page < 1 || page > options.pageCount;
      return options.disabled === true || outside ? ("true" as const) : undefined;
    },
    get "aria-label"() {
      return `${label("page", "Page")} ${page}`;
    },
    get rel() {
      return undefined;
    },
    onClick: (event) => {
      event.preventDefault();
      navigate(page);
    },
  });

  // An end is an offset from the current page, not a page captured when the host read the object:
  // a host that spreads it onto an anchor once still moves past the first step.
  const endProps = (offset: -1 | 1, name: string, rel: "prev" | "next"): PaginationLinkProps => ({
    get href() {
      return options.hrefFor?.(current() + offset);
    },
    get "aria-current"() {
      return undefined;
    },
    get "aria-disabled"() {
      const page = current() + offset;
      const outside = page < 1 || page > options.pageCount;
      return options.disabled === true || outside ? ("true" as const) : undefined;
    },
    "aria-label": name,
    get rel() {
      return rel;
    },
    onClick: (event) => {
      event.preventDefault();
      navigate(current() + offset);
    },
  });

  return {
    items: pages,
    current,
    navProps: {
      get "aria-label"() {
        return label("nav", "Pagination");
      },
    },
    listProps: { role: "list" },
    itemProps: (page) => ({
      role: "listitem",
      get "aria-current"() {
        return page === current() ? ("page" as const) : undefined;
      },
    }),
    linkProps,
    get previousProps() {
      return endProps(-1, label("previous", "Previous page"), "prev");
    },
    get nextProps() {
      return endProps(1, label("next", "Next page"), "next");
    },
    status: () =>
      options.labels?.status?.(current(), options.pageCount) ??
      `Page ${current()} of ${options.pageCount}`,
    statusProps: { role: "status", "aria-live": "polite", "aria-atomic": "true" },
  };
};
