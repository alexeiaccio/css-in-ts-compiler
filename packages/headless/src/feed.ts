import { type Accessor, createEffect, createSignal, createUniqueId } from "solid-js";
import { createControllable } from "./controllable";

/**
 * Options are read lazily (getters); pass a component's `props`.
 */
export interface FeedOptions {
  /** Article slots rendered in the DOM (loaded ones are shown). */
  readonly items?: number;
  /** Server total: a number, or null when undetermined. */
  readonly totalArticles?: number | null;
  /** Controlled: the host owns the loaded count and this is the only thing that changes it. */
  readonly value?: number | undefined;
  /** Uncontrolled starting count; ignored while `value` is set. */
  readonly defaultValue?: number;
  readonly sizeMode?: "loaded" | "total";
  readonly totalKnown?: boolean;
  readonly labelledBy?: string | undefined;
  /** Base for the generated ids. */
  readonly id?: string;
  /**
   * A request to change the loaded count, called when an arriving batch differs
   * from the current value. Uncontrolled it is accepted; controlled the host
   * may ignore it.
   */
  readonly onValueChange?: (loaded: number) => void;
}

export interface FeedProps {
  readonly id: string;
  readonly role: "feed";
  readonly "aria-busy": "true" | undefined;
  readonly "aria-labelledby": string | undefined;
}

