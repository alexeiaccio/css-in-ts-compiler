// Records the thread fixtures of test/fixtures once (node scripts/record-thread.mjs). It calls the live API, so it is not part of
// `bun run test`. HOST=https://api.bsky.app if the public host is unreachable.
//   thread-deep.json   a post in the middle of a conversation: three or more parents, replies four levels deep, and a reply or a parent
//                      that is blocked or not found when the API has one
//   thread-notfound.json, thread-blocked.json   replies whose parent is a notFoundPost or a blockedPost (found by a crawl of
//                      author feeds; if the posts are gone from the API, crawl again and replace the two uris)
//   thread-tomb.json   a thread with a blockedPost or notFoundPost among its replies (when the crawl finds one: none did)
import { writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const HOST = `${process.env.HOST ?? "https://public.api.bsky.app"}/xrpc/`;
const DISCOVER = "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot";
const out = `${import.meta.dirname}/../test/fixtures`;

const get = async (method, params) => {
  const url = `${HOST}app.bsky.${method}?${new URLSearchParams(params)}`;
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return await r.json();
    } catch (e) {
      if (i >= 4) throw e;
      await sleep(1000 * (i + 1));
    }
  }
};
const thread = (uri) => get("feed.getPostThread", { uri, depth: 6, parentHeight: 20 });
const save = (name, json) => writeFileSync(`${out}/${name}.json`, `${JSON.stringify(json)}\n`);

const isGone = (n) => n.$type !== "app.bsky.feed.defs#threadViewPost";
const depthOf = (n) => (isGone(n) ? 0 : 1 + Math.max(0, ...(n.replies ?? []).map(depthOf)));
const parentsOf = (n) => {
  let k = 0;
  for (let p = n.parent; p; p = p.parent) k++;
  return k;
};
const all = (n, f, acc = []) => {
  if (f(n)) acc.push(n);
  for (const r of n.replies ?? []) all(r, f, acc);
  return acc;
};

// candidates: popular Discover posts, and the author feed's replies (they have parents)
const GONE_PARENT = {
  "thread-notfound": "at://did:plc:7ihvojd435lxcyvx5c5r6dip/app.bsky.feed.post/3mvuydtlcnk2f",
  "thread-blocked": "at://did:plc:lzsxyxqebfmpx6jia6wjqgtx/app.bsky.feed.post/3mwtbvcxpok2j",
};
for (const [name, uri] of Object.entries(GONE_PARENT)) save(name, await thread(uri));

const feed = await get("feed.getFeed", { feed: DISCOVER, limit: 50 });
const seen = new Set();
const best = { deep: undefined, gone: undefined, tomb: undefined };
for (const { post } of feed.feed) {
  if ((post.replyCount ?? 0) < 15 || seen.has(post.uri)) continue;
  seen.add(post.uri);
  const { thread: root } = await thread(post.uri);
  if (isGone(root)) continue;
  console.log(post.uri.split("/").pop(), "replies", post.replyCount, "depth", depthOf(root));
  const tomb = all(root, (n) => n.replies?.some(isGone));
  if (tomb.length && !best.tomb) best.tomb = root;
  // a post inside the conversation with parents above and a deep tree below
  for (const mid of all(root, (n) => depthOf(n) >= 4 && n !== root)) {
    const { thread: t } = await thread(mid.post.uri);
    if (!isGone(t) && parentsOf(t) >= 2 && depthOf(t) >= 4) {
      if (!best.deep || depthOf(t) + parentsOf(t) > depthOf(best.deep) + parentsOf(best.deep))
        best.deep = t;
      break;
    }
  }
}
console.log("deep", best.deep && [parentsOf(best.deep), depthOf(best.deep)], "tomb", !!best.tomb);
if (best.deep) save("thread-deep", { thread: best.deep });
if (best.tomb) save("thread-tomb", { thread: best.tomb });
