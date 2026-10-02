// src/api.ts and src/paged.ts against recorded API responses (test/fixtures, made by scripts/record-fixtures.mjs): the
// moderation rule, the screens' loaders, the cursor cap and the paging helper. fetch is replaced before api.ts loads (atcute
// takes it then), so nothing here reaches the network. Run with --conditions=browser: Solid's client build.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const fixture = (name) =>
  JSON.parse(readFileSync(`${import.meta.dirname}/fixtures/${name}.json`, "utf8"));
const discover = fixture("discover");
const authorFeed = fixture("author-feed");
const profile = fixture("profile");
const thread = fixture("thread");

// What the server will answer: a function of the request, set by each test.
/** @type {(method: string, params: Record<string, string>) => unknown} */
let answer = () => assert.fail("unexpected request");
const requests = [];
globalThis.fetch = async (url) => {
  const u = new URL(url);
  const method = u.pathname.replace("/xrpc/", "");
  const params = Object.fromEntries(u.searchParams);
  requests.push({ method, params });
  const body = await answer(method, params);
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });
};

const api = await import("../src/api.ts");
const { createPaged } = await import("../src/paged.ts");
const { createRoot, flush, resolve } = await import("solid-js");

// ---- moderation ------------------------------------------------------------------------------
const MOD = api.BSKY_MOD;
const label = (val, src, uri = "at://did:plc:a/app.bsky.feed.post/1") => ({
  src,
  uri,
  val,
  cts: "",
});
const v = (did, ...ls) => api.verdict(did, ...ls);
assert.equal(v("did:plc:a"), "show");
assert.equal(v("did:plc:a", [label("porn", MOD)]), "hide");
assert.equal(v("did:plc:a", [label("sexual", "did:plc:a")]), "hide", "a self-label");
assert.equal(v("did:plc:a", [label("sexual", "did:plc:b")]), "show", "another labeler is ignored");
assert.equal(
  v("did:plc:a", [label("sexual-figurative", MOD)]),
  "show",
  "a custom value is ignored",
);
assert.equal(v("did:plc:a", [label("!warn", MOD)]), "warn");
assert.equal(
  v("did:plc:a", [label("!warn", "did:plc:a")]),
  "show",
  "!warn is for the mod service only",
);
assert.equal(v("did:plc:a", [label("!hide", MOD)]), "hide");
assert.equal(v("did:plc:a", [label("!no-unauthenticated", "did:plc:a", "did:plc:a")]), "hide");
assert.equal(
  v("did:plc:a", [label("!no-unauthenticated", MOD, "did:plc:a")]),
  "show",
  "the author must say it",
);
assert.equal(
  v("did:plc:a", [label("!warn", MOD)], [label("porn", MOD)]),
  "hide",
  "the strictest wins",
);
const profileLabel = label("porn", MOD, "at://did:plc:a/app.bsky.actor.profile/self");
assert.equal(v("did:plc:a", [profileLabel]), "show", "a profile label does not hide the content");
assert.ok(api.mediaHidden("did:plc:a", [profileLabel]), "but it hides the avatar and banner");
assert.ok(!api.mediaHidden("did:plc:a", [label("porn", MOD)]));

// the recorded Discover page has authors that opted out of logged-out views
const optedOut = discover.feed.filter((i) =>
  i.post.author.labels?.some((l) => l.val === "!no-unauthenticated" && l.src === i.post.author.did),
);
assert.ok(optedOut.length >= 1, "the fixture holds a !no-unauthenticated author");
assert.ok(optedOut.every((i) => api.postVerdict(i.post) === "hide"));
assert.equal(
  discover.feed.filter((i) => api.postVerdict(i.post) === "hide").length,
  optedOut.length,
);

// ---- the loaders -----------------------------------------------------------------------------
answer = () => discover;
const home = await api.homeScreen();
assert.equal(home.items.length, discover.feed.length - optedOut.length);
assert.equal(home.cursor, discover.cursor);
assert.equal(requests.at(-1).method, "app.bsky.feed.getFeed");
assert.equal(requests.at(-1).params.feed, api.DISCOVER);

answer = () => ({ ...discover, cursor: "x".repeat(api.MAX_CURSOR) });
assert.equal((await api.homeScreen()).cursor, undefined, "a cursor that long ends the feed");

answer = () => authorFeed;
const posts = await api.loadAuthorFeed("@BSKY.app", "posts_with_replies");
assert.equal(posts.items.length, authorFeed.feed.length);
assert.equal(requests.at(-1).params.actor, "bsky.app", "@ stripped, lower-cased");
assert.equal(requests.at(-1).params.includePins, "true", "pins on the first page");
await api.loadAuthorFeed("bsky.app", "posts_no_replies", "c1");
assert.equal(requests.at(-1).params.cursor, "c1");
assert.equal(requests.at(-1).params.includePins, "false");

