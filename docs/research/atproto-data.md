# Read-only atproto data: atcute and the public AppView

Ticket cssints-t5g6, researched 2026-10-02. Sources: the atcute packages as published on npm (README and `dist` read), the atproto label spec, the Bluesky rate-limit page, the Solid 2 RFCs (`documentation/solid-2.0` on the `next` branch, and the `CHEATSHEET.md` that ships in `solid-js@2.0.0-rc.13`). Things I ran myself are marked **(verified)**. The calls were made from a Russian network on 2026-10-02, with a scratch project outside the repo. Sample: ~700 Discover posts, ~8 800 author-feed items of 89 accounts, ~2 000 search results.

## Key findings

1. **No login needed, no resolver needed.** `getProfile`, `getAuthorFeed` and `getPostThread` take a handle straight from the URL, so `@atcute/identity-resolver` is not a dependency of the app **(verified)**.
2. **`searchPosts` is blocked on `public.api.bsky.app`** (HTML 403 from the CDN, no CORS headers). The same call on `https://api.bsky.app` answers 200 without auth **(verified)**. That host is not the one Bluesky asks "public web" apps to use, so search stays out of the first version.
3. **Moderation is the client's job, even logged out.** About 17% of Discover posts come from accounts labeled `!no-unauthenticated`, and the API returns them anyway. Adult posts come with labels and are not removed **(verified)**. A 25-line rule covers it, and it agrees with `@atcute/bluesky-moderation` on 10 822 sampled posts (see Labels).
4. **Pagination is by opaque cursor, and Discover's cursor grows.** After about 21 pages of 30 (or 7 of 100) the URL is too long and the server answers 414 **(verified)**. Moderation also shortens pages, so "short page means end" is wrong.
5. **The embed union has a member the old docs do not list: `app.bsky.embed.gallery`** (5 to 10 images, `thumbnail` and `fullsize`). atcute 4.0.22 types it. Discover has no quote posts at all, so quotes have to be tested on author feeds.
6. **Solid 2 fits well:** an async `createStore(fn)` is the first page (with `<Loading>`), a plain function appends the next pages. Two Solid 2 rc.13 behaviours bit me while testing and are in the traps list.

## Packages and versions

Pinned from npm on 2026-10-02.

| Package                              | Version | Needed?                              | Why                                                                             |
| ------------------------------------ | ------- | ------------------------------------ | ------------------------------------------------------------------------------- |
| `@atcute/client`                     | 5.1.2   | yes                                  | `Client`, `ok()`, `simpleFetchHandler`, `retryFetchHandler`                     |
| `@atcute/bluesky`                    | 4.0.22  | yes                                  | `app.bsky.*` types (`AppBskyFeedDefs`, …) and `unwrapEmbed`, `unwrapQuoteEmbed` |
| `@atcute/lexicons`                   | 2.1.1   | yes (peer, comes with the two above) | branded syntax types `ActorIdentifier`, `ResourceUri`                           |
| `@atcute/atproto`                    | 4.0.4   | transitive                           | label type                                                                      |
| `@atcute/bluesky-richtext-segmenter` | 3.0.2   | yes                                  | `segmentize(text, facets)`                                                      |
| `@atcute/bluesky-moderation`         | 4.2.2   | optional                             | full label engine; the sketch below has a small rule instead                    |
| `@atcute/identity-resolver`          | 2.0.2   | no                                   | DNS or well-known resolution, not needed (see Handles)                          |

All are 0BSD. The old name of the segmenter is not a concern: the package is `@atcute/bluesky-richtext-segmenter` and its API is one function. The `@atcute/bluesky` lexicons are validated with valibot, but `client.get` does **not** validate by default (types only). `client.call(AppBskyFeedGetFeed, …)` does.

Register the query names by importing a value from `@atcute/bluesky` (done in the sketch), or `import type {} from "@atcute/bluesky"`, or `"types": ["@atcute/bluesky"]` in tsconfig.

The sketch type-checks under `tsc` 5.9.3 and `tsgo` with `strict`, `noUncheckedIndexedAccess` and `verbatimModuleSyntax` **(verified)**.

## Hosts

| Host                          | Use      | Notes                                                                                                                                                                                    |
| ----------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `https://public.api.bsky.app` | the app  | cached (`cache-control: public, max-age=30`, errors `max-age=5`), CORS `access-control-allow-origin: *` on 200 and on 400, preflight for `atproto-accept-labelers` passes **(verified)** |
| `https://api.bsky.app`        | fallback | same AppView, not cached; searchPosts works here                                                                                                                                         |

Both ignore auth. Bluesky's docs say the limits are "generous" and give no number for these hosts (the 3 000 per 5 minutes per IP is for the PDS). I made several hundred requests over an hour, at most 2 in parallel, and saw no 429 and no `RateLimit-*` header **(verified)**. `retryFetchHandler` handles a 429 anyway.

The CDN in front of `public.api.bsky.app`, `cdn.bsky.app` and `video.bsky.app` (BunnyCDN) refused connections from my network for long stretches, while `api.bsky.app` and the rest of the internet worked. About one run in three of a 10-call script died with `UND_ERR_CONNECT_TIMEOUT` **(verified)**. Whether that is my network or the CDN, the app must show a retryable error state.

## Endpoints without auth

Tested on `public.api.bsky.app` unless noted. Sizes are JSON bytes before gzip. Latency was 0.5 to 2 s uncached.

