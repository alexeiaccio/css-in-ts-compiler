// What the profile screen draws, as plain data (test/profile.mjs runs it on recorded responses). No cssints, no Solid here.
import type { AppBskyFeedDefs } from "@atcute/bluesky";
import type { Facet } from "@atcute/bluesky-richtext-segmenter";
import { ClientResponseError } from "@atcute/client";

import type { ProfileTab } from "../api.ts";
import { count } from "../post/model.ts";
import type { Feature } from "../post/model.ts";

type Item = AppBskyFeedDefs.FeedViewPost;

export interface Tab {
  id: string;
  label: string;
  filter: ProfileTab;
}
export const TABS: readonly Tab[] = [
  { id: "posts", label: "Posts", filter: "posts_no_replies" },
  { id: "replies", label: "Replies", filter: "posts_with_replies" },
  { id: "media", label: "Media", filter: "posts_with_media" },
];

// "35M", "865", and "0" where the post card shows nothing.
export const stat = (n: number | undefined) => count(n) || "0";

const isPin = (i: Item) => i.reason?.$type === "app.bsky.feed.defs#reasonPin";

// The pinned post first, and not again where the feed has it too (the server sends the pin on the first page only).
export function pinnedFirst(items: Item[]): Item[] {
  const pin = items.find(isPin);
  return pin ? [pin, ...items.filter((i) => i !== pin && i.post.uri !== pin.post.uri)] : items;
}

// The line above a card: why this post is in the list.
export function reason(i: Item): string | undefined {
  if (isPin(i)) return "Pinned";
  if (i.reason?.$type === "app.bsky.feed.defs#reasonRepost") {
    const by = i.reason.by;
    return `Reposted by ${by.displayName || by.handle}`;
  }
  const parent = i.reply?.parent;
  return parent && "author" in parent && "handle" in parent.author
    ? `Replying to @${parent.author.handle}`
    : undefined;
}

// getProfile does not return facets for the bio, so find links, @handles and #tags here (bsky.app does the same on the client).
// A mention's feature carries the handle where the lexicon has a DID: the route takes both.
const enc = new TextEncoder();
const bytes = (s: string) => enc.encode(s).length;
const TOKEN =
  /(?<=^|[\s(])(?:(https?:\/\/\S*[^\s.,;:!?)])|@((?:[a-z0-9-]+\.)+[a-z]{2,})|#([^\s#.,;:!?)]+))/gi;
export function bioFacets(text: string): Facet<Feature>[] {
  return [...text.matchAll(TOKEN)].map((m) => {
    const byteStart = bytes(text.slice(0, m.index));
    const [, uri, handle] = m;
    return {
      index: { byteStart, byteEnd: byteStart + bytes(m[0]) },
      features: [
        uri
          ? { $type: "app.bsky.richtext.facet#link", uri }
          : handle
            ? { $type: "app.bsky.richtext.facet#mention", did: handle }
            : { $type: "app.bsky.richtext.facet#tag" },
      ],
    };
  });
}

// Why a profile did not load. getProfile answers 400 for all three: "Profile not found", "AccountTakedown" (suspended) and
// "AccountDeactivated"; a malformed handle is a 400 as well, and reads as not found. Anything else (a dropped connection, a 5xx,
// a rate limit) is worth a retry.
export type Failure = "notFound" | "suspended" | "deactivated" | "failed";
export function failure(err: unknown): Failure {
  if (err instanceof ClientResponseError && err.status === 400) {
    if (err.error === "AccountTakedown") return "suspended";
    if (err.error === "AccountDeactivated") return "deactivated";
    return "notFound";
  }
  return "failed";
}

export const titleOf = (p: { displayName?: string; handle: string }) =>
  p.displayName ? `${p.displayName} (@${p.handle})` : `@${p.handle}`;
