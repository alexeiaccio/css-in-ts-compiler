// What the thread screen draws, as plain data (test/thread.mjs runs it on recorded threads): the reply tree cut at a depth, the
// words of the tombstones, the document title. No cssints, no Solid here.
import type { AppBskyFeedDefs } from "@atcute/bluesky";

import type { ThreadNode } from "../api.ts";
import { recordOf } from "../post/model.ts";

// Replies are shown this many levels deep (a reply to the focused post is level 1); what lies below is behind a button.
export const MAX_DEPTH = 3;

export interface Branch {
  node: ThreadNode;
  replies: Branch[];
  more?: { count: number; rest: ThreadNode[] }; // collapsed: how many posts, and the nodes to show when it opens
}

export const repliesOf = (n: ThreadNode) => (n.kind === "post" ? n.replies : []);
// every node of the subtrees, tombstones too: each of them is a row when the branch opens
export const countAll = (nodes: ThreadNode[]): number =>
  nodes.reduce((sum, n) => sum + 1 + countAll(repliesOf(n)), 0);

// Cut the replies at MAX_DEPTH levels. "Show more" starts a new tree from `rest` at level 1.
export function branches(nodes: ThreadNode[], depth = 1): Branch[] {
  return nodes.map((node) => {
    const kids = repliesOf(node);
    return depth < MAX_DEPTH
      ? { node, replies: branches(kids, depth + 1) }
      : {
          node,
          replies: [],
          more: kids.length ? { count: countAll(kids), rest: kids } : undefined,
        };
  });
}

export const moreLabel = (count: number) =>
  `Show ${count} more ${count === 1 ? "reply" : "replies"}`;

export const goneText = {
  blocked: "Blocked post",
  notFound: "Post deleted or not found",
  hidden: "Post hidden",
} as const;

// The document title: the opening of the post's text (one line, 80 characters), or its author when there is no text.
export function titleOf(p: AppBskyFeedDefs.PostView) {
  const text = (recordOf(p).text ?? "").replace(/\s+/g, " ").trim();
  if (!text) return `Post by ${p.author.displayName || `@${p.author.handle}`}`;
  return text.length > 80 ? `${text.slice(0, 79).trimEnd()}…` : text;
}
