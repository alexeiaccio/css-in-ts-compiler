// The thread screen's model against recorded threads (test/fixtures/thread-*.json, made by scripts/record-thread.mjs): the
// parent chain, the order of the replies, the tree cut at MAX_DEPTH, and the states (not found, blocked, hidden) in the chain, in
// the replies and as the whole screen. fetch is replaced before api.ts loads, so nothing here reaches the network.
// Run with --conditions=browser: Solid's client build.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const fixture = (name) =>
  JSON.parse(readFileSync(`${import.meta.dirname}/fixtures/${name}.json`, "utf8"));

/** @type {(params: Record<string, string>) => { status?: number, body: unknown }} */
let answer = () => assert.fail("unexpected request");
const requests = [];
globalThis.fetch = (url) => {
  const u = new URL(url);
  requests.push(Object.fromEntries(u.searchParams));
  const { status = 200, body } = answer(requests.at(-1));
  return Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }),
  );
};

const api = await import("../src/api.ts");
const { branches, countAll, goneText, MAX_DEPTH, moreLabel, repliesOf, titleOf } =
  await import("../src/thread/model.ts");
const { fullTime, stats } = await import("../src/post/model.ts");

const serve = (name) => {
  answer = () => ({ body: fixture(name) });
  const raw = fixture(name).thread;
  return api.threadScreen("someone.bsky.social", raw.post.uri.split("/").pop());
};
const levels = (nodes, depth = 1) =>
  nodes.flatMap((n) => [depth, ...levels(repliesOf(n), depth + 1)]);

// ---- a deep thread with parents ----------------------------------------------------------------
const deep = await serve("thread-deep");
assert.deepEqual(
  [requests.at(-1).depth, requests.at(-1).parentHeight],
  ["6", "20"],
  "the replies come six levels deep",
);
assert.equal(deep.root.kind, "post");
assert.equal(deep.parents.length, 2, "the parents of the focused post");
assert.ok(deep.parents.every((p) => p.kind === "post"));
const uriOf = (n) => n.post.uri;
const raw = fixture("thread-deep").thread;
assert.equal(uriOf(deep.parents[1]), raw.parent.post.uri, "the nearest parent is last");
assert.equal(
  uriOf(deep.parents[0]),
  raw.parent.parent.post.uri,
  "the first post of the chain is first",
);
assert.ok(deep.parents[0].replies.length === 0, "a parent has no replies of its own in the chain");
// a reply of this very fixture is by an account that opted out of logged-out views: a real hidden post, and the last one
const realHidden = deep.root.replies.at(-1);
assert.deepEqual([realHidden.kind, realHidden.why], ["gone", "hidden"]);
assert.ok(Math.max(...levels(deep.root.replies)) >= 5, "the fixture is deeper than MAX_DEPTH");

// replies are sorted at every level: more likes first, the earlier one when the likes are equal
const likes = (n) => (n.kind === "post" ? (n.post.likeCount ?? 0) : -1);
const at = (n) => Date.parse(n.post.record.createdAt ?? n.post.indexedAt);
(function sorted(nodes) {
  for (let i = 1; i < nodes.length; i++) {
    const [a, b] = [nodes[i - 1], nodes[i]];
    assert.ok(likes(a) >= likes(b), "likes, most first");
    if (likes(a) === likes(b)) assert.ok(at(a) <= at(b), "then time, earliest first");
  }
  nodes.forEach((n) => sorted(repliesOf(n)));
})(deep.root.replies);
assert.ok(
  new Set(deep.root.replies.map(likes)).size > 1 || deep.root.replies.length < 2,
  "the fixture has replies that differ in likes",
);

// a thread where the order matters: three replies with the same likes, given latest first, and one with more likes
const mk = (id, likeCount, createdAt) => ({
  $type: "app.bsky.feed.defs#threadViewPost",
  post: {
    ...raw.post,
    uri: `at://did:plc:x/app.bsky.feed.post/${id}`,
    likeCount,
    record: { text: id, createdAt },
  },
});
answer = () => ({
  body: {
    thread: {
      ...raw,
      parent: undefined,
      replies: [
        mk("late", 1, "2026-01-03T00:00:00Z"),
        mk("early", 1, "2026-01-01T00:00:00Z"),
        mk("top", 9, "2026-01-04T00:00:00Z"),
        {
          $type: "app.bsky.feed.defs#notFoundPost",
          uri: "at://did:plc:x/app.bsky.feed.post/gone",
          notFound: true,
        },
        mk("mid", 1, "2026-01-02T00:00:00Z"),
      ],
    },
  },
});
const ordered = (await api.threadScreen("x.bsky.social", "k")).root.replies;
assert.deepEqual(
  ordered.map((n) => (n.kind === "post" ? n.post.record.text : n.why)),
  ["top", "early", "mid", "late", "notFound"],
  "likes, then time; the tombstone last",
);

// ---- the tree cut at a depth ---------------------------------------------------------------------
const cut = branches(deep.root.replies);
const shown = (bs) => bs.reduce((n, b) => n + 1 + shown(b.replies), 0);
const collapsedCount = (bs) =>
  bs.reduce((n, b) => n + (b.more?.count ?? 0) + collapsedCount(b.replies), 0);