| Endpoint                                                                                                          | Unauth                                  | Returns and notes                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app.bsky.feed.getFeed`                                                                                           | yes                                     | `{ feed: FeedViewPost[], cursor }`. `feed` is an at-uri of a generator (Discover: `at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot`). `limit` 1 to 100, default 50; 30 posts ≈ 54 KB, 100 ≈ 188 KB. Discover items are `{ post, feedContext }` (a few add `opThreadPostIndex` and `opThreadPostCount`): no `reply`, no `reason`, no `viewer`. A bad cursor gives 200 (restarts); an unknown generator 400 `could not find feed` |
| `app.bsky.feed.getAuthorFeed`                                                                                     | yes                                     | `{ feed, cursor }`. Actor is a handle or a DID. `limit` 1 to 100. Cursor is a timestamp string, absent at the end. Filters below. 30 posts with replies ≈ 238 KB (reply parents are inlined), `posts_no_replies` ≈ 92 KB, `posts_with_media` ≈ 83 KB. `includePins: true` adds the pinned post first with `reason: reasonPin`. A garbage cursor gives **500**                                                                                           |
| `app.bsky.feed.getPostThread`                                                                                     | yes                                     | `{ thread: threadViewPost                                                                                                                                                                                                                                                                                                                                                                                                                               | notFoundPost | blockedPost }`. `depth`default 6 (1000 accepted);`parentHeight`default 80 (1000 accepted). A post with 241 replies: 381 KB at the default depth, 272 KB at`depth: 1`(direct replies dominate). Replies are **not sorted**. A missing post is HTTP 400`NotFound`, not a `notFoundPost`; a blocked one is 200 with `blockedPost`. A handle works inside the at-uri |
| `app.bsky.actor.getProfile`                                                                                       | yes                                     | one `ProfileViewDetailed`, ≈ 1 KB: `did`, `handle`, `displayName`, `avatar`, `banner`, `description`, `followersCount`, `followsCount`, `postsCount`, `pinnedPost`, `labels`, `verification`, `associated`. No `viewer`. Takes a handle or a DID, **case-insensitive**; `@bsky.app` is rejected 400 `Invalid AT identifier`; unknown gives 400 `InvalidRequest: Profile not found`                                                                      |
| `app.bsky.actor.getProfiles`                                                                                      | yes                                     | batch of the above (≤ 25)                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `app.bsky.feed.getFeedGenerator`                                                                                  | yes                                     | `{ view: { displayName, description, avatar, likeCount, creator, … }, isOnline, isValid }`, ≈ 1.1 KB. Unknown 400                                                                                                                                                                                                                                                                                                                                       |
| `app.bsky.feed.getFeedGenerators`, `getPosts`, `getQuotes`, `getLikes`, `getActorFeeds`, `getSuggestedFeeds`      | yes                                     | work                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `app.bsky.actor.searchActors`, `searchActorsTypeahead`                                                            | yes                                     | work                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `app.bsky.graph.getFollowers`                                                                                     | yes                                     | works                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `app.bsky.unspecced.getPopularFeedGenerators`, `getTrendingTopics`, `getTrends`, `getSuggestedFeeds`, `getConfig` | yes                                     | work, but unspecced (can change)                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `app.bsky.unspecced.getPostThreadV2`                                                                              | yes                                     | flat list with `depth`, `sort` (`top`, `newest`, `oldest`), `below` ≤ 20, `branchingFactor` ≤ 100. It did **not** cut the payload (162 items with `below: 1, branchingFactor: 5`); unspecced, so not used                                                                                                                                                                                                                                               |
| `app.bsky.feed.searchPosts`                                                                                       | **no on public**, yes on `api.bsky.app` | public: 403 `text/html` from the CDN, 2.3 KB, no CORS headers (a browser shows a network error). `api.bsky.app`: 200, `limit` ≤ 100, `sort` `top` or `latest`, `hitsTotal` capped at 10 000, cursor works                                                                                                                                                                                                                                               |
| `app.bsky.feed.getTimeline`                                                                                       | no                                      | 401 `AuthMissing`                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `app.bsky.notification.listNotifications`                                                                         | no                                      | 401 `AuthMissing`                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `app.bsky.actor.getPreferences`                                                                                   | no                                      | 501 `MethodNotImplemented`                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `app.bsky.actor.getSuggestions`                                                                                   | yes                                     | 200 with an empty list                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `app.bsky.feed.getActorLikes`                                                                                     | no                                      | 400 `Profile not found` for `bsky.app`                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `com.atproto.identity.resolveHandle`                                                                              | yes                                     | `{ did }` (not needed, see Handles)                                                                                                                                                                                                                                                                                                                                                                                                                     |

Every response also carries `atproto-content-labelers: did:plc:ar7c4by46qjdydhdevvrndac;redact`: with no `atproto-accept-labelers` request header the AppView applies the Bluesky moderation service by default, and `redact` means takedowns and suspensions are removed from the response, not labeled. Everything else (adult, `!hide`, `!warn`) is returned with labels.

### `getAuthorFeed` filters

| `filter`                        | Gives                                                                  | For                     |
| ------------------------------- | ---------------------------------------------------------------------- | ----------------------- |
| omitted or `posts_with_replies` | posts, replies, reposts (byte-identical responses **(verified)**)      | "Replies" tab           |
| `posts_no_replies`              | posts and reposts, no replies                                          | "Posts" tab             |
| `posts_with_media`              | posts with images, gallery, video or recordWithMedia                   | "Media" tab             |
| `posts_and_author_threads`      | posts, reposts and the author's own self-reply threads                 | alternative "Posts" tab |
| `posts_with_video`              | posts with video only; bsky.app has 11 and the call returned no cursor | "Videos" tab            |

`FeedViewPost` = `{ post, reply?: { root, parent, grandparentAuthor? }, reason?: reasonRepost | reasonPin, feedContext?, opThreadPostIndex?, opThreadPostCount?, threadgate? }`. `reply.parent` and `reply.root` are `postView | notFoundPost | blockedPost` (22 blocked and 10 not-found among 2 732 replies).

## Pagination

- The cursor is opaque. Pass `cursor` back as it came; stop when the response has none.
- `getFeed` (Discover): the cursor holds a bitmap of what you saw, so it grows ~1.3 KB a page. The cursor was 1.9 KB after the first page and 8.7 KB after the seventh (limit 100). Page 8 gave HTTP 414. With limit 30 the failure came at page 22 (630 posts). The sketch treats a cursor over 6 000 characters as the end of the feed. Posts did not repeat between pages **(verified)**.
- `getAuthorFeed`: the cursor is the timestamp of the last item. `posts_with_media` scanned back to 2025 for 30 posts.
- Page size after moderation: a page of 30 gave 23 to 28 visible posts. The loop must go on while there is a cursor, not while the page is full.
- Parameter errors are strict: `limit` 101 gives 400 `integer too big (maximum 100)`, `limit` 0 gives 400.

## Embeds

`post.embed` is the **view** union (CDN URLs, hydrated). `post.record.embed` is the raw record with blobs: do not render from it. Counts in my sample of 8 793 author-feed items: images 2 817, external 1 346, video 773, record 538, recordWithMedia 111, gallery 11; no embed on 3 197 posts. `unwrapEmbed(post.embed)` from `@atcute/bluesky` splits a recordWithMedia into `{ media, record }`; `unwrapQuoteEmbed(record)` gives the quote variants.

| `$type`                               | Fields                                                                                                                       | Render                                                                                                                                                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `app.bsky.embed.images#view`          | `images[]` of `{ thumb, fullsize, alt, aspectRatio? }`, 1 to 4 (3 766 of 3 990 posts have one)                               | grid by count (1: full width at its ratio; 2: two columns; 3 and 4: grid), `<img src=thumb alt=alt>`, link or lightbox to `fullsize`. 102 of 4 356 images have no `aspectRatio`: fall back to a fixed 4:3 box |
| `app.bsky.embed.gallery#view`         | `items[]` of `{ thumbnail, fullsize, alt, aspectRatio, $type: "…gallery#viewImage" }`, 5 to 10 seen (schema ceiling 20)      | like images, but the field is `thumbnail`, not `thumb`; show the first 4 and a "+N" tile                                                                                                                      |
| `app.bsky.embed.external#view`        | `external: { uri, title, description, thumb? }`; some also have `source`, `createdAt`, `readingTime` (blog-style cards, new) | a link card: `thumb` (135 of 136 have one; no aspect ratio, crop to a fixed box), title, description, host of `uri`. `uri` is `http` or `https` in my sample, still allow-list the scheme                     |
| `app.bsky.embed.video#view`           | `cid`, `playlist` (HLS), `thumbnail`, `aspectRatio?`, `presentation?: "default"                                              | "gif"`, `alt?`                                                                                                                                                                                                | poster `thumbnail` at `aspectRatio` with a play icon; see Video |
| `app.bsky.embed.record#view`          | `record` is one of the five rows below                                                                                       | quote card                                                                                                                                                                                                    |
| `app.bsky.embed.recordWithMedia#view` | `media` (external, gallery, images or video view) and `record: { record }` (same union as above)                             | media first, then the quote card                                                                                                                                                                              |

