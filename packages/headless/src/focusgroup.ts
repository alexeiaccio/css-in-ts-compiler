import { FocusGroup } from "@microsoft/focusgroup-polyfill";

/**
 * The platform layer of the `focusgroup` contract: one tab stop, arrows along the
 * axis, Home / End, wrap and last-focused memory, provided by the browser or by
 * `@microsoft/focusgroup-polyfill`. A widget keeps only its delta (selection,
 * activation, embedded controls, `aria-orientation`), the same split
 * `shared/focusgroup.qnt` models.
 *
 * Two providers, one definition:
 * - native (`'focusGroup' in HTMLElement.prototype`, Chromium 150+): the owner
 *   gets the `focusgroup` attribute and the browser owns the whole behaviour. It
 *   does not rewrite `tabindex`, so the tab stop is visible only to the focus
 *   controller, not in the markup.
 * - polyfill: the low-level `FocusGroup` class over an item collection (never
 *   `polyfill()` / `MutationObserver`, so the host's reconciliation drives
 *   `update()`), which renders the tab stop as `tabindex="0"` / `"-1"` and
 *   saves and restores the author's values.
 *
 * Pins: Open UI explainer 2026-07-28, `@microsoft/focusgroup-polyfill` 1.6.0
 * (MIT). Measured in Chromium 153/156 — see `shared/focusgroup.qnt`: teardown is
 * `update({ definition: {} })` BEFORE `disconnect()`; `disconnect()` alone leaves
 * `tabindex` rewritten.
 */

export type FocusGroupBehavior =
  | "toolbar"
  | "tablist"
  | "radiogroup"
  | "listbox"
  | "menu"
  | "menubar"
  | "none";

/** The same shape as the polyfill's `FocusGroupDefinition`, one source for both providers. */
export interface FocusGroupDefinition {
  readonly behavior: FocusGroupBehavior;
  /** `false` emits `nowrap`; omitted leaves the behavior token's default. */
  readonly wrap?: boolean;
  /** `"block"` for a vertical group; omitted leaves the behavior token's default. */
  readonly axis?: "inline" | "block";
  /** `false` emits `nomemory`. */
  readonly memory?: boolean;
}

export interface FocusGroupOptions {
  readonly definition: FocusGroupDefinition;
  /**
   * The owner's items, in tab order, read at construction and again on every
   * `update()`. Return the elements as the DOM has them: an item that is
   * disabled, hidden or opted out (`focusgroup="none"`) is the platform's
   * business, not the collection's.
   */
  readonly items: () => ReadonlyArray<HTMLElement>;
}

export interface FocusGroupHandle {
  /** The `focusgroup` attribute string for the definition (`"toolbar block nowrap"`). */
  readonly attribute: string;
  /**
   * Re-collect the items, and re-apply the definition when one is passed. Call it
   * when items are added or removed, when one changes visibility, or when an
   * item's `focusgroupstart` moves — without a definition, so the provider keeps
   * the focused item. Pass the definition only when it changed. A host must not
   * wait for the adapter to observe anything, it does not observe.
   */
  readonly update: (definition?: FocusGroupDefinition) => void;
  /** Undo the provider, then release its listeners. Idempotent. */
  readonly destroy: () => void;
}

/**
 * The `focusgroup` attribute a definition maps to: the behavior token, then the
 * axis, the wrap choice and `nomemory` when the definition states them. The
 * polyfill's `parseDefinition` reads exactly these tokens, and a native engine
 * parses the same grammar.
 */
export const focusGroupAttribute = (definition: FocusGroupDefinition): string => {
  const tokens: string[] = [definition.behavior];
  if (definition.axis !== undefined) {
    tokens.push(definition.axis);
  }
  if (definition.wrap !== undefined) {
    tokens.push(definition.wrap ? "wrap" : "nowrap");
  }
  if (definition.memory === false) {
    tokens.push("nomemory");
  }
  return tokens.join(" ");
};

/** Whether the engine implements `focusgroup` itself (`'focusGroup' in HTMLElement.prototype`). */
export const supportsFocusGroup = (): boolean => "focusGroup" in HTMLElement.prototype;

