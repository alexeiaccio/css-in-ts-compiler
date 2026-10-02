import type { ResourceUri } from "@atcute/lexicons";
import { createSignal } from "solid-js";

import { DISCOVER } from "../api.ts";

// The tabs of the home screen, by their generators' at:// URIs. All three answer without a login and page with a cursor
// (checked on 2026-10-02; the personal ones, For You and Popular With Friends, answer 502 or one post, so they are out).
export const FEEDS: readonly { name: string; uri: ResourceUri }[] = [
  { name: "Discover", uri: DISCOVER },
  {
    name: "Science",
    uri: "at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science",
  },
  {
    name: "News",
    uri: "at://did:plc:kkf4naxqmweop7dv4l2iqqf5/app.bsky.feed.generator/verified-news",
  },
];

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