The `record#view.record` union:

| `$type`                                                                                                         | Fields                                                                                                                                                                              | Render                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `record#viewRecord`                                                                                             | `uri`, `cid`, `author` (basic profile), `value` (**unknown**: the post record), `labels`, counts, `embeds[]` (one level: images, external, video, gallery, record, recordWithMedia) | author, text from `value.text` with `value.facets` (cast; validate with `is(AppBskyFeedPost.mainSchema, value)` if you do not trust it), the first of `embeds` as a small media. Moderate it like a post (author labels count) |
| `record#viewNotFound`                                                                                           | `uri`, `notFound: true`                                                                                                                                                             | gray tombstone "Post not found" (4 + 1 seen)                                                                                                                                                                                   |
| `record#viewBlocked`                                                                                            | `uri`, `blocked: true`, `author: { did }`                                                                                                                                           | "Blocked post". Logged out, this is the author blocking the _quoted_ account or the reverse; either way no content (1 seen)                                                                                                    |
| `record#viewDetached`                                                                                           | `uri`, `detached: true`                                                                                                                                                             | "The author removed this post from the quote" (none seen; from the lexicon)                                                                                                                                                    |
| `feed.defs#generatorView`, `graph.defs#listView`, `graph.defs#starterPackViewBasic`, `labeler.defs#labelerView` | the quoted feed, list, starter pack or labeler                                                                                                                                      | one compact card with `displayName` or `name`, creator, avatar (a starter pack was seen once)                                                                                                                                  |