// quotes: every record embed of the feed becomes a card, a tombstone or a hidden card
const quotes = authorFeed.feed.flatMap((i) => api.quoteOf(i.post) ?? []);
// (a quoted starter pack, feed or list is in the fixture too: unwrapQuoteEmbed gives nothing for it, so no card yet)
const quotedPosts = authorFeed.feed.filter((i) =>
  i.post.embed?.record?.$type?.startsWith("app.bsky.embed.record#"),
);
assert.equal(quotes.length, quotedPosts.length);
assert.ok(quotedPosts.length < authorFeed.feed.filter((i) => i.post.embed?.record).length);
assert.ok(quotes.some((q) => q.kind === "post"));
const recordPost = authorFeed.feed.find((i) => api.quoteOf(i.post)?.kind === "post").post;
const hiddenQuote = structuredClone(recordPost);
hiddenQuote.embed.record.author.labels = [label("porn", MOD, "did:plc:a")];
assert.equal(api.quoteOf(hiddenQuote)?.kind, "hidden");
const blocked = structuredClone(recordPost);
blocked.embed.record = {
  $type: "app.bsky.embed.record#viewBlocked",
  uri: "at://did:plc:a/app.bsky.feed.post/1",
  blocked: true,
};
assert.deepEqual(api.quoteOf(blocked), { kind: "gone", why: "blocked" });
assert.equal(api.quoteOf(authorFeed.feed.find((i) => !i.post.embed).post), undefined);

answer = () => profile;
const head = await api.loadProfile("Bsky.app");
assert.equal(head.profile.handle, profile.handle);
assert.equal(head.verdict, "show");
assert.equal(head.mediaHidden, false);
assert.equal(requests.at(-1).params.actor, "bsky.app");

answer = () => thread;
const rkey = thread.thread.post.uri.split("/").pop();
const screen = await api.threadScreen("bsky.app", rkey);
assert.equal(requests.at(-1).params.uri, `at://bsky.app/app.bsky.feed.post/${rkey}`);
assert.equal(screen.root.kind, "post");
assert.equal(screen.parents.length, 1, "the parent chain, root first");
const liked = screen.root.replies.map((r) => (r.kind === "post" ? (r.post.likeCount ?? 0) : -1));
assert.ok(liked.length > 1);
assert.deepEqual(
  liked,
  liked.toSorted((a, b) => b - a),
  "replies: most liked first",
);
answer = () => ({
  thread: { $type: "app.bsky.feed.defs#blockedPost", uri: "at://x", blocked: true },
});
assert.equal((await api.threadScreen("bsky.app", "3x")).root.kind, "gone");

// ---- paging ----------------------------------------------------------------------------------
// Three pages as the server cuts them: the second is all opted-out authors, so moderation empties it.
const feed = discover.feed;
const okPosts = feed.filter((i) => api.postVerdict(i.post) !== "hide");
const hidden = feed.filter((i) => api.postVerdict(i.post) === "hide");
const pages = [okPosts.slice(0, 10), hidden, okPosts.slice(10)];
const served = () => (_, p) => {
  const n = Number(p.cursor ?? 0);
  return { feed: pages[n], cursor: n + 1 < pages.length ? String(n + 1) : undefined };
};

answer = served();
requests.length = 0;
await createRoot(async (dispose) => {
  const {
    feed: list,
    loadMore,
    loadingMore,
  } = createPaged(
    () => "discover",
    (_, cursor) => api.homeScreen(cursor),
  );
  assert.equal(await resolve(() => list.items.length), pages[0].length, "the first page");
  assert.equal(list.cursor, "1");

  // two calls in one tick are one request
  const calls = [loadMore(), loadMore()];
  assert.equal(
    loadingMore(),
    false,
    "a signal write waits for the flush, the guard is a plain variable",
  );
  flush();
  await Promise.all(calls);
  await sleep(5);
  assert.equal(
    requests.length,
    3,
    "first page, the empty page and the third: the empty page did not stop it",
  );
  assert.equal(list.items.length, okPosts.length, "pages appended, the emptied one skipped");
  assert.equal(list.cursor, undefined, "the end of the feed");

  await loadMore();
  assert.equal(requests.length, 3, "no cursor, no request");
  dispose();
});

console.log("sky api: moderation, loaders and paging ok");
process.exit(0);