assert.equal(
  shown(cut) + collapsedCount(cut),
  countAll(deep.root.replies),
  "every reply is shown or counted behind a button",
);
(function check(bs, depth) {
  for (const b of bs) {
    assert.ok(depth <= MAX_DEPTH, "nothing is shown below MAX_DEPTH");
    if (b.more) {
      assert.equal(depth, MAX_DEPTH, "a button only at the last level");
      assert.deepEqual(b.replies, []);
      assert.equal(b.more.rest, repliesOf(b.node), "it opens on the replies of that post");
      assert.equal(b.more.count, countAll(b.more.rest));
    } else if (depth === MAX_DEPTH)
      assert.equal(repliesOf(b.node).length, 0, "no button, no replies");
    check(b.replies, depth + 1);
  }
})(cut, 1);
assert.ok(collapsedCount(cut) > 0, "the deep fixture collapses");
// "show more" opens the rest in place: the same rule again from the first level, nothing is lost
const first = (bs) => bs.find((b) => b.more) ?? bs.map((b) => first(b.replies)).find(Boolean);
const more = first(cut).more;
const opened = branches(more.rest);
assert.equal(shown(opened) + collapsedCount(opened), more.count);
assert.equal(moreLabel(1), "Show 1 more reply");
assert.equal(moreLabel(12), "Show 12 more replies");
assert.deepEqual(branches([]), []);

// ---- states --------------------------------------------------------------------------------------
// a parent that is gone ends the chain (nothing is known above it)
const nf = await serve("thread-notfound");
assert.equal(nf.root.kind, "post");
assert.deepEqual(
  nf.parents.map((p) => [p.kind, p.why]),
  [["gone", "notFound"]],
);
const bl = await serve("thread-blocked");
assert.deepEqual(
  bl.parents.map((p) => [p.kind, p.why]),
  [["gone", "blocked"]],
);
assert.equal(goneText[bl.parents[0].why], "Blocked post");
assert.match(goneText.notFound, /deleted/);

// the whole post is blocked: a state, no parents
answer = () => ({
  body: { thread: { $type: "app.bsky.feed.defs#blockedPost", uri: "at://x/y/z", blocked: true } },
});
assert.deepEqual(
  await api.threadScreen("bsky.app", "z").then((s) => [s.parents, s.root.kind, s.root.why]),
  [[], "gone", "blocked"],
);
// the whole post is gone: the API says HTTP 400 NotFound, which is a state, not a failure
answer = () => ({ status: 400, body: { error: "NotFound", message: "Post not found: at://x" } });
const missing = await api.threadScreen("bsky.app", "3zzzzzzzzzzzz");
assert.deepEqual([missing.parents, missing.root.kind, missing.root.why], [[], "gone", "notFound"]);
// any other failure still throws (the screen shows a retry)
answer = () => ({ status: 400, body: { error: "InvalidRequest", message: "bad uri" } });
await assert.rejects(api.threadScreen("bsky.app", "bad key"), /bad uri|InvalidRequest/);
answer = () => ({ status: 500, body: { error: "InternalServerError", message: "boom" } });
await assert.rejects(api.threadScreen("bsky.app", "3x"));

// states in the replies: blocked, not found and hidden (a moderated author) go to the end, and a hidden post takes its replies along
const tomb = structuredClone(raw);
const r0 = tomb.replies.find((r) => !r.post.author.labels?.length);
const hideMe = structuredClone(r0);
hideMe.post.labels = [{ src: api.BSKY_MOD, uri: hideMe.post.uri, val: "porn", cts: "" }];
tomb.replies = [
  hideMe,
  {
    $type: "app.bsky.feed.defs#blockedPost",
    uri: "at://did:plc:x/app.bsky.feed.post/b",
    blocked: true,
  },
  {
    $type: "app.bsky.feed.defs#notFoundPost",
    uri: "at://did:plc:x/app.bsky.feed.post/n",
    notFound: true,
  },
  ...tomb.replies,
];
answer = () => ({ body: { thread: tomb } });
const t2 = await api.threadScreen("x.bsky.social", "k");
const kinds = t2.root.replies.map((n) => (n.kind === "gone" ? n.why : "post"));
assert.equal(kinds.filter((k) => k !== "post").length, 4, "three made here and the recorded one");
assert.deepEqual(
  kinds.slice(-4),
  ["hidden", "blocked", "notFound", "hidden"],
  "tombstones after the posts, in the order they came",
);
const hidden = t2.root.replies.find((n) => n.why === "hidden" && n.uri === hideMe.post.uri);
assert.equal(hidden.uri, hideMe.post.uri);
assert.equal(repliesOf(hidden).length, 0, "no replies under a hidden post");
// tombstones are rows too: the cut counts them
const cutT = branches(t2.root.replies);
assert.equal(shown(cutT) + collapsedCount(cutT), countAll(t2.root.replies));

// ---- the title and the focused card's text ----------------------------------------------------------
const base = deep.root.post;
const withText = (text) => ({ ...base, record: { ...base.record, text } });
assert.equal(titleOf(withText("Hello,\n  world  ")), "Hello, world", "one line, trimmed");
const long = titleOf(withText("word ".repeat(40)));
assert.ok(long.length <= 80 && long.endsWith("…"), long);
assert.equal(
  titleOf({ ...withText(""), author: { ...base.author, displayName: "Ann", handle: "ann.test" } }),
  "Post by Ann",
);
assert.equal(
  titleOf({ ...withText(" "), author: { ...base.author, displayName: "", handle: "ann.test" } }),
  "Post by @ann.test",
);
assert.equal(titleOf(deep.root.post), titleOf(deep.root.post));
assert.match(fullTime("2026-10-02T15:14:00Z"), /^October [12], 2026 at \d{1,2}:\d{2}\s?[AP]M$/);
assert.equal(fullTime(undefined), "");
assert.deepEqual(
  stats({ replyCount: 1, repostCount: 0, quoteCount: 2, likeCount: 1204 }),
  [
    { n: "1", label: "reply" },
    { n: "2", label: "quotes" },
    { n: "1,204", label: "likes" },
  ],
  "zero counters are left out, the others in full",
);

console.log("sky thread: parents, sorting, collapse and states ok");
process.exit(0);
