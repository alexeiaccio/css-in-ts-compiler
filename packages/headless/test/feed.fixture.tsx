import { type Feed, createFeed } from "../src/feed";
import { createEffect, createSignal } from "solid-js";
import type { FeedConfig } from "@cssints/apg-specs/apg/feed.bridge";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./dom-driver";
import { render } from "@solidjs/web";

/** Article slots rendered so the driver can address unloaded ones too. */
const SLOTS = 6;

/**
 * Renders `createFeed` with the two outside sentinels and `SLOTS` article slots.
 * Articles are labelled by `aria-posinset` (`data-part="article:1"` .. `:6`) so
 * the scenario targets address the article they mean. The feed starts focused on
 * the "before" sentinel (the spec's starting zone) and DOM focus is synced to
 * the primitive's active article / zone.
 *
 * Controlled, the fixture is the host: it keeps the loaded count in a signal,
 * passes it as `value`, and either writes every request back (`accepts`) or
 * ignores the callback.
 */
export const mountFeed = (config: FeedConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [host, setHost] = createSignal(config.pinned ?? config.loaded);
  const writeHost = (next: number): void => {
    if (config.controlled) {
      setHost(next);
    }
  };
  let api: Feed | undefined;

  const elementFor = (target: string | number): HTMLElement | undefined => {
    const label =
      target === "before"
        ? "before-feed"
        : target === "after"
          ? "after-feed"
          : typeof target === "number"
            ? `article:${target}`
            : target;
    return (
      [...root.querySelectorAll<HTMLElement>("[data-part]")].find(
        (element) => element.dataset["part"] === label,
      ) ?? undefined
    );
  };

  const dispose = render(() => {
    const feed = createFeed({
      items: SLOTS,
      totalArticles: config.totalArticles,
      get value() {
        return config.controlled ? host() : undefined;
      },
      defaultValue: config.loaded,
      sizeMode: config.sizeMode,
      totalKnown: config.totalKnown,
      labelledBy: config.labelledBy,
      onValueChange: (loaded) => {
        events.set("onLoadedChange", [...(events.get("onLoadedChange") ?? []), loaded]);
        if (config.accepts) {
          setHost(loaded);
        }
      },
    });
    api = feed;
    createEffect(
      () => feed.active(),
      (active) => {
        const element = elementFor(active);
        if (element !== undefined && document.activeElement !== element) {
          element.focus();
        }
      },
    );
    return (
      <div>
        <a data-part="before-feed" href="#before" {...feed.beforeProps}>
          Before
        </a>
        <div data-part="feed" {...feed.feedProps}>
          {Array.from({ length: SLOTS }, (_, slot) => (
            <div data-part={`article:${slot + 1}`} {...feed.articleProps(slot + 1)}>
              Article {slot + 1}
            </div>
          ))}
        </div>
        <a data-part="after-feed" href="#after" {...feed.afterProps}>
          After
        </a>
      </div>
    );
  }, root);

  return {
    root,
    events,
    setProp: (name, value) => {
      switch (name) {
        case "loadStart":
          api?.loadStart();
          break;
        case "loadFinish":
          api?.loadFinish(Number(value));
          break;
        case "loadFail":
          api?.loadFail();
          break;
        case "sizeMode":
          api?.setSizeMode(value === "total" ? "total" : "loaded");
          break;
        case "totalKnown":
          api?.setTotalKnown(value === true);
          break;
        case "setValue":
          if (config.controlled) {
            // the host writing its value settles any in-flight load (the spec's
            // `setValue` clears `phase`), then the value itself moves
            api?.loadFail();
            writeHost(Number(value));
          }
          break;
        default:
          throw new Error(`fixture has no prop ${name}`);
      }
    },
    focus: () => {
      const active = api?.active();
      if (active === undefined || active === null) {
        return null;
      }
      if (active === "before") {
        return "before-feed";
      }
      if (active === "after") {
        return "after-feed";
      }
      return `article:${active}`;
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
