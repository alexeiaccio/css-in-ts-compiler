import type { ResourceUri } from "@atcute/lexicons";

import { DISCOVER } from "../api.ts";

// The tabs of the home screen, by their generators' at:// URIs. All three answer without a login and page with a cursor
// (checked on 2026-10-02; the personal ones, For You and Popular With Friends, answer 502 or one post, so they are out).
// No Solid here: apps/sky-tui imports this list too.
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
