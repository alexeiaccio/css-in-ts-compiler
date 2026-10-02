// The choices of the post card (src/post/model.ts), on recorded posts (test/fixtures/posts.json: one real post for each embed
// kind, made by scripts/record-posts.mjs; discover.json and author-feed.json for a sweep). The components themselves need a
// browser (the `ssr` environment of the plugin is its build-time runner, so Solid's server renderer cannot load them): the
// build check reads their classes, test/posts-browser.mjs draws them in Chrome. Run with --conditions=browser, as api.mjs.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const fixture = (name) =>
  JSON.parse(readFileSync(`${import.meta.dirname}/fixtures/${name}.json`, "utf8"));
const posts = fixture("posts");
const { postVerdict } = await import("../src/api.ts");
const m = await import("../src/post/model.ts");
const parts = (name) => m.embedParts(posts[name]);

// ---- every embed kind lands in one of the card's shapes ---------------------------------------
for (const [name, p] of Object.entries(posts)) assert.ok(p, `${name} was recorded`);
assert.deepEqual(
  ["images1", "images2", "images3", "images4", "noRatio"].map((n) => parts(n).media.tiles.length),
  [1, 2, 3, 4, 1],
);
assert.deepEqual(
  ["images1", "images2", "images3", "images4", "gallery"].map((n) => m.gridOf(parts(n).media)),
  ["1", "2", "3", "4", "gallery"],
  "the grid variant; the columns come from the card's width in CSS",
);
assert.equal(parts("images1").media.tiles[0].ratio, 4000 / 3000);
assert.equal(parts("noRatio").media.tiles[0].ratio, 4 / 3, "no aspectRatio: a 4:3 box");
assert.equal(m.clampRatio({ width: 1000, height: 100 }), 3, "wider than 3:1 is cropped");
assert.equal(m.clampRatio({ width: 100, height: 1000 }), 0.5, "taller than 1:2 is cropped");

const gallery = parts("gallery").media;
assert.equal(gallery.kind, "gallery");
assert.equal(gallery.tiles.length, 4, "the first four");
assert.equal(gallery.more, posts.gallery.embed.items.length - 4, "and the +N tile");
assert.ok(gallery.more >= 1);
assert.equal(
  gallery.tiles[0].thumb,
  posts.gallery.embed.items[0].thumbnail,
  "thumbnail, not thumb",
);

const external = parts("external").media;
assert.equal(external.kind, "external");
assert.ok(m.safeHref(external.uri), "an http(s) link");
assert.equal(m.hostOf("https://www.example.com/a?b=1"), "example.com");

assert.deepEqual([parts("video").media.kind, parts("video").media.gif], ["video", false]);
assert.equal(parts("gif").media.gif, true, "a gif has no play mark");
assert.ok(parts("video").media.poster.includes("video.bsky.app"));

// quotes: a post, alone or with media (recordWithMedia: the media first, then the quote)
assert.equal(parts("quote").media, undefined);
assert.equal(parts("quote").quote.kind, "post");
assert.deepEqual(
  ["quoteImages", "quoteExternal", "quoteVideo"].map((n) => [
    parts(n).media.kind,
    parts(n).quote.kind,
  ]),
  [
    ["images", "post"],
    ["external", "post"],
    ["video", "post"],
  ],
);
assert.deepEqual(parts("quoteBlocked").quote, { kind: "gone", why: "blocked" });
// not found and detached: the API gave none in the sample, so the same post with the quoted record swapped
for (const [$type, why] of [
  ["app.bsky.embed.record#viewNotFound", "notFound"],
  ["app.bsky.embed.record#viewDetached", "detached"],
]) {
  const p = {
    ...posts.quote,
    embed: {
      $type: "app.bsky.embed.record#view",
      record: { $type, uri: "at://did:plc:x/app.bsky.feed.post/1" },
    },
  };
  assert.deepEqual(m.embedParts(p).quote, { kind: "gone", why });
}
// a quote shows one small media: a grid or a gallery is cut to its first image
const q = parts("quoteImages").quote.post;
const qm = m.quoteMedia(q);
assert.ok(qm, "the recorded quote has a media of its own");
assert.ok(qm.kind !== "gallery" && (qm.kind !== "images" || qm.tiles.length === 1));
assert.equal(m.quoteMedia({ ...q, embeds: [posts.images4.embed] }).tiles.length, 1);
assert.equal(m.quoteMedia({ ...q, embeds: [posts.gallery.embed] }).kind, "images");
assert.equal(m.quoteMedia({ ...q, embeds: undefined }), undefined);