The sketch's `quoteOf()` returns `post | hidden | gone` for the first four; the last row falls into `gone/notFound` there. A card for it is a later slice.

### CDN image URLs

`https://cdn.bsky.app/img/{preset}/plain/{did}/{cid}[@format]`.

| Preset           | Used by                                                 | Note |
| ---------------- | ------------------------------------------------------- | ---- |
| `avatar`         | `profile.avatar`, `author.avatar`                       |      |
| `banner`         | `profile.banner`                                        |      |
| `feed_thumbnail` | `images[].thumb`, `gallery.thumbnail`, `external.thumb` |      |
| `feed_fullsize`  | `images[].fullsize`, `gallery.fullsize`                 |      |

Verified on one 630×730 image (the CDN was unreachable afterwards, so this is all): the response is `image/webp` by default, `@png` returns the original as `image/png` (875 731 B against 91 402 B as webp), `cache-control: public, max-age=604800`. The source was smaller than any preset, so the maximum sizes of the presets (and the `avatar_thumbnail` preset from the social-app) are **not verified**; use the URL from the API as it is and do not build your own except by swapping the preset segment.

Avatars of `did:web` accounts have the same shape with `did:web:host` in the path (1 seen).

### Aspect ratio

`aspectRatio: { width, height }` is optional (images 98%, video 86 of 90 in Discover). Use CSS `aspect-ratio: w / h` on a box with a fixed width so the list does not jump while images load, and clamp it: 34 of 4 356 images were wider than 1:0.3, none taller than 3:1. Clamp to 1:2 … 3:1 and crop with `object-fit: cover`.

### Video

The `playlist` is an HLS master playlist **(verified)**: `application/vnd.apple.mpegurl`, 370 B, `access-control-allow-origin: *`, two variants (`360p/video.m3u8`, 480×360 and `720p/video.m3u8`, 960×720) with a `session_id` query. Only Safari plays HLS natively; Chrome and Firefox need `hls.js`. The thumbnail is `https://video.bsky.app/watch/{did-urlencoded}/{cid}/thumbnail.jpg` (not reached, so type and size not checked). For a first version, render the poster with a play icon and an "open on bsky.app" link, and add playback later. `presentation: "gif"` (21 of 1 058 videos) is a muted loop and should not carry a play button. Alt text exists on 66 videos.

## Rich text

- `record.text` plus `record.facets`: each facet is `{ index: { byteStart, byteEnd }, features[] }`. The offsets are **UTF-8 byte** offsets, not UTF-16 indexes, so `text.slice()` is wrong for any text with an accent or emoji (1 811 of 3 262 posts with facets have non-ASCII text).
- Features: `app.bsky.richtext.facet#link` (`uri`), `#mention` (`did`), `#tag` (`tag`, without the `#`). In the sample: 9 986 tags, 1 384 links, 508 mentions. A facet had one feature in all 3 262 posts with facets, but the type allows several.
- `segmentize(text, facets)` from `@atcute/bluesky-richtext-segmenter` returns `{ text, features? }[]`. On all 3 262 posts with facets the segments joined back to the original text, nothing threw, and an out-of-range or overlapping facet is clipped, not thrown **(verified)**. Plain text is `facets` undefined.
- Render rules: `link` → `<a href={feature.uri}>` with the **visible text from the segment** (860 of 1 402 links show a shortened text like `bsky.app/profile/atru...`, so never use the text as the href); allow only `http:` and `https:`, add `rel="noopener noreferrer nofollow"`. `mention` → `/profile/{did}` (the app route takes a DID as well as a handle). `tag` → no search without auth, so render it as styled text, or link to `https://bsky.app/hashtag/{tag}`.

## Labels

What comes back for a logged-out viewer **(verified, 10 822 posts)**:

