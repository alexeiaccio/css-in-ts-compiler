// The home screen's tab and paging state against recorded feeds (test/fixtures/home-*.json, scripts/record-home.mjs): each tab
// keeps its own pages, the scroll position of each is kept, the next page appends without duplicates, and a 414 or a cursor
// past the cap is the end of the feed ("that's all"), not an error. fetch is replaced before api.ts loads; nothing reaches
// the network. Run with --conditions=browser (Solid's client build).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const fixture = (name) =>
  JSON.parse(readFileSync(`${import.meta.dirname}/fixtures/${name}.json`, "utf8"));
const discover1 = fixture("home-discover-1");
const discover2 = fixture("home-discover-2");
const science1 = fixture("home-science-1");

// what the server does, by feed and cursor
const requests = [];
let scienceNext = () => new Response("URI Too Long", { status: 414 });
globalThis.fetch = async (url) => {
  const u = new URL(url);
  const { feed, cursor } = Object.fromEntries(u.searchParams);
  requests.push({ feed, cursor });
  const json = (body) =>
    new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
  if (feed.endsWith("/whats-hot")) {
    if (!cursor) return json(discover1);
    assert.equal(cursor, discover1.cursor, "the second page is asked with the first's cursor");
    return json(discover2);
  }
  if (feed.endsWith("/for-science")) return cursor ? scienceNext(cursor) : json(science1);
  return assert.fail(`unexpected feed ${feed}`);
};

const api = await import("../src/api.ts");
const { createPaged } = await import("../src/paged.ts");
const { createTabs, FEEDS } = await import("../src/home/tabs.ts");
const { createRoot, flush, resolve } = await import("solid-js");

const shown = (page) => page.feed.filter((i) => api.postVerdict(i.post) !== "hide").length;

// ---- the list of feeds -----------------------------------------------------------------------
assert.equal(FEEDS[0].uri, api.DISCOVER, "Discover is first");
assert.ok(FEEDS.length >= 3 && FEEDS.length <= 4);
assert.equal(new Set(FEEDS.map((f) => f.uri)).size, FEEDS.length);
assert.ok(
  FEEDS.every((f) => /^at:\/\/did:[a-z]+:[^/]+\/app\.bsky\.feed\.generator\/[^/]+$/.test(f.uri)),
);

// ---- the tabs: which is open, which were opened, where each was scrolled to --------------------
await createRoot(async (dispose) => {
  const tabs = createTabs(3);
  assert.equal(tabs.active(), 0);
  assert.deepEqual(tabs.opened(), [0]);
  tabs.select(0, 50);
  assert.equal(tabs.scrollOf(0), 0, "selecting the open tab changes nothing");

  tabs.select(1, 1200); // leave tab 0 scrolled to 1200
  flush();
  assert.equal(tabs.active(), 1);
  assert.deepEqual(tabs.opened(), [0, 1]);
  assert.equal(tabs.scrollOf(0), 1200);
  assert.equal(tabs.scrollOf(1), 0, "a tab never visited starts at the top");

  tabs.select(0, 340); // and back, from 340 in tab 1
  tabs.select(2, 90); // two switches in one tick: the second leaves tab 0, not tab 1
  flush();
  assert.equal(tabs.scrollOf(1), 340);
  assert.equal(tabs.scrollOf(0), 90);
  assert.deepEqual(tabs.opened(), [0, 1, 2], "opened only grows: a hidden panel is kept");
  assert.equal(tabs.active(), 2);
  dispose();
});

// ---- two tabs' paging side by side -----------------------------------------------------------
await createRoot(async (dispose) => {
  const panel = (uri) =>
    createPaged(
      () => uri,
      (u, cursor) => api.homeScreen(cursor, u),
    );
  const discover = panel(FEEDS[0].uri);
  assert.equal(await resolve(() => discover.feed.items.length), shown(discover1));
  assert.equal(discover.feed.cursor, discover1.cursor);

  // the second tab opens: its own first page, Discover's pages stay
  const science = panel(FEEDS[1].uri);
  assert.equal(await resolve(() => science.feed.items.length), shown(science1));
  assert.equal(discover.feed.items.length, shown(discover1), "the other tab was not touched");

  await discover.loadMore();
  const uris = discover.feed.items.map((i) => i.post.uri);
  assert.equal(uris.length, shown(discover1) + shown(discover2), "the second page is appended");
  assert.equal(new Set(uris).size, uris.length, "no post twice");
  assert.equal(discover.feed.cursor, discover2.cursor);
  assert.equal(science.feed.items.length, shown(science1), "science still has its first page");

  // ...and back to Discover: the same items, no new request
  const before = requests.length;
  flush();
  assert.equal(discover.feed.items.length, uris.length);
  assert.equal(requests.length, before);

  // a 414 on the next page of Science: the end, with the items it has
  assert.notEqual(science.feed.cursor, undefined);
  await science.loadMore();
  assert.equal(science.feed.cursor, undefined, "that's all");
  assert.equal(science.feed.items.length, shown(science1));
  const n = requests.length;
  await science.loadMore();
  assert.equal(requests.length, n, "no cursor, no request");
  dispose();
});

// ---- 414 and other failures ------------------------------------------------------------------
assert.deepEqual(await api.homeScreen("c", FEEDS[1].uri), { items: [], cursor: undefined });
scienceNext = () => new Response("nope", { status: 500 });
await assert.rejects(api.homeScreen("c", FEEDS[1].uri), "a 500 is an error, not the end");

// a failed page keeps the cursor, so asking again is the retry
await createRoot(async (dispose) => {
  const { feed, loadMore } = createPaged(
    () => FEEDS[1].uri,
    (u, cursor) => api.homeScreen(cursor, u),
  );
  await resolve(() => feed.items.length);
  await assert.rejects(loadMore());
  assert.equal(feed.cursor, science1.cursor, "the cursor is still there");
  scienceNext = () =>
    new Response(JSON.stringify({ feed: science1.feed.slice(0, 2), cursor: undefined }), {
      headers: { "content-type": "application/json" },
    });
  await loadMore();
  await sleep(5);
  assert.equal(feed.items.length, shown(science1) + shown({ feed: science1.feed.slice(0, 2) }));
  assert.equal(feed.cursor, undefined);
  dispose();
});

console.log("sky home: tabs, paging per tab, 414 and retry ok");
process.exit(0);
