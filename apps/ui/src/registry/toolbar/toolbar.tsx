import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

export interface ToolbarProps extends Renderable<PartProps, void> {
  /** The compact look for everything inside: `data-size` is the context a control reads with `within()`. */
  readonly size?: "sm" | "md";
  readonly orientation?: "horizontal" | "vertical";
  /** The toolbar's name: a `role="toolbar"` needs one. */
  readonly label: string;
  readonly class?: string;
  readonly children?: JSX.Element;
}

// A toolbar is a container and a context: it holds the row, says how big and which way, and never styles a control inside it.
// A control that reads `within(attr("data-size", "sm"))` follows without a prop, and the frame of the app is still the app's.
const toolbar = css.cn(
  css.group(),
  css.display("flex"),
  css.alignItems("center"),
  css.gap(t.space._1),
  css.padding(t.space._1),
  css.borderRadius(t.radius.md),
);

const vertical = css.cn(css.flexDirection("column"), css.alignItems("stretch"));

/**
 * A toolbar: `role="toolbar"` with a name, a size and an orientation that the controls inside read as the context. A compact
 * toolbar (`size="sm"`) makes the buttons it holds compact through `within()`, not through a prop on each one.
 */
export const Toolbar = (props: ToolbarProps): JSX.Element => {
  const own = {
    "data-part": "toolbar",
    "aria-label": props.label,
    "data-size": props.size ?? "md",
    "data-orientation": props.orientation ?? "horizontal",
    get class() {
      return css.cn(toolbar, props.orientation === "vertical" && vertical, props.class);
    },
  } as PartProps;
  return renderPart(props, own, undefined, (part) => (
    <div role="toolbar" {...part}>
      {props.children}
    </div>
  ));
};
