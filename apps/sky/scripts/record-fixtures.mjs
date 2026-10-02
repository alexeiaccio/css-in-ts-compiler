// Records the API fixtures of test/fixtures once (node scripts/record-fixtures.mjs). It calls the live API, so it is not part of
// `bun run test`: the test reads the saved files.
import { writeFileSync } from "node:fs";

const HOST = "https://public.api.bsky.app/xrpc/";
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
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
};
const save = (name, json) => writeFileSync(`${out}/${name}.json`, `${JSON.stringify(json)}\n`);

const actor = process.argv[2] ?? "bsky.app";
save("discover", await get("feed.getFeed", { feed: DISCOVER, limit: 30 }));
save("author-feed", await get("feed.getAuthorFeed", { actor, limit: 20, includePins: true }));
save("profile", await get("actor.getProfile", { actor }));
const feed = await get("feed.getAuthorFeed", { actor, limit: 20, filter: "posts_with_replies" });
// the thread of a reply that has replies itself: it has parents and children
const withReplies = feed.feed.find((i) => i.reply && i.post.replyCount > 1) ?? feed.feed[0];
save(
  "thread",
  await get("feed.getPostThread", { uri: withReplies.post.uri, depth: 2, parentHeight: 20 }),
);
console.log("recorded for", actor, "thread", withReplies.post.uri);
