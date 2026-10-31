// The Sky page's fourth screen's data: apps/csssky has **no notifications screen, model or fixture** — its router has no
// route for one, `src/` has no `notifications/`, and `test/fixtures` holds no `listNotifications` answer (the only
// notifications in it are a recorded post *about* the notifications redesign) — so this is the one screen of the page
// whose rows are hand-carried, as `terminal/notify.c`'s and apps/csssky-tui's are. What is carried is the app's **five
// kinds and their wording**; who, what and when come from the app's own recordings, through the page's `postOf`
// (`Sky.tsx`), so a row is the recording's actor, the recording's post's first line and the recording's `createdAt`:
//
//   mentioned you    apps/csssky/test/fixtures/home-science-1.json   feed[11]  Erik Strub
//   reposted         .../home-discover-1.json                        feed[23]  Titania
//   liked your post  .../home-discover-1.json                        feed[20]  Michael Warburton
//   replied          .../thread.json                                 replies[0] jlp2024.bsky.social
//   followed you     .../thread.json                                 parent    Mina Kimes
//
// The follow has no post (the app shows no snippet for one), so its row carries the parent post's author and time and no
// at-uri: Enter on it opens nothing. The times are the recording's own, through the page's `ago` against the fixtures'
// capture moment (`SKY_NOW`), never the clock, so a frame reads the same today as it did when it was recorded. The rows
// are newest first, by that time.
//
// Nothing here fetches: the page's only network path is the thread's `load` (`Sky.tsx`), which a row uses. The three
// recordings are imported as data (a JSON module), so the browser's own bundle of the page carries them too — `profile.ts`
// reads its four at run time because they are ~200 KB and are only wanted once; these three are 166 KB and are what the
// screen is, so the page's build inlines them, and the first opening still only maps them (`Notify.tsx`'s `load`).
import discover from "../../../apps/csssky/test/fixtures/home-discover-1.json" with { type: "json" };
import science from "../../../apps/csssky/test/fixtures/home-science-1.json" with { type: "json" };
import thread from "../../../apps/csssky/test/fixtures/thread.json" with { type: "json" };

import type { AppBskyFeedDefs } from "@atcute/bluesky";

import type { Post } from "./Sky.tsx";

/** One card of the screen: the app's words for the kind, the recording's actor and post, and the post's time. There is no
 *  kind mark: the C page's ✦ ⟲ ♥ ↩ are dingbats Roboto does not carry, and a cell prints them only because the terminal
 *  does. `uri` is absent for the follow, whose notification has no post to open. */
export interface NotificationRow {
  readonly verb: string;
  readonly actor: string;
  readonly snippet?: string;
  readonly created: number;
  readonly uri?: string;
}

/** A recorded feed's answer: the PostViews a card is drawn from. */
interface Feed {
  readonly feed?: readonly { readonly post: AppBskyFeedDefs.PostView }[];
}

/** `thread.json`'s answer: the root, the parent above it and the first level of replies — all the parts this screen takes
 *  a row from. */
interface ThreadFixture {
  readonly thread?: {
    readonly parent?: { readonly post?: AppBskyFeedDefs.PostView };
    readonly replies?: readonly { readonly post?: AppBskyFeedDefs.PostView }[];
  };
}

/** The first paragraph of a record's text, its whitespace as the app's renderer collapses it: what the app shows under
 *  the verb. `undefined` for a post whose text is blank. */
function firstLine(text: string): string | undefined {
  const line = (text.split("\n")[0] ?? "").replace(/\s+/g, " ").trim();
  return line === "" ? undefined : line;
}

/** One row: the page's `Post` (the six fields the card draws), with the kind's words on top. A follow has no post: no
 *  snippet and no at-uri, only the actor and the time. */
function row(post: Post, verb: string, hasPost = true): NotificationRow {
  return {
    verb,
    actor: post.name || post.handle,
    snippet: hasPost ? firstLine(post.text) : undefined,
    created: post.created,
    uri: hasPost ? post.uri : undefined,
  };
}

/**
 * The five rows, newest first, over the app's recordings: `postOf` is the page's own (`Sky.tsx`), so a row's actor, text
 * and time are the card's would-be fields. The verbs are the app's five kind names — the one thing no fixture has.
 */
export function notificationsOf(postOf: (p: AppBskyFeedDefs.PostView) => Post): readonly NotificationRow[] {
  const discoverFeed = (discover as Feed).feed ?? [];
  const scienceFeed = (science as Feed).feed ?? [];
  const root = (thread as ThreadFixture).thread;
  const pick = (feed: readonly { readonly post: AppBskyFeedDefs.PostView }[], at: number) => {
    const view = feed[at]?.post;
    if (!view) throw new Error(`notifications: the recording has no post at ${at}`);
    return postOf(view);
  };
  const parent = root?.parent?.post;
  const reply = root?.replies?.[0]?.post;
  if (!parent || !reply) throw new Error("notifications: thread.json has no parent or reply");
  const rows = [
    row(pick(scienceFeed, 11), "mentioned you"),
    row(pick(discoverFeed, 23), "reposted"),
    row(pick(discoverFeed, 20), "liked your post"),
    row(postOf(reply), "replied"),
    row(postOf(parent), "followed you", false),
  ];
  return rows.sort((a, b) => b.created - a.created);
}
