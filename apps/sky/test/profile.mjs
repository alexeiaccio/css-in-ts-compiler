// The profile screen's model (src/profile/model.ts) and its loaders against recorded responses (test/fixtures/profile-*.json, made
// by scripts/record-profile.mjs): counts, tabs to filters, the pinned post first, the bio's facets, and the failures of getProfile.
// fetch is replaced before api.ts loads, so nothing here reaches the network. Run with --conditions=browser, as api.mjs.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const fixture = (name) =>
  JSON.parse(readFileSync(`${import.meta.dirname}/fixtures/${name}.json`, "utf8"));
const head = fixture("profile-head");
const pages = {
  posts_no_replies: fixture("profile-posts"),
  posts_with_replies: fixture("profile-replies"),
  posts_with_media: fixture("profile-media"),
};

/** @type {(method: string, params: Record<string, string>) => { status?: number, body: unknown }} */
let answer = () => assert.fail("unexpected request");
const requests = [];
globalThis.fetch = async (url) => {
  const u = new URL(url);
  const method = u.pathname.replace("/xrpc/", "");
  const params = Object.fromEntries(u.searchParams);
  requests.push({ method, params });
  const { status = 200, body } = answer(method, params);
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
};
const api = await import("../src/api.ts");
const m = await import("../src/profile/model.ts");

// ---- the recording has what the screen draws -----------------------------------------------------
assert.ok(head.banner && head.avatar, "a banner and an avatar");
assert.ok(head.pinnedPost, "a pinned post");
assert.ok(head.description.includes("\n"));

// ---- counts --------------------------------------------------------------------------------------
assert.equal(m.stat(head.followersCount), "35M");
assert.equal(m.stat(head.followsCount), String(head.followsCount));
assert.equal(m.stat(865), "865");
assert.equal(m.stat(1200), "1.2K");
assert.equal(m.stat(0), "0", "the post card shows nothing for 0, a profile shows 0");
assert.equal(m.stat(undefined), "0");

// ---- tabs ----------------------------------------------------------------------------------------
assert.deepEqual(
  m.TABS.map((t) => [t.label, t.filter]),
  [
    ["Posts", "posts_no_replies"],
    ["Replies", "posts_with_replies"],
    ["Media", "posts_with_media"],
  ],
);
answer = (_, p) => ({ body: pages[p.filter] });
const loaded = {};
for (const tab of m.TABS) {
  loaded[tab.id] = await api.loadAuthorFeed("Bsky.app", tab.filter);
  const r = requests.at(-1);
  assert.equal(r.method, "app.bsky.feed.getAuthorFeed");
  assert.equal(r.params.filter, tab.filter);
  assert.equal(r.params.actor, "bsky.app");
  assert.equal(r.params.includePins, String(tab.id === "posts"), `${tab.id}: pins on Posts only`);
  assert.ok(loaded[tab.id].items.length > 0, tab.id);
}
// the Media tab holds posts with images, video or a gallery; the Replies tab has replies
const mediaKinds = loaded.media.items.map((i) => i.post.embed?.$type?.split("#")[0]);
assert.ok(mediaKinds.every((k) => /images|video|gallery|recordWithMedia/.test(k)), mediaKinds.join());
assert.ok(loaded.replies.items.some((i) => i.reply));
assert.ok(!loaded.posts.items.some((i) => i.reply), "no replies on the Posts tab");

// ---- the pinned post first -----------------------------------------------------------------------
const pinUri = head.pinnedPost.uri;
const posts = loaded.posts.items;
assert.equal(posts[0].post.uri, pinUri, "the server puts the pin first");
assert.equal(m.pinnedFirst(posts)[0].post.uri, pinUri);
const shuffled = [...posts.slice(1, 4), posts[0], ...posts.slice(4)];
assert.notEqual(shuffled[0].post.uri, pinUri);
assert.deepEqual(
  m.pinnedFirst(shuffled).map((i) => i.post.uri),
  [pinUri, ...shuffled.filter((i) => i.post.uri !== pinUri).map((i) => i.post.uri)],
  "moved to the top, the rest in order",
);
const twice = [...posts, { post: posts[0].post }]; // the same post, plain, on a later page
assert.equal(m.pinnedFirst(twice).length, posts.length, "not shown twice");
assert.equal(m.pinnedFirst(loaded.media.items), loaded.media.items, "no pin, no change");

// ---- the line above a card -----------------------------------------------------------------------
assert.equal(m.reason(posts[0]), "Pinned");
const repost = posts.find((i) => i.reason?.$type === "app.bsky.feed.defs#reasonRepost");
assert.match(m.reason(repost), /^Reposted by .+/);
const reply = loaded.replies.items.find((i) => i.reply && !i.reason);
assert.match(m.reason(reply), /^Replying to @[\w.-]+$/);
assert.equal(
  m.reason(posts.find((i) => !i.reason)),
  undefined,
);

// ---- the bio: links, handles and tags, at UTF-8 byte offsets --------------------------------------
const { parts } = await import("../src/post/model.ts");
assert.deepEqual(m.bioFacets(head.description), [], "an e-mail address is not a mention");
const bio = "Ünï bio 👋 https://example.com/a?b=1. Ask @bsky.app (or #atproto), a@b.co, @nobody";
assert.deepEqual(
  parts(bio, m.bioFacets(bio)).filter((p) => p.link || p.mention || p.tag),
  [
    { text: "https://example.com/a?b=1", link: "https://example.com/a?b=1" },
    { text: "@bsky.app", mention: "bsky.app" },
    { text: "#atproto", tag: true },
  ],
);
assert.equal(
  parts(bio, m.bioFacets(bio))
    .map((p) => p.text)
    .join(""),
  bio,
);
assert.deepEqual(m.bioFacets("javascript:alert(1) ftp://x.y"), []);

// ---- the failures of getProfile -------------------------------------------------------------------
answer = () => ({ body: head });
const ok = await api.loadProfile("@Bsky.App");
assert.equal(ok.profile.handle, "bsky.app");
assert.equal(m.titleOf(ok.profile), "Bluesky (@bsky.app)");
assert.equal(m.titleOf({ handle: "x.test" }), "@x.test");
const fails = async (status, error, message) => {
  answer = () => ({ status, body: { error, message } });
  return m.failure(await api.loadProfile("x.test").then(assert.fail, (e) => e));
};
assert.equal(await fails(400, "InvalidRequest", "Profile not found"), "notFound");
assert.equal(await fails(400, "InvalidRequest", "Invalid AT identifier"), "notFound");
assert.equal(await fails(400, "AccountTakedown", "Account has been suspended"), "suspended");
assert.equal(await fails(400, "AccountDeactivated", "Account is deactivated"), "deactivated");
assert.equal(await fails(500, "InternalServerError", "boom"), "failed");
assert.equal(m.failure(new TypeError("fetch failed")), "failed", "a network error");

// a profile that asked not to be shown, and one whose avatar is labelled
answer = () => ({
  body: { ...head, labels: [{ src: head.did, uri: head.did, val: "!no-unauthenticated", cts: "" }] },
});
assert.equal((await api.loadProfile("bsky.app")).verdict, "hide");
answer = () => ({
  body: {
    ...head,
    labels: [{ src: api.BSKY_MOD, uri: `at://${head.did}/app.bsky.actor.profile/self`, val: "porn", cts: "" }],
  },
});
const labelled = await api.loadProfile("bsky.app");
assert.equal(labelled.verdict, "show");
assert.ok(labelled.mediaHidden);

console.log("sky profile: counts, tabs, pin, bio and failures ok");
process.exit(0);