- `post.labels[]` of `{ src, uri, val, cts }`. `src` is either the Bluesky moderation service `did:plc:ar7c4by46qjdydhdevvrndac` (`porn` 239, `sexual` 49, `nudity` 10, `graphic-media` 1 in the sample, plus the custom `sexual-figurative` 7) or the author (self-labels: `porn` 189, `nudity` 25, `sexual` 17, `graphic-media` 13). A self-label is also in `record.labels.values[].val`; the hydrated `post.labels` is the one to read.
- `post.author.labels[]`: `!no-unauthenticated` (src is the author, `uri` is the profile record) on 117 of 700 Discover posts; also mod-service `porn`, `sexual`, `nudity`.
- No `!hide`, `!warn` or `!takedown` in the sample. `!takedown` and `!suspend` are redacted by the AppView (the `;redact` flag above). `!hide` and `!warn` are system labels only the mod service may use (atcute's table marks both "no self", and `!hide` also "no override").

A label on the **profile record** (`uri` ends in `/app.bsky.actor.profile/self`) concerns only the avatar and banner. A label on a **post** or on the **whole account** (`uri` is a DID) concerns the content. atcute makes the same split.

### The minimal rule

For a logged-out viewer adult content is off, so adult labels cannot be revealed. Trust only two sources: the mod service and the author.

| Label                                                                  | Source                | Where                 | Result                                                                                                                                        |
| ---------------------------------------------------------------------- | --------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `!no-unauthenticated`                                                  | author                | on the account        | **hide** the author's posts everywhere; on the profile screen show "this account asks not to be shown to logged-out people", no way to reveal |
| `!hide`                                                                | mod service           | post or account       | **hide**                                                                                                                                      |
| `porn`, `sexual`, `nudity`, `graphic-media`                            | mod service or author | post or whole account | **hide** (feeds: drop the item; thread: tombstone; quote: tombstone)                                                                          |
| the same four                                                          | mod service or author | profile record        | placeholder for the avatar and banner only                                                                                                    |
| `!warn`                                                                | mod service           | post or account       | **blur** with a "show anyway" button                                                                                                          |
| anything else (custom values like `sexual-figurative`, other labelers) | any                   | any                   | ignore: the viewer subscribes to nobody else                                                                                                  |

`verdict()` in the sketch is this table. I checked it against `@atcute/bluesky-moderation` 4.2.2 with `moderatePost` and `getDisplayRestrictions` (contexts `ContentList` and `ContentMedia`), `viewerDid: undefined`, `adultContentEnabled: false`: on 10 822 posts 10 767 agree, 55 differ, 0 are unexplained. The 55 are all posts that quote an account with `!no-unauthenticated`: atcute hides the whole outer post, the sketch hides only the quote card (the outer author did nothing wrong). Pick the stricter one if you prefer.

Using the package instead is possible, with one trap: **`prefsByLabelers` must contain the Bluesky mod DID**, even logged out. Without it atcute skips every mod-service label as "unconfigured labeler", and adult posts pass **(verified)**:

```ts skip
const opts = {
  viewerDid: undefined,
  prefs: {
    adultContentEnabled: false,
    globalLabelPrefs: {},
    prefsByLabelers: { "did:plc:ar7c4by46qjdydhdevvrndac": { labelPrefs: {} } }, // do not forget this line
    keywordFilters: [],
    hiddenPosts: [],
    temporaryMutes: [],
  },
  labelDefs: {},
};
```

## Handles and DIDs

`/profile/:handle` needs no resolution step: `getProfile`, `getAuthorFeed` and `getPostThread` (inside the at-uri, `at://bsky.app/app.bsky.feed.post/3l…`) accept a handle and the AppView resolves it. An unknown handle is a 400 `InvalidRequest: Profile not found`; a malformed one (`not a handle`, `@bsky.app`) is a 400 about the identifier. So:

- Use the URL segment as given, with `@` stripped and lower-cased (`BSKY.APP` works, but a lower-cased key makes one cache entry).
- Mentions and other app links use the DID (`/profile/did:plc:…`); both spellings work.
- `profile.did` and `profile.handle` come back with the profile if the page needs the canonical form.
- `@atcute/identity-resolver` (`CompositeHandleResolver` with DoH and `/.well-known/atproto-did`, `LocalActorResolver` for bidirectional checks) is for a client that talks to a PDS. From a browser the well-known fetch needs CORS on every user's domain, which it often lacks, so it would not work here anyway.
- Typing: the lexicon wants the branded `ActorIdentifier` (a DID or a dotted handle) and `ResourceUri`, so a route string needs one cast, in `cleanActor`.

## Solid 2

From the RFCs and `CHEATSHEET.md` of `solid-js@2.0.0-rc.13` (the version `next` points to; `@solidjs/web` is the same):

- Any computation may return a Promise. `createMemo(() => load(id()))` is "not ready" until it lands; reading it inside `<Loading fallback>` shows the fallback. `createResource` is gone.
- `<Loading>` covers **first readiness of a branch**. After content has shown, a changed input keeps the old content and `isPending(() => data())` reads `true`: use it for a thin "updating" bar. `<Loading on={key()}>` brings the fallback back on a change, which is what a profile-to-profile navigation wants.
- Errors from async memos go to `<Errored fallback={(err, reset) => …}>`. The `reset` argument retries.
- `refresh(x)` re-asks quietly; `affects(x)` before it makes it read as pending.
- The docs say nothing about infinite scroll. The pattern that works **(verified under rc.13 with a fake loader, node, no DOM)** is below: an async `createStore(fn, seed)` for the first page, and an imperative `loadMore()` for the next ones. `createStore(fn)` re-runs when a signal read synchronously in `fn` changes, and draft-first setters append (`d.items.push(...)`). Reading `feed.items` before the first page lands is "not ready", so a `<Loading>` above the list works; `isPending(() => feed.items.length)` was `true` while a new source loaded.
- The sentinel at the end of the list is a DOM concern: an `IntersectionObserver` on an empty `<div>` created in a `ref`, torn down in the `onSettled` cleanup. It only calls `loadMore()`. Not run here (no DOM in the scratch project).

```tsx skip
// ProfileScreen sketch, not run: only the data layer below was run
function Profile(props: { actor: string }) {
  const head = createMemo(() => loadProfile(props.actor)); // async: needs <Loading>
  const { feed, loadMore, loadingMore } = createPaged(
    () => ({ actor: props.actor, tab: tab() }),
    (s, cursor) => loadAuthorFeed(s.actor, s.tab, cursor),
  );
  return (
    <Errored fallback={(err, reset) => <Retry error={err()} onRetry={reset} />}>
      <Loading fallback={<ProfileSkeleton />} on={props.actor}>
        <Header profile={head().profile} hidden={head().mediaHidden} />
        <Show when={isPending(() => feed.items.length)}>
          <UpdatingBar />
        </Show>
        <For each={feed.items}>{(item) => <PostCard item={item} />}</For>
        <Sentinel onVisible={loadMore} done={feed.cursor === undefined} busy={loadingMore()} />
      </Loading>
    </Errored>
  );
}
```

## Traps

Hit while calling the API or running the sketch:

1. **`searchPosts` on `public.api.bsky.app` is a CDN 403 page, not an XRPC error.** The body is HTML, so atcute reports `UnknownXRPCError: Request failed with status code 403`, and a browser shows a CORS failure. It works on `api.bsky.app`.
2. **Network failures throw, they do not return `ok: false`.** A timeout is `TypeError: fetch failed` (cause `UND_ERR_CONNECT_TIMEOUT`). `ok()` only turns HTTP errors into `ClientResponseError`. `retryFetchHandler` retries 429 only, so the sketch adds a small retry for thrown errors.
3. **Discover's cursor grows until the request is rejected with 414**, with no sign in the response. Cap it (6 000 characters in the sketch).
4. **Moderation shortens pages**, 10% to 25% of a page, so a page can even be empty. Keep loading while there is a cursor.
5. **`!no-unauthenticated` posts are served to logged-out clients** (17% of Discover). Hiding them is on the client.
6. **atcute ignores labels from labelers you did not list**, including Bluesky's own, until `prefsByLabelers` has the mod DID.
7. **Account labels are not post labels.** An adult label on the profile record blurs the avatar only; hiding all posts of such an account is stricter than Bluesky (13 of 10 822 differed in my first version of the rule).
8. **A missing post is HTTP 400 `NotFound`, not a `notFoundPost`.** `notFoundPost` and `blockedPost` appear only for parents and replies.
9. **`getAuthorFeed` with a garbage cursor is a 500; `getFeed` with one is a 200 that restarts.**
10. **`getProfile` is case-insensitive but rejects `@`**; `@` and capitals in user-typed URLs need `cleanActor`.
11. **Threads are big and unsorted.** 381 KB for 241 replies, not reducible by `depth` (direct replies dominate) or by the unspecced V2 parameters. Sort by `likeCount` yourself and render the first 20 to 30 replies, "show more" in the client.
12. **Link text is not the link.** Facet text is often shortened (`…/atru...`).
13. **Branded types.** `getProfile({ actor: someString })` is a type error (`ActorIdentifier`), likewise `ResourceUri` for `feed` and `uri`. Unions are open: atcute adds a `{ $type: string }` member, so a `switch` on `$type` needs a `default`, and `blockedPost | notFoundPost` narrows only by comparing `$type`.
14. **`record#viewRecord.value` is `unknown`.** Cast, or validate with `is(AppBskyFeedPost.mainSchema, value)`.
15. **`gallery` uses `thumbnail`; `images` use `thumb`.** The post can also carry a `gallery` in a quoted record's `embeds` and in a `recordWithMedia`.
16. **Solid 2 rc.13: a write to a derived store in the same tick as a change of the signal its `fn` reads drops the re-run.** `setFeed(d => { d.more = true }); setActor("a"); flush()` leaves the store on the old actor for good **(verified)**. It works when anything (even `await Promise.resolve()`) separates the two. The sketch keeps the in-flight flag in a signal and writes the store only after an `await`.
17. **Solid 2: a signal write is not visible to reads until the flush**, so `if (loading()) return; setLoading(true)` lets two calls in the same tick through (a test calling `loadMore()` twice in one tick sent one request too many **(verified)**). Guard with a plain `let busy`.
18. **`resolve(() => store.items)` returns the held old value at once** while the new source is in flight; wait for the landing with an effect or check `isPending`, not with `resolve`, in tests.

## Data-layer sketch

Two files, as the app would have them. `data.ts` is plain async functions (no Solid), one per screen: `homeScreen`, `loadProfile` and `loadAuthorFeed`, `threadScreen`. The app is plain Solid on top, not Effect: the data layer is the app's boundary and returns Promises, which is what an async memo wants. Verified on 2026-10-02: `tsc` 5.9.3 and `tsgo` strict, run against the live API (3 home pages without duplicates, the profile in four spellings, the four author tabs, quotes, a thread by handle, a reply thread with parents, three error cases) and against 10 822 saved posts for the label rule.

```ts
import { Client, ok, retryFetchHandler, simpleFetchHandler } from "@atcute/client";
import type { FetchHandler } from "@atcute/client";
// a value import from @atcute/bluesky also registers the app.bsky.* query names on Client
import { unwrapEmbed, unwrapQuoteEmbed } from "@atcute/bluesky";
import type { ActorIdentifier, ResourceUri } from "@atcute/lexicons";
import type {
  AppBskyEmbedRecord,
  AppBskyFeedDefs,
  AppBskyFeedGetAuthorFeed,
} from "@atcute/bluesky";

export const APPVIEW = "https://public.api.bsky.app";
export const DISCOVER: ResourceUri =
  "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot";
export const BSKY_MOD = "did:plc:ar7c4by46qjdydhdevvrndac";

// retryFetchHandler retries HTTP 429 only. A dropped connection surfaces as `TypeError: fetch failed`
// (not as `ok: false`), so retry those here too.
const base = retryFetchHandler({ handler: simpleFetchHandler({ service: APPVIEW }) });
const handler: FetchHandler = async (path, init) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await base(path, init);
    } catch (e) {
      if (attempt >= 2 || init.signal?.aborted) throw e;
      await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
    }
  }
};
const rpc = new Client({ handler });

export interface Page<T> {
  items: T[];
  cursor: string | undefined; // undefined = end of feed
}

// Discover's cursor grows by ~1.3 KB a page; around 8 KB of URL the server answers 414.
const MAX_CURSOR = 6000;
const next = (cursor: string | undefined) =>
  cursor && cursor.length < MAX_CURSOR ? cursor : undefined;

// ---- moderation for a logged-out viewer -------------------------------------------------
type Label = { src: string; uri: string; val: string };
export type Verdict = "show" | "warn" | "hide";

const ADULT = new Set(["porn", "sexual", "nudity", "graphic-media"]);
const RANK = { show: 0, warn: 1, hide: 2 } as const;
// A label on the profile record only concerns the avatar and banner; a label on a post, or on the whole
// account (its `uri` is a DID), concerns the content. atcute makes the same split.
const onProfile = (l: Label) => l.uri.endsWith("/app.bsky.actor.profile/self");

// Only two sources count: the Bluesky mod service and the author (self-labels).
function one(l: Label, did: string): Verdict {
  const mod = l.src === BSKY_MOD;
  switch (l.val) {
    case "!no-unauthenticated": // the account opted out of logged-out views
      return l.src === did ? "hide" : "show";
    case "!hide":
      return mod ? "hide" : "show";
    case "!warn":
      return mod ? "warn" : "show";
    default: // adult content is off for a logged-out viewer, so there is no way to reveal it
      return !onProfile(l) && ADULT.has(l.val) && (mod || l.src === did) ? "hide" : "show";
  }
}

/** `labels` of the post (or quoted record) plus the labels of its author. Other labelers and custom values are ignored. */
export function verdict(did: string, ...lists: (readonly Label[] | undefined)[]): Verdict {
  return lists
    .flatMap((x) => x ?? [])
    .map((l) => one(l, did))
    .reduce<Verdict>((a, b) => (RANK[b] > RANK[a] ? b : a), "show");
}

/** An author whose profile is labeled adult: draw a placeholder instead of the avatar and banner. */
export const mediaHidden = (did: string, authorLabels: readonly Label[] | undefined) =>
  (authorLabels ?? []).some(
    (l) => onProfile(l) && ADULT.has(l.val) && (l.src === BSKY_MOD || l.src === did),
  );

export const postVerdict = (p: AppBskyFeedDefs.PostView) =>
  verdict(p.author.did, p.labels, p.author.labels);

export type Quote =
  | { kind: "post"; post: AppBskyEmbedRecord.ViewRecord }
  | { kind: "hidden" } // moderated
  | { kind: "gone"; why: "blocked" | "detached" | "notFound" };

/** The quote card of a post (also inside recordWithMedia), or undefined when there is none. */
export function quoteOf(p: AppBskyFeedDefs.PostView): Quote | undefined {
  const q = unwrapQuoteEmbed(unwrapEmbed(p.embed).record);
  if (!q) return undefined;
  switch (q.$type) {
    case "app.bsky.embed.record#viewRecord":
      return verdict(q.author.did, q.labels, q.author.labels) === "hide"
        ? { kind: "hidden" }
        : { kind: "post", post: q };
    case "app.bsky.embed.record#viewBlocked":
      return { kind: "gone", why: "blocked" };
    case "app.bsky.embed.record#viewDetached":
      return { kind: "gone", why: "detached" };
    default:
      return { kind: "gone", why: "notFound" };
  }
}

const visible = (feed: AppBskyFeedDefs.FeedViewPost[]) =>
  feed.filter((i) => postVerdict(i.post) !== "hide");

// ---- home: a feed generator ------------------------------------------------------------
export async function homeScreen(
  cursor?: string,
  feed: ResourceUri = DISCOVER,
): Promise<Page<AppBskyFeedDefs.FeedViewPost>> {
  const r = await ok(rpc.get("app.bsky.feed.getFeed", { params: { feed, limit: 30, cursor } }));
  return { items: visible(r.feed), cursor: next(r.cursor) };
}

// ---- profile: the actor is a handle or a DID, straight from the URL ----------------------
// the route param is a plain string; the lexicon wants the branded ActorIdentifier (a DID or a dotted handle)
export const cleanActor = (actor: string) =>
  actor.replace(/^@/, "").toLowerCase() as ActorIdentifier;

export type ProfileTab = NonNullable<AppBskyFeedGetAuthorFeed.$params["filter"]>;
// the UI tabs: posts_no_replies, posts_with_replies, posts_with_media, posts_with_video

export async function loadProfile(actor: string) {
  const p = await ok(
    rpc.get("app.bsky.actor.getProfile", { params: { actor: cleanActor(actor) } }),
  );
  return {
    profile: p,
    verdict: verdict(p.did, p.labels),
    mediaHidden: mediaHidden(p.did, p.labels),
  };
}

export async function loadAuthorFeed(
  actor: string,
  filter: ProfileTab,
  cursor?: string,
): Promise<Page<AppBskyFeedDefs.FeedViewPost>> {
  const r = await ok(
    rpc.get("app.bsky.feed.getAuthorFeed", {
      params: { actor: cleanActor(actor), filter, limit: 30, cursor, includePins: !cursor },
    }),
  );
  return { items: visible(r.feed), cursor: next(r.cursor) };
}

// ---- thread: /profile/:actor/post/:rkey --------------------------------------------------
export type ThreadNode =
  | { kind: "post"; post: AppBskyFeedDefs.PostView; replies: ThreadNode[] }
  | { kind: "gone"; why: "blocked" | "notFound" | "hidden"; uri: string };

// blockedPost | notFoundPost | threadViewPost, plus the open-union fallback atcute adds to every union
type ThreadItem = NonNullable<AppBskyFeedDefs.ThreadViewPost["replies"]>[number];

function node(t: ThreadItem): ThreadNode {
  if (t.$type === "app.bsky.feed.defs#threadViewPost") {
    if (postVerdict(t.post) === "hide") return { kind: "gone", why: "hidden", uri: t.post.uri };
    const replies = (t.replies ?? []).map(node);
    // the API does not sort replies: most liked first
    replies.sort((a, b) => likes(b) - likes(a));
    return { kind: "post", post: t.post, replies };
  }
  const gone = t as { $type: string; uri?: string };
  return {
    kind: "gone",
    why: gone.$type === "app.bsky.feed.defs#blockedPost" ? "blocked" : "notFound",
    uri: gone.uri ?? "",
  };
}
const likes = (n: ThreadNode) => (n.kind === "post" ? (n.post.likeCount ?? 0) : -1);

export async function threadScreen(actor: string, rkey: string) {
  // a handle is fine in the at-uri: the AppView resolves it
  const uri = `at://${cleanActor(actor)}/app.bsky.feed.post/${rkey}` as const;
  const { thread } = await ok(
    rpc.get("app.bsky.feed.getPostThread", { params: { uri, depth: 2, parentHeight: 20 } }),
  );
  if (thread.$type !== "app.bsky.feed.defs#threadViewPost") {
    return { parents: [], root: node(thread) }; // blockedPost; a missing post is HTTP 400 NotFound, thrown by ok()
  }
  const parents: ThreadNode[] = [];
  for (
    let p = thread.parent;
    p;
    p = p.$type === "app.bsky.feed.defs#threadViewPost" ? p.parent : undefined
  ) {
    parents.unshift(node(p));
  }
  return { parents, root: node(thread) };
}
```

`paged.ts` is the only Solid-aware file. Tested with a fake loader under `node --conditions=browser` on `solid-js@2.0.0-rc.13`: first page and `isPending` on a source switch, appending, a double call in one tick, the end of the feed, an empty page skipped, and a stale page after a source change dropped.

```ts
import { createSignal, createStore, untrack } from "solid-js";
import type { Page } from "./data.ts";

