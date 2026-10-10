// @atcute/client as apps/sky's api.ts sees it on the /tui page (plugin/tui.ts): the real client, with a fetch handler that
// answers from sky's recorded fixtures (apps/sky/test/fixtures), so the screen loads its feeds and threads with no request.
// A feed has one recorded page; a thread is the recorded one, or the post alone (its replies were not recorded).
import discover from "../../../sky/test/fixtures/home-discover-1.json";
import science from "../../../sky/test/fixtures/home-science-1.json";
import thread from "../../../sky/test/fixtures/thread.json";

export * from "@atcute/client";

type Post = { uri: string };
const posts = new Map<string, Post>();
for (const page of [discover, science])
  for (const item of page.feed as { post: Post }[]) posts.set(item.post.uri, item.post);

const answer = (method: string, params: URLSearchParams): unknown => {
  if (method === "app.bsky.feed.getFeed") {
    const feed = params.get("feed") ?? "";
    if (params.get("cursor")) return { feed: [] };
    if (feed.endsWith("/whats-hot")) return discover;
    if (feed.endsWith("/for-science")) return science;
    return { feed: [] };
  }
  if (method === "app.bsky.feed.getPostThread") {
    const uri = params.get("uri") ?? "";
    if (uri === thread.thread.post.uri) return thread;
    const post = posts.get(uri);
    if (post) return { thread: { $type: "app.bsky.feed.defs#threadViewPost", post, replies: [] } };
  }
  return undefined;
};

/**
 * The fixtures as a fetch handler: what `simpleFetchHandler({ service })` gives on this page.
 *
 * @returns {Function} the handler
 */
export const simpleFetchHandler =
  () =>
  (pathname: string): Promise<Response> => {
    const url = new URL(pathname, "https://public.api.bsky.app");
    const body = answer(url.pathname.replace("/xrpc/", ""), url.searchParams);
    return Promise.resolve(
      body === undefined
        ? new Response(JSON.stringify({ error: "NotFound", message: "not recorded" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          })
        : new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } }),
    );
  };