export interface FeedArticleProps {
  readonly id: string;
  readonly role: "article";
  readonly "aria-posinset": number;
  readonly "aria-setsize": number;
  readonly "aria-labelledby": string;
  readonly "aria-describedby": string;
  readonly tabindex: 0;
  readonly hidden: boolean;
  readonly onFocus: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

/** Spread onto the focusable element just before / after the feed. */
export interface FeedSentinelProps {
  readonly id: string;
  readonly tabindex: 0;
  readonly onFocus: () => void;
}

export type FeedActive = number | "before" | "after";

export interface Feed {
  readonly items: number;
  readonly loaded: Accessor<number>;
  readonly busy: Accessor<boolean>;
  /** Focused article (1-based posinset) or the outside zone. */
  readonly active: Accessor<FeedActive>;
  readonly focusArticle: (posinset: number) => void;
  readonly pageDown: () => void;
  readonly pageUp: () => void;
  readonly ctrlEnd: () => void;
  readonly ctrlHome: () => void;
  /** Scroll/position asked for more: `aria-busy` goes true while in flight. */
  readonly loadStart: () => void;
  /** A batch arrived; a request to grow the loaded count. */
  readonly loadFinish: (count: number) => void;
  readonly loadFail: () => void;
  readonly setSizeMode: (mode: "loaded" | "total") => void;
  readonly setTotalKnown: (known: boolean) => void;
  readonly feedProps: FeedProps;
  readonly articleProps: (posinset: number) => FeedArticleProps;
  readonly beforeProps: FeedSentinelProps;
  readonly afterProps: FeedSentinelProps;
}

/**
 * APG Feed (https://www.w3.org/WAI/ARIA/apg/patterns/feed/): state plus prop
 * objects for the feed container, its articles and the two outside focus
 * sentinels. Focus reaching the last loaded article triggers a load; `aria-busy`
 * brackets it; Page Up/Down move by article; Control+End/Home leave the feed.
 * No styling, no elements. Checked against `specs/apg/feed.qnt`.
 *
 * Platform: **library** — focusgroup V2 `feed` is explainer-only, so the load
 * trigger, busy bracketing and Page Up/Down / Control+End/Home keys are ours.
 *
 * Request/commit (map ticket `rt1p`): uncontrolled by default (`defaultValue`);
 * pass `value` + `onValueChange` to own the loaded count. `loadFinish` is the
 * request; `loadStart` / `loadFail` are adapter lifecycle events.
 */
export const createFeed = (options: FeedOptions = {}): Feed => {
  const items = Math.max(1, options.items ?? 6);
  const base = options.id ?? createUniqueId();
  const total = (): number | null => options.totalArticles ?? null;
  const clampLoaded = (count: number): number => Math.max(1, Math.min(count, items));

  const [loaded, requestLoaded] = createControllable({
    value: () => (options.value === undefined ? undefined : clampLoaded(options.value)),
    initial: clampLoaded(options.defaultValue ?? 1),
    onChange: () => options.onValueChange,
  });
  const [phase, setPhase] = createSignal<"idle" | "loading">("idle");
  const [sizeMode, setSizeMode] = createSignal<"loaded" | "total">(options.sizeMode ?? "loaded");
  const [totalKnown, setTotalKnown] = createSignal(options.totalKnown ?? false);
  const [active, setActive] = createSignal<FeedActive>("before");

  const busy = (): boolean => phase() === "loading";
  const hasMore = (): boolean => {
    const all = total();
    return all === null ? true : loaded() < all;
  };
  const startLoad = (): void => {
    if (phase() === "idle" && hasMore()) {
      setPhase("loading");
    }
  };

  const focusArticle = (posinset: number): void => {
    if (posinset < 1 || posinset > items || posinset > loaded()) {
      return;
    }
    setActive(posinset);
    if (posinset === loaded()) {
      startLoad();
    }
  };

  const pageDown = (): void => {
    const current = active();
    if (typeof current !== "number") {
      return;
    }
    const target = current < loaded() ? current + 1 : current;
    setActive(target);
    if (target === loaded()) {
      startLoad();
    }
  };

  const pageUp = (): void => {
    const current = active();
    if (typeof current === "number" && current > 1) {
      setActive(current - 1);
    }
  };

  // a host writing the controlled value settles any in-flight load and keeps
  // the focus cursor inside the new range (the spec's `setValue`)
  createEffect(
    () => options.value,
    () => {
      if (phase() === "loading") {
        setPhase("idle");
      }
      const current = active();
      if (typeof current === "number" && current > loaded()) {
        setActive(Math.max(1, loaded()));
      }
    },
  );

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.ctrlKey && event.key === "End") {
      event.preventDefault();
      setActive("after");
    } else if (event.ctrlKey && event.key === "Home") {
      event.preventDefault();
      setActive("before");
    } else if (event.key === "PageDown") {
      event.preventDefault();
      pageDown();
    } else if (event.key === "PageUp") {
      event.preventDefault();
      pageUp();
    }
  };

  return {
    items,
    loaded,
    busy,
    active,
    focusArticle,
    pageDown,
    pageUp,
    ctrlEnd: () => setActive("after"),
    ctrlHome: () => setActive("before"),
    loadStart: startLoad,
    loadFinish: (count) => {
      if (phase() !== "loading") {
        return;
      }
      const all = total();
      const remaining = all === null ? count : Math.max(0, all - loaded());
      const next = loaded() + Math.min(count, all === null ? count : remaining);
      requestLoaded(next);
      setPhase("idle");
    },
    loadFail: () => {
      if (phase() === "loading") {
        setPhase("idle");
      }
    },
    setSizeMode: (mode) => setSizeMode(mode),
    setTotalKnown: (known) => setTotalKnown(known),
    feedProps: {
      id: base,
      role: "feed",
      get "aria-busy"() {
        return busy() ? "true" : undefined;
      },
      "aria-labelledby": options.labelledBy,
    },
    articleProps: (posinset) => ({
      id: `${base}-article-${posinset}`,
      role: "article",
      "aria-posinset": posinset,
      get "aria-setsize"() {
        if (sizeMode() === "loaded") {
          return loaded();
        }
        const all = total();
        return totalKnown() && all !== null ? all : -1;
      },
      "aria-labelledby": `${base}-article-${posinset}-title`,
      "aria-describedby": `${base}-article-${posinset}-content`,
      tabindex: 0,
      get hidden() {
        return posinset > loaded();
      },
      onFocus: () => focusArticle(posinset),
      onKeyDown,
    }),
    beforeProps: {
      id: `${base}-before`,
      tabindex: 0,
      onFocus: () => setActive("before"),
    },
    afterProps: {
      id: `${base}-after`,
      tabindex: 0,
      onFocus: () => setActive("after"),
    },
  };
};
