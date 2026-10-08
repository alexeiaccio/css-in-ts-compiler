// @cssints/stuck: style what is inside a sticky element while it is stuck. `sticky()` makes the element sticky and a
// scroll-state container; `stuck(...)` wraps styles of its descendants in `@container scroll-state(stuck: top)` (the
// query matches descendants of the container, never the container itself). Where a target lacks scroll-state queries,
// `stuck(...)` also emits the same styles under `[data-stuck~="top"]` on the sticky ancestor, an attribute that
// `@cssints/stuck/observer` (an IntersectionObserver, delivered by the runtime) sets.
import {
  type Style,
  type Wrap,
  attr,
  cn,
  container,
  within,
} from "cssints" with { type: "cssints" };
import { lacking, scope } from "cssints/plugin";

/** An edge a sticky element sticks to. */
export type Side = "top" | "right" | "bottom" | "left";

const SIDES: readonly string[] = ["top", "right", "bottom", "left"];
const QUERIES = "css.at-rules.container.scroll-state_queries";
const inset = (side: Side) => ({
  args: "<length-percentage>" as const,
  spacing: true as const,
  emit: (v: string) => [[side, v] as const],
});

/** The scope of `sticky()`, for a scope that embeds it (its kernel `core`). */
export const stuckScope = scope("stuck", {
  // Its conflicts are derived (position, container, container-type); the observer covers its support warnings.
  "#core": {
    css: (css) => [css.position("sticky"), css.containerType("scroll-state")],
    requires: [QUERIES],
  },
  // The observer covers the queries: virtual:cssints/runtime/stuck.observer imports it when a target lacks them.
  "#observer": {
    polyfills: [QUERIES, "css.properties.container-type.scroll-state"],
    script: "@cssints/stuck/observer",
  },
  // its group marker _g-stuck is what the fallback rules of stuck() read through within()
  sticky: {
    uses: ["core", "observer"],
    group: true,
    chain: {
      top: inset("top"),
      right: inset("right"),
      bottom: inset("bottom"),
      left: inset("left"),
    },
  },
});

/**
 * `sticky().top("0")`: `position: sticky`, `container-type: scroll-state` and the insets of its methods (each once, a
 * `<length-percentage>`, a lone number a spacing step). Its descendants take `stuck(...)` styles. It sets `position`
 * and `container-type`, so those in the same `cn()` are a build error.
 */
export const { sticky } = stuckScope.export();

const fallback = lacking(QUERIES).length > 0;
const under =
  (side: Side) =>
  (...styles: Style[]) =>
    cn(
      container(`scroll-state(stuck: ${side})`)(...styles),
      ...(fallback ? [within(attr("data-stuck", side, "~="), "stuck")(...styles)] : []),
    );

/** The styles of a descendant of `sticky()` while it is stuck: to the top edge, or to the side given. */
export interface Stuck {
  /** `stuck("bottom")(color("red"))`: while the sticky ancestor is stuck to that edge. */
  (side: Side): Wrap;
  /** `stuck(color("red"))`: while the sticky ancestor is stuck to the top edge. */
  (...styles: Style[]): Style;
}

/**
 * Styles of a descendant of `sticky()` while the sticky element is stuck: `stuck(...styles)` (top) or `stuck(side)(...styles)`.
 *
 * @returns {Style | Wrap} the styles under the condition, or the condition of that side
 */
export const stuck = ((...args: unknown[]) => {
  const [side] = args;
  if (typeof side !== "string") return under("top")(...(args as Style[]));
  if (SIDES.includes(side)) return under(side as Side);
  throw new Error(`cssints: stuck: stuck() takes top, right, bottom or left, got "${side}"`);
}) as Stuck;
