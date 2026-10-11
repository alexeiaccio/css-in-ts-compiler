// Records the home feed fixtures of test/fixtures once (node scripts/record-home.mjs): the first two pages of Discover (the
// second asked with the first's cursor, so the pair does not repeat posts) and the first page of the Science feed, as the app
// asks for them (limit 30). It calls the live API, so it is not part of `bun run test`.
// HOST=https://api.bsky.app node scripts/record-home.mjs   when public.api.bsky.app is unreachable (same AppView).
import { writeFileSync } from "node:fs";

const HOST = `${process.env.HOST ?? "https://public.api.bsky.app"}/xrpc/`;
const out = `${import.meta.dirname}/../test/fixtures`;
const DISCOVER = "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot";
const SCIENCE = "at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science";

const get = async (feed, cursor) => {
  const params = { feed, limit: "30", ...(cursor && { cursor }) };
  const url = `${HOST}app.bsky.feed.getFeed?${new URLSearchParams(params)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
};
const save = (name, json) => writeFileSync(`${out}/${name}.json`, `${JSON.stringify(json)}\n`);

const one = await get(DISCOVER);
const two = await get(DISCOVER, one.cursor);
save("home-discover-1", one);
save("home-discover-2", two);
save("home-science-1", await get(SCIENCE));
console.log("recorded", one.feed.length, two.feed.length);
