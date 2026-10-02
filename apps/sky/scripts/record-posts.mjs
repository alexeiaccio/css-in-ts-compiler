// Records test/fixtures/posts.json once (node scripts/record-posts.mjs): one real post for each embed kind the card draws,
// found by scanning the author feeds of bsky.app, jay.bsky.team, pfrazee.com, atproto.com, dame.is and others (quotes,
// galleries and videos are rare in Discover). It calls the live API, so it is not part of `bun run test`.
// HOST=https://api.bsky.app node scripts/record-posts.mjs   when public.api.bsky.app is unreachable (same AppView).
import { writeFileSync } from "node:fs";

const HOST = `${process.env.HOST ?? "https://public.api.bsky.app"}/xrpc/`;
const out = `${import.meta.dirname}/../test/fixtures/posts.json`;
const bsky = "did:plc:z72i7hdynmk6r22z27h6tvur";
const at = (did, rkey) => `at://${did}/app.bsky.feed.post/${rkey}`;

const posts = {
  images1: at(bsky, "3mv3shqdfuc2e"),
  images2: at(bsky, "3lv2nr32whs2m"),
  images3: at(bsky, "3lifogne32c25"),
  images4: at("did:plc:ydfn75us2pk4dhfvqejyla2p", "3mtk7inwsws2k"),
  noRatio: at("did:plc:ewvi7nxzyoun6zhxrhs64oiz", "3juft56hdjg2o"),
  gallery: at(bsky, "3mnslrkd6ok2g"),
  external: at("did:plc:ifn645rwvsuolxg7o3w7ouo4", "3mwqgsd4cgs2a"),
  video: at(bsky, "3mgdqhzxy7s2u"),
  gif: at(bsky, "3mk4lzkrnk22d"),
  quote: at(bsky, "3mw2cdr44fc2a"),
  quoteImages: at(bsky, "3m6zx562tss2c"),
  quoteExternal: at("did:plc:imbkxipogmxuv7kyrpv7dklv", "3mhgpxlcujs2e"),
  quoteVideo: at("did:plc:ragtjsm2j2vknwkz3zp4oxrd", "3mti557dsqc2q"),
  quoteBlocked: at("did:plc:gq4fo3u6tqzzdkjlwzpb23tj", "3mwqmbqvd5225"),
  hidden: at("did:plc:gq4fo3u6tqzzdkjlwzpb23tj", "3mw4n4mkx422s"),
};

const url = `${HOST}app.bsky.feed.getPosts?${new URLSearchParams(Object.values(posts).map((u) => ["uris", u]))}`;
const r = await fetch(url);
if (!r.ok) throw new Error(`${r.status} ${url}`);
const byUri = new Map((await r.json()).posts.map((p) => [p.uri, p]));
const saved = Object.fromEntries(
  Object.entries(posts).map(([name, uri]) => [
    name,
    byUri.get(uri) ?? (console.warn("missing", name), undefined),
  ]),
);
writeFileSync(out, `${JSON.stringify(saved)}\n`);
console.log("recorded", Object.keys(saved).join(" "));
