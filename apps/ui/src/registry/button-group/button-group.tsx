import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };

import { type PartProps, renderPart, type Renderable } from "../render.tsx";

export interface ButtonGroupProps extends Renderable<PartProps, void> {
  /**
   * Which way the buttons lie: a row collapses the corners two neighbours share on the left and right, a column top and
   * bottom.
   */
  readonly orientation?: "horizontal" | "vertical";
  /** The compact look for everything inside, as a toolbar's: `data-size` is the context a button reads with `within()`. */
  readonly size?: "sm" | "md";
  /** The group's name: `role="group"` needs one. */
  readonly label: string;
  readonly class?: string;
  readonly children?: JSX.Element;
}

// A group draws nothing and knows nothing of its children: it is a context. Its marker class (`group("row")` /
// `group("column")`) is what the buttons inside read with `within()`, so the corners they share square off and the two 1px
// borders between two of them become one — the container selects a child the plugin's user code cannot (`:first-child` on
// the button, gated by the ancestor's marker).
const horizontal = css.cn(
  css.group(),
  css.group("row"),
  css.display("inline-flex"),
  css.alignItems("stretch"),
  css.width("max-content"),
);

const vertical = css.cn(
  css.group(),
  css.group("column"),
  css.display("inline-flex"),
  css.flexDirection("column"),
  css.alignItems("stretch"),
  css.width("max-content"),
);

/**
 * A group of buttons: `role="group"` with a name, one line of them (`orientation`), and the size the buttons inside take
 * as their context. The group itself has no frame and no background: the buttons keep their tone, and only the corners
 * they share and the border between two of them are the group's.
 */
export const ButtonGroup = (props: ButtonGroupProps): JSX.Element => {
  const own = {
    "data-part": "button-group",
    "aria-label": props.label,
    "data-size": props.size ?? "md",
    "data-orientation": props.orientation ?? "horizontal",
    get class() {
      return css.cn(props.orientation === "vertical" ? vertical : horizontal, props.class);
    },
  } as PartProps;
  return renderPart(props, own, undefined, (part) => (
    <div role="group" {...part}>
      {props.children}
    </div>
  ));
};
