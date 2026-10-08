// @cssints/stuck: style what is inside a sticky element while it is stuck. `sticky()` makes the element sticky and a
// scroll-state container; `stuck(...)` wraps styles of its descendants in `@container scroll-state(stuck: top)` (the
// query matches descendants of the container, never the container itself). Where a target lacks scroll-state queries,
// `stuck(...)` also emits the same styles under `[data-stuck~="top"]` on the sticky ancestor, an attribute that
// `@cssints/stuck/observer` (an IntersectionObserver, imported by the app) sets.
import { lackingOf } from "@cssints/css-grammar/support";
import {
  type Style,
  type Wrap,
  attr,
  cn,
  container,
  group,
  within,
} from "cssints" with { type: "cssints" };
import { scope } from "cssints/plugin";

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
  // Raw CSS, not styles: the value warning of `container-type: scroll-state` would not be covered by the runtime below.
  "#core": {
    css: "&{position:sticky;container-type:scroll-state}",
    requires: [QUERIES],
  },
  "#conflicts": {
    props: ["position", "container", "container-type"],
    message: "sticky() sets position and container-type: use its methods",
  },
  // The observer covers the queries (imported by the app: a runtime cannot ship a script of its own).
  "#observer": { polyfills: [QUERIES, "css.properties.container-type.scroll-state"] },
  sticky: {
    uses: ["core", "conflicts", "observer"],
    chain: {
      top: inset("top"),
      right: inset("right"),
      bottom: inset("bottom"),
      left: inset("left"),
    },
  },
});

const { sticky: member } = stuckScope.export();
type Sticky = typeof member;

// A member cannot carry a group() marker, so the chain is wrapped: each node also holds group("stuck"), which the
// fallback rules of stuck() read through within().
const grouped = (n: Style): Style => {
  const g = cn(group("stuck"), n);
  return new Proxy(g, {
    get: (t, k) =>
      typeof k === "symbol" || k in t
        ? Reflect.get(t, k)
        : (...args: unknown[]) =>
            grouped((Reflect.get(n, k) as (...a: unknown[]) => Style)(...args)),
  });
};

/**
 * `sticky().top("0")`: `position: sticky`, `container-type: scroll-state` and the insets of its methods (each once, a
 * `<length-percentage>`, a lone number a spacing step). Its descendants take `stuck(...)` styles. It sets `position`
 * and `container-type`, so those in the same `cn()` are a build error.
 */
export const sticky: Sticky = (() => grouped(member())) as unknown as Sticky;

const lacking = lackingOf(QUERIES).length > 0;
const under =
  (side: Side): Wrap =>
  (...styles) =>
    cn(
      container(`scroll-state(stuck: ${side})`)(...styles),
      ...(lacking ? [within(attr("data-stuck", side, "~="), "stuck")(...styles)] : []),
    );

/** The styles of a descendant of `sticky()` while it is stuck: to the top edge, or to the side given. */
export interface Stuck {
  /** `stuck("bottom")(color("red"))`: while the sticky ancestor is stuck to that edge. */
  (side: Side): Wrap;
  /** `stuck(color("red"))`: while the sticky ancestor is stuck to the top edge. */
  (...styles: Style[]): Style;
}

/** Styles of a descendant of `sticky()` while the sticky element is stuck: `stuck(...styles)` (top) or `stuck(side)(...styles)`. */
export const stuck = ((...args: unknown[]) => {
  const [side] = args;
  if (typeof side !== "string") return under("top")(...(args as Style[]));
  if (SIDES.includes(side)) return under(side as Side);
  throw new Error(`cssints: stuck: stuck() takes top, right, bottom or left, got "${side}"`);
}) as Stuck;
