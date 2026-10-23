import { type Accessor } from "solid-js";

export interface LinkOptions {
  readonly href?: string | undefined;
  /** Render a native `<a href>` (the default when `href` is set). */
  readonly native?: boolean;
  readonly disabled?: boolean;
  /** aria-current="page" for the current page in a trail. */
  readonly current?: boolean;
  /** The link executed (Enter or pointer activation). */
  readonly onActivate?: () => void;
  /** Router integration: the href the activation would navigate to. */
  readonly onNavigate?: (href: string) => void;
}

/** Spread onto the `<a>` or the custom `role=link` element. */
export interface LinkProps {
  readonly role: "link" | undefined;
  readonly tabindex: number | undefined;
  readonly href: string | undefined;
  readonly "aria-disabled": "true" | undefined;
  readonly "aria-current": "page" | undefined;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onClick: (event: MouseEvent) => void;
}

export interface Link {
  readonly native: Accessor<boolean>;
  readonly href: Accessor<string | undefined>;
  readonly disabled: Accessor<boolean>;
  /** Getter-backed, so spreading it keeps every attribute reactive. */
  readonly linkProps: LinkProps;
}

/**
 * APG Link (https://www.w3.org/WAI/ARIA/apg/patterns/link/): a native `<a href>`
 * brings focus and activation for free; a custom element takes `role=link` and
 * `tabindex=0` plus an Enter handler, because "applying the link role will not
 * cause browsers to enhance the element". Platform: native.
 */
export const createLink = (options: LinkOptions = {}): Link => {
  const native = (): boolean => options.native ?? options.href !== undefined;
  const href = (): string | undefined => options.href;
  const disabled = (): boolean => options.disabled ?? false;

  const activate = (): void => {
    options.onActivate?.();
    const target = href();
    if (target !== undefined) {
      options.onNavigate?.(target);
    }
  };

  return {
    native,
    href,
    disabled,
    linkProps: {
      get role() {
        return native() ? undefined : "link";
      },
      get tabindex() {
        if (native()) {
          return undefined;
        }
        return disabled() ? -1 : 0;
      },
      get href() {
        return native() ? href() : undefined;
      },
      get "aria-disabled"() {
        return disabled() ? "true" : undefined;
      },
      get "aria-current"() {
        return options.current === true ? "page" : undefined;
      },
      onKeyDown: (event) => {
        if (event.key !== "Enter" && event.key !== " " && event.key !== "Space") {
          return;
        }
        // keep the browser from following the anchor or scrolling the page
        event.preventDefault();
        if (!disabled() && event.key === "Enter") {
          activate();
        }
      },
      onClick: (event) => {
        event.preventDefault();
        if (!disabled()) {
          activate();
        }
      },
    },
  };
};
