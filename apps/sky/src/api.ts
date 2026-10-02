// The data layer: the public AppView through atcute, no login. Plain async functions, one per screen
// (docs/research/atproto-data.md has the findings behind each rule).
import { unwrapEmbed, unwrapQuoteEmbed } from "@atcute/bluesky";
import type {
  AppBskyEmbedRecord,
  AppBskyFeedDefs,
  AppBskyFeedGetAuthorFeed,
} from "@atcute/bluesky";
import { Client, ok, retryFetchHandler, simpleFetchHandler } from "@atcute/client";
import type { FetchHandler } from "@atcute/client";
import type { ActorIdentifier, ResourceUri } from "@atcute/lexicons";

export const APPVIEW = "https://public.api.bsky.app";
export const DISCOVER: ResourceUri =
  "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot";
export const BSKY_MOD = "did:plc:ar7c4by46qjdydhdevvrndac";

// retryFetchHandler retries HTTP 429 only. A dropped connection is a thrown `TypeError: fetch failed`, not `ok: false`,
// so retry those here too.
const base = retryFetchHandler({ handler: simpleFetchHandler({ service: APPVIEW }) });
const handler: FetchHandler = async (path, init) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await base(path, init);
    } catch (e) {
      if (attempt >= 2 || init.signal?.aborted) throw e;
      await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
    }
  }
};
const rpc = new Client({ handler });

export interface Page<T> {
  items: T[];
  cursor: string | undefined; // undefined = end of feed
}

// Discover's cursor grows by ~1.3 KB a page; around 8 KB of URL the server answers 414.
export const MAX_CURSOR = 6000;
const next = (cursor: string | undefined) =>
  cursor && cursor.length < MAX_CURSOR ? cursor : undefined;

// ---- moderation for a logged-out viewer ------------------------------------------------------
type Label = { src: string; uri: string; val: string };
export type Verdict = "show" | "warn" | "hide";

const ADULT = new Set(["porn", "sexual", "nudity", "graphic-media"]);
const RANK = { show: 0, warn: 1, hide: 2 } as const;
// A label on the profile record only concerns the avatar and banner; a label on a post, or on the whole
// account (its `uri` is a DID), concerns the content.
const onProfile = (l: Label) => l.uri.endsWith("/app.bsky.actor.profile/self");

// Only two sources count: the Bluesky mod service and the author (self-labels).
function one(l: Label, did: string): Verdict {
  const mod = l.src === BSKY_MOD;
  switch (l.val) {
    case "!no-unauthenticated": // the account opted out of logged-out views
      return l.src === did ? "hide" : "show";
    case "!hide":
      return mod ? "hide" : "show";
    case "!warn":
      return mod ? "warn" : "show";
    default: // adult content is off for a logged-out viewer, so there is no way to reveal it
      return !onProfile(l) && ADULT.has(l.val) && (mod || l.src === did) ? "hide" : "show";
  }
}

/** `labels` of the post (or quoted record) plus the labels of its author; other labelers and custom values are ignored. */
export function verdict(did: string, ...lists: (readonly Label[] | undefined)[]): Verdict {
  return lists
    .flatMap((x) => x ?? [])
    .map((l) => one(l, did))
    .reduce<Verdict>((a, b) => (RANK[b] > RANK[a] ? b : a), "show");
}

/** An author whose profile is labeled adult: draw a placeholder instead of the avatar and banner. */
export const mediaHidden = (did: string, authorLabels: readonly Label[] | undefined) =>
  (authorLabels ?? []).some(
    (l) => onProfile(l) && ADULT.has(l.val) && (l.src === BSKY_MOD || l.src === did),
  );

export const postVerdict = (p: AppBskyFeedDefs.PostView) =>
  verdict(p.author.did, p.labels, p.author.labels);

export type Quote =
  | { kind: "post"; post: AppBskyEmbedRecord.ViewRecord }
  | { kind: "hidden" } // moderated
  | { kind: "gone"; why: "blocked" | "detached" | "notFound" };

