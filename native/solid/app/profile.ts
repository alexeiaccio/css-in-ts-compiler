// The Sky page's profile screen's data: apps/csssky's recorded `getProfile` / `getAuthorFeed` answers, mapped into the
// page's own records. The fixtures are ~140 KB of JSON (`apps/csssky/test/fixtures/profile-head.json` and the app's three
// profile feeds), so they are read at run time from the app's test folder — the way apps/csssky-tui reads its models —
// instead of being transcribed into this file, and only when the screen is first opened (`Profile.tsx`'s `load`).
// Nothing here fetches: the thread's loader is the page's only network path and the profile does not use it.
import { readFileSync } from "node:fs";

import { count } from "../../../apps/csssky/src/post/model.ts";
import type { AppBskyActorDefs, AppBskyFeedDefs } from "@atcute/bluesky";

import type { Post } from "./Sky.tsx";

/** The header's fields: the recording's display name (the handle when there is none), handle, bio and the three counts
 *  as the app prints them (`stat` of apps/csssky/src/profile/model.ts: Intl's compact form, and "0" for none). */
export interface ProfileHead {
  readonly name: string;
  readonly handle: string;
  readonly bio: string;
  readonly followers: string;
  readonly following: string;
  readonly posts: string;
}

/** One of the app's tabs (`TABS` of apps/csssky/src/profile/model.ts) and the posts its fixture holds. */
export interface ProfileTabData {
  readonly id: string;
  readonly label: string;
  readonly posts: readonly Post[];
}

export interface ProfileData {
  readonly head: ProfileHead;
  readonly tabs: readonly ProfileTabData[];
}

const FIXTURES = new URL("../../../apps/csssky/test/fixtures/", import.meta.url);
const read = <T>(name: string): T =>
  JSON.parse(readFileSync(new URL(`${name}.json`, FIXTURES), "utf8")) as T;

/** The app's tabs, in the app's order, each with the fixture its feed was recorded as. */
export const PROFILE_TABS = [
  { id: "posts", label: "Posts", fixture: "profile-posts" },
  { id: "replies", label: "Replies", fixture: "profile-replies" },
  { id: "media", label: "Media", fixture: "profile-media" },
] as const;

/** An author feed as it comes off the wire: the PostViews the card is drawn from. */
interface AuthorFeed {
  readonly feed?: readonly { readonly post: AppBskyFeedDefs.PostView }[];
}

/** The recorded profile, through the page's `postOf` for its lists: the head's four fields and the three tabs' cards.
 *  One recording (bsky.app's), so the screen shows it whichever card's author was pressed; `postOf` is the page's, so a
 *  list's cards are the feed's cards (the record's text and time, the media as the terminal's line, the counts). */
export function profileOf(postOf: (p: AppBskyFeedDefs.PostView) => Post): ProfileData {
  const head = read<AppBskyActorDefs.ProfileViewDetailed>("profile-head");
  return {
    head: {
      name: head.displayName || head.handle,
      handle: head.handle,
      bio: head.description ?? "",
      followers: count(head.followersCount) || "0",
      following: count(head.followsCount) || "0",
      posts: count(head.postsCount) || "0",
    },
    tabs: PROFILE_TABS.map((tab) => ({
      id: tab.id,
      label: tab.label,
      posts: (read<AuthorFeed>(tab.fixture).feed ?? []).map((item) => postOf(item.post)),
    })),
  };
}
