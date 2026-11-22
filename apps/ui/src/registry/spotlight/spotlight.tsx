import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the element, `data-part` and the caller's class merged in. */
export interface SpotlightPartProps extends PartProps, Renderable<SpotlightPartProps, void> {}

export interface SpotlightProps extends SpotlightPartProps {
  readonly children?: JSX.Element;
}

const card = css.cn(
  frame().radius(t.radius.xl).padding(t.space._4).border("1px"),
  surface().color(t.color.surface),
  css.borderColor(t.color.border),
  css.color(t.color.text),
  css.group(),
  css.position("relative"),
  css.isolation("isolate"),
  css.overflow("hidden"),
);

const light = css.cn(
  css.position("absolute"),
  css.inset("0"),
  css.zIndex("-1"),
  css.pointerEvents("none"),
  css.opacity("0"),
  css.backgroundImage(
    css.radialGradient(
      "circle 14rem at var(--spot-x, 50%) var(--spot-y, 0%)",
      [css.colorMix("in oklab", [t.color.highlight, "28%"], "transparent"), "0%"],
      "transparent 70%",
    ),
  ),
  css.within(css.hover)(css.opacity("1")),
  css.within(css.focusWithin)(css.opacity("1")),
  css.media("(prefers-reduced-motion: no-preference)")(css.transition("opacity 160ms")),
);

const content = css.cn(css.position("relative"));

/**
 * A card whose light follows the pointer: a surface and a frame like `Card`, and a radial highlight under the content that
 * fades in on hover or on a control inside it taking focus.
 *
 * The pointer is the only script: `pointermove` writes the position into the card's `--spot-x` / `--spot-y` as percentages
 * (the gradient's own fallbacks are what an element nobody pointed at shows), so the light is one layer and no class is
 * generated per pixel. The card is a stacking context and the light a child at `z-index: -1` — over the surface, under the
 * content, with no wrapper — and it is `aria-hidden` and `pointer-events: none`, so it changes nothing a reader or a click
 * depends on.
 */
export const Spotlight = (props: SpotlightProps): JSX.Element => {
  const track = (event: PointerEvent): void => {
    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    element.style.setProperty("--spot-x", `${x.toFixed(1)}%`);
    element.style.setProperty("--spot-y", `${y.toFixed(1)}%`);
  };

  return renderPart(
    props,
    {
      "data-part": "spotlight",
      get class() {
        return css.cn(card, props.class);
      },
      onPointerMove: track,
    },
    undefined,
    (part) => (
      <div {...part}>
        <div data-part="spotlight-light" aria-hidden="true" class={light} />
        <div data-part="spotlight-content" class={content}>
          {props.children}
        </div>
      </div>
    ),
  );
};