/** The quote card of a post (also inside recordWithMedia), or undefined when there is none. */
export function quoteOf(p: AppBskyFeedDefs.PostView): Quote | undefined {
  const q = unwrapQuoteEmbed(unwrapEmbed(p.embed).record);
  if (!q) return undefined;
  switch (q.$type) {
    case "app.bsky.embed.record#viewRecord":
      return verdict(q.author.did, q.labels, q.author.labels) === "hide"
        ? { kind: "hidden" }
        : { kind: "post", post: q };
    case "app.bsky.embed.record#viewBlocked":
      return { kind: "gone", why: "blocked" };
    case "app.bsky.embed.record#viewDetached":
      return { kind: "gone", why: "detached" };
    default:
      return { kind: "gone", why: "notFound" };
  }
}

const visible = (feed: AppBskyFeedDefs.FeedViewPost[]) =>
  feed.filter((i) => postVerdict(i.post) !== "hide");

// ---- home: a feed generator ------------------------------------------------------------------
export async function homeScreen(
  cursor?: string,
  feed: ResourceUri = DISCOVER,
): Promise<Page<AppBskyFeedDefs.FeedViewPost>> {
  const r = await ok(rpc.get("app.bsky.feed.getFeed", { params: { feed, limit: 30, cursor } }));
  return { items: visible(r.feed), cursor: next(r.cursor) };
}

// ---- profile: the actor is a handle or a DID, straight from the URL --------------------------
// The route param is a plain string; the lexicon wants the branded ActorIdentifier (a DID or a dotted handle).
export const cleanActor = (actor: string) =>
  actor.replace(/^@/, "").toLowerCase() as ActorIdentifier;

export type ProfileTab = NonNullable<AppBskyFeedGetAuthorFeed.$params["filter"]>;

export async function loadProfile(actor: string) {
  const p = await ok(
    rpc.get("app.bsky.actor.getProfile", { params: { actor: cleanActor(actor) } }),
  );
  return {
    profile: p,
    verdict: verdict(p.did, p.labels),
    mediaHidden: mediaHidden(p.did, p.labels),
  };
}

export async function loadAuthorFeed(
  actor: string,
  filter: ProfileTab,
  cursor?: string,
): Promise<Page<AppBskyFeedDefs.FeedViewPost>> {
  const r = await ok(
    rpc.get("app.bsky.feed.getAuthorFeed", {
      params: { actor: cleanActor(actor), filter, limit: 30, cursor, includePins: !cursor },
    }),
  );
  return { items: visible(r.feed), cursor: next(r.cursor) };
}

// ---- thread: /profile/:actor/post/:rkey ------------------------------------------------------
export type ThreadNode =
  | { kind: "post"; post: AppBskyFeedDefs.PostView; replies: ThreadNode[] }
  | { kind: "gone"; why: "blocked" | "notFound" | "hidden"; uri: string };

// blockedPost | notFoundPost | threadViewPost, plus the open-union fallback atcute adds to every union
type ThreadItem = NonNullable<AppBskyFeedDefs.ThreadViewPost["replies"]>[number];

function node(t: ThreadItem): ThreadNode {
  if (t.$type === "app.bsky.feed.defs#threadViewPost") {
    if (postVerdict(t.post) === "hide") return { kind: "gone", why: "hidden", uri: t.post.uri };
    const replies = (t.replies ?? []).map(node);
    // the API does not sort replies: most liked first
    replies.sort((a, b) => likes(b) - likes(a));
    return { kind: "post", post: t.post, replies };
  }
  const gone = t as { $type: string; uri?: string };
  return {
    kind: "gone",
    why: gone.$type === "app.bsky.feed.defs#blockedPost" ? "blocked" : "notFound",
    uri: gone.uri ?? "",
  };
}
const likes = (n: ThreadNode) => (n.kind === "post" ? (n.post.likeCount ?? 0) : -1);

export async function threadScreen(actor: string, rkey: string) {
  // a handle is fine in the at-uri: the AppView resolves it
  const uri = `at://${cleanActor(actor)}/app.bsky.feed.post/${rkey}` as const;
  const { thread } = await ok(
    rpc.get("app.bsky.feed.getPostThread", { params: { uri, depth: 2, parentHeight: 20 } }),
  );
  if (thread.$type !== "app.bsky.feed.defs#threadViewPost") {
    return { parents: [], root: node(thread) }; // blockedPost; a missing post is HTTP 400 NotFound, thrown by ok()
  }
  const parents: ThreadNode[] = [];
  for (
    let p = thread.parent;
    p;
    p = p.$type === "app.bsky.feed.defs#threadViewPost" ? p.parent : undefined
  ) {
    parents.unshift(node(p));
  }
  return { parents, root: node(thread) };
}
