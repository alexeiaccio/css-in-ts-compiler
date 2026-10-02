import { onSettled } from "solid-js";

// An empty box at the end of a list: calls `onVisible` when it comes within 600 px of the viewport. An observer fires when the
// intersection changes, so a box that stays in view after a page lands would not fire again: the caller makes a new Sentinel per
// page (`<Show when={cursor} keyed>`, `after` is that cursor).
export function Sentinel(props: { after: string; onVisible: () => void }) {
  return (
    <div
      ref={(box) =>
        onSettled(() => {
          const io = new IntersectionObserver(
            (e) => e.some((x) => x.isIntersecting) && props.onVisible(),
            { rootMargin: "600px" },
          );
          io.observe(box);
          return () => io.disconnect();
        })
      }
      aria-hidden="true"
      data-after={props.after}
    />
  );
}