// ---- moderation ------------------------------------------------------------------------------
assert.equal(postVerdict(posts.hidden), "hide", "labeled sexual by the mod service: a tombstone");
assert.equal(postVerdict(posts.images1), "show");

// ---- rich text -------------------------------------------------------------------------------
const record = (p) => m.recordOf(p);
const linked = posts.video; // its link facet shows a shortened text
const [facet] = record(linked).facets;
const link = m.parts(record(linked).text, record(linked).facets).find((p) => p.link);
assert.equal(link.link, facet.features[0].uri, "the href is feature.uri");
assert.notEqual(link.text, link.link, "and the text is the segment");
for (const p of Object.values(posts)) {
  const { text, facets } = record(p);
  assert.equal(
    m
      .parts(text, facets)
      .map((x) => x.text)
      .join(""),
    text,
    "the parts join back",
  );
}
const mention = m
  .parts(record(posts.quote).text, record(posts.quote).facets)
  .find((p) => p.mention);
assert.match(mention.mention, /^did:/);
// UTF-8 byte offsets: "é" is 2 bytes and the emoji 4, so a UTF-16 slice would cut the wrong place
const text = "é📢 #tag https://a.b ftp://x";
const at = (s) => {
  const start = Buffer.byteLength(text.slice(0, text.indexOf(s)));
  return { byteStart: start, byteEnd: start + Buffer.byteLength(s) };
};
const features = (f) => [{ index: at(f[0]), features: [f[1]] }];
const facets = [
  ...features(["#tag", { $type: "app.bsky.richtext.facet#tag", tag: "tag" }]),
  ...features(["https://a.b", { $type: "app.bsky.richtext.facet#link", uri: "https://a.b/full" }]),
  ...features(["ftp://x", { $type: "app.bsky.richtext.facet#link", uri: "ftp://x" }]),
];
const cut = m.parts(text, facets);
assert.deepEqual(
  cut.map((p) => p.text),
  ["é📢 ", "#tag", " ", "https://a.b", " ", "ftp://x"],
);
assert.equal(cut[1].tag, true);
assert.equal(cut[3].link, "https://a.b/full");
assert.equal(cut[5].link, undefined, "only http(s) is a link");
assert.equal(m.safeHref("javascript:alert(1)"), undefined);
assert.equal(m.safeHref("not a url"), undefined);

// ---- small formats ---------------------------------------------------------------------------
const now = Date.parse("2026-10-02T12:00:00Z");
const ago = (s) => m.ago(s, now);
assert.deepEqual(
  [
    "2026-10-02T11:59:40Z",
    "2026-10-02T11:55:00Z",
    "2026-10-02T09:00:00Z",
    "2026-09-30T12:00:00Z",
  ].map(ago),
  ["now", "5m", "3h", "2d"],
);
assert.match(ago("2026-03-06T12:00:00Z"), /^Mar [56]$/);
assert.match(ago("2025-12-03T12:00:00Z"), /^Dec [23], 2025$/);
assert.equal(ago(undefined), "");
assert.deepEqual(
  [m.count(0), m.count(undefined), m.count(950), m.count(1234), m.count(2300000)],
  ["", "", "950", "1.2K", "2.3M"],
);
assert.equal(
  m.postHref({ uri: "at://did:plc:a/app.bsky.feed.post/3abc", author: { handle: "x.test" } }),
  "/profile/x.test/post/3abc",
);

// ---- a sweep: nothing in the real feeds falls outside the card's shapes ----------------------
const seen = {};
const feeds = [...fixture("discover").feed, ...fixture("author-feed").feed];
for (const { post } of feeds) {
  const { media, quote } = m.embedParts(post);
  const k = `${media?.kind ?? "-"}/${quote?.kind ?? "-"}`;
  seen[k] = (seen[k] ?? 0) + 1;
  // a quoted feed, list or starter pack has no card yet (quoteOf only knows posts): the one record that may stay undrawn
  const rec = post.embed?.$type.endsWith("WithMedia#view")
    ? post.embed.record.record
    : post.embed?.record;
  if (post.embed && rec?.uri?.includes("/app.bsky.feed.post/") !== false)
    assert.ok(media || quote, `${post.embed.$type} is drawn`);
  const { text, facets } = m.recordOf(post);
  if (text !== undefined) m.parts(text, facets);
}
assert.ok(Object.keys(seen).length >= 5, JSON.stringify(seen));
console.log(
  "post model:",
  Object.keys(posts).length,
  "recorded posts,",
  feeds.length,
  "feed posts",
  JSON.stringify(seen),
);
process.exit(0);
