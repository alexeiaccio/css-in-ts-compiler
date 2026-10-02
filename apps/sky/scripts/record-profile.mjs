// Records the profile screen's fixtures once (node scripts/record-profile.mjs [actor]): the profile (bsky.app has a banner and a pinned
// post) and the first page of each tab, as the screen asks for it (Posts with the pin, Replies and Media without). It calls the live
// API, so it is not part of `bun run test`: the tests read the saved files.
// HOST=https://api.bsky.app node scripts/record-profile.mjs   when public.api.bsky.app is unreachable (same AppView).
import { writeFileSync } from "node:fs";

const HOST = `${process.env.HOST ?? "https://public.api.bsky.app"}/xrpc/`;
const out = `${import.meta.dirname}/../test/fixtures`;
const actor = process.argv[2] ?? "bsky.app";

const get = async (method, params) => {
  const url = `${HOST}app.bsky.${method}?${new URLSearchParams(params)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
};
const save = (name, json) => writeFileSync(`${out}/${name}.json`, `${JSON.stringify(json)}\n`);

save("profile-head", await get("actor.getProfile", { actor }));
for (const [name, filter, pins] of [
  ["posts", "posts_no_replies", true],
  ["replies", "posts_with_replies", false],
  ["media", "posts_with_media", false],
])
  save(
    `profile-${name}`,
    await get("feed.getAuthorFeed", { actor, filter, limit: 10, includePins: pins }),
  );
console.log("recorded the profile and three tabs of", actor);
