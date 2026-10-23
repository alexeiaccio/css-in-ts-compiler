export interface BreadcrumbItem {
  readonly label: string;
  readonly href?: string | undefined;
}

export interface BreadcrumbOptions {
  readonly items: ReadonlyArray<BreadcrumbItem>;
  /** 1-based index of the current page; defaults to the last item. */
  readonly currentIndex?: number;
  readonly disabled?: boolean;
  /** The navigation landmark label; defaults to "Breadcrumbs". */
  readonly label?: string | undefined;
  readonly labelledby?: string | undefined;
  readonly describedby?: string | undefined;
  readonly onPress?: (index: number) => void;
}

export interface BreadcrumbNavProps {
  readonly "aria-label": string | undefined;
  readonly "aria-labelledby": string | undefined;
  readonly "aria-describedby": string | undefined;
}

export interface BreadcrumbListProps {
  readonly role: "list";
}

export interface BreadcrumbItemProps {
  readonly role: "listitem";
  readonly "aria-current": "page" | undefined;
  readonly "aria-disabled": "true" | undefined;
}

export interface BreadcrumbLinkProps {
  readonly href: string | undefined;
  readonly "aria-current": "page" | undefined;
  readonly onClick: () => void;
}

export interface Breadcrumb {
  readonly navProps: BreadcrumbNavProps;
  readonly listProps: BreadcrumbListProps;
  readonly itemProps: (index: number) => BreadcrumbItemProps;
  readonly linkProps: (index: number) => BreadcrumbLinkProps;
}

/**
 * APG Breadcrumb (https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/): a trail
 * of links in hierarchical order, the current page LAST and marked
 * `aria-current=page` (on both the item and its link). Platform: native (static
 * markup; the navigation landmark is a UA/AT concern).
 */
export const createBreadcrumb = (options: BreadcrumbOptions): Breadcrumb => {
  const count = options.items.length;
  const current = (): number =>
    count === 0 ? 0 : Math.min(Math.max(options.currentIndex ?? count, 0), count);

  return {
    navProps: {
      get "aria-label"() {
        return options.label ?? "Breadcrumbs";
      },
      get "aria-labelledby"() {
        return options.labelledby;
      },
      get "aria-describedby"() {
        return options.describedby;
      },
    },
    listProps: { role: "list" },
    itemProps: (index) => ({
      role: "listitem",
      get "aria-current"() {
        return index + 1 === current() ? "page" : undefined;
      },
      get "aria-disabled"() {
        return options.disabled === true ? "true" : undefined;
      },
    }),
    linkProps: (index) => ({
      get href() {
        return options.items[index]?.href ?? "#";
      },
      get "aria-current"() {
        return index + 1 === current() ? "page" : undefined;
      },
      onClick: () => {
        if (options.disabled === true) {
          return;
        }
        options.onPress?.(index);
      },
    }),
  };
};