export interface Paged<T> {
  items: T[];
  cursor: string | undefined; // undefined = no more pages
}

/**
 * First page: an async derived store. `source()` is read synchronously, so a new actor or tab re-runs it,
 * and reading `feed.items` under <Loading> shows the fallback until the first page lands.
 * Next pages: `loadMore()`, called by a sentinel at the end of the list.
 *
 * The in-flight flag is a separate signal on purpose: in solid-js 2.0.0-rc.13 a write to the derived store in
 * the same tick as a change of `source()` makes the store skip the re-run and keep showing the old source.
 * The store is only written after an `await`.
 *
 * The guard against a double call is a plain variable: a signal write is not visible to reads until the next
 * flush, so two calls in the same tick would both see `loadingMore() === false`.
 */
export function createPaged<S, T>(
  source: () => S,
  load: (s: S, cursor?: string) => Promise<Page<T>>,
) {
  const [feed, setFeed] = createStore<Paged<T>>(
    async (draft) => {
      const page = await load(source());
      draft.items = page.items;
      draft.cursor = page.cursor;
    },
    { items: [], cursor: undefined },
  );
  const [loadingMore, setLoadingMore] = createSignal(false); // for the UI only
  let busy = false;

  async function loadMore() {
    const from = feed.cursor;
    if (from === undefined || busy) return;
    const s = untrack(source);
    busy = true;
    setLoadingMore(true);
    let page: Page<T>;
    try {
      page = await load(s, from);
    } finally {
      busy = false;
      setLoadingMore(false); // on an error the sentinel may call again: that is the retry
    }
    setFeed((d) => {
      if (d.cursor !== from) return; // the source changed meanwhile: this page is stale
      d.items.push(...page.items);
      d.cursor = page.cursor;
    });
    // moderation can empty a whole page: keep going while there is a cursor, or the sentinel never fires again
    if (page.items.length === 0 && page.cursor !== undefined) await loadMore();
  }

  return { feed, loadMore, loadingMore } as const;
}
```

Home is `createPaged(() => DISCOVER, (feed, cursor) => homeScreen(cursor, feed))`. The thread is a plain `createMemo(() => threadScreen(props.actor, props.rkey))` under `<Loading>`; render the first 20 to 30 replies and a "more replies" button over the already-fetched array.

## Not covered

- Image presets' maximum sizes, the video `thumbnail.jpg` and the 360p/720p variant playlists: the CDN hosts were unreachable when I got to them.
- Reply-thread rendering with `threadgate` (hidden replies are in `thread.post.threadgate`; the thread call returned the gate on a reply to a gated post).
- `app.bsky.embed.record#viewDetached`: none in 10 822 posts; the shape is from the lexicon.
- `!hide` and `!warn`: none in the sample; behaviour is from `@atcute/bluesky-moderation` 4.2.2's built-in label table, not from observed data.
- A real browser run: everything was run in node. CORS is read from response headers only.
