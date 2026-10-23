import { type Carousel, createCarousel } from "../src/carousel";
import { createEffect, createSignal } from "solid-js";
import type { CarouselConfig } from "@cssints/apg-specs/apg/carousel.bridge";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./dom-driver";
import { render } from "@solidjs/web";

/**
 * Renders `createCarousel` with controls, slides and the optional tablist, each
 * part carrying `data-part`, and exposes the `Mounted` the DOM driver needs.
 * `wait` steps advance one rotation interval through `setProp('tick')` (see the
 * test's driver wrapper): the primitive owns no timer. DOM focus is synced to
 * the primitive's focused part so keyboard nav moves real focus.
 *
 * Controlled, the fixture is the host: it keeps the shown slide in a signal,
 * passes it as `value`, and either writes every request back (`accepts`) or
 * ignores the callback.
 */
export const mountCarousel = (config: CarouselConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [host, setHost] = createSignal(config.pinned ?? config.initialIndex);
  const writeHost = (next: number): void => {
    if (config.controlled) {
      setHost(next);
    }
  };
  let api: Carousel | undefined;

  const partOf = (target: string): HTMLElement | undefined => {
    const [name = "", index = "0"] = target.split(":");
    return [...root.querySelectorAll<HTMLElement>(`[data-part="${name}"]`)][Number(index)];
  };

  const dispose = render(() => {
    const carousel = createCarousel({
      items: config.items,
      get value() {
        return config.controlled ? host() : undefined;
      },
      defaultIndex: config.initialIndex,
      autoRotate: config.autoRotate,
      playing: config.playing,
      reducedMotion: config.reducedMotion,
      tabbed: config.tabbed,
      stickyFocusPause: config.stickyFocusPause,
      hovering: config.hovering,
      role: config.role,
      labelledBy: config.labelledBy,
      onValueChange: (index) => {
        events.set("onIndexChange", [...(events.get("onIndexChange") ?? []), index]);
        if (config.accepts) {
          setHost(index);
        }
      },
    });
    api = carousel;
    createEffect(
      () => carousel.focused(),
      (target) => {
        const element = target === null ? undefined : partOf(target);
        if (element !== undefined && document.activeElement !== element) {
          element.focus();
        }
      },
    );
    const controls = (
      <>
        <button data-part="rotation" {...carousel.rotationProps}>
          Rotation
        </button>
        {config.tabbed ? null : (
          <>
            <button data-part="prev" {...carousel.prevProps}>
              Previous
            </button>
            <button data-part="next" {...carousel.nextProps}>
              Next
            </button>
          </>
        )}
      </>
    );
    const trailing = config.tabbed ? (
      <>
        <button data-part="prev" {...carousel.prevProps}>
          Previous
        </button>
        <button data-part="next" {...carousel.nextProps}>
          Next
        </button>
      </>
    ) : null;
    return (
      <div data-part="carousel" {...carousel.carouselProps}>
        {controls}
        {config.tabbed ? (
          <div data-part="tablist" {...carousel.tablistProps}>
            {Array.from({ length: config.items }, (_, index) => (
              <button data-part="tab" {...carousel.tabProps(index)}>
                Slide {index + 1}
              </button>
            ))}
          </div>
        ) : null}
        {Array.from({ length: config.items }, (_, index) => (
          <div data-part="slide" {...carousel.slideProps(index)}>
            Slide {index + 1}
          </div>
        ))}
        {trailing}
      </div>
    );
  }, root);

  return {
    root,
    events,
    setProp: (name, value) => {
      switch (name) {
        case "tick":
          api?.tick();
          break;
        case "setValue":
          writeHost(Number(value));
          break;
        default:
          throw new Error(`fixture has no prop ${name}`);
      }
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