/** An array-backed item collection: the minimum the polyfill's `FocusGroup` reads. */
const itemCollection = (items: () => ReadonlyArray<HTMLElement>) => {
  const contains = (element: Element): boolean => items().some((item) => item === element);
  /**
   * The entry point: the item carrying `focusgroupstart`. The native engine reads
   * the attribute itself; this hands the same element to the polyfill, whose
   * collection is asked for `start` instead (`TreeWalkerItemCollection` does the
   * same lookup). Outside the collection it is no start at all.
   */
  const start = (): HTMLElement | null =>
    items().find((element) => element.hasAttribute("focusgroupstart")) ?? null;
  return {
    *items() {
      for (const element of items()) {
        yield { element };
      }
    },
    get start() {
      return start();
    },
    first: (): HTMLElement | null => items()[0] ?? null,
    last: (): HTMLElement | null => items().at(-1) ?? null,
    next: (current: HTMLElement): HTMLElement | null => {
      const all = items();
      return all[all.indexOf(current) + 1] ?? null;
    },
    previous: (current: HTMLElement): HTMLElement | null => {
      const all = items();
      return all[all.indexOf(current) - 1] ?? null;
    },
    contains,
    isItem: contains,
  };
};

/**
 * The polyfill bails out of its own constructor where the engine has the feature
 * (`"focusgroup" in HTMLElement.prototype || "focusGroup" in ...`). Forcing it
 * therefore means hiding the IDL property from that one check: a native engine
 * reads the DOM, not the property, and its `focusgroup` attribute is gone by
 * then, so it stays out of the group. The descriptor is restored immediately.
 */
const construct = (owner: HTMLElement, options: FocusGroupOptions): FocusGroup => {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "focusGroup");
  if (descriptor !== undefined) {
    delete (HTMLElement.prototype as unknown as { focusGroup?: unknown }).focusGroup;
  }
  try {
    return new FocusGroup(owner, itemCollection(options.items), {
      definition: options.definition,
    });
  } finally {
    if (descriptor !== undefined) {
      Object.defineProperty(HTMLElement.prototype, "focusGroup", descriptor);
    }
  }
};

/**
 * The polyfill provider: the low-level `FocusGroup` class over the owner's items,
 * with the definition handed in (never parsed from the attribute) and no
 * decoration hooks (the widget writes its own roles).
 *
 * It removes the owner's `focusgroup` attribute first: this path is for an
 * engine without the feature, and a host that forces it in an engine that has
 * the feature (a test, or a page mixing providers) must keep the native engine
 * out of the same group. Do not re-add the attribute while this handle lives.
 */
export const focusGroupPolyfill = (
  owner: HTMLElement,
  options: FocusGroupOptions,
): FocusGroupHandle => {
  const { definition } = options;
  owner.removeAttribute("focusgroup");
  const group = construct(owner, options);
  let destroyed = false;
  return {
    attribute: focusGroupAttribute(definition),
    update: (next) => {
      if (destroyed) {
        return;
      }
      // pass a definition only when it changed: with `nomemory` the polyfill
      // clears its remembered item on every definition update, and a host that
      // only changed its item set or its `focusgroupstart` must not lose the
      // focused item to the entry point
      group.update(next === undefined ? {} : { definition: next });
    },
    destroy: () => {
      if (destroyed) {
        return;
      }
      destroyed = true;
      // measured: undecorate first (restores the authors' tabindex values), then disconnect
      group.update({ definition: {} });
      group.disconnect();
    },
  };
};

/**
 * Attach the `focusgroup` contract to `owner` with the best provider the engine
 * has. Native: only the attribute, the element itself is the group. Polyfill:
 * `focusGroupPolyfill`.
 *
 * Call it once the owner element exists (a Solid `ref`, `onMount`), with an
 * `items` reader that answers from the live DOM; then call `update()` whenever
 * the item set, an item's visibility or the definition changes.
 */
export const focusGroup = (owner: HTMLElement, options: FocusGroupOptions): FocusGroupHandle => {
  if (!supportsFocusGroup()) {
    return focusGroupPolyfill(owner, options);
  }
  const attribute = focusGroupAttribute(options.definition);
  owner.setAttribute("focusgroup", attribute);
  return {
    attribute,
    update: (definition) => {
      owner.setAttribute("focusgroup", focusGroupAttribute(definition ?? options.definition));
    },
    // the platform owns the group; there is nothing to release (the owner leaves the DOM)
    destroy: () => {},
  };
};
