import { createMemo, For, Loading } from "solid-js";
import type { AppBskyFeedDefs } from "@atcute/bluesky";

import { Feed } from "../post/Feed.tsx";
import { Post } from "../post/Post.tsx";
import { Header } from "../Shell.tsx";

type PostView = AppBskyFeedDefs.PostView;
const MOD = "did:plc:ar7c4by46qjdydhdevvrndac";

// Every embed kind, from posts recorded once by scripts/record-posts.mjs (dev server only: the route is not in a build).
// Four cases the API never gave us are the recorded posts with one field changed.
function samples(r: Record<string, PostView>) {
  const quote = r.quote!;
  const quoteWith = (quoted: unknown): PostView => ({
    ...quote,
    embed: { $type: "app.bsky.embed.record#view", record: quoted } as PostView["embed"],
  });
  return {
    ...r,
    quoteNotFound: quoteWith({
      $type: "app.bsky.embed.record#viewNotFound",
      uri: "at://did:plc:x/app.bsky.feed.post/1",
      notFound: true,
    }),
    quoteDetached: quoteWith({
      $type: "app.bsky.embed.record#viewDetached",
      uri: "at://did:plc:x/app.bsky.feed.post/1",
      detached: true,
    }),
    blurred: {
      ...r.images2!,
      labels: [{ src: MOD, uri: r.images2!.uri, val: "!warn", cts: "" }],
    },
  } as Record<string, PostView>;
}

// ?w=360 (or 600) fixes the card width (the feed padding comes on top), to see the layout follow it.
export default function DevPosts() {
  const w = new URLSearchParams(location.search).get("w");
  const posts = createMemo(async () =>
    samples((await import("../../test/fixtures/posts.json")).default as never),
  );
  return (
    <>
      <Header title="Dev: posts" />
      <div style={w ? { width: `calc(${w}px + 2 * var(--gutter-compact))` } : undefined}>
        <Loading fallback={<p>Loading…</p>}>
          <Feed>
            <For each={Object.entries(posts())}>
              {([name, post]) => (
                <div data-sample={name}>
                  <Post post={post} />
                </div>
              )}
            </For>
          </Feed>
        </Loading>
      </div>
    </>
  );
}
