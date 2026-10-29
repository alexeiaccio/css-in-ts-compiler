import type { JSX } from "@solidjs/web";
import { untrack } from "solid-js";

/**
 * What a part hands to `render`: the props the part owns (`id`, `aria-*`, `data-part`, `class`) and the state it is in, as
 * accessors — Solid does not re-render a component, so a snapshot would be dead on the second read.
 *
 * Base UI's `render` takes an element and clones it with the part's props; Solid cannot clone (JSX is already a node), so
 * the element form becomes the function form and a component is that function: `render={(props) => <a {...props} />}`,
 * `render={Button}`.
 */
export type Render<P extends object, S> = (props: P, state: S) => JSX.Element;

/**
 * What a part hands to `render`: element-generic attributes, because the element is the caller's (`<a>`, `<textarea>`, a
 * component). `ref` stays the caller's too — a part cannot type a ref for an element it has not chosen.
 */
export type PartProps = Omit<JSX.HTMLAttributes<HTMLElement>, "ref"> & {
  readonly class?: string;
};

/** A part that anything can render: `render` replaces its element and keeps the props the part owns. */
export interface Renderable<P extends object, S> {
  readonly render?: Render<P, S> | undefined;
}

/**
 * Renders a part: the caller's `render` when it gave one, the part's own element otherwise. `render` is structural, so it is
 * read once (untracked): a part that swapped it at run time would need a remount, not an update.
 *
 * @param {Renderable<P, S>} part the component's props, for the `render` it may carry
 * @param {P} props the part's props, already merged with the caller's own and with `class` and `data-part`
 * @param {S} state the part's state, as accessors
 * @param {(props: P) => JSX.Element} fallback the element the part is by default
 * @returns {JSX.Element} the part
 */
export const renderPart = <P extends object, S>(
  part: Renderable<PartProps, S>,
  props: P,
  state: S,
  fallback: (props: P) => JSX.Element,
): JSX.Element => {
  const render = untrack(() => part.render);
  // the part hands more than `PartProps` (its own element's attributes: `type` on a button, `value` on an input); a render
  // function is typed by what every part guarantees, and reads the rest as the DOM attributes they are
  return render === undefined ? fallback(props) : render(props as PartProps, state);
};
