import { onSettled } from "solid-js";

// An empty box at the end of a list: calls `onVisible` when it comes within 600 px of the viewport. An observer fires when the
// intersection changes, so a box that stays in view after a page lands would not fire again: the caller makes a new Sentinel per
// page (`<Show when={cursor} keyed>`, `after` is that cursor). `onSettled` is called in the body: its cleanup needs an owner, and
// a `ref` callback has none when the box is made after an await.
export function Sentinel(props: { after: string; onVisible: () => void }) {
  let box!: HTMLDivElement;
  onSettled(() => {
    const io = new IntersectionObserver(
      (e) => e.some((x) => x.isIntersecting) && props.onVisible(),
      { rootMargin: "600px" },
    );
    io.observe(box);
    return () => io.disconnect();
  });
  return <div ref={(e) => (box = e)} aria-hidden="true" data-after={props.after} />;
}
