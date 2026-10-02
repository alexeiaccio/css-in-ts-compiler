import { createMemo, Errored, For, Loading } from "solid-js";

import { homeScreen } from "../api.ts";
import { Feed } from "../post/Feed.tsx";
import { Post } from "../post/Post.tsx";
import { Header } from "../Shell.tsx";

// The first page of Discover; the home ticket adds tabs and paging.
export default function Home() {
  const page = createMemo(() => homeScreen());
  return (
    <>
      <Header title="Home" />
      <Errored
        fallback={(err, reset) => (
          <p>
            Could not load Discover: {String(err())} <button onClick={reset}>Retry</button>
          </p>
        )}
      >
        <Loading fallback={<p>Loading…</p>}>
          <Feed>
            <For each={page().items}>{(item) => <Post post={item.post} />}</For>
          </Feed>
        </Loading>
      </Errored>
    </>
  );
}
