import { createSignal } from "solid-js";

export { FEEDS } from "./feeds.ts";

// Which tab is open, which ones have been opened, and where each was scrolled to. A tab's panel is made when it is first
// opened and kept (hidden) after that, so its loaded pages stay; the scroll position is the window's, saved on the way out.
export function createTabs(count: number) {
  const [active, setActive] = createSignal(0);
  const [opened, setOpened] = createSignal<readonly number[]>([0]);
  const scroll: number[] = Array.from({ length: count }, () => 0);
  let current = 0; // a plain variable: a signal write is not visible until the flush

  function select(i: number, scrollY: number) {
    if (i === current) return;
    scroll[current] = scrollY;
    current = i;
    setActive(i);
    setOpened((o) => (o.includes(i) ? o : [...o, i]));
  }
  return { active, opened, select, scrollOf: (i: number) => scroll[i] ?? 0 } as const;
}
