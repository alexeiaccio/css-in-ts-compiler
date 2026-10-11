// What the screens draw, as plain data over apps/csssky's models: the rows of a thread and an embed as a line of text. No
// renderer here: the docs' /tui page (apps/docs/src/tui/, @bomb.sh/tty in a browser) draws the same rows.
import type { AppBskyFeedDefs } from "@atcute/bluesky";

import type { threadScreen, ThreadNode } from "../../csssky/src/api.ts";
import { hostOf } from "../../csssky/src/post/model.ts";
import type { Media } from "../../csssky/src/post/model.ts";
import { branches, goneText, moreLabel } from "../../csssky/src/thread/model.ts";
import type { Branch } from "../../csssky/src/thread/model.ts";

type PostView = AppBskyFeedDefs.PostView;

export type Row =
  | { kind: "post"; post: PostView; depth: number; focus?: boolean }
  | { kind: "note"; text: string; depth: number; open?: PostView };

const nodeRow = (n: ThreadNode, depth: number, focus = false): Row =>
  n.kind === "post"
    ? { kind: "post", post: n.post, depth, focus }
    : { kind: "note", text: goneText[n.why], depth };

// The replies as rows, indented by level; a branch cut at the depth limit ends in a "Show N more" row that opens its post.
const flat = (bs: Branch[], depth: number): Row[] =>
  bs.flatMap((b) => [
    nodeRow(b.node, depth),
    ...flat(b.replies, depth + 1),
    ...(b.more && b.node.kind === "post"
      ? [
          {
            kind: "note",
            text: moreLabel(b.more.count),
            depth: depth + 1,
            open: b.node.post,
          } as Row,
        ]
      : []),
  ]);

export function rowsOf(t: Awaited<ReturnType<typeof threadScreen>>): Row[] {
  return [
    ...t.parents.map((p) => nodeRow(p, 0)),
    nodeRow(t.root, 0, true),
    ...(t.root.kind === "post" ? flat(branches(t.root.replies), 1) : []),
  ];
}

// One media embed as a line of text: no pictures in a terminal.
export const mediaText = (m: Media) => {
  switch (m.kind) {
    case "images":
    case "gallery": {
      const n = m.tiles.length + (m.kind === "gallery" ? m.more : 0);
      const alt = m.tiles.find((t) => t.alt)?.alt;
      return `[${n === 1 ? "image" : `${n} images`}${alt ? `: ${alt}` : ""}]`;
    }
    case "video":
      return `[${m.gif ? "gif" : "video"}${m.alt ? `: ${m.alt}` : ""}]`;
    case "external":
      return `[link: ${m.title || m.uri} - ${hostOf(m.uri)}]`;
  }
};

// A quote that is not shown.
export const goneQuote = {
  hidden: "Post hidden",
  blocked: "Blocked post",
  detached: "The author removed this post from the quote",
  notFound: "Post not found",
};
