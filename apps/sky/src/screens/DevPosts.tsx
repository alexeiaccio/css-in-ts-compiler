import { calc, token, width } from "cssints" with { type: "cssints" };
import { createMemo, For, Loading } from "solid-js";
import type { AppBskyFeedDefs } from "@atcute/bluesky";

import { Feed } from "../post/Feed.tsx";
import { Post } from "../post/Post.tsx";
import { Header } from "../Shell.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

type PostView = AppBskyFeedDefs.PostView;
const MOD = "did:plc:ar7c4by46qjdydhdevvrndac";

// Every embed kind, from posts recorded once by scripts/record-posts.mjs (dev server only: the route is not in a build).
// Five cases the API never gave us are the recorded posts with one field changed.
function samples(r: Record<string, PostView>) {
  const quote = r.quote!;
  const quoteWith = (quoted: unknown): PostView => ({
    ...quote,
    embed: { $type: "app.bsky.embed.record#view", record: quoted } as PostView["embed"],
  });
  const external = r.external!.embed as { external: object };
  return {
    ...r,
    externalLong: {
      ...r.external!,
      embed: {
        ...external,
        external: {
          ...external.external,
          description:
            "In April 2025, Bluesky raised $100 million in Series B funding led by Bain Capital Crypto. Since our Series A, we've grown the network and the team, and shipped a lot.",
        },
      } as PostView["embed"],
    },
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

// ?w=360 (or 600) fixes the card width (the feed padding comes on top), to see the layout follow it: the page sets --dev-width,
// the class adds the gutters.
const devWidth = token.length("0px", "dev-width");
const fixed = width(calc(devWidth, "+", 2, "*", t.gutter.compact));
export default function DevPosts() {
  const w = new URLSearchParams(location.search).get("w");
  const posts = createMemo(async () =>
    samples((await import("../../test/fixtures/posts.json")).default as never),
  );
  return (
    <>
      <Header title="Dev: posts" />
      <div class={w ? fixed : undefined} style={w ? { "--dev-width": `${w}px` } : undefined}>
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
